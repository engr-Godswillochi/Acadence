#pragma once

enum class ConnectivityState {
  Connecting,
  NetworkUnavailable,
  WifiConnected,
  ServerUnavailable,
  Ready
};

struct ConnectivityMessage {
  const char* heading;
  const char* detail;
};

ConnectivityMessage connectivityMessage(ConnectivityState state);
