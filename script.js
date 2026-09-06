/* ========================================================
   ECO-SPIDEY HQ — DELHI CIVIC COMMAND & ANALYTICS SCRIPT
   Features:
   - LocalStorage base for persistent issues & photos
   - Interactive Leaflet map with colored status pins
   - Status Tracking (Reported → In Progress → Resolved)
   - Upvoting system for community priority
   - Real-time Analytics Engine for Municipal Authorities
   ======================================================== */

// Supabase Configuration
const SUPABASE_URL = "https://vqnfuvtvuttrghdodlgo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WPIIGbNduk1leQGXeG_1bw_l6oDVsS7";
let supabaseClient = null;

if (typeof window !== "undefined" && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("Supabase init error:", e);
  }
}

// Storage Key
const STORAGE_KEY = "eco_spidey_delhi_civic_issues";

// Default Seed Data for Delhi if Storage is Empty
const defaultIssues = [
  {
    id: "delhi-1",
    title: "Overflowing Commercial Bins & Plastics",
    location: "Connaught Place (Inner Circle, Block C)",
    category: "Garbage Dump",
    severity: "critical",
    status: "reported", // reported | in_progress | resolved
    upvotes: 42,
    lat: 28.6304,
    lng: 77.2177,
    description: "Plastic packaging and uncollected commercial bins overflowing onto the pedestrian pathway.",
    photo: "assets/eco-spidey-hero.png",
    timestamp: "2026-09-06 09:30"
  },
  {
    id: "delhi-2",
    title: "Tourist Waste & Plastic Bottles Post-Event",
    location: "India Gate Lawn Circle",
    category: "Plastic Waste",
    severity: "amber",
    status: "in_progress",
    upvotes: 35,
    lat: 28.6129,
    lng: 77.2295,
    description: "Heavy plastic bottle accumulation near park lawns. Eco-Spidey crew deployed with bags.",
    photo: "assets/eco-spidey-poses.png",
    timestamp: "2026-09-06 11:15"
  },
  {
    id: "delhi-3",
    title: "Market Debris & Carton Waste",
    location: "Chandni Chowk (Near Red Fort crossing)",
    category: "Illegal Dump",
    severity: "critical",
    status: "reported",
    upvotes: 59,
    lat: 28.6505,
    lng: 77.2303,
    description: "Construction rubble and mixed marketplace packing material blocking vehicle lane.",
    photo: "assets/eco-spidey-emblem.png",
    timestamp: "2026-09-06 08:00"
  },
  {
    id: "delhi-4",
    title: "Park Lake Verge Cleanup",
    location: "Hauz Khas Village Lake Border",
    category: "Waterway Waste",
    severity: "clear",
    status: "resolved",
    upvotes: 78,
    lat: 28.5494,
    lng: 77.2001,
    description: "Entire perimeter cleared of beverage cans and single-use packaging. Verified clean.",
    photo: "assets/eco-spidey-poses.png",
    timestamp: "2026-09-05 17:45"
  }
];

// Global Map Instance
let leafletMap = null;
let currentMarkers = [];
let currentFilter = "all";

// Base64 storage for newly uploaded photo
let currentUploadedPhoto = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  initDelhiMap();
  renderIssuesList();
  updateAnalytics();
  initFormHandler();
  initFilterButtons();
  initPosesSlider();
  syncFromSupabase();
});

/**
 * 1. Initialize Local Storage & Supabase Sync
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultIssues));
  }
}

async function syncFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from("cleanup_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch notice:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const remoteIssues = data.map((r) => {
        let statusVal = "reported";
        if (r.status === "in_progress" || r.status === "resolved") {
          statusVal = r.status;
        }

        return {
          id: r.id,
          title: `${r.report_type || "Civic Sighting"} at ${r.location}`,
          location: r.location,
          category: r.report_type || "Garbage Dump",
          severity: r.severity || "amber",
          status: statusVal,
          upvotes: Math.floor(Math.random() * 10) + 5,
          lat: 28.6139 + (Math.random() - 0.5) * 0.08,
          lng: 77.2090 + (Math.random() - 0.5) * 0.08,
          description: r.note || "Civic sighting recorded to Supabase database.",
          photo: r.photo_url || "assets/eco-spidey-hero.png",
          timestamp: r.created_at ? new Date(r.created_at).toLocaleString() : "Recently"
        };
      });

      const local = getIssues();
      const existingIds = new Set(local.map(i => i.id));
      const toAdd = remoteIssues.filter(ri => !existingIds.has(ri.id));

      if (toAdd.length > 0) {
        saveIssues([...toAdd, ...local]);
      }
    }
  } catch (err) {
    console.warn("Could not sync from Supabase:", err);
  }
}

function getIssues() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultIssues;
  } catch (e) {
    console.error("Storage error:", e);
    return defaultIssues;
  }
}

function saveIssues(issues) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  renderIssuesList();
  renderMapMarkers();
  updateAnalytics();
}

/**
 * 2. Initialize Leaflet Map
 */
function initDelhiMap() {
  const mapElement = document.getElementById("delhi-map");
  if (!mapElement || typeof L === "undefined") return;

  // Center on Delhi (28.6139° N, 77.2090° E)
  leafletMap = L.map("delhi-map", {
    zoomControl: false,
    scrollWheelZoom: false
  }).setView([28.6139, 77.2090], 12);

  L.control.zoom({ position: "bottomright" }).addTo(leafletMap);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors | Eco-Spidey HQ",
    maxZoom: 19
  }).addTo(leafletMap);

  renderMapMarkers();
}

/**
 * 3. Render Markers on Map based on Current Filter
 */
function renderMapMarkers() {
  if (!leafletMap || typeof L === "undefined") return;

  // Clear existing markers
  currentMarkers.forEach(m => leafletMap.removeLayer(m));
  currentMarkers = [];

  const issues = getIssues();
  const filtered = currentFilter === "all" ? issues : issues.filter(i => i.status === currentFilter);

  filtered.forEach(issue => {
    // Status color
    let color = "#ef3340"; // reported: Red
    let statusLabel = "Reported";
    if (issue.status === "in_progress") {
      color = "#f59e0b"; // In Progress: Amber
      statusLabel = "In Progress";
    } else if (issue.status === "resolved") {
      color = "#10b981"; // Resolved: Green
      statusLabel = "Resolved";
    }

    const marker = L.circleMarker([issue.lat, issue.lng], {
      radius: issue.status === "reported" ? 11 : 8,
      color: color,
      fillColor: color,
      fillOpacity: 0.85,
      weight: 2
    }).addTo(leafletMap);

    // Popup Content with Image Thumbnail & Interactive Upvote
    const popupContent = `
      <div style="font-family: sans-serif; min-width: 200px; color: #111;">
        ${issue.photo ? `<img src="${issue.photo}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;" alt="Proof">` : ""}
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${color};">${statusLabel}</div>
        <strong style="font-size: 13px; display: block; margin: 2px 0;">${issue.title}</strong>
        <div style="font-size: 11px; color: #555; margin-bottom: 6px;">${issue.location}</div>
        <p style="font-size: 11px; color: #333; line-height: 1.3; margin: 4px 0 8px;">${issue.description}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 6px;">
          <span style="font-size: 11px; font-weight: bold;">🔺 ${issue.upvotes} Citizens</span>
          <button onclick="window.handleUpvote('${issue.id}')" style="background: #ef3340; color: #fff; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer; font-weight: bold;">+1 Upvote</button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    currentMarkers.push(marker);
  });
}

/**
 * 4. Render Issues Scroll List & Status Workflow
 */
function renderIssuesList() {
  const container = document.getElementById("issues-list-container");
  if (!container) return;

  const issues = getIssues();
  const filtered = currentFilter === "all" ? issues : issues.filter(i => i.status === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--color-muted); font-size: 13px;">
        🕷️ No civic issues match the "${currentFilter}" filter in Delhi.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(issue => {
    let badgeClass = "badge-reported";
    let badgeText = "Reported";
    let nextActionBtn = `<button class="btn btn-sm btn-secondary" onclick="window.changeIssueStatus('${issue.id}', 'in_progress')">Mark In Progress &rarr;</button>`;

    if (issue.status === "in_progress") {
      badgeClass = "badge-progress";
      badgeText = "In Progress";
      nextActionBtn = `<button class="btn btn-sm btn-primary" style="background-color: #10b981;" onclick="window.changeIssueStatus('${issue.id}', 'resolved')">Mark Resolved ✓</button>`;
    } else if (issue.status === "resolved") {
      badgeClass = "badge-resolved";
      badgeText = "Resolved";
      nextActionBtn = `<span style="font-size: 10px; color: #10b981; font-weight: 800;">✓ VERIFIED CLEAN</span>`;
    }

    return `
      <div class="issue-card" id="card-${issue.id}">
        <div class="issue-top">
          <div>
            <span class="status-badge ${badgeClass}">${badgeText}</span>
            <div class="issue-title" style="margin-top: 6px;">${issue.title}</div>
            <div class="issue-location">📍 ${issue.location} • <span style="color: var(--color-electric);">${issue.category}</span></div>
          </div>
          <button class="btn-upvote" onclick="window.handleUpvote('${issue.id}')">
            🔺 <span>${issue.upvotes}</span>
          </button>
        </div>

        <p class="issue-desc">${issue.description}</p>

        ${issue.photo ? `<img src="${issue.photo}" alt="Report Photo" class="issue-img-thumb">` : ""}

        <div class="issue-footer">
          <span style="font-size: 10px; color: var(--color-muted);">${issue.timestamp || "Just now"}</span>
          <div>${nextActionBtn}</div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * 5. Global Actions: Upvoting & Status Transitions
 */
window.handleUpvote = function(issueId) {
  const issues = getIssues();
  const index = issues.findIndex(i => i.id === issueId);
  if (index !== -1) {
    issues[index].upvotes += 1;
    saveIssues(issues);
  }
};

window.changeIssueStatus = function(issueId, newStatus) {
  const issues = getIssues();
  const index = issues.findIndex(i => i.id === issueId);
  if (index !== -1) {
    issues[index].status = newStatus;
    saveIssues(issues);
  }
};

/**
 * 6. Analytics Engine for Municipal Authorities
 */
function updateAnalytics() {
  const issues = getIssues();

  const total = issues.length;
  const reported = issues.filter(i => i.status === "reported").length;
  const inProgress = issues.filter(i => i.status === "in_progress").length;
  const resolved = issues.filter(i => i.status === "resolved").length;
  const totalUpvotes = issues.reduce((sum, i) => sum + (i.upvotes || 0), 0);

  // Update KPI counters
  const elTotal = document.getElementById("analytics-total");
  const elReported = document.getElementById("analytics-reported");
  const elProgress = document.getElementById("analytics-progress");
  const elResolved = document.getElementById("analytics-resolved");
  const elUpvotes = document.getElementById("analytics-upvotes");

  if (elTotal) elTotal.textContent = total;
  if (elReported) elReported.textContent = reported;
  if (elProgress) elProgress.textContent = inProgress;
  if (elResolved) elResolved.textContent = resolved;
  if (elUpvotes) elUpvotes.textContent = totalUpvotes;

  // Hotspots Breakdown
  const cpCount = issues.filter(i => i.location.toLowerCase().includes("connaught") || i.location.toLowerCase().includes("cp")).length;
  const igCount = issues.filter(i => i.location.toLowerCase().includes("india gate")).length;
  const ccCount = issues.filter(i => i.location.toLowerCase().includes("chandni")).length;
  const hkCount = issues.filter(i => i.location.toLowerCase().includes("hauz")).length;

  const maxArea = Math.max(cpCount, igCount, ccCount, hkCount, 1);

  setMeter("meter-cp", cpCount, maxArea);
  setMeter("meter-ig", igCount, maxArea);
  setMeter("meter-cc", ccCount, maxArea);
  setMeter("meter-hk", hkCount, maxArea);

  // Category breakdown
  const plasticCount = issues.filter(i => i.category.toLowerCase().includes("plastic")).length;
  const dumpCount = issues.filter(i => i.category.toLowerCase().includes("dump") || i.category.toLowerCase().includes("garbage")).length;
  const waterCount = issues.filter(i => i.category.toLowerCase().includes("water") || i.category.toLowerCase().includes("drain")).length;

  const maxCat = Math.max(plasticCount, dumpCount, waterCount, 1);
  setMeter("meter-plastic", plasticCount, maxCat);
  setMeter("meter-dump", dumpCount, maxCat);
  setMeter("meter-water", waterCount, maxCat);
}

function setMeter(id, val, max) {
  const el = document.getElementById(id);
  const textEl = document.getElementById(id + "-text");
  if (el) {
    const pct = Math.round((val / max) * 100);
    el.style.width = `${Math.max(pct, 12)}%`;
  }
  if (textEl) {
    textEl.textContent = `${val} issues`;
  }
}

/**
 * 7. Report Submission & Photo Storage
 */
function initFormHandler() {
  const form = document.getElementById("report-form");
  const successBox = document.getElementById("report-success");
  const photoInput = document.getElementById("report-photo");
  const previewImg = document.getElementById("photo-preview-img");
  const previewContainer = document.getElementById("photo-preview-container");
  const removePhotoBtn = document.getElementById("remove-photo-btn");

  // Handle Photo File Upload & Base64 conversion
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          currentUploadedPhoto = evt.target.result;
          if (previewImg && previewContainer) {
            previewImg.src = currentUploadedPhoto;
            previewContainer.style.display = "block";
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Remove photo button
  if (removePhotoBtn && previewContainer && photoInput) {
    removePhotoBtn.addEventListener("click", () => {
      currentUploadedPhoto = "";
      photoInput.value = "";
      previewContainer.style.display = "none";
    });
  }

  // Form Submit
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const title = document.getElementById("report-title")?.value || "Civic Waste Sighting";
      const location = document.getElementById("report-location")?.value || "Delhi Sector";
      const category = document.getElementById("report-category")?.value || "Garbage Dump";
      const severity = document.getElementById("report-severity")?.value || "amber";
      const description = document.getElementById("report-desc")?.value || "";

      // Default to Delhi center with slight random offset if no GPS provided
      const lat = 28.6139 + (Math.random() - 0.5) * 0.08;
      const lng = 77.2090 + (Math.random() - 0.5) * 0.08;

      const newIssue = {
        id: "delhi-" + Date.now(),
        title: title,
        location: location,
        category: category,
        severity: severity,
        status: "reported",
        upvotes: 1,
        lat: lat,
        lng: lng,
        description: description,
        photo: currentUploadedPhoto || "assets/eco-spidey-hero.png",
        timestamp: new Date().toLocaleString()
      };

      // Save to local storage
      const issues = getIssues();
      issues.unshift(newIssue);
      saveIssues(issues);

      // Also record to Supabase database if active
      if (supabaseClient) {
        supabaseClient
          .from("cleanup_reports")
          .insert({
            location: location,
            report_type: category,
            severity: severity,
            note: description,
            photo_url: currentUploadedPhoto || null,
            status: "reported"
          })
          .then(({ error }) => {
            if (error) console.warn("Supabase insert log:", error.message);
            else console.log("Report recorded to Supabase successfully.");
          })
          .catch(err => console.warn("Supabase network note:", err));
      }

      // Show success message
      form.reset();
      currentUploadedPhoto = "";
      if (previewContainer) previewContainer.style.display = "none";

      form.style.display = "none";
      if (successBox) successBox.style.display = "block";
    });
  }

  // File Another Sighting button
  const resetBtn = document.getElementById("file-another-btn");
  if (resetBtn && form && successBox) {
    resetBtn.addEventListener("click", () => {
      form.style.display = "block";
      successBox.style.display = "none";
    });
  }

  // Export Authority Report Button
  const exportBtn = document.getElementById("export-analytics-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const issues = getIssues();
      const jsonReport = JSON.stringify(issues, null, 2);
      const blob = new Blob([jsonReport], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Delhi_Municipal_Civic_Report_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

/**
 * 8. Filter Buttons Handler
 */
function initFilterButtons() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter") || "all";
      renderIssuesList();
      renderMapMarkers();
    });
  });
}

/**
 * 9. Tactical Action Poses Slider Controls
 */
function initPosesSlider() {
  const track = document.getElementById("poses-track");
  const prevBtn = document.getElementById("pose-prev-btn");
  const nextBtn = document.getElementById("pose-next-btn");
  const dots = document.querySelectorAll("#pose-dots .slider-dot");

  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const totalSlides = 4;

  function updateSlider(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentIndex);
    });
  }

  prevBtn.addEventListener("click", () => updateSlider(currentIndex - 1));
  nextBtn.addEventListener("click", () => updateSlider(currentIndex + 1));

  dots.forEach(dot => {
    dot.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index") || "0", 10);
      updateSlider(idx);
    });
  });

  // Auto slide every 6 seconds
  let autoTimer = setInterval(() => updateSlider(currentIndex + 1), 6000);

  // Pause auto slider on mouse hover
  const container = track.closest(".poses-slider-container");
  if (container) {
    container.addEventListener("mouseenter", () => clearInterval(autoTimer));
    container.addEventListener("mouseleave", () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => updateSlider(currentIndex + 1), 6000);
    });
  }
}

