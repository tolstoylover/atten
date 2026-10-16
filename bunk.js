/* ================================================================
   CAN I BUNK? — base calculator + 75% Deadline Calculator
   Single shared source (total / present). Full precision internally,
   rounded only for display. Reuses index.js helpers:
   escapeHtml, showToast, tweenNum, reduceMotion.
================================================================ */
;(function () {
  "use strict";

  /* ──────────────────────────────────────────────────────────────
     §1  PURE MATH — full precision internally, integer comparisons
  ────────────────────────────────────────────────────────────── */
  const BK_REQ = 75;
  const BK_CRIT = 60;
  const BK_MAX_INPUT = 1000;

  function calculateAttendance(present, total) {
    if (!Number.isFinite(present) || !Number.isFinite(total) || total <= 0) return null;
    return (present / total) * 100;
  }
  function calculateAttendanceAfterBunk(present, total, bunkCount) {
    const t = total + bunkCount;
    if (!Number.isFinite(present) || t <= 0) return null;
    return (present / t) * 100;
  }
  function calculateSafeBunks(present, total, threshold) {
    if (!Number.isFinite(present) || total <= 0) return 0;
    const n = 100 * present - threshold * total;
    return n < 0 ? 0 : Math.floor(n / threshold);
  }
  function calculateRecoveryClasses(present, total, threshold) {
    if (!Number.isFinite(present) || total <= 0) return null;
    if (100 * present >= threshold * total) return 0;
    if (threshold >= 100) return Infinity;
    return Math.ceil((threshold * total - 100 * present) / (100 - threshold));
  }
  function calculateProjectedAttendance(present, total, attended, bunked) {
    const nt = total + attended + bunked;
    if (!Number.isFinite(present) || nt <= 0) return null;
    return ((present + attended) / nt) * 100;
  }
  function bkZone(present, total) {
    if (!Number.isFinite(present) || total <= 0) return null;
    if (100 * present >= BK_REQ * total) return "safe";
    if (100 * present < BK_CRIT * total) return "danger";
    return "warning";
  }

  function fmtPct(v) { return (v == null || !Number.isFinite(v)) ? "—" : (Math.round(v * 100) / 100).toFixed(2) + "%"; }

  /* ──────────────────────────────────────────────────────────────
     §2  STATE + persistence
  ────────────────────────────────────────────────────────────── */
  const BK_KEY = "attendanceRegister.bunk.v1";
  let bkDebTimer = null, bkSaveTimer = null, bkTrigger = null;
  let bkAttend = 0, bkBunk = 1;
  let bkLastP = null, bkLastT = null;

  function bkLoadState() {
    try {
      const d = JSON.parse(localStorage.getItem(BK_KEY));
      if (d && Number.isFinite(d.total) && Number.isFinite(d.present)) return d;
    } catch (e) {}
    return null;
  }
  function bkSaveState(total, present) {
    clearTimeout(bkSaveTimer);
    bkSaveTimer = setTimeout(() => {
      try { localStorage.setItem(BK_KEY, JSON.stringify({ total, present })); } catch (e) {}
    }, 300);
  }

  /* ──────────────────────────────────────────────────────────────
     §3  BUILD MODAL BODY (built once)
  ────────────────────────────────────────────────────────────── */
  function bkBuild() {
    document.getElementById("bkBody").innerHTML =
      '<section class="bk-card" aria-label="Attendance summary">' +
        '<div class="bk-inputs">' +
          '<div class="bk-field"><label for="bkTotal">Total classes held</label>' +
            '<input id="bkTotal" type="number" inputmode="numeric" min="0" max="' + BK_MAX_INPUT + '" step="1" placeholder="e.g. 46" autocomplete="off"></div>' +
          '<div class="bk-field"><label for="bkPresent">Classes attended</label>' +
            '<input id="bkPresent" type="number" inputmode="numeric" min="0" max="' + BK_MAX_INPUT + '" step="1" placeholder="e.g. 36" autocomplete="off"></div>' +
          '<div class="bk-field"><label for="bkAbsent">Classes absent</label>' +
            '<input id="bkAbsent" type="number" inputmode="numeric" min="0" max="' + BK_MAX_INPUT + '" step="1" placeholder="auto" autocomplete="off"></div>' +
        '</div>' +
        '<div class="bk-err" id="bkErr" aria-live="polite"></div>' +
        '<div class="bk-hero" id="bkHero" aria-live="polite">' +
          '<div class="bk-hero-label">Current attendance</div>' +
          '<div class="bk-hero-num" id="bkPct">—</div>' +
          '<span class="bk-badge" id="bkZoneBadge">Enter your numbers</span>' +
        '</div>' +
        '<div class="bk-progress-wrap" id="bkProgress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Attendance percentage">' +
          '<div class="bk-track"><div class="bk-fill" id="bkFill"></div>' +
            '<div class="bk-th crit" style="left:' + BK_CRIT + '%"><span>' + BK_CRIT + '%</span></div>' +
            '<div class="bk-th req" style="left:' + BK_REQ + '%"><span>' + BK_REQ + '%</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="bk-buffer-card">' +
          '<h3 class="bk-buffer-heading">Can I bunk?</h3>' +
          '<div class="bk-buffer-label">Maximum additional absences while remaining ≥' + BK_REQ + '%</div>' +
          '<div class="bk-buffer-num" id="bkBufferNum">—</div>' +
          '<div class="bk-verify" id="bkVerify"></div>' +
        '</div>' +
      '</section>' +

      '<section class="bk-card" aria-label="75 percent Deadline Calculator">' +
        '<h3 class="bk-card-title">🚨 75% Deadline Calculator</h3>' +
        '<p class="bk-card-sub">Know exactly how many classes you must attend to reach 75%.</p>' +
        '<div id="bkDeadlineBody"></div>' +
      '</section>' +

      '<div class="bk-footer-note">Based on the numbers you entered. Verify against the official portal; ' +
      'institute rules on medical leave or condonation may differ.</div>';
  }

  /* ──────────────────────────────────────────────────────────────
     §4  VALIDATION
  ────────────────────────────────────────────────────────────── */
  function readInt(el) {
    const raw = el.value.trim();
    if (raw === "") return { empty: true };
    const n = Number(raw);
    if (!Number.isFinite(n)) return { bad: "not a number" };
    if (!Number.isInteger(n)) return { bad: "whole numbers only" };
    if (n < 0) return { bad: "cannot be negative" };
    if (n > BK_MAX_INPUT) return { bad: "too large (max " + BK_MAX_INPUT + ")" };
    return { val: n };
  }

  function bkResolve() {
    const tEl = document.getElementById("bkTotal");
    const pEl = document.getElementById("bkPresent");
    const aEl = document.getElementById("bkAbsent");
    const t = readInt(tEl), p = readInt(pEl), a = readInt(aEl);

    let err = "";
    if (t.bad) err = "Total classes: " + t.bad + ".";
    else if (p.bad) err = "Classes attended: " + p.bad + ".";
    else if (a.bad) err = "Classes absent: " + a.bad + ".";
    else if (!t.empty && !p.empty && !a.empty && p.val + a.val !== t.val) err = "Attended + absent must equal total classes.";
    else if (!t.empty && !p.empty && p.val > t.val) err = "Attended cannot be more than total.";
    else if (!t.empty && !a.empty && a.val > t.val) err = "Absent cannot be more than total.";

    if (err || t.empty || t.val === 0 || (p.empty && a.empty)) {
      return { valid: false, err, T: null, P: null, els: { tEl, pEl, aEl } };
    }
    const T = t.val;
    let P = !p.empty ? p.val : T - a.val;
    return { valid: true, err: "", T, P, els: { tEl, pEl, aEl } };
  }

  /* ──────────────────────────────────────────────────────────────
     §5  DEADLINE CALCULATOR RENDER
  ────────────────────────────────────────────────────────────── */
  function zoneBadge(zone) {
    if (zone === "safe") return '<span class="bk-badge safe">✓ Safe zone · ≥' + BK_REQ + '%</span>';
    if (zone === "warning") return '<span class="bk-badge warning">⚠ Warning zone · ' + BK_CRIT + '–' + BK_REQ + '%</span>';
    if (zone === "danger") return '<span class="bk-badge danger">✕ Danger zone · below ' + BK_CRIT + '%</span>';
    return '<span class="bk-badge">Enter your numbers</span>';
  }

  function bkBuildSteps(P, T, attend, bunk) {
    const steps = [];
    let p = P, t = T;
    for (let i = 0; i < attend; i++) { p++; t++; steps.push({ action: "attend", p, t, pct: (p / t) * 100 }); }
    for (let i = 0; i < bunk; i++)   { t++; steps.push({ action: "bunk",   p, t, pct: (p / t) * 100 }); }
    return steps;
  }
  function bkTimelineHTML(P, T, steps) {
    if (!steps.length) return '<div class="bk-tl-empty">Adjust attend/bunk above to preview your timeline.</div>';
    const MAX = 13;
    let html = '<div class="bk-tl-start">CURRENT · ' + fmtPct(calculateAttendance(P, T)) + '</div>';
    const show = steps.length <= MAX ? steps : steps.slice(0, MAX - 1).concat(steps[steps.length - 1]);
    const skipped = steps.length - show.length;
    show.forEach((s, i) => {
      if (skipped > 0 && i === MAX - 1) html += '<div class="bk-tl-more">… +' + skipped + ' more step' + (skipped > 1 ? "s" : "") + ' …</div>';
      const z = bkZone(s.p, s.t);
      const mark = z === "safe" ? "✓" : (z === "warning" ? "⚠" : "✕");
      const label = s.action === "attend" ? "✓ Attend" : "✕ Bunk";
      html += '<div class="bk-tl-step ' + z + '">' +
        '<span class="bk-tl-action ' + s.action + '">' + label + '</span>' +
        '<span class="bk-tl-pct">' + fmtPct(s.pct) + '</span>' +
        '<span class="bk-tl-mark">' + mark + '</span>' +
      '</div>';
    });
    return html;
  }

  function bkDeadlineHTML(P, T, attend, bunk) {
    const cur = calculateAttendance(P, T);
    const zone = bkZone(P, T);
    const gap = BK_REQ - cur;

    let status =
      '<div class="bk-status-row">' +
        '<div class="bk-chip"><div class="k">Current attendance</div><div class="v ' + (zone === "safe" ? "green" : zone === "warning" ? "amber" : "red") + '">' + fmtPct(cur) + '</div></div>' +
        '<div class="bk-chip"><div class="k">Required attendance</div><div class="v">' + fmtPct(BK_REQ) + '</div></div>' +
        '<div class="bk-chip"><div class="k">Gap</div><div class="v ' + (gap > 0 ? "red" : "green") + '">' + (gap > 0 ? fmtPct(gap) : "0.00%") + '</div></div>' +
      '</div>';

    let main = "";
    if (zone === "safe") {
      const bufferPts = cur - BK_REQ;
      const safeBunks = calculateSafeBunks(P, T, BK_REQ);
      main = '<div class="bk-result-card safe">' +
        '<div class="bk-rc-title">🎯 You\u2019re above the requirement</div>' +
        '<div class="bk-rc-big safe">' + fmtPct(cur) + '</div>' +
        '<div class="bk-rc-biglb">Current attendance</div>' +
        '<div class="bk-rc-rows">' +
          '<div class="bk-rc-row"><span>Safe buffer</span><b>' + fmtPct(bufferPts) + '</b></div>' +
          '<div class="bk-rc-row"><span>You can safely miss</span><b>' + safeBunks + ' class' + (safeBunks === 1 ? "" : "es") + '</b></div>' +
        '</div>' +
        '<span class="bk-badge safe">✓ SAFE — ABOVE ' + BK_REQ + '%</span>' +
      '</div>';
    } else {
      const rec = calculateRecoveryClasses(P, T, BK_REQ);
      const tone = zone === "danger" ? "danger" : "warning";
      main = '<div class="bk-result-card ' + tone + '">' +
        '<div class="bk-rc-title">Recovery needed to reach ' + BK_REQ + '%</div>' +
        '<div class="bk-rc-big ' + tone + '">' + (Number.isFinite(rec) ? rec : "∞") + '</div>' +
        '<div class="bk-rc-biglb">Consecutive classes to attend</div>' +
        '<div class="bk-rc-note ' + (tone === "danger" ? "bad" : "warn") + '">' +
          (zone === "danger" ? "You are below " + BK_CRIT + "% — this is the danger zone. " : "") +
          'Attend the next <b>' + (Number.isFinite(rec) ? rec : "—") + '</b> class' + (rec === 1 ? "" : "es") +
          ' in a row to get back to ≥' + BK_REQ + '%.</div>' +
      '</div>';
    }

    const maxBunks = calculateSafeBunks(P, T, BK_REQ);
    let drop = "";
    if (maxBunks > 0) {
      const afterN  = calculateAttendanceAfterBunk(P, T, maxBunks);
      const afterN1 = calculateAttendanceAfterBunk(P, T, maxBunks + 1);
      drop = '<div class="bk-rc-rows" style="margin-top:14px">' +
        '<div class="bk-rc-row"><span>You can miss (consecutive)</span><b>' + maxBunks + ' class' + (maxBunks === 1 ? "" : "es") + '</b></div>' +
        '<div class="bk-rc-row"><span>After ' + maxBunks + ' bunk' + (maxBunks === 1 ? "" : "s") + '</span><b>' + fmtPct(afterN) + '</b></div>' +
        '<div class="bk-rc-row"><span>After ' + (maxBunks + 1) + ' bunks</span><b class="neg">' + fmtPct(afterN1) + ' ⚠️</b></div>' +
      '</div>';
    } else {
      drop = '<div class="bk-rc-rows" style="margin-top:14px">' +
        '<div class="bk-rc-row"><span>You can miss (consecutive)</span><b class="neg">0 — no safe bunks</b></div>' +
      '</div>';
    }

    const proj = calculateProjectedAttendance(P, T, attend, bunk);
    const projZone = (proj == null) ? null : bkZone(P + attend, T + attend + bunk);
    const whatif =
      '<hr class="bk-divider">' +
      '<div class="bk-whatif">' +
        '<div class="bk-stepper"><label>Classes to ATTEND</label>' +
          '<div class="bk-step-ctrl">' +
            '<button type="button" class="bk-step-btn" id="bkAttendMinus" aria-label="Decrease classes to attend">−</button>' +
            '<span class="bk-step-val" id="bkAttendVal" aria-live="polite">' + attend + '</span>' +
            '<button type="button" class="bk-step-btn" id="bkAttendPlus" aria-label="Increase classes to attend">+</button>' +
          '</div></div>' +
        '<div class="bk-stepper"><label>Classes to BUNK</label>' +
          '<div class="bk-step-ctrl">' +
            '<button type="button" class="bk-step-btn" id="bkBunkMinus" aria-label="Decrease classes to bunk">−</button>' +
            '<span class="bk-step-val" id="bkBunkVal" aria-live="polite">' + bunk + '</span>' +
            '<button type="button" class="bk-step-btn" id="bkBunkPlus" aria-label="Increase classes to bunk">+</button>' +
          '</div></div>' +
        '<div class="bk-projected"><span class="k">Projected attendance</span>' +
          '<span class="v ' + (projZone || "") + '" id="bkProjVal">' + fmtPct(proj) + '</span></div>' +
      '</div>' +
      '<div class="bk-timeline" id="bkTimeline">' + bkTimelineHTML(P, T, bkBuildSteps(P, T, attend, bunk)) + '</div>' +

      '<details class="bk-how">' +
        '<summary>How is this calculated?</summary>' +
        '<div class="bk-how-body">' +
          'Attendance = <code>present ÷ total × 100</code><br>' +
          'After bunking k classes = <code>present ÷ (total + k)</code><br>' +
          'Safe bunks = largest k where <code>present/(total+k) ≥ 0.75</code><br>' +
          'Recovery = smallest x where <code>(present+x)/(total+x) ≥ 0.75</code><br>' +
          'Projected = <code>(present + attend) ÷ (total + attend + bunk)</code><br>' +
          'All comparisons use the raw Present/Total counts — never rounded values.' +
        '</div>' +
      '</details>';

    return status + main + drop + whatif;
  }

  /* ──────────────────────────────────────────────────────────────
     §6  MASTER UPDATE
  ────────────────────────────────────────────────────────────── */
  function bkUpdate() {
    const r = bkResolve();
    document.getElementById("bkErr").textContent = r.err;

    const hero    = document.getElementById("bkHero");
    const pctEl   = document.getElementById("bkPct");
    const badge   = document.getElementById("bkZoneBadge");
    const fill    = document.getElementById("bkFill");
    const prog    = document.getElementById("bkProgress");
    const bufNum  = document.getElementById("bkBufferNum");
    const verify  = document.getElementById("bkVerify");
    const deadline = document.getElementById("bkDeadlineBody");

    if (!r.valid) {
      hero.className = "bk-hero";
      tweenNum(pctEl, null, v => v.toFixed(2) + "%");
      badge.outerHTML = zoneBadge(null).replace('class="bk-badge"', 'id="bkZoneBadge" class="bk-badge"');
      fill.className = "bk-fill"; fill.style.width = "0%";
      prog.setAttribute("aria-valuenow", "0");
      bufNum.className = "bk-buffer-num"; bufNum.textContent = "—";
      verify.innerHTML = "";
      deadline.innerHTML = '<div class="bk-neutral">No attendance data available.</div>';
      bkLastP = null; bkLastT = null;
      return;
    }

    const T = r.T, P = r.P;
    const pct = calculateAttendance(P, T);
    const zone = bkZone(P, T);

    bkSaveState(T, P);

    hero.className = "bk-hero zone-" + zone;
    tweenNum(pctEl, pct, v => v.toFixed(2) + "%");
    badge.outerHTML = zoneBadge(zone).replace('class="bk-badge', 'id="bkZoneBadge" class="bk-badge');

    fill.className = "bk-fill " + (zone === "safe" ? "" : zone);
    fill.style.width = Math.min(100, pct) + "%";
    prog.setAttribute("aria-valuenow", pct.toFixed(2));

    const buffer = calculateSafeBunks(P, T, BK_REQ);
    bufNum.className = "bk-buffer-num " + zone;
    bufNum.textContent = String(buffer);
    if (buffer > 0) {
      const t1 = T + buffer, t2 = T + buffer + 1;
      verify.innerHTML = "After <b>" + buffer + "</b> more absence" + (buffer > 1 ? "s" : "") +
        ": " + P + "/" + t1 + " = <b>" + fmtPct(calculateAttendance(P, t1)) + "</b>. " +
        "One more (" + (buffer + 1) + ") would drop you to <b>" + fmtPct(calculateAttendance(P, t2)) + "</b>.";
    } else if (zone === "safe") {
      verify.innerHTML = "You are exactly at the line. One absence drops you below " + BK_REQ + "%.";
    } else {
      verify.innerHTML = "Buffer is 0 — any further absence pushes you deeper below " + BK_REQ + "%.";
    }

    if (P !== bkLastP || T !== bkLastT) {
      if (zone === "safe") { bkAttend = 0; bkBunk = 1; }
      else { bkAttend = Math.min(calculateRecoveryClasses(P, T, BK_REQ) || 0, 30); bkBunk = 0; }
      bkLastP = P; bkLastT = T;
    }

    deadline.innerHTML = bkDeadlineHTML(P, T, bkAttend, bkBunk);
    bkBindSteppers();
  }

  /* ──────────────────────────────────────────────────────────────
     §7  WHAT-IF STEPPERS
  ────────────────────────────────────────────────────────────── */
  function bkBindSteppers() {
    const set = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    set("bkAttendMinus", () => bkStep("attend", -1));
    set("bkAttendPlus",  () => bkStep("attend", +1));
    set("bkBunkMinus",   () => bkStep("bunk", -1));
    set("bkBunkPlus",    () => bkStep("bunk", +1));
  }
  function bkStep(which, delta) {
    if (which === "attend") bkAttend = Math.max(0, Math.min(60, bkAttend + delta));
    else bkBunk = Math.max(0, Math.min(60, bkBunk + delta));
    const r = bkResolve();
    if (!r.valid) return;
    const av = document.getElementById("bkAttendVal"); if (av) av.textContent = String(bkAttend);
    const bv = document.getElementById("bkBunkVal");   if (bv) bv.textContent = String(bkBunk);
    const proj = calculateProjectedAttendance(r.P, r.T, bkAttend, bkBunk);
    const projZone = proj == null ? null : bkZone(r.P + bkAttend, r.T + bkAttend + bkBunk);
    const pv = document.getElementById("bkProjVal");
    if (pv) { pv.textContent = fmtPct(proj); pv.className = "v " + (projZone || ""); }
    const tl = document.getElementById("bkTimeline");
    if (tl) tl.innerHTML = bkTimelineHTML(r.P, r.T, bkBuildSteps(r.P, r.T, bkAttend, bkBunk));
  }

  /* ──────────────────────────────────────────────────────────────
     §8  FIELD SYNC
  ────────────────────────────────────────────────────────────── */
  function bkSync(changed) {
    const tEl = document.getElementById("bkTotal");
    const pEl = document.getElementById("bkPresent");
    const aEl = document.getElementById("bkAbsent");
    const t = readInt(tEl), p = readInt(pEl), a = readInt(aEl);
    if (t.empty || t.bad) return;
    if (changed === "present" && !p.empty && !p.bad && p.val <= t.val) aEl.value = String(t.val - p.val);
    else if (changed === "absent" && !a.empty && !a.bad && a.val <= t.val) pEl.value = String(t.val - a.val);
    else if (changed === "total") {
      if (!p.empty && !p.bad) aEl.value = String(Math.max(0, t.val - p.val));
      else if (!a.empty && !a.bad) pEl.value = String(Math.max(0, t.val - a.val));
    }
  }

  /* ──────────────────────────────────────────────────────────────
     §9  MODAL OPEN / CLOSE / FOCUS
  ────────────────────────────────────────────────────────────── */
  function bkOpen() {
    bkTrigger = document.activeElement;
    document.getElementById("bkModal").classList.add("active");
    bkUpdate();
    requestAnimationFrame(() => document.getElementById("bkTotal").focus());
  }
  function bkClose() {
    document.getElementById("bkModal").classList.remove("active");
    if (bkTrigger && bkTrigger.focus) bkTrigger.focus();
  }

  /* ──────────────────────────────────────────────────────────────
     §10  SELF-TESTS
  ────────────────────────────────────────────────────────────── */
  function bkRunTests() {
    const c = [
      ["28/31 pct", Math.round(calculateAttendance(28, 31) * 100) / 100, 90.32],
      ["28/31 safeBunks@75", calculateSafeBunks(28, 31, 75), 6],
      ["3/4 = 75 safe", bkZone(3, 4), "safe"],
      ["20/30 recovery@75", calculateRecoveryClasses(20, 30, 75), 10],
      ["30/40 = 75", Math.round(calculateAttendance(30, 40) * 100) / 100, 75],
      ["18/30 = 60 warning", bkZone(18, 30), "warning"],
      ["17/30 danger", bkZone(17, 30), "danger"],
      ["projected a3 b2", Math.round(calculateProjectedAttendance(36, 46, 3, 2) * 100) / 100, 76.47],
      ["T=0 null", calculateAttendance(5, 0), null]
    ];
    let pass = 0;
    c.forEach(x => {
      const ok = x[1] === x[2];
      if (!ok) console.warn("[bunkTest FAIL] " + x[0] + ": got " + x[1] + ", expected " + x[2]); else pass++;
    });
    console.log("[bunkTest] " + pass + "/" + c.length + " passed.");
  }

  /* ──────────────────────────────────────────────────────────────
     §11  INIT
  ────────────────────────────────────────────────────────────── */
  function bkInit() {
    const modal = document.getElementById("bkModal");
    const openBtn = document.getElementById("bkToggleBtn");
    if (!modal || !openBtn) return;

    bkBuild();

    const saved = bkLoadState();
    if (saved) {
      document.getElementById("bkTotal").value = String(saved.total);
      document.getElementById("bkPresent").value = String(saved.present);
      document.getElementById("bkAbsent").value = String(Math.max(0, saved.total - saved.present));
    }

    openBtn.addEventListener("click", bkOpen);
    document.getElementById("bkCloseBtn").addEventListener("click", bkClose);
    modal.addEventListener("click", e => { if (e.target === modal) bkClose(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("active")) bkClose(); });

    modal.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const f = modal.querySelectorAll('button, input, summary, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    const onInput = changed => {
      bkSync(changed);
      clearTimeout(bkDebTimer);
      bkDebTimer = setTimeout(bkUpdate, 150);
    };
    document.getElementById("bkTotal").addEventListener("input", () => onInput("total"));
    document.getElementById("bkPresent").addEventListener("input", () => onInput("present"));
    document.getElementById("bkAbsent").addEventListener("input", () => onInput("absent"));

    bkRunTests();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bkInit);
  else bkInit();
})();