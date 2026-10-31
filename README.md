# Elevate Builders — Official Corporate Website System

High-specification corporate website for **Elevate Builders Company** (Commercial Registration: `7049953909`), civil engineering, infrastructure, and commercial contractor based in Al Murabba District, Riyadh, Kingdom of Saudi Arabia.

Governed under verified **ISO 9001:2015**, **ISO 14001:2015**, and **ISO 45001:2018** integrated management systems.

---

## Architecture & Technology Stack

- **Design System:** Engineered architectural token palette (`#080237`, `#6C5C3E`, `#FAF9F5`, `#E4E2DC`), 0px border radii, hairline dividers, editorial typography (`Newsreader` + `IBM Plex Sans`).
- **Core Pages:**
  - `index.html` — Homepage featuring interactive hero registry, "What we do", dual-stream infinite logo marquees ("Clients we've worked with" & "Our Partners"), and RFQ desk.
  - `about.html` — Corporate background, executive leadership, organizational structure.
  - `services.html` — Civil & structural, infrastructure, finishing & fit-out, manpower supply.
  - `projects.html` — 9-plate portfolio gallery with native swipeable CSS scroll-snap photo carousels and category filters (`All`, `Infrastructure`, `Commercial`, `Housing`, `Water`, `Telecom`).
  - `credentials.html` — ISO quality standards, Chamber of Commerce certification, Ministry of Commerce CR registry standing.
  - `contact.html` — Project specification docket, RFQ submission desk, and interactive Riyadh HQ map with live location status.
  - `project-detail.html` — In-depth architectural case study template.
- **Motion & Interactions:**
  - Native CSS scroll-snap horizontal carousels with keyboard navigation & ARIA accessibility (`assets/projects/carousel.js`).
  - Choreographed viewport reveal transitions, scroll progress bar, and animated statistics counters (`assets/motion.js`, `assets/motion.css`).
  - Centralized projects gallery data store (`assets/projects/projects-data.js`).
- **Local Dev Server:** Built-in Node.js HTTP server (`server.js`) with clean extension-free routing.

---

## Local Development

```bash
# Start the local development server (port 3000)
node server.js
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

