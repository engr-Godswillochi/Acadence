# Keep fingerprint matching on the attendance device

Acadence stores AS608 fingerprint templates and performs matching on the sensor, while PostgreSQL stores only the confirmed student, device, and sensor-slot association. We rejected ordinary fingerprint hashes because captures are not byte-stable, and rejected central matching for the prototype because it would require portable templates, a compatible server-side matcher, and a substantially larger biometric-data security boundary.
