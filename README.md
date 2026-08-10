# Prove Them Wrong

An interactive decision game about what an IT services firm would actually have to
change to survive AI — and whether the person in the chair survives making the changes.

You are the chief executive of a large IT services firm. Revenue grew again last year.
So did profit. The share price has still lost two thirds of its value, because the
market has stopped pricing your earnings and started pricing whether your business
model survives the decade. You get ten decisions and eighteen months. The board meets
three times along the way, and it does not have to wait until the end.

Seven to eight minutes to play. No build step, no dependencies.

**Live:** https://sridharkrishna.github.io/prove-them-wrong/

## What the game is arguing

A firm is an institution. Its incentives, its hiring, its leadership, its org chart and
its pricing are the rules it actually runs on, and none of them change because a chief
executive says the word AI on an analyst call.

Three things carry that:

**Only one attrition number is tracked.** People removed deliberately are the price of
a decision already taken, so they are not on the dashboard. What is tracked is
attrition among the people you needed — the ones who would have built the next thing,
leaving for firms willing to pay disproportionately for exactly them. Above 16% it
drains board confidence every round; above 21% it has its own ending. Paying brilliance
disproportionately is the only option that pushes it down.

**Board confidence can end the game early.** Deep change costs confidence before it
earns anything back, so the player has to sequence and explain rather than simply
choose well. Below 25 at any of the three reviews, the board removes you. Roughly one
random run in five ends this way, and the most aggressive possible opening — replace
the leadership, rewrite the comp, reprice the talent, all in the first three decisions
— is removed at the first review with the strategy intact and unexecuted.

**Decisions are scored against each other, not just added up.** New leaders on the old
scorecard cancel out. Mid-market clients on a time-and-materials rate card cancel out,
because you cannot serve a $400m client with forty people on site. Every firing pair is
named back to you at the end.

Ten endings. Three are terminations, one is the win.

## The ten decisions

The leadership team · the incentive · the pyramid · the platform budget · the
inheritance · the offer · the price · the org · the client · the story.

The first is the one a real chief executive finds hardest. Fourteen people report to
you and eleven have been there more than twenty years. They built the offshore
delivery model, the digital practice, the cloud business and the analytics unit — and
every one of those was the last war. The table shows their tenure before the question
gets asked.

## Running it

Open `index.html` in a browser. To serve it the way GitHub Pages does:

```bash
python3 -m http.server 8000
```

## Files

```
index.html    shell — links the stylesheet and the two scripts
styles.css    design tokens and components
content.js    all copy, weights, market wires and endings   ← edit this one
engine.js     state, scoring, board logic, rendering, charts
```

Everything the game *says* is in `content.js`, ahead of any logic. Rewrite any string
without touching the engine.

Each option carries these weights:

| Weight | Meaning |
|---|---|
| `signal` | what the market hears this quarter |
| `substance` | what actually changes inside the firm |
| `pain` | internal disruption and execution risk |
| `board` | board confidence delta — the survival meter |
| `unmanaged` | attrition among key people, in points. The only attrition shown; negative is good |
| `managed` | people removed deliberately. Kept in the model, deliberately **not** displayed |

plus optional `growth`, `margin`, `clients`, `arpc`.

Changing weights moves the ending distribution, so re-check it. Open the console:

```js
__run([1,1,1,0,2,3,2,1,2,1], 22)
```

That plays a fixed sequence of option indices at a given platform-budget percentage and
returns the outcome without drawing anything. The game is deterministic — the same
sequence always gives the same result. To check the spread, loop it over random
sequences and tally `.ending`; no single ending should swallow the middle, and removal
should sit near one run in five.

## On the figures

The numbers set the scenario. They are not presented as research, no claim is
attributed to a named company, and the briefing says so on screen. Corvus Technology
Services is a composite — not a real firm, with illustrative financials — and every
competitor, client and market event in the game is likewise invented.

Sridhar Krishna, The Takshashila Institution.

Built to the Takshashila design language: wine `#620d3c` and marigold `#f1a222` on
near-white, Inter for words and Roboto Mono for metadata, hairline rules, no radius and
no shadow anywhere.
