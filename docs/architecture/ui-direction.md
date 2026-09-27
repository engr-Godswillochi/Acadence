# Interface direction

Acadence uses a charcoal navigation rail, white workspace, restrained botanical accents, and bold sans-serif headings. Functional navigation and action icons come from Lucide React. Icons complement visible labels; icon-only controls require accessible names.

## Reference study

- User-provided Pinterest reference: clear workspace frame, strong hierarchy, restrained flat color.
- [Waldorf School of Garden City on Awwwards](https://www.awwwards.com/sites/waldorf-school-of-garden-city): navigation, school schedules, and accessible information architecture.
- [Global Swiss Learning on Awwwards](https://www.awwwards.com/sites/global-swiss-learning): prominent typography and direct calls to action.

These are compositional references, not templates to reproduce. The product remains an academic workspace rather than a promotional website.

## Course workspace

Lecturers can start course creation directly from the dashboard. Empty accounts show one setup area rather than statistics with zero values and repeated create-course prompts. Populated accounts show a course directory with direct assignment and attendance links.

Course sections use navigable URLs: `?section=assignments`, `announcements`, `schedule`, and lecturer-only `attendance` and `students`. Invalid or unauthorized section values return to assignments. Student course views do not mount lecturer attendance management.

## Acceptance

Visual review covers real rendered desktop/mobile views, including empty and populated data, course creation, errors, and navigation. Reviewer scores are subjective design feedback, not proof of functional completeness. A screenshot using review fixtures does not prove live backend integration.
