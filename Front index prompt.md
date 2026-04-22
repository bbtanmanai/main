Create a personal academic landing page / portfolio for a graduate student or Ph.D. researcher.

I want you to keep the overall visual design language, layout structure, cinematic atmosphere, liquid-glass UI, dark space theme, typography hierarchy, and responsive behavior from the original "Orbis.Nft" style landing page.

However, this should no longer feel like an NFT page.
Instead, reinterpret it as a premium personal landing page for a graduate student, researcher, or Ph.D. candidate.

The final result should feel:
- futuristic
- elegant
- minimal
- intellectual
- cinematic
- research-driven

Do not make it look like a startup SaaS page.
Do not make it look playful or childish.
Do not make it look like a generic resume site.
It should feel like a high-end academic portfolio / landing page.

-----------------------------------
FRAMEWORK / STACK
-----------------------------------

- Framework: React + TypeScript + Vite + Tailwind CSS
- Icons: lucide-react
- No extra packages beyond standard Vite + React + Tailwind setup
- Responsive: mobile-first
- Max content width: 1831px
- Keep the same 4-section layout
- Keep the liquid-glass UI effect
- Keep the texture overlay
- Keep video backgrounds in the same places as the reference design
- All videos should use autoPlay loop muted playsInline

-----------------------------------
FONTS
-----------------------------------

Use Google Fonts exactly like this:

- Anton → for all headings and navigation text (alias: font-grotesk in Tailwind)
- Condiment → for cursive accent / overlay text (alias: font-condiment)
- System monospace font → for body text (font-mono)

Load in index.html:
https://fonts.googleapis.com/css2?family=Anton&family=Condiment&display=swap

-----------------------------------
COLOR SYSTEM
-----------------------------------

Use the exact same color system:

- Background: #010828
- cream: #EFF4FF
- neon: #6FFF00

Use:
- cream for most text
- neon for accent cursive text and underline bars
- background as the main deep dark navy

-----------------------------------
LIQUID GLASS EFFECT
-----------------------------------

Use this exact CSS and preserve the same appearance:

.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.45) 0%,
    rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%,
    rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%,
    rgba(255,255,255,0.45) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

Apply this class to:
- navbar
- icon buttons
- research/project cards
- overlay bars
- final CTA icon stack

-----------------------------------
TEXTURE OVERLAY
-----------------------------------

Keep a full-screen fixed texture overlay above everything:
- z-50
- pointer-events-none
- use /texture.png
- mix-blend-mode: lighten
- opacity: 0.6
- background-size: cover
- full viewport coverage

-----------------------------------
SOURCE MATERIAL / INPUT RULES
-----------------------------------

I will provide a CV/resume below.

Your job is to:
1. extract the person’s academic identity, research area, strengths, and tone
2. convert the CV into concise landing-page copy
3. preserve the same premium visual structure from the reference design
4. avoid dumping raw CV text
5. transform the CV into a polished researcher narrative

Important rules:
- Do NOT paste the CV verbatim into the page
- Do NOT create long paragraphs
- Do NOT create a crowded resume layout
- Do NOT include every detail from the CV
- Instead, summarize and curate the most impressive information

You should identify and prioritize:
- name
- current position / degree
- institution
- main research themes
- selected achievements
- selected publications / patents / awards / projects if relevant
- contact / online presence if available

If the CV is weak or sparse, still make the page look impressive through phrasing and structure.
If the CV is strong, keep the tone restrained and premium, not boastful.

-----------------------------------
SECTION 1: HERO
-----------------------------------

Keep the same hero composition as the original design:
- full viewport
- full-bleed looping muted autoplay video background
- rounded bottom corners
- centered max-width container
- logo on left
- liquid-glass nav in center
- social icons on right (desktop) / below heading (mobile)

Use this background video:
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4

Header:
- left logo text = person’s name
- center nav = 5 menu items adapted to the CV
- right social icons = Mail, Twitter/X, Github or LinkedIn depending on context
- hidden nav on mobile, same as original

Navigation labels should be chosen from the CV and should feel appropriate.
Examples:
- HOME
- ABOUT
- RESEARCH
- PUBLICATIONS
- PROJECTS
- AWARDS
- CONTACT

Hero heading:
Create a large cinematic heading in Anton based on the person’s research identity.
It should be 3–5 short lines, all uppercase, and feel bold but not cheesy.

Examples of heading style:
- ENGINEERING INTELLIGENCE FOR COMPLEX SYSTEMS
- DESIGNING MATTER, DATA, AND MOTION
- BUILDING THE FUTURE OF HUMAN-CENTERED AI
- EXPLORING BIOLOGY THROUGH COMPUTATION
- RESEARCHING SYSTEMS BEYOND CONVENTION

Do not use generic phrases like “welcome to my portfolio”.

Accent cursive text:
Use Condiment in neon green for a short overlay phrase related to the field.
Examples:
- Research portfolio
- PhD journey
- Graduate researcher
- Robotics & AI
- Biomedical science
- Computational design

Place it similarly to the original decorative accent text.

Social icons:
Use Mail, Twitter/X, Github, or LinkedIn depending on the academic field and the information available.
If no social links are available, still render placeholder links cleanly.

-----------------------------------
SECTION 2: ABOUT / INTRO
-----------------------------------

Keep the same full-viewport background video section and same layout logic.

Use this background video:
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4

Top-left heading:
Create a strong intro heading based on the person’s profile.

Examples:
- HELLO! I’M [NAME]
- [NAME], RESEARCHER
- ABOUT THE RESEARCH
- WORKING AT THE EDGE OF [FIELD]

Overlay a Condiment accent word in neon green such as:
- Researcher
- Scientist
- Engineer
- Scholar
- Builder

Top-right paragraph:
Write a short uppercase monospace research statement based on the CV.
This should be around 1–3 short sentences max.
It should summarize:
- current degree/status
- institution
- field
- what kind of problems they work on

Bottom row:
Keep the decorative faint-text layout from the original.
Instead of visible informational text, use repeated low-opacity keyword clusters extracted from the CV.

Examples:
- MACHINE LEARNING / CAUSAL INFERENCE / HEALTH DATA / FAIRNESS
- SOFT ROBOTICS / BIOINSPIRED DESIGN / ACTUATION / FABRICATION
- URBAN COMPUTING / GIS / MOBILITY / POLICY / DATA MODELING
- MATERIALS / ENERGY STORAGE / THIN FILMS / INTERFACES

The bottom row is decorative, not meant for dense reading.

-----------------------------------
SECTION 3: FEATURED WORK GRID
-----------------------------------

Keep the same section layout as the original NFT collection grid, but reinterpret it as featured research / selected work.

Background:
- solid #010828

Header left:
Create a heading like:
- SELECTED RESEARCH
- FEATURED WORK
- CURRENT DIRECTIONS
- RESEARCH HIGHLIGHTS

One key word may be in Condiment neon green, similar to the original line-break structure.

Header right:
Keep the same bold button composition, but change text to something like:
- SEE ALL WORK
- VIEW FULL CV
- EXPLORE PROJECTS
- READ PUBLICATIONS

Keep the neon underline bar.

Grid:
- 3 cards
- 1 column mobile / 2 tablet / 3 desktop
- same gap and same liquid-glass style
- same square video format
- same overlay bar and purple arrow button

Use these same 3 videos:
1. https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4
2. https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4
3. https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4

Each card should represent one curated category based on the CV.
Choose the best 3 from things like:
- Research area 1
- Research area 2
- Research area 3
- Publications
- Patents
- Awards
- Projects
- Teaching
- Fieldwork
- Industry collaboration
- Startup / entrepreneurship
- Methods / tools

Each card should include:
- a concise title
- optionally 1 short descriptive subtitle or tag
- bottom overlay label + value

Examples of overlay label/value:
- RESEARCH FOCUS: HUMAN-AI INTERACTION
- SELECTED AREA: SOFT ROBOTICS
- HIGHLIGHT: 12 PUBLICATIONS
- IMPACT: 4 PATENTS
- METHOD: COMPUTATIONAL MODELING
- EXPERIENCE: INDUSTRY + RESEARCH

Do not overload the cards with too much text.
Keep them highly visual and premium.

-----------------------------------
SECTION 4: FINAL CTA / CONTACT
-----------------------------------

Keep the same final section structure:
- native-aspect video
- absolute text overlay
- bottom-left social stack
- cinematic closing statement

Use this video:
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4

Do not use object-cover.
Use:
- w-full
- h-auto
- block

Accent cursive text:
Use a short phrase like:
- Explore more
- Let’s connect
- Further signals
- Beyond the page

Heading:
Create a final multi-line CTA based on the CV.
Examples:
- LET’S BUILD WHAT COMES NEXT.
- READ THE WORK. FOLLOW THE RESEARCH.
- CONNECT, COLLABORATE, AND EXPLORE.
- FROM IDEAS TO IMPACT.
- RESEARCHING WHAT MATTERS NEXT.

This should feel elegant, not salesy.

Bottom-left icon stack:
Keep the same vertical liquid-glass stacked icon component.
Use social/contact icons appropriate for the person.

-----------------------------------
CONTENT TRANSFORMATION LOGIC
-----------------------------------

When converting the CV into page content, follow these rules:

1. HERO
Turn the person’s academic identity into a bold positioning statement.

2. ABOUT
Summarize their current role, institution, field, and research direction in a concise and intelligent way.

3. FEATURED GRID
Select the 3 strongest “story buckets” from the CV.
Examples:
- research themes
- publication record
- patents
- technical skills
- startup experience
- teaching
- awards
- interdisciplinary impact

4. FINAL CTA
End with a statement that feels like an invitation to explore the researcher’s work or connect professionally.

-----------------------------------
STYLE RULES
-----------------------------------

- Preserve the original premium visual DNA
- Use uppercase for most text
- Keep Condiment accents in normal case
- Keep typography dramatic and spacious
- Do not clutter the page
- Do not create dense biography sections
- Do not use tables
- Do not use timeline-heavy resume blocks
- Do not make the page feel like LinkedIn
- Do not make it feel corporate
- Keep it cinematic, premium, intelligent, and minimal

-----------------------------------
IMPLEMENTATION DETAILS
-----------------------------------

Please build:
- a single-page React component
- reusable arrays for nav items, social links, and featured cards
- text constants near the top of the file for easy editing
- clean Tailwind structure
- semantic HTML where appropriate
- polished responsive behavior faithful to the original design

-----------------------------------
OUTPUT REQUIREMENT
-----------------------------------

Use the CV below as the source of truth and generate the landing page content accordingly.

If some information is missing:
- infer cautiously
- keep the language broad and elegant
- do not fabricate specific achievements

At the end, output the full React + TypeScript + Tailwind component.

-----------------------------------
CV / RESUME INPUT
-----------------------------------

[PASTE CV HERE]