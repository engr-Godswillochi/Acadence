#include "connectivity_status.h"

ConnectivityMessage connectivityMessage(ConnectivityState state) {
  switch (state) {
    case ConnectivityState::Connecting:
      return {"Connecting", "Joining Wi-Fi"};
    case ConnectivityState::NetworkUnavailable:
      return {"Network unavailable", "Reconnecting..."};
    case ConnectivityState::WifiConnected:
      return {"Wi-Fi connected", "Contacting server"};
    case ConnectivityState::ServerUnavailable:
      return {"Server unavailable", "Check Acadence API"};
    case ConnectivityState::FingerprintUnavailable:
      return {"Fingerprint error", "Check sensor wiring"};
    case ConnectivityState::Ready:
      return {"Device ready", "Waiting for work"};
  }
  return {"Device error", "Restart device"};
}

ConnectivityState idleConnectivityState(bool sensorReady) {
  return sensorReady ? ConnectivityState::Ready : ConnectivityState::FingerprintUnavailable;
}
