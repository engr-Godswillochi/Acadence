# ESP32 AS608 attendance device

This firmware is the hardware adapter for Acadence fingerprint enrollment and attendance. The device authenticates outbound requests with its one-time device key, reports its health through heartbeats, and asks the backend for one piece of work at a time.

## Device modes

- `IDLE` — online and waiting for backend work.
- `ENROLLMENT` — capturing the same finger twice and storing the AS608 model in the backend-assigned slot.
- `ATTENDANCE` — matching locally and submitting the matched slot to the assigned attendance session.
- `ERROR` — sensor, credential, or backend confirmation failure.

The AS608 retains fingerprint templates and performs matching locally. Acadence receives only the authenticated device identity, assigned sensor slot, enrollment-job result, or attendance event. It never receives raw fingerprint images.

On first boot, the ESP32 creates a password-protected `Acadence-Setup-*` Wi-Fi network. The OLED shows its password and the setup address. Connect a phone to that network, open `http://192.168.4.1`, and enter the Wi-Fi, reachable API URL, and device key. The ESP32 validates and stores those values in its non-volatile storage, then restarts. Credentials are never printed to serial output.

If the configured Wi-Fi cannot be reached for 30 seconds, the device reopens provisioning so its network details can be repaired without reflashing it.

With physical USB access, sending `setup` followed by Enter over the 115200-baud serial monitor also opens the provisioning network. This does not erase the current configuration; saving the phone form replaces it.

See [howToBuild.md](./howToBuild.md) for wiring, commissioning, and feedback behavior.
