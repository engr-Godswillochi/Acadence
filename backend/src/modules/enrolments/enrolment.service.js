import { withTransaction } from '../../db/transaction.js';
import { ApiError } from '../../utils/apiError.js';
import { requireCourseOwner } from '../courses/course.service.js';
import { enrolmentRepository as enrolments } from './enrolment.repository.js';
import { generateEnrolmentToken, enrolmentLinkRepository as links } from './enrolment-link.repository.js';
import { notificationRepository } from '../notifications/notification.repository.js';
import { withNotifications } from '../notifications/notification.service.js';

const LINK_LIFETIME_DAYS = 14;
const linkLifetimeMilliseconds = LINK_LIFETIME_DAYS * 86400000;

// A student arriving through a share link gets the same roster entry and the same
// notification as one added by email, so there is only one enrolment path to reason about.
async function enrolStudent(client, emit, courseId, studentId) {
  try {
    const item = await enrolments.add(courseId, studentId, client);
    emit(await notificationRepository.createForUser(client, studentId, { type: 'COURSE_ENROLMENT', title: 'Course enrolment', message: 'You have been enrolled in a course.', relatedEntityId: courseId }));
    return item;
  }
  catch (error) {
    if (error.code === '23505') throw new ApiError(409, 'ALREADY_ENROLLED', 'This student is already enrolled.');
    throw error;
  }
}

// One message for every unusable link, so a stranger cannot tell an expired token
// apart from a revoked one and probe for valid ones.
function unusableLink() {
  return new ApiError(404, 'ENROLMENT_LINK_INVALID', 'This enrolment link is no longer valid. Ask your lecturer for a new one.');
}

function presentLink(link) {
  return { token: link.token, expiresAt: link.expiresAt, createdAt: link.createdAt };
}

async function usableLink(token) {
  const link = await links.findUsableByToken(token);
  if (!link) throw unusableLink();
  return link;
}

export const enrolmentService = {
  async list(user, courseId) {
    await requireCourseOwner(user, courseId);
    return enrolments.list(courseId);
  },
  add: (user, courseId, input) => withNotifications(async (client, emit) => {
    // The course lock serializes enrolment changes against archival.
    await requireCourseOwner(user, courseId, client);
    const student = await enrolments.findStudent(input, client);
    if (!student || student.role !== 'STUDENT') throw new ApiError(404, 'STUDENT_NOT_FOUND', 'No student account matches these details.');
    return enrolStudent(client, emit, courseId, student.studentId);
  }),
  remove: (user, courseId, studentId) => withTransaction(async (client) => {
    await requireCourseOwner(user, courseId, client);
    if (!await enrolments.remove(courseId, studentId, client)) throw new ApiError(404, 'STUDENT_NOT_ENROLLED', 'This student is not enrolled.');
  }),

  async currentLink(user, courseId) {
    await requireCourseOwner(user, courseId);
    const link = await links.findActiveByCourse(courseId);
    return { link: link ? presentLink(link) : null, lifetimeDays: LINK_LIFETIME_DAYS };
  },
  // Issuing a link always revokes its predecessor, so a link pasted into a chat
  // last term stops working the moment a fresh one is generated.
  createLink: (user, courseId) => withTransaction(async (client) => {
    await requireCourseOwner(user, courseId, client);
    await links.revokeActiveByCourse(client, courseId);
    return presentLink(await links.create(client, courseId, generateEnrolmentToken(), new Date(Date.now() + linkLifetimeMilliseconds)));
  }),
  revokeLink: (user, courseId) => withTransaction(async (client) => {
    await requireCourseOwner(user, courseId, client);
    await links.revokeActiveByCourse(client, courseId);
  }),

  // Readable without signing in. The enrolment state is only ever reported for the
  // caller's own account, never as a way to test whether some other student is on the roster.
  async previewLink(token, user) {
    const link = await usableLink(token);
    return {
      course: {
        courseId: link.courseId,
        courseCode: link.courseCode,
        courseTitle: link.courseTitle,
        creditUnits: link.creditUnits,
        academicSession: link.academicSession,
        semester: link.semester,
        lecturerName: link.lecturerName,
      },
      expiresAt: link.expiresAt,
      alreadyEnrolled: user ? await enrolments.exists(link.courseId, user.userId) : false,
      viewerRole: user?.role ?? null,
    };
  },
  redeemLink: (user, token) => withNotifications(async (client, emit) => {
    if (user.role !== 'STUDENT') throw new ApiError(403, 'FORBIDDEN', 'Only student accounts can enrol through this link.');
    const link = await usableLink(token);
    const enrolment = await enrolStudent(client, emit, link.courseId, user.userId);
    return { enrolment, courseId: link.courseId };
  }),
};
