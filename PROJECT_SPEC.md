# Project Specification — Academic Collaboration, Productivity, and Biometric Attendance Management System

> **Purpose of this document:** This is the revised technical and academic specification for the final-year project after removing all Artificial Intelligence and Machine Learning components. It is intended to serve as the implementation source of truth for the software, biometric hardware integration, testing, and the writing of Chapters 4 and 5.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Full title** | Design and Implementation of an Academic Collaboration, Productivity, and Biometric Attendance Management System |
| **Type** | Final-year undergraduate Computer Science project |
| **Institution context** | Nigerian university |
| **Referencing style** | APA 7th edition |
| **Design methodology** | Object-Oriented Analysis and Design Methodology (OOADM) with UML |
| **System type** | Full-stack web application with biometric hardware integration |

### 1.1 Revised Project Direction

The project no longer contains any Artificial Intelligence or Machine Learning functionality.

The following concepts have been removed completely:

- Random Forest prediction
- scikit-learn
- Flask ML microservice
- deadline-miss prediction
- student risk prediction
- AI-generated study schedules
- behavioral feature vectors
- model training and retraining
- synthetic ML datasets
- prediction result tables
- predictive model tables
- model accuracy, precision, recall, and F1-score evaluation
- AI or ML claims in the project objectives, implementation, contribution, testing, and conclusion

The revised project focuses on:

1. academic communication,
2. assignment and task management,
3. class scheduling,
4. biometric attendance,
5. real-time notifications,
6. attendance and task analytics,
7. role-based academic management.

---

## 2. Problem Being Solved

The project addresses practical academic-management problems common in university environments.

### 2.1 Fragmented Academic Communication

Lecturers frequently communicate assignment information, schedule changes, and announcements through informal channels such as WhatsApp groups, verbal announcements, and notice boards.

This can lead to:

- missed announcements,
- inconsistent information,
- difficulty locating old messages,
- students receiving updates late,
- lack of a centralized academic record.

### 2.2 Manual and Fraud-Prone Attendance

Traditional paper attendance registers are:

- slow to complete,
- prone to human error,
- difficult to analyze,
- easy to manipulate through proxy attendance,
- inconvenient to archive and retrieve.

### 2.3 Poor Student Task Organization

Students often manage assignments from different courses using memory, chat messages, handwritten notes, or multiple unrelated applications.

This creates difficulty in:

- seeing all pending academic tasks in one place,
- identifying approaching deadlines,
- tracking completed tasks,
- organizing work by urgency,
- viewing assignments alongside class schedules.

### 2.4 Disconnected Academic Records

Attendance, class schedules, assignments, and lecturer announcements are usually managed separately.

The system therefore provides one platform where students and lecturers can access these academic activities through a unified interface.

---

## 3. Project Aim

To design and implement a web-based academic collaboration and productivity management platform integrated with a fingerprint-based biometric attendance system for improving academic communication, task organization, class scheduling, and attendance management.

---

## 4. Project Objectives

The system shall:

1. provide a centralized platform where lecturers can create courses, publish assignments, send announcements, and manage class schedules;
2. provide students with a unified dashboard for viewing assignments, deadlines, course schedules, announcements, and attendance records;
3. implement a biometric attendance system using an ESP32 microcontroller and fingerprint sensor to reduce proxy attendance;
4. allow lecturers to open and close attendance sessions and view attendance records in real time;
5. provide automatic task ordering using transparent rule-based priority calculations based on deadline, difficulty, and course credit units;
6. provide real-time in-app notifications when relevant academic events occur;
7. provide attendance and assignment statistics that help lecturers and students monitor academic activity.

---

## 5. System Users and Roles

The system has three primary roles.

### 5.1 Lecturer

A lecturer can:

- register and log in;
- create and manage courses;
- view students enrolled in a course;
- enrol or remove students;
- create assignments;
- edit or delete assignments where permitted;
- publish announcements;
- create and update class schedules;
- open attendance sessions;
- monitor live attendance;
- close attendance sessions;
- view attendance reports;
- view basic course analytics.

### 5.2 Student

A student can:

- register and log in;
- view enrolled courses;
- view assignments;
- view pending, completed, and overdue tasks;
- mark personal assignment tasks as completed;
- view announcements;
- view class schedules;
- view an academic calendar;
- view attendance history and percentages;
- receive real-time notifications.

### 5.3 Device Administrator

A device administrator can:

- register biometric devices;
- manage device credentials;
- enrol student fingerprints;
- assign fingerprint sensor slot IDs to student accounts;
- remove biometric enrolments;
- test device connectivity.

---

## 6. Core System Capabilities

| Layer | Responsibility |
|---|---|
| **Communication layer** | Lecturers publish assignments and announcements; students receive updates and notifications |
| **Course management layer** | Lecturers create courses and manage student enrolment |
| **Productivity layer** | Students view pending/completed tasks and receive deterministic task-priority ordering |
| **Calendar layer** | Lecturer-created class schedules appear automatically in student calendars |
| **Biometric attendance layer** | Fingerprint device verifies students and submits attendance records to the backend |
| **Notification layer** | Server-Sent Events push academic updates to connected students |
| **Analytics layer** | Calculates attendance percentages, submission/completion statistics, and simple course activity summaries |

---

## 7. Scope of the System

### 7.1 Included

The implementation includes:

- user authentication;
- role-based authorization;
- lecturer dashboard;
- student dashboard;
- administrator/device management interface;
- course management;
- student enrolment;
- assignment management;
- personal assignment completion tracking;
- announcement management;
- class schedules;
- student calendar;
- biometric fingerprint enrolment;
- attendance sessions;
- live attendance register;
- attendance history;
- notification system;
- basic productivity metrics;
- basic lecturer analytics;
- REST API;
- PostgreSQL database;
- ESP32-to-backend integration.

### 7.2 Explicitly Excluded

The current project does not include:

- Artificial Intelligence;
- Machine Learning;
- predictive analytics;
- automatic student-risk prediction;
- generative AI;
- chatbots;
- NLP;
- recommendation models;
- adaptive learning algorithms;
- model training or retraining;
- facial recognition;
- payment systems;
- full institutional ERP functionality.

---

## 8. Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | React.js |
| **Frontend routing** | React Router |
| **Frontend state** | Context API |
| **HTTP client** | Axios or native Fetch API |
| **Backend** | Node.js + Express.js |
| **API style** | RESTful API |
| **Database** | PostgreSQL |
| **Authentication** | JWT |
| **Password hashing** | bcrypt |
| **Real-time browser notifications** | Server-Sent Events (SSE) |
| **Hardware MCU** | ESP32 |
| **Fingerprint sensor** | AS608 fingerprint sensor |
| **Hardware display** | 128×64 I2C OLED |
| **Firmware environment** | Arduino IDE or PlatformIO |
| **Version control** | Git + GitHub |

No Python service is required by the revised architecture.

---

## 9. High-Level System Architecture

The system uses a three-tier software architecture with an additional biometric hardware layer.

```text
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│                                                             │
│  React.js Single Page Application                          │
│  ├── Lecturer Interface                                    │
│  ├── Student Interface                                     │
│  └── Device Administrator Interface                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTPS / REST + SSE
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│                                                             │
│  Node.js + Express.js                                      │
│  ├── Authentication Module                                 │
│  ├── Role-Based Access Control                             │
│  ├── Course Module                                         │
│  ├── Enrolment Module                                      │
│  ├── Assignment Module                                     │
│  ├── Announcement Module                                   │
│  ├── Schedule Module                                       │
│  ├── Attendance Session Module                             │
│  ├── Attendance Record Module                              │
│  ├── Biometric Device Module                               │
│  ├── Notification Module                                   │
│  ├── Task Priority Service                                 │
│  └── Analytics Service                                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ SQL
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                          │
│                                                             │
│                      PostgreSQL                            │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │
                             │ HTTPS / REST over Wi-Fi
                             │ Device API Key
┌────────────────────────────┴────────────────────────────────┐
│                     HARDWARE LAYER                          │
│                                                             │
│  ESP32 + AS608 + OLED                                      │
│  ├── Connects to Wi-Fi                                     │
│  ├── Checks for active attendance session                  │
│  ├── Captures fingerprint                                  │
│  ├── Performs fingerprint matching on sensor/device        │
│  └── Sends verified attendance to backend                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Database Design

All major application entities use UUID primary keys unless a hardware-specific integer identifier is required.

Foreign keys shall be used to preserve referential integrity.

---

### 10.1 `users`

| Column | Type | Notes |
|---|---|---|
| user_id | UUID PK | generated by backend/database |
| full_name | VARCHAR | required |
| email | VARCHAR | unique |
| password_hash | VARCHAR | bcrypt hash |
| role | ENUM | LECTURER, STUDENT, ADMIN |
| matric_number | VARCHAR | nullable, unique for students |
| staff_number | VARCHAR | nullable, unique for lecturers |
| created_at | TIMESTAMP | default current time |
| updated_at | TIMESTAMP | |

---

### 10.2 `courses`

| Column | Type | Notes |
|---|---|---|
| course_id | UUID PK | |
| course_code | VARCHAR | e.g. CSC401 |
| course_title | VARCHAR | |
| credit_units | INTEGER | e.g. 1–6 |
| lecturer_id | UUID FK | → users.user_id |
| academic_session | VARCHAR | e.g. 2026/2027 |
| semester | ENUM | FIRST, SECOND |
| created_at | TIMESTAMP | |

Recommended constraint:

```text
UNIQUE(course_code, academic_session, semester)
```

Courses also include nullable `archived_at` (TIMESTAMPTZ). DELETE archives a course,
preserving its records and the unique course/session/semester identity. Archived courses
are excluded from active lists and reject normal detail and mutation requests.
Credit units are constrained to integers from 1 to 6; academic sessions use consecutive
years in YYYY/YYYY format. Lecturer ownership is checked on every management operation.

---

### 10.3 `enrolments`

| Column | Type | Notes |
|---|---|---|
| enrolment_id | UUID PK | |
| course_id | UUID FK | → courses |
| student_id | UUID FK | → users |
| enrolled_at | TIMESTAMP | |

Constraint:

```text
UNIQUE(course_id, student_id)
```

---

### 10.4 `schedules`

| Column | Type | Notes |
|---|---|---|
| schedule_id | UUID PK | |
| course_id | UUID FK | → courses |
| day_of_week | ENUM/VARCHAR | Monday–Sunday |
| start_time | TIME | |
| end_time | TIME | |
| venue | VARCHAR | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

Validation:

```text
start_time < end_time
```

---

### 10.5 `assignments`

| Column | Type | Notes |
|---|---|---|
| assignment_id | UUID PK | |
| course_id | UUID FK | → courses |
| title | VARCHAR | |
| description | TEXT | |
| deadline | TIMESTAMP | |
| difficulty_rating | INTEGER | 1–5 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

Important design decision:

`priority_score` is **not stored permanently** in this table because priority depends on the individual student's current pending-task set and changes as deadlines approach. It is calculated dynamically when a student's task list is requested.

Assignments include nullable `deleted_at` (TIMESTAMPTZ). Deletion removes an assignment
from active views while retaining its completion records. Creation requires a future
deadline; edits may retain or correct historical deadlines. Partial edits preserve omitted
fields. Completion records are created lazily, and repeating COMPLETED preserves the
original completion timestamp. Marking PENDING clears that timestamp.

---

### 10.6 `student_assignment_status`

This table replaces the previous use of behavioral logs for determining whether an individual student has completed an assignment.

| Column | Type | Notes |
|---|---|---|
| status_id | UUID PK | |
| assignment_id | UUID FK | → assignments |
| student_id | UUID FK | → users |
| status | ENUM | PENDING, COMPLETED |
| completed_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

Constraint:

```text
UNIQUE(assignment_id, student_id)
```

A record may be created when the assignment is published or lazily when the student first interacts with the assignment.

---

### 10.7 `announcements`

| Column | Type | Notes |
|---|---|---|
| announcement_id | UUID PK | |
| course_id | UUID FK | → courses |
| lecturer_id | UUID FK | → users |
| title | VARCHAR | |
| message | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 10.8 `attendance_sessions`

| Column | Type | Notes |
|---|---|---|
| session_id | UUID PK | |
| course_id | UUID FK | → courses |
| schedule_id | UUID FK | → schedules, nullable |
| opened_by | UUID FK | → users |
| opened_at | TIMESTAMP | |
| closed_at | TIMESTAMP | nullable |
| status | ENUM | ACTIVE, CLOSED |
| expires_at | TIMESTAMP | nullable |

Business rule:

A course should normally have at most one active attendance session at a time.

---

### 10.9 `attendance_records`

| Column | Type | Notes |
|---|---|---|
| record_id | UUID PK | |
| session_id | UUID FK | → attendance_sessions |
| student_id | UUID FK | → users |
| device_id | UUID FK | → biometric_devices |
| recorded_at | TIMESTAMP | |
| verification_method | VARCHAR | FINGERPRINT |

Constraint:

```text
UNIQUE(session_id, student_id)
```

This prevents duplicate attendance within the same session.

Recommended indexes:

```text
INDEX(session_id)
INDEX(student_id)
INDEX(recorded_at)
```

---

### 10.10 `biometric_devices`

| Column | Type | Notes |
|---|---|---|
| device_id | UUID PK | |
| device_name | VARCHAR | |
| api_key_hash | VARCHAR | never store raw API key |
| location | VARCHAR | optional |
| is_active | BOOLEAN | default true |
| last_seen_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

---

### 10.11 `biometric_profiles`

The AS608 uses integer template slots. Therefore, the fingerprint template slot must be mapped to the student's UUID in the platform database.

| Column | Type | Notes |
|---|---|---|
| biometric_profile_id | UUID PK | |
| student_id | UUID FK | → users |
| device_id | UUID FK | → biometric_devices |
| sensor_slot_id | INTEGER | AS608 template position |
| enrolled_at | TIMESTAMP | |
| is_active | BOOLEAN | |

Constraints:

```text
UNIQUE(device_id, sensor_slot_id)
UNIQUE(device_id, student_id)
```

The platform stores the mapping only.

Raw fingerprint images are not stored by the application.

---

### 10.12 `notifications`

| Column | Type | Notes |
|---|---|---|
| notification_id | UUID PK | |
| recipient_id | UUID FK | → users |
| type | VARCHAR | |
| title | VARCHAR | |
| message | TEXT | |
| related_entity_id | UUID | nullable |
| is_read | BOOLEAN | default false |
| created_at | TIMESTAMP | |

Suggested notification types:

- NEW_ASSIGNMENT
- ASSIGNMENT_UPDATED
- ANNOUNCEMENT
- SCHEDULE_CREATED
- SCHEDULE_CHANGED
- ATTENDANCE_RECORDED
- ATTENDANCE_WARNING
- COURSE_ENROLMENT

---

## 11. Entity Relationships

Main relationships:

```text
Lecturer 1 ─── * Course

Course 1 ─── * Enrolment
Student 1 ─── * Enrolment

Course 1 ─── * Assignment
Assignment 1 ─── * StudentAssignmentStatus
Student 1 ─── * StudentAssignmentStatus

Course 1 ─── * Announcement

Course 1 ─── * Schedule

Course 1 ─── * AttendanceSession
AttendanceSession 1 ─── * AttendanceRecord
Student 1 ─── * AttendanceRecord

BiometricDevice 1 ─── * BiometricProfile
Student 1 ─── * BiometricProfile

User 1 ─── * Notification
```

---

## 12. REST API Specification

All protected user routes require a valid JWT.

Public prototype registration accepts STUDENT and LECTURER only. ADMIN accounts cannot
be created through the public endpoint. An institutional deployment must add authorized
lecturer provisioning before opening registration to the public.

Authentication successes use `{ success: true, data: { accessToken, user } }`; the current
user endpoint returns `{ success: true, data: { user } }`. Passwords require at least eight
characters and at most 72 UTF-8 bytes. Email addresses are normalized to lowercase and
academic identifiers to uppercase. Authentication attempts are limited to 20 per IP per
15 minutes across login and registration. Validation errors may include an `error.details`
array of field/message objects. JWTs use HS256 with a configured expiry (24h by default).

Device routes require a valid device API key.

---

### 12.1 Authentication

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/auth/register` | Register account | Public |
| POST | `/api/auth/login` | Login and return JWT | Public |
| GET | `/api/auth/me` | Get authenticated user | Any authenticated user |

---

### 12.2 Courses

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/courses` | Create course | Lecturer |
| GET | `/api/courses` | Get current user's courses | Lecturer/Student |
| GET | `/api/courses/:id` | Get course details | Enrolled Student/Lecturer |
| PATCH | `/api/courses/:id` | Update course | Lecturer owner |
| DELETE | `/api/courses/:id` | Archive/delete course | Lecturer owner |
| GET | `/api/courses/:id/students` | List enrolled students | Lecturer |
| POST | `/api/courses/:id/enrolments` | Enrol student | Lecturer |
| DELETE | `/api/courses/:id/enrolments/:studentId` | Remove student | Lecturer |

Enrolment creation accepts exactly one of `studentId` (UUID) or `studentEmail` (normalized
email). Only an existing STUDENT account may be enrolled. The lecturer must own the course.
The student register is lecturer-owner only. Student course reads require current enrolment.
Enrolment changes and archival lock the course row in a transaction to serialize concurrent
requests. Duplicate enrolments return 409; course deletion archives rather than erases data.

---

### 12.3 Assignments

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/courses/:courseId/assignments` | Create assignment | Lecturer |
| GET | `/api/courses/:courseId/assignments` | Course assignments | Lecturer/Student |
| GET | `/api/assignments/my` | Student task list | Student |
| GET | `/api/assignments/:id` | Assignment details | Authorized user |
| PATCH | `/api/assignments/:id` | Edit assignment | Lecturer owner |
| DELETE | `/api/assignments/:id` | Delete assignment | Lecturer owner |
| PATCH | `/api/assignments/:id/status` | Set PENDING/COMPLETED | Student |

`GET /api/assignments/my` should return calculated fields such as:

```json
{
  "status": "PENDING",
  "isOverdue": false,
  "daysRemaining": 3,
  "priorityScore": 0.82,
  "priorityLabel": "HIGH"
}
```

---

### 12.4 Announcements

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/courses/:courseId/announcements` | Publish announcement | Lecturer |
| GET | `/api/courses/:courseId/announcements` | Course announcements | Lecturer/Student |
| GET | `/api/announcements/my` | Student announcement feed | Student |
| PATCH | `/api/announcements/:id` | Edit announcement | Lecturer owner |
| DELETE | `/api/announcements/:id` | Delete announcement | Lecturer owner |

---

### 12.5 Schedules

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/courses/:courseId/schedules` | Create class schedule | Lecturer |
| GET | `/api/courses/:courseId/schedules` | Course schedule | Lecturer/Student |
| GET | `/api/schedules/my` | Student combined schedule | Student |
| PATCH | `/api/schedules/:id` | Update schedule | Lecturer |
| DELETE | `/api/schedules/:id` | Delete schedule | Lecturer |

---

### 12.6 Attendance Sessions

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/courses/:courseId/attendance-sessions` | Open attendance session | Lecturer |
| GET | `/api/courses/:courseId/attendance-sessions` | Session history | Lecturer |
| GET | `/api/attendance-sessions/:id` | Session details | Lecturer |
| PATCH | `/api/attendance-sessions/:id/close` | Close session | Lecturer |
| GET | `/api/attendance-sessions/:id/live` | Live register | Lecturer |

---

### 12.7 Attendance Records

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/device/attendance` | Submit fingerprint attendance | Device |
| GET | `/api/attendance/my` | Student attendance history | Student |
| GET | `/api/attendance/my/summary` | Student attendance percentages | Student |
| GET | `/api/courses/:courseId/attendance` | Course attendance report | Lecturer |
| GET | `/api/attendance-sessions/:id/records` | Session attendance list | Lecturer |

---

### 12.8 Device Endpoints

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/device/session/active` | Get relevant active session | Device |
| POST | `/api/device/heartbeat` | Update last-seen status | Device |
| POST | `/api/admin/devices` | Register device | Admin |
| GET | `/api/admin/devices` | List devices | Admin |
| PATCH | `/api/admin/devices/:id` | Update/disable device | Admin |

---

### 12.9 Biometric Enrolment

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/api/admin/biometrics/enrol` | Save student ↔ slot mapping after device enrolment | Admin |
| GET | `/api/admin/biometrics` | List biometric profiles | Admin |
| DELETE | `/api/admin/biometrics/:id` | Remove biometric mapping | Admin |

The actual fingerprint template is stored by the AS608 sensor, not in PostgreSQL.

---

### 12.10 Notifications

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/notifications` | Get notifications | Authenticated user |
| GET | `/api/notifications/stream` | SSE event stream | Authenticated user |
| PATCH | `/api/notifications/:id/read` | Mark one notification read | Owner |
| PATCH | `/api/notifications/read-all` | Mark all read | Owner |

---

### 12.11 Dashboards and Analytics

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/api/dashboard/student` | Student dashboard payload | Student |
| GET | `/api/dashboard/lecturer` | Lecturer overview | Lecturer |
| GET | `/api/courses/:courseId/analytics` | Course metrics | Lecturer |

---

## 13. Core Business Logic

### 13.1 Deterministic Task Priority

Task priority is a transparent rule-based feature, not Artificial Intelligence.

A student sees pending tasks sorted according to urgency.

Recommended formula:

```text
Priority Score =
    (Deadline Urgency × 0.50)
  + (Difficulty Rating × 0.30)
  + (Course Credit Weight × 0.20)
```

Each component is normalized to a range from `0.0` to `1.0`.

#### Deadline Urgency

Example:

```text
if overdue:
    urgency = 1.0
else:
    urgency = max(0, 1 - daysRemaining / priorityWindowDays)
```

A reasonable priority window is 14 days.

Assignments more than 14 days away receive little or no urgency weight.

#### Difficulty Rating

```text
difficultyNormalized = difficulty_rating / 5
```

#### Credit Unit Weight

Example normalization:

```text
creditWeight = min(credit_units / 6, 1)
```

#### Priority Labels

Example:

```text
0.75 – 1.00 = URGENT
0.50 – 0.74 = HIGH
0.25 – 0.49 = MEDIUM
0.00 – 0.24 = LOW
```

The exact thresholds may be adjusted during implementation.

The accepted implementation uses the 14-day window and weights above, with fractional
days. Pending tasks precede completed tasks, then sort by descending priority, deadline,
and assignment ID for stable ties. Overdue means strictly past the deadline and not
completed. The API calculates these values at request time; the browser filters and sorts
the returned task list without deciding official status or priority.

---

### 13.2 Assignment Status Rules

For each student-assignment pair:

```text
PENDING
    assignment exists
    AND student has not marked it complete
    AND deadline has not passed

COMPLETED
    student marked assignment complete

OVERDUE
    student has not completed the assignment
    AND current time > deadline
```

`OVERDUE` can be calculated rather than stored as a database enum value.

---

### 13.3 Attendance Percentage

For a course:

```text
Attendance Percentage =
    Sessions Attended / Eligible Closed Sessions × 100
```

Only closed sessions should count toward the official percentage.

Example:

```text
12 sessions attended / 15 sessions held × 100 = 80%
```

---

### 13.4 Attendance Warning

A simple configurable threshold may be used.

Example:

```text
if attendance_percentage < 75:
    show attendance warning
```

This is a deterministic rule and must not be described as prediction.

---

### 13.5 Assignment Statistics

For a student:

- total active assignments;
- completed assignments;
- pending assignments;
- overdue assignments;
- assignments due today;
- assignments due within seven days.

For a lecturer/course:

- total assignments created;
- number of students who marked each assignment completed;
- completion percentage;
- pending count;
- overdue count after deadline.

The system tracks self-reported task completion, not formal file submission, unless a future submission feature is added.

---

## 14. Attendance Session Lifecycle

```text
Lecturer opens a course.

Lecturer clicks "Open Attendance".

Backend:
    validates lecturer owns the course
    checks there is no conflicting active session
    creates attendance_session with status ACTIVE
    returns session_id

ESP32:
    polls GET /api/device/session/active
    receives the active session
    displays "Place Finger"

Student places finger.

AS608:
    captures fingerprint
    converts image
    searches stored templates
    returns sensor_slot_id on match

ESP32:
    sends:
    {
      sensorSlotId,
      sessionId,
      deviceTimestamp
    }

Backend:
    authenticates the device API key
    verifies device is active
    verifies attendance session is ACTIVE
    maps sensorSlotId + deviceId to biometric_profile
    obtains student_id
    confirms student is enrolled in the course
    checks student has not already attended this session
    inserts attendance_record

Backend returns:
    {
      success: true,
      studentName: "..."
    }

OLED displays:
    "Welcome [Name]"
    "Attendance Recorded"

Lecturer live register updates.

Lecturer clicks "Close Attendance"
OR session expires.

Backend:
    changes session status to CLOSED
    sets closed_at
    attendance becomes part of official course statistics
```

---

## 15. Fingerprint Enrolment Lifecycle

Recommended enrolment flow:

```text
Administrator selects student in admin interface.

System chooses or accepts an available AS608 slot ID.

Administrator starts enrolment mode on the connected device.

OLED:
    "Place Finger"

AS608 captures first image.

Student removes finger.

OLED:
    "Place Again"

AS608 captures second image.

Sensor generates a fingerprint model.

Sensor stores model at sensor_slot_id.

Device reports success.

Backend creates biometric_profile:
    student_id
    device_id
    sensor_slot_id

OLED:
    "Enrollment Successful"
```

If enrolment fails:

- do not create the database mapping;
- display a clear error;
- allow retry.

---

## 16. Hardware Specification

### 16.1 Components

- ESP32 development board
- AS608 fingerprint sensor
- 128×64 OLED display
- jumper wires
- breadboard or prototype PCB
- USB/5V power supply
- enclosure for final prototype if available

### 16.2 ESP32 Responsibilities

The ESP32:

- connects to Wi-Fi;
- stores backend base URL/configuration;
- authenticates itself using a device API key;
- communicates with AS608 through UART;
- communicates with OLED through I2C;
- checks whether attendance is currently active;
- accepts fingerprint scans only when appropriate;
- forwards verified sensor slot IDs to the backend;
- displays server responses to users.

### 16.3 AS608 Responsibilities

The fingerprint sensor:

- captures fingerprint images;
- converts images into templates;
- stores templates internally;
- searches templates;
- returns a numeric template/slot ID;
- performs fingerprint matching locally.

### 16.4 OLED Responsibilities

Possible displays:

```text
Connecting...
Connected
No Active Session
Place Finger
Searching...
Welcome John
Attendance Recorded
Already Recorded
Not Enrolled
Try Again
Network Error
Session Closed
```

---

## 17. Device Authentication and Security

The device must not call privileged attendance endpoints anonymously.

Recommended approach:

```text
X-Device-Key: <secret>
```

The backend stores only a cryptographic hash of the API key.

Request flow:

1. Device sends API key.
2. Backend hashes/verifies the key.
3. Backend identifies device.
4. Backend checks `is_active`.
5. Request continues only when valid.

Additional protections:

- HTTPS in deployment;
- API rate limiting;
- no raw fingerprint images uploaded;
- JWT protection for user routes;
- RBAC middleware;
- input validation;
- parameterized SQL queries or an ORM/query builder;
- unique attendance constraint;
- course ownership checks;
- student enrolment checks.

---

## 18. Authentication and Authorization

### 18.1 JWT Authentication

On successful login:

```json
{
  "accessToken": "...",
  "user": {
    "userId": "...",
    "fullName": "...",
    "role": "STUDENT"
  }
}
```

Recommended JWT payload:

```json
{
  "sub": "user_uuid",
  "role": "STUDENT"
}
```

Recommended expiration:

```text
24 hours
```

### 18.2 Role-Based Access Control

Example middleware:

```text
authenticateUser
requireRole("LECTURER")
requireRole("STUDENT")
requireRole("ADMIN")
```

Role checks alone are insufficient.

Resource ownership must also be validated.

Example:

A lecturer must not be able to edit another lecturer's course simply by knowing its UUID.

---

## 19. Real-Time Notifications

Server-Sent Events remain part of the project because the communication direction is primarily server-to-browser.

### 19.1 SSE Flow

```text
Student logs in.

Browser connects to:
GET /api/notifications/stream

Backend keeps HTTP connection open.

Lecturer publishes assignment.

Backend:
    inserts assignment
    creates notification records for enrolled students
    pushes NEW_ASSIGNMENT event to currently connected students

Disconnected students:
    receive stored unread notifications when they reconnect.
```

Notifications are inserted in the same transaction as assignment publication/updates,
announcements, and course enrolment, then streamed only after commit. Streams use bearer
authorization through Fetch streaming, heartbeat comments, and a 60-second connection
lifetime followed by authenticated reconnection. On connection and events the browser
reloads the persisted inbox; missed live events do not lose notifications. The inbox returns
the latest 100 records and a total unread count. Read actions require recipient ownership.
Announcements use a nullable `deleted_at` timestamp; deletion hides the announcement while
retaining already-delivered notification history. SSE connections are held by one API process;
multiple server instances would require shared fan-out infrastructure in a later deployment.

### 19.2 Example Event

```text
event: NEW_ASSIGNMENT
data: {
  "notificationId": "...",
  "title": "New assignment",
  "message": "CSC401: Database Assignment",
  "createdAt": "..."
}
```

---

## 20. Backend Module Structure

The backend is a modular monolith. Each domain owns its routes, controllers, services,
validation and repositories under `backend/src/modules/<domain>/`, following AGENTS.md.
Controllers translate HTTP requests; services enforce business rules; repositories own
parameterized SQL. Shared middleware, configuration and utilities live outside modules.

```text
backend/src/
  app.js
  server.js
  config/
  middleware/
  utils/
  services/
  db/migrations/
  db/seeds/
  modules/
    auth/
    users/
    courses/
    enrolments/
    assignments/
    announcements/
    schedules/
    attendance/
    biometrics/
    devices/
    notifications/
    analytics/
```

Versioned SQL migrations are applied with `npm run db:migrate`. Each file is applied
transactionally and recorded in `schema_migrations`; an advisory lock prevents concurrent
migration runners. The supported database baseline is PostgreSQL 16 or newer.

---

## 21. Frontend Structure

The React application uses Vite, React Router and ES modules. Pages compose feature modules;
feature APIs and hooks stay with their features. Shared HTTP transport lives in
`src/services/api.js`. The root AGENTS.md directory layout is authoritative.

```text
frontend/src/
  App.jsx
  main.jsx
  routes/
  config/
  components/common/
  components/layout/
  components/ui/
  context/
  hooks/
  services/
  styles/
  utils/
  pages/student/
  pages/lecturer/
  pages/admin/
  features/auth/
  features/courses/
  features/assignments/
  features/announcements/
  features/schedules/
  features/attendance/
  features/notifications/
  features/biometrics/
```

Authentication uses bearer JWTs, stored in sessionStorage for same-tab reloads with an
in-memory fallback when storage is unavailable. AuthContext restores identity through
`GET /api/auth/me`; an expired token returns to sign-in, while temporary network errors
offer retry. Sign-out clears the browser token; already issued JWTs remain valid until
expiry. The backend reloads the current user and role on authenticated requests.

---

## 22. Key User Interfaces

### 22.1 Login/Register

- email;
- password;
- full name on registration;
- role selection only where appropriate;
- matric number for student;
- clear validation errors.

For a production institutional system, lecturer/admin registration should normally require authorization rather than allowing unrestricted public role selection.

---

### 22.2 Student Dashboard

Recommended sections:

#### Header

- student name;
- notification icon;
- profile/menu.

#### Summary Cards

- pending assignments;
- assignments due this week;
- overdue assignments;
- overall attendance.

#### Priority Task List

Each task card can show:

- course code;
- assignment title;
- deadline;
- days remaining;
- difficulty;
- priority label;
- completion status.

#### Today's Classes

- course;
- time;
- venue.

#### Recent Announcements

Latest announcements from enrolled courses.

#### Attendance Overview

Per-course attendance percentage.

---

### 22.3 Student Assignments Page

Filters:

- All
- Pending
- Completed
- Overdue
- Course
- Due date

Sort options:

- Priority
- Deadline
- Course
- Difficulty

---

### 22.4 Student Calendar

The calendar uses a Monday–Sunday weekly view with previous/next-week navigation.
Class schedules recur weekly for active enrolled courses, in the institutional timezone
Africa/Lagos (WAT); assignment timestamps are converted to that same timezone.
Schedule inputs use 24-hour HH:mm, require a venue (maximum 160 characters), and cannot
span midnight. Partial edits validate the merged time range. Course owners alone may
create, edit, or remove schedules. Each change persists SCHEDULE_CHANGED notifications
for currently enrolled students in the same transaction, then streams them after commit.
Archived courses and removed enrolments disappear from the combined calendar.

Displays:

- class schedule;
- assignment deadlines.

Possible calendar views:

- month;
- week;
- day.

No AI-generated study sessions are included.

---

### 22.5 Lecturer Dashboard

Recommended sections:

- total courses;
- total enrolled students;
- today's scheduled classes;
- active attendance session;
- upcoming assignments;
- recent announcements;
- recent attendance summary.

---

### 22.6 Course Management Page

Tabs:

```text
Overview
Students
Assignments
Announcements
Schedule
Attendance
Analytics
```

This page should become the lecturer's primary workspace.

---

### 22.7 Attendance Control Page

When no session is active:

```text
CSC401
Database Systems

[ Open Attendance ]
```

When active:

```text
Attendance Active

Started: 10:03 AM
Present: 31 / 54

Live Register:
1. Ada ...
2. Chinedu ...
3. ...

[ Close Attendance ]
```

The list should update without manual refresh.

---

### 22.8 Admin Fingerprint Enrolment

Suggested flow:

```text
Select Device
Select Student
Check Current Enrollment
Start Enrollment
Show Hardware Instructions
Wait for Device Confirmation
Save Mapping
Display Success
```

---

## 23. Lecturer Analytics

The analytics module remains intentionally descriptive rather than predictive.

Possible metrics:

### Per Course

- number of enrolled students;
- number of assignments;
- average attendance percentage;
- attendance per session;
- students below attendance threshold;
- task completion percentage;
- recent attendance trend.

### Per Attendance Session

- total enrolled;
- number present;
- number absent;
- attendance percentage;
- attendance timestamps.

### Per Assignment

- number of enrolled students;
- marked completed;
- still pending;
- completion percentage.

Charts may be used in the frontend, but the underlying calculations are normal database aggregation.

---

## 24. Student Productivity Features

The productivity portion of the project consists of organization and deterministic task management.

It includes:

- assignment aggregation across courses;
- priority sorting;
- pending/completed state;
- overdue detection;
- due-today detection;
- upcoming-deadline reminders;
- calendar integration;
- task statistics.

The project must not describe these features as intelligent prediction, machine learning, or artificial intelligence.

---

## 25. Error Handling

The backend should use a consistent error format.

Example:

```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_ALREADY_RECORDED",
    "message": "Attendance has already been recorded for this session."
  }
}
```

Useful error codes:

```text
INVALID_CREDENTIALS
UNAUTHORIZED
FORBIDDEN
COURSE_NOT_FOUND
STUDENT_NOT_ENROLLED
ASSIGNMENT_NOT_FOUND
SESSION_NOT_FOUND
NO_ACTIVE_SESSION
SESSION_ALREADY_CLOSED
ATTENDANCE_ALREADY_RECORDED
BIOMETRIC_PROFILE_NOT_FOUND
DEVICE_UNAUTHORIZED
VALIDATION_ERROR
```

---

## 26. Validation Rules

Examples:

### User

```text
email must be valid
password minimum length required
student matric number unique
```

### Course

```text
course code required
course title required
credit units > 0
```

### Assignment

```text
title required
deadline required
difficulty 1–5
```

The application may allow overdue deadlines only when editing historical records; normal creation should require a future deadline.

### Schedule

```text
valid day
start_time < end_time
venue required if institution requires it
```

### Attendance

```text
session must be ACTIVE
student must be enrolled
biometric mapping must exist
record must not already exist
```

---

## 27. Security Requirements

At minimum:

- bcrypt password hashing;
- JWT signature verification;
- JWT expiry;
- RBAC;
- ownership checks;
- device API authentication;
- API key hashing;
- secure environment variables;
- CORS configuration;
- request validation;
- SQL injection protection;
- rate limiting on authentication endpoints;
- duplicate attendance prevention;
- no raw biometric images stored;
- HTTPS in deployed environment.

Recommended environment variables:

```text
PORT=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
FRONTEND_URL=
DEVICE_API_KEY_PEPPER=
```

Secrets must not be committed to Git.

---

## 28. Testing Strategy

### 28.1 Unit Tests

Test:

- priority score calculation;
- deadline urgency;
- task status classification;
- attendance percentage calculation;
- attendance warning threshold;
- JWT utilities;
- authorization helpers.

### 28.2 Integration Tests

Test:

- register → login;
- lecturer creates course;
- lecturer enrols student;
- lecturer creates assignment;
- student receives assignment;
- student marks task completed;
- lecturer publishes announcement;
- schedule appears on student dashboard;
- lecturer opens attendance session;
- device submits attendance;
- duplicate attendance is rejected;
- lecturer closes attendance;
- closed session affects attendance percentage.

### 28.3 Hardware Tests

Test:

- ESP32 Wi-Fi connection;
- ESP32 reconnect after network loss;
- UART communication;
- fingerprint enrolment;
- valid fingerprint matching;
- invalid fingerprint rejection;
- API communication;
- OLED status messages;
- duplicate attendance handling;
- closed-session handling.

### 28.4 User Acceptance Testing

Participants may include students and lecturers.

Possible criteria:

- ease of login;
- ease of finding assignments;
- clarity of deadlines;
- usefulness of calendar;
- ease of checking attendance;
- ease of creating assignments;
- ease of starting attendance;
- clarity of hardware feedback;
- overall usability.

A Likert-scale questionnaire can be used.

---

## 29. Revised UML Diagram Set

The UML diagrams should be updated to match the new architecture.

Recommended diagrams:

1. **Use Case Diagram**
   - Lecturer
   - Student
   - Device Administrator
   - Biometric Device

2. **Class Diagram**
   - User
   - Course
   - Enrolment
   - Assignment
   - StudentAssignmentStatus
   - Announcement
   - Schedule
   - AttendanceSession
   - AttendanceRecord
   - BiometricDevice
   - BiometricProfile
   - Notification

3. **Sequence Diagram — Assignment Publication**
   - Lecturer
   - React Frontend
   - Express API
   - PostgreSQL
   - Notification Service
   - Student Browser

4. **Sequence Diagram — Fingerprint Attendance**
   - Student
   - AS608
   - ESP32
   - Express API
   - PostgreSQL
   - Lecturer Dashboard

5. **Sequence Diagram — Fingerprint Enrollment**

6. **Sequence Diagram — Student Dashboard Load**

7. **Activity Diagram — Attendance Session Lifecycle**

8. **Activity Diagram — Student Task Management**

All previous prediction and retraining diagrams must be removed.

---

## 30. Chapter 4 — Implementation Structure

Chapter 4 should document what is actually built.

### 4.0 Introduction

Briefly explain that the chapter presents:

- implementation environment;
- database;
- backend;
- frontend;
- hardware;
- integration;
- testing;
- screenshots/results.

### 4.1 Implementation Environment

Document:

- development computer;
- operating system;
- Node.js version;
- npm version;
- PostgreSQL version;
- React version;
- Express version;
- Arduino IDE/PlatformIO version;
- ESP32 board package;
- fingerprint sensor library;
- Git/GitHub.

### 4.2 Database Implementation

Explain:

- tables;
- foreign keys;
- unique constraints;
- indexes;
- migrations/schema;
- UUID generation.

### 4.3 Authentication and Authorization

Explain:

- user registration;
- bcrypt;
- JWT;
- middleware;
- role checks;
- resource ownership.

### 4.4 Course and Enrolment Module

Explain:

- course creation;
- lecturer ownership;
- enrolment;
- student course retrieval.

### 4.5 Assignment/Productivity Module

Explain:

- assignment creation;
- per-student task status;
- dynamic priority calculation;
- overdue detection;
- dashboard summary.

### 4.6 Announcement and Notification Module

Explain:

- announcement publication;
- notification storage;
- SSE connection;
- unread notifications.

### 4.7 Schedule and Calendar Module

Explain:

- lecturer schedule management;
- aggregation into student calendar;
- schedule-change notifications.

### 4.8 Biometric Attendance Module

Explain:

- hardware;
- device authentication;
- fingerprint matching;
- slot-to-student mapping;
- active sessions;
- attendance recording;
- duplicate prevention;
- live register.

### 4.9 Analytics Module

Explain:

- SQL aggregation;
- attendance percentages;
- task statistics;
- lecturer metrics.

### 4.10 Frontend Implementation

Document:

- routing;
- authentication state;
- API client;
- student interface;
- lecturer interface;
- admin interface;
- SSE client;
- responsive design.

### 4.11 Testing

Present:

- unit testing;
- integration testing;
- hardware testing;
- user acceptance testing.

No model evaluation section exists.

---

## 31. Chapter 4 Screenshot Checklist

Capture screenshots of:

1. Login page
2. Student dashboard
3. Student assignments page
4. Student calendar
5. Student attendance page
6. Notifications panel
7. Lecturer dashboard
8. Lecturer course page
9. Assignment creation interface
10. Announcement interface
11. Schedule management
12. Attendance session before opening
13. Active attendance session
14. Live attendance register
15. Attendance report
16. Course analytics
17. Admin device management
18. Fingerprint enrolment interface
19. OLED "Place Finger" state
20. OLED successful attendance state

---

## 32. Chapter 5 — Conclusion Structure

### 5.1 Summary

Summarize:

- problem identified;
- literature reviewed;
- design completed;
- software/hardware implemented;
- testing performed.

### 5.2 Conclusion

Evaluate the project against the revised objectives:

1. centralized lecturer/student academic communication;
2. assignment and task organization;
3. class scheduling;
4. biometric attendance;
5. real-time updates;
6. descriptive academic analytics.

Do not claim that the system predicts student performance or uses AI.

### 5.3 Contributions

Possible contributions:

#### Practical

- unified academic communication;
- centralized student task management;
- reduced paper attendance;
- stronger resistance to proxy attendance;
- hardware/software integration;
- centralized attendance records;
- real-time lecturer attendance monitoring.

#### Technical

- integration of React, Express, PostgreSQL, ESP32, and AS608;
- secure device-to-server attendance flow;
- local fingerprint matching with server-side identity mapping;
- SSE-based real-time academic notifications.

### 5.4 Future Work

Reasonable future improvements:

1. native mobile application;
2. offline attendance queueing;
3. institutional student-information-system integration;
4. file submission for assignments;
5. lecturer grading;
6. email/push notifications;
7. multiple biometric devices per institution;
8. QR fallback when fingerprint hardware is unavailable;
9. richer reporting and CSV/PDF exports;
10. timetable conflict detection;
11. optional AI features as future research only, not part of the implemented system.

---

## 33. Constraints and Limitations

1. **Prototype hardware scale**  
   The project may initially use one biometric device. A production university deployment would require multiple devices.

2. **Internet dependency**  
   Attendance submission and real-time software features require network connectivity unless offline queueing is later implemented.

3. **Fingerprint capacity**  
   The selected AS608 sensor has finite template storage, so a large deployment may require multiple devices or a different biometric architecture.

4. **Biometric privacy**  
   Fingerprint templates are sensitive biometric information. The prototype minimizes exposure by keeping fingerprint matching on the sensor/device and storing only student-to-slot mappings on the server.

5. **Manual course enrolment**  
   Unless integrated with institutional systems, lecturers/administrators must manage enrolment within the platform.

6. **Task completion is self-reported**  
   The first version tracks whether a student marks an assignment as completed. It does not prove formal submission unless an assignment-upload module is added.

7. **Institutional adoption**  
   The platform only improves communication when lecturers and students actively use it.

---

## 34. Recommended Implementation Phases

The software should be implemented incrementally.

### Phase 1 — Project Foundation

Build:

- repository structure;
- Express server;
- PostgreSQL connection;
- environment configuration;
- global error handling;
- React application;
- routing.

### Phase 2 — Authentication

Build:

- registration;
- login;
- JWT;
- bcrypt;
- role middleware;
- frontend AuthContext;
- protected routes.

### Phase 3 — Courses and Enrolment

Build:

- course CRUD;
- student enrolment;
- lecturer course pages;
- student course list.

### Phase 4 — Assignments and Productivity

Build:

- assignment CRUD;
- student task state;
- priority service;
- overdue logic;
- student assignment interface.

### Phase 5 — Announcements and Notifications

Build:

- announcements;
- notification table;
- unread counts;
- SSE streaming.

### Phase 6 — Schedules and Calendar

Build:

- lecturer schedule CRUD;
- student schedule aggregation;
- calendar interface.

### Phase 7 — Attendance Software

Before connecting hardware, implement:

- attendance sessions;
- open/close logic;
- attendance records;
- mock device endpoint testing;
- live attendance interface;
- attendance summaries.

### Phase 8 — Biometric Hardware

Build:

- ESP32 Wi-Fi;
- AS608 communication;
- OLED;
- device authentication;
- active-session polling;
- attendance POST;
- fingerprint enrolment.

### Phase 9 — Analytics

Build:

- student attendance summary;
- lecturer attendance analytics;
- assignment completion statistics;
- dashboard summary queries.

### Phase 10 — Testing and Documentation

Complete:

- unit tests;
- integration tests;
- hardware tests;
- usability testing;
- screenshots;
- Chapter 4;
- Chapter 5.

---

## 35. Minimum Viable Product

If time becomes limited, the minimum acceptable complete system should include:

### Required Software

- login/authentication;
- lecturer and student roles;
- course creation;
- student enrolment;
- assignments;
- announcements;
- schedules;
- student dashboard;
- attendance sessions;
- attendance history.

### Required Hardware

- fingerprint enrolment;
- fingerprint matching;
- ESP32-to-backend attendance submission;
- OLED feedback.

### Required Integration

```text
Lecturer opens attendance
→ device detects session
→ student scans finger
→ device submits attendance
→ backend stores attendance
→ lecturer sees attendance
→ student sees attendance history
```

This end-to-end flow is the project's most important hardware/software demonstration.

---

## 36. Definition of Done

The system can be considered functionally complete when the following scenario works from beginning to end:

```text
1. Lecturer registers/logs in.
2. Lecturer creates a course.
3. Student registers/logs in.
4. Lecturer enrols student.
5. Lecturer publishes an assignment.
6. Student receives notification.
7. Student sees assignment on dashboard.
8. Student marks assignment completed.
9. Lecturer publishes announcement.
10. Student sees announcement.
11. Lecturer creates weekly schedule.
12. Student sees it in calendar.
13. Administrator enrols student's fingerprint.
14. Lecturer opens attendance.
15. ESP32 detects active session.
16. Student scans finger.
17. Fingerprint matches.
18. Backend maps sensor slot to student.
19. Attendance record is created.
20. Lecturer live register updates.
21. Student sees attendance history.
22. Lecturer closes attendance.
23. Attendance percentage is updated.
24. Lecturer views course attendance analytics.
```

No Artificial Intelligence or Machine Learning component is required for any part of this flow.

---

## 37. Final Architectural Principle

The revised project should favor:

- clear business rules;
- explicit database relationships;
- auditable calculations;
- secure hardware integration;
- reliable academic workflows;
- manageable implementation complexity.

The project should not add Artificial Intelligence merely to make the system appear more advanced.

Its technical strength should come from the integration of:

```text
React
+ Node.js/Express
+ PostgreSQL
+ real-time notifications
+ role-based academic workflows
+ ESP32
+ fingerprint authentication
+ full-stack hardware/software integration
```

That combination is sufficient to produce a substantial undergraduate Computer Science final-year project when implemented, tested, and documented properly.
