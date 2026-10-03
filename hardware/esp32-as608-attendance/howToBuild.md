# Hardware build guide

## Parts

- ESP32 development board
- AS608 fingerprint sensor
- 128×64 I2C OLED at address `0x3C`
- DS3231 RTC module
- common-cathode RGB LED with suitable current-limiting resistors
- active or passive buzzer
- jumper wires, regulated power, and a shared ground

## Default wiring

| Part | ESP32 connection |
|---|---|
| AS608 TX | GPIO16 (RX2) |
| AS608 RX | GPIO17 (TX2) |
| AS608 VCC/GND | Module-rated supply / common ground |
| OLED SDA/SCL | GPIO21 / GPIO22 |
| DS3231 SDA/SCL | GPIO21 / GPIO22, shared I2C bus |
| RGB red | GPIO25 through resistor |
| RGB green | GPIO26 through resistor |
| RGB blue | GPIO27 through resistor |
| Buzzer signal | GPIO14 |

Change the constants in `src/main.cpp` if the final PCB uses different pins. Verify the voltage rating of the exact AS608 and OLED boards before powering them.

## Build and flash

1. Install PlatformIO and open `hardware/esp32-as608-attendance`.
2. Apply backend database migrations and start the backend.
3. Run `pio run --target upload`, then `pio device monitor --baud 115200`.
4. Connect a phone to the `Acadence-Setup-*` network shown on the OLED using the displayed password.
5. Open `http://192.168.4.1` and enter the target Wi-Fi, a LAN-reachable API URL ending in `/api`, and the 64-character device key.

Do not enter `localhost` as the server host: from the ESP32, that address refers to the ESP32 itself. Use the computer's local network IP address, for example `http://192.168.1.20:3000/api`.

To reopen setup later without clearing the stored configuration, connect by USB, open the 115200-baud serial monitor, enter `setup`, and press Enter. The OLED will display the setup network and password again.

## Commissioning

1. Register and authorize the device in the administrator interface.
2. Paste its one-time key into the ESP32 setup page and save the configuration.
3. Confirm that the device reports online, sensor-ready, capacity, firmware version, and `IDLE` mode.
4. Create a fingerprint enrollment job for a student and this device.
5. Follow the two-capture OLED prompts; the backend binding is created only after the sensor stores the model.
6. Open attendance using the same online idle device and verify a mapped fingerprint.
7. Close attendance and verify that the device returns to `IDLE`.

## Feedback language

- Blue: connected and idle, or ready for an attendance scan.
- Amber: processing or waiting for the second enrollment capture.
- Green plus one short beep: success.
- Red plus two short beeps: rejection or failure.
- Purple: Wi-Fi unavailable and reconnecting.

The backend timestamp is the official attendance time. The DS3231 supplies a supporting device timestamp after the ESP32 synchronizes it from NTP.
