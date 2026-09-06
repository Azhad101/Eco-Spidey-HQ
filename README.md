# Eco-Spidey HQ — Delhi Civic Command & Analytics Center
### Clean, Simple HTML/CSS/JavaScript Standalone Edition for VS Code

This folder contains the standalone, beginner-friendly **HTML, CSS, and Vanilla JavaScript** version designed to be easily opened and run directly in **VS Code** with Live Server or by double-clicking `index.html`.

---

## 🌟 Features Implemented

1. **Supabase & LocalStorage Base for Reports**:
   - Stores issue descriptions, titles, locations, categories, priorities, and photo evidence.
   - Connected directly to Supabase (`cleanup_reports` table) with automatic fallback to persistent `localStorage`.
   - On page load, existing records from Supabase and local storage are synchronized and plotted on the map.

2. **Interactive Delhi Map (Leaflet.js)**:
   - Centered on Delhi (28.6139° N, 77.2090° E).
   - Dynamic status markers:
     - 🔴 **Red**: `Reported`
     - 🟡 **Amber**: `In Progress` (Squad deployed)
     - 🟢 **Green**: `Resolved` (Verified clean)
   - Interactive popups showing descriptions, photos, status, and community upvotes.

3. **Status Lifecycle Tracking**:
   - `Reported` → `In Progress` (Deploy Squad) → `Resolved` (Mark Verified Clean).
   - Real-time updates with immediate status filtering buttons (`All`, `Reported`, `In Progress`, `Resolved`).

4. **Community Upvoting System**:
   - Upvote civic issues affecting multiple citizens with instant tally updates and persistent storage.

5. **Real-time Analytics Engine for Municipal Authorities**:
   - KPI metrics: Total logged issues, active investigations, cleanups resolved, and overall resolution rate.
   - Sector distribution meter for top Delhi hotspots (Connaught Place, India Gate, Chandni Chowk, Hauz Khas).
   - Waste category breakdown (Garbage Dumps, Plastics, Waterway blocks).
   - **One-click Export**: Download complete civic intelligence report in JSON format for municipal authorities.

6. **Spider-Man Tactical Action Poses Slider**:
   - Interactive carousel featuring 4 distinct cropped action poses from `eco-spidey-poses.png`:
     - **Pose 01**: The Skyline Crawl (Ground Recon & Perimeter Sweep)
     - **Pose 02**: The Superhero Landing (Rapid Hotspot Touchdown)
     - **Pose 03**: Webline Transit (High-Speed Waste Canister Transit)
     - **Pose 04**: Webshot Containment (Active Hazard Biodegradable Webbing)
   - Smooth navigation controls (previous/next arrows and indicators).

7. **Big Background Spider Logo with Chromatic Aberration Glitch**:
   - Fixed ambient Spider-Man emblem centered in the background with Spider-Verse glitch animation and neon glow.
   - Subtle opacity so it never hinders reading or interacting with the UI.
   - Glitch animated logos in headers, footers, and section headers.

---

## 🚀 How to Run in VS Code

1. Open **VS Code**.
2. Open this folder: `html-version/`.
3. Right-click `index.html` and select **"Open with Live Server"** (or simply double-click `index.html` in Windows Explorer).
4. No dependencies, bundlers, or Node.js installation required!
