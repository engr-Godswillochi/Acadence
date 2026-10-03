#include "device_config.h"

#include <Preferences.h>

namespace {
constexpr char preferencesNamespace[] = "acadence";
constexpr char setupAlphabet[] = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
constexpr size_t setupPasswordLength = 12;

String trimTrailingSlashes(String value) {
  while (value.endsWith("/")) value.remove(value.length() - 1);
  return value;
}
}

bool DeviceConfigStore::load(DeviceConfig& config) {
  Preferences preferences;
  if (!preferences.begin(preferencesNamespace, true)) return false;
  config.wifiSsid = preferences.getString("ssid", "");
  config.wifiPassword = preferences.getString("wifiPass", "");
  config.apiBaseUrl = preferences.getString("apiUrl", "");
  config.deviceApiKey = preferences.getString("deviceKey", "");
  preferences.end();

  String error;
  return normalizeAndValidate(config, error);
}

bool DeviceConfigStore::save(const DeviceConfig& config) {
  Preferences preferences;
  if (!preferences.begin(preferencesNamespace, false)) return false;
  const bool saved =
    preferences.putString("ssid", config.wifiSsid) > 0 &&
    preferences.putString("wifiPass", config.wifiPassword) >= 0 &&
    preferences.putString("apiUrl", config.apiBaseUrl) > 0 &&
    preferences.putString("deviceKey", config.deviceApiKey) > 0;
  preferences.end();
  return saved;
}

String DeviceConfigStore::setupPassword() {
  Preferences preferences;
  if (!preferences.begin(preferencesNamespace, false)) return "Acadence2026";
  String password = preferences.getString("setupPass", "");
  if (password.length() != setupPasswordLength) {
    password.reserve(setupPasswordLength);
    for (size_t index = 0; index < setupPasswordLength; index += 1) {
      password += setupAlphabet[esp_random() % (sizeof(setupAlphabet) - 1)];
    }
    preferences.putString("setupPass", password);
  }
  preferences.end();
  return password;
}

bool DeviceConfigStore::normalizeAndValidate(DeviceConfig& config, String& error) {
  config.wifiSsid.trim();
  config.apiBaseUrl.trim();
  config.apiBaseUrl = trimTrailingSlashes(config.apiBaseUrl);
  config.deviceApiKey.trim();
  config.deviceApiKey.toLowerCase();

  if (config.wifiSsid.isEmpty() || config.wifiSsid.length() > 32) {
    error = "Enter a Wi-Fi name of 32 characters or fewer.";
    return false;
  }
  if (!config.wifiPassword.isEmpty() &&
      (config.wifiPassword.length() < 8 || config.wifiPassword.length() > 63)) {
    error = "The Wi-Fi password must be 8 to 63 characters, or blank for an open network.";
    return false;
  }
  if (config.apiBaseUrl.length() > 180 ||
      (!config.apiBaseUrl.startsWith("http://") && !config.apiBaseUrl.startsWith("https://")) ||
      !config.apiBaseUrl.endsWith("/api")) {
    error = "Enter a reachable server URL beginning with http:// or https:// and ending in /api.";
    return false;
  }
  if (!isHexKey(config.deviceApiKey)) {
    error = "The device key must contain exactly 64 hexadecimal characters.";
    return false;
  }
  return true;
}

bool DeviceConfigStore::isHexKey(const String& value) {
  if (value.length() != 64) return false;
  for (size_t index = 0; index < value.length(); index += 1) {
    const char character = value[index];
    if (!((character >= '0' && character <= '9') ||
          (character >= 'a' && character <= 'f') ||
          (character >= 'A' && character <= 'F'))) return false;
  }
  return true;
}
