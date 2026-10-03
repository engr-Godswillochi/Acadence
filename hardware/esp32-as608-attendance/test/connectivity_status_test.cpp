#include <cassert>
#include <cstring>

#include "../src/connectivity_status.h"

int main() {
  const ConnectivityMessage connected = connectivityMessage(ConnectivityState::WifiConnected);
  assert(std::strcmp(connected.heading, "Wi-Fi connected") == 0);
  assert(std::strcmp(connected.detail, "Contacting server") == 0);

  const ConnectivityMessage unavailable = connectivityMessage(ConnectivityState::ServerUnavailable);
  assert(std::strcmp(unavailable.heading, "Server unavailable") == 0);
  assert(std::strcmp(unavailable.detail, "Check Acadence API") == 0);
  return 0;
}
