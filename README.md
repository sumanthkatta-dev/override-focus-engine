
# Override

![Category](https://img.shields.io/badge/Category-Digital_Wellbeing-purple?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-Chrome_Manifest_V3-blue?style=for-the-badge)
![Impact](https://img.shields.io/badge/Focus-Deep_Work-success?style=for-the-badge)

> **The Attention Firewall:** A browser extension that performs surgical DOM manipulation to remove addictive "Variable Reward" loops (Reels, Shorts) without blocking the entire site.

## Impact: Before vs. After

### Before (Distracted)
![Distracted Feed](./before-preview.png)
*(Standard Interface: Cluttered with addictive Shorts shelf and sidebar recommendations)*

### After (Focused)
![Focused Feed](./after-preview.png)
*(Override Enabled: Distraction vectors surgically removed; core utility remains intact)*

## The Problem: Algorithmic Fragmentation
Social media platforms use **Variable Reward Schedules** to fragment user attention. For professionals who use LinkedIn or YouTube for research, it is nearly impossible to avoid "doom-scrolling" traps like Shorts or Infinite Feeds, leading to significant lost work hours.

## The Solution
Unlike standard blockers that ban an entire domain, **Override** parses the HTML and selectively removes only the distraction vectors while keeping the utility intact.

1.  **Surgical Removal:** Uses CSS injection to hide distraction vectors (`ytd-rich-shelf-renderer`, `Reels Container`) before they render.
2.  **Active Monitoring:** A `MutationObserver` watches for dynamic content loading (SPAs) and kills distractions instantly.
3.  **Focus Protocol:** A state-managed toggle lets you enable/disable the firewall based on your current workflow.

## Tech Stack
* **Chrome Extension Manifest V3**
* **Advanced CSS Selectors** (`display: none !important`)
* **JavaScript MutationObserver API** (For SPA changes)
* **Chrome Storage API** (State Management)

---

## File Structure

```text
override/
├── manifest.json        # Extension configuration (Manifest V3)
├── background.js        # Service worker for state management
├── content.js           # Main logic (MutationObserver & DOM control)
├── styles.css           # CSS rules for hiding distraction elements
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file

```

## Development Phases

* **Phase 1:** Project Setup & Manifest V3 Configuration
* **Phase 2:** CSS Injection Logic (The "Hiding" Engine)
* **Phase 3:** MutationObserver Integration (Handling Infinite Scroll)
* **Phase 4:** User Interface Popup (Toggle Switch)

---

## Installation (Developer Mode)

1. Clone the repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer Mode** (Toggle in top right).
4. Click **Load Unpacked** and select this folder.

---

*Developed by Sumanth Katta | Jan 2026*

