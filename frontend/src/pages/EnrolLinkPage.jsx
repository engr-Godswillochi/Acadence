import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Unlink2,
  UserPlus,
} from 'lucide-react';

import { BrandMark } from '../components/brand/BrandMark.jsx';
import { enrolmentLinksApi } from '../features/enrolments/enrolmentLinks.api';
import { useAuth } from '../features/auth/useAuth';
import { formatAcademicDateOnly } from '../utils/date';

function handleApiMessage(error, fallback) {
  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function EnrolPageBrand() {
  return (
    <header className="enrol-brandbar">
      <Link className="enrol-brand" to="/" aria-label="Acadence home">
        <BrandMark className="brand-mark" />
        <span>
          <strong>Acadence</strong>
          <small>Campus workspace</small>
        </span>
      </Link>
      <span className="enrol-link-status">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>Course invitation</span>
      </span>
    </header>
  );
}

function semesterName(semester) {
  if (!semester) return '';

  return `${semester.charAt(0)}${semester.slice(1).toLowerCase()} semester`;
}

/**
 * Renders the public landing page for a shareable enrolment link. One route
 * serves every outcome — signed out, signed in, already enrolled, done, and the
 * dead end when a link has expired or been revoked — so the whole flow survives
 * as a single reviewable screen.
 */
export function EnrolLinkPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { token: authToken, user } = useAuth();
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [actionError, setActionError] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchPreview() {
      if (!token) {
        setLoadError('This enrolment link is missing from the address.');
        setLoading(false);

        return;
      }

      setLoading(true);
      setLoadError('');

      try {
        // The preview is public, but an available identity lets the server say
        // whether this student already belongs to the course.
        const data = await enrolmentLinksApi.preview(authToken || null, token, controller.signal);
        if (active) setPreview(data);
      } catch (error) {
        if (active) {
          setPreview(null);
          setLoadError(handleApiMessage(error, 'This enrolment link is no longer valid.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchPreview();

    return () => {
      active = false;
      controller.abort();
    };
  }, [authToken, token]);

  const enrol = useCallback(async () => {
    if (redeeming) return;

    setActionError('');
    setRedeeming(true);

    try {
      await enrolmentLinksApi.redeem(authToken, token);
      // Stay on the page: the confirmation and the way in are the point of
      // this screen, so the student reads what just happened before leaving.
      setJoined(true);
    } catch (error) {
      setActionError(
        handleApiMessage(
          error,
          'This link could not be used right now. Reload the page and try again.',
        ),
      );
      setRedeeming(false);
    }
  }, [authToken, redeeming, token]);

  if (loading) {
    return (
      <section className="enrol-page enrol-page--quiet" aria-busy="true">
        <EnrolPageBrand />
        <div className="enrol-state">
          <span className="enrol-loading-mark" aria-hidden="true" />
          <h1>Opening your course invitation…</h1>
          <p>We’re checking the link and fetching the course details.</p>
        </div>
      </section>
    );
  }

  if (loadError || !preview) {
    const message = loadError || 'This enrolment link is missing its course details.';
    const signIn = () =>
      navigate(`/login?redirect=${encodeURIComponent(`/enrol/${token}`)}`, { replace: true });
    const register = () =>
      navigate(`/register?redirect=${encodeURIComponent(`/enrol/${token}`)}&role=STUDENT`, {
        replace: true,
      });

    return (
      <section className="enrol-page enrol-page--fail">
        <EnrolPageBrand />
        <div className="enrol-state enrol-state--fail">
          <span className="enrol-state-icon" aria-hidden="true">
            <Unlink2 size={26} strokeWidth={1.9} />
          </span>
          <h1>This link cannot be used.</h1>
          <p className="enrol-state-message">{message}</p>
          <p className="enrol-note">
            Enrolment links stop working once they expire, or as soon as your lecturer issues a
            new one. Ask for a fresh link and it will open straight back to this course.
          </p>
          <div className="enrol-actions">
            <button type="button" onClick={signIn}>
              Sign in
            </button>
            <button type="button" className="secondary" onClick={register}>
              Register
            </button>
          </div>
          <Link className="enrol-secondary-link" to="/courses">
            Browse courses <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  const course = preview.course ?? {};
  const viewerRole = user?.role ?? preview.viewerRole ?? null;
  const joinedNow = Boolean(joined || preview.alreadyEnrolled);
  const signedOut = !user;
  const wrongRole = !signedOut && viewerRole !== 'STUDENT';
  const tone = joinedNow ? 'done' : signedOut ? 'invite' : wrongRole ? 'caution' : 'invite';
  const sessionLabel = [course.academicSession, semesterName(course.semester)]
    .filter(Boolean)
    .join(' · ');
  const expiry = preview.expiresAt ? formatAcademicDateOnly(preview.expiresAt) : '';
  const courseHref = `/courses/${course.courseId}`;

  const decisionHeading = joinedNow
    ? preview.alreadyEnrolled && !joined
      ? 'You are already on this course.'
      : 'You are enrolled.'
    : wrongRole
      ? 'This link is for student accounts.'
      : `Enrol in ${course.courseCode}`;

  const decisionCopy = joinedNow
    ? `${course.courseCode} is now on your courses list. Open it to read the schedule, deadlines and coursework.`
    : wrongRole
      ? 'Lecturer accounts enrol through the lecturer dashboard, so this link will not add the course to your own learning dashboard.'
      : signedOut
        ? 'Sign in with your student account to add this course to your dashboard, alongside its schedule, deadlines and coursework.'
        : `Join this course to add it to your learning dashboard and see its schedule, deadlines and coursework.`;

  const decisionIcon = joinedNow ? (
    <CheckCircle2 size={26} strokeWidth={1.9} />
  ) : wrongRole ? (
    <ShieldAlert size={26} strokeWidth={1.9} />
  ) : (
    <UserPlus size={26} strokeWidth={1.9} />
  );

  const goToSignIn = () =>
    navigate(`/login?redirect=${encodeURIComponent(`/enrol/${token}`)}`, { replace: true });
  const goToRegister = () =>
    navigate(`/register?redirect=${encodeURIComponent(`/enrol/${token}`)}&role=STUDENT`, {
      replace: true,
    });

  return (
    <section className={`enrol-page enrol-page--${tone}`}>
      <EnrolPageBrand />

      <div className="enrol-layout">
        <div className="enrol-course-panel">
          <div className="enrol-course-heading">
            <span className="enrol-course-mark" aria-hidden="true">
              <BookOpen size={25} strokeWidth={1.8} />
            </span>
            <h1>{course.courseCode}</h1>
            <p className="enrol-course-title">{course.courseTitle}</p>
          </div>

          <dl className="enrol-facts">
            <div>
              <dt>
                <GraduationCap size={17} aria-hidden="true" />
                Lecturer
              </dt>
              <dd>{course.lecturerName || 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} aria-hidden="true" />
                Academic term
              </dt>
              <dd>{sessionLabel || 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>
                <Scale size={17} aria-hidden="true" />
                Credit units
              </dt>
              <dd>{course.creditUnits ?? 'To be confirmed'}</dd>
            </div>
          </dl>

          <p className="enrol-course-assurance">
            <ShieldCheck size={17} aria-hidden="true" />
            This invitation was issued through Acadence.
          </p>
        </div>

        <div className={`enrol-decision enrol-decision--${tone}`}>
          <span className="enrol-decision-icon" aria-hidden="true">
            {decisionIcon}
          </span>
          <div className="enrol-decision-copy">
            <h2>{decisionHeading}</h2>
            <p>{decisionCopy}</p>
          </div>

          {actionError && (
            <p role="alert" className="form-error enrol-action-error">
              {actionError}
            </p>
          )}

          {joinedNow ? (
            <Link className="button-link enrol-primary-action" to={courseHref}>
              Open {course.courseCode} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : (
            <div className="enrol-decision-actions">
              {signedOut ? (
                <>
                  <button type="button" onClick={goToSignIn}>
                    Sign in to enrol
                  </button>
                  <button type="button" className="secondary" onClick={goToRegister}>
                    Register as a student
                  </button>
                </>
              ) : wrongRole ? (
                <button type="button" className="secondary" onClick={() => navigate('/courses')}>
                  Browse courses
                </button>
              ) : (
                <>
                  <button type="button" onClick={enrol} disabled={redeeming}>
                    {redeeming ? 'Enrolling…' : `Enrol in ${course.courseCode}`}
                  </button>
                  <button type="button" className="secondary" onClick={() => navigate('/courses')} disabled={redeeming}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {expiry && !joinedNow && (
            <p className="enrol-expiry">
              <Clock size={16} aria-hidden="true" />
              <span>
                This link stops working on <strong>{expiry}</strong>.
              </span>
            </p>
          )}

          {signedOut && !joinedNow && (
            <p className="enrol-account-note">
              Use a student account so the course is added to the correct dashboard.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default EnrolLinkPage;
