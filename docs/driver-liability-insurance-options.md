# Driver liability and insurance — options for legal review

Prepared to support the open placeholder in `src/app/legal/[document]/page.tsx`
("driver-terms" → "Insurance and liability"). Not a decision — a briefing
document for whoever reviews the legal drafts (gate 2 of PR #1) and, ideally,
an insurance broker familiar with gig-economy delivery risk in South Africa.

## The question

If a driver causes or is involved in an accident while actively delivering
for StreetPlate — injuring a third party, damaging property, damaging the
order, or being injured themselves — who is financially and legally
responsible, and does any insurance actually respond?

This matters for two separate reasons:

1. **Coverage gap.** Most personal South African vehicle insurance policies
   exclude "business use" / "hire or reward" — which is what paid delivery
   work is. A driver on an ordinary personal policy risks a denied claim
   after an accident, precisely because they were delivering at the time.
2. **Contractor classification risk.** The driver terms currently state
   drivers are independent contractors, not employees, so the BCEA and LRA
   don't apply. How much control and risk StreetPlate takes on for driver
   safety and liability is one factor (not the only one) courts weigh when
   a contractor relationship is challenged as being, in substance, an
   employment relationship. Options below note where this cuts either way.

## Option A — Driver-sourced insurance requirement, StreetPlate takes no direct liability

Drivers must confirm, before activation, that they hold vehicle insurance
covering commercial/delivery ("hire or reward") use, and must be able to
produce proof on request. StreetPlate accepts no liability for third-party
injury, property damage, or driver injury during a delivery — that risk and
its insurance sit entirely with the driver as an independent contractor.

- **Pros:** cleanest separation of responsibility; no direct cost to
  StreetPlate; reinforces independent-contractor status by minimising
  StreetPlate's operational control over driver safety/insurance outcomes.
- **Cons:** many drivers may not have, or be able to afford, commercial-use
  cover — leaving real gaps if an incident happens. Reputational and
  potential legal exposure if a driver or injured third party is left
  unprotected and it becomes public. Requiring proof of insurance as a
  condition of activation is itself a form of control, which slightly cuts
  against the "hands-off contractor" framing this option is meant to support.

## Option B — StreetPlate-provided supplementary third-party/contingent liability cover

StreetPlate takes out a contingent liability policy that responds
specifically during "active delivery" windows (order acceptance to
drop-off), covering third-party injury/property damage and, potentially,
personal accident cover for the driver — topping up or bridging gaps in the
driver's own policy. This is the model used by several larger delivery
platforms operating in South Africa.

- **Pros:** real protection for both third parties and drivers; materially
  lower reputational and legal exposure for StreetPlate; a known, insurable
  product category (an SA broker can quote this).
- **Cons:** recurring cost to the business, scaling with delivery volume;
  needs an insurance broker experienced in gig-economy delivery risk to
  source and underwrite. Taking on more responsibility for driver safety is
  also a factor courts may weigh toward employee-like status — though
  arguably a more defensible one, since it's protective rather than
  operationally controlling.

## Option C — Hybrid: driver self-insurance required + limited StreetPlate gap cover

Drivers are still required to hold and warrant appropriate personal or
commercial insurance as a baseline (as in Option A). StreetPlate
additionally carries a limited contingent policy that only activates as a
gap-filler — for example, if the driver's own insurer denies a claim due to
the commercial-use exclusion, or above a defined claim threshold — rather
than being primary cover.

- **Pros:** balances cost against real protection; keeps primary
  responsibility with the driver (supporting contractor status) while
  giving a genuine backstop when the driver's own cover fails.
- **Cons:** more complex to draft and administer; drivers may misunderstand
  what is and isn't covered without very clear communication; still needs
  careful legal and insurance-broker drafting to define precisely when the
  gap cover triggers.

## What the final clause needs to specify, whichever option is chosen

- What is covered, and what is explicitly excluded.
- What the driver must do: proof of insurance (if required), incident
  reporting timeline and process.
- An explicit statement that the arrangement does not itself create an
  employment relationship (to sit consistently with the rest of the driver
  terms).
- Sign-off from both a qualified South African lawyer and, ideally, an
  insurance broker who can confirm the chosen option is actually available
  and priced in the current SA market — this document only frames the
  decision, it doesn't source or price a policy.
