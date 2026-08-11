/* ============================================================================
   PROVE THEM WRONG — CONTENT
   Everything the game says lives here. Rewrite any string without touching
   engine.js. Weights sit beside the copy they belong to.

   Every option may carry:
     signal     what the market hears this quarter        (-1 … 4)
     substance  what actually changes inside the firm     (-1 … 4)
     pain       internal disruption and execution risk     (0 … 5)
     board      board confidence delta                    (-9 … +6)
     unmanaged  attrition among the people you needed and lost. This is the only
                attrition the game tracks or displays. Rising kills the strategy;
                negative is good.
     managed    people removed deliberately. Kept in the model but NOT shown
                anywhere: it is the price of a decision already taken, not a
                number a chief executive needs on a dashboard.
   and optionally: growth, margin, clients, arpc, mix {legacy, infra, consulting, platform}

   NOTE ON FIGURES: the numbers here set the scenario. They are not presented as
   research and nothing is attributed to a named company.
   ============================================================================ */

const FIRM = {
  name: "Corvus Technology Services",
  people: "340,000",
  revenue: "$22bn",
  // Share price indexed to 100, tracking the real shape of the sector's fall.
  history: [100, 96, 89, 81, 72, 64, 56, 47, 39, 33],
  start: {
    price: 33, board: 48,
    growth: 3.1, margin: 14.8,
    managed: 4.0, unmanaged: 12.0,
    clients: 11, arpc: 65,
    mix: { legacy: 56, infra: 26, consulting: 12, platform: 6 }
  }
};

/* The briefing's conditions block — the state of the world you inherit. */
const FACTS = [
  { fig: "−67%",
    txt: "What your listed competitors have lost in market value since 2021, while revenue and profit grew throughout. The market is not pricing this year's earnings. It is pricing whether the model survives the decade." },
  { fig: "30–50%",
    txt: "The compression AI applies to project timelines and resource requirements. The work still gets done, with fewer people and less time — and your contracts bill for people and time." },
  { fig: "70%",
    txt: "The share of your top leadership who have spent more than two decades here. They built the offshore model, the digital practice and the cloud business. This is the hardest thing on this page to change." },
  { fig: "+26%",
    txt: "How much faster an engineer using AI completes a development task. The capability is not in question and has not been for some time. What is in question is whether an organisation built for the old economics can absorb it." }
];
const FACTS_NOTE = "Figures set the scenario. Corvus Technology Services is a composite, and its financials are illustrative.";

/* Your top team. Tenure bars make the twenty-year problem visible before the
   question gets asked. `fit` is a 0–3 read on AI-era suitability. */
const TEAM = [
  { name: "R. Iyengar",    remit: "Global Delivery",          years: 26, fit: 1 },
  { name: "M. Whitcombe",  remit: "Financial Services",       years: 24, fit: 1 },
  { name: "S. Raghavan",   remit: "Cloud & Infrastructure",   years: 22, fit: 1 },
  { name: "P. Menon",      remit: "Data & Analytics",         years: 21, fit: 2 },
  { name: "A. Delacroix",  remit: "Consulting & Strategy",    years: 19, fit: 2 },
  { name: "J. Okonkwo",    remit: "Products & Platforms",     years:  3, fit: 3 }
];
const TEAM_FOOT = "And eight others. Eleven of the fourteen have been here more than twenty years, which is typical of the industry and not a fact anybody inside it finds remarkable.";

/* Market wires, keyed to the decision they follow (1-indexed).
   `src` is in-world: where the news reached your desk from. */
const WIRES = {
  1: { fig: "30–50%",
       head: "AI is compressing delivery by a third to a half.",
       body: "The work still gets done. It takes fewer people and less time, and every contract you hold bills for people and time. Each efficiency you deliver this year reduces what you can invoice next year.",
       src: "Delivery analytics · prepared for the board" },
  3: { fig: "−67%",
       head: "The market has already made up its mind about the industry.",
       body: "Your listed competitors have lost two thirds of their combined market value since 2021, with revenue and profit growing the whole way. Your own numbers are still good. That has stopped being the thing anyone is looking at.",
       src: "Sector index · your six listed competitors" },
  5: { fig: "$300m",
       head: "A competitor just dropped its client floor by an order of magnitude.",
       body: "They announced a mid-market unit this morning, aimed at firms between $300m and $3bn in revenue — a tier none of the large firms has served, because forty people on site never made sense below $3bn. If platform delivery makes that arithmetic work, the pricing pressure comes back up the chain to your largest accounts.",
       src: "Competitor announcement · this morning" },
  7: { fig: "Two of ten",
       head: "Two of your top ten clients will not renew on time and materials.",
       body: "Procurement has written to say that from next year they buy outcomes or nothing. Between them the accounts are worth $580m a year, and neither has asked to see your rate card.",
       src: "Procurement correspondence · two accounts" },
  9: { fig: "Eleven months",
       head: "A client built in-house what you quoted eleven months to deliver.",
       body: "Fourteen years of relationship and a $40m proposal, and four of their engineers did it in a quarter. Their chief information officer sent you the demonstration himself, which is either courtesy or notice.",
       src: "Client demonstration · sent to you directly" }
};

const DECISIONS = [
  /* ---------------------------------------------------------------- D.01 */
  {
    code: "D.01", eyebrow: "The people", title: "The leadership team", type: "team",
    context: "Fourteen people report to you. Eleven have been here more than twenty years. Between them they built the offshore delivery model, the digital practice, the cloud migration business and the analytics unit. Every one of those was won by someone in this room — and every one of them was the last war.",
    question: "Who is still the right person for what comes next?",
    options: [
      { label: "Add a fifteenth chair",
        body: "A Chief AI Officer reporting to you. The other fourteen keep their remits exactly as they are.",
        signal: 3, substance: 0, pain: 0, board: 6, managed: 0, unmanaged: 0,
        wire: "Your new officer has no profit and loss, no delivery organisation, and fourteen peers who have each run one for two decades." },
      { label: "Replace three of the fourteen",
        body: "The three whose businesses AI compresses fastest. Recruit from outside the industry.",
        signal: 2, substance: 3, pain: 3, board: -3, managed: 3, unmanaged: 1,
        wire: "Three people who between them gave the firm seventy-two years. Two of them hold the relationships on accounts worth $1.4bn, and the relationships are leaving with them." },
      { label: "Re-contract all fourteen roles",
        body: "Every role redefined and re-applied for. Some of the fourteen will not get one.",
        signal: 1, substance: 4, pain: 5, board: -9, managed: 6, unmanaged: 4,
        wire: "You have told fourteen people who trusted you that the trust was conditional. Nine will still be here in a year. You do not yet know which nine, and neither do they." },
      { label: "Change the scorecard, not the chairs",
        body: "Keep all fourteen. Rebuild what they are measured on, what they are paid, and the layer directly beneath them.",
        signal: 0, substance: 3, pain: 3, board: -1, managed: 2, unmanaged: 1,
        wire: "The layer beneath is where the work is actually done. It is also where the people an AI-native firm would hire tomorrow are sitting." }
    ]
  },
  /* ---------------------------------------------------------------- D.02 */
  {
    code: "D.02", eyebrow: "The machine", title: "The incentive",
    context: "Two hundred and forty profit-centre heads are paid on revenue and utilisation. Every one of them made their number last year. The share price fell by two thirds anyway.",
    question: "How do you pay them this year?",
    options: [
      { label: "Hold the line, add a metric",
        body: "Revenue and utilisation stay. Every account additionally reports the hours AI saved.",
        signal: 2, substance: 0, pain: 0, board: 3, managed: 0, unmanaged: 1,
        wire: "You have asked two hundred and forty people to report a number that shrinks the number they are paid on. They will report it." },
      { label: "Pay on gross margin, not revenue",
        body: "Growing a $40m account by adding forty people stops counting as growth.",
        signal: 1, substance: 2, pain: 1, board: 1, managed: 0, unmanaged: 0,
        wire: "Margin is harder to game than revenue. It still rises when you bill more hours." },
      { label: "Pay a reuse royalty",
        body: "Deploy another unit's asset and keep the margin. Build one others deploy and earn on it. Utilisation leaves the bonus entirely.",
        signal: 0, substance: 4, pain: 4, board: -5, managed: 2, unmanaged: 2,
        wire: "Nine of your top thirty partners have asked what this means for them. Two have taken recruiter calls this week." },
      { label: "Carve out a separate AI unit",
        body: "Its own profit and loss, its own pay scales, its own hiring. The core business continues unchanged.",
        signal: 3, substance: 0, pain: 1, board: 5, managed: 0, unmanaged: 1,
        wire: "Well funded and much admired, and asked to outrun a machine that is not being asked to change." }
    ]
  },
  /* ---------------------------------------------------------------- D.03 */
  {
    code: "D.03", eyebrow: "The people", title: "The pyramid",
    context: "You hire 38,000 engineering graduates a year and train them to write code. The model writes that code now, and it does not go home. Every competitor's answer so far has been to hire the same number and retrain them.",
    question: "What do you do about the people?",
    options: [
      { label: "Same intake, retrained",
        body: "Hire 38,000. Twelve weeks of AI tooling. Deploy as before.",
        signal: 2, substance: 0, pain: 0, board: 2, managed: 0, unmanaged: 1,
        wire: "Thirty-eight thousand people retrained for the layer that appears to be disappearing fastest." },
      { label: "Fewer people, paid extraordinarily",
        body: "Six hundred exceptional engineers on packages that will startle your board, and 12,000 graduates instead of 38,000.",
        signal: 2, substance: 4, pain: 4, board: -6, managed: 4, unmanaged: -3,
        wire: "Rewarding brilliance disproportionately is the only reliable way to hold it. It also means a twenty-six-year veteran finding out what a twenty-nine-year-old is paid.",
        // You cannot direct people you cannot evaluate. Exceptional engineers hired
        // into an unchanged leadership team leave, and take the strategy with them.
        requires: {
          decision: 0, met: [1, 2], partial: [3],
          penalty: { substance: -4, unmanaged: 6, board: -2 },
          wire: "Six hundred exceptional engineers arrived into a leadership team that has not changed. Most of them now report to people who cannot evaluate their work, and a third are already gone. You bought the talent and kept the ceiling above it.",
          wirePartial: "The scorecards changed and the fourteen did not. The engineers you paid extraordinarily are being directed by people who were promoted for something else, and enough of them have noticed for it to show in the numbers." } },
      { label: "Same number, different people",
        body: "Still 38,000, hired for domain, data and verification — for specifying work and proving it came out right.",
        signal: 1, substance: 3, pain: 2, board: 0, managed: 1, unmanaged: -1,
        wire: "Your recruiters have never screened for this, and neither have most of the colleges that supply you." },
      { label: "Buy the capability",
        body: "Acquire three AI-native firms of about two hundred people — and let their culture absorb yours, not the reverse.",
        signal: 3, substance: 3, pain: 3, board: 2, managed: 1, unmanaged: 0,
        wire: "The instruction is that your people assimilate into theirs. Six hundred against three hundred and forty thousand — the firm will decide whether you meant it.",
        // A leadership team that has spent twenty years absorbing acquisitions will
        // absorb these too, whatever the instruction said.
        requires: {
          decision: 0, met: [1, 2], partial: [3],
          penalty: { substance: -3, unmanaged: 4, board: -1 },
          wire: "Three AI-native firms, six hundred people, and a leadership team that has spent twenty years absorbing acquisitions into its own way of working. It absorbed these too. The instruction to assimilate the other way was not one anybody above them believed." } }
    ]
  },
  /* ---------------------------------------------------------------- D.04 */
  {
    code: "D.04", eyebrow: "The machine", title: "The budget", type: "budget",
    context: "Platform and reusable-asset spend runs at 6% of revenue, about $1.3bn. Some of it is handed back every fourth quarter to make the number.",
    question: "Set the number. Then say where it comes from.",
    options: [
      { label: "From margin. Tell the street",
        body: "Guidance comes down two points and you explain why.",
        gate: 0.8, signal: 1, substance: 1, pain: 2, board: -4, margin: -1.4,
        wire: "The street decides within a day whether a margin cut is an investment or an excuse." },
      { label: "From the bench and the year-end reserve",
        body: "Money that already exists, with no new line on the guidance.",
        gate: 0.6, signal: 0, substance: 0.5, pain: 1, board: 0,
        wire: "It is real money. It is also the first money to disappear when a quarter comes up short." },
      { label: "From clients, inside their programmes",
        body: "The assets get built and the client pays for the building.",
        gate: 0.0, signal: 1.5, substance: 0, pain: 0, board: 3,
        wire: "Three of your largest clients have asked who owns the asset afterwards. You know which answer they are waiting for." },
      { label: "A ring-fenced capital line",
        body: "Board-approved, reported separately, closed to the quarter.",
        gate: 1.0, signal: 0, substance: 2, pain: 2, board: -2,
        wire: "For the first time, nobody can reach into it in the last three weeks of December." }
    ]
  },
  /* ---------------------------------------------------------------- D.05 */
  {
    code: "D.05", eyebrow: "The inheritance", title: "What you already have",
    context: "Four hundred domain specialists who know how a reinsurance claim actually moves, how a drug trial is filed, how a rail network schedules maintenance. Twenty years of it. None of it is on the balance sheet, almost none of it is written down, and roughly a third of them retire within four years.",
    question: "What do you do with the one thing a client cannot buy?",
    options: [
      { label: "Protect it",
        body: "Ring-fence the domain experts and keep them on the accounts that pay for them.",
        signal: 0, substance: 0, pain: 0, board: 2, managed: 0, unmanaged: 1,
        wire: "Protected, billable and unchanged. In four years a third of it walks out of the building, and none of it was ever written down." },
      // The deepest single move in the game, and the most expensive in the near term:
      // it must out-rank pairing on substance or it is never worth choosing.
      { label: "Write it down",
        body: "Convert what they know into evaluation sets, process maps and failure taxonomies. Eighteen months, billing nobody.",
        signal: 0, substance: 5, pain: 4, board: -6, managed: 0, unmanaged: 0, margin: -0.8,
        wire: "You have taken four hundred of your most billable people off revenue to write documents for a year and a half. It is also the only form of this asset a model can actually use, and nobody else in the industry has one." },
      { label: "Pair them",
        body: "Every domain expert paired with an AI engineer. The expert specifies and verifies; the engineer builds.",
        signal: 2, substance: 4, pain: 2, board: 0, managed: 0, unmanaged: -2,
        wire: "The scarce person turns out not to be the engineer. It is the one who can say precisely what right looks like, and you already employ four hundred of them." },
      { label: "Sell it as advisory",
        body: "Repackage the expertise as high-margin consulting. Fewer people, much higher rates.",
        signal: 3, substance: 1, pain: 1, board: 4, managed: 0, unmanaged: 1, margin: 0.7,
        wire: "The highest margin you sell and the least defensible. It is also the first line a client cuts once their own models are good enough." }
    ]
  },
  /* ---------------------------------------------------------------- D.06 */
  {
    code: "D.06", eyebrow: "The offer", title: "The question",
    context: "Your largest client's chief information officer — $310m a year, eleven years — puts it plainly. “I have forty engineers and a frontier model subscription. Tell me what I still need you for.”",
    question: "What do you say?",
    options: [
      { label: "Scale",
        body: "“What your forty do, we do two hundred times over, in every market you operate in.”",
        signal: 2, substance: -1, pain: 0, board: 1, managed: 0, unmanaged: 1,
        wire: "You answered a question about capability with a number of people. He has heard that answer before, at a lower price." },
      { label: "The last mile",
        body: "“Your forty can build the demonstration. We put it into production across fourteen countries, nine regulators and forty years of undocumented systems.”",
        signal: 2, substance: 3, pain: 1, board: 2, managed: 0, unmanaged: 0,
        wire: "Honest, and probably true for about six years. He is already asking what happens after that." },
      { label: "The corpus",
        body: "“We have run your industry's processes for twenty years across sixty clients. We hold the evaluation sets, the failure taxonomies, the ground truth. You have one company's data.”",
        signal: 1, substance: 4, pain: 2, board: -1, managed: 0, unmanaged: 0,
        wire: "It may be the only thing you have that he cannot buy. Whether it exists depends entirely on what you did with your domain experts." },
      { label: "The risk",
        body: "“We will carry it. Defined outcome, our balance sheet. If it fails, you do not pay.”",
        signal: 3, substance: 3, pain: 4, board: -3, managed: 0, unmanaged: 0,
        wire: "Your finance director has asked how much of the firm you intend to stand behind that sentence." }
    ]
  },
  /* ---------------------------------------------------------------- D.07 */
  {
    code: "D.07", eyebrow: "The offer", title: "The price",
    context: "84% of revenue is billed by time and materials. Two of your top ten clients have already written to say they will not renew on that basis, and neither asked to see the rate card.",
    question: "How do you sell the work?",
    options: [
      { label: "Keep the hour, raise the rate",
        body: "Premium rates for AI-augmented pods. Fewer hours, more per hour.",
        signal: 2, substance: 0, pain: 0, board: 2, managed: 0, unmanaged: 0,
        wire: "You are now selling a smaller number of more expensive hours. Every analyst covering you can do that arithmetic." },
      { label: "Price the outcome",
        body: "A defined result against a service level. What it costs you to deliver is your problem.",
        signal: 2, substance: 3, pain: 3, board: -2, managed: 0, unmanaged: 0, margin: -0.5,
        wire: "Margin now depends on your own estimates being right, which has not always been a strength." },
      { label: "Sell a subscription",
        body: "Per process, per month, on the platform. Recurring, and unrelated to headcount.",
        signal: 3, substance: 4, pain: 4, board: -6, managed: 0, unmanaged: 0, growth: -1.6,
        wire: "Reported revenue may fall for six quarters before it rises. The market has a name for that curve and it is not a kind one." },
      { label: "Take a share of the saving",
        body: "You keep a fixed percentage of what the client no longer spends.",
        signal: 3, substance: 2, pain: 3, board: 0, managed: 0, unmanaged: 0,
        wire: "Everyone agrees the savings are real. Nobody has yet agreed how they will be measured." }
    ]
  },
  /* ---------------------------------------------------------------- D.08 */
  {
    code: "D.08", eyebrow: "The shape", title: "The org",
    context: "Fourteen geographic market units, four delivery hubs. An asset built in Bengaluru for a Dutch bank is invisible to the team in São Paulo, and nobody is worse off for that.",
    question: "What owns the asset?",
    options: [
      { label: "A global centre of excellence",
        body: "Reports to you. Dotted line into the market units. No profit and loss of its own.",
        signal: 3, substance: 0, pain: 0, board: 4, managed: 0, unmanaged: 0,
        wire: "A centre of excellence without a profit and loss can recommend. It cannot make anybody do anything." },
      { label: "Flip the axis to industry verticals",
        body: "Verticals hold the profit and loss. Geography becomes sales coverage.",
        signal: 2, substance: 3, pain: 4, board: -3, managed: 2, unmanaged: 2,
        wire: "Eighteen months of disruption, and the second reorganisation this decade. Your people know the pattern." },
      { label: "Appoint product general managers",
        body: "Twelve of them. Each owns an asset's roadmap, margin and adoption across every market. The market units become their customers.",
        signal: 1, substance: 4, pain: 3, board: -2, managed: 1, unmanaged: 1,
        wire: "You have created twelve people whose job is to tell your most senior revenue owners what to sell." },
      { label: "Two speeds, with one rule",
        body: "Leave the machine alone. Build the product organisation beside it. Any work done twice must migrate.",
        signal: 1, substance: 3, pain: 2, board: 1, managed: 0, unmanaged: 0,
        wire: "The rule is the whole idea. Rules of that kind are usually enforced for about four quarters." }
    ]
  },
  /* ---------------------------------------------------------------- D.09 */
  {
    code: "D.09", eyebrow: "The shape", title: "The client",
    context: "Three hundred and forty clients, every one of them above $3bn in revenue, because below that the cost of selling and serving them never made sense. That arithmetic assumed forty people on site. A competitor dropped its floor to $300m six weeks ago.",
    question: "Who do you sell to now?",
    options: [
      { label: "Stay upmarket. Go deeper",
        body: "Grow revenue per client. It is where the relationships and the margin have always been.",
        signal: 2, substance: 0, pain: 0, board: 4, clients: 2, arpc: 7,
        wire: "Your largest clients are also the ones best able to build it themselves, and they know exactly what you pay your engineers." },
      { label: "Drop the floor to $300m",
        body: "Ten thousand firms you have never called. Platform delivery, thin sales coverage, nobody on site.",
        signal: 3, substance: 4, pain: 3, board: -2, clients: 180, arpc: -46,
        wire: "Revenue per client falls by roughly four fifths, so the client count has to rise faster than that. A competitor made the same move six weeks ago, which is either validation or a warning." },
      { label: "Mid-market, but only where you know the industry",
        body: "Two verticals, the ones with the deepest domain bench. Everything else unchanged.",
        signal: 2, substance: 4, pain: 2, board: 1, clients: 70, arpc: -22,
        wire: "Narrow enough to be credible and wide enough to matter, which is the hardest kind of bet to defend in a quarterly review." },
      // Its edge over the other two mid-market plays is that there is nothing to
      // unpick: less internal disruption, and your best people are not spent
      // fighting somebody else's forty-year-old systems.
      { label: "Follow the growth, not the size",
        body: "Firms with no legacy estate, at any revenue, in markets that skipped the last three technology cycles.",
        signal: 1, substance: 4, pain: 1, board: -4, unmanaged: -2, clients: 120, arpc: -34,
        wire: "No legacy estate means nothing to unpick, and your best engineers stop spending their weeks inside somebody else's forty-year-old systems. It also means no budget line already exists for what you are selling." }
    ]
  },
  /* ---------------------------------------------------------------- D.10 */
  {
    code: "D.10", eyebrow: "The proof", title: "The story",
    context: "Analyst day is in six weeks. Four of your competitors have announced an AI investment programme this quarter, and three of those stocks have already given the gain back.",
    question: "What goes on the first slide?",
    options: [
      { label: "A number with a currency sign",
        body: "$3bn over three years. Comfortably the largest of the five.",
        signal: 4, substance: 0, pain: 0, board: 6, managed: 0, unmanaged: 0,
        wire: "The stock moved. So did four others this quarter, for the same reason, and most of them did not keep it." },
      { label: "A number with a date attached",
        body: "40% of revenue non-linear by FY29. You will be asked about it every ninety days until then.",
        signal: 3, substance: 3, pain: 3, board: 2, managed: 0, unmanaged: 0,
        wire: "You have handed the market a stick. That is usually what makes them believe the carrot." },
      { label: "One client's profit and loss",
        body: "What the work cost before, what it costs now, what you kept. Unglamorous, and checkable.",
        signal: 2, substance: 3, pain: 1, board: 1, managed: 0, unmanaged: 0,
        wire: "Two analysts called it the most useful slide of the day. Neither of them changed their rating." },
      // The costliest option now and the most protective later: a number you never
      // gave is a number you never have to defend by cutting the programme to hit it.
      { label: "Nothing new",
        body: "Report the numbers. Announce nothing you would later have to protect by cutting the very programme that earns it.",
        signal: -1, substance: 4, pain: 2, board: -7, managed: 0, unmanaged: 0,
        wire: "Silence is a position, and it is rarely read as a confident one. It is also the only version of this where the investment survives a bad quarter intact." }
    ]
  }
];

/* Board reviews sit after these decision numbers (1-indexed). */
const REVIEW_AFTER = [3, 6, 9];

const REVIEWS = [
  { code: "B.01", title: "The first review",
    fired: "The chair did not use the word. He said the board had concluded that the pace you have chosen is not one the firm can absorb, and that a transition would be announced before markets open.",
    warn:  "Three of the eight directors asked, separately and in almost the same words, how long you expect to need.",
    ok:    "The board noted the changes and asked to see the numbers next quarter. Nobody said anything memorable, which at this stage is the best available outcome.",
    good:  "The chair told the analysts' call that the board is united behind the plan. Two directors used the word decisive." },
  { code: "B.02", title: "The second review",
    fired: "The nominations committee had met before you arrived. You were asked to wait outside for eleven minutes, and the eleven minutes were the whole of it.",
    warn:  "A director you have known for nine years asked whether the strategy could be delivered by someone the market had not already made up its mind about.",
    ok:    "The board accepted the plan and asked for a quarterly milestone against it. That is not support, but it is time, and time is the thing you needed.",
    good:  "Two directors have started describing the strategy as the board's. This is the most reliable sign that it is working." },
  { code: "B.03", title: "The final review",
    fired: "Six weeks before analyst day, with the work half done and none of it yet visible in the numbers, the board decided it preferred a different person to present it.",
    warn:  "The chair asked what you would say at analyst day if the first two years of numbers were the only evidence available. You did not have a good answer.",
    ok:    "The board signed off the analyst day material without amendment, which is either confidence or resignation.",
    good:  "The board has extended your contract by three years, ahead of any request from you." }
];

/* Rules checked after the run. `p` is the array of chosen option indices,
   `s` is the game state. Indices: 0 D.01 … 9 D.10 */
const CONTRADICTIONS = [
  { codes: ["D.03","D.01"], test: p => p[2] === 1 && p[0] === 0,
    text: "You paid extraordinarily for six hundred engineers and left the people who direct them unchanged." },
  { codes: ["D.03","D.01"], test: p => p[2] === 3 && p[0] === 0,
    text: "You bought three AI-native firms and kept the leadership that has always absorbed acquisitions into its own way of working." },
  { codes: ["D.01","D.02"], test: p => p[0] === 1 && p[1] === 0,
    text: "New people in three chairs, and the same scorecard on all fourteen." },
  { codes: ["D.07","D.02"], test: p => p[6] === 2 && p[1] === 0,
    text: "You asked the sales force to sell a subscription that shrinks their bonus." },
  { codes: ["D.09","D.07"], test: p => p[8] === 1 && p[6] === 0,
    text: "You cannot serve a $400m client with forty people on site and a rate card." },
  { codes: ["D.06","D.05"], test: p => p[5] === 2 && p[4] === 0,
    text: "The corpus you promised sits in four hundred heads you have just ring-fenced onto billable accounts." },
  { codes: ["D.06","D.04"], test: (p, s) => p[5] === 2 && s.platformPct < 12,
    text: "You told the client the corpus was your advantage, and funded it below 12%." },
  { codes: ["D.04","D.06"], test: (p, s) => p[3] === 2 && p[5] === 2 && s.platformPct >= 12,
    text: "You built the corpus with the clients' money. They will own what they paid for." },
  { codes: ["D.08","D.02"], test: p => p[7] === 0 && p[1] === 2,
    text: "You paid for reuse and left nobody accountable for the thing being reused." },
  { codes: ["D.03","D.07"], test: p => p[2] === 0 && p[6] === 2,
    text: "A subscription business does not need thirty-eight thousand more people who write code." },
  { codes: ["D.10","—"], test: (p, s) => p[9] === 0 && s.substance < 14,
    text: "You announced three billion dollars of change without having made very much." }
];

const COHERENCES = [
  { codes: ["D.01","D.02"], test: p => p[0] >= 1 && p[1] === 2,
    text: "New leadership and a new scorecard arrived in the same year." },
  { codes: ["D.03","D.05"], test: p => p[2] === 1 && p[4] === 2,
    text: "You paid to keep the scarce people, then put them where they matter." },
  { codes: ["D.07","D.04"], test: (p, s) => p[6] === 2 && s.platformPct >= 15,
    text: "You are selling a product, and you are funding one." },
  { codes: ["D.06","D.05"], test: p => p[5] === 2 && p[4] === 1,
    text: "The corpus exists, because you paid four hundred people to stop billing and write it down." },
  { codes: ["D.09","D.07"], test: p => p[8] !== 0 && (p[6] === 1 || p[6] === 2),
    text: "New clients bought on a new basis, rather than the old model at a lower rate." },
  { codes: ["D.08","D.06"], test: p => p[7] === 2 && p[5] === 2,
    text: "Somebody owns the corpus, which is the difference between an asset and a claim." },
  { codes: ["D.01","D.03"], test: p => p[0] === 2 && p[2] === 1,
    text: "You reset the top of the firm and made it worth staying for." },
  { codes: ["D.10","—"], test: (p, s) => p[9] === 1 && s.substance >= 18,
    text: "You gave the market a commitment you had already built the means to keep." }
];

/* outcome drives the stamp at the top of the reveal: WIN / LOSE / OUT */
const ENDINGS = {
  fired1: { outcome: "out", tag: "Removed at the first review",
    head: "You lasted three decisions.",
    body: "Everything you chose was arguably correct and all of it arrived at once, with nothing yet in the numbers to justify any of it. A board that has watched two thirds of its market value disappear has very little appetite left, and you spent what remained in a single quarter. The strategy was not rejected. You were.",
    lesson: "A transformation you are not present for is somebody else's transformation." },
  fired2: { outcome: "out", tag: "Removed at the second review",
    head: "Halfway, with the costs visible and none of the benefits.",
    body: "This is the worst point on the curve and it is where most of these attempts end. The disruption is fully priced into the numbers, the returns are still a year out, and the people who backed the plan have started describing it as yours rather than theirs. Your successor will inherit the benefit of everything you were removed for doing.",
    lesson: "The middle of a rebuild looks identical to a failure. That is precisely why so few survive it." },
  fired3: { outcome: "out", tag: "Removed before analyst day",
    head: "Six weeks short.",
    body: "The work was largely done. It was not yet visible in a quarterly statement, and the board preferred that somebody else present it. Your successor took the stage with your material, your numbers and your plan, and the market re-rated the stock inside two quarters.",
    lesson: "Being right is not the same as being there when it becomes obvious." },
  exodus: { outcome: "lose", tag: "The exodus",
    head: "You made the right calls, and the people who could have delivered them left.",
    body: "Attrition among the people you most needed ran away from you. Removing people who no longer fit costs a firm very little and is not the number worth watching. Losing the ones who would have built the next thing costs it everything. They did not leave because you changed the firm. They left because the change arrived without a reason for them to stay, and a competitor was willing to pay disproportionately for exactly them.",
    lesson: "The attrition that matters is never the attrition you chose." },
  contradiction: { outcome: "lose", tag: "The contradiction",
    head: "Every lever you pulled was defensible. Several were wired against each other.",
    body: "There is no single decision here you would struggle to justify to the board. The difficulty is that the firm received several instructions at once that cannot all be obeyed. Organisations resolve that by continuing to do what they were already doing, while reporting that the new thing is under way.",
    lesson: "A strategy is not the sum of its decisions. It is whether the decisions permit each other." },
  rerating: { outcome: "win", tag: "The re-rating",
    head: "You changed the shape of the revenue, and the multiple followed it.",
    body: "The near-term gain was bought with things you could show. The doubling came from somewhere else — from a growing share of revenue that no longer moves in step with headcount, sold to clients your firm would not have called two years ago, delivered by people you either kept deliberately or hired specifically. That is the number the market was pricing all along, which is why the share price fell long before anything had gone wrong.",
    lesson: "The multiple follows the shape of the revenue, not its size." },
  quiet: { outcome: "win", tag: "The quiet rebuild",
    head: "The board nearly replaced you, and the second year proved you right.",
    body: "You spent the first year making changes almost nobody outside the firm could see, and the share price behaved accordingly. What you were building was real, and by the second year it was visible in the accounts rather than in the announcements. Two directors have since described the strategy as theirs. You missed the near-term mandate and met the one that mattered.",
    lesson: "Institutional change is invisible for roughly as long as it takes to become irreversible." },
  announcement: { outcome: "lose", tag: "The announcement",
    head: "You bought the quarter. The quarter was not for sale.",
    body: "The near-term target was met comfortably. Underneath it the firm went on rewarding exactly what it rewarded before — billed hours, sold work, people on projects — so nothing that produced the original problem was removed. By the second year the market had stopped grading the announcement and started grading the accounts.",
    lesson: "A firm does what it pays people to do, whatever it has told the market it is doing." },
  pilot: { outcome: "lose", tag: "The pilot programme",
    head: "Forty pilots, one centre of excellence, and a firm that works exactly as it did.",
    body: "You moved on every front and committed on none. There is now an AI initiative in each of the fourteen market units, a slide that lists them, and a quarterly newsletter. Not one of them changed how anybody is paid, hired, organised or sold to, so each of them stayed a pilot. This may be the most common outcome in the industry and the hardest to see from inside, because at no single point does anyone make an obviously wrong decision.",
    lesson: "A pilot that cannot change the system it runs inside is a demonstration, not a transition." },
  custodian: { outcome: "lose", tag: "The custodian",
    head: "You handed on a smaller version of what you were given.",
    body: "Nothing here was reckless and very little of it was consequential. The firm remains capable, well run, and priced as though its best years are behind it. The technology moved through the entire period, and the distance between what it allowed and what your organisation permitted grew in every quarter you did not close it.",
    lesson: "Standing still is a decision, and it compounds at the speed of the technology." }
};

const ABOUT = [
  ["Format", "Ten decisions · three board reviews"],
  ["The firm", "A composite. Not a real company"],
  ["Financials", "Illustrative"],
  ["Endings", "Ten. One meets both mandates"],
  ["Author", "Sridhar Krishna"],
  ["Institution", "The Takshashila Institution"]
];
