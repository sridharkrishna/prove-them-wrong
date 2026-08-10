# Prove Them Wrong

An interactive decision game about what an IT services firm would actually have to
change to survive AI — and why the two things its board wants are not the same game.

You are the chief executive of a large IT services firm. The market has cut your share
price by 38% in six quarters on the belief that AI has made your business model
obsolete. The board wants +20–30% near term and a doubling in two years. You get eight
decisions and eighteen months.

Five to six minutes to play. One HTML file, no build step, no dependencies.

## The design

Two numbers are tracked while you play. Only one of them is labelled.

The visible one is the share price, and it responds to what you announce. The
unlabelled one is **institutional lag** — the months the firm's incentives, hiring,
organisation and pricing trail what the technology already permits. It rises by two
months every round on its own, because capability advances whether or not anyone acts
on it, and it falls only when a decision changes how the firm actually works.

The near-term mandate can be bought with announcements. The two-year mandate cannot.
Most players get one and not the other, and the reveal explains why.

The eight decisions are the incentive structure, the graduate pyramid, the platform
budget, what the firm can offer a client who already has engineers and a model
subscription, the pricing model, the organisation construct, the geographic map, and
what goes on the first slide at analyst day.

Decisions are also scored against each other. Paying people on utilisation while
asking them to sell a subscription cancels out; funding the corpus from client
programmes while telling clients the corpus is your advantage cancels out. A short
table of these pairs is named back to you at the end, because a strategy is not the
sum of its decisions — it is whether the decisions permit each other.

Seven endings. One of them is a win. One of them is what happens when every call you
make is correct and the board removes you anyway.

## Running it

Open `index.html` in a browser. That is the whole thing.

To serve it the way GitHub Pages does:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publishing to GitHub Pages

`index.html` sits at the repository root and `.nojekyll` is present, so Pages needs no
configuration. Push the repo, then in **Settings → Pages** set the source to *Deploy
from a branch*, branch `main`, folder `/ (root)`. The site appears at
`https://<user>.github.io/<repo>/` within a minute or two.

Note that Pages sites on a free account are public.

## Editing it

Everything the game says lives in one block at the top of the `<script>` tag, before
any logic:

- `FIRM` — the firm's name and share price history
- `DECISIONS` — all eight, with each option's copy and its three weights
- `CONTRADICTIONS` / `COHERENCES` — the pairs that cancel or reinforce
- `ENDINGS` — the seven verdicts

Each option carries three numbers, all roughly in the range −1 to 4:

| Weight | Meaning |
|---|---|
| `signal` | what the market hears this quarter |
| `substance` | what actually moves the firm's institutions |
| `pain` | internal disruption, attrition, execution risk |

Rewriting copy needs no change to the engine below it. Changing weights will move the
ending distribution, so re-check it afterwards — open the console and run:

```js
__run([1,3,0,3,2,1,2,1], 30)
```

That plays a fixed sequence of option indices at a given platform-budget percentage
and returns the scores and the ending without drawing the reveal. The game is
deterministic: the same sequence always gives the same result.

## Sources

The argument is drawn from the author's own work:

- *Technological Disruption and Institutional Lag*, working paper — the lag thesis,
  and the observation that the gap widens on its own when capability outruns
  institutions
- *AI Adoption — Think Tasks, Not Jobs*, Takshashila Discussion Document 2024-22 —
  AI takes tasks rather than jobs, and adoption lags capability
- *State of AI Governance*, 2026 — enterprise adoption friction

Sridhar Krishna, The Takshashila Institution.

Built to the Takshashila design language: wine `#620d3c` and marigold `#f1a222` on
near-white, Inter for words and Roboto Mono for metadata, hairline rules, no radius
and no shadow anywhere.

Corvus Technology Services is a composite. It is not a real firm, and its figures are
illustrative.
