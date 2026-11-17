// SAMPLE late-stage new-logo deals for Sam (approved as sample data for the game-mode exploration; not from HubSpot).
// They're sized to the real gap: New ARR is $140K behind pace (Company health), and Fello's new-logo average is $25.0K.
// Six can still land in October and together they're $143K, so every one of them matters. Oakline and Keystone are
// November deals: Oakline is the biggest on the board and can be pulled in, but only by spending moves the six need.
export const SAMPLE = true;
export const STAGES = ["Proposal", "Pricing", "Contract out", "Signed"];
export const DAYS = ["Tue Oct 28", "Wed Oct 29", "Thu Oct 30", "Fri Oct 31"];
export const GOAL = 140; // $K, New ARR's gap to pace

// threat kinds: what happens if nobody deals with it, and who can
// slip: how the deal's downside reads on its forecast (what happens if this threat isn't cleared)
export const THREATS = {
  quiet: { t: "Going quiet", slip: "If they stay quiet", fx: "cold", say: "No reply in 6 days. Goes cold, out of October.", by: ["orin", "sam"] },
  signoff: { t: "Needs exec sign-off", slip: "If their CEO doesn’t sign off", fx: "cold", say: "Their CEO hasn’t signed off. Slips to November.", by: ["riley", "sam"] },
  security: { t: "Security review", slip: "If the security review drags", fx: "back", say: "Legal wants our security docs. Restarts the contract.", by: ["fia", "sam"] },
  sponsor: { t: "No sponsor", slip: "If no one new takes it on", fx: "block", say: "Their champion left. Can’t move until someone new owns it.", by: ["calvin", "sam"] },
  procure: { t: "Procurement", slip: "If the vendor packet stalls", fx: "block", say: "Needs a vendor packet before it can sign.", by: ["fia", "sam"] },
};

// due: the day (0-3) it fires at the end of; from: the day it shows up
export const DEALS = [
  { id: "harbor", n: "Harbor & Pine Realty", city: "San Diego", agents: 38, arr: 32, stage: 2, close: "Oct 30", src: "Inbound", champ: ["Dana Ruiz", "Director of Operations"], touch: "Yesterday", threats: [] },
  { id: "summit", n: "Summit Ridge Group", city: "Denver", agents: 52, arr: 28, stage: 1, close: "Oct 31", src: "Outbound", champ: ["Marcus Lee", "Managing Broker"], touch: "6 days ago", threats: [{ k: "quiet", due: 0, from: 0 }] },
  { id: "coast", n: "Coastline Brokers", city: "Tampa", agents: 30, arr: 24, stage: 2, close: "Oct 30", src: "Inbound", champ: ["Priya Shah", "COO"], touch: "2 days ago", threats: [{ k: "security", due: 1, from: 1 }] },
  { id: "meridian", n: "Meridian Home Team", city: "Austin", agents: 18, arr: 18, stage: 1, close: "Oct 31", src: "Webinar", champ: ["(left Oct 21)", "was Team Lead"], touch: "4 days ago", threats: [{ k: "sponsor", due: null, from: 0 }] },
  { id: "bayview", n: "Bayview Partners", city: "Seattle", agents: 24, arr: 22, stage: 2, close: "Oct 30", src: "Outbound", champ: ["Tom Okafor", "VP Sales"], touch: "Yesterday", threats: [{ k: "signoff", due: 1, from: 0 }] },
  { id: "redwood", n: "Redwood Collective", city: "Portland", agents: 15, arr: 19, stage: 2, close: "Oct 28", src: "Referral", champ: ["Jess Park", "Broker-Owner"], touch: "Today", threats: [] },
  { id: "oakline", n: "Oakline Properties", city: "Phoenix", agents: 64, arr: 41, stage: 0, close: "Nov 14", src: "Inbound", champ: ["Ray Molina", "President"], touch: "3 days ago", threats: [{ k: "procure", due: null, from: 0 }] },
  { id: "keystone", n: "Keystone Living", city: "Charlotte", agents: 27, arr: 26, stage: 0, close: "Nov 7", src: "Outbound", champ: ["Alicia Grant", "Director of Growth"], touch: "5 days ago", threats: [] },
];
export const OCT = DEALS.filter((d) => /^Oct/.test(d.close));
export const sumK = (ds) => ds.reduce((a, d) => a + d.arr, 0);

// SAMPLE: the 14 open prospects Sam left on Outbound's demo list (not from HubSpot). fit: how well they match Fello's
// best new logos (0-100); engaged: their last touch. The ranking Orin brings back orders them by both.
export const PROSPECTS = [
  { id: "p1", n: "Crescent Realty Group", agents: 44, fit: 91, engaged: "Opened pricing 2 days ago", why: "Right size, and back on the pricing page this week" },
  { id: "p2", n: "Lakeshore Home Partners", agents: 36, fit: 88, engaged: "Replied 3 days ago", why: "Asked for a second demo for their ops lead" },
  { id: "p3", n: "Pinecrest Brokers", agents: 52, fit: 84, engaged: "Webinar Oct 21", why: "Team lead joined the webinar and stayed to the end" },
  { id: "p4", n: "Northshore Living", agents: 29, fit: 82, engaged: "Clicked case study 5 days ago", why: "Same profile as Brightwater, which closed Oct 22" },
  { id: "p5", n: "Copperline Realty", agents: 41, fit: 79, engaged: "Opened email 6 days ago", why: "Good fit, but quiet for nearly a week" },
  { id: "p6", n: "Westbrook Properties", agents: 58, fit: 77, engaged: "Demo booked, no-show Oct 16", why: "Booked once already; worth a rebook" },
  { id: "p7", n: "Bluewater Home Team", agents: 22, fit: 74, engaged: "Visited site 8 days ago", why: "Smaller team, still browsing" },
  { id: "p8", n: "Granite Peak Realty", agents: 33, fit: 71, engaged: "Opened email 10 days ago", why: "Fit is fine; interest is cooling" },
  { id: "p9", n: "Silverleaf Group", agents: 18, fit: 66, engaged: "Replied Oct 9", why: "Said to check back after their busy season" },
  { id: "p10", n: "Harborview Agents", agents: 26, fit: 63, engaged: "No reply since Oct 2", why: "Three touches, no reply" },
  { id: "p11", n: "Summit & Vale", agents: 61, fit: 58, engaged: "Opened email 2 weeks ago", why: "Big team, but on a competitor’s contract to March" },
  { id: "p12", n: "Oakmont Realty", agents: 14, fit: 52, engaged: "No reply since Sep 28", why: "Under our usual team size" },
  { id: "p13", n: "Riverside Collective", agents: 12, fit: 47, engaged: "Bounced Oct 12", why: "Contact left; needs a new name first" },
  { id: "p14", n: "Maple & Main Homes", agents: 9, fit: 41, engaged: "No reply since Sep 20", why: "Too small for now" },
];
