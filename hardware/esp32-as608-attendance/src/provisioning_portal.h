#pragma once

#include <Arduino.h>
#include <DNSServer.h>
#include <WebServer.h>

#include "device_config.h"

class ProvisioningPortal {
 public:
  ProvisioningPortal();

  bool begin(DeviceConfigStore& store);
  void handle();
  bool active() const;
  const String& networkName() const;
  const String& networkPassword() const;

 private:
  void registerRoutes();
  void handleRoot();
  void handleSave();
  void redirectToRoot();
  String renderPage(const String& error = "") const;
  String makeNetworkName() const;

  DNSServer dnsServer_;
  WebServer server_;
  DeviceConfigStore* store_;
  String networkName_;
  String networkPassword_;
  bool active_;
};
