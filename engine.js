/* ============================================================================
   PROVE THEM WRONG — ENGINE
   State, scoring, board logic, rendering. All copy lives in content.js.
   Deterministic: no randomness anywhere, so any run can be replayed exactly.
   ============================================================================ */
"use strict";

/* ---------------------------------------------------------------- model */
const PRICE_BASE   = FIRM.start.price;
const BOARD_FLOOR  = 25;    // below this at a review, the board removes you
const BOARD_WARN   = 40;
const BOARD_DRIFT  = 1.0;   // the board's patience is not free
const UNMAN_DRIFT  = 0.25;  // your best people are being called every week
const UNMAN_SAFE   = 16;    // above this, unintended attrition starts to bite
const UNMAN_BOARD  = 0.3;   // board confidence lost per point of excess, per round
const EXODUS_AT    = 21;

const S = {};

function reset() {
  const b = FIRM.start;
  Object.assign(S, {
    i: 0, picks: [], perRound: [], queue: [],
    signal: 0, substance: 0, pain: 0,
    platformPct: 6, awaiting: false, firedAt: null, lastGate: null,
    price: b.price, board: b.board,
    growth: b.growth, margin: b.margin,
    managed: b.managed, unmanaged: b.unmanaged,
    clients: b.clients, arpc: b.arpc,
    mix: Object.assign({}, b.mix),
    hist: {
      price: [b.price], board: [b.board], growth: [b.growth], margin: [b.margin],
      managed: [b.managed], unmanaged: [b.unmanaged], clients: [b.clients], arpc: [b.arpc]
    }
  });
}

const $ = sel => document.querySelector(sel);
const app = () => $("#app");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/* Always call after writing innerHTML, never before — see screenBrief. */
const toTop = () => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; window.scrollTo(0, 0); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const pad2 = n => String(n).padStart(2, "0");

/* The share price is the Q1 formula, revealed a round at a time. */
function priceAt(rounds, signal) { return PRICE_BASE * (1 + 0.019 * (signal - rounds)); }
function q1Mult() { return priceAt(DECISIONS.length, S.signal) / PRICE_BASE; }

function coherenceCheck() {
  const p = S.picks;
  const hits   = COHERENCES.filter(r => r.test(p, S));
  const misses = CONTRADICTIONS.filter(r => r.test(p, S));
  return { hits, misses, factor: clamp(1 + 0.10 * hits.length - 0.16 * misses.length, 0.5, 1.5) };
}

/* Sum of the best substance available at each decision. Keep in step with content.js
   or the two-year curve silently rescales. */
const MAX_SUBSTANCE = 42;
/* The ceiling has to sit above what the best path can actually reach. At 3.0 the
   optimum hit 3.09 and clamped, which made substance beyond that point free — so
   the spare decisions went to the options this game calls theatre. Headroom keeps
   real change paying all the way up. The ×2.0 win threshold is unchanged. */
const Y2_CEILING = 3.6;

function finalScores() {
  const c = coherenceCheck();
  const q1 = q1Mult();
  const attritionPenalty = Math.max(0, S.unmanaged - UNMAN_SAFE) * 0.045;
  const y2 = clamp((0.55 + clamp(S.substance, 0, MAX_SUBSTANCE) / MAX_SUBSTANCE * 1.95) * c.factor - attritionPenalty, 0.3, Y2_CEILING);

  let key;
  if (S.firedAt !== null)                          key = ["fired1", "fired2", "fired3"][S.firedAt];
  else if (S.unmanaged >= EXODUS_AT)               key = "exodus";
  else if (c.misses.length >= 3)                   key = "contradiction";
  else if (y2 >= 2.0 && q1 >= 1.20)                key = "rerating";
  else if (y2 >= 1.70 && q1 < 1.14)                key = "quiet";
  else if (q1 >= 1.16 && y2 < 1.30)                key = "announcement";
  else if (S.substance < 15 && S.signal < 19)      key = "custodian";
  else                                             key = "pilot";

  return { c, q1, y2, key, ending: ENDINGS[key], attritionPenalty };
}

/* ------------------------------------------------------- applying a choice */
/* Pure state mutation, no DOM. The test harness calls this directly. */
function applyChoice(k) {
  const d = DECISIONS[S.i], o = d.options[k];
  let signal = o.signal, substance = o.substance, pain = o.pain, board = o.board;

  /* Prerequisites. Some moves only work if an earlier decision cleared the way —
     you cannot direct people you are not equipped to evaluate, so exceptional
     engineers hired into an unchanged leadership team leave again. Read before
     S.picks.push, since the requirement always points at an earlier decision. */
  S.lastGate = null;
  if (o.requires) {
    const prior   = S.picks[o.requires.decision];
    const met     = o.requires.met.includes(prior);
    const partial = (o.requires.partial || []).includes(prior);
    if (!met) {
      const f = partial ? 0.5 : 1, p = o.requires.penalty;
      substance += (p.substance || 0) * f;
      board     += (p.board || 0) * f;
      S.lastGate = { level: partial ? "partial" : "full",
                     unmanaged: (p.unmanaged || 0) * f,
                     wire: (partial && o.requires.wirePartial) || o.requires.wire };
    }
  }

  if (d.type === "budget") {
    // The size of the budget only counts for as much as the funding source protects.
    const t = (S.platformPct - 6) / 24;
    signal    += t * 2.5;
    substance  = t * 3 * o.gate + o.substance;
    pain      += S.platformPct >= 20 ? 1 : 0;
    board     -= S.platformPct >= 20 ? 2 : 0;
  }

  S.picks.push(k);
  S.signal += signal; S.substance += substance; S.pain += pain;

  const prevPrice = S.price;
  S.price = priceAt(S.picks.length, S.signal);

  S.managed   = Math.max(0, S.managed + (o.managed || 0));
  S.unmanaged = Math.max(0, S.unmanaged + (o.unmanaged || 0) + UNMAN_DRIFT
                            + (S.lastGate ? S.lastGate.unmanaged : 0));
  S.growth    = S.growth + (o.growth || 0) - 0.18;
  S.margin    = S.margin + (o.margin || 0) - 0.05;
  S.clients   = Math.max(0, S.clients + (o.clients || 0));
  S.arpc      = Math.max(4, S.arpc + (o.arpc || 0));

  // Revenue mix reshapes with real change: legacy and infrastructure give way to platform IP.
  const shift = Math.max(0, substance) * 0.5;
  S.mix.platform  += shift;
  S.mix.legacy    -= shift * 0.7;
  S.mix.infra     -= shift * 0.3;
  normaliseMix();

  // Board confidence
  board += (S.price > prevPrice ? 2 : -2);
  board -= BOARD_DRIFT;
  board -= Math.max(0, S.unmanaged - UNMAN_SAFE) * UNMAN_BOARD;
  if (S.growth < 0) board -= 1;
  S.board = clamp(S.board + board, 0, 100);

  S.perRound.push({ code: d.code, title: d.title, label: o.label, signal, substance, pain });
  ["price","board","growth","margin","managed","unmanaged","clients","arpc"].forEach(m => S.hist[m].push(S[m]));
  return o;
}

function normaliseMix() {
  const m = S.mix;
  ["legacy","infra","consulting","platform"].forEach(k => { m[k] = Math.max(0, m[k]); });
  const t = m.legacy + m.infra + m.consulting + m.platform;
  ["legacy","infra","consulting","platform"].forEach(k => { m[k] = m[k] / t * 100; });
}

function reviewBand() {
  if (S.board < BOARD_FLOOR) return "fired";
  if (S.board < BOARD_WARN)  return "warn";
  if (S.board >= 58)         return "good";
  return "ok";
}

/* ============================================================================
   DASHBOARD
   ============================================================================ */
function sparkSVG(series, w, h, colour) {
  if (series.length < 2) return "";
  const lo = Math.min(...series), hi = Math.max(...series), span = (hi - lo) || 1;
  const x = i => i * w / (series.length - 1);
  const y = v => h - 1 - (v - lo) / span * (h - 2);
  const d = series.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  return `<svg class="ledger-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${colour}" stroke-width="1.15"/></svg>`;
}

function deltaHTML(now, prev, digits, invert) {
  const d = now - prev;
  if (Math.abs(d) < (digits ? 0.05 : 0.5)) return `<span class="ledger-delta flat">—</span>`;
  const good = invert ? d < 0 : d > 0;
  const sign = d > 0 ? "+" : "−";
  return `<span class="ledger-delta ${good ? "up" : "down"}">${sign}${Math.abs(d).toFixed(digits)}</span>`;
}

function renderPanel() {
  const h = S.hist, n = h.price.length - 1, prev = Math.max(0, n - 1);
  const stage = S.firedAt !== null ? "REMOVED FROM POST"
    : S.i >= DECISIONS.length ? "TEN OF TEN TAKEN"
    : "DECISION " + pad2(S.i + 1) + " OF " + pad2(DECISIONS.length);

  const priceDelta = h.price[n] - h.price[prev];
  const boardDelta = h.board[n] - h.board[prev];
  const gaugeClass = S.board < BOARD_FLOOR ? "danger" : S.board < BOARD_WARN ? "warn" : "";

  // Only unintended attrition is tracked. People removed deliberately are the price
  // of a decision already made, so putting them on the dashboard only adds noise.
  const cells = [
    { label: "Revenue growth", val: S.growth.toFixed(1) + "%", series: h.growth, d: deltaHTML(h.growth[n], h.growth[prev], 1), cls: "" },
    { label: "Operating margin", val: S.margin.toFixed(1) + "%", series: h.margin, d: deltaHTML(h.margin[n], h.margin[prev], 1), cls: "" },
    { label: "Attrition · key people", val: S.unmanaged.toFixed(1) + "%", series: h.unmanaged, d: deltaHTML(h.unmanaged[n], h.unmanaged[prev], 1, true), cls: "unintended" },
    { label: "New clients · rev per client", val: Math.round(S.clients) + " · $" + Math.round(S.arpc) + "m", series: h.clients, d: deltaHTML(h.clients[n], h.clients[prev], 0), cls: "" }
  ];

  $("#panel").innerHTML = `
  <div class="panel-inner">
    <div class="panel-top">
      <div class="panel-id">
        <div class="panel-firm">${FIRM.name}</div>
        <div class="panel-stage">${stage}</div>
      </div>
      <div class="headline">
        <span class="headline-label">Share price, indexed</span>
        <div class="headline-row">
          <span class="headline-fig num">${S.price.toFixed(1)}</span>
          ${deltaHTML(h.price[n], h.price[prev], 1)}
        </div>
        ${sparkSVG(h.price, 150, 22, "#620d3c")}
      </div>
      <div class="headline">
        <span class="headline-label">Board confidence</span>
        <div class="headline-row">
          <span class="headline-fig num">${Math.round(S.board)}</span>
          ${deltaHTML(h.board[n], h.board[prev], 0)}
        </div>
        <div class="gauge">
          <span class="gauge-fill ${gaugeClass}" style="width:${clamp(S.board,0,100)}%"></span>
          <span class="gauge-mark" style="left:${BOARD_FLOOR}%" title="removal threshold"></span>
        </div>
      </div>
    </div>
    <div class="ledger">
      ${cells.map(c => `
        <div class="ledger-cell ${c.cls}">
          <span class="ledger-label">${c.label}</span>
          <div class="ledger-row"><span class="ledger-fig num">${c.val}</span>${c.d}</div>
          ${sparkSVG(c.series, 110, 16, c.cls === "unintended" ? "#620d3c" : "rgba(23,20,19,0.5)")}
        </div>`).join("")}
    </div>
  </div>`;
}

/* `dark` swaps in a palette that survives the wine and ink grounds — the standard
   wine segment is invisible on a wine band. */
function mixBarHTML(dark) {
  const m = S.mix;
  const c = dark ? ["#efd9e3", "#b8809f", "#6b9a9a", "#f1a222"]
                 : ["#620d3c", "#b8809f", "#2f6b6b", "#f1a222"];
  const parts = [
    ["Legacy application development & maintenance", m.legacy, c[0]],
    ["Infrastructure & BPO", m.infra, c[1]],
    ["Consulting & transformation", m.consulting, c[2]],
    ["Platform & reusable IP", m.platform, c[3]]
  ];
  return `<div class="mixbar">${parts.map(([, v, c]) =>
      `<span style="width:${v.toFixed(1)}%;background:${c}"></span>`).join("")}</div>
    <div class="mix-legend">${parts.map(([n, v, c]) =>
      `<span class="mix-key"><span class="mix-swatch" style="background:${c}"></span>${esc(n)} ${v.toFixed(0)}%</span>`).join("")}</div>`;
}

/* ============================================================================
   SCREENS
   ============================================================================ */
function screenBrief() {
  $("#panel").hidden = true;
  const h = FIRM.history, W = 620, H = 160, lo = 22, hi = 106;
  const x = i => 6 + i * (W - 12) / (h.length - 1);
  const y = v => H - 26 - (v - lo) / (hi - lo) * (H - 52);
  const path = h.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");

  app().innerHTML = `
  <section class="section fade-in">
    <div class="container">
      <span class="eyebrow">The Takshashila Institution · an interactive decision game</span>
      <h1 class="display">Prove them<br><em class="house">wrong</em>.</h1>
      <div class="split" style="margin-top:40px">
        <div class="stack-24">
          <p class="lede">You are the chief executive of ${FIRM.name} — ${FIRM.people} people, ${FIRM.revenue} of revenue, three hundred and forty clients, every one of them a global enterprise.</p>
          <p style="font-size:16px;line-height:1.6">Revenue grew again last year. So did profit. The share price has still lost two thirds of its value, because the market has stopped pricing your earnings and started pricing whether your business model survives the decade. Your largest clients can now hire the same models you can, on the same morning, at the same price.</p>
          <p style="font-size:16px;line-height:1.6">The board has given you eighteen months, ten decisions and a mandate it has put in writing. It meets three times along the way, and it does not have to wait until the end.</p>
          <div class="aside">
            <p style="font-size:17px;line-height:1.5">You will not be told how the board is weighing any of this. You will only see how much confidence it has left in you.</p>
          </div>
          <div style="border-top:var(--rule);padding-top:16px;margin-top:4px">
            <span class="meta">Read on &darr; &nbsp;·&nbsp; where the money comes from, and what has changed</span>
          </div>
        </div>
        <div class="stack-24">
          <div class="figure">
            <span class="eyebrow">Figure 1</span>
            <h4>Share price, indexed to 100</h4>
            <div class="meta plain">Ten quarters. Revenue and profit rose throughout.</div>
            <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="margin-top:12px" role="img" aria-label="Share price falling from 100 to 33 across ten quarters">
              ${[100, 75, 50, 25].map(v => `<line x1="6" y1="${y(v)}" x2="${W-6}" y2="${y(v)}" stroke="rgba(23,20,19,0.08)"/>`).join("")}
              <path d="${path}" fill="none" stroke="#620d3c" stroke-width="1.5"
                    stroke-dasharray="900" stroke-dashoffset="900">
                <animate attributeName="stroke-dashoffset" from="900" to="0" dur="1.5s" fill="freeze"/>
              </path>
              <rect x="${(x(h.length-1)-3).toFixed(1)}" y="${(y(h[h.length-1])-3).toFixed(1)}" width="6" height="6" fill="#f1a222" opacity="0">
                <animate attributeName="opacity" from="0" to="1" begin="1.4s" dur="0.3s" fill="freeze"/></rect>
              <text x="6" y="${(y(100)-8).toFixed(1)}" font-family="Roboto Mono, monospace" font-size="10" fill="rgba(23,20,19,0.5)">100</text>
              <text x="${(x(h.length-1)-6).toFixed(1)}" y="${(y(h[h.length-1])+20).toFixed(1)}" text-anchor="end" font-family="Roboto Mono, monospace" font-size="11" fill="#620d3c">33</text>
            </svg>
            <div class="source">Indexed to 100 at the start of the period. Illustrative.</div>
          </div>
          <div>
            <span class="eyebrow">Board mandate</span>
            <table class="deftable" style="margin-top:10px">
              <tr><td>Near term</td><td class="num">+20 to 30%</td></tr>
              <tr><td>Two years</td><td class="num">× 2.0</td></tr>
              <tr><td>Decisions</td><td class="num">10</td></tr>
              <tr><td>Board reviews</td><td class="num">3</td></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section deep">
    <div class="container">
      <span class="eyebrow">Where the $22bn comes from</span>
      <h2 style="font-size:32px;line-height:1.15;letter-spacing:-0.015em;margin:12px 0 22px;max-width:24ch">Four fifths of your revenue is priced by the hour.</h2>
      ${mixBarHTML()}
      <div class="source">Legacy application development and maintenance carries the volume. Consulting and transformation carries the margin. Platform and reusable IP carries almost nothing yet.</div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <span class="eyebrow">The conditions you inherit</span>
      <h2 style="font-size:32px;line-height:1.15;letter-spacing:-0.015em;margin:12px 0 24px;max-width:26ch">The technology moved. The question is whether the firm can.</h2>
      <div class="factgrid">
        ${FACTS.map(f => `<div>
          <div class="fact-fig num">${esc(f.fig)}</div>
          <p class="fact-txt">${esc(f.txt)}</p>
        </div>`).join("")}
      </div>
      <div class="source">${esc(FACTS_NOTE)}</div>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:34px">
        <button class="btn" id="start">Take the chair &rarr;</button>
        <span class="meta">Seven minutes · keys 1–4 also work</span>
      </div>
    </div>
  </section>`;

  // Must come after the DOM is written: scrolling first lets the browser's scroll
  // anchoring restore the old offset, which is how Play Again used to drop the
  // player partway down the briefing instead of at the top of it.
  toTop();

  // The only way in is the button at the foot of the briefing, so the conditions
  // get read rather than skipped. Nothing is focused here and Enter does not start
  // the game — both would let a player bypass the page.
  $("#start").onclick = () => { $("#panel").hidden = false; renderPanel(); screenDecision(); };
}

function teamHTML() {
  const maxYears = Math.max(...TEAM.map(t => t.years));
  return `<div class="team">
    <div class="team-row head"><span>Name</span><span>Remit</span><span>Years here</span><span>Fit for what is coming</span></div>
    ${TEAM.map(t => `<div class="team-row">
      <span class="team-name">${esc(t.name)}</span>
      <span class="team-remit">${esc(t.remit)}</span>
      <span class="tenure"><span class="tenure-bar" style="width:${(t.years / maxYears * 78).toFixed(0)}px"></span><span class="tenure-yrs num">${t.years}</span></span>
      <span class="fitdots">${[1,2,3].map(i => `<span class="fitdot ${i <= t.fit ? "on" : ""}"></span>`).join("")}</span>
    </div>`).join("")}
  </div>
  <div class="source">${esc(TEAM_FOOT)}</div>`;
}

function budgetHTML() {
  return `<div class="budget">
    <div class="budget-top">
      <div><span class="eyebrow">Platform and reusable-asset spend</span>
        <div class="budget-fig num" id="budget-pct" style="margin-top:8px">${S.platformPct}%</div></div>
      <div class="meta" id="budget-abs">≈ $${(22 * S.platformPct / 100).toFixed(1)}bn of revenue</div>
    </div>
    <input type="range" id="slider" min="6" max="30" step="1" value="${S.platformPct}" aria-label="Platform spend as a percentage of revenue">
    <div class="budget-scale"><span class="meta">6% · today</span><span class="meta">18%</span><span class="meta">30%</span></div>
  </div>`;
}

function screenDecision() {
  const d = DECISIONS[S.i];
  renderPanel();
  app().innerHTML = `
  <section class="stage fade-in">
    <div class="container">
      <div class="stage-head">
        <span class="dcode">${d.code} · ${esc(d.eyebrow)}</span>
        <span class="meta">${pad2(S.i + 1)} of ${pad2(DECISIONS.length)}</span>
      </div>
      <h2 class="dtitle">${esc(d.title)}</h2>
      <p class="dcontext">${d.context}</p>
      ${d.type === "team" ? teamHTML() : ""}
      <p class="dquestion">${esc(d.question)}</p>
      ${d.type === "budget" ? budgetHTML() : ""}
      <div class="cards" id="cards">
        ${d.options.map((o, k) => `
          <button class="card" data-k="${k}">
            <span class="card-key">${k + 1}</span>
            <span class="card-title">${esc(o.label)}</span>
            <span class="card-body">${o.body}</span>
          </button>`).join("")}
      </div>
      <div id="after"></div>
    </div>
  </section>`;

  if (d.type === "budget") {
    const r = $("#slider");
    r.oninput = () => {
      S.platformPct = +r.value;
      $("#budget-pct").textContent = S.platformPct + "%";
      $("#budget-abs").textContent = "≈ $" + (22 * S.platformPct / 100).toFixed(1) + "bn of revenue";
    };
  }
  document.querySelectorAll(".card").forEach(b => { b.onclick = () => choose(+b.dataset.k); });
  S.awaiting = false;
  toTop();
}

function choose(k) {
  if (S.awaiting) return;
  const d = DECISIONS[S.i];
  const before = { board: S.board, unmanaged: S.unmanaged, managed: S.managed, price: S.price };
  const o = applyChoice(k);
  S.awaiting = true;

  document.querySelectorAll(".card").forEach(b => {
    b.classList.add("locked", +b.dataset.k === k ? "chosen" : "dimmed");
    b.disabled = true;
  });
  const sl = $("#slider"); if (sl) sl.disabled = true;
  renderPanel();

  const fx = [];
  const push = (label, v, digits, invert) => {
    if (Math.abs(v) < 0.05) return;
    const good = invert ? v < 0 : v > 0;
    fx.push(`<span class="effect">${label} ${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}${good ? "" : ""}</span>`);
  };
  push("Board confidence", S.board - before.board, 0);
  push("Share price", S.price - before.price, 1);
  push("Attrition · key people", S.unmanaged - before.unmanaged, 1, true);

  const last = S.i === DECISIONS.length - 1;
  const gate = S.lastGate;
  $("#after").innerHTML = `
    <div class="wire fade-in">
      <span class="wire-src">Internal note · ${d.code}${gate ? " · the ground was not prepared" : ""}</span>
      <p class="wire-text">${gate ? gate.wire : o.wire}</p>
      <div class="effects">${fx.join("")}</div>
      <div class="wire-foot">
        <button class="btn" id="cont">${last ? "Close the eighteen months →" : "Continue →"}</button>
        <span class="meta">Press enter</span>
      </div>
    </div>`;
  $("#cont").focus({ preventScroll: true });
  $("#cont").onclick = afterChoice;
  const box = $("#after").getBoundingClientRect();
  if (box.bottom > window.innerHeight) $("#after").scrollIntoView({ block: "start" });
}

function afterChoice() {
  S.awaiting = false;
  const n = S.i + 1;                        // 1-indexed decision just completed
  S.queue = [];
  if (WIRES[n]) S.queue.push({ type: "wire", data: WIRES[n] });
  const ri = REVIEW_AFTER.indexOf(n);
  if (ri >= 0) S.queue.push({ type: "review", idx: ri });
  S.i++;
  nextScreen();
}

function nextScreen() {
  if (S.queue.length) {
    const item = S.queue.shift();
    return item.type === "wire" ? screenWire(item.data) : screenReview(item.idx);
  }
  if (S.firedAt !== null || S.i >= DECISIONS.length) return screenReveal();
  screenDecision();
}

function screenWire(w) {
  app().innerHTML = `
  <section class="section dark wirecard fade-in">
    <div class="container split">
      <div>
        <span class="eyebrow">The market · while you were deciding</span>
        <div class="wire-fig num">${esc(w.fig)}</div>
        <h2 class="wire-head">${esc(w.head)}</h2>
      </div>
      <div>
        <p class="wire-body">${esc(w.body)}</p>
        <div class="source">Source: ${esc(w.src)}</div>
        <div style="margin-top:30px"><button class="btn accent" id="cont">Continue →</button></div>
      </div>
    </div>
  </section>`;
  toTop();
  $("#cont").focus({ preventScroll: true });
  $("#cont").onclick = nextScreen;
}

function screenReview(idx) {
  const r = REVIEWS[idx], band = reviewBand();
  if (band === "fired") S.firedAt = idx;

  const stamp = band === "fired" ? `<span class="verdict-stamp lose">You have been removed</span>` :
                band === "warn"  ? `<span class="tag gold">Confidence is low</span>` :
                band === "good"  ? `<span class="tag gold">The board is behind you</span>` :
                                   `<span class="tag" style="background:#fff;border-color:#fff">Noted</span>`;

  app().innerHTML = `
  <section class="section ${band === "fired" ? "dark" : "wine"} ${band === "fired" ? "dark" : "on-wine"} fade-in">
    <div class="container">
      <span class="eyebrow">${r.code} · ${esc(r.title)} · after decision ${REVIEW_AFTER[idx]}</span>
      <div style="margin-top:16px">${stamp}</div>
      <h2 class="board-verdict">Board confidence <em class="house">${Math.round(S.board)}</em> of 100.</h2>
      <div class="split" style="margin-top:34px">
        <div>
          <p class="quote">${esc(r[band])}</p>
          <div style="margin-top:32px">
            <button class="btn accent" id="cont">${band === "fired" ? "See how it ended →" : "Continue →"}</button>
          </div>
        </div>
        <div>
          <span class="eyebrow">Where the firm stands</span>
          <table class="deftable" style="margin-top:10px">
            <tr><td>Share price, indexed</td><td class="num">${S.price.toFixed(1)}</td></tr>
            <tr><td>Revenue growth</td><td class="num">${S.growth.toFixed(1)}%</td></tr>
            <tr><td>Operating margin</td><td class="num">${S.margin.toFixed(1)}%</td></tr>
            <tr><td>Attrition · key people</td><td class="num">${S.unmanaged.toFixed(1)}%</td></tr>
            <tr><td>New clients · rev per client</td><td class="num">${Math.round(S.clients)} · $${Math.round(S.arpc)}m</td></tr>
          </table>
          <div style="margin-top:26px">
            <span class="eyebrow">Revenue mix</span>
            <div style="margin-top:12px">${mixBarHTML(true)}</div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
  toTop();
  $("#cont").focus({ preventScroll: true });
  $("#cont").onclick = nextScreen;
}

/* ============================================================================
   REVEAL
   ============================================================================ */
function screenReveal() {
  $("#panel").hidden = true;
  const R = finalScores();
  const fired = S.firedAt !== null;
  const q1pc = (R.q1 - 1) * 100, y2x = R.y2;
  const q1hit = !fired && q1pc >= 20, y2hit = !fired && y2x >= 2.0;
  const fmtPc = v => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";

  // State the result, don't infer it — both mandates are named and marked.
  const stampText = fired            ? "You did not finish"
                  : (q1hit && y2hit) ? "Both mandates met"
                  : (q1hit || y2hit) ? "One mandate of two"
                  :                    "Both mandates missed";
  const stampCls  = fired            ? "out"
                  : (q1hit && y2hit) ? "win"
                  : (q1hit || y2hit) ? "part" : "lose";

  app().innerHTML = `
  <section class="section dark fade-in">
    <div class="container">
      <span class="eyebrow">Eighteen months later</span>
      <div style="margin-top:16px"><span class="verdict-stamp ${stampCls}">${stampText}</span></div>
      <h2 style="font-size:44px;line-height:1.05;letter-spacing:-0.02em;margin-top:22px;max-width:22ch">${esc(R.ending.head)}</h2>
      ${fired ? `
        <div class="kpi-strip">
          <div class="kpi"><div class="kpi-fig num">${REVIEW_AFTER[S.firedAt]}</div>
            <span class="kpi-label">Decisions taken, of ten</span>
            <span class="kpi-verdict v-miss">Removed at review ${S.firedAt + 1}</span></div>
          <div class="kpi"><div class="kpi-fig num">${Math.round(S.board)}</div>
            <span class="kpi-label">Board confidence · removal below ${BOARD_FLOOR}</span>
            <span class="kpi-verdict v-miss">Below the floor</span></div>
          <div class="kpi"><div class="kpi-fig num">${S.unmanaged.toFixed(1)}%</div>
            <span class="kpi-label">Attrition among key people</span>
            <span class="kpi-verdict" style="color:var(--on-dark-meta)">Started at 12%</span></div>
        </div>` : `
        <div class="kpi-strip">
          <div class="kpi"><div class="kpi-fig num">${fmtPc(q1pc)}</div>
            <span class="kpi-label">First quarter · target +20 to 30%</span>
            <span class="kpi-verdict ${q1hit ? "v-hit" : "v-miss"}">${q1hit ? "Mandate met" : "Mandate missed"}</span></div>
          <div class="kpi"><div class="kpi-fig num">× ${y2x.toFixed(2)}</div>
            <span class="kpi-label">Two years · target × 2.0</span>
            <span class="kpi-verdict ${y2hit ? "v-hit" : "v-miss"}">${y2hit ? "Mandate met" : "Mandate missed"}</span></div>
          <div class="kpi"><div class="kpi-fig num">${S.unmanaged.toFixed(1)}%</div>
            <span class="kpi-label">Attrition among key people · started at 12%</span>
            <span class="kpi-verdict ${S.unmanaged > 16 ? "v-miss" : "v-hit"}">${S.unmanaged > 16 ? "Above the level that hurts" : "Held"}</span></div>
        </div>`}
    </div>
  </section>

  <section class="section deep">
    <div class="container split">
      <div>
        <span class="eyebrow">The verdict</span>
        <div style="margin-top:14px"><span class="tag wine">${esc(R.ending.tag)}</span></div>
        <p style="font-size:16px;line-height:1.65;color:var(--ink-70);margin-top:20px">${esc(R.ending.body)}</p>
        <div class="aside" style="margin-top:26px"><p style="font-size:18px;line-height:1.45">${esc(R.ending.lesson)}</p></div>
      </div>
      <div>
        <span class="eyebrow">Revenue mix, eighteen months on</span>
        <div style="margin-top:14px">${mixBarHTML()}</div>
        <div class="source">Started at legacy 56%, infrastructure and BPO 26%, consulting 12%, platform 6%.</div>
        <div style="margin-top:26px">
          <span class="eyebrow">The people you needed</span>
          <table class="deftable" style="margin-top:10px">
            <tr><td>Attrition among key people</td><td class="num">${S.unmanaged.toFixed(1)}%</td></tr>
            <tr><td>Where it stops costing you</td><td class="num">${UNMAN_SAFE}%</td></tr>
            <tr><td>Drag on the two-year figure</td><td class="num">−${R.attritionPenalty.toFixed(2)}</td></tr>
          </table>
        </div>
      </div>
    </div>
  </section>

  ${S.perRound.length >= 3 ? `
  <section class="section">
    <div class="container">
      <span class="eyebrow">Figure 2</span>
      <h3 style="font-size:22px;font-weight:500;margin:8px 0 2px">Your decisions</h3>
      <div class="meta plain">What the market heard, against what the firm changed</div>
      <div class="chart-wrap">${scatterSVG()}</div>
      <div class="source">Source: your own choices. Axes are the weights carried by each option in this game.</div>
      ${linkageBlock(R.c)}
    </div>
  </section>` : ""}

  <section class="section deep">
    <div class="container split">
      <div>
        <span class="eyebrow">What you passed over</span>
        <div class="rowlist">${missedBlock()}</div>
        <p class="meta plain" style="margin-top:14px">The three unchosen options that would have changed the firm most.</p>
      </div>
      <div>
        <span class="eyebrow">Play it differently</span>
        <p style="font-size:16px;line-height:1.6;color:var(--ink-70);margin-top:14px">There is a path that meets both mandates. It needs enough visible change to keep the board in the chair with you, and enough real change underneath that the second year has something to report.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
          <button class="btn" id="again">Play again</button>
        </div>
      </div>
    </div>
  </section>

  <section class="section wine on-wine">
    <div class="container split">
      <div class="stack-24">
        <span class="eyebrow">The argument underneath the game</span>
        <p class="lede" style="color:rgba(255,255,255,0.85)">These firms are still growing in revenue and in profit, and the market has marked them down anyway. What is being priced is not this year's earnings but whether an organisation built for billable hours can become one built for reusable assets — and whether the people who built the first one are the ones to build the second.</p>
        <p style="font-size:16px;line-height:1.6">A firm is an institution. Its incentives, its hiring, its leadership, its org chart and its pricing are the rules it actually runs on, and none of them change because a chief executive says the word AI on an analyst call. The hardest of those to change is the one made of people who have been there twenty years and who built everything that worked last time.</p>
      </div>
      <div>
        <span class="eyebrow">About this game</span>
        <table class="deftable" style="margin-top:10px">
          ${ABOUT.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}
        </table>
      </div>
    </div>
  </section>`;

  toTop();
  $("#again").onclick = () => { reset(); screenBrief(); };
}

function scatterSVG() {
  const W = 900, H = 430, L = 54, Rp = 34, T = 26, B = 54;
  const xs = -1.5, xe = 4.5, ys = -1.5, ye = 5.5;
  const px = v => L + (v - xs) / (xe - xs) * (W - L - Rp);
  const py = v => H - B - (v - ys) / (ye - ys) * (H - T - B);
  const grid = [-1,0,1,2,3,4,5].map(v =>
    `<line x1="${L}" y1="${py(v)}" x2="${W-Rp}" y2="${py(v)}" stroke="rgba(23,20,19,0.08)"/>` +
    `<text x="${L-10}" y="${py(v)+3.5}" text-anchor="end" font-family="Roboto Mono, monospace" font-size="10" fill="rgba(23,20,19,0.5)">${v}</text>`).join("");
  const xlab = [-1,0,1,2,3,4].map(v =>
    `<text x="${px(v)}" y="${H-B+18}" text-anchor="middle" font-family="Roboto Mono, monospace" font-size="10" fill="rgba(23,20,19,0.5)">${v}</text>`).join("");
  const quad =
    `<line x1="${px(1.75)}" y1="${T}" x2="${px(1.75)}" y2="${H-B}" stroke="rgba(23,20,19,0.16)" stroke-dasharray="3 3"/>` +
    `<line x1="${L}" y1="${py(1.75)}" x2="${W-Rp}" y2="${py(1.75)}" stroke="rgba(23,20,19,0.16)" stroke-dasharray="3 3"/>` +
    [["Invisible work", px(1.6), py(5.35), "end"], ["Re-rating", px(1.95), py(5.35), "start"],
     ["Drift", px(1.6), py(-1.25), "end"], ["Theatre", px(1.95), py(-1.25), "start"]]
      .map(([t,x,y,a]) => `<text x="${x}" y="${y}" text-anchor="${a}" font-family="Roboto Mono, monospace" font-size="10" letter-spacing="1.4" fill="rgba(23,20,19,0.5)">${t.toUpperCase()}</text>`).join("");

  const seen = {};
  const dots = S.perRound.map(r => {
    const key = r.signal.toFixed(1) + "|" + r.substance.toFixed(1);
    const n = seen[key] = (seen[key] || 0) + 1;
    const x = px(clamp(r.signal, xs, xe)), y = py(clamp(r.substance, ys, ye)), off = (n - 1) * 12;
    return `<rect x="${(x-3.5).toFixed(1)}" y="${(y-3.5).toFixed(1)}" width="7" height="7" fill="#620d3c"/>` +
           `<text x="${(x+9).toFixed(1)}" y="${(y+3.5+off).toFixed(1)}" font-family="Roboto Mono, monospace" font-size="10.5" letter-spacing="0.8" fill="#620d3c">${r.code}</text>`;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Scatter of your decisions by signal and substance">
    ${grid}${xlab}${quad}${dots}
    <text x="${L}" y="${H-8}" font-family="Roboto Mono, monospace" font-size="10" letter-spacing="1.4" fill="rgba(23,20,19,0.5)">SIGNAL — WHAT THE MARKET HEARD →</text>
    <text transform="translate(16 ${H-B}) rotate(-90)" font-family="Roboto Mono, monospace" font-size="10" letter-spacing="1.4" fill="rgba(23,20,19,0.5)">SUBSTANCE — WHAT CHANGED →</text>
  </svg>`;
}

function linkageBlock(c) {
  const row = (r, x) => `<div class="link-item"><span class="link-code">${r.codes.join(" · ")}</span>
    <span class="link-txt">${x ? '<span class="x-mark">✕ </span>' : ""}${esc(r.text)}</span></div>`;
  if (!c.hits.length && !c.misses.length) {
    return `<div class="ruled-grid" style="margin-top:28px">
      <div><span class="eyebrow">Linkages</span><p class="link-txt" style="margin-top:10px">None of your decisions reinforced or cancelled another. Each stood on its own, which is usually how a firm ends up with ten initiatives and one outcome.</p></div>
      <div><span class="eyebrow">Effect on the two-year figure</span><p class="num" style="font-size:44px;margin-top:8px">× 1.00</p></div></div>`;
  }
  return `<div class="ruled-grid" style="margin-top:28px">
    <div><span class="eyebrow">Decisions that reinforced each other</span>
      ${c.hits.length ? c.hits.map(r => row(r, false)).join("") : '<p class="link-txt" style="margin-top:10px">None.</p>'}</div>
    <div><span class="eyebrow">Decisions that cancelled each other</span>
      ${c.misses.length ? c.misses.map(r => row(r, true)).join("") : '<p class="link-txt" style="margin-top:10px">None.</p>'}</div>
    <div><span class="eyebrow">Coherence multiplier on the two-year figure</span>
      <p class="num" style="font-size:44px;margin-top:8px">× ${c.factor.toFixed(2)}</p></div>
    <div><span class="eyebrow">Why it is applied</span>
      <p class="link-txt" style="margin-top:10px">A strategy is not the sum of its decisions. Where two of them instruct the firm to do opposite things, the firm does neither and carries on as before.</p></div>
  </div>`;
}

function missedBlock() {
  const missed = [];
  DECISIONS.forEach((d, i) => {
    if (S.picks[i] === undefined) return;   // never reached, if you were removed early
    d.options.forEach((o, k) => {
      if (k === S.picks[i]) return;
      missed.push({ code: d.code, title: d.title, label: o.label,
                    sub: d.type === "budget" ? (o.gate * 3 + o.substance) : o.substance });
    });
  });
  missed.sort((a, b) => b.sub - a.sub);
  return missed.slice(0, 3).map(m => `<div class="rowlist-item">
      <span class="t">${esc(m.label)}</span>
      <span class="d">${m.code} · ${esc(m.title)}</span></div>`).join("");
}

/* ============================================================================
   INPUT + HARNESS
   ============================================================================ */
document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "Enter") {
    const b = $("#cont");           // deliberately not #start — the briefing is not skippable
    if (b) { e.preventDefault(); b.click(); }
    return;
  }
  if (/^[1-4]$/.test(e.key) && !S.awaiting) {
    const b = document.querySelector('.card[data-k="' + (+e.key - 1) + '"]');
    if (b && !b.disabled) { e.preventDefault(); b.click(); }
  }
});

/* Deterministic harness. __run([...10 option indices], platformPct) returns the
   outcome without touching the DOM. Same input always gives the same result. */
window.__run = (seq, pct) => {
  reset();
  S.platformPct = pct || 6;
  for (let n = 0; n < seq.length && n < DECISIONS.length; n++) {
    S.i = n;
    applyChoice(seq[n]);
    const ri = REVIEW_AFTER.indexOf(n + 1);
    if (ri >= 0 && S.board < BOARD_FLOOR) { S.firedAt = ri; break; }
  }
  const r = finalScores();
  return { ending: r.key, outcome: r.ending.outcome,
           q1: +((r.q1 - 1) * 100).toFixed(1), y2: +r.y2.toFixed(2),
           board: Math.round(S.board), firedAt: S.firedAt,
           signal: +S.signal.toFixed(1), substance: +S.substance.toFixed(1),
           managed: +S.managed.toFixed(1), unmanaged: +S.unmanaged.toFixed(1),
           coh: +r.c.factor.toFixed(2), hits: r.c.hits.length, misses: r.c.misses.length };
};
window.__state = S;

reset();
screenBrief();
