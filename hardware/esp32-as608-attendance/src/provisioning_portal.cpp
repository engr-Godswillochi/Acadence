#include "provisioning_portal.h"

#include <WiFi.h>

namespace {
constexpr char pageStart[] PROGMEM = R"HTML(<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#173b99"><title>Set up Acadence device</title><style>
:root{color-scheme:light;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#14213d;background:#edf2f8}*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:24px 16px 40px;background:#edf2f8}.shell{width:min(100%,560px);margin:auto;background:#fff;border:1px solid #d8e0eb;border-radius:20px;overflow:hidden}.mast{padding:24px;background:#173b99;color:#fff}.brand{display:flex;align-items:center;gap:12px;font-weight:750}.mark{position:relative;width:30px;height:27px}.mark:before,.mark:after{content:"";position:absolute;bottom:0;width:7px;height:28px;background:#fff;border-radius:8px;transform-origin:bottom}.mark:before{left:4px;transform:rotate(26deg)}.mark:after{right:4px;transform:rotate(-26deg)}.mark i{position:absolute;z-index:1;left:5px;right:5px;top:15px;height:5px;background:#f2b544;border-radius:8px}.mast h1{margin:28px 0 8px;font-size:clamp(2.25rem,4vw,3.8rem);line-height:1.02;letter-spacing:-.05em}.mast p{margin:0;color:#e9efff;line-height:1.5}.form{padding:24px}.notice{margin:0 0 20px;padding:12px 14px;border:1px solid #b42318;border-radius:8px;background:#fff;color:#b42318;line-height:1.45}.group{margin-bottom:18px}label{display:block;margin-bottom:7px;font-size:.82rem;font-weight:700}input{width:100%;height:46px;padding:10px 12px;border:1px solid #b9c5d6;border-radius:8px;background:#fff;color:#14213d;font:inherit;outline:none}input:focus{border-color:#2146c7;box-shadow:0 0 0 3px #e9efff}.hint{display:block;margin-top:6px;color:#68758c;font-size:.82rem;line-height:1.45}.secret{position:relative}.secret input{padding-right:72px}.reveal{position:absolute;right:6px;top:5px;height:36px;padding:0 10px;border:0;background:#e9efff;color:#173b99;border-radius:8px;font-weight:700}.submit{width:100%;min-height:46px;margin-top:4px;border:0;border-radius:8px;background:#2146c7;color:#fff;font:inherit;font-weight:750}.submit:hover{background:#173b99}.submit:focus-visible,.reveal:focus-visible{outline:3px solid #f2b544;outline-offset:2px}.foot{padding:0 24px 24px;color:#68758c;font-size:.82rem;line-height:1.5}@media(min-width:620px){body{padding-top:48px}.mast,.form{padding:32px}.foot{padding:0 32px 32px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style></head><body><main class="shell"><header class="mast"><div class="brand"><span class="mark" aria-hidden="true"><i></i></span>Acadence</div><h1>Connect this device.</h1><p>Enter the network and device details it needs to reach Acadence.</p></header><form class="form" method="post" action="/save" autocomplete="off">)HTML";

constexpr char pageEnd[] PROGMEM = R"HTML(<div class="group"><label for="ssid">Wi-Fi name</label><input id="ssid" name="ssid" maxlength="32" required autocomplete="off" placeholder="Campus Wi-Fi"></div><div class="group"><label for="wifiPassword">Wi-Fi password</label><div class="secret"><input id="wifiPassword" name="wifiPassword" type="password" maxlength="63" autocomplete="new-password"><button class="reveal" type="button" data-for="wifiPassword">Show</button></div><small class="hint">Leave blank only when the network has no password.</small></div><div class="group"><label for="apiBaseUrl">Acadence server URL</label><input id="apiBaseUrl" name="apiBaseUrl" type="url" maxlength="180" required inputmode="url" autocapitalize="none" spellcheck="false" placeholder="http://192.168.1.20:3000/api"><small class="hint">Use the computer's local network address, not localhost. The URL must end in /api.</small></div><div class="group"><label for="deviceApiKey">Device key</label><div class="secret"><input id="deviceApiKey" name="deviceApiKey" type="password" minlength="64" maxlength="64" required autocomplete="new-password" autocapitalize="none" spellcheck="false"><button class="reveal" type="button" data-for="deviceApiKey">Show</button></div><small class="hint">Paste the 64-character key created for this device.</small></div><button class="submit" type="submit">Save and connect</button></form><p class="foot">Configuration is stored on this ESP32. The setup network closes after the device restarts.</p></main><script>document.querySelectorAll('.reveal').forEach(function(b){b.addEventListener('click',function(){var i=document.getElementById(b.dataset.for);var hidden=i.type==='password';i.type=hidden?'text':'password';b.textContent=hidden?'Hide':'Show'})});</script></body></html>)HTML";

constexpr char successPage[] PROGMEM = R"HTML(<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#173b99"><title>Configuration saved</title><style>:root{font-family:system-ui,-apple-system,sans-serif;color:#14213d;background:#edf2f8}body{display:grid;min-height:100vh;margin:0;padding:24px;place-items:center}.panel{max-width:500px;padding:32px;background:#fff;border:1px solid #d8e0eb;border-radius:20px}.signal{width:40px;height:5px;background:#16794a;border-radius:8px}h1{margin:24px 0 10px;font-size:1.4rem;letter-spacing:-.035em}p{margin:0;color:#68758c;line-height:1.6}</style></head><body><main class="panel"><div class="signal"></div><h1>Configuration saved.</h1><p>The device is restarting and will connect to the selected network. You can close this page.</p></main></body></html>)HTML";

String escapeHtml(String value) {
  value.replace("&", "&amp;");
  value.replace("<", "&lt;");
  value.replace(">", "&gt;");
  value.replace("\"", "&quot;");
  value.replace("'", "&#39;");
  return value;
}
}

ProvisioningPortal::ProvisioningPortal()
  : server_(80), store_(nullptr), active_(false) {}

bool ProvisioningPortal::begin(DeviceConfigStore& store) {
  if (active_) return true;
  store_ = &store;
  networkName_ = makeNetworkName();
  networkPassword_ = store.setupPassword();
  WiFi.disconnect(true);
  delay(200);
  WiFi.mode(WIFI_OFF);
  delay(200);
  WiFi.mode(WIFI_AP);
  delay(200);
  if (!WiFi.softAP(networkName_.c_str(), networkPassword_.c_str())) return false;
  dnsServer_.start(53, "*", WiFi.softAPIP());
  registerRoutes();
  server_.begin();
  active_ = true;
  return true;
}

void ProvisioningPortal::handle() {
  if (!active_) return;
  dnsServer_.processNextRequest();
  server_.handleClient();
}

bool ProvisioningPortal::active() const { return active_; }
const String& ProvisioningPortal::networkName() const { return networkName_; }
const String& ProvisioningPortal::networkPassword() const { return networkPassword_; }

void ProvisioningPortal::registerRoutes() {
  server_.on("/", HTTP_GET, [this]() { handleRoot(); });
  server_.on("/save", HTTP_POST, [this]() { handleSave(); });
  server_.on("/generate_204", HTTP_ANY, [this]() { redirectToRoot(); });
  server_.on("/hotspot-detect.html", HTTP_ANY, [this]() { redirectToRoot(); });
  server_.on("/connecttest.txt", HTTP_ANY, [this]() { redirectToRoot(); });
  server_.on("/ncsi.txt", HTTP_ANY, [this]() { redirectToRoot(); });
  server_.onNotFound([this]() { redirectToRoot(); });
}

void ProvisioningPortal::handleRoot() {
  server_.send(200, "text/html; charset=utf-8", renderPage());
}

void ProvisioningPortal::handleSave() {
  DeviceConfig config{
    server_.arg("ssid"),
    server_.arg("wifiPassword"),
    server_.arg("apiBaseUrl"),
    server_.arg("deviceApiKey")
  };
  String error;
  if (!DeviceConfigStore::normalizeAndValidate(config, error)) {
    server_.send(400, "text/html; charset=utf-8", renderPage(error));
    return;
  }
  if (store_ == nullptr || !store_->save(config)) {
    server_.send(500, "text/html; charset=utf-8", renderPage("The device could not save these details. Please try again."));
    return;
  }
  server_.send_P(200, "text/html; charset=utf-8", successPage);
  delay(800);
  ESP.restart();
}

void ProvisioningPortal::redirectToRoot() {
  server_.sendHeader("Location", String("http://") + WiFi.softAPIP().toString(), true);
  server_.send(302, "text/plain", "");
}

String ProvisioningPortal::renderPage(const String& error) const {
  String page;
  page.reserve(strlen_P(pageStart) + strlen_P(pageEnd) + error.length() + 160);
  page += FPSTR(pageStart);
  if (!error.isEmpty()) page += "<p class=\"notice\" role=\"alert\">" + escapeHtml(error) + "</p>";
  page += FPSTR(pageEnd);
  return page;
}

String ProvisioningPortal::makeNetworkName() const {
  const uint64_t chipId = ESP.getEfuseMac();
  char suffix[7];
  snprintf(suffix, sizeof(suffix), "%06llX", static_cast<unsigned long long>(chipId & 0xFFFFFF));
  return String("Acadence-Setup-") + suffix;
}
