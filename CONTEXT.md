# Acadence

Acadence coordinates academic work and trusted physical attendance across people, courses, and campus devices.

## Biometric attendance language

**Device authorization**:
The administrator's permission for a registered attendance device to communicate with Acadence. Authorization is independent of whether the device is online or currently performing work.
_Avoid_: Active device, connected device

**Device mode**:
The single operational state reported by a device: offline, idle, enrolling, recording attendance, or error.
_Avoid_: Active, activated

**Enrollment job**:
An expiring instruction assigning one student and one sensor slot to one attendance device for fingerprint capture.
_Avoid_: Fingerprint mapping request, enrollment session

**Biometric profile**:
The confirmed association between a student and a fingerprint-template slot on a particular device.
_Avoid_: Fingerprint hash, fingerprint image

**Attendance session**:
A lecturer-controlled period during which one reserved device accepts fingerprint matches for a frozen course roster.
_Avoid_: Attendance job, active hardware
