import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createCourseRouter } from './modules/courses/course.routes.js';
import { createEnrolmentLinkRouter } from './modules/enrolments/enrolment-link.routes.js';
import { createAssignmentRouter } from './modules/assignments/assignment.routes.js';
import { createAnnouncementRouter } from './modules/announcements/announcement.routes.js';
import { createNotificationRouter } from './modules/notifications/notification.routes.js';
import { createScheduleRouter } from './modules/schedules/schedule.routes.js';
import { createAttendanceRouter } from './modules/attendance/attendance.routes.js';
import { createBiometricRouter } from './modules/biometrics/biometric.routes.js';

export function createApp({ authService = createAuthService() } = {}) {
  const app = express();

  app.disable('x-powered-by');
  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        const allowedOrigins = new Set(env.frontendOrigins);
        callback(null, !origin || allowedOrigins.has(origin));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.get('/api/health', (request, response) => {
    response.status(200).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/courses', createCourseRouter(authService));
  app.use('/api/enrolment-links', createEnrolmentLinkRouter(authService));
  app.use('/api', createAssignmentRouter(authService));
  app.use('/api', createAnnouncementRouter(authService));
  app.use('/api', createScheduleRouter(authService));
  app.use('/api', createAttendanceRouter(authService));
  app.use('/api', createBiometricRouter(authService));
  app.use('/api/notifications', createNotificationRouter(authService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
