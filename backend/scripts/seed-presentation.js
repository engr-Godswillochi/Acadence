const apiBaseUrl = (process.env.PRESENTATION_API_BASE_URL ?? 'http://127.0.0.1:3000/api').replace(/\/$/, '');
const password = process.env.PRESENTATION_PASSWORD;

if (!password || password.length < 8) {
  throw new Error('Set PRESENTATION_PASSWORD to at least 8 characters.');
}

const accounts = {
  lecturer: {
    fullName: 'Dr. Ada Okafor',
    email: 'lecturer.demo@acadence.app',
    password,
    role: 'LECTURER',
    staffNumber: 'ACA-DEMO-001',
  },
  student: {
    fullName: 'Chinedu Demo',
    email: 'student.demo@acadence.app',
    password,
    role: 'STUDENT',
    matricNumber: 'ACA/2026/DEMO01',
  },
};

function futureDeadline(days, hour = 17) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

const courseSeeds = [
  {
    course: {
      courseCode: 'CSC 401',
      courseTitle: 'Software Engineering',
      creditUnits: 3,
      academicSession: '2026/2027',
      semester: 'FIRST',
    },
    assignments: [
      {
        title: 'Requirements Analysis Report',
        description: 'Model the requirements for a campus service and submit user stories, acceptance criteria, and a context diagram.',
        deadline: futureDeadline(6),
        difficultyRating: 3,
      },
      {
        title: 'Architecture Design Exercise',
        description: 'Propose a maintainable architecture for the course project and explain the major design trade-offs.',
        deadline: futureDeadline(14),
        difficultyRating: 4,
      },
    ],
    schedules: [
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '11:00', venue: 'Engineering LT 2' },
      { dayOfWeek: 'Thursday', startTime: '13:00', endTime: '15:00', venue: 'Software Lab 1' },
    ],
    announcements: [
      {
        title: 'Welcome to CSC 401',
        message: 'Welcome to Software Engineering. The course outline and project brief are now available in the course workspace.',
      },
      {
        title: 'Project teams and consultation',
        message: 'Project teams should have four members. Consultation holds on Thursday after the laboratory session.',
      },
    ],
  },
  {
    course: {
      courseCode: 'CSC 405',
      courseTitle: 'Artificial Intelligence',
      creditUnits: 3,
      academicSession: '2026/2027',
      semester: 'FIRST',
    },
    assignments: [
      {
        title: 'Search Algorithms Comparison',
        description: 'Implement breadth-first and A* search, then compare their explored states and solution costs.',
        deadline: futureDeadline(9),
        difficultyRating: 4,
      },
      {
        title: 'Knowledge Representation Quiz',
        description: 'Review propositional logic, first-order logic, and inference before completing the online quiz.',
        deadline: futureDeadline(17),
        difficultyRating: 2,
      },
    ],
    schedules: [
      { dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '12:00', venue: 'ICT Hall A' },
      { dayOfWeek: 'Friday', startTime: '14:00', endTime: '16:00', venue: 'AI Laboratory' },
    ],
    announcements: [
      {
        title: 'CSC 405 learning resources',
        message: 'The first set of lecture notes and the search visualisation resources have been posted for revision.',
      },
      {
        title: 'Friday practical reminder',
        message: 'Bring a laptop with Python installed for the informed-search practical in the AI Laboratory.',
      },
    ],
  },
];

async function request(path, { token, method = 'GET', body, expected = [200] } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!expected.includes(response.status)) {
    const message = payload?.error?.message ?? `${response.status} ${response.statusText}`;
    throw new Error(`${method} ${path}: ${message}`);
  }
  return payload.data;
}

async function ensureAccount(account) {
  const login = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  if (login.ok) return (await login.json()).data;
  if (login.status !== 401) {
    const payload = await login.json().catch(() => ({}));
    throw new Error(`Login for ${account.email}: ${payload?.error?.message ?? login.statusText}`);
  }
  return request('/auth/register', { method: 'POST', body: account, expected: [201] });
}

async function ensureCourse(token, seed) {
  const { courses } = await request('/courses', { token });
  const existing = courses.find((course) => course.courseCode === seed.courseCode);
  if (!existing) {
    return (await request('/courses', { token, method: 'POST', body: seed, expected: [201] })).course;
  }
  return (await request(`/courses/${existing.courseId}`, { token, method: 'PATCH', body: seed })).course;
}

async function ensureEnrolment(token, courseId) {
  const { students } = await request(`/courses/${courseId}/students`, { token });
  if (students.some((student) => student.email === accounts.student.email)) return;
  await request(`/courses/${courseId}/enrolments`, {
    token,
    method: 'POST',
    body: { studentEmail: accounts.student.email },
    expected: [201],
  });
}

async function ensureAssignments(token, courseId, seeds) {
  const { assignments } = await request(`/courses/${courseId}/assignments`, { token });
  const results = [];
  for (const seed of seeds) {
    const existing = assignments.find((assignment) => assignment.title === seed.title);
    const unchanged = existing
      && existing.description === seed.description
      && new Date(existing.deadline).toISOString() === seed.deadline
      && existing.difficultyRating === seed.difficultyRating;
    if (unchanged) {
      results.push(existing);
    } else {
      const result = existing
        ? await request(`/assignments/${existing.assignmentId}`, { token, method: 'PATCH', body: seed })
        : await request(`/courses/${courseId}/assignments`, { token, method: 'POST', body: seed, expected: [201] });
      results.push(result.assignment);
    }
  }
  return results;
}

async function ensureSchedules(token, courseId, seeds) {
  const { schedules } = await request(`/courses/${courseId}/schedules`, { token });
  for (const seed of seeds) {
    const existing = schedules.find((schedule) => schedule.dayOfWeek === seed.dayOfWeek && schedule.startTime.slice(0, 5) === seed.startTime);
    if (existing) {
      const unchanged = existing.endTime.slice(0, 5) === seed.endTime && existing.venue === seed.venue;
      if (!unchanged) await request(`/schedules/${existing.scheduleId}`, { token, method: 'PATCH', body: seed });
    } else {
      await request(`/courses/${courseId}/schedules`, { token, method: 'POST', body: seed, expected: [201] });
    }
  }
}

async function ensureAnnouncements(token, courseId, seeds) {
  const { announcements } = await request(`/courses/${courseId}/announcements`, { token });
  for (const seed of seeds) {
    const existing = announcements.find((announcement) => announcement.title === seed.title);
    if (existing) {
      if (existing.message !== seed.message) {
        await request(`/announcements/${existing.announcementId}`, { token, method: 'PATCH', body: seed });
      }
    } else {
      await request(`/courses/${courseId}/announcements`, { token, method: 'POST', body: seed, expected: [201] });
    }
  }
}

async function main() {
  await request('/health');
  const lecturer = await ensureAccount(accounts.lecturer);
  const student = await ensureAccount(accounts.student);

  for (const seed of courseSeeds) {
    const course = await ensureCourse(lecturer.accessToken, seed.course);
    await ensureEnrolment(lecturer.accessToken, course.courseId);
    const assignments = await ensureAssignments(lecturer.accessToken, course.courseId, seed.assignments);
    await ensureSchedules(lecturer.accessToken, course.courseId, seed.schedules);
    await ensureAnnouncements(lecturer.accessToken, course.courseId, seed.announcements);
    if (assignments.length !== seed.assignments.length) throw new Error(`Assignment verification failed for ${course.courseCode}.`);
  }

  const lecturerCourses = (await request('/courses', { token: lecturer.accessToken })).courses;
  const studentCourses = (await request('/courses', { token: student.accessToken })).courses;
  const studentAssignments = (await request('/assignments/my', { token: student.accessToken })).assignments;
  const studentSchedules = (await request('/schedules/my', { token: student.accessToken })).schedules;
  const studentAnnouncements = (await request('/announcements/my', { token: student.accessToken })).announcements;

  console.info(JSON.stringify({
    apiBaseUrl,
    lecturer: { email: accounts.lecturer.email, courses: lecturerCourses.length },
    student: {
      email: accounts.student.email,
      courses: studentCourses.length,
      assignments: studentAssignments.length,
      schedules: studentSchedules.length,
      announcements: studentAnnouncements.length,
    },
  }, null, 2));
}

await main();
