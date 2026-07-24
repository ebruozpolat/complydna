# ComplyDNA — Product Philosophy

> Why we build for less work, not more data.

This document states the conviction ComplyDNA is built on. Everything in
[`complydna-dev-plan.md`](./complydna-dev-plan.md) — cite-first answers, killing
redundant review work, versioned golden-set evals — follows from it. If a
proposed feature does not serve this thesis, it does not belong in the product.

---

## The commoditization of compliance tools

Compliance tools — KYC checks, sanctions screening, fraud detection, blockchain
tracing — are becoming a commodity. That means they mostly have to compete on
price.

Unfortunately for the FinTech industry, many of these service providers decided
to "differentiate" themselves by offering additional information, more details,
more enhanced analytics, or richer reporting — hoping this lets them charge a
little more and stand out. I don't think it will work, even in the mid-term.

Instead of automating processes and saving time for compliance teams, these
"data-enhanced tools" simply create more work: more data points to review,
assess, and dismiss. The majority of those extra points change nothing.

One of the biggest compliance inefficiencies inside any FinTech is the time
wasted on manual reviews of redundant alerts and false positives that never
result in a change to the client's account status. So any tool that creates more
work instead of saving the compliance team's time is counterproductive, and — in
my opinion — not worth the investment.

## Why teams keep asking for more data

Compliance people tell their vendors they need more data, better reporting, or
deeper analytics for a few recurring reasons. It's worth being honest about each.

- **Professional reflex.** Our profession has a deep respect for information, so
  we automatically believe more data is good. But more information does not mean
  faster decisions or fewer redundant processes. Typically it means *slower*
  decisions — more data points to document and reconcile.

- **It's "interesting."** Many compliance people secretly enjoy playing the
  police and dream of catching bad guys. We love digging deeper, hunting for
  juicy details or inconsistencies in a client's story. Let's be honest: that's a
  personal indulgence, not a must-have.

- **Certainty as a shield.** Compliance people like certainty, are risk-averse,
  and want to feel safe about their decisions. When uncomfortable deciding on
  slightly incomplete information, we'd rather delay — "additional investigation
  is needed" — or escalate to a committee to avoid personal responsibility. Extra
  data points become a scapegoat, a convenient excuse not to decide now.

None of these are reasons to build a product around. They are reasons a product
should be designed to resist.

## What RegTech is actually for

It is my strong conviction that the purpose of RegTech — and of any
compliance-focused SaaS — is:

1. **Process automation** and bringing efficiency into the industry.
2. **Accelerating and improving the customer experience.**
3. **Reducing the cost of compliance per customer.**

Adding random features, more data, and more elements to consider is a nice
Candy Crush office game for the compliance department. It has nothing to do with
the purpose of RegTech.

---

## How this shapes ComplyDNA

ComplyDNA is a compliance LLM for Turkish regulation (MASAK, Law 5549, Law 6415,
KVKK, the ROM Regulation). The thesis above turns into hard product rules:

- **Every sentence carries a citation, or it isn't produced.**
  `[LAW-5549 / Article 4]`. An uncited claim is treated as a bug and rejected by
  a post-check. The goal is a decision the reviewer can *stand behind now* — not
  a longer dossier to reconcile later.

- **When the law is silent, the product says so.** "I couldn't find an explicit
  provision" is a valid, first-class answer. We do not manufacture "additional
  context" to fill the gap and create review work.

- **We measure whether we save time, not whether we surface more.** The golden
  set tracks citation precision/recall and retrieval hit-rate — signal that leads
  to a decision — and fails CI on regression. There is no metric that rewards
  showing more data points.

- **No feature earns its place by being "interesting."** If it adds points to
  review, assess, and dismiss without changing an account-status decision, it is
  the exact anti-pattern this document was written against.

The test for anything we ship is one question: **does it get the compliance team
to a defensible decision faster, or does it just give them more to look at?**
