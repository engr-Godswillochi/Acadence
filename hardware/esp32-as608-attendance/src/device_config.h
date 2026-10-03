#pragma once

#include <Arduino.h>

struct DeviceConfig {
  String wifiSsid;
  String wifiPassword;
  String apiBaseUrl;
  String deviceApiKey;
};

class DeviceConfigStore {
 public:
  bool load(DeviceConfig& config);
  bool save(const DeviceConfig& config);
  String setupPassword();

  static bool normalizeAndValidate(DeviceConfig& config, String& error);

 private:
  static bool isHexKey(const String& value);
};
