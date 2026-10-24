#pragma once

enum class ConnectivityState {
  Connecting,
  NetworkUnavailable,
  WifiConnected,
  ServerUnavailable,
  FingerprintUnavailable,
  Ready
};

struct ConnectivityMessage {
  const char* heading;
  const char* detail;
};

ConnectivityMessage connectivityMessage(ConnectivityState state);
ConnectivityState idleConnectivityState(bool sensorReady);
