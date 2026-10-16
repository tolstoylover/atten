/* ================================================================
   STUDENT DATA
================================================================ */
const STUDENTS = [
  { roll: "A1",  reg: "I25MA01", name: "PRITHVIRAJ SINGH" },
  { roll: "A4",  reg: "I25MA04", name: "SACHIN SHARMA" },
  { roll: "A5",  reg: "I25MA05", name: "KHUSHBU SADANI" },
  { roll: "A7",  reg: "I25MA07", name: "PRIYANSHI" },
  { roll: "A8",  reg: "I25MA08", name: "NITESH JANGID" },
  { roll: "A9",  reg: "I25MA09", name: "AMAN YADAV" },
  { roll: "A10", reg: "I25MA10", name: "VINEET LAMBA" },
  { roll: "A11", reg: "I25MA11", name: "RISHABH SHAH" },
  { roll: "A12", reg: "I25MA12", name: "SUNKARA HEMACHARAN" },
  { roll: "A13", reg: "I25MA13", name: "SINGH SATISH SATYENDRA" },
  { roll: "A14", reg: "I25MA14", name: "DUBEY ALOK MUKESHKUMAR" },
  { roll: "A15", reg: "I25MA15", name: "SAMARTH T K" },
  { roll: "A16", reg: "I25MA16", name: "ADITYA KUMAR SINHA" },
  { roll: "A17", reg: "I25MA17", name: "GAURI SHANKAR" },
  { roll: "A19", reg: "I25MA19", name: "MUSKAN CHAUHAN" },
  { roll: "A20", reg: "I25MA20", name: "JAYPRAKASH SAINI" },
  { roll: "A21", reg: "I25MA21", name: "PRAJAPAT MUKESH SUJARAM" },
  { roll: "A22", reg: "I25MA22", name: "ISHAAN HARSHAD SUKHTHANKER" },
  { roll: "A24", reg: "I25MA24", name: "SHELADIYA AKSH BHAVESHBHAI" },
  { roll: "A25", reg: "I25MA25", name: "MEET MANISHKUMAR PATEL" },
  { roll: "A26", reg: "I25MA26", name: "DEVANSH AGARWAL" },
  { roll: "A27", reg: "I25MA27", name: "NEEV RAVAL" },
  { roll: "A28", reg: "I25MA28", name: "VANSH SARAF" },
  { roll: "A29", reg: "I25MA29", name: "BHARAT SANKHLA" },
  { roll: "A30", reg: "I25MA30", name: "KUNAL R BHAIYA" },
  { roll: "A32", reg: "I25MA32", name: "UDYAN KUMAR SINGH" },
  { roll: "A33", reg: "I25MA33", name: "VISHAL KUMAR" },
  { roll: "A34", reg: "I25MA34", name: "ABDULLAH JAMAL" },
  { roll: "A35", reg: "I25MA35", name: "PRASANNAJEET CHOUDHARY" },
  { roll: "A36", reg: "I25MA36", name: "SACHIN VERMA" },
  { roll: "A38", reg: "I25MA38", name: "GAJANAND MEENA" }
];

/* ================================================================
   STATE & STORAGE (ATTENDANCE)
================================================================ */
const STORAGE_KEY = "attendanceRegister.present.v1";
const THEME_KEY   = "attendanceRegister.theme.v1";

STUDENTS.forEach((s, i) => (s.id = i));

let presentIds  = new Set(loadPresent());
let searchQuery = "";
let breezeIds   = new Set();
let breezeTimer = null;

function scheduleBreezeClear(){
  clearTimeout(breezeTimer);
  breezeTimer = setTimeout(() => breezeIds.clear(), 800);
}

const rosterEl       = document.getElementById("roster");
const emptyStateEl   = document.getElementById("emptyState");
const searchInput    = document.getElementById("searchInput");
const toastEl        = document.getElementById("toast");
const visibleCountEl = document.getElementById("visibleCount");

function loadPresent(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){ return []; }
}
function savePresent(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...presentIds])); } catch(e){}
}

/* ================================================================
   DATE / TIME
================================================================ */
function formatDate(d){
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
function formatTime(d){
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function tickHeaderClock(){
  const now = new Date();
  const label = `${WEEKDAYS[now.getDay()]}, ${formatDate(now)} · ${formatTime(now)}`;
  const el = document.getElementById("todayLabel");
  if (el) el.textContent = label;
}
tickHeaderClock();
setInterval(tickHeaderClock, 30000);

/* ================================================================
   RENDERING (ATTENDANCE)
================================================================ */
function matchesSearch(s){
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return s.name.toLowerCase().includes(q) ||
         s.reg.toLowerCase().includes(q) ||
         s.roll.toLowerCase().includes(q);
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function renderRoster(){
  const visible = STUDENTS.filter(matchesSearch);
  rosterEl.innerHTML = "";
  emptyStateEl.style.display = visible.length ? "none" : "block";
  if (visibleCountEl) visibleCountEl.textContent = `${visible.length} student${visible.length === 1 ? "" : "s"}`;

  const frag = document.createDocumentFragment();
  visible.forEach(s => {
    const isPresent  = presentIds.has(s.id);
    const showBreeze = isPresent && breezeIds.has(s.id);
    const row = document.createElement("div");
    row.className = "row" + (isPresent ? " present" : "") + (showBreeze ? " breeze" : "");
    row.dataset.id = s.id;
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.innerHTML = `
      <input type="checkbox" ${isPresent ? "checked" : ""} aria-label="Mark ${escapeHtml(s.name)} present" tabindex="-1">
      <span class="roll">${escapeHtml(s.roll)}</span>
      <span class="info">
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="reg">${escapeHtml(s.reg)}</div>
      </span>
      <span class="badge">${isPresent ? "Present" : "Absent"}</span>`;
    frag.appendChild(row);
  });
  rosterEl.appendChild(frag);
  updateStats();
}
function updateStats(){
  const total   = STUDENTS.length;
  const present = presentIds.size;
  document.getElementById("statTotal").textContent   = total;
  document.getElementById("statPresent").textContent = present;
  document.getElementById("statAbsent").textContent  = total - present;
  const pct = total ? Math.round((present / total) * 100) : 0;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressPct").textContent  = pct + "%";
}

/* ================================================================
   EVENT HANDLERS (ATTENDANCE)
================================================================ */
function toggleStudent(id){
  if (presentIds.has(id)){ presentIds.delete(id); breezeIds.delete(id); }
  else { presentIds.add(id); breezeIds.add(id); }
  savePresent();
  scheduleBreezeClear();
  renderRoster();
}
rosterEl.addEventListener("click", e => {
  const row = e.target.closest(".row");
  if (!row) return;
  toggleStudent(Number(row.dataset.id));
});
rosterEl.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const row = e.target.closest(".row");
  if (!row) return;
  e.preventDefault();
  toggleStudent(Number(row.dataset.id));
});
searchInput.addEventListener("input", e => {
  searchQuery = e.target.value.trim();
  renderRoster();
});
document.getElementById("selectAllBtn").addEventListener("click", () => {
  STUDENTS.filter(matchesSearch).forEach(s => {
    if (!presentIds.has(s.id)) breezeIds.add(s.id);
    presentIds.add(s.id);
  });
  savePresent();
  scheduleBreezeClear();
  renderRoster();
  showToast("All visible students marked present");
});
document.getElementById("clearAllBtn").addEventListener("click", () => {
  presentIds.clear();
  breezeIds.clear();
  savePresent();
  renderRoster();
  showToast("Attendance cleared");
});
let toastTimer = null;
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

/* ================================================================
   THEME
================================================================ */
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem(THEME_KEY, theme); } catch(e){}
}
document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
});
(function initTheme(){
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch(e){}
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

/* ================================================================
   SUBMIT / COPY / EXPORT / PRINT
================================================================ */
const outputPanel = document.getElementById("outputPanel");
const outputText  = document.getElementById("outputText");
const submitHint  = document.querySelector(".submit-bar .hint");

function regToNumber(reg){
  const match = reg.match(/(\d+)\s*$/);
  return match ? String(parseInt(match[1], 10)) : reg;
}
let lastSubmission = null;
function buildSubmissionText(now, presentStudents){
  const numbers = presentStudents.map(s => regToNumber(s.reg)).join(", ");
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);
  const clip = `Attendance — ${dateStr}, ${timeStr}\nPresent:\n${numbers || "(none selected)"}`;
  return { dateStr, timeStr, numbers, count: presentStudents.length, clip };
}
async function submitAttendance(){
  const now = new Date();
  const presentStudents = STUDENTS.filter(s => presentIds.has(s.id));
  lastSubmission = buildSubmissionText(now, presentStudents);
  renderOutput(lastSubmission);
  outputPanel.classList.add("show");
  outputPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  const copied = await copyToClipboard(lastSubmission.clip);
  showToast(copied ? "Attendance copied — date & time included ✅" : "Copy failed — copy manually below.");
  if (submitHint){
    submitHint.innerHTML = `Last submitted <kbd>${lastSubmission.timeStr}</kbd> · ${lastSubmission.count} present`;
    submitHint.classList.add("done");
  }
}
function launchConfetti(){
  const colors = ['#16834f', '#22a967', '#2563eb', '#c15d13', '#4dcc87', '#f09a59'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  for (let i = 0; i < 90; i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 2.2 + Math.random() * 1.3 + 's';
    piece.style.animationDelay = Math.random() * 0.3 + 's';
    piece.style.width  = 6 + Math.random() * 6 + 'px';
    piece.style.height = 10 + Math.random() * 8 + 'px';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3800);
}
document.getElementById("submitBtn").addEventListener("click", () => {
  launchConfetti();
  submitAttendance();
});
function renderOutput(sub){
  document.getElementById("metaDate").textContent  = sub.dateStr;
  document.getElementById("metaTime").textContent  = sub.timeStr;
  document.getElementById("metaCount").textContent = `${sub.count} / ${STUDENTS.length}`;
  outputText.textContent = sub.clip;
}
async function copyToClipboard(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch(e){
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch(e2){ return false; }
  }
}
document.getElementById("copyAgainBtn").addEventListener("click", async () => {
  if (!lastSubmission) return;
  const copied = await copyToClipboard(lastSubmission.clip);
  showToast(copied ? "Copied again ✅" : "Copy failed");
});
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!lastSubmission) return;
  const blob = new Blob([lastSubmission.clip], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${lastSubmission.dateStr}-${lastSubmission.timeStr.replace(/[: ]/g, "")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
document.getElementById("printBtn").addEventListener("click", () => window.print());
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter"){
    e.preventDefault();
    launchConfetti();
    submitAttendance();
  }
});

/* ================================================================
   CGPA TARGET OPTIMIZER — CONFIG & STATE (EQUAL WEIGHT ONLY)
   final    = (current × passed + Σ future SGPA) / total
   required = (target × total − current × passed) / remaining
================================================================ */
const CGPA_KEY = "attendanceRegister.cgpa.v3";
const CGPA_LEGACY_KEYS = [
  "attendanceRegister.cgpa.v2",
  "attendanceRegister.cgpaSimple.v1"
];
const MAX_SEMS_LIMIT = 16;
const PACE_SPREAD = 0.6;   /* ± SGPA swing for front/back-load ramps */

const DIFFICULTY_SCALE = [
  { max: 7.00,     label: "Very Easy",  tone: "tone-green" },
  { max: 8.00,     label: "Easy",       tone: "tone-green" },
  { max: 8.75,     label: "Moderate",   tone: "tone-blue"  },
  { max: 9.25,     label: "Hard",       tone: "tone-amber" },
  { max: 9.70,     label: "Very Hard",  tone: "tone-amber" },
  { max: 10.00,    label: "Extreme",    tone: "tone-red"   },
  { max: Infinity, label: "Impossible", tone: "tone-red"   }
];
const TONE_BAR = { "tone-green": "bar-green", "tone-blue": "bar-blue", "tone-amber": "bar-amber", "tone-red": "bar-red" };
const SCENARIO_SPREAD = { safe: -0.5, stretch: 0.5 };

const cgpaState = {
  current: "",
  passed: "4",
  totalSems: "10",
  target: "",
  history: {},      /* { "1": { sgpa: "8.4" } } */
  scenario: {},     /* { "5": "8.8" } */
  milestones: ["8.00", "8.50", "9.00"]
};

/* Load + migrate: legacy credit fields are silently dropped */
function loadCGPAState(){
  try {
    let raw = localStorage.getItem(CGPA_KEY);
    if (!raw){
      for (const k of CGPA_LEGACY_KEYS){
        const legacy = localStorage.getItem(k);
        if (legacy){ raw = legacy; break; }
      }
    }
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.current   != null) cgpaState.current   = String(d.current);
    if (d.passed    != null) cgpaState.passed    = String(d.passed);
    else if (d.sems != null) cgpaState.passed    = String(d.sems);  /* legacy simple format */
    if (d.totalSems != null) cgpaState.totalSems = String(d.totalSems);
    if (d.target    != null) cgpaState.target    = String(d.target);
    if (d.history && typeof d.history === "object"){
      Object.keys(d.history).forEach(k => {
        const h = d.history[k];
        if (h && h.sgpa) cgpaState.history[k] = { sgpa: String(h.sgpa) };
      });
    }
    if (d.scenario && typeof d.scenario === "object") cgpaState.scenario = { ...d.scenario };
    if (Array.isArray(d.milestones) && d.milestones.length) cgpaState.milestones = d.milestones.map(String);
  } catch(e){}
}

let saveTimer = null;
function saveCGPAState(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(CGPA_KEY, JSON.stringify(cgpaState)); } catch(e){}
    flashSaved();
  }, 350);
}
let savedFlashTimer = null;
function flashSaved(){
  cgpaSavedEl.classList.add("show");
  clearTimeout(savedFlashTimer);
  savedFlashTimer = setTimeout(() => cgpaSavedEl.classList.remove("show"), 1400);
}

/* ================================================================
   CGPA — HELPERS
================================================================ */
const num     = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const clampN  = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const clamp01 = v => { const n = num(v); return n == null ? null : clampN(n, 0, 10); };
const fx      = (n, d = 2) => (n == null || !Number.isFinite(n)) ? "—" : n.toFixed(d);
const r2      = n => Math.round(n * 100) / 100;
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function tweenNum(el, to, fmt){
  if (!el) return;
  if (to == null || !Number.isFinite(to)){ el.textContent = "—"; el._v = null; return; }
  const from = (el._v == null) ? to : el._v;
  el._v = to;
  if (reduceMotion || Math.abs(to - from) < 0.001){ el.textContent = fmt(to); return; }
  cancelAnimationFrame(el._raf || 0);
  const t0 = performance.now(), dur = 420;
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}
function smoothPath(P){
  if (!P.length) return "";
  if (P.length < 3) return P.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  let d = `M${P[0].x.toFixed(1)} ${P[0].y.toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++){
    const p0 = P[i-1] || P[i], p1 = P[i], p2 = P[i+1], p3 = P[i+2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/* ================================================================
   CGPA — MODEL & MATH (equal weight)
================================================================ */
function buildModel(){
  const st = cgpaState;
  const total = clampN(Math.round(num(st.totalSems) ?? 10), 1, MAX_SEMS_LIMIT);
  const passed = clampN(Math.round(num(st.passed) ?? 0), 0, total); /* passed > total collapses to full */
  const remaining = total - passed;
  const target = clamp01(st.target);
  const current = clamp01(st.current);
  const hist = [];
  let histComplete = passed > 0;
  for (let s = 1; s <= passed; s++){
    const g = clamp01((st.history[s] || {}).sgpa);
    if (g == null) histComplete = false;
    hist.push({ sem: s, sgpa: g });
  }
  return { st, total, passed, remaining, target, current, hist, histComplete };
}

function calculateRequiredSGPA(m){
  if (m.current == null || m.target == null || m.remaining <= 0) return null;
  return (m.target * m.total - m.current * m.passed) / m.remaining;
}

function calculateProjectedCGPA(m, futureValues){
  if (m.current == null || !futureValues.length) return m.current;
  const sum = futureValues.reduce((a, b) => a + b, 0);
  return (m.current * m.passed + sum) / m.total;
}

function calculateTargetProgress(m){
  if (m.current == null || m.target == null || m.target <= 0) return null;
  return { pct: clampN(m.current / m.target, 0, 1.5), gap: m.target - m.current };
}

function calculateDifficulty(required){
  if (required == null) return null;
  const i = DIFFICULTY_SCALE.findIndex(d => required <= d.max);
  const idx = i === -1 ? DIFFICULTY_SCALE.length - 1 : i;
  return { idx, label: DIFFICULTY_SCALE[idx].label, tone: DIFFICULTY_SCALE[idx].tone };
}

/* Hypothetical: required avg if planning with k semesters of runway */
function requiredWithKRemaining(m, k){
  if (m.current == null || m.target == null || k <= 0) return null;
  const passedK = m.total - k;
  return (m.target * m.total - m.current * passedK) / k;
}

function getSimValues(m){
  const out = [];
  for (let s = m.passed + 1; s <= m.total; s++) out.push(clamp01(m.st.scenario[s]));
  return out;
}

function calculateForecast(m){
  const required = calculateRequiredSGPA(m);
  const sim = getSimValues(m);
  const hasSim = sim.some(v => v != null);
  let fill = null, note = "Add your numbers to see the projection.";

  if (m.current != null && m.target != null && m.remaining > 0 && m.current >= m.target){
    /* already above target → show a “maintain standing” path */
    fill = m.current;
    note = "You're already above target — this path maintains your current standing.";
  } else if (required != null){
    if (required > 10){
      fill = 10;
      note = "Best possible path shown — required average exceeds 10.00.";
    } else {
      fill = required;
      const gaps = sim.some(v => v == null);
      note = hasSim
        ? ("Your scenario" + (gaps ? " (empty semesters filled with the required average)" : ""))
        : `Assumes the required average every remaining semester (${fx(required)}).`;
    }
  } else if (m.current == null){
    note = "Enter your current CGPA to start projecting.";
  } else if (m.target == null){
    note = "Set a target CGPA to see what you need.";
  } else if (m.remaining === 0){
    note = "All semesters complete — nothing left to project.";
  }

  const path = sim.map(v => v ?? fill);
  const projected = (fill != null && path.every(v => v != null)) ? calculateProjectedCGPA(m, path) : null;
  return { projected, required, note, path, hasSim, fill };
}

function historySGPAs(m){ return m.hist.filter(h => h.sgpa != null).map(h => h.sgpa); }

function trendInfo(m){
  const g = historySGPAs(m);
  if (g.length < 2) return null;
  const n = g.length;
  const xm = (n - 1) / 2;
  const ym = g.reduce((a, b) => a + b, 0) / n;
  let nr = 0, dr = 0;
  g.forEach((v, i) => { nr += (i - xm) * (v - ym); dr += (i - xm) * (i - xm); });
  const slope = dr ? nr / dr : 0;
  if (slope > 0.08)  return { dir: "up",   arrow: "↗", label: "Improving" };
  if (slope < -0.08) return { dir: "down", arrow: "↘", label: "Declining" };
  return { dir: "flat", arrow: "→", label: "Stable" };
}

function recentAvgSGPA(m){
  const g = historySGPAs(m);
  if (!g.length) return null;
  const last = g.slice(-2);
  return last.reduce((a, b) => a + b, 0) / last.length;
}

/* semester → cumulative CGPA map, from history (or current) + a future path */
function cumulativeMap(m, futureVals){
  const map = {};
  let sum = 0, ok = true;
  for (let s = 1; s <= m.passed; s++){
    const g = (m.hist[s-1] || {}).sgpa;
    if (g == null){ ok = false; break; }
    sum += g;
    map[s] = sum / s;
  }
  if (!ok){
    if (m.current != null && m.passed > 0){ sum = m.current * m.passed; map[m.passed] = m.current; ok = true; }
    else if (m.passed === 0){ sum = 0; ok = true; }
    else return map;
  }
  if (ok && Array.isArray(futureVals)){
    for (let s = m.passed + 1; s <= m.total; s++){
      const g = futureVals[s - m.passed - 1];
      if (g == null) break;
      sum += g;
      map[s] = sum / s;
    }
  }
  return map;
}

/* ================================================================
   CGPA — PACING STRATEGIES (front-load / even / back-load)
================================================================ */
function buildPacingStrategies(m, required){
  if (required == null || m.remaining <= 0 || !Number.isFinite(required)) return null;
  const r = m.remaining, a = required;
  const sems = [];
  for (let s = m.passed + 1; s <= m.total; s++) sems.push(s);

  const spread = Math.min(PACE_SPREAD, Math.max(0, 10 - a), Math.max(0, a));
  const ramp = dir => sems.map((s, i) => r === 1 ? a : a + dir * spread * (1 - 2 * i / (r - 1)));

  const defs = [
    { key: "front", name: "Front-load", desc: "peak early, glide home",      dir:  1 },
    { key: "even",  name: "Even pace",  desc: "steady, same SGPA throughout", dir:  0 },
    { key: "back",  name: "Back-load",  desc: "build to a late peak",         dir: -1 }
  ];

  const form = recentAvgSGPA(m) ?? m.current;
  const histGs = historySGPAs(m);
  const bestPast = histGs.length ? Math.max(...histGs) : null;
  const refBest = (form != null || bestPast != null) ? Math.max(form ?? 0, bestPast ?? 0) : null;

  const strategies = defs.map(d => {
    const values = d.dir === 0 ? sems.map(() => a) : ramp(d.dir);
    const peak = Math.max(...values);
    const impossible = values.some(v => v > 10.004 || v < -0.004);
    let tone, verdict;
    if (impossible){ tone = "tone-red"; verdict = "Not possible · needs > 10.00"; }
    else if (form != null && peak <= form + 0.05){ tone = "tone-green"; verdict = "Comfortable · within current form"; }
    else if (refBest != null && peak <= refBest + 0.05){ tone = "tone-blue"; verdict = "Realistic · matches your best"; }
    else if (peak <= 9.5){ tone = "tone-amber"; verdict = "Stretch · above past best"; }
    else { tone = "tone-red"; verdict = "Extreme · near-perfect needed"; }
    return { ...d, sems, values, peak, impossible, tone, verdict };
  });

  /* recommend: feasible profile needing the least beyond current form; front-load wins ties (more runway) */
  let recommended = null, bestScore = Infinity;
  strategies.forEach(st => {
    if (st.impossible) return;
    const extra = Math.max(0, st.peak - (form ?? st.peak));
    const score = extra + (st.key === "even" ? 0.02 : 0) + (st.key === "back" ? 0.04 : 0);
    if (score < bestScore - 1e-9){ bestScore = score; recommended = st.key; }
  });

  return { strategies, recommended, required: a };
}

/* ================================================================
   CGPA — VALIDATION
================================================================ */
function getFieldErrors(){
  const errs = {};
  const chk = (key, raw, label, lo, hi, integer) => {
    if (!raw || !String(raw).trim()) return;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) errs[key] = `${label} — “${String(raw).trim()}” isn't a number.`;
    else if (integer && !Number.isInteger(n)) errs[key] = `${label} must be a whole number.`;
    else if (n < lo || n > hi) errs[key] = `${label} must be between ${lo} and ${hi}.`;
  };
  chk("current", cgpaState.current, "Current CGPA", 0, 10, false);
  chk("total", cgpaState.totalSems, "Total semesters", 1, MAX_SEMS_LIMIT, true);
  chk("target", cgpaState.target, "Target CGPA", 0, 10, false);
  return errs;
}

function setFieldHint(id, key, errs){
  const el = document.getElementById(id);
  if (!el) return;
  const field = el.closest(".cgx-field");
  const input = field ? field.querySelector("input") : null;
  if (errs[key]){
    el.textContent = errs[key];
    if (field) field.classList.add("show-err");
    if (input) input.classList.add("invalid");
  } else {
    el.textContent = "";
    if (field) field.classList.remove("show-err");
    if (input) input.classList.remove("invalid");
  }
}

function renderMessages(m, errs, required){
  setFieldHint("hintCurrent", "current", errs);
  setFieldHint("hintTotal", "total", errs);
  setFieldHint("hintTarget", "target", errs);

  const banners = [];
  const hasErr = Object.keys(errs).length > 0;
  Object.values(errs).forEach(t => banners.push({ tone: "bad", html: t + " Fix it to unlock the live calculations." }));

  if (!hasErr){
    if (m.current == null && m.target == null){
      banners.push({ tone: "", html: "Start with your <b>current CGPA</b> and a <b>target CGPA</b> — every chart, pacing profile and insight updates live as you type." });
    } else if (m.current == null){
      banners.push({ tone: "", html: "Enter your <b>current CGPA</b> to unlock the projection." });
    } else if (m.target == null){
      banners.push({ tone: "", html: "Set a <b>target CGPA</b> — or tap a goal preset — to compute what each semester needs." });
    } else if (m.remaining === 0){
      banners.push(m.current >= m.target
        ? { tone: "ok",   html: `Course complete at <b>${fx(m.current)}</b> — finished above the ${fx(m.target)} target.` }
        : { tone: "warn", html: `All <b>${m.total}</b> semesters are marked as passed, so the target can no longer be influenced. Final standing: <b>${fx(m.current)}</b> vs target ${fx(m.target)}. Adjust “Semesters passed” if that's wrong.` });
    } else if (m.current >= m.target){
      const floorTxt = (required != null && required > 0)
        ? ` An average of just <b>${fx(required)}</b> over the remaining ${m.remaining} semester${m.remaining > 1 ? "s" : ""} keeps you there.`
        : " Any SGPA keeps you above it.";
      banners.push({ tone: "ok", html: `You're already <b>${fx(m.current - m.target)}</b> above your target.${floorTxt}` });
    }
  }
  messagesEl.innerHTML = banners.map(b => `<div class="cgx-msg ${b.tone}">${b.html}</div>`).join("");
}

/* ================================================================
   CGPA — DOM REFS
================================================================ */
const cgpaModalEl   = document.getElementById("cgpaModal");
const cgpaSavedEl   = document.getElementById("cgpaSaved");
const curInput      = document.getElementById("cgpaCurrent");
const curLabel      = document.getElementById("currentLabel");
const selSems       = document.getElementById("cgpaSemesters");
const totalInput    = document.getElementById("cgpaTotalSems");
const targetInput   = document.getElementById("cgpaTarget");
const presetRow     = document.getElementById("presetRow");
const histGridEl    = document.getElementById("histGrid");
const messagesEl    = document.getElementById("cgxMessages");

const ringFillEl = document.getElementById("ringFill");
const ringNumEl  = document.getElementById("ringNum");
const ringPctEl  = document.getElementById("ringPct");
const rgTargetEl = document.getElementById("rgTarget");
const rgGapEl    = document.getElementById("rgGap");
const rgRunwayEl = document.getElementById("rgRunway");

const fcProjectedEl = document.getElementById("fcProjected");
const fcMarginEl    = document.getElementById("fcMargin");
const fcTrendEl     = document.getElementById("fcTrend");
const fcNoteEl      = document.getElementById("fcNote");

const heroEl    = document.getElementById("cgpaHero");
const reqNumEl  = document.getElementById("cgpaRequired");
const reqLblEl  = document.getElementById("cgpaRequiredLbl");
const diffMeter = document.getElementById("diffMeter");
const diffLabel = document.getElementById("diffLabel");

const projChartEl = document.getElementById("projChart");
const projTipEl   = document.getElementById("projTip");
const projNoteEl  = document.getElementById("projNote");
const sgpaChartEl = document.getElementById("sgpaChart");
const sgpaTipEl   = document.getElementById("sgpaTip");
const sgpaNoteEl  = document.getElementById("sgpaNote");
const urgChartEl  = document.getElementById("urgChart");
const urgTipEl    = document.getElementById("urgTip");

const paceGridEl = document.getElementById("paceGrid");
const paceNoteEl = document.getElementById("paceNote");

const simGridEl      = document.getElementById("simGrid");
const simUseReqBtn   = document.getElementById("simUseReq");
const simClearBtn    = document.getElementById("simClear");
const simProjectedEl = document.getElementById("simProjected");
const simTargetEl    = document.getElementById("simTarget");
const simMarginEl    = document.getElementById("simMargin");
const simStatusEl    = document.getElementById("simStatus");

const scenEls = [
  { per: document.getElementById("scSafePer"),    num: document.getElementById("scSafeNum"),    st: document.getElementById("scSafeStatus"),    off: SCENARIO_SPREAD.safe },
  { per: document.getElementById("scTargetPer"),  num: document.getElementById("scTargetNum"),  st: document.getElementById("scTargetStatus"),  off: 0 },
  { per: document.getElementById("scStretchPer"), num: document.getElementById("scStretchNum"), st: document.getElementById("scStretchStatus"), off: SCENARIO_SPREAD.stretch }
];

const feasMaxEl  = document.getElementById("feasMax");
const feasReqEl  = document.getElementById("feasReq");
const feasGapEl  = document.getElementById("feasGap");
const feasLeftEl = document.getElementById("feasLeft");
const feasTextEl = document.getElementById("feasText");
const insightEl  = document.getElementById("insightList");
const msInputEl  = document.getElementById("msInput");
const msAddBtn   = document.getElementById("msAdd");
const msListEl   = document.getElementById("msList");

/* Build difficulty meter segments once */
DIFFICULTY_SCALE.forEach(d => {
  const seg = document.createElement("i");
  seg.title = d.label;
  diffMeter.appendChild(seg);
});

/* ================================================================
   CGPA — RENDER: INPUT CHROME
================================================================ */
let lastTotal = -1, lastPassed = -1, lastRemaining = -1;

function renderInputsChrome(m){
  if (m.total !== lastTotal){ buildSemOptions(m); lastTotal = m.total; }
  if (String(m.passed) !== m.st.passed) m.st.passed = String(m.passed);
  selSems.value = String(m.passed);
  if (m.passed !== lastPassed){ buildHistoryGrid(m); lastPassed = m.passed; }
  if (m.remaining !== lastRemaining){ buildSimGrid(m); lastRemaining = m.remaining; }

  const t = m.target;
  presetRow.querySelectorAll(".cgx-preset").forEach(b => {
    const v = b.dataset.target;
    if (v === "custom") b.classList.toggle("active", t != null && ![8, 8.5, 9, 9.5].some(p => Math.abs(t - p) < 0.005));
    else b.classList.toggle("active", t != null && Math.abs(t - parseFloat(v)) < 0.005);
  });
}
function buildSemOptions(m){
  selSems.innerHTML = "";
  for (let i = 0; i <= m.total; i++){
    const o = document.createElement("option");
    o.value = i; o.textContent = i;
    selSems.appendChild(o);
  }
}
function buildHistoryGrid(m){
  histGridEl.innerHTML = "";
  if (m.passed <= 0){
    histGridEl.innerHTML = `<div class="cgx-ms-empty">Mark some semesters as passed to add history.</div>`;
    return;
  }
  for (let s = 1; s <= m.passed; s++){
    const h = m.st.history[s] || {};
    const cell = document.createElement("div");
    cell.className = "cgx-hcell";
    cell.innerHTML = `<span class="cgx-hcell-lb">SEM ${s}</span>
      <input data-hsem="${s}" data-hfield="sgpa" inputmode="decimal" placeholder="SGPA" aria-label="Semester ${s} SGPA" value="${escapeHtml(h.sgpa || "")}">`;
    histGridEl.appendChild(cell);
  }
}
function buildSimGrid(m){
  simGridEl.innerHTML = "";
  if (m.remaining <= 0){
    simGridEl.innerHTML = `<div class="cgx-ms-empty">No remaining semesters to simulate.</div>`;
    return;
  }
  for (let s = m.passed + 1; s <= m.total; s++){
    const f = document.createElement("div");
    f.className = "cgx-sim-field";
    f.innerHTML = `<label for="sim-${s}">S${s} SGPA</label>
      <input id="sim-${s}" data-ssem="${s}" inputmode="decimal" placeholder="—" autocomplete="off" value="${escapeHtml(m.st.scenario[s] || "")}">`;
    simGridEl.appendChild(f);
  }
}

/* ================================================================
   CGPA — RENDER: VISUALS
================================================================ */
function renderRing(m, prog){
  tweenNum(ringNumEl, m.current, v => fx(v));
  const pct = prog ? prog.pct * 100 : null;
  ringFillEl.style.strokeDashoffset = String(100 - clampN(pct ?? 0, 0, 100));
  tweenNum(ringPctEl, pct, v => Math.round(v) + "%");
  rgTargetEl.textContent = fx(m.target);
  const gap = prog ? prog.gap : null;
  if (gap == null) rgGapEl.textContent = "—";
  else if (gap <= 0) rgGapEl.textContent = "Ahead ✓";
  else rgGapEl.textContent = fx(gap) + " to go";
  rgRunwayEl.textContent = m.remaining ? `${m.remaining} sem${m.remaining > 1 ? "s" : ""}` : "Complete";
}

function renderForecast(m, forecast){
  tweenNum(fcProjectedEl, forecast.projected, v => fx(v));
  const tr = trendInfo(m);
  fcTrendEl.textContent = tr ? `${tr.arrow} ${tr.label}` : "— add history for trend";
  fcTrendEl.className = "cgx-trend " + (tr ? tr.dir : "");
  let pill = "—", tone = "tone-neutral";
  if (forecast.projected != null && m.target != null){
    const mg = forecast.projected - m.target;
    pill = (mg >= 0 ? "+" : "") + fx(mg) + (mg >= 0.005 ? " above target" : mg <= -0.005 ? " below target" : " on target");
    tone = mg >= 0.005 ? "tone-green" : mg >= -0.005 ? "tone-blue" : "tone-amber";
  }
  fcMarginEl.textContent = pill;
  fcMarginEl.className = "cgx-pill " + tone;
  fcNoteEl.textContent = forecast.note;
}

let lastHeroText = "";
function renderRequiredHero(m, required, diff){
  let text = "—", tone = "tone-neutral", label = "Required average SGPA";
  if (m.current != null && m.target != null){
    if (m.remaining === 0){
      text = m.current >= m.target ? "✓" : "✕";
      tone = m.current >= m.target ? "tone-green" : "tone-amber";
      label = m.current >= m.target ? "Finished above target" : "Finished below target";
    } else if (required != null){
      if (required <= 0.004){
        text = "0.00";
        tone = "tone-green";
        label = `Any SGPA keeps you ≥ ${fx(m.target)} · ${m.remaining} sem${m.remaining > 1 ? "s" : ""} left`;
      } else {
        text = fx(required);
        tone = required <= 10 ? (diff ? diff.tone : "tone-neutral") : "tone-red";
        const prefix = m.current >= m.target ? "Maintenance floor to stay ≥ target" : "Required avg SGPA";
        label = `${prefix} · ${m.remaining} sem${m.remaining > 1 ? "s" : ""} left`;
      }
    }
  }
  if (text !== lastHeroText){
    reqNumEl.classList.remove("pop");
    void reqNumEl.offsetWidth;
    reqNumEl.classList.add("pop");
    lastHeroText = text;
  }
  if (/^[\d.]+$/.test(text)) tweenNum(reqNumEl, parseFloat(text), v => fx(v));
  else { reqNumEl.textContent = text; reqNumEl._v = null; }
  heroEl.className = "cgpa-hero cgx-required " + tone;
  reqLblEl.textContent = label;
}

function renderDifficulty(required, diff){
  const segs = diffMeter.children;
  for (let i = 0; i < segs.length; i++){
    segs[i].classList.toggle("on", diff != null && i <= diff.idx);
    segs[i].classList.toggle("now", diff != null && i === diff.idx);
  }
  diffLabel.textContent = (diff && required != null)
    ? `${diff.label} · needs ${fx(required)} avg`
    : "Difficulty — enter details";
}

function setStatusPill(el, tone, text){ el.className = "cgx-pill " + tone; el.textContent = text; }
function setStatus(el, tone, text){ el.className = "cgpa-status " + tone; el.textContent = text; }

function renderScenarios(m, required){
  scenEls.forEach(r => {
    if (required == null || m.remaining <= 0){
      r.per.textContent = "—";
      tweenNum(r.num, null, fx);
      setStatusPill(r.st, "tone-neutral", "—");
      return;
    }
    const v = clampN(r2(required + r.off), 0, 10);
    const final = calculateProjectedCGPA(m, Array(m.remaining).fill(v));
    r.per.textContent = `${fx(v)} / sem${required > 10 && r.off === 0 ? " · capped at 10" : ""}`;
    tweenNum(r.num, final, fx);
    if (final == null || m.target == null){ setStatusPill(r.st, "tone-neutral", "—"); return; }
    const d = final - m.target;
    if (d >= 0.005)       setStatusPill(r.st, "tone-green", "Target exceeded");
    else if (d >= -0.005) setStatusPill(r.st, "tone-green", "Target reached");
    else                  setStatusPill(r.st, "tone-amber", `Below target · ${fx(d)}`);
  });
}

function renderPacing(m, required){
  const pacing = buildPacingStrategies(m, required);
  if (!pacing){
    paceGridEl.innerHTML = `<div class="cgx-ms-empty">Enter current CGPA, target and remaining semesters to compare pacing profiles.</div>`;
    paceNoteEl.textContent = "Each profile averages to the same required SGPA — only the tempo changes.";
    return;
  }
  paceGridEl.innerHTML = pacing.strategies.map(st => {
    const chips = st.sems.map((s, i) => {
      const v = st.values[i];
      const over = v > 10.004;
      const hot = !over && v >= 9.25;
      return `<span class="pace-chip ${over ? "over" : hot ? "hot" : ""}"><span class="s">S${s}</span><span class="g">${over ? ">10" : fx(v)}</span></span>`;
    }).join("");
    const rec = pacing.recommended === st.key ? `<span class="cgx-pill tone-green">Recommended</span>` : "";
    return `<div class="pace-row ${pacing.recommended === st.key ? "recommended" : ""}">
      <div class="pace-head">
        <span class="pace-name">${st.name}</span>
        <span class="pace-desc">${st.desc}</span>
        <span class="pace-peak">peak ${st.impossible ? ">10.00" : fx(st.peak)}</span>
        ${rec}
        <span class="cgx-pill ${st.tone}">${st.verdict}</span>
      </div>
      <div class="pace-chips">${chips}</div>
    </div>`;
  }).join("");
  paceNoteEl.textContent = `All three profiles average ${fx(pacing.required)} SGPA — only the tempo changes. Front-loading buys runway if a semester slips.`;
}

function renderSimResults(m, forecast, required){
  const sim = getSimValues(m);
  const any = sim.some(v => v != null);
  tweenNum(simProjectedEl, forecast.projected, v => fx(v));
  simTargetEl.textContent = fx(m.target);
  let mgText = "—", mgClass = "v";
  if (forecast.projected != null && m.target != null){
    const mg = forecast.projected - m.target;
    mgText = (mg >= 0 ? "+" : "") + fx(mg);
    mgClass = "v " + (mg >= 0.005 ? "pos" : mg <= -0.005 ? "neg" : "");
  }
  simMarginEl.textContent = mgText;
  simMarginEl.className = mgClass;
  if (!any){
    setStatus(simStatusEl, "tone-neutral",
      (required != null && required <= 10)
        ? `No scenario yet — the required average is ${fx(required)}. Tap “Use required SGPA” to auto-fill.`
        : "Enter expected SGPAs for the remaining semesters to simulate.");
  } else if (forecast.projected == null){
    setStatus(simStatusEl, "tone-neutral", "Complete the inputs (or set a target) to simulate.");
  } else if (m.target == null){
    setStatus(simStatusEl, "tone-neutral", "Set a target CGPA to judge this scenario.");
  } else {
    const d = forecast.projected - m.target;
    if (d >= 0.005)       setStatus(simStatusEl, "tone-green", `TARGET ACHIEVABLE · +${fx(d)} margin`);
    else if (d >= -0.005) setStatus(simStatusEl, "tone-green", "EXACTLY ON TARGET");
    else                  setStatus(simStatusEl, "tone-amber", `FALLS SHORT BY ${fx(-d)} — raise one or more semesters`);
  }
}

function renderFeasibility(m, required){
  const maxFinal = (m.remaining > 0) ? calculateProjectedCGPA(m, Array(m.remaining).fill(10)) : m.current;
  feasMaxEl.textContent  = fx(maxFinal);
  feasReqEl.textContent  = fx(required);
  feasGapEl.textContent  = (m.current != null && m.target != null) ? fx(m.target - m.current) : "—";
  feasLeftEl.textContent = m.remaining ? `${m.remaining} sem${m.remaining > 1 ? "s" : ""}` : "None";
  let txt;
  if (m.current == null || m.target == null)
    txt = "Enter your current CGPA and target CGPA to analyse feasibility.";
  else if (m.current >= m.target)
    txt = m.remaining > 0
      ? `You currently sit <b>${fx(m.current)}</b> against a target of <b>${fx(m.target)}</b>. With ${m.remaining} semester${m.remaining > 1 ? "s" : ""} left, an average of <b>${fx(Math.max(0, required))}</b> is enough to finish at or above it — that's your buffer working for you.`
      : `Finished at <b>${fx(m.current)}</b>, above the ${fx(m.target)} target.`;
  else if (m.remaining === 0)
    txt = "All semesters are complete, so the target can no longer be influenced.";
  else if (required == null)
    txt = "Add the missing inputs to analyse feasibility.";
  else if (required <= 10)
    txt = `Target is <b>mathematically achievable</b> — it needs an average SGPA of <b>${fx(required)}</b> over the remaining ${m.remaining} semester${m.remaining > 1 ? "s" : ""}, within the 10.00 maximum. Best possible finish: <b>${fx(maxFinal)}</b>.`;
  else
    txt = `To reach <b>${fx(m.target)}</b>, you would need an average SGPA of <b>${fx(required)}</b> across the remaining ${m.remaining} semester${m.remaining > 1 ? "s" : ""}. Since the maximum SGPA is 10.00, this target is currently unreachable — the best possible final CGPA is <b>${fx(maxFinal)}</b>. Consider setting your target at or below that.`;
  feasTextEl.innerHTML = txt;
}

function renderMilestones(m, forecast){
  msListEl.innerHTML = "";
  const list = (m.st.milestones || []).map(v => num(v)).filter(v => v != null).sort((a, b) => a - b);
  if (!list.length){
    msListEl.innerHTML = `<div class="cgx-ms-empty">No milestones yet — add one like 8.50 or 9.00 to build your progression timeline (they're also flagged on the projection chart).</div>`;
    return;
  }
  list.forEach(v => {
    const row = document.createElement("div");
    let cls = "todo", icon = "○", stt = "Future";
    if (m.current != null && m.current >= v - 1e-9){ cls = "done"; icon = "✓"; stt = "Achieved"; }
    else if (forecast.projected != null && forecast.projected >= v - 1e-9){ cls = "prog"; icon = "→"; stt = "In progress"; }
    row.className = "cgx-ms " + cls;
    row.innerHTML = `<span class="ic">${icon}</span>
      <span class="val">${fx(v)}</span>
      <span class="stt">${stt}</span>
      <button type="button" class="rm" data-ms="${v}" aria-label="Remove milestone ${fx(v)}">✕</button>`;
    msListEl.appendChild(row);
  });
}

function updateInsights(m, required, forecast, diff){
  const out = [];
  const add = (txt, cls = "") => { if (out.length < 6) out.push({ txt, cls }); };
  const pacing = (required != null && m.remaining > 0 && Number.isFinite(required))
    ? buildPacingStrategies(m, required) : null;

  if (m.current == null || m.target == null){
    add("Add your <b>current CGPA</b> and <b>target CGPA</b> — every chart, pacing profile and insight updates live.");
  } else if (m.remaining === 0){
    add(m.current >= m.target
      ? `Finished at <b>${fx(m.current)}</b>, above the ${fx(m.target)} target — well run.`
      : "The course is complete and the target was not reached — adjust “Semesters passed” if that's not right.",
      m.current >= m.target ? "" : "warn");
  } else if (m.current >= m.target){
    add(`You're <b>${fx(m.current - m.target)}</b> above target with ${m.remaining} semester${m.remaining > 1 ? "s" : ""} of runway. Consistency is the whole game now.`);
    if (required != null && required > 0)
      add(`Even an average of <b>${fx(required)}</b> keeps you ≥ ${fx(m.target)} — that's your maintenance floor.`);
  } else if (required != null){
    if (required <= 10){
      add(`Your target needs an average SGPA of <b>${fx(required)}</b> across ${m.remaining} remaining semester${m.remaining > 1 ? "s" : ""} — rated <b>${diff ? diff.label : ""}</b>.`);
      if (pacing && pacing.recommended){
        const rec = pacing.strategies.find(s => s.key === pacing.recommended);
        add(`<b>${rec.name}</b> is your most realistic pacing: peak <b>${fx(rec.peak)}</b> SGPA (${rec.verdict.toLowerCase()}).`);
        const back = pacing.strategies.find(s => s.key === "back");
        if (back && !back.impossible && pacing.recommended !== "back")
          add(`Back-loading pushes your final semester to <b>${fx(back.peak)}</b> — one slip there ends the plan.`, "warn");
      }
      if (forecast.projected != null){
        const mg = forecast.projected - m.target;
        if (Math.abs(mg) < 0.005) add("Your current plan lands exactly on target.");
        else if (mg > 0) add(`Your current plan carries a <b>+${fx(mg)}</b> buffer above target.`);
        else add(`Your current plan falls <b>${fx(-mg)}</b> short — lift one semester to close the gap.`, "warn");
      }
      const recent = recentAvgSGPA(m);
      if (recent != null){
        const proj = calculateProjectedCGPA(m, Array(m.remaining).fill(clampN(recent, 0, 10)));
        if (proj != null)
          add(`Maintaining recent form (${fx(recent)} SGPA) lands you around <b>${fx(proj)}</b>.`, proj >= m.target ? "" : "warn");
      }
      if (m.remaining >= 2){
        const floor = m.target * m.total - m.current * m.passed - 10 * (m.remaining - 1);
        if (floor > 0.005)
          add(`Scoring below <b>${fx(clampN(floor, 0, 10))}</b> next semester makes the target mathematically unreachable.`, "bad");
        else
          add("Any score next semester keeps the target within reach — start strong.");
      }
    } else {
      const maxFinal = calculateProjectedCGPA(m, Array(m.remaining).fill(10));
      add(`Reaching <b>${fx(m.target)}</b> needs an average of <b>${fx(required)}</b> — above the 10.00 ceiling. Best reachable: <b>${fx(maxFinal)}</b>.`, "bad");
      if (pacing && pacing.strategies.every(s => s.impossible))
        add("No pacing profile fits under the 10.00 ceiling — reset the target at or below that.", "bad");
    }
  }
  const tr = trendInfo(m);
  if (tr && historySGPAs(m).length >= 3){
    if (tr.dir === "up")   add("Your SGPA trend is improving ↗ — protect that momentum.");
    if (tr.dir === "down") add("Your SGPA trend is slipping ↘ — the next semester matters most.", "warn");
    if (tr.dir === "flat") add("Your SGPA trend is stable → a small sustained lift compounds quickly.");
  }
  insightEl.innerHTML = out.length
    ? out.map(i => `<li${i.cls ? ` class="${i.cls}"` : ""}>${i.txt}</li>`).join("")
    : `<li>Insights will appear once your plan has numbers.</li>`;
}

/* ================================================================
   CGPA — CHARTS (dependency-free SVG)
================================================================ */
let projCtx = null, sgpaCtx = null, urgCtx = null;

function emptyChartSVG(W, H, msg){
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><text class="cg-emptymsg" x="${W/2}" y="${H/2}" text-anchor="middle">${msg}</text></svg>`;
}

function updateCGPAGraph(m, forecast){
  const W = Math.max(280, projChartEl.clientWidth || 320);
  const H = W < 520 ? 212 : 258;
  const pad = { l: 34, r: 12, t: 20, b: 24 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = s => m.total <= 1 ? pad.l + iw / 2 : pad.l + ((s - 1) / (m.total - 1)) * iw;
  const Y = v => pad.t + (1 - clampN(v, 0, 10) / 10) * ih;

  let svg = `<defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" class="ag-a"/><stop offset="100%" class="ag-b"/></linearGradient>
    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" class="bg-a"/><stop offset="100%" class="bg-b"/></linearGradient>
  </defs>`;

  /* grid + axes */
  for (let g = 0; g <= 10; g++){
    const yy = Y(g);
    svg += `<line class="cg-grid${g % 2 ? " soft" : ""}" x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${yy.toFixed(1)}"/>`;
    if (g % 2 === 0) svg += `<text class="cg-ax" x="${pad.l - 7}" y="${(yy + 3).toFixed(1)}" text-anchor="end">${g}</text>`;
  }
  const lblStep = m.total > 12 ? 2 : 1;
  for (let s = 1; s <= m.total; s++){
    if (lblStep === 2 && s % 2 === 0 && s !== m.total) continue;
    svg += `<text class="cg-ax" x="${X(s).toFixed(1)}" y="${H - 7}" text-anchor="middle">S${s}</text>`;
  }

  /* milestone guide lines */
  (m.st.milestones || []).forEach(ms => {
    const v = num(ms);
    if (v == null || v <= 0 || v >= 10) return;
    svg += `<line class="cg-ms" x1="${pad.l}" y1="${Y(v).toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`;
  });

  /* target line */
  if (m.target != null){
    const ty = Y(m.target);
    svg += `<line class="cg-target" x1="${pad.l}" y1="${ty.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${ty.toFixed(1)}"/>`;
    svg += `<text class="cg-target-lb" x="${(W - pad.r).toFixed(1)}" y="${(ty - 5).toFixed(1)}" text-anchor="end">TARGET ${fx(m.target)}</text>`;
  }

  /* actual series (equal-weight cumulative average) */
  const completeHist = m.passed > 0 && m.hist.every(h => h.sgpa != null);
  const actualPts = [];
  if (completeHist){
    let sum = 0;
    m.hist.forEach(h => { sum += h.sgpa; actualPts.push({ sem: h.sem, cgpa: sum / h.sem, sgpa: h.sgpa }); });
  } else if (m.passed > 0 && m.current != null){
    actualPts.push({ sem: m.passed, cgpa: m.current, sgpa: null });
  }

  /* projected series */
  const projPts = [];
  const pathOk = m.current != null && m.remaining > 0 &&
    forecast.path.length === m.remaining && forecast.path.every(v => v != null);
  if (pathOk){
    if (m.passed > 0) projPts.push({ sem: m.passed, cgpa: m.current, sgpa: null });
    let sum = m.current * m.passed;
    forecast.path.forEach((v, i) => {
      const sem = m.passed + 1 + i;
      sum += v;
      projPts.push({ sem, cgpa: sum / sem, sgpa: v });
    });
  }

  /* safe ↔ stretch confidence band */
  const req = forecast.required;
  if (req != null && Number.isFinite(req) && m.remaining > 0 && m.current != null){
    const buildPath = v => {
      const pts = [];
      if (m.passed > 0) pts.push({ sem: m.passed, cgpa: m.current });
      let sum = m.current * m.passed;
      for (let i = 0; i < m.remaining; i++){
        sum += v;
        const sem = m.passed + 1 + i;
        pts.push({ sem, cgpa: sum / sem });
      }
      return pts;
    };
    const up = buildPath(clampN(req + SCENARIO_SPREAD.stretch, 0, 10)).map(p => ({ x: X(p.sem), y: Y(p.cgpa) }));
    const lo = buildPath(clampN(req + SCENARIO_SPREAD.safe, 0, 10)).map(p => ({ x: X(p.sem), y: Y(p.cgpa) }));
    if (up.length >= 2){
      const band = "M" + up.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") +
                   " L " + lo.slice().reverse().map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + " Z";
      svg += `<path class="cg-band cg-fade" d="${band}"/>`;
      svg += `<path class="cg-proj-edge stretch cg-fade" d="${smoothPath(up)}"/>`;
      svg += `<path class="cg-proj-edge safe cg-fade" d="${smoothPath(lo)}"/>`;
    }
  }

  /* actual area + line + dots */
  if (actualPts.length >= 2){
    const P = actualPts.map(p => ({ x: X(p.sem), y: Y(p.cgpa) }));
    const d = smoothPath(P);
    svg += `<path class="cg-area" d="${d} L${P[P.length-1].x.toFixed(1)} ${(pad.t + ih).toFixed(1)} L${P[0].x.toFixed(1)} ${(pad.t + ih).toFixed(1)} Z"/>`;
    svg += `<path class="cg-actual cg-anim" pathLength="1" d="${d}"/>`;
  }
  actualPts.forEach(p => {
    svg += `<circle class="cg-dot" cx="${X(p.sem).toFixed(1)}" cy="${Y(p.cgpa).toFixed(1)}" r="3.4"/>`;
  });

  /* projected line + dots */
  if (projPts.length >= 2){
    svg += `<path class="cg-proj cg-fade" d="${smoothPath(projPts.map(p => ({ x: X(p.sem), y: Y(p.cgpa) })))}"/>`;
  }
  projPts.forEach((p, i) => {
    if (i > 0 || m.passed === 0)
      svg += `<circle class="cg-dot future" cx="${X(p.sem).toFixed(1)}" cy="${Y(p.cgpa).toFixed(1)}" r="3.2"/>`;
  });

  /* milestone flags on the line where each milestone is projected to hit */
  const flags = [];
  (m.st.milestones || []).forEach(ms => {
    const v = num(ms);
    if (v == null || v <= 0 || v > 10) return;
    let hit = null;
    for (const p of actualPts){ if (p.cgpa >= v - 1e-9){ hit = { sem: p.sem, y: Y(p.cgpa) }; break; } }
    if (!hit) for (const p of projPts){ if (p.sem > m.passed && p.cgpa >= v - 1e-9){ hit = { sem: p.sem, y: Y(p.cgpa) }; break; } }
    if (hit) flags.push({ v, ...hit });
  });
  flags.forEach((f, i) => {
    const x = X(f.sem);
    const lift = (i % 2 === 0) ? 14 : 28;
    const topY = Math.max(pad.t + 4, f.y - lift);
    svg += `<line class="cg-flag-pole" x1="${x.toFixed(1)}" y1="${f.y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${topY.toFixed(1)}"/>`;
    svg += `<circle class="cg-flag-dot" cx="${x.toFixed(1)}" cy="${f.y.toFixed(1)}" r="3.2"/>`;
    svg += `<text class="cg-flag-lb" x="${x.toFixed(1)}" y="${(topY - 4).toFixed(1)}" text-anchor="middle">${fx(f.v)}</text>`;
  });

  svg += `<line class="cg-cross" x1="0" y1="${pad.t}" x2="0" y2="${pad.t + ih}"/>`;
  svg += `<circle class="cg-halo" r="7" cx="-20" cy="-20"/>`;

  if (!actualPts.length && !projPts.length){
    svg += `<text class="cg-emptymsg" x="${W/2}" y="${H/2}" text-anchor="middle">Enter your CGPA details to draw the projection.</text>`;
  }

  projChartEl.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="CGPA projection from semester 1 to semester ${m.total}">${svg}</svg>`;

  const items = [];
  for (let s = 1; s <= m.total; s++){
    const a = actualPts.find(p => p.sem === s) || null;
    const pr = projPts.find(p => p.sem === s) || null;
    if (!a && !pr) continue;
    const focus = pr || a;
    items.push({ sem: s, actual: a, proj: pr, px: X(s), py: Y(focus.cgpa) });
  }
  projCtx = {
    items,
    cross: projChartEl.querySelector(".cg-cross"),
    halo: projChartEl.querySelector(".cg-halo"),
    snap: m.total > 1 ? (iw / (m.total - 1)) / 1.6 : 60
  };
  projNoteEl.textContent = (m.passed > 0 && !completeHist)
    ? "Tip — add semester history in “Plan inputs” to draw your actual trend line."
    : "Shaded band shows the safe ↔ stretch finish zone; flags mark milestone landings.";
}

function updateSGPAChart(m, forecast){
  const W = Math.max(260, sgpaChartEl.clientWidth || 300);
  const H = W < 520 ? 172 : 196;
  const pad = { l: 34, r: 10, t: 14, b: 22 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const scaleMax = 10.8;
  const X = k => pad.l + ((k - 0.5) / m.total) * iw;
  const Y = v => pad.t + (1 - clampN(v, 0, scaleMax) / scaleMax) * ih;

  let svg = "";
  for (let g = 0; g <= 10; g += 2){
    const yy = Y(g);
    svg += `<line class="cg-grid" x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${yy.toFixed(1)}"/>`;
    svg += `<text class="cg-ax" x="${pad.l - 7}" y="${(yy + 3).toFixed(1)}" text-anchor="end">${g}</text>`;
  }
  svg += `<line class="cg-maxline" x1="${pad.l}" y1="${Y(10).toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${Y(10).toFixed(1)}"/>`;
  svg += `<text class="cg-max-lb" x="${(W - pad.r).toFixed(1)}" y="${(Y(10) - 4).toFixed(1)}" text-anchor="end">MAX 10</text>`;

  const cum = cumulativeMap(m, forecast.path);
  const bw = Math.min(30, (iw / m.total) * 0.58);
  const items = [];
  let any = false;

  /* required-average guide across the future region */
  const req = forecast.required;
  if (req != null && Number.isFinite(req) && req >= 0 && req <= 10 && m.remaining > 0){
    const x1 = X(m.passed + 1) - bw / 2, x2 = X(m.total) + bw / 2;
    const yy = Y(req);
    svg += `<line class="cg-target" x1="${x1.toFixed(1)}" y1="${yy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${yy.toFixed(1)}"/>`;
    svg += `<text class="cg-target-lb" x="${x2.toFixed(1)}" y="${(yy - 4).toFixed(1)}" text-anchor="end">REQ ${fx(req)}</text>`;
  }

  for (let s = 1; s <= m.total; s++){
    let val = null, kind = null;
    if (s <= m.passed){
      const h = m.hist[s - 1];
      if (h && h.sgpa != null){ val = h.sgpa; kind = "actual"; }
    } else {
      const sv = clamp01(m.st.scenario[s]);
      const pv = forecast.path[s - m.passed - 1];
      if (sv != null){ val = sv; kind = "plan"; }
      else if (pv != null){ val = pv; kind = "plan"; }
    }
    if (val == null) continue;
    any = true;
    const over = val > 10.004;
    const hgt = Math.max(2, (clampN(val, 0, scaleMax) / scaleMax) * ih);
    const x = X(s) - bw / 2, y = pad.t + ih - hgt;
    const cls = kind === "actual" ? "bar-green" : (over ? "bar-red" : "bar-blue");
    svg += `<rect class="cg-bar ${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}" rx="3"/>`;
    if (m.total <= 12 || s % 2 === 1)
      svg += `<text class="cg-ax" x="${X(s).toFixed(1)}" y="${H - 6}" text-anchor="middle">${s}</text>`;
    items.push({ s, val, kind, over, px: X(s), py: y, cgpa: cum[s] ?? null });
  }

  svg += `<line class="cg-cross" x1="0" y1="${pad.t}" x2="0" y2="${pad.t + ih}"/>`;
  if (!any) svg += `<text class="cg-emptymsg" x="${W/2}" y="${H/2}" text-anchor="middle">No SGPA data yet — add history or a plan.</text>`;

  sgpaChartEl.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Per-semester SGPA, actual and planned">${svg}</svg>`;
  sgpaCtx = { items, cross: sgpaChartEl.querySelector(".cg-cross"), halo: null, snap: iw / m.total };
  sgpaNoteEl.textContent = any ? "Green = actual · blue = planned · red = above the 10.00 ceiling." : "";
}

function updateUrgencyGraph(m){
  const W = Math.max(260, urgChartEl.clientWidth || 300);
  const H = W < 520 ? 172 : 196;
  const pad = { l: 34, r: 10, t: 14, b: 22 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  if (m.current == null || m.target == null || m.remaining <= 0){
    urgChartEl.innerHTML = emptyChartSVG(W, H, "Set current CGPA, target and remaining semesters to see urgency.");
    urgCtx = null;
    return;
  }

  const reqs = [];
  for (let k = 1; k <= m.total; k++) reqs.push(requiredWithKRemaining(m, k));
  const finite = reqs.filter(v => Number.isFinite(v));
  const scaleMax = Math.min(Math.max(10.6, Math.max(...finite, 10) + 0.5), 13);
  const X = k => pad.l + ((k - 0.5) / m.total) * iw;
  const Y = v => pad.t + (1 - clampN(v, 0, scaleMax) / scaleMax) * ih;

  let svg = "";
  for (let g = 0; g <= 10; g += 2){
    const yy = Y(g);
    svg += `<line class="cg-grid" x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${yy.toFixed(1)}"/>`;
    svg += `<text class="cg-ax" x="${pad.l - 7}" y="${(yy + 3).toFixed(1)}" text-anchor="end">${g}</text>`;
  }
  svg += `<line class="cg-maxline" x1="${pad.l}" y1="${Y(10).toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${Y(10).toFixed(1)}"/>`;
  svg += `<text class="cg-max-lb" x="${(W - pad.r).toFixed(1)}" y="${(Y(10) - 4).toFixed(1)}" text-anchor="end">MAX 10</text>`;

  const items = [];
  const bw = Math.min(34, (iw / m.total) * 0.6);
  reqs.forEach((req, i) => {
    const k = i + 1;
    if (!Number.isFinite(req)) return;
    const diff = calculateDifficulty(req);
    const h = Math.max(2, (clampN(req, 0, scaleMax) / scaleMax) * ih);
    const x = X(k) - bw / 2, y = pad.t + ih - h;
    const now = k === m.remaining;
    svg += `<rect class="cg-bar ${TONE_BAR[diff.tone] || "bar-green"}${now ? " now" : ""}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>`;
    if (now) svg += `<text class="cg-now-lb" x="${X(k).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle">${fx(req)}</text>`;
    if (m.total <= 12 || k % 2 === 1 || now)
      svg += `<text class="cg-ax" x="${X(k).toFixed(1)}" y="${H - 6}" text-anchor="middle">${k}</text>`;
    items.push({ k, req, diff, px: X(k), py: y });
  });
  svg += `<line class="cg-cross" x1="0" y1="${pad.t}" x2="0" y2="${pad.t + ih}"/>`;
  urgChartEl.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Required average SGPA versus remaining semesters">${svg}</svg>`;
  urgCtx = { items, cross: urgChartEl.querySelector(".cg-cross"), halo: null, snap: iw / m.total };
}

/* Hover / tooltip plumbing (shared by all charts) */
const projTipFmt = it => {
  let h = `<div class="t1">Semester ${it.sem}</div>`;
  if (it.actual)
    h += `<div class="t2">${fx(it.actual.cgpa)}</div><div class="t3">actual · SGPA ${it.actual.sgpa == null ? "current position" : fx(it.actual.sgpa)}</div>`;
  if (it.proj && it.proj.sgpa != null)
    h += `<div class="t2">${fx(it.proj.cgpa)}</div><div class="t3">projected · SGPA ${fx(it.proj.sgpa)}</div>`;
  else if (it.proj && !it.actual)
    h += `<div class="t2">${fx(it.proj.cgpa)}</div><div class="t3">current position</div>`;
  return h;
};
const sgpaTipFmt = it => `
  <div class="t1">Semester ${it.s} · ${it.kind === "actual" ? "actual" : "planned"}</div>
  <div class="t2">${fx(it.val)} SGPA</div>
  <div class="t3">${it.cgpa != null ? `CGPA after: ${fx(it.cgpa)}` : "CGPA — needs earlier semesters"}</div>`;
const urgTipFmt = it => `
  <div class="t1">${it.k} sem${it.k > 1 ? "s" : ""} left</div>
  <div class="t2">${fx(it.req)} avg</div>
  <div class="t3">${it.diff.label} difficulty</div>`;

function showChartTip(tipEl, x, y, html){
  const holder = tipEl.parentElement;
  tipEl.innerHTML = html;
  const hw = holder.clientWidth;
  const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
  let lx = x + 14;
  if (lx + tw > hw - 4) lx = x - tw - 14;
  if (lx < 4) lx = 4;
  let ty = y - th - 12;
  if (ty < 2) ty = y + 14;
  tipEl.style.left = lx + "px";
  tipEl.style.top  = ty + "px";
  tipEl.classList.add("show");
}
function hideChartTip(tipEl, ctx){
  tipEl.classList.remove("show");
  if (ctx && ctx.cross) ctx.cross.style.opacity = 0;
  if (ctx && ctx.halo)  ctx.halo.style.opacity = 0;
}
function attachChartHover(chartEl, tipEl, getCtx, fmt){
  chartEl.addEventListener("pointermove", e => {
    const ctx = getCtx();
    if (!ctx || !ctx.items.length) return;
    const rect = chartEl.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = null, bd = Infinity;
    for (const it of ctx.items){
      const d = Math.abs(it.px - px);
      if (d < bd){ bd = d; best = it; }
    }
    if (!best || bd > (ctx.snap ?? 48)){ hideChartTip(tipEl, ctx); return; }
    if (ctx.cross){
      ctx.cross.setAttribute("x1", best.px);
      ctx.cross.setAttribute("x2", best.px);
      ctx.cross.style.opacity = 1;
    }
    if (ctx.halo){
      ctx.halo.setAttribute("cx", best.px);
      ctx.halo.setAttribute("cy", best.py);
      ctx.halo.style.opacity = 1;
    }
    showChartTip(tipEl, best.px, best.py, fmt(best));
  });
  chartEl.addEventListener("pointerleave", () => hideChartTip(tipEl, getCtx()));
}
attachChartHover(projChartEl, projTipEl, () => projCtx, projTipFmt);
attachChartHover(sgpaChartEl, sgpaTipEl, () => sgpaCtx, sgpaTipFmt);
attachChartHover(urgChartEl,  urgTipEl,  () => urgCtx,  urgTipFmt);

/* ================================================================
   CGPA — MASTER RENDER
================================================================ */
function renderCGPA(withCharts = true){
  const m = buildModel();
  const errs = getFieldErrors();
  const required = calculateRequiredSGPA(m);
  const prog     = calculateTargetProgress(m);
  const forecast = calculateForecast(m);
  const diff     = calculateDifficulty(required);

  renderMessages(m, errs, required);
  renderInputsChrome(m);
  renderRing(m, prog);
  renderForecast(m, forecast);
  renderRequiredHero(m, required, diff);
  renderDifficulty(required, diff);
  renderScenarios(m, required);
  renderPacing(m, required);
  renderSimResults(m, forecast, required);
  renderFeasibility(m, required);
  renderMilestones(m, forecast);
  updateInsights(m, required, forecast, diff);

  if (withCharts){
    updateCGPAGraph(m, forecast);
    updateSGPAChart(m, forecast);
    updateUrgencyGraph(m);
  }
}
function onCGPAChange(){
  saveCGPAState();
  renderCGPA(true);
}

/* ================================================================
   CGPA — EVENTS
================================================================ */
function maybeAutoFillCurrent(){
  if (cgpaState.current.trim() !== "") return;
  const m = buildModel();
  if (!m.hist.length || !m.hist.every(h => h.sgpa != null)) return;
  const avg = m.hist.reduce((a, h) => a + h.sgpa, 0) / m.hist.length;
  cgpaState.current = avg.toFixed(2);
  curInput.value = cgpaState.current;
}

curInput.addEventListener("input", () => { cgpaState.current = curInput.value.trim(); onCGPAChange(); });
curInput.addEventListener("blur", () => {
  const n = clamp01(curInput.value);
  if (n != null) curInput.value = String(n);
  cgpaState.current = curInput.value.trim();
  onCGPAChange();
});
targetInput.addEventListener("input", () => { cgpaState.target = targetInput.value.trim(); onCGPAChange(); });
targetInput.addEventListener("blur", () => {
  const n = clamp01(targetInput.value);
  if (n != null) targetInput.value = String(n);
  cgpaState.target = targetInput.value.trim();
  onCGPAChange();
});
totalInput.addEventListener("change", () => {
  const n = num(totalInput.value);
  const v = clampN(Math.round(n ?? 10), 1, MAX_SEMS_LIMIT);
  totalInput.value = String(v);
  cgpaState.totalSems = String(v);
  onCGPAChange();
});
selSems.addEventListener("change", () => { cgpaState.passed = selSems.value; onCGPAChange(); });

presetRow.addEventListener("click", e => {
  const btn = e.target.closest(".cgx-preset");
  if (!btn) return;
  if (btn.dataset.target === "custom"){ targetInput.focus(); return; }
  cgpaState.target = btn.dataset.target;
  targetInput.value = btn.dataset.target;
  onCGPAChange();
});

histGridEl.addEventListener("input", e => {
  const t = e.target;
  const s = t.dataset.hsem;
  if (!s) return;
  cgpaState.history[s] = cgpaState.history[s] || {};
  cgpaState.history[s].sgpa = t.value.trim();
  maybeAutoFillCurrent();
  onCGPAChange();
});
histGridEl.addEventListener("blur", e => {
  const t = e.target;
  if (!t.dataset || !t.dataset.hsem) return;
  const n = num(t.value);
  if (n != null){
    t.value = String(clampN(n, 0, 10));
    cgpaState.history[t.dataset.hsem].sgpa = t.value;
  }
  onCGPAChange();
}, true);

simGridEl.addEventListener("input", e => {
  const t = e.target;
  const s = t.dataset.ssem;
  if (!s) return;
  cgpaState.scenario[s] = t.value.trim();
  onCGPAChange();
});
simGridEl.addEventListener("blur", e => {
  const t = e.target;
  if (!t.dataset || !t.dataset.ssem) return;
  const n = clamp01(t.value);
  if (n != null){ t.value = String(n); cgpaState.scenario[t.dataset.ssem] = t.value; }
  onCGPAChange();
}, true);

simUseReqBtn.addEventListener("click", () => {
  const m = buildModel();
  const req = calculateRequiredSGPA(m);
  if (req == null){ showToast("Enter current CGPA, target and remaining semesters first"); return; }
  const v = String(clampN(r2(req), 0, 10));
  for (let s = m.passed + 1; s <= m.total; s++){
    cgpaState.scenario[s] = v;
    const inp = simGridEl.querySelector(`[data-ssem="${s}"]`);
    if (inp) inp.value = v;
  }
  showToast(req > 10 ? "Required exceeds 10 — filled with the max 10.00" : `Filled remaining semesters with ${fx(req)}`);
  onCGPAChange();
});
simClearBtn.addEventListener("click", () => {
  cgpaState.scenario = {};
  buildSimGrid(buildModel());
  showToast("Scenario cleared");
  onCGPAChange();
});

function addMilestone(){
  const v = clamp01(msInputEl.value);
  if (v == null){ msInputEl.focus(); return; }
  const arr = (cgpaState.milestones || []).map(x => num(x)).filter(x => x != null);
  if (!arr.some(x => Math.abs(x - v) < 0.005)){
    arr.push(v);
    cgpaState.milestones = arr.map(x => x.toFixed(2));
  }
  msInputEl.value = "";
  onCGPAChange();
}
msAddBtn.addEventListener("click", addMilestone);
msInputEl.addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); addMilestone(); } });
msListEl.addEventListener("click", e => {
  const btn = e.target.closest(".rm");
  if (!btn) return;
  const v = num(btn.dataset.ms);
  cgpaState.milestones = (cgpaState.milestones || []).filter(x => Math.abs((num(x) ?? -1) - v) > 0.005);
  onCGPAChange();
});

/* open / close */
document.getElementById("cgpaToggleBtn").addEventListener("click", () => {
  cgpaModalEl.classList.add("active");
  requestAnimationFrame(() => renderCGPA(true)); /* measure charts once visible */
});
document.getElementById("closeCgpaBtn").addEventListener("click", () => cgpaModalEl.classList.remove("active"));
cgpaModalEl.addEventListener("click", e => { if (e.target === cgpaModalEl) cgpaModalEl.classList.remove("active"); });
document.addEventListener("keydown", e => { if (e.key === "Escape") cgpaModalEl.classList.remove("active"); });

/* responsive re-render */
if ("ResizeObserver" in window){
  let roTimer = null;
  new ResizeObserver(() => {
    clearTimeout(roTimer);
    roTimer = setTimeout(() => {
      if (!cgpaModalEl.classList.contains("active")) return;
      const m = buildModel();
      const forecast = calculateForecast(m);
      updateCGPAGraph(m, forecast);
      updateSGPAChart(m, forecast);
      updateUrgencyGraph(m);
    }, 120);
  }).observe(projChartEl);
}

/* ================================================================
   CGPA — INIT
================================================================ */
loadCGPAState();
curInput.value    = cgpaState.current || "";
targetInput.value = cgpaState.target || "";
totalInput.value  = String(clampN(Math.round(num(cgpaState.totalSems) ?? 10), 1, MAX_SEMS_LIMIT));
renderCGPA(false); /* charts paint on first open, when the modal has width */

/* ================================================================
   INIT (ATTENDANCE)
================================================================ */
renderRoster();

/* ================================================================
SVNIT RESULT CHECKER — INTEGRATION
================================================================ */
const RC_DATA_URL = "https://raw.githubusercontent.com/tolstoylover/svnit-result-checker/main/results.json";
const RC_STORAGE_KEY = "attendanceRegister.rc_seen.v1";
const RC_COLLAPSED_KEY = "attendanceRegister.rc_collapsed.v1";

const rcState = {
  results: [], lastUpdated: null, searchQuery: "", filterYear: "all",
  collapsedGroups: new Set(), seenIds: new Set(),
};

const rcModalEl = document.getElementById("rcModal");
const rcResultsContainer = document.getElementById("rcResultsContainer");
const rcStatsBar = document.getElementById("rcStatsBar");
const rcSeenCounter = document.getElementById("rcSeenCounter");
const rcLastUpdated = document.getElementById("rcLastUpdated");
const rcSearchInput = document.getElementById("rcSearchInput");
const rcYearFilter = document.getElementById("rcYearFilter");
const rcToastEl = document.getElementById("rcToast");

function rcLoadState() {
  try {
    const seenRaw = localStorage.getItem(RC_STORAGE_KEY);
    if (seenRaw) JSON.parse(seenRaw).forEach(id => rcState.seenIds.add(id));
    const collapsedRaw = localStorage.getItem(RC_COLLAPSED_KEY);
    if (collapsedRaw) JSON.parse(collapsedRaw).forEach(id => rcState.collapsedGroups.add(id));
  } catch (e) {}
}

function rcSaveSeen() { try { localStorage.setItem(RC_STORAGE_KEY, JSON.stringify([...rcState.seenIds])); } catch (e) {} }
function rcSaveCollapsed() { try { localStorage.setItem(RC_COLLAPSED_KEY, JSON.stringify([...rcState.collapsedGroups])); } catch (e) {} }

async function rcLoadResults() {
  rcResultsContainer.innerHTML = `<div class="rc-loading"><div class="rc-spinner"></div><div>Fetching results…</div></div>`;
  try {
    const res = await fetch(RC_DATA_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    rcState.lastUpdated = data.last_updated || new Date().toISOString();

    rcState.results = items.map((it, i) => {
      const slug = (it.url || "").split("/").pop().replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "") || `item-${i}`;
      return { id: slug, title: it.title || "Untitled", url: it.url || "#", session: it.session || "Other", year: it.year || new Date().getFullYear() };
    }).sort((a, b) => b.year - a.year);

    const ts = new Date(rcState.lastUpdated);
    rcLastUpdated.textContent = isNaN(ts) ? rcState.lastUpdated : ts.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    rcPopulateYearFilter();
    rcRender();
  } catch (e) {
    console.error("RC: Failed to load results:", e);
    rcResultsContainer.innerHTML = `<div class="rc-empty-state"><span class="emoji">⚠️</span><div><strong>Failed to load results</strong></div><div>Check your connection or try again later.</div></div>`;
    rcStatsBar.innerHTML = `<span>Error loading data</span>`;
  }
}

const rcEsc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function rcSessionBadgeClass(s) { return s === "Even" ? "rc-badge-even" : s === "Odd" ? "rc-badge-odd" : s === "Supplementary" ? "rc-badge-suppl" : "rc-badge-other"; }
function rcGroupKey(r) { return `${r.year}__${r.session}`; }

function rcGetFiltered() {
  const q = rcState.searchQuery.trim().toLowerCase();
  return rcState.results.filter(r => rcState.filterYear === "all" || String(r.year) === rcState.filterYear)
    .filter(r => !q || `${r.title} ${r.year}`.toLowerCase().includes(q));
}

function rcRender() {
  const filtered = rcGetFiltered();
  const total = rcState.results.length;
  const newCount = rcState.results.filter(r => !rcState.seenIds.has(r.id)).length;

  rcStatsBar.innerHTML = `<span>Showing <strong>${filtered.length}</strong> of <strong>${total}</strong>${newCount > 0 ? ` · <span class="rc-stat-new">${newCount} new</span>` : ""}</span>`;
  rcSeenCounter.textContent = `${rcState.seenIds.size} of ${total} seen`;

  if (filtered.length === 0) {
    rcResultsContainer.innerHTML = `<div class="rc-empty-state"><span class="emoji">📭</span><div><strong>No results found</strong></div></div>`;
    return;
  }

  const groups = new Map();
  filtered.forEach(r => {
    const key = rcGroupKey(r);
    if (!groups.has(key)) groups.set(key, { ref: r, items: [] });
    groups.get(key).items.push(r);
  });

  const sorted = [...groups.values()].sort((a, b) => a.ref.year !== b.ref.year ? b.ref.year - a.ref.year : a.ref.session.localeCompare(b.ref.session));

  rcResultsContainer.innerHTML = sorted.map(g => {
    const key = rcGroupKey(g.ref);
    const collapsed = rcState.collapsedGroups.has(key) ? "collapsed" : "";
    const newInGroup = g.items.filter(r => !rcState.seenIds.has(r.id)).length;
    return `<section class="rc-group ${collapsed}" data-key="${key}">
      <div class="rc-group-header" role="button" tabindex="0" data-rc-toggle="${key}">
        <div class="rc-group-title"><span class="rc-chevron">▼</span><span>${g.ref.session === "Other" ? "Result" : g.ref.session + " Sem"} · ${g.ref.year}</span></div>
        <div class="rc-group-meta"><span>${g.items.length} item${g.items.length !== 1 ? "s" : ""}</span>${newInGroup > 0 ? `<span class="rc-stat-new">· ${newInGroup} new</span>` : ""}</div>
      </div>
      <div class="rc-group-body"><ul class="rc-results-list">${g.items.map(rcRenderRow).join("")}</ul></div>
    </section>`;
  }).join("");
}

function rcRenderRow(r) {
  const isNew = !rcState.seenIds.has(r.id);
  return `<li class="rc-result-row ${isNew ? "unseen" : ""}">
    <div class="rc-result-info">
      <div class="rc-result-title"><span>${rcEsc(r.title)}</span>${isNew ? '<span class="rc-badge rc-badge-new">NEW</span>' : ""}<span class="rc-badge ${rcSessionBadgeClass(r.session)}">${r.session}</span></div>
      <div class="rc-result-date">${r.year}</div>
    </div>
    <div class="rc-result-actions">
      <button class="rc-icon-btn" title="Copy link" data-rc-copy="${r.id}">🔗</button>
      <a class="rc-open-link" href="${rcEsc(r.url)}" target="_blank" rel="noopener" data-rc-seen="${r.id}">Open ↗</a>
    </div>
  </li>`;
}

function rcToggleGroup(key) {
  if (rcState.collapsedGroups.has(key)) rcState.collapsedGroups.delete(key); else rcState.collapsedGroups.add(key);
  rcSaveCollapsed(); rcRender();
}

function rcMarkSeen(id) {
  if (!rcState.seenIds.has(id)) { rcState.seenIds.add(id); rcSaveSeen(); setTimeout(rcRender, 300); }
}

function rcMarkAllSeen() {
  rcState.results.forEach(r => rcState.seenIds.add(r.id));
  rcSaveSeen(); rcRender(); rcShowToast("All marked as seen");
}

function rcCopyLink(id, btn) {
  const r = rcState.results.find(x => x.id === id);
  if (!r) return;
  const flash = () => { btn.classList.add("copied"); btn.textContent = "✓"; rcShowToast("Link copied!"); setTimeout(() => { btn.classList.remove("copied"); btn.textContent = "🔗"; }, 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(r.url).then(flash).catch(() => rcFallbackCopy(r.url, flash));
  else rcFallbackCopy(r.url, flash);
}

function rcFallbackCopy(text, cb) {
  const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); 
  try { document.execCommand("copy"); if(cb) cb(); } catch(e) {}
  document.body.removeChild(ta);
}

function rcShowToast(msg) {
  rcToastEl.textContent = msg; rcToastEl.classList.add("show");
  clearTimeout(rcShowToast._t); rcShowToast._t = setTimeout(() => rcToastEl.classList.remove("show"), 2000);
}

function rcPopulateYearFilter() {
  const sel = rcYearFilter; while (sel.options.length > 1) sel.remove(1);
  [...new Set(rcState.results.map(r => r.year))].sort((a, b) => b - a).forEach(y => {
    const o = document.createElement("option"); o.value = y; o.textContent = y; sel.appendChild(o);
  });
}

rcResultsContainer.addEventListener("click", e => {
  const toggleBtn = e.target.closest("[data-rc-toggle]"); if (toggleBtn) { rcToggleGroup(toggleBtn.dataset.rcToggle); return; }
  const copyBtn = e.target.closest("[data-rc-copy]"); if (copyBtn) { rcCopyLink(copyBtn.dataset.rcCopy, copyBtn); return; }
  const seenLink = e.target.closest("[data-rc-seen]"); if (seenLink) { rcMarkSeen(seenLink.dataset.rcSeen); return; }
});

rcResultsContainer.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    const toggleBtn = e.target.closest("[data-rc-toggle]");
    if (toggleBtn) { e.preventDefault(); rcToggleGroup(toggleBtn.dataset.rcToggle); }
  }
});

rcSearchInput.addEventListener("input", e => { rcState.searchQuery = e.target.value; rcRender(); });
rcYearFilter.addEventListener("change", e => { rcState.filterYear = e.target.value; rcRender(); });
document.getElementById("rcMarkAllBtn").addEventListener("click", rcMarkAllSeen);

document.getElementById("rcToggleBtn").addEventListener("click", () => {
  rcModalEl.classList.add("active");
  if (rcState.results.length === 0) rcLoadResults();
});

document.getElementById("rcCloseBtn").addEventListener("click", () => rcModalEl.classList.remove("active"));
rcModalEl.addEventListener("click", e => { if (e.target === rcModalEl) rcModalEl.classList.remove("active"); });

// Extend existing Escape key listener
document.addEventListener("keydown", e => { 
  if (e.key === "Escape" && rcModalEl && rcModalEl.classList.contains("active")) rcModalEl.classList.remove("active"); 
});

rcLoadState();