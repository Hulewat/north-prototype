// What each seat sees on the Team prototypes. Every figure is the prototype's own (agents-concept.jsx, App.jsx, chat.jsx).
// ---------------------------------------------------------------- what each seat sees
export const SEATS = {
  beyonce: {
    n: "Beyonce", role: "Leadership", middle: "Your people",
    north: "Three things need you, all quick. Orin wants a yes on moving Sam back to Outbound: Outbound is $443.6K behind pace, and the move closes most of it. Felix drafted QBR invites for Jordan’s 4 quiet renewals. Everything else is moving. Orin is ranking at-risk accounts, and Brightline goes first: it renews Nov 14 and just cut seats.",
    voice: {
      fia: ["Webinar leads no-show twice as often. Digging into when they booked.", "Writing the Monday sync doc. Won’t take long.", "Outbound drop-offs are mostly reschedules that never got rebooked."],
      orin: ["Brightline renews Nov 14 and just cut seats. It goes first.", "Running each lever on its own first, so you can see what each is worth."],
      felix: ["Teams with a Felix champion hit 10 handoffs a week sooner. Checking it holds for small teams before anyone quotes it.", "Usage dipped on weekends after the Oct 20 release. Finding which screens."],
    },
    desk: {
      fia: { catch: "Two done, three going. Inbound’s fine on pipeline. It’s the demos that don’t happen, so that’s where I am.",
        on: ["Find why booked demos don’t happen", "Write the Monday sync doc", "Find where Outbound demos drop off"],
        done: [["Sum up Inbound’s October", "9:12", "Inbound booked $1.31M against a $1.03M pace, 128% of it."], ["Check Inbound’s pipeline against pace", "8:40", "$0.75M ahead, so pipeline isn’t what’s holding Inbound back."]] },
      orin: { catch: "Two done. GRR is holding. The risk is ahead of us, not behind: $1.98M of ARR is marked at risk.",
        on: ["Forecast the year with all three levers", "Rank at-risk accounts by who to call first"],
        done: [["Explain what’s holding GRR", "9:30", "GRR is 97.7%, just above its 97.07% pace."], ["Check downgrades and churn", "8:55", "$773K lost this month, $227K under its $1.00M pace."]] },
      felix: { catch: "Felix health is 70 against a 78 target. Handoffs are on pace, so people are using it. The gap is somewhere else, and I’m finding where.",
        on: ["Find where new accounts stall", "Find what slows the first 10 handoffs", "Find why daily active users are below target"],
        done: [["Check Felix’s health score", "9:05", "Handoffs per 1K are on pace at 9.61, so use isn’t the gap."], ["Write the weekly Fello health read", "8:30", "Fello health is 68 against a 73 target."]] },
    },
    threads: [
      { id: "sam", who: "Sam", sub: "New Business", st: "3 calls waiting on him", ags: ["fia", "orin"],
        more: ["His 11 lost-demo follow-ups", "His demo list", "Ranking his late-stage deals", "New ARR at 92% of goal · New logos at 75%"] },
      { id: "caleb", who: "Caleb", sub: "Outbound", st: "23% of pace", warn: true, ags: ["fia", "orin"],
        more: ["Demos held fell from 26 to 11 after Oct 14, when two SDRs moved to inbound coverage."] },
      { id: "heather", who: "Heather", sub: "Expansion", st: "72% of goal", ags: ["fia", "orin"],
        more: ["The top 10 open expansion deals cover most of the gap. Six haven’t had an exec touch this quarter."] },
      { id: "jordan", who: "Jordan", sub: "Renewals", st: "4 renewals gone quiet", ags: ["felix"],
        more: ["11 of the 29 renewals in his book have been touched. Felix drafted QBR invites for the 4 quiet ones."] },
    ],
    hand: [
      { id: "orin-out", job: "Track bookings with Sam back on Outbound", ag: "orin", t: "Outbound is $443.6K behind pace. Moving Sam back closes most of it.", rec: "Move Sam back to Outbound for the last two weeks of the month. He booked $7.5K a day there before Oct 14.", act: "Approve the move",
        reply: "Done. Sam’s back on Outbound for the last two weeks. I’ll tell you how bookings move.", thread: ["caleb", "Sam moving back · Orin’s tracking bookings"] },
      { id: "felix-smb", job: "Watch for replies to the QBR invites", ag: "felix", t: "4 SMB renewals due by Dec 31 have gone quiet for 60 days.", rec: "I drafted QBR invites for the four. They go out from Jordan once you approve.", act: "Send the invites",
        reply: "Sent. The invites go out from Jordan. I’ll tell you who replies.", thread: ["jordan", "Invites sent · Felix is watching for replies"] },
      { id: "fia-prop", job: "Rank Sam’s demo list", ag: "fia", t: "Start on Sam’s demo list now?", rec: "Outbound is the biggest gap on the board and has the least work on it. Sam’s demo list is queued next.", act: "Start it",
        reply: "On it. Ranking Sam’s demo list now.", thread: ["sam", "Fia’s ranking his demo list"] },
    ],
  },
  sam: {
    n: "Sam", role: "New Business", middle: "Your outreach",
    north: "Your 11 follow-ups are drafted and waiting on you. New ARR is $140K behind pace and nothing’s working on it yet, so Orin wants to rank your late-stage deals. Your demo list still has 14 open prospects. Fia can start ranking it whenever you say.",
    voice: {
      fia: ["Your 11 follow-ups are drafted, one per lost demo. Yours to send.", "Lost deals cluster after the first call. Reading the notes for why."],
      orin: ["Nothing running for you. That’s the problem: New ARR is $140K behind pace."],
      felix: ["Nothing of yours on my desk. I’m with new accounts and renewals this week."],
    },
    desk: {
      fia: { catch: "Two things for you. The follow-ups are ready, and your demo list is next in line whenever you want it.",
        on: ["Find why held demos aren’t closing"],
        done: [["Review the last 20 lost demos", "", "14 of the last 20 were booked by outbound after Oct 14, and 11 had no follow-up within two days."]] },
      orin: { catch: "Nothing of yours on my desk yet. New ARR is $140K behind pace, the biggest gap in New Business. I’d rank your late-stage deals by close date. Your call.", on: [], done: [] },
      felix: { catch: "Nothing of yours on my desk. I’m with new accounts and renewals this week. Shout if a customer of yours goes quiet.", on: [], done: [] },
    },
    threads: [
      { id: "follow", who: "Lost-demo follow-ups", st: "11 drafted · waiting on you", ags: ["fia"],
        more: ["14 of the last 20 lost demos were booked by outbound after Oct 14, and 11 had no follow-up within two days."] },
      { id: "list", who: "Your demo list", st: "14 open prospects · ranking queued", ags: ["fia"],
        more: ["Fia scores them on fit and how recently they engaged, strongest first."] },
      { id: "late", who: "Late-stage new-logo deals", st: "Nothing on it yet", warn: true, ags: [],
        more: ["New ARR is $140K behind pace, the biggest gap in New Business."] },
      { id: "won", who: "Closed in October", st: "2 new logos", win: true, ags: [],
        more: ["Brightwater Realty · $24.0K · Oct 22", "Northgate Homes · $16.2K · Oct 11"] },
    ],
    hand: [
      { id: "sam-follow", job: "Watch for replies to your 11 follow-ups", ag: "fia", t: "11 lost demos never got a follow-up. Send the drafts?", rec: "I drafted one for each. They go out from you once you say so.", act: "Send them",
        reply: "Sent. All 11 went out from you. I’ll tell you who replies.", thread: ["follow", "11 sent · Fia’s watching for replies"] },
      { id: "sam-arr", job: "Rank your late-stage deals by close date", ag: "orin", t: "Nothing’s working on New ARR. Rank your late-stage deals?", rec: "It’s $140K behind pace, the biggest gap in New Business. Ranked by close date, you’ll know which to push first.", act: "Start it",
        reply: "Started. Ranking your late-stage deals by close date.", thread: ["late", "Orin’s ranking them by close date"], add: "orin" },
      { id: "sam-list", job: "Rank your demo list", ag: "fia", t: "Start on your demo list now?", rec: "14 open prospects, and ranking it is next in my queue.", act: "Start it",
        reply: "On it. Ranking your demo list now.", thread: ["list", "Fia’s ranking it now"] },
    ],
  },
};
export const ASKED = { fia: "On it. Back in a bit.", orin: "Noted. You’ll get numbers, not adjectives.", felix: "Happy to. I’ll check it against the customer side first." };

