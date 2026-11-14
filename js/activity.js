/* =========================================================
   Activity calendar — GitHub contributions + LeetCode
   submissions for the last 53 weeks, drawn as one heatmap.
   Data comes from activity.json, which
   .github/workflows/activity.yml publishes to the `data` branch.
   ========================================================= */

(() => {
  const card = document.getElementById("activity-card");
  if (!card) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const CELL = 12;
  const GAP = 3;
  const STEP = CELL + GAP;
  const LEFT = 30; // room for weekday labels
  const TOP = 18; // room for month labels
  const WEEKS = 53;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const MODES = {
    combined: { label: "Total activity", one: "total", many: "total", empty: "No activity" },
    github: { label: "GitHub contributions", one: "contribution", many: "contributions", empty: "No contributions" },
    leetcode: { label: "LeetCode submissions", one: "submission", many: "submissions", empty: "No submissions" },
  };

  const $ = (id) => document.getElementById(id);
  const scroller = $("heatmap-scroll");
  const status = $("heatmap-status");
  const tip = $("heat-tip");
  const live = $("heat-live");
  const buttons = card.querySelectorAll(".seg-btn");

  let days = []; // [{ key, date, gh, lc }] oldest first, ending today
  let cells = []; // SVG rects, same order as days
  let mode = "combined";
  let current = -1; // index of the highlighted day

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const plural = (n, m) => `${n.toLocaleString("en-IN")} ${n === 1 ? m.one : m.many}`;
  const valueOf = (day) => (mode === "github" ? day.gh : mode === "leetcode" ? day.lc : day.gh + day.lc);
  const formatDate = (d) =>
    `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  function el(name, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text) node.textContent = text;
    return node;
  }

  /* ---------- Data ---------- */

  // Calendar days from the Sunday 52 weeks back through today (viewer's local date)
  function buildDays(data) {
    const gh = data.github?.days || {};
    const lc = data.leetcode?.days || {};
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - today.getUTCDay() - (WEEKS - 1) * 7);

    const list = [];
    for (const d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = keyOf(d);
      list.push({ key, date: new Date(d), gh: gh[key] || 0, lc: lc[key] || 0 });
    }
    return list;
  }

  function stats() {
    const values = days.map(valueOf);
    const total = values.reduce((a, b) => a + b, 0);
    const active = values.filter((v) => v > 0).length;

    let longest = 0;
    let run = 0;
    for (const v of values) {
      run = v > 0 ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    // A streak is still alive if today has no activity yet but yesterday did
    let i = values.length - 1;
    if (values[i] === 0) i--;
    let streak = 0;
    while (i >= 0 && values[i] > 0) {
      streak++;
      i--;
    }
    return { total, active, longest, streak, max: Math.max(0, ...values) };
  }

  // Square-root scale from 1 (level 1) to the busiest day (level 4), so a few
  // busy days don't wash out the rest
  function level(v, max) {
    if (v <= 0) return 0;
    if (max <= 1) return 4;
    const t = (Math.sqrt(v) - 1) / (Math.sqrt(max) - 1);
    return 1 + Math.round(t * 3);
  }

  /* ---------- Drawing ---------- */

  function draw() {
    const width = LEFT + WEEKS * STEP;
    const height = TOP + 7 * STEP;
    const svg = el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      tabindex: "0",
    });

    // Month labels sit above the first week that contains the 1st of a month
    let lastLabelWeek = -4;
    days.forEach((day, i) => {
      if (day.date.getUTCDate() !== 1) return;
      const week = Math.floor(i / 7);
      if (week - lastLabelWeek < 3 || week > WEEKS - 2) return;
      svg.append(el("text", { x: LEFT + week * STEP, y: 11, class: "hm-label" }, MONTHS[day.date.getUTCMonth()]));
      lastLabelWeek = week;
    });
    [1, 3, 5].forEach((row) => {
      svg.append(el("text", { x: 0, y: TOP + row * STEP + CELL - 2, class: "hm-label" }, WEEKDAYS[row]));
    });

    cells = days.map((day, i) => {
      const rect = el("rect", {
        x: LEFT + Math.floor(i / 7) * STEP,
        y: TOP + (i % 7) * STEP,
        width: CELL,
        height: CELL,
        rx: 2.5,
        class: "hm-cell l0",
      });
      rect.dataset.i = i;
      svg.append(rect);
      return rect;
    });

    svg.addEventListener("pointermove", (e) => {
      const i = e.target.dataset?.i;
      if (i !== undefined) show(Number(i));
    });
    svg.addEventListener("pointerdown", (e) => {
      const i = e.target.dataset?.i;
      if (i !== undefined) show(Number(i));
    });
    svg.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") hide();
    });
    svg.addEventListener("focus", () => show(current >= 0 ? current : days.length - 1, true));
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", onKey);
    // Touch has no pointerleave to close the tooltip; a tap elsewhere does it
    document.addEventListener("pointerdown", (e) => {
      if (!svg.contains(e.target)) hide();
    });

    scroller.replaceChildren(svg);
    // Most recent weeks first on narrow screens
    scroller.scrollLeft = scroller.scrollWidth;
  }

  function paint() {
    const s = stats();
    cells.forEach((rect, i) => {
      rect.setAttribute("class", `hm-cell l${level(valueOf(days[i]), s.max)}`);
    });
    if (current >= 0) cells[current].classList.add("active");

    const m = MODES[mode];
    $("stat-total-label").textContent = m.label;
    $("stat-total").textContent = s.total.toLocaleString("en-IN");
    $("stat-active").textContent = s.active;
    $("stat-current").innerHTML = "";
    $("stat-current").append(String(s.streak), small(s.streak === 1 ? "day" : "days"));
    $("stat-longest").innerHTML = "";
    $("stat-longest").append(String(s.longest), small(s.longest === 1 ? "day" : "days"));

    const svg = scroller.querySelector("svg");
    if (svg) {
      svg.setAttribute(
        "aria-label",
        `${m.label} calendar, last 12 months: ${plural(s.total, m)} over ${s.active} active days. ` +
          `Longest streak ${s.longest} days. Use the arrow keys to read individual days.`
      );
    }
    if (current >= 0 && !tip.hidden) fillTip(current);
  }

  function small(text) {
    const node = document.createElement("small");
    node.textContent = text;
    return node;
  }

  /* ---------- Tooltip ---------- */

  function fillTip(i) {
    const day = days[i];
    const m = MODES[mode];
    const v = valueOf(day);
    tip.replaceChildren();

    const head = document.createElement("strong");
    head.textContent = v ? plural(v, m) : m.empty;
    const date = document.createElement("span");
    date.className = "tip-date";
    date.textContent = formatDate(day.date);
    tip.append(head, date);

    if (mode === "combined" && v) {
      for (const [name, n] of [["GitHub", day.gh], ["LeetCode", day.lc]]) {
        const row = document.createElement("span");
        row.className = "tip-row";
        const label = document.createElement("span");
        label.textContent = name;
        const count = document.createElement("b");
        count.textContent = n;
        row.append(label, count);
        tip.append(row);
      }
    }
  }

  function show(i, announce = false) {
    if (current >= 0) cells[current].classList.remove("active");
    current = i;
    const rect = cells[i];
    rect.classList.add("active");
    fillTip(i);
    tip.hidden = false;
    // Keyboard and screen-reader users get the same readout as the tooltip
    if (announce) {
      const day = days[i];
      const v = valueOf(day);
      const parts = [v ? plural(v, MODES[mode]) : MODES[mode].empty, formatDate(day.date)];
      if (mode === "combined" && v) parts.push(`GitHub ${day.gh}, LeetCode ${day.lc}`);
      live.textContent = parts.join(". ");
    }

    // Position above the cell, kept inside the card
    const box = rect.getBoundingClientRect();
    const host = card.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = box.left - host.left + box.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, host.width - tw - 8));
    let top = box.top - host.top - th - 10;
    if (top < 8) top = box.bottom - host.top + 10;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function hide() {
    tip.hidden = true;
    if (current >= 0) cells[current].classList.remove("active");
  }

  function onKey(e) {
    const moves = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -Infinity, End: Infinity };
    if (e.key === "Escape") return hide();
    if (!(e.key in moves)) return;
    e.preventDefault();
    const from = current >= 0 ? current : days.length - 1;
    const next = Math.max(0, Math.min(days.length - 1, from + moves[e.key]));
    show(next, true);
    cells[next].scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  /* ---------- Table, sources, controls ---------- */

  function fillTable() {
    const months = new Map();
    for (const day of days) {
      const key = `${MONTHS[day.date.getUTCMonth()]} ${day.date.getUTCFullYear()}`;
      const row = months.get(key) || { gh: 0, lc: 0 };
      row.gh += day.gh;
      row.lc += day.lc;
      months.set(key, row);
    }
    const rows = [...months].reverse().map(([month, { gh, lc }]) => {
      const tr = document.createElement("tr");
      for (const value of [month, gh, lc, gh + lc]) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      return tr;
    });
    $("activity-tbody").replaceChildren(...rows);
  }

  function fillSources(data) {
    const ghTotal = days.reduce((sum, d) => sum + d.gh, 0);
    if (data.github) $("gh-total").textContent = ghTotal.toLocaleString("en-IN");
    const solved = data.leetcode?.solved;
    if (solved) {
      $("lc-solved").textContent = solved.all;
      $("lc-easy").textContent = solved.easy;
      $("lc-medium").textContent = solved.medium;
      $("lc-hard").textContent = solved.hard;
    }
    const updated = new Date(data.generatedAt);
    if (!Number.isNaN(updated.getTime())) {
      $("activity-updated").textContent =
        "Updated " +
        updated.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      if (days.length) paint();
    });
  });

  function fail() {
    status.replaceChildren(
      "Activity data couldn't be loaded right now. See my ",
      link("https://github.com/Tusharcode007", "GitHub profile"),
      " for recent activity."
    );
  }

  function link(href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = text;
    return a;
  }

  fetch(card.dataset.src, { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (!data.github && !data.leetcode) throw new Error("empty data");
      days = buildDays(data);
      draw();
      paint();
      fillTable();
      fillSources(data);
    })
    .catch(fail);
})();
