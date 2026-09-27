---
name: Acadence
description: A bright campus workspace with the clarity of a modern university wayfinding system.
colors:
  ink: "#14213d"
  ink-soft: "#3f4d67"
  campus-blue: "#2146c7"
  campus-blue-hover: "#173b99"
  campus-blue-soft: "#e9efff"
  navigation-blue: "#173b99"
  surface: "#ffffff"
  canvas: "#edf2f8"
  rule: "#d8e0eb"
  muted: "#68758c"
  signal-amber: "#f2b544"
  danger: "#b42318"
  success: "#16794a"
typography:
  headline:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.8rem)"
    fontWeight: 720
    lineHeight: 1.02
    letterSpacing: "-0.05em"
  title:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 680
    lineHeight: 1.25
  body:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans Variable, IBM Plex Sans, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 650
rounded:
  control: "8px"
  group: "12px"
  page: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  display: "48px"
components:
  button-primary:
    backgroundColor: "{colors.campus-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
    height: "44px"
---

# Design System: Acadence

## Creative north star: Campus Wayfinding

Acadence should feel like the best contemporary university building: bright, calm, unmistakably organized, and easy to move through at speed. The deep-blue navigation is the permanent campus directory. White page surfaces are focused rooms for work. Cobalt identifies action and location; amber is a small wayfinding signal, never decoration.

Hierarchy comes from scale, alignment, contrast, and measured spacing—not a pile of interchangeable cards. High-information areas use registers and ruled rows; priority items earn a stronger tonal surface.

## Palette

- **Ink** (`#14213d`) and **ink soft** (`#3f4d67`) carry primary and supporting text.
- **Campus cobalt** (`#2146c7`) is reserved for actions, links, focus, and selection.
- **Navigation blue** (`#173b99`) anchors the authenticated desktop shell and priority panels.
- **Working white** (`#ffffff`) sits on a **cool canvas** (`#edf2f8`).
- **Signal amber** (`#f2b544`) marks deadline or wayfinding emphasis; green and red remain semantic.

Blue must communicate action, location, or trusted state. Amber is used sparingly enough to remain meaningful. No gradients, glass, dark-theme carryovers, or feature-specific accent colors.

## Typography

Use self-hosted IBM Plex Sans Variable throughout. Headlines are compact and confident (`720`, tight tracking); labels are clear rather than decorative; metadata uses tabular numerals where useful. Interface text uses sentence case. Avoid tracked uppercase eyebrows as a substitute for hierarchy.

## Layout and spacing contract

The spacing scale is `4 / 8 / 12 / 16 / 24 / 32 / 48px`. New arbitrary padding values require a concrete layout reason.

- Desktop authenticated shell: fixed `232px` navigation rail and a full-width white workspace.
- Desktop page surface: exactly `36px 40px 48px` internal padding with no nested outer gutter.
- Compact desktop: exactly `32px 32px 44px` page padding.
- Mobile page surface: exactly `24px 20px 36px` padding with no second container inset.
- Related control gaps use `8–12px`; component interiors use `16–24px`; major sections use `32–48px`.

All route-level screens share this outer contract. Desktop layouts may use columns where information benefits from comparison; they collapse by priority at `760px`. The mobile header remains sticky and its menu expands into a contained two-column directory.

## Shape, depth, and components

Controls use `8px` corners, grouped elements `12px`, and route surfaces `16–20px`. Pills are for status and count only. Resting application surfaces are flat: use a rule or tonal change before adding shadow. Shadows are reserved for the login shell, dialogs, active desktop navigation, and short-lived button feedback.

- **Primary buttons:** cobalt, white type, minimum `44px` height, `10px 16px` padding, darker-blue hover, visible focus ring.
- **Secondary buttons:** white, quiet border, ink type, pale-blue hover.
- **Fields:** white, `1px` rule, `8px` corners, minimum `44px` height, cobalt focus ring.
- **Registers:** one divider between records; stable metadata alignment; pale-blue hover.
- **Navigation:** deep-blue desktop directory with a white active destination; white sticky mobile header with a contained blue menu.
- **Dashboard introduction:** a shared deep-blue banner gives student and lecturer workspaces an immediate welcome, purpose statement, and date or update context before operational data.
- **Page introduction:** every authenticated route begins with the same deep-blue campus landmark, using `24px 32px` desktop padding and `20px` mobile padding. White headings, blue-tinted supporting text, and amber metadata signals maintain hierarchy. Course detail uses the same surface in a compact metadata grid so its navigation follows immediately.

## Working rules

Do keep the spacing contract, visible focus, responsive reflow, reduced-motion behavior, and one obvious primary action per local group. Prefer aligned registers to repetitive card grids.

Do not reintroduce dark application surfaces outside navigation and priority panels. Do not wrap every section in another card, use ornamental icon tiles, invent padding values, or add a new color because a route feels visually empty.
