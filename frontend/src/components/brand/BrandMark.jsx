// The Acadence mark: a wayfinding chevron whose amber crossbar overshoots to the
// right, so the letterform reads as a path forward rather than a plain A.
//
// The chevron is drawn in currentColor so one mark sits correctly on the white
// page header and on the blue rail. The crossbar needs 3:1 against whichever of
// those it lands on, so it reads --brand-accent: dark amber on light grounds,
// bright signal amber on the rail. Both are set in the stylesheets; #f2b544 is
// only a fallback for the bare structural sheet.
export function BrandMark({ title, className, ...rest }) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      width="40"
      height="40"
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : 'true'}
      focusable="false"
      {...rest}
    >
      {labelled ? <title>{title}</title> : null}
      <path d="M7 33 20 7.5 33 33" fill="none" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9.4" y="22.6" width="26.4" height="5.2" rx="2.6" fill="var(--brand-accent, #f2b544)" />
    </svg>
  );
}
