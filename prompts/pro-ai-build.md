# PRO AI BUILD PROMPT — Premium Education Dashboard
**Use this prompt in: Cline (recommended) or Kilo Code — paste as-is into a fresh task on an empty/new project folder.**

---

## ROLE & QUALITY BAR

You are a senior product designer + senior frontend engineer building a **premium, production-grade educational platform dashboard**. This is not a prototype — treat it like a real SaaS product being shipped to paying users. No placeholder-looking UI, no default Bootstrap/unstyled components, no lorem-ipsum-grade spacing decisions. Every screen must look like it belongs to a funded EdTech startup.

**Non-negotiable quality rules:**
- No compromise on visual polish for the sake of speed. Take the time needed.
- Fully responsive: mobile (320px+), tablet, laptop, large desktop. Test every breakpoint mentally before finalizing each component.
- Smooth micro-interactions everywhere (hover, focus, active, loading states) — but nothing gimmicky or laggy.
- Accessible: proper contrast ratios, keyboard navigation, ARIA labels, focus rings.
- Clean component architecture — don't cram everything into one file. Reusable components, clear folder structure.
- Real, working interactivity for everything described below — not static mockup images.

---

## TECH STACK

- React (Vite) + TypeScript
- Tailwind CSS (with a custom design token config — see Theme section)
- Framer Motion for animations/transitions
- Lucide React for icons
- React Router for page/section navigation
- Local component state + Context API for theme and search state (no backend required — use mock JSON data structured so it's trivial to swap for a real API later)

---

## 1. DESIGN SYSTEM — "PREMIUM NATURE" THEME

Build a full Tailwind design-token setup (colors, spacing, radii, shadows, typography scale) around a **nature-inspired premium palette**. Avoid generic SaaS purple/blue. Target feel: calm, focused, trustworthy, high-end — like a premium wellness or nature-tech brand crossed with a study tool.

**Color direction (define exact hex values in tailwind.config, both light & dark variants):**
- Primary: deep forest green (e.g. `#1B4332` / `#2D6A4F` range) with a vibrant leaf-green accent (`#40916C` / `#52B788`) for CTAs and active states
- Secondary/accent: warm amber/gold (`#D4A373` range) used sparingly for premium badges, highlights, "locked" indicators
- Neutrals: warm off-white / stone tones for light mode backgrounds (not stark white), deep charcoal-green-tinted dark (not pure black) for dark mode
- Gradients: subtle mesh/organic gradients (forest green → teal → soft gold) used behind hero/dashboard header sections, never harsh or neon
- Success/error/info states colored to stay within the nature palette family (moss green success, muted clay red error, sky blue info)

**Typography:**
- A refined sans-serif pairing: one display font for headings (e.g. a geometric/humanist sans with character), one clean workhorse font for body text
- Clear type scale (display, h1–h4, body-lg, body, caption)

**Elevation & texture:**
- Soft, layered shadows (never harsh drop-shadows) — glassmorphism touches allowed on cards/header (subtle backdrop-blur + translucency) but keep it tasteful, not overdone
- Rounded corners consistently (define a radius scale — sharper for buttons, softer for cards)
- Subtle organic/leaf-motif SVG background textures at low opacity in hero and footer sections only — never behind readable content blocks

**Dark mode:** Fully designed second theme, not just inverted colors — genuinely tuned for both light and dark, with smooth animated toggle transition (no jarring flash).

---

## 2. HEADER (Global, Sticky)

Build a premium sticky header, fixed at top, with backdrop-blur-on-scroll effect (transparent at top of page, frosted-glass solid on scroll).

**Contents, left to right:**
1. **Logo/brand mark** (left) — text or simple mark, clickable to home
2. **Global Search Bar** (center, prominent — this is a hero feature, give it real width and visual weight):
   - Placeholder text like "Search chapters, topics, concepts, statements..."
   - As the user types, results appear in a dropdown panel below the bar, and **each result row must show a small tag/badge indicating what kind of result it is**: `Subject`, `Chapter`, `Topic`, `Concept`, or `Statement` — each tag gets its own subtle color coding
   - Below/beside the live results, include a **"Recommended for you"** section in the same dropdown (based on mock "recently viewed" or "trending" data) — shown even before the user types, and updates contextually while typing
   - Include a **powerful filter control** attached to the search bar (a filter icon that opens a panel): filter by Class (11/12), Subject, Content Type (Book/Note/Idiom/History/etc.), Difficulty, Locked/Unlocked status, and a "Clear all filters" action. Filters should be combinable (multi-select), with active filter count shown as a badge on the filter icon.
   - Keyboard support: `/` or `Cmd+K` to focus search, arrow keys to navigate results, `Esc` to close
3. **Quick access icons/buttons** (right side, all reachable directly from header, no burger-menu hiding on desktop):
   - Theme toggle (sun/moon animated icon, smooth transition)
   - Notifications bell (with badge count)
   - Bookmarks/Saved items
   - Quick Question mode trigger (see section 5)
   - User/profile avatar with dropdown (Profile, Settings, Upgrade to Premium, Logout)
   - "Upgrade to Premium" pill button — visually distinct (gold gradient), stands out from the rest of the header
4. **Mobile behavior:** condense into a clean icon bar + expandable search; use a slide-in drawer for the remaining quick-access items — but the search bar and theme toggle should remain reachable within one tap, never buried three menus deep.

---

## 3. DASHBOARD SECTION (Premium Overview, below header)

This is the main landing area after header. Nature-vibe premium color treatment throughout (soft gradient hero backdrop as described in design system).

**Include:**
- A welcoming hero/greeting strip: personalized greeting (mock user name), current streak or progress stat, and a subtle motivational line
- A **stats/overview row** of 3–4 premium stat cards (glassmorphism style): e.g. "Topics Completed," "Current Streak," "Weak Areas," "Time Studied This Week" — each with a small trend indicator (up/down arrow + %) and a tiny sparkline chart
- A **continue where you left off** card carousel — horizontally scrollable on all devices, showing recently accessed chapters/topics with progress bars

---

## 4. MID SECTION — "CHOOSE YOUR PATH"

Section heading: **"Choose Your Path"** — styled as a clear visual section break, premium heading treatment (maybe with the leaf-motif accent).

Build this as a grid of **premium path cards**. Each card should feel tactile — hover lift + glow effect (nature-toned glow, e.g. soft green/gold glow, not generic blue).

**Path cards required (in this arrangement, grouped visually):**

Group 1 — Class 11:
- Class 11 (Nepali medium/general)
- Class 11E (English medium)
- Class 11 More (expandable — additional streams/options)

Group 2 — Class 12:
- Class 12
- Class 12E (English medium)
- Class 12 More

Group 3 — General/Competitive:
- Lok Sewa Knowledge
- General Knowledge

**Each card contains:**
- An icon or small illustration (nature/education themed, consistent icon style)
- Title + one-line description
- A small progress indicator if the user has started that path
- A "Premium" gold badge if any content inside is locked (see locking rules below — badge indicates *some* locked content exists inside, doesn't block entry to the card itself)

Below/alongside the path cards, include a **content-type row**: `Books`, `Notes`, `Idioms`, `History` — each as its own card/tile, and **each of these must have a visible "+" / "Add category" affordance inside its own tile** (so users — or admins — can see there's room to create more categories inside that type). This "add more" option should look like a natural extension of the grid (dashed-border ghost card at the end of each row), not a separate awkward button.

**CRITICAL LOCKING RULE:** Nothing should look locked or restricted at the top-level card/tile view (path cards, content-type tiles). Users click into a card freely. **Only once inside** a path/content section, individual chapters/topics/notes that are premium-only show a lock icon, a blurred/grayed preview of the content, and an "Upgrade to unlock" inline prompt — locking is always shown *inside* content, never as a barrier on the outer navigation cards.

---

## 5. QUICK QUESTION BOX (Floating feature)

A floating action button (bottom-right, nature-green with soft pulse animation to draw attention subtly) that opens a **"Quick Question"** panel/modal:
- Pulls a random MCQ generated from the available mock content (subject/chapter/topic pool)
- Shows the question, 4 answer options
- **User has 4 seconds to answer** — a visible circular countdown ring around the panel edge or a slim progress bar at the top, animating down
- If answered correctly within time: satisfying success animation (confetti burst in the nature palette — green/gold, not rainbow)
- If time runs out or wrong: gentle correct-answer reveal, brief explanation line, and a "Try another" button
- Should be dismissible anytime, non-blocking, and not intrusive — closeable with `Esc` or an X
- Track a simple mock streak counter for quick questions answered correctly

---

## 6. FOOTER

Rich, premium footer — not a bare link list. Structure:

**1. Creator Intro Block (top of footer, visually distinct sub-section):**
- Label: "Owner ~ Creator" with a **forward arrow (→)** and a **glowing animated effect** on hover/idle-pulse
- Name: **Ravikisan**
- Directly below the name: credentials/affiliation tags — **NEB, CDC** — each as a small linked badge/pill (link placeholders, styled distinctly, e.g. outlined pills)
- Below that: a short description line about the creator/credentials (placeholder text, editable)
- Below that: **2–3 short inspirational paragraphs** addressed to the audience/students (placeholder inspirational copy about learning, growth, persistence — written in a warm, motivating tone, nature-metaphor friendly, e.g. growth/roots/seasons imagery to match the theme)

**2. Standard footer columns:** Quick links (About, Contact, Privacy, Terms), Content links (Books, Notes, Idioms, History), Social icons

**3. Bottom bar (final line, centered, standout styling):**
- "Designed and developed by: **Ravikisan**" — name has the **glowing effect**
- Tagline directly below or beside it: **"Knowledge is Power"** — also with the **glowing effect**
- Both glow effects should use the nature-gold accent color, subtle CSS `text-shadow`/`filter: drop-shadow` pulse animation — elegant, not tacky neon

---

## 7. GLOBAL POLISH CHECKLIST (verify before considering this done)

- [ ] Every interactive element has hover/focus/active states
- [ ] Page transitions and card entrances use subtle Framer Motion fade/slide-up (staggered on grids)
- [ ] Loading skeletons (not spinners alone) for any async-feeling content
- [ ] Empty states designed (e.g. no search results) — on-brand illustration + helpful text, not a bare "No results"
- [ ] All locked-content indicators live *inside* sections only, never on outer navigation
- [ ] Fully keyboard navigable and screen-reader sane
- [ ] Tested visually at 320px, 375px, 768px, 1024px, 1440px, 1920px
- [ ] Dark mode fully styled, not just inverted
- [ ] No console errors/warnings on run
- [ ] Component folder structure is clean: `/components`, `/data` (mock content), `/context` (theme, search), `/hooks`, `/pages`

---

## DELIVERY INSTRUCTIONS FOR THE AI AGENT

1. Scaffold the project first (Vite + React + TS + Tailwind + Framer Motion + Lucide + React Router).
2. Set up the full design token system in `tailwind.config` before building any component.
3. Build in this order: Theme context → Header/Search/Filter → Dashboard hero/stats → Path cards mid-section → Content-type tiles with locking → Quick Question floating widget → Footer.
4. Use realistic mock data (at least a handful of subjects/chapters/topics/concepts/statements per class) so the search and filter genuinely return varied, tagged results — don't leave search functionally empty.
5. After building, do a self-review pass against the Global Polish Checklist above and fix anything missing.
6. Confirm the app runs cleanly with `npm run dev` and works across the breakpoints listed.

**Do not ship anything that looks like a template or an unstyled scaffold. Every section above must reflect the premium nature-themed identity consistently.**