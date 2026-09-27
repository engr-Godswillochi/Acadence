#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_SSD1306.h>
#include <RTClib.h>
#include "secrets.h"

namespace Hardware {
constexpr uint8_t fingerprintRx = 16;
constexpr uint8_t fingerprintTx = 17;
constexpr uint8_t buzzer = 14;
constexpr uint8_t ledRed = 25;
constexpr uint8_t ledGreen = 26;
constexpr uint8_t ledBlue = 27;
constexpr uint8_t oledAddress = 0x3C;
constexpr uint32_t fingerprintBaud = 57600;
constexpr char firmwareVersion[] = "1.0.0";
}

enum class DeviceMode { Idle, Enrollment, Attendance, Error };
enum class EnrollmentStage { None, FirstCapture, RemoveFinger, SecondCapture };

HardwareSerial sensorSerial(2);
Adafruit_Fingerprint finger(&sensorSerial);
Adafruit_SSD1306 oled(128, 64, &Wire, -1);
RTC_DS3231 rtc;

DeviceMode mode = DeviceMode::Error;
EnrollmentStage enrollmentStage = EnrollmentStage::None;
String enrollmentJobId;
String attendanceSessionId;
String attendanceCourseCode;
uint16_t enrollmentSlot = 0;
bool sensorReady = false;
bool rtcReady = false;
bool clockSynchronized = false;
unsigned long nextWifiAttempt = 0;
unsigned long nextHeartbeat = 0;
unsigned long nextWorkPoll = 0;
unsigned long nextScan = 0;

bool due(unsigned long now, unsigned long deadline) {
  return static_cast<long>(now - deadline) >= 0;
}

const char* modeName() {
  switch (mode) {
    case DeviceMode::Idle: return "IDLE";
    case DeviceMode::Enrollment: return "ENROLLMENT";
    case DeviceMode::Attendance: return "ATTENDANCE";
    case DeviceMode::Error: return "ERROR";
  }
  return "ERROR";
}

void setRgb(bool red, bool green, bool blue) {
  digitalWrite(Hardware::ledRed, red ? HIGH : LOW);
  digitalWrite(Hardware::ledGreen, green ? HIGH : LOW);
  digitalWrite(Hardware::ledBlue, blue ? HIGH : LOW);
}

void show(const String& heading, const String& detail = "") {
  static String previousHeading;
  static String previousDetail;
  if (heading == previousHeading && detail == previousDetail) return;
  previousHeading = heading;
  previousDetail = detail;
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(0, 0);
  oled.println(heading);
  if (detail.length()) {
    oled.setCursor(0, 18);
    oled.println(detail);
  }
  oled.display();
}

void successFeedback(const String& heading, const String& detail = "") {
  setRgb(false, true, false);
  show(heading, detail);
  tone(Hardware::buzzer, 1900, 140);
}

void failureFeedback(const String& heading, const String& detail = "") {
  setRgb(true, false, false);
  show(heading, detail);
  tone(Hardware::buzzer, 650, 110);
  delay(160);
  tone(Hardware::buzzer, 650, 110);
}

void addDeviceHeaders(HTTPClient& http) {
  http.addHeader("X-Device-Key", DEVICE_API_KEY);
  http.addHeader("Content-Type", "application/json");
}

int apiRequest(const String& method, const String& path, const String& body, DynamicJsonDocument& response) {
  HTTPClient http;
  http.setConnectTimeout(4000);
  http.setTimeout(5000);
  http.begin(String(API_BASE_URL) + path);
  addDeviceHeaders(http);
  int status = method == "GET" ? http.GET() : http.POST(body);
  const String payload = http.getString();
  if (payload.length()) deserializeJson(response, payload);
  http.end();
  return status;
}

String deviceTimestamp() {
  if (!rtcReady || !clockSynchronized) return "";
  const DateTime now = rtc.now();
  char value[25];
  snprintf(value, sizeof(value), "%04d-%02d-%02dT%02d:%02d:%02dZ",
    now.year(), now.month(), now.day(), now.hour(), now.minute(), now.second());
  return String(value);
}

void synchronizeClock() {
  if (!rtcReady || clockSynchronized || WiFi.status() != WL_CONNECTED) return;
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 3000)) return;
  time_t epoch = mktime(&timeInfo);
  rtc.adjust(DateTime(static_cast<uint32_t>(epoch)));
  clockSynchronized = true;
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    synchronizeClock();
    return true;
  }
  const unsigned long now = millis();
  if (due(now, nextWifiAttempt)) {
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    nextWifiAttempt = now + 10000;
  }
  setRgb(true, false, true);
  show("Network unavailable", "Reconnecting...");
  return false;
}

void sendHeartbeat() {
  DynamicJsonDocument body(256);
  body["mode"] = modeName();
  body["firmwareVersion"] = Hardware::firmwareVersion;
  body["sensorReady"] = sensorReady;
  if (sensorReady) body["sensorCapacity"] = finger.capacity;
  String payload;
  serializeJson(body, payload);
  DynamicJsonDocument response(256);
  apiRequest("POST", "/device/heartbeat", payload, response);
}

void clearEnrollment() {
  enrollmentJobId = "";
  enrollmentSlot = 0;
  enrollmentStage = EnrollmentStage::None;
}

void reportEnrollmentFailure(const String& code) {
  if (enrollmentJobId.length()) {
    DynamicJsonDocument body(128);
    body["code"] = code;
    String payload;
    serializeJson(body, payload);
    DynamicJsonDocument response(256);
    apiRequest("POST", "/device/biometric-enrolments/" + enrollmentJobId + "/fail", payload, response);
  }
  failureFeedback("Enrollment failed", "Please try again");
  clearEnrollment();
  mode = DeviceMode::Error;
}

bool completeEnrollment() {
  DynamicJsonDocument response(768);
  const int status = apiRequest(
    "POST",
    "/device/biometric-enrolments/" + enrollmentJobId + "/complete",
    "{}",
    response
  );
  if (status != 200) return false;
  successFeedback("Fingerprint saved", "Enrollment complete");
  clearEnrollment();
  mode = DeviceMode::Idle;
  nextWorkPoll = millis() + 1500;
  return true;
}

void beginEnrollment(const JsonObjectConst& enrollment) {
  const String jobId = enrollment["jobId"].as<String>();
  if (mode == DeviceMode::Enrollment && jobId == enrollmentJobId) return;
  attendanceSessionId = "";
  attendanceCourseCode = "";
  enrollmentJobId = jobId;
  enrollmentSlot = enrollment["sensorSlotId"].as<uint16_t>();
  enrollmentStage = EnrollmentStage::FirstCapture;
  mode = DeviceMode::Enrollment;
  setRgb(true, true, false);
  show("Enroll fingerprint", "Place finger");
}

void applyWork(const JsonObjectConst& work) {
  const String requestedMode = work["mode"].as<String>();
  if (requestedMode == "ENROLLMENT") {
    beginEnrollment(work["enrollment"].as<JsonObjectConst>());
    return;
  }
  if (mode == DeviceMode::Enrollment) clearEnrollment();
  if (requestedMode == "ATTENDANCE") {
    mode = DeviceMode::Attendance;
    attendanceSessionId = work["session"]["sessionId"].as<String>();
    attendanceCourseCode = work["session"]["courseCode"].as<String>();
    setRgb(false, false, true);
    show("Attendance open", attendanceCourseCode + " - place finger");
    return;
  }
  attendanceSessionId = "";
  attendanceCourseCode = "";
  mode = DeviceMode::Idle;
  setRgb(false, false, true);
  show("Device ready", "Waiting for work");
}

void pollWork() {
  DynamicJsonDocument response(1536);
  const int status = apiRequest("GET", "/device/work", "", response);
  if (status == 200 && !response["data"]["work"].isNull()) {
    applyWork(response["data"]["work"].as<JsonObjectConst>());
  } else if (status == 401) {
    mode = DeviceMode::Error;
    failureFeedback("Device disabled", "Contact administrator");
  }
}

void processEnrollment() {
  if (!sensorReady || enrollmentStage == EnrollmentStage::None) return;
  const uint8_t image = finger.getImage();
  if (image == FINGERPRINT_NOFINGER) {
    if (enrollmentStage == EnrollmentStage::RemoveFinger) {
      enrollmentStage = EnrollmentStage::SecondCapture;
      show("Enroll fingerprint", "Place same finger again");
    }
    return;
  }
  if (image != FINGERPRINT_OK) {
    if (image != FINGERPRINT_PACKETRECIEVEERR) return;
    reportEnrollmentFailure("SENSOR_COMMUNICATION_ERROR");
    return;
  }

  if (enrollmentStage == EnrollmentStage::FirstCapture) {
    if (finger.image2Tz(1) != FINGERPRINT_OK) {
      reportEnrollmentFailure("FIRST_CAPTURE_INVALID");
      return;
    }
    enrollmentStage = EnrollmentStage::RemoveFinger;
    setRgb(true, true, false);
    show("First scan saved", "Remove finger");
    return;
  }

  if (enrollmentStage != EnrollmentStage::SecondCapture) return;
  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    reportEnrollmentFailure("SECOND_CAPTURE_INVALID");
    return;
  }
  if (finger.createModel() != FINGERPRINT_OK) {
    reportEnrollmentFailure("FINGERPRINTS_DID_NOT_MATCH");
    return;
  }
  if (finger.storeModel(enrollmentSlot) != FINGERPRINT_OK) {
    reportEnrollmentFailure("SENSOR_STORE_FAILED");
    return;
  }
  if (!completeEnrollment()) {
    finger.deleteModel(enrollmentSlot);
    reportEnrollmentFailure("BACKEND_CONFIRMATION_FAILED");
  }
}

String newEventId() {
  char value[17];
  snprintf(value, sizeof(value), "%08lx%08lx",
    static_cast<unsigned long>(esp_random()), static_cast<unsigned long>(esp_random()));
  return String(value);
}

void recordAttendance(uint16_t slot) {
  DynamicJsonDocument body(384);
  body["sessionId"] = attendanceSessionId;
  body["sensorSlotId"] = slot;
  body["eventId"] = newEventId();
  const String timestamp = deviceTimestamp();
  if (timestamp.length()) body["deviceTimestamp"] = timestamp;
  String payload;
  serializeJson(body, payload);

  DynamicJsonDocument response(1024);
  const int status = apiRequest("POST", "/device/attendance", payload, response);
  if (status == 201) {
    successFeedback("Attendance recorded", response["data"]["attendance"]["studentName"].as<String>());
  } else {
    const String code = response["error"]["code"].as<String>();
    if (code == "ATTENDANCE_ALREADY_RECORDED") failureFeedback("Already recorded");
    else if (code == "STUDENT_NOT_ENROLLED") failureFeedback("Not enrolled");
    else if (code == "NO_ACTIVE_SESSION") failureFeedback("Session closed");
    else failureFeedback("Attendance failed", "Please try again");
  }
  delay(900);
  if (mode == DeviceMode::Attendance) {
    setRgb(false, false, true);
    show("Attendance open", attendanceCourseCode + " - place finger");
  }
}

void scanAttendance() {
  if (!sensorReady || !attendanceSessionId.length()) return;
  if (finger.getImage() != FINGERPRINT_OK) return;
  setRgb(true, true, false);
  show("Reading fingerprint", "Please wait");
  if (finger.image2Tz() == FINGERPRINT_OK && finger.fingerFastSearch() == FINGERPRINT_OK) {
    recordAttendance(finger.fingerID);
  } else {
    failureFeedback("Fingerprint unknown", "Try another finger");
    delay(700);
    setRgb(false, false, true);
    show("Attendance open", attendanceCourseCode + " - place finger");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(Hardware::buzzer, OUTPUT);
  pinMode(Hardware::ledRed, OUTPUT);
  pinMode(Hardware::ledGreen, OUTPUT);
  pinMode(Hardware::ledBlue, OUTPUT);
  setRgb(true, true, false);

  Wire.begin();
  oled.begin(SSD1306_SWITCHCAPVCC, Hardware::oledAddress);
  show("Acadence device", "Starting...");
  rtcReady = rtc.begin();

  sensorSerial.begin(Hardware::fingerprintBaud, SERIAL_8N1, Hardware::fingerprintRx, Hardware::fingerprintTx);
  finger.begin(Hardware::fingerprintBaud);
  sensorReady = finger.verifyPassword();
  if (sensorReady) finger.getParameters();
  if (!sensorReady) {
    mode = DeviceMode::Error;
    failureFeedback("Fingerprint error", "Check sensor wiring");
  } else {
    mode = DeviceMode::Idle;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void loop() {
  const unsigned long now = millis();
  if (!ensureWifi()) {
    delay(100);
    return;
  }

  if (due(now, nextHeartbeat)) {
    sendHeartbeat();
    nextHeartbeat = now + 30000;
  }
  if (due(now, nextWorkPoll)) {
    pollWork();
    nextWorkPoll = now + 1500;
  }
  if (mode == DeviceMode::Enrollment) {
    processEnrollment();
  } else if (mode == DeviceMode::Attendance && due(now, nextScan)) {
    scanAttendance();
    nextScan = now + 120;
  }
  delay(20);
}
