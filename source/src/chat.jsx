// North chat — one place every question goes.
// Opens in the middle over a blurred page (⌘K, the sidebar, any "Ask North" button), or by just starting to type,
// or by holding Space to talk. Drag it to a side and it docks as a column the page makes room for; hide it and it folds into a pill.
// Highlight anything on a page and a small "Ask North" chip offers to take it with you.
// Answers stream in, then a chart card from the Orin chart set (Figma 733:325166) builds itself, with an action tray
// and copy / export / share underneath.
import { Stack } from "./stack.jsx";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform, animate, useIsPresent, usePresence } from "motion/react";
import { C, clamp, stag, win, toMotion, useReplay, useSpringTo, prefersReduced } from "./lib.js";
import { PinIcon, useActions, isStaple, canon, tileOf } from "./actions.jsx";
import { BookedTicks, WinRings, LogosArea, DemoRuler, ExpansionLines, TtvLollipop } from "./visuals.jsx";
import { NorthLogo } from "./marks.jsx";
import { ArrChart, LANES, OWNERS, DESC, status as laneStatus } from "./health.jsx";
import { GcHandoff, GcPreview, GcIcon, suggestFor, namesIn, applyCommand, summaryOf, caretXY } from "./gchat.jsx";
import { HomeWork } from "./home-work.jsx";
import { getWho, useWho, seatOf } from "./seat.js";
import { PEOPLE, peopleIn, titleOf, talk } from "./team-talk.js";
import { PHOTOS } from "./photos.js";
import { FileCard, openFile, showFile } from "./files.jsx";
import { ROOM_OF_THREAD, ROOMS, dealIn, liveTake, takeOf, nextOf, jobFor } from "./account.jsx";
import { THREATS as DEAL_THREATS } from "./deals.js";
import { runCommand, voice as voiceBus, VOICE_DEMO, bodyFor, demoFor } from "./voice.jsx";
import { onIntent } from "./voice-intents.js";
// arranging your Home is a command like any other: said or typed anywhere, it happens and the bar says what it did
onIntent((n, raw) => (typeof window !== "undefined" && window.__northHomeCmd ? window.__northHomeCmd(raw) : null));
import { RoutineCard, proposeDeckReview, proposeMondaySync } from "./routines.jsx";
import { AGENTS, AGENT_IDS, CORE_IDS, takesFor, agentsIn, huddleFor, Huddle, AgentMsg, JobPeek, RowHover, AgentSuggest, AgentMark, AgentJoin, OrbStack, OrbDefs, Orb } from "./agents.jsx";
// what an agent says when it's tagged into a conversation: it took it, and where the answer will land (never a result it hasn't got)
const AG_ACK = { riley: "On it. I’ll pull it from HubSpot and post it here.", orin: "On it. I’ll look into it and post what I find here.", calvin: "On it. I’ll check the customer side and post it here.",
  marco: "On it. I’ll make it and post it here.", fia: "On it. I’ll draft it and post it here for review." };
const andList = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

const REDUCED = prefersReduced();
const NAVY = "#093555", CORAL = "#ff725c", PURPLE = "#6d4fc2", TEAL = "#098486";
if (typeof window !== "undefined") { const sd = () => document.documentElement.classList.toggle("show-demos", /demos/.test(location.hash)); sd(); addEventListener("hashchange", sd); }
const isTyping = (el) => !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) && (!el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true }));

// small talk in a group chat: each of the crew answers in character (Orin deadpan, Calvin flashy, Riley impatient, Marco the
// artist, Fia zen). The business matcher still wins whenever the ask names the business
const OFF_RX = /dinner|lunch|breakfast|\beat\b|food|hungry|order (food|in|out|tonight|dinner|lunch|something)|should (i|we) order|takeout|take-out|pizza|sushi|tacos?|coffee|drinks?\b|weather|movie|film|to watch|tv show|\bgame\b|joke|birthday|vacation|holiday|weekend|music|song|playlist|recipe|restaurant|sports?|football|basketball|how are you|how('s| is) (your|it going)/i;
const BIZ_RX = /arr|revenue|pipeline|outbound|inbound|deal|logo|nrr|grr|churn|renew|win rate|demo|plan\b|forecast|target|gap|behind|account|customer|expansion|sales|lane|quota|hir(e|ing)|budget|cost|margin|board|metric|number|chart|q4|sdr|lever|pace|goal|campaign|webinar|definition/i;
const CHIT = {
  food: { orin: "Ramen. Extra egg. Don’t overthink it.", calvin: "Tacos. Al pastor, extra salsa. You’ll thank me.", riley: "Whatever gets there fastest. Thai, if they’re under 30 minutes.", marco: "Whichever place has the best-looking menu. Probably the Thai spot with the hand-drawn one.", fia: "Something warm. A big bowl of pho. I’ve got my juice box covered." },
  watch: { orin: "Something with subtitles.", calvin: "Anything with a heist in it.", riley: "Under 90 minutes or I’m out.", marco: "Anything shot on film. The colour’s better.", fia: "A nature doc. Let it wash over you." },
  weekend: { orin: "Nothing. On purpose.", calvin: "Somewhere with a rooftop.", riley: "Sleep, then errands. In that order.", marco: "Gallery hop, then pizza.", fia: "A long walk. No phone." },
  hi: { orin: "Fine. Busy. Good busy.", calvin: "Living the dream.", riley: "Busy. What do you need?", marco: "Covered in paint, so good.", fia: "Calm. You?" },
  any: { orin: "Not my lane, but I’d say yes.", calvin: "Say less. Do the fun one.", riley: "Pick one and move on.", marco: "Go with the one that looks better.", fia: "Breathe first, then decide." },
};
const CHIT_OPEN = { food: "Boss wants to know what to order tonight. Go.", watch: "Need something to watch tonight. Ideas?", weekend: "Weekend plans, quick.", hi: "Check-in from the boss. How's everyone?" };
const CHIT_PICK = { food: { orin: "ramen", calvin: "tacos", riley: "Thai", marco: "Thai", fia: "pho" }, watch: { orin: "something with subtitles", calvin: "a heist movie", riley: "anything under 90 minutes", marco: "something shot on film", fia: "a nature doc" },
  weekend: { orin: "doing nothing", calvin: "a rooftop", riley: "sleep then errands", marco: "a gallery hop", fia: "a long walk" } };
const CHIT_WHY = { food: { orin: "It travels well.", calvin: "Nobody’s ever sad about tacos.", riley: "It’s the fastest.", marco: "Best menu, best food.", fia: "Warm and easy." },
  watch: { orin: "Trust me.", calvin: "Everyone likes a heist.", riley: "You’ll be in bed on time.", marco: "It’ll look great.", fia: "You’ll actually relax." },
  weekend: { orin: "You’ve earned it.", calvin: "Good views fix everything.", riley: "Then you’re free Sunday.", marco: "Then pizza.", fia: "Leave the phone." } };
const chitKind = (s) => /dinner|lunch|breakfast|\beat\b|food|hungry|order|takeout|take-out|pizza|sushi|tacos?|coffee|drinks?\b|recipe|restaurant/i.test(s) ? "food" : /movie|film|watch|tv show/i.test(s) ? "watch" : /weekend|vacation|holiday/i.test(s) ? "weekend" : /how are you|how('s| is) (your|it going)/i.test(s) ? "hi" : "any";

// ------------------------------------------------------------------ answers (prototype data, same numbers as the pages)
// Felix ARR added in October, on the designed line chart: added this month against the straight pace to what October needs ($1.51M)
const FELIX_PACE = { kind: "viz", viz: "lines", title: "Felix ARR · October", sub: "Added this month against the pace to the $13.06M target · Dustin and Rick",
  lines: { book: [[1, 0], [8, 0.27], [9, 0.48], [16, 0.75], [17, 0.92], [24, 1.17], [29, 1.346], [30, 1.44]], goal: [[1, 0], [31, 1.51]], max: 1.6, ticks: [0, 0.5, 1, 1.5], today: 30,
    big: [1.44, "M", 2, "added"], sub: [1.46, "M", 2, "pace by now"], target: "$1.51M to target", rowsK: ["Added", "Pace"], label: "Felix ARR added in October against pace" } };
const ANSWERS = {
  outbound: {
    topic: "Outbound behind pace",
    steps: ["Reading HubSpot · Outbound lane", "Comparing October to pace", "Finding what moved it"],
    text: "Outbound has booked $130.2K against a $573.8K pace — 23%. Two things did it: demos held dropped after Oct 14, when two SDRs moved to inbound coverage, and the deals that did close came in 40% smaller than September.",
    card: { beside: ["Company health", "health"], pin: "chat:outbound", kind: "trend", title: "Booked ARR · Outbound", sub: "Down since two SDRs moved to inbound on Oct 14.", big: "$130.2K", chip: ["down", "77% under pace"],
      more: {
        stats: [["Booked before Oct 14", "$98.1K", "$7.5K a day"], ["Booked since", "$32.1K", "$2.5K a day"], ["Demos held since", "11", "down from 26"], ["Needed per day to hit pace", "$110.9K", "4 days left"]],
        cols: ["Deal", "Closed", "Type", "ARR", "Rep"],
        rows: [["Brightwater Realty", "Oct 22", "New logo", "$24.0K", "Sam"], ["Copper & Pine", "Oct 18", "Reactivated", "$18.4K", "Leo"], ["Northgate Homes", "Oct 11", "New logo", "$16.2K", "Sam"], ["Harbor Lane", "Oct 9", "Partner intro", "$12.9K", "Ava"], ["Summit Key", "Oct 3", "New logo", "$11.6K", "Leo"]],
        note: "HubSpot · Outbound lane · October to date. Pace is the straight line to the $664.5K October target." },
      mark: { at: 13, label: "Oct 14 · 2 SDRs moved" },
      series: [22, 25, 21, 28, 24, 27, 30, 26, 29, 31, 28, 33, 30, 27, 14, 11, 12, 9, 13, 10, 8, 11, 9, 12, 10, 8, 9],
      rowsTitle: "What closed", rows: [["New logos", 0.58, "58%"], ["Reactivated", 0.27, "27%"], ["Partner intros", 0.15, "15%"]],
      tray: { title: "Put Outbound on Monday's agenda", sub: "North drafts the note for Caleb", button: "Draft the note", q: "Draft the Monday note for Caleb" } },
    follow: ["Who's furthest behind?", "Compare to September", "What would close the gap?"],
  },
  year: {
    topic: "Path to $40M",
    steps: ["Projecting Nov and Dec at October's rate", "Measuring the gap to the $40.03M plan", "Testing which lanes can close it"],
    text: "At October's net new rate we land at $38.94M — 97% of plan, $1.09M short. Getting Outbound back to pace closes most of it; Expansion win rate gets the rest.",
    card: { beside: ["Home", "home"], pin: "chat:year", kind: "ticks", title: "Path to $40M", sub: "Short of the $40.03M plan at October's rate. Three levers close it.", big: "$1.09M", chip: ["up", "$3.3M closed since May"],
      more: {
        stats: [["Projected Dec 31", "$38.94M", "at October's rate"], ["Plan", "$40.03M", "Dec 31 ending ARR"], ["Gap in May", "$4.39M", "$3.3M closed since"], ["Weeks left", "9", "to Dec 31"]],
        cols: ["Lever", "Owner", "Adds", "Needs", "Confidence"],
        rows: [["Outbound back to pace", "Caleb", "+$680K", "One SDR back on outbound", "High"], ["Expansion win rate to 45%", "Heather", "+$300K", "Exec sponsor on the top 10", "Medium"], ["New logos on pace", "Sam", "+$160K", "Hold demo volume", "High"]],
        note: "Projection holds churn and downgrades at their 90-day average." },
      fill: 1, rows: [["Outbound back to pace", 0.62, "$680K"], ["Expansion win rate to 45%", 0.28, "$300K"], ["New logos on pace", 0.1, "$160K"]],
      tray: { title: "Run it as a scenario", sub: "Model the three changes together", button: "Run scenario", q: "Run the scenario with all three changes" } },
    follow: ["What if Outbound stays flat?", "Show it by month", "Who owns each lever?"],
  },
  lanes: {
    topic: "Where Sales is behind",
    steps: ["Scoring every lane against pace", "Grouping by department", "Ranking the misses"],
    text: "Four of seven lanes are behind and three of them are in Sales. Outbound is the one pulling hardest; New Business is close enough that one good week fixes it.",
    card: { beside: ["Company health", "health"], pin: "chat:lanes", kind: "radial", title: "Where Sales' $864K gap sits", sub: "79% of the $1.09M we'd miss by year-end. Outbound is half of it.",
      parts: [["Outbound", 443.6, CORAL, "Caleb"], ["Expansion", 280, PURPLE, "Heather"], ["New Business", 140, TEAL, "Sam"]], whole: 1090, wholeLabel: "the $1.09M year-end miss", rest: ["Other lanes", "Inbound, Value Delivery, Product"],
      more: {
        stats: [["Sales' share of the miss", "79%", "$864K of $1.09M"], ["Lanes behind", "3 of 3", "all of Sales"], ["Closest to pace", "New Business", "one good week away"], ["Days left in October", "4", "pace needs $216K a day"]],
        cols: ["Lane", "Owner", "Booked", "Pace", "Gap", "Since Sept"],
        rows: [["Outbound", "Caleb", "$130.2K", "$573.8K", "−$443.6K", "↘ 61%"], ["Expansion", "Heather", "$734.0K", "$1.01M", "−$280.0K", "↘ 12%"], ["New Business", "Sam", "$1.52M", "$1.66M", "−$140.0K", "↗ 4%"]],
        note: "Gaps are October to date against the pace line, Sales lanes only. Year-end miss assumes November and December run at October's rate." },
      tray: { title: "Add the three to Monday sync", sub: "Each with its owner and the gap", button: "Add to sync", q: "Add the three Sales lanes to Monday sync" } },
    follow: ["Why is Outbound behind?", "What's working in Inbound?", "Path to $40M"],
  },
  nrr: {
    topic: "NRR dip in SMB",
    steps: ["Reopening the SMB renewals thread", "Checking Jordan's book through Dec 31", "Matching renewals to last touch"],
    text: "Picking this back up: Jordan has 29 SMB renewals due by Dec 31. 11 have been touched this month, 6 have a QBR booked, and 4 haven't had any contact in 60 days. Those 4 look like the three that churned in September.",
    card: { pin: "chat:nrr", kind: "ticks", title: "SMB renewals due by Dec 31", sub: "Jordan's book · touched, booked, and gone quiet.", big: "38%", chip: ["down", "4 quiet for 60 days"],
      more: {
        stats: [["Renewals due", "29", "by Dec 31"], ["ARR up for renewal", "$612K", "Jordan's SMB book"], ["Quiet for 60 days", "4", "$160K ARR"], ["QBRs booked", "6", "of 29"]],
        cols: ["Account", "Renews", "ARR", "Last touch", "Signal"],
        rows: [["Brightline", "Nov 14", "$46K", "71 days ago", "Seats down 12%"], ["Copperleaf", "Nov 30", "$41K", "64 days ago", "No logins in 3 weeks"], ["Hartwell", "Dec 9", "$38K", "62 days ago", "—"], ["Ostara", "Dec 22", "$35K", "60 days ago", "Champion left"]],
        note: "Renewals in Jordan's SMB book with no logged call, email or meeting in the last 60 days." },
      fill: 0.38, rows: [["Touched this month", 0.52, "11"], ["QBR booked", 0.29, "6"], ["No touch in 60 days", 0.19, "4"]],
      tray: { title: "Book QBRs for the quiet four", sub: "North drafts the invites from Jordan", button: "Draft invites", q: "Draft the QBR invites for the four quiet accounts" } },
    follow: ["Which four?", "Compare to mid-market", "Who else has quiet renewals?"],
  },
  arr: {
    topic: "Total ARR trend",
    steps: ["Reading ending ARR by month", "Projecting Nov and Dec at October's rate", "Measuring against the $40.03M plan"],
    text: "Ending ARR is $35.75M, up $1.60M on September, second only to September's +$2.09M. At October's net new rate, November and December land the year at $38.94M, $1.09M short of plan.",
    card: { kind: "viz", viz: "arr", beside: ["Company health", "health"], title: "ARR movement", sub: "Ending ARR by month, with Nov and Dec projected at October's rate.",
      more: { stats: [["Ending ARR · Oct", "$35.75M", "89% of plan"], ["Added · Oct", "$1.60M", "Sep added $2.09M"], ["Projected Dec 31", "$38.94M", "at October's rate"], ["Plan", "$40.03M", "$1.09M short"]],
        cols: ["Month", "Ending ARR", "Change", "vs plan path"], rows: [["Jul", "$31.30M", "+$0.70M", "−$0.6M"], ["Aug", "$32.06M", "+$0.76M", "−$0.7M"], ["Sep", "$34.15M", "+$2.09M", "−$0.4M"], ["Oct", "$35.75M", "+$1.60M", "−$0.5M"]],
        note: "Nov and Dec hold October's net new rate. Plan path is the straight line to $40.03M." },
      tray: { title: "Run it as a scenario", sub: "See what closes the $1.09M", button: "Run scenario", q: "Run the scenario with all three changes" } },
    follow: ["Path to $40M", "What moved it in September?"],
  },
  // your newest accounts: October's Outbound closes (same deals, dates, ARR and reps as the Outbound card). Where each one
  // stands and its next step are sample data, said so under the table. Click a row: that account opens in the card, with a way back.
  accounts: {
    topic: "Newest accounts",
    steps: ["Reading October's new accounts", "Checking where each one stands"],
    text: "Your five newest accounts all closed in October, $83.1K in ARR between them. Northgate Homes is the one to watch: no logins in 12 days. Click any row to open it.",
    card: { kind: "table", title: "Newest accounts", sub: "Closed in October · newest first",
      table: { cols: ["Account", "Closed", "ARR", "Rep", "Where it stands"], status: 4,
        rows: [["Brightwater Realty", "Oct 22", "$24.0K", "Sam", "Onboarding"], ["Copper & Pine", "Oct 18", "$18.4K", "Leo", "Live"], ["Northgate Homes", "Oct 11", "$16.2K", "Sam", "At risk"], ["Harbor Lane", "Oct 9", "$12.9K", "Ava", "Live"], ["Summit Key", "Oct 3", "$11.6K", "Leo", "Onboarding"]],
        note: "Accounts, close dates, ARR and reps are October's Outbound closes. Where each stands and its next step are sample data for this prototype." },
      detail: {
        "Brightwater Realty": { draft: "Here's a note for Sam:\n\n“Brightwater kicks off Thursday. Six of their 14 agents are in so far, all from the team lead's office, so it's worth getting the other offices invited before the call.”",  sub: "New logo · closed Oct 22 by Sam", stats: [["ARR", "$24.0K", "new logo"], ["Where it stands", "Onboarding", "kickoff booked"], ["Agents live", "6 of 14", "logged in so far"], ["Next step", "Kickoff", "Thursday"]],
          note: "Kickoff is Thursday. Six of their 14 agents have logged in, all from the team lead's office.",
          tray: { title: "Prep Sam for Thursday's kickoff", sub: "North drafts the note for Sam", button: "Draft the note", q: "Draft a kickoff prep note for Sam on Brightwater Realty" } },
        "Copper & Pine": { draft: "Here's an invite for Leo to send:\n\n“Quick check-in on Nov 18? Eleven of your 12 agents are using it every week, and we'd love to hear what's working and what you want next.”",  sub: "Reactivated · closed Oct 18 by Leo", stats: [["ARR", "$18.4K", "reactivated"], ["Where it stands", "Live", "using it weekly"], ["Agents live", "11 of 12", "this week"], ["Next step", "Check-in", "Nov 18"]],
          note: "Back and active. Eleven of their 12 agents used it this week, more than before they left.",
          tray: { title: "Book the Nov 18 check-in", sub: "North drafts the invite for Leo", button: "Draft the invite", q: "Draft a check-in invite for Copper & Pine" } },
        "Northgate Homes": { draft: "Here's a note for Sam:\n\n“Northgate Homes has had no logins in 12 days, down to 2 of 9 agents. Their ops lead left and onboarding stalled. Can you book a check-in with their leadership this week?”",  sub: "New logo · closed Oct 11 by Sam", stats: [["ARR", "$16.2K", "new logo"], ["Where it stands", "At risk", "no logins in 12 days"], ["Agents live", "2 of 9", "down from 7"], ["Next step", "Check-in", "with leadership, this week"]],
          note: "A fast start, then nothing for 12 days. Usage fell when their ops lead left; nobody has picked up onboarding since.",
          tray: { title: "Book an exec check-in", sub: "North drafts the note for Sam", button: "Draft the note", q: "Draft an exec check-in note for Northgate Homes" } },
        "Harbor Lane": { draft: "Here's a brief for Ava:\n\n“Harbor Lane is fully live, 8 of 8 agents this week. Their partner wants a review on Nov 12 to talk about two more teams, so go in with this month's usage and a quote for the two teams.”",  sub: "Partner intro · closed Oct 9 by Ava", stats: [["ARR", "$12.9K", "partner intro"], ["Where it stands", "Live", "on track"], ["Agents live", "8 of 8", "this week"], ["Next step", "Review", "with the partner, Nov 12"]],
          note: "Everyone's in. The partner who introduced them wants a review on Nov 12 to talk about two more teams.",
          tray: { title: "Prep the partner review", sub: "North drafts the brief for Ava", button: "Draft the brief", q: "Draft a partner review brief for Harbor Lane" } },
        "Summit Key": { draft: "Watching it. When Summit Key's CRM import lands tomorrow, I'll tell Leo here.",  sub: "New logo · closed Oct 3 by Leo", stats: [["ARR", "$11.6K", "new logo"], ["Where it stands", "Onboarding", "CRM import pending"], ["Agents live", "3 of 10", "waiting on import"], ["Next step", "Import", "their CRM, tomorrow"]],
          note: "Still onboarding a month in. Their CRM import is the blocker and it's queued for tomorrow.",
          tray: { title: "Tell Leo when the import lands", sub: "North watches it and pings Leo", button: "Watch it", q: "Watch the Summit Key CRM import" } } },
      tray: { title: "Put Northgate Homes on Monday's agenda", sub: "North drafts the note for Sam", button: "Draft the note", q: "Draft an exec check-in note for Northgate Homes" } },
    follow: ["Draft a check-in for Northgate Homes", "Show ARR by month"],
  },
  winrate: {
    topic: "Expansion win rate",
    steps: ["Reading closed expansion deals since Jul 1", "Comparing to the 60% goal"],
    text: "Expansion deals close at 31.9% — about half the 60% goal. Most of the losses are on deals over $50K, where there's no exec sponsor on our side.",
    card: { kind: "viz", viz: "winrate", title: "Expansion win rate", sub: "Share of expansion deals that close as won.",
      more: { stats: [["Win rate", "31.9%", "goal 60%"], ["Deals closed", "47", "15 won · 32 lost"], ["Over $50K", "18%", "won without a sponsor"], ["Under $50K", "44%", "won"]],
        cols: ["Segment", "Deals", "Won", "Win rate"], rows: [["Over $50K", "17", "3", "18%"], ["$20–50K", "14", "6", "43%"], ["Under $20K", "16", "6", "38%"]],
        note: "Expansion opportunities closed won or lost since Jul 1." },
      tray: { title: "Put an exec sponsor on the top 10", sub: "North drafts the list for Heather", button: "Draft the list", q: "Draft the exec sponsor list for Heather" } },
    follow: ["What would 45% be worth?", "Who owns the top 10?"],
  },
  logos: {
    topic: "New logos",
    steps: ["Counting closed-won new logos", "Projecting the rest of October"],
    text: "55 new logos so far this month. Pace says 73 by now; at this rate October closes at 63 against a target of 85.",
    card: { kind: "viz", viz: "logos", beside: ["Company health", "health"], title: "New logos", sub: "Closed-won new logos this month, against the pace to 85.",
      tray: { title: "Hold demo volume through Oct 31", sub: "Sam's team, 4 days left", button: "Tell Sam", q: "Draft a note to Sam about holding demo volume" } },
    follow: ["Where are they coming from?", "Compare to September"],
  },
  demo: {
    topic: "Win rate from held demos",
    steps: ["Matching held demos to outcomes", "Comparing to the 23.5% target"],
    text: "Held demos convert at 19.9%, 3.6 points under the 23.5% target. The drop is in demos booked by outbound since Oct 14.",
    card: { kind: "viz", viz: "demo", title: "Win rate from held demo", sub: "Share of held demos that turn into wins.",
      tray: { title: "Review the last 20 lost demos", sub: "North pulls the call notes", button: "Pull the notes", q: "Pull call notes for the last 20 lost demos" } },
    follow: ["Which reps convert best?", "Why is Outbound behind?"],
  },
  exp: {
    topic: "Expansion ARR",
    steps: ["Reading booked expansion ARR", "Comparing to the pace line"],
    text: "Expansion has booked $734.0K this month, $280K behind the pace to the $1.17M October target. It's been flat since the 18th.",
    card: { kind: "viz", viz: "exp", beside: ["Company health", "health"], title: "Expansion ARR", sub: "Booked against the pace to the October target, since Oct 1.",
      tray: { title: "Run the expansion pipeline review", sub: "With Heather, 30 minutes", button: "Add to sync", q: "Add expansion pipeline review to Monday sync" } },
    follow: ["What's our expansion win rate?", "Which accounts are next?"],
  },
  ttv: {
    topic: "Time to value",
    steps: ["Reading onboarding handoffs", "Averaging days to 10 handoffs"],
    text: "New customers take 20.9 days to reach 10 handoffs — 6 days longer than the 15-day goal. The slowest step is the first integration.",
    card: { kind: "viz", viz: "ttv", title: "TTV · days to 10 handoffs", sub: "Average days to reach 10 handoffs. Lower is better.",
      tray: { title: "Look at the first-integration step", sub: "North drafts it for PD", button: "Draft it", q: "Draft a note to PD about the first integration step" } },
    follow: ["Which customers are slowest?", "Compare to last quarter"],
  },
  // Brightline asked about by name: the account itself, not the SMB renewals thread it's part of
  bline: {
    topic: "Brightline renewal",
    steps: ["Opening Brightline", "Checking seats against Felix use"],
    text: "Jordan owns it. Brightline cut 12 seats this week, down to 30, before its Nov 14 renewal. All 30 that are left use Felix every week, so the cut came from seats that were never set up, not unhappy agents (Jordan's read). Jordan wants to lock the 30 in with an annual term at 20% off, past the 15% limit (sample), and that's waiting on your call on Home.",
    follow: ["What happens at 15% instead?", "Who else is quiet before renewal?", "Draft a note to Jordan"],
  },
  draft: {
    steps: ["Pulling Outbound's numbers", "Writing it the way Caleb's notes read"],
    text: "Here's a draft for Monday:\n\n“Outbound is at $130.2K of a $573.8K pace (23%). The drop started Oct 14 when Sam and Leo moved to inbound coverage. Proposal: move one of them back for the last two weeks and re-run the stalled demo list. Caleb to confirm by Tuesday.”",
    follow: ["Make it shorter", "Add the chart", "Send to #monday-sync"],
  },
  scenario: {
    steps: ["Applying all three changes", "Re-projecting Nov and Dec"],
    text: "With all three changes we finish at $40.08M — $50K over plan. Outbound back to pace is the one that matters; without it the other two leave us $630K short.",
    card: { kind: "ticks", title: "Scenario · all three levers", sub: "Projected Dec 31 ending ARR with all three changes.", big: "$40.08M", chip: ["up", "$50K over plan"],
      fill: 1, rows: [["Outbound back to pace", 0.62, "+$680K"], ["Expansion win rate to 45%", 0.28, "+$300K"], ["New logos on pace", 0.1, "+$160K"]],
      tray: { title: "Share the scenario", sub: "With Heather and Caleb", button: "Share", q: null, share: true } },
    follow: ["What if only Outbound recovers?", "Who owns each lever?"],
  },
};
// one continuous conversation: what came before today, grouped by topic
// chats hold topics. The history is one chat per past subject; everything after joins the chat you're in
const SEEDED = (w = getWho()) => (SEAT_HISTORY[w] || HISTORY).map((m) => ({ ...m, chat: m.chat || "h:" + m.topic }));
// Sam's own history: questions about his lane, answered with the same words North gives them today (New Business, the
// held-demo win rate, the Sales lanes). The latest chat moved through two subjects, so its topics rail is there from the start.
const SEAT_HISTORY = { sam: [
  { id: "s1u", role: "user", text: "Why aren’t my held demos closing?", topic: "Win rate from held demos", day: "Tuesday" },
  { id: "s1", role: "north", topic: "Win rate from held demos", answer: { steps: [], text: "Held demos convert at 19.9%, 3.6 points under the 23.5% target. The drop is in demos booked by outbound since Oct 14." } },
  { id: "s2u", chat: "h:week", role: "user", text: "How many new logos do I need by Oct 31?", topic: "New logos", day: "Yesterday" },
  { id: "s2", chat: "h:week", role: "north", topic: "New logos", answer: { steps: [], text: "55 new logos so far this month. Pace says 73 by now; at this rate October closes at 63 against a target of 85." } },
  { id: "s3u", chat: "h:week", role: "user", text: "Where is Sales behind?", topic: "Where Sales is behind", day: "Yesterday" },
  { id: "s3", chat: "h:week", role: "north", topic: "Where Sales is behind", answer: { steps: [], text: "Sales’ lanes are $864K behind October pace. Outbound is about half of it at $444K, then Expansion at $280K and New Business at $140K." } },
  // conversations with people in them (sample): Brightwater's, from when it closed, and Heather asking Sam something this morning
  { id: "t1", chat: "t-bw", role: "agent", agent: "riley", chit: true, text: "Brightwater Realty closed for $24.0K new ARR. The countersigned contract is in HubSpot.", topic: "Brightwater Realty", day: "Oct 22" },
  { id: "t2", chat: "t-bw", role: "pjoin", who: ["jordan"], topic: "Brightwater Realty", day: "Oct 22" },
  { id: "k0", chat: "t-slide", role: "person", who: "heather", text: "I’m putting together the Q4 customer slide for Thursday’s leadership review. It shows the logos New Business closed this quarter.", topic: "Q4 customer slide", day: "Yesterday" },
  { id: "k0b", chat: "t-slide", role: "user", text: "Sounds good. Pull them from HubSpot so it matches the board numbers.", topic: "Q4 customer slide", day: "Yesterday" },
  { id: "k1", chat: "t-slide", role: "person", who: "heather", asks: true, text: "Do we keep Brightwater on the Q4 customer slide now that it’s moving to Jordan? I need it by tomorrow.", topic: "Q4 customer slide", day: "Today" },
  // four people closing a deal (sample): Coastline Brokers, contract out, closing Oct 30; their legal team wants our security docs
  { id: "c1", chat: "t-coast", role: "user", text: "@Heather @Dustin @Jordan Coastline’s legal team wants our security docs before they’ll sign. Priya says it’s the last thing before Oct 30.", topic: "Closing Coastline Brokers", day: "Yesterday" },
  { id: "c2", chat: "t-coast", role: "pjoin", who: ["heather", "dustin", "jordan"], topic: "Closing Coastline Brokers", day: "Yesterday" },
  { id: "c3", chat: "t-coast", role: "person", who: "heather", text: "Let’s not lose it to paperwork. Dustin, can we get them the packet today?", topic: "Closing Coastline Brokers", day: "Yesterday" },
  { id: "c4", chat: "t-coast", role: "agent", agent: "fia", chit: true, text: "I drafted the security packet from our standard answers. Dustin has it for review.", topic: "Closing Coastline Brokers", day: "Today" },
  { id: "c5", chat: "t-coast", role: "person", who: "dustin", text: "Reviewing it now. I’ll sign off before lunch.", file: { k: "secpack", t: "Security packet · Coastline Brokers", kind: "Doc" }, topic: "Closing Coastline Brokers", day: "Today" },
  { id: "c6", chat: "t-coast", role: "person", who: "jordan", text: "Here’s the onboarding plan, so Priya sees what week one looks like once they sign.", file: { k: "coastplan", t: "Onboarding plan · Coastline Brokers", kind: "Doc" }, topic: "Closing Coastline Brokers", day: "Today" },
  { id: "c7", chat: "t-coast", role: "person", who: "heather", asks: true, text: "Sam, once Dustin signs off, can you send Priya the packet with a note?", topic: "Closing Coastline Brokers", day: "Today" },
  // four people on a webinar deck (sample): Lisa's slot, Paul's draft, Jordan's customer speakers, Riley's brokerage count
  { id: "w1", chat: "t-web", role: "person", who: "lisa", text: "We have a slot for the Q1 brokerage webinar. Paul’s drafting the deck. Sam, Jordan, I’d like you both in.", topic: "Q1 webinar for brokerages", day: "Yesterday" },
  { id: "w2", chat: "t-web", role: "person", who: "paul", text: "First draft is up. I need two customer stories for slides 4 and 5.", file: { k: "webdeck", t: "Q1 webinar for brokerages", kind: "Deck", n: 6 }, topic: "Q1 webinar for brokerages", day: "Yesterday" },
  { id: "w3", chat: "t-web", role: "person", who: "jordan", text: "Customer Value can bring two customers to speak. Brightwater could be one now that they’re onboarding.", topic: "Q1 webinar for brokerages", day: "Yesterday" },
  { id: "w4", chat: "t-web", role: "agent", agent: "riley", chit: true, text: "38 brokerages in HubSpot have more than 50 agents, and 9 of them are already customers. (Sample figures.)", topic: "Q1 webinar for brokerages", day: "Yesterday" },
  { id: "w5", chat: "t-web", role: "user", text: "Slide 3 should lead with the brokerages over 50 agents. That’s who books demos.", topic: "Q1 webinar for brokerages", day: "Yesterday" },
  { id: "w6", chat: "t-web", role: "person", who: "paul", asks: true, text: "Sam, can you look over slide 3 before Lisa sees it Thursday?", topic: "Q1 webinar for brokerages", day: "Today" },
] };
// what a seat watches: its own numbers. No change since they started watching, so nothing is news yet
const SEAT_WATCH = { sam: {
  "New logos": { on: true, since: "Yesterday", last: "Yesterday · 55 so far, pace 73",
    d: { label: "New logos", now: "55", vals: [77, 91, 63, 78, 77, 55], text: "55 so far this month against a pace of 73; at this rate October closes at 63." } },
  "Win rate from held demos": { on: true, since: "Tuesday", last: "Tuesday · 3.6 pts under target",
    d: { label: "Win rate from held demo", now: "19.9%", text: "19.9% against the 23.5% target. The drop is in demos booked by outbound since Oct 14." } } } };
// the shortcuts and hint text a seat sees: about its own numbers, each landing on an answer North has
const SEAT_SUGS = { sam: { Agents: ["What’s on my plate?", "What is Orin working on?", "How’s New Business doing?"], "Company health": ["Where is Sales behind?", "Why aren’t my held demos closing?", "How many new logos do I need by Oct 31?"],
  _: ["How many new logos do I need by Oct 31?", "Why aren’t my held demos closing?", "Where is Sales behind?"] } };
const HISTORY = [
  { id: "h1u", role: "user", text: "Why did NRR dip for small accounts?", topic: "NRR dip in SMB", day: "Last Thursday" },
  { id: "h1", role: "north", topic: "NRR dip in SMB", answer: { steps: [], text: "SMB NRR fell to 96.8% in September. Three accounts over $40K churned, all on annual plans that renewed without a QBR. Mid-market held at 104%." } },
  { id: "h2u", role: "user", text: "Who owned those renewals?", topic: "NRR dip in SMB", day: "Last Thursday" },
  { id: "h2", role: "north", topic: "NRR dip in SMB", answer: { steps: [], text: "All three sat in Jordan's book. Two had no logged touch in the 60 days before renewal." } },
  { id: "h3u", role: "user", text: "Do we have the headcount to hit Q4?", topic: "Q4 hiring plan", day: "Tuesday" },
  { id: "h3", role: "north", topic: "Q4 hiring plan", answer: { steps: [], text: "Sales is two AEs short of what the Q4 number assumes. Ramp is 90 days, so anyone hired after Nov 1 won't help this year. The gap has to come from Outbound productivity, not headcount." } },
  // one chat that moved through three subjects, so the topics rail is there from the start (the latest chat: it opens by default).
  // Every number is the prototype's own: Outbound's card, the Sales lanes and the year-end projection.
  { id: "w1u", chat: "h:week", role: "user", text: "Why is Outbound behind?", topic: "Outbound behind pace", day: "Yesterday" },
  { id: "w1", chat: "h:week", role: "north", topic: "Outbound behind pace", answer: { steps: [], text: "Outbound has booked $130.2K against a $573.8K pace, $443.6K behind. Demos held dropped after Oct 14, when two SDRs moved to inbound coverage, and the deals that did close came in 40% smaller than September." } },
  { id: "w2u", chat: "h:week", role: "user", text: "Is the rest of Sales behind too?", topic: "Where Sales is behind", day: "Yesterday" },
  { id: "w2", chat: "h:week", role: "north", topic: "Where Sales is behind", answer: { steps: [], text: "Sales' lanes are $864K behind October pace. Outbound is about half of it at $444K, then Expansion at $280K and New Business at $140K." } },
  { id: "w3u", chat: "h:week", role: "user", text: "Can we still get to $40M?", topic: "Path to $40M", day: "Yesterday" },
  { id: "w3", chat: "h:week", role: "north", topic: "Path to $40M", answer: { steps: [], text: "At October's net new rate, ending ARR lands at $38.94M, $1.09M short of the $40.03M plan. Three levers close it: Outbound back to pace (+$680K), expansion win rate to 45% (+$300K) and new logos on pace (+$160K)." } },
];
// Beyonce's conversations with people (sample): Heather waiting on the hiring plan, Jordan on Brightline's seats, and the
// Monday leadership sync, where Orin's doc goes every week. Leadership's own seat only (Jordan's seat reads leadership's
// content, and a conversation with yourself makes no sense)
SEAT_HISTORY.seth = [...HISTORY,
  { id: "lh1", chat: "t-hire", role: "person", who: "heather", text: "Q4 hiring plan is up: three AEs for New Business, one CSM for SMB, and Dustin’s two engineers for the HubSpot sync.", file: { k: "hireplan", t: "Q4 hiring plan", kind: "Doc" }, topic: "Q4 hiring plan · sign-off", day: "Yesterday" },
  { id: "lh2", chat: "t-hire", role: "pjoin", who: ["dustin"], topic: "Q4 hiring plan · sign-off", day: "Yesterday" },
  { id: "lh3", chat: "t-hire", role: "person", who: "dustin", text: "Engineering side is in. The sync is what new-logo work is waiting on, so I’d keep both roles.", topic: "Q4 hiring plan · sign-off", day: "Yesterday" },
  { id: "lh4", chat: "t-hire", role: "person", who: "heather", asks: true, text: "Can you sign off on it by Friday? Finance wants it before the board pack.", topic: "Q4 hiring plan · sign-off", day: "Today" },
  { id: "lb1", chat: "t-bline", role: "person", who: "jordan", text: "Brightline cut 12 seats this week, down to 30. Their admin says the agents who left never set up Felix. (Sample)", topic: "Brightline seats", day: "Today" },
  { id: "lb2", chat: "t-bline", role: "agent", agent: "calvin", chit: true, text: "All 30 remaining seats use Felix every week. They renew Nov 14.", topic: "Brightline seats", day: "Today" },
  { id: "lb3", chat: "t-bline", role: "person", who: "jordan", asks: true, text: "Do we offer them the annual price to hold the 30 before Nov 14, or let it renew as is?", topic: "Brightline seats", day: "Today" },
  { id: "ls1", chat: "t-sync", role: "user", text: "@Heather @Jordan @Dustin @Lisa Here’s the sync doc for Monday. Same order as always: the number, what moved, what’s stuck.", topic: "Monday leadership sync", day: "Last Monday" },
  { id: "ls2", chat: "t-sync", role: "pjoin", who: ["heather", "jordan", "dustin", "lisa"], topic: "Monday leadership sync", day: "Last Monday" },
  { id: "ls3", chat: "t-sync", role: "person", who: "heather", text: "Thanks. Can we put the Felix line right under the number next time?", topic: "Monday leadership sync", day: "Last Monday" },
];
// a chat card pinned to Home becomes a key-metric tile like any other (same shape as the Company health metrics)
const kM = (v) => (v >= 1 ? `$${v.toFixed(2)}M` : `$${Math.round(v * 1000)}K`);
export const CHAT_TILES = {
  "chat:outbound": { id: "chat:outbound", label: "Booked ARR · Outbound", value: "$130.2K", text: C.navy, fill: C.navyFill, f: 0.23, foot: "pace $573.8K", pct: "23%", pctColor: "#b1042f", hover: "$443.6K behind pace",
    desc: "New ARR booked by the Outbound lane this month. Pinned from North.", owner: "Caleb", lenses: [["monthly", "Monthly"]], openFoot: "October to date · $130.2K of the $573.8K pace", openPct: "23%", linked: "From North · Outbound behind pace", secondary: "Pin to Home",
    moversTitle: "What closed", movers: [["New logos", "58% of booked", "$75.5K", C.navy, C.navyFill], ["Reactivated", "27% of booked", "$35.2K", C.navy, C.navyFill], ["Partner intros", "15% of booked", "$19.5K", C.navy, C.navyFill]],
    series: { vals: [0.41, 0.46, 0.52, 0.48, 0.55, 0.13], lo: 0, hi: 0.6, ticks: [0, 0.2, 0.4, 0.6], fmt: kM, valFmt: kM, tgt: 0.574, tLabel: "Pace $573.8K" } },
  "chat:year": { id: "chat:year", label: "Path to $40M", value: "$1.09M", text: C.navy, fill: C.navyFill, f: 0.97, foot: "to close · $38.94M projected", pct: "97%", hover: "Three levers close it",
    desc: "Where Dec 31 ending ARR lands at October's net new rate. Pinned from North.", owner: "Rick", lenses: [["monthly", "Monthly"]], openFoot: "Projected Dec 31 · $38.94M of the $40.03M plan", openPct: "97%", linked: "From North · Path to $40M", secondary: "Pin to Home",
    moversTitle: "What closes the gap", movers: [["Outbound back to pace", "Caleb", "+$680K", C.navy, C.coral], ["Expansion win rate to 45%", "Heather", "+$300K", C.navy, C.purple], ["New logos on pace", "Sam", "+$160K", C.navy, C.teal]],
    series: { line: true, vals: [37.6, 37.9, 38.2, 38.4, 38.7, 38.94], lo: 37, hi: 40.5, ticks: [38, 39, 40], fmt: (v) => `$${v}M`, valFmt: (v) => `$${v.toFixed(2)}M`, unit: "M", tgt: 40.03, tLabel: "Plan $40.03M" } },
  "chat:lanes": { id: "chat:lanes", label: "Sales gap to pace", value: "$864K", text: C.navy, fill: C.navyFill, f: 0.58, foot: "of the plan gap", pct: "58%", pctColor: "#b1042f", hover: "Outbound is half of it",
    desc: "How far Sales' lanes are behind October pace. Pinned from North.", owner: "Heather", lenses: [["monthly", "Monthly"]], openFoot: "October to date · $864K behind pace", openPct: "58%", linked: "From North · Where Sales is behind", secondary: "Pin to Home",
    moversTitle: "By lane", movers: [["Outbound", "Caleb", "$444K", C.navy, C.coral], ["Expansion", "Heather", "$280K", C.navy, C.purple], ["New Business", "Sam", "$140K", C.navy, C.teal]],
    series: { vals: [0.22, 0.31, 0.18, 0.4, 0.52, 0.86], lo: 0, hi: 1, ticks: [0, 0.5, 1], fmt: kM, valFmt: kM, tgt: 0.3, tLabel: "Tolerance $300K" } },
  "chat:nrr": { id: "chat:nrr", label: "SMB renewals touched", value: "38%", text: C.navy, fill: C.navyFill, f: 0.38, foot: "11 of 29 due by Dec 31", pct: "38%", pctColor: "#b1042f", hover: "4 quiet for 60 days",
    desc: "Share of Jordan's SMB renewals due by Dec 31 with contact this month. Pinned from North.", owner: "Jordan", lenses: [["monthly", "Monthly"]], openFoot: "11 of 29 renewals touched this month", openPct: "38%", linked: "From North · NRR dip in SMB", secondary: "Pin to Home",
    moversTitle: "Quiet for 60 days", movers: [["Brightline", "Renews Nov 14", "$46K", C.navy, C.alert], ["Copperleaf", "Renews Nov 30", "$41K", C.navy, C.alert], ["Hartwell", "Renews Dec 9", "$38K", C.navy, C.alert], ["Ostara", "Renews Dec 22", "$35K", C.navy, C.alert]],
    series: { line: true, vals: [61, 58, 55, 49, 44, 38], lo: 30, hi: 70, ticks: [40, 50, 60], fmt: (v) => `${v}%`, valFmt: (v) => `${v}%`, unit: "pts", tgt: 60, tLabel: "Target 60%" } },
};
// pinned answers keep their chat chart on Home (closed preview and opened tile), so context and visual stay the same
CHAT_TILES["chat:outbound"].chat = ANSWERS.outbound.card; CHAT_TILES["chat:outbound"].thread = { title: "Outbound behind pace", q: "Why is Outbound behind?" }; CHAT_TILES["chat:year"].chat = ANSWERS.year.card; CHAT_TILES["chat:year"].thread = { title: "Path to $40M", q: "Path to $40M" }; CHAT_TILES["chat:lanes"].chat = ANSWERS.lanes.card; CHAT_TILES["chat:lanes"].thread = { title: "Where Sales is behind", q: "Which lanes are behind?" }; CHAT_TILES["chat:nrr"].chat = ANSWERS.nrr.card; CHAT_TILES["chat:nrr"].thread = { title: "NRR dip in SMB", q: "Why did NRR dip for small accounts?" };
Object.values(CHAT_TILES).forEach((t) => { const S = t.series; t.preview = { kind: S.line ? "line" : "bars", vals: S.vals, lo: S.lo, hi: S.hi, ticks: S.ticks.filter((x) => x > S.lo) }; });

// what North posts into a watched topic when its number moves
const UPDATES = {
  "Outbound behind pace": { steps: [], update: "Outbound moved", text: "Outbound booked $41.2K today: two of the stalled demos closed after Sam went back to outbound this morning. It's at $171.4K, 30% of pace, up from 23%.",
    card: { beside: ["Company health", "health"], pin: "chat:outbound", kind: "trend", title: "Booked ARR · Outbound", sub: "Up since Sam went back to outbound this morning.", big: "$171.4K", chip: ["up", "$41.2K today"],
      mark: { at: 26, label: "Today · 2 demos closed" }, series: [22, 25, 21, 28, 24, 27, 30, 26, 29, 31, 28, 33, 30, 27, 14, 11, 12, 9, 13, 10, 8, 11, 9, 12, 10, 14, 31],
      tray: { title: "Tell Caleb it's working", sub: "North drafts a two-line note", button: "Draft the note", q: "Draft a note to Caleb that Outbound is moving" } },
    follow: ["Is this enough to hit pace?", "Who closed them?"] },
  "Path to $40M": { steps: [], update: "Projection moved", text: "The year-end projection ticked up to $39.06M after today's Outbound deals. Still $970K short of plan; Outbound back to pace is still the lever that closes most of it.", follow: ["Run the scenario again"] },
  "NRR dip in SMB": { steps: [], update: "Renewal risk", text: "Brightline (renews Nov 14, $46K) just cut its seat count in the app. It's the first of the four quiet accounts to show churn risk.", follow: ["Draft the QBR invites for the four quiet accounts"] },
};

// Continue in Google Chat, per answer: who it goes to, where it belongs, the ask, and how the thread goes (prototype)
const GC_BY = {
  outbound: { people: ["caleb", "heather"], space: "#sales-leadership", ask: "Can we move one SDR back to Outbound for the last two weeks of the month?",
    r1who: "caleb", reply1: "Yes. I'll move Sam back Monday. @North what does that get us by Dec 31?",
    reply2: "Back at the pre-Oct 14 rate ($7.5K a day) from Nov 2, Outbound adds about $440K by Dec 31. That covers October's $443.6K gap over the quarter, not this month." },
  year: { people: ["heather", "rick", "caleb"], space: "#monday-sync", ask: "Which lever do we commit to this week?",
    r1who: "rick", reply1: "Outbound first, it's the one we control. @North what if only Outbound recovers?",
    reply2: "Outbound back to pace alone lands the year at about $39.62M, $410K short. Expansion win rate to 45% closes most of the rest ($300K)." },
  lanes: { people: ["heather", "caleb"], space: "#sales-leadership", ask: "Can we add Outbound, Expansion and New Business to Monday's sync, each with its owner?",
    r1who: "heather", reply1: "Add all three. @North which one is closest to recovering?",
    reply2: "New Business. It's $140K behind, and one good week at September's rate closes it. Outbound ($444K) is the furthest." },
  nrr: { people: ["jordan", "pd"], space: "#revenue", ask: "Can we get QBRs on the calendar for the four quiet accounts before they renew?",
    r1who: "jordan", reply1: "I'll book all four this week. @North which one renews first?",
    reply2: "Brightline, on Nov 14 ($46K). It also just cut seats in the app, so start there." },
  arr: { people: ["rick", "heather"], space: "#monday-sync", ask: "Do we plan for $38.94M, or push for the full $40.03M?",
    r1who: "rick", reply1: "We push. @North what do November and December each need?",
    reply2: "About $2.14M of growth each month. October added $1.60M, so each month needs about a third more." },
  winrate: { people: ["heather", "pd"], space: "#sales-leadership", ask: "Can we put an exec sponsor on the top 10 open expansion deals?",
    r1who: "heather", reply1: "Yes. I'll take the top three myself. @North which ten?",
    reply2: "The ten largest open deals over $50K, $1.4M together. I've sent you the list, largest first." },
  logos: { people: ["heather", "caleb"], space: "#sales-leadership", ask: "Can we hold demo volume through Oct 31 to get closer to 85?",
    r1who: "caleb", reply1: "We can. @North how many more demos to land at 70?",
    reply2: "About 75 more held demos at today's 19.9% win rate. The win rate is the bigger lever than volume." },
  demo: { people: ["heather", "caleb"], space: "#sales-leadership", ask: "Can we review the last 20 lost demos before Monday?",
    r1who: "caleb", reply1: "I'll pull them together. @North what do they have in common?",
    reply2: "14 of the 20 were booked by outbound after Oct 14, and 11 had no follow-up within two days." },
  exp: { people: ["heather", "pd"], space: "#sales-leadership", ask: "Which expansion deals can we push over the line this month?",
    r1who: "heather", reply1: "@North which open deals are past their close date?",
    reply2: "Nine, worth $212K together. Northwind's second team ($48K) is the largest and has had no activity in 12 days." },
  ttv: { people: ["dustin", "pd"], space: "#revenue", ask: "Can we look at the first-integration step together this week?",
    r1who: "pd", reply1: "Most of the wait is on the customer's IT. @North how many are stuck there right now?",
    reply2: "17 accounts are waiting on their first integration, 9 of them for more than a week." },
  scenario: { people: ["heather", "rick", "caleb"], space: "#monday-sync", ask: "Do we commit to all three levers on Monday?",
    r1who: "heather", reply1: "All three, Outbound first. @North what if Outbound only gets halfway?",
    reply2: "Halfway on Outbound with the other two lands at about $39.74M, $290K short." },
};
GC_BY.draft = GC_BY.outbound;
// how each answer reads in a recap: written out, for someone who wasn't in the conversation
const SUM_BY = {
  outbound: "Outbound has booked $130.2K this month against a $573.8K pace, 23% of where it should be. It dropped after Oct 14, when two SDRs moved to inbound coverage: demos held fell from 26 to 11, and the deals that did close came in 40% smaller than September's.",
  year: "At October's rate we finish the year at $38.94M, $1.09M short of the $40.03M plan. Three levers close it: Outbound back to pace (about $680K), expansion win rate to 45% ($300K) and new logos on pace ($160K).",
  lanes: "Four of seven lanes are behind, and three of them are in Sales. Outbound is the biggest share of the $864K gap ($444K), then Expansion ($280K) and New Business ($140K), which one good week would close.",
  nrr: "Jordan has 29 SMB renewals due by Dec 31. 11 have been touched this month and 6 have a QBR booked, but 4 haven't been contacted in 60 days, the same pattern as the three accounts that churned in September.",
  arr: "Ending ARR is $35.75M, up $1.60M on September. At October's rate, November and December land the year at $38.94M, $1.09M short of plan.",
  winrate: "Expansion deals are closing at 31.9%, about half the 60% goal. Most of the losses are deals over $50K with no exec sponsor on our side.",
  logos: "55 new logos so far this month against a pace of 73. At this rate October closes at 63, against a target of 85.",
  demo: "Held demos are converting at 19.9%, 3.6 points under the 23.5% target. The drop is concentrated in demos booked by Outbound since Oct 14.",
  exp: "Expansion has booked $734.0K this month, $280K behind the pace to its $1.17M October target, and it has been flat since the 18th.",
  ttv: "New customers take 20.9 days to reach ten Felix handoffs, about six days over the 15-day goal. The slowest step is the first integration.",
  scenario: "With all three levers we finish at $40.08M, $50K over plan. Outbound back to pace is the one that matters; without it the other two leave us $630K short.",
};
Object.entries(SUM_BY).forEach(([k, v]) => { if (ANSWERS[k]) ANSWERS[k].sum = v; });
if (ANSWERS.draft) ANSWERS.draft.noSum = true;
Object.keys(ANSWERS).forEach((k) => { ANSWERS[k].key = ANSWERS[k].key || k; });
Object.entries(GC_BY).forEach(([k, v]) => { if (ANSWERS[k]) ANSWERS[k].gc = v; });

// a question naming one of your newest accounts: its own answer (a draft when you ask for one), from the same detail the table opens
const ACCT_A = {};
function acctAnswer(s) {
  const det = ANSWERS.accounts.card.detail, n = Object.keys(det).find((k) => s.includes(k.toLowerCase())); if (!n) return null;
  const d = det[n], draft = /draft|invite|brief|note|watch|prep|book/.test(s), key = n + (draft ? ":d" : "");
  return ACCT_A[key] || (ACCT_A[key] = draft ? { topic: "Newest accounts", steps: [`Reading ${n}`, "Writing it up"], text: d.draft }
    : { topic: "Newest accounts", steps: [`Reading ${n}`], text: `${n} is ${d.stats[1][1].toLowerCase()}: ${d.note} Next step: ${d.stats[3][1].toLowerCase()} ${d.stats[3][2]}.` });
}
function answerFor(q, quote, cont) {
  const s = `${q} ${quote ? quote.t || quote : ""}`.toLowerCase();
  { const ac = acctAnswer(s); if (ac) return ac; }
  if (cont === "NRR dip in SMB" && !/draft|invite/.test(s)) return ANSWERS.nrr;
  if (cont === "Q4 hiring plan") return ANSWERS.year;
  if (/draft|note/.test(s)) return ANSWERS.draft;
  if (/(latest|newest|new|recent) accounts|status (on|of) (my |our )?\w* ?accounts|accounts? status|accounts? break ?downs?|break ?down (by|of) accounts?/.test(s)) return ANSWERS.accounts;
  if (/brightline/.test(s)) return ANSWERS.bline;
  if (/renewal|nrr|smb|jordan|churn/.test(s)) return ANSWERS.nrr;
  if (/demo/.test(s)) return ANSWERS.demo;
  if (/win ?rate|close rate|closing rate/.test(s)) return ANSWERS.winrate;
  if (/logo/.test(s)) return ANSWERS.logos;
  if (/ttv|time to value|handoff|onboard/.test(s)) return ANSWERS.ttv;
  if (/expansion/.test(s)) return ANSWERS.exp;
  if (/total arr|arr trend|arr movement|ending arr|trend|by month|monthly|\barr\b.*\b(months?|over time)\b|last (\d+|six|three|twelve) months/.test(s)) return ANSWERS.arr;
  if (/scenario.*(all|three)|run the scenario/.test(s)) return ANSWERS.scenario;
  if (/40m|simulat|year|plan|path|close the gap|gap/.test(s)) return ANSWERS.year;
  if (/outbound|booked|why|behind pace|caleb/.test(s)) return ANSWERS.outbound;
  return ANSWERS.lanes;
}

// the new-chat screen opens on the agents at work: what each one is on this minute, the thought it's having, how far it's got.
// It's read from the Agents floor, so it moves when they do; click one to ask about their work.
// the new chat's light: three soft pools in the agents' colours. The one nearest your cursor leans toward it and settles
// back when you stop; nothing moves on its own beyond a very slow drift.
function ChatGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const B = [...el.children], home = [[0.22, 0.18], [0.55, 0.08], [0.85, 0.22]], pos = home.map((h) => [...h]);
    let m = null, raf = 0, t0 = performance.now();
    const move = (e) => { const r = el.getBoundingClientRect(); m = r.width ? [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] : null; };
    const out = () => { m = null; };
    const tick = (t) => {
      const T = (t - t0) / 1000;
      home.forEach((h, i) => {
        const dx = Math.sin(T * 0.07 + i * 2.1) * 0.02, dy = Math.cos(T * 0.06 + i * 1.7) * 0.02; // a drift you'd only notice over a minute
        let tx = h[0] + dx, ty = h[1] + dy;
        if (m && !reduced) { const d = Math.hypot(m[0] - h[0], (m[1] - h[1]) * 0.6), w = Math.max(0, 1 - d / 0.75); tx += (m[0] - h[0]) * 0.55 * w; ty += (m[1] - h[1]) * 0.55 * w; }
        pos[i][0] += (tx - pos[i][0]) * 0.035; pos[i][1] += (ty - pos[i][1]) * 0.035; // about a second to arrive, no overshoot
        B[i].style.transform = `translate(${(pos[i][0] * 100).toFixed(2)}%, ${(pos[i][1] * 100).toFixed(2)}%)`;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true }); document.addEventListener("pointerleave", out); raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", out); };
  }, []);
  return <div className="nw-glow" ref={ref}><i className="is-orin" /><i className="is-riley" /><i className="is-calvin" /></div>;
}
// a thought written out the way the agent is having it: once when you arrive, again only when it really changes
function TypeIn({ text, delay = 0 }) {
  const [n, setN] = useState(0);
  // paced by the clock, not by ticks, so a busy frame never slows the writing down
  useEffect(() => { setN(0); let raf = 0; const t0 = performance.now() + delay;
    const f = (t) => { const k = Math.max(0, Math.min(text.length, Math.floor((t - t0) / 22))); setN(k); if (k < text.length) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf); }, [text]);
  return <>{text.slice(0, n)}{n < text.length && <i className="nl-caret" />}</>;
}
function NewLive({ onAsk }) {
  const [now, setNow] = useState(() => (window.__northAgents?.now ? window.__northAgents.now() : []));
  useEffect(() => { const t = setInterval(() => { if (window.__northAgents?.now) setNow(window.__northAgents.now()); }, 1500); return () => clearInterval(t); }, []);
  if (!now.length) return null;
  return (
    <motion.div className="nl" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}>
      {now.map((a, k) => (
        <motion.button key={a.ag} className="nl-a" variants={{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }} onClick={() => onAsk(`What is ${a.n} working on?`)}>
          <span className="nl-h"><Orb id={a.ag} size={18} /><b>{a.n}</b><em>{a.count ? `${a.count} running` : "Free"}</em></span>
          <span className="nl-t">{a.t ? a.t.charAt(0).toUpperCase() + a.t.slice(1) : "Waiting for the next job"}</span>
          <AnimatePresence mode="wait" initial={false}><motion.span key={a.th || "-"} className="nl-th" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>{a.th ? <TypeIn text={a.th} delay={450 + k * 650} /> : "\u00a0"}</motion.span></AnimatePresence>
          <span className="nl-p"><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0.04, a.prog) }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} style={{ "--c": AGENTS[a.ag].col }} /></span>
          <span className="nl-s">{a.step || ""}</span>
        </motion.button>))}
    </motion.div>
  );
}

// ------------------------------------------------------------------ pointing at a chart → North explains that chart (prototype: no new chart)
// Lead with what matters (the gap, the risk, the win), then what's driving it, then — briefly — what it is and who owns it.
const MOS = ["May", "Jun", "Jul", "Aug", "Sep", "October so far"];
const lc = (t) => (t && /^[A-Z][a-z]/.test(t) && !/^(Felix|Fello)\b/.test(t) ? t[0].toLowerCase() + t.slice(1) : t); // keeps ARR, Felix, etc.
const owns = (who) => (/ \/ /.test(who) ? `${who.replace(/ \/ /g, " and ")} own` : `${who} owns`);
// the key metric tiles: written, not generated — these are the numbers people open most
const LEADS = {
  felix: ["Felix ARR is on pace at $12.99M, right where it should be today, with $70K to go to October's $13.06M target.",
    "Three accounts adding Calvin did most of the month: Acme Co (+$210K), Northwind (+$168K) and Initech (+$94K). Umbrella dropping a team (−$22K) is the only loss.",
    "Dustin and Rick own it."],
  total: ["Total ARR is $1.56M behind where it should be by now. At this rate the year ends at $38.94M, $1.09M short of the $40.03M plan.",
    "October's growth came from Northwind's expansion (+$184K) and two new logos, Acme Co (+$142K) and Initech (+$121K). Globex churning (−$96K) is the biggest drag.",
    "Rick owns it. It's the yearly revenue every current customer is paying us today."],
  nrr: ["NRR is flat at 99.9%, 0.1 pts under its 100.0% target: existing customers are paying almost exactly what they did a year ago.",
    "Expansion is happening (Northwind +0.4 pts, Initech +0.2 pts), but Globex churning (−0.6 pts) and Hooli downgrading (−0.3 pts) cancel it out.",
    "Dustin Deno owns it."],
  netnew: ["Net new ARR is $180K behind pace: $1.60M against the $1.78M it should be at by now, with $1.87M the October target.",
    "Outbound is most of the miss. It has booked $130.2K against a $573.8K pace since two SDRs moved to inbound on Oct 14. Inbound is at 128% of pace, which is why the gap isn't bigger.",
    "Dustin Deno owns it. It's new ARR booked this month minus what churn and downgrades took away."],
  "ch-total": ["Total ARR is at $35.75M with two months left, and $4.28M still to add to reach the $40.03M plan.",
    "That's about $2.14M a month for November and December, faster than any month this year. September's $2.09M was the best so far.",
    "Rick owns it. It has grown every month since May, from $29.5M."],
  "ch-net": ["Net new ARR is $180K behind pace: $1.60M against the $1.78M it should be at by now, with $1.87M the October target.",
    "It's also down from September's $1.76M. Outbound is the main reason ($130.2K booked against a $573.8K pace), and Globex churning (−$96K) took a little more off.",
    "Dustin Deno owns it."],
  "ch-nrr": ["NRR is at 99.9%, 0.1 pts under its 100.0% target: existing customers are paying about what they did a year ago.",
    "It has hovered around 100% since May (99.1% at the low, 100.7% in September), so this month is normal, not a slide.",
    "Dustin Deno owns it. NRR counts expansion; GRR, beside it, doesn't."],
  "ch-grr": ["GRR is ahead of target at 97.7%: we've kept 97.7% of last year's revenue from existing customers, before any expansion.",
    "That's 0.77 pts over the 96.93% target and near the top of its range since May. Churn isn't the problem. NRR sits near 100% because expansion is light (Expansion ARR is at 72% of pace), not because customers are leaving.",
    "PD and Rick own it."],
  "ch-felix": ["Felix ARR is on pace at $12.99M, $70K from October's $13.06M target.",
    "It's the fastest-growing number on the page: up from $5.1M in May, more than doubling in five months.",
    "Dustin and Rick own it."],
  "ch-avg": ["Average ARR per account is $13.1K, $300 over its $12.8K target, and it has gone up every month since May.",
    "Customers are getting bigger, not just more numerous: new logos are coming in at $25.0K on average, nearly double the overall average.",
    "Rick owns it. It's total ARR divided by paying accounts."],
  "ch-pay": ["Paying accounts are at 2,717, 83 short of the 2,800 target.",
    "The count has climbed every month since May, but slowly (about 20 a month), and new logos are at 75% of pace (55 against 73), so the gap isn't closing on its own.",
    "Rick owns it."],
  "ch-gtm": ["ARR to GTM comp is one of the strongest numbers on the page: 31.3x against a 26.0x target.",
    "Every dollar of go-to-market pay is bringing in $31.30 of ARR, and it has improved every month since May. Efficiency isn't the issue; Outbound volume is.",
    "Dustin Deno owns it. It's ARR booked for every dollar of go-to-market compensation."],
  "ARR movement": ["At October's rate ARR finishes the year at $38.94M, $1.09M short of the $40.03M plan.",
    "Closing it means adding about $2.14M a month in November and December. September's +$2.09M is the best month this year; October is at $35.75M so far.",
    "Solid bars are actuals, the lighter October bar is month to date, and the dotted bars are the path to plan."],
};
// heatmap squares where the cause is known: the "why" line, written
const CELL_WHY = {
  "Outbound|Booked ARR – Outbound": "It dropped after Oct 14, when two SDRs moved to inbound coverage. Demos held fell from 26 to 11 since, and the deals that did close came in 40% smaller than September's.",
  "Expansion|Win rate": "Expansion deals are being created on pace (110 against 113.6); they're just not closing. That's why Expansion ARR is at 72% of pace.",
  "Expansion|Expansion ARR": "Deals are being created on pace (110 against 113.6), but only 31.9% are closing against a 60% target. The win rate is the lever, not the pipeline.",
  "New Business|New logos": "Demos are happening (310 held, 90% of pace); fewer are converting. Win rate from held demos is 19.9% against a 23.5% target.",
  "New Business|Win rate from held demo": "It's why New logos is at 75% of pace even though demos held are at 90%.",
  "Value Delivery|TTV: 10 handoffs": "Lower is better here. Customers are taking 5.9 days longer than the 15-day ceiling to reach their tenth Felix handoff.",
  "Inbound|Booked ARR – Inbound": "Inbound is carrying the month. It's the main reason the overall miss on net new ARR isn't bigger.",
};
// "$130.2K" / "342" / "50.7%" / "20.9d" → { n, u }
const num = (t) => { const m = (t || "").match(/(\$?)([\d,]+(?:\.\d+)?)([KM%dx]?)/); if (!m) return null; const n = parseFloat(m[2].replace(/,/g, "")) * (m[3] === "K" ? 1e3 : m[3] === "M" ? 1e6 : 1); return { n, u: m[1] ? "$" : m[3] === "%" ? "%" : m[3] === "d" ? "d" : m[3] === "x" ? "x" : "" }; };
const money = (x) => (x >= 1e6 ? `$${(x / 1e6).toFixed(2)}M` : `$${(x / 1e3).toFixed(1).replace(/\.0$/, "")}K`);
const gapText = (v, target) => {
  const a = num(v), b = num(target); if (!a || !b || a.u !== b.u) return "";
  const d = Math.abs(b.n - a.n), over = a.n > b.n;
  const amt = a.u === "$" ? money(d) : a.u === "%" ? `${+d.toFixed(1)} pts` : a.u === "d" ? `${+d.toFixed(1)} days` : a.u === "x" ? `${+d.toFixed(1)}x` : `${Math.round(d).toLocaleString("en-US")}`;
  return over ? `${amt} over` : `${amt} short`;
};
// what you're watching: only what's on. Open a row to see what's going on (the number, its run, the latest from North);
// switch it off and it leaves the list — the bell under the answer brings it back.
function Spark({ vals }) {
  if (!vals || vals.length < 2) return null;
  const lo = Math.min(...vals), hi = Math.max(...vals), W = 72, H = 22, X = (i) => (i / (vals.length - 1)) * (W - 4) + 2, Y = (v) => H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6);
  return <svg className="wl-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><polyline points={vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" /><circle cx={X(vals.length - 1)} cy={Y(vals[vals.length - 1])} r="2.2" fill="currentColor" /></svg>;
}
// A surface pushed out of a line already on screen (the divider, the page's edge, the header's line). One progress value drives it all:
// its size grows from the line, and the joints where the line turns into its edges change shape with it — long and shallow while it's
// small (the line swelling), tightening to 14px curves as it pushes out; on the way back they lengthen and soften again, so it melts
// back into the line. axis "x": the line is vertical and the surface grows right; "y": the line is horizontal and it grows down.
// w: the line's width; X: the line's centre measured from the surface's edge (axis x); fill: the surface colour (fillA/fillB at the joints).
const PUSH_IN = { duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.06 }, PUSH_OUT = { duration: 0.46, ease: [0.55, 0, 0.25, 1], delay: 0.04 };
// cross / origin / start (optional): the surface is also born the size of what you touched (start), centred on it (origin), and
// spreads along the line to its full cross size as it pushes out — the joints travel with it, and converge back to that point on the
// way in. fillAt(y): the joint colour at a position along the line, for surfaces filled with a gradient.
export function PushShape({ axis = "x", size, w = 1, X = 0.5, fill = "#fff", fillA, fillB, fillAt, ext = 3, cross, origin, start = 28, className, style, children }) {
  const [present, safeToRemove] = usePresence(), p = useMotionValue(0), self = useRef(null);
  // the cross size can change while it's out (a notice that grows open): it follows, and the joints and clip go with it
  const cm = useMotionValue(cross || 0); useEffect(() => { if (cross != null) cm.set(cross); }, [cross]);
  const span = (v) => { const X0 = cm.get(); if (!X0) return [0, 0]; const k = Math.max(0, Math.min(1, v)), o = Math.max(start / 2, Math.min(X0 - start / 2, origin ?? X0 / 2));
    return [(o - start / 2) * (1 - k), X0 - (X0 - o - start / 2) * (1 - k)]; };
  // the content clips to the same span, so nothing shows outside the surface while it spreads
  useEffect(() => { if (!cross) return; const put = (v) => { const par = self.current && self.current.parentElement; if (!par) return; const [n, fr] = span(v); par.style.setProperty("--ps-cn", `${n}px`); par.style.setProperty("--ps-cf", `${cm.get() - fr}px`); par.style.setProperty("--ps-cm", `${Math.max(0, size - v * size)}px`); };
    put(p.get()); const u1 = p.on("change", put), u2 = cm.on("change", () => put(p.get())); return () => { u1(); u2(); }; }, [cross, origin, start, size]);
  const pos = useTransform([p, cm], ([v]) => `${span(v)[0]}px`), len = useTransform([p, cm], ([v]) => { const [n, fr] = span(v); return `${fr - n}px`; });
  const fa = useTransform([p, cm], ([v]) => fillAt ? fillAt(span(v)[0] - 7) : fillA || fill), fb = useTransform([p, cm], ([v]) => fillAt ? fillAt(span(v)[1] + 7) : fillB || fill);
  useEffect(() => { const k = (typeof window !== "undefined" && window.__psSlow) || 1; // a slow-motion switch for checking the shape mid-move
    const c = present ? animate(p, 1, { ...PUSH_IN, duration: PUSH_IN.duration * k, delay: PUSH_IN.delay * k }) : animate(p, 0, { ...PUSH_OUT, duration: PUSH_OUT.duration * k, delay: PUSH_OUT.delay * k, onComplete: () => safeToRemove && safeToRemove() }); return () => c.stop(); }, [present]);
  const R = 14, LONG = 56, conv = (v) => { const t = Math.max(0, Math.min(1, (v - 0.55) / 0.45)); return t * t * (3 - 2 * t); };
  // the open width is shared: the joint takes ~55%, the leading corner the rest, so a narrow panel is one soft S, never a hook
  const avail = (v) => Math.max(0, v * size - (axis === "x" ? X + 0.5 : w + 0.5));
  const geo = (v) => { const D = Math.min(R, avail(v) * 0.55); return { D, L: Math.max(D, LONG + (R - LONG) * conv(v)) }; };
  const cr = useTransform(p, (v) => `${Math.min(10, avail(v) * 0.45)}px`);
  const sz = useTransform(p, (v) => v * size);
  const h2 = w / 2, e = ext;
  const paths = useTransform(p, (v) => { const { D, L } = geo(v), f = Math.min(e, Math.max(0, avail(v) - D));
    if (axis === "x") return [
      `M${X - h2 - 0.5} ${h2 - L} L${X} ${h2 - L} A${D} ${L} 0 0 0 ${X + D} ${h2} L${X + D} ${w} L${X - h2 - 0.5} ${w} Z`,
      `M${X} ${h2 - L - e} L${X} ${h2 - L} A${D} ${L} 0 0 0 ${X + D} ${h2} L${X + D + f} ${h2}`,
      `M${X - h2 - 0.5} ${-w} L${X + D} ${-w} L${X + D} ${-h2} A${D} ${L} 0 0 0 ${X} ${-h2 + L} L${X - h2 - 0.5} ${-h2 + L} Z`,
      `M${X + D + f} ${-h2} L${X + D} ${-h2} A${D} ${L} 0 0 0 ${X} ${-h2 + L} L${X} ${-h2 + L + e}`];
    return [
      `M${h2 - L} 0 L${h2 - L} ${h2} A${L} ${D} 0 0 1 ${h2} ${h2 + D} L${w + 0.5} ${h2 + D} L${w + 0.5} 0 Z`,
      `M${h2 - L - e} ${h2} L${h2 - L} ${h2} A${L} ${D} 0 0 1 ${h2} ${h2 + D} L${h2} ${h2 + D + f}`,
      `M${-(h2 - L)} 0 L${-(h2 - L)} ${h2} A${L} ${D} 0 0 0 ${-h2} ${h2 + D} L${-(w + 0.5)} ${h2 + D} L${-(w + 0.5)} 0 Z`,
      `M${-(h2 - L - e)} ${h2} L${-(h2 - L)} ${h2} A${L} ${D} 0 0 0 ${-h2} ${h2 + D} L${-h2} ${h2 + D + f}`]; });
  const d = (k) => useTransform(paths, (P) => P[k]);
  const f0 = d(0), s0 = d(1), f1 = d(2), s1 = d(3);
  const J = (pos, f, st, col) => <svg className={`ps-j is-${pos}`} width="1" height="1" aria-hidden="true"><motion.path d={f} fill={col} /><motion.path d={st} fill="none" stroke="var(--ps-line)" strokeWidth={w} /></svg>;
  return (
    <motion.span className={`ps ${axis === "x" ? "is-x" : "is-y"}${className ? " " + className : ""}`} ref={self} style={{ ...style, [axis === "x" ? "width" : "height"]: sz, ...(cross ? (axis === "x" ? { top: pos, height: len, bottom: "auto" } : { left: pos, width: len, right: "auto" }) : null), "--ps-w": `${w}px`, "--ps-r": cr, background: fill }}>
      {axis === "x" ? <>{J("tl", f0, s0, fa)}{J("bl", f1, s1, fb)}</> : <>{J("tl", f0, s0, fa)}{J("tr", f1, s1, fa)}</>}
      {children}
    </motion.span>
  );
}
// a flyout that pushes out of the line at the sidebar rail's edge (the page card's, or the chat's when it covers the page), the
// same recipe as Watching: born the height of what you hovered, spreading along the line, filled with the sidebar's own background
// a job you set in motion landed: one line out of the sidebar beside Agents. Open grows it right there into what came of it
// (the same view the chat gives a job), so you never have to leave where you are; Agents is one more step if you want it
function JobNote({ n, M, onModal, onClose, onHold, onLetGo, onAway }) {
  // one piece of work, once: a hand-off from Home and the agent's own job for it can both report back; keep the one that says what came of it
  const items = n.items.filter((w, i, all) => !all.some((x, j) => j !== i && x.ag === w.ag && x.t === w.t && (x.find && !w.find || (!!x.find === !!w.find && j < i)))), one = items.length === 1, ref = useRef(null);
  // a click anywhere else, or Esc, puts it away (still there under Agents); a click on Agents itself is Agents' to handle
  useEffect(() => { const d = (e) => { const t = e.target; if (ref.current && ref.current.closest(".efly")?.contains(t)) return; if (rowR.current && rowR.current.contains(t)) return; onAway(); };
    const k = (e) => { if (e.key === "Escape") onAway(); };
    document.addEventListener("pointerdown", d, true); addEventListener("keydown", k);
    return () => { document.removeEventListener("pointerdown", d, true); removeEventListener("keydown", k); }; }, []);
  const rowR = useRef(null);
  // Sam's seat: it arrives at Ask North, the one place things that need you collect
  const row = (getWho() === "sam" && document.querySelector(".side .nav-row.is-ask")) || [...document.querySelectorAll(".side .nav-row, .side a, .side button")].find((x) => /^\s*Agents\s*$/.test(x.textContent)), r = row && row.getBoundingClientRect(); rowR.current = row;
  const nm = (w) => w.n || (AGENTS[w.ag] ? AGENTS[w.ag].n : w.ag), face = (id, s) => (AGENTS[id] ? <Orb id={id} size={s} /> : <PFace id={id} size={s} />);
  const who = (w) => (w.st === "need" ? `${nm(w)} needs you` : getWho() === "sam" ? `${nm(w)} finished · ready for you` : w.hand ? `${nm(w)} finished · ${w.t}` : w.find ? `${nm(w)} · ${w.t}` : `${nm(w)} finished`);
  const label = one ? who(items[0]) : n.list ? `Ready for you · ${items.length}` : `${items.length} things came in`;
  const go = (k) => { const w = items[k];
    if (w && w.hand) { onClose(); setTimeout(() => dispatchEvent(new CustomEvent("north:attach", { detail: w.attach })), 60); return; }
    const jobs = items.filter((x) => !x.hand); onModal(jobs.map((x) => x.id), Math.max(0, jobs.indexOf(w)), ref.current ? ref.current.getBoundingClientRect() : null); };
  return (
    <EdgeFly className="rail-fly job-fly" top={(r ? r.top : 140) - 6} start={r ? r.height + 12 : 36} onPointerEnter={onHold} onPointerLeave={onLetGo}>
      <div className="jf" ref={ref}>
        <div className="jf-h">{one ? face(items[0].ag, 14) : <span className="jf-orbs">{[...new Set(items.map((w) => w.ag))].map((a) => <React.Fragment key={a}>{face(a, 14)}</React.Fragment>)}</span>}<span className="jf-l">{label}</span>
          <button className="jf-x" aria-label="Dismiss" onClick={onClose}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 3l6 6M9 3 3 9" /></svg></button></div>
        {one ? <>
          <p className="jf-t">{items[0].find || items[0].t}</p>
          <button className="jf-open" onClick={() => go(0)}>Open</button>
        </> : <ul className="jf-list">{items.map((w, k) => (
          <li key={w.id}><button className="jf-row" onClick={() => go(k)}>{face(w.ag, 12)}<span className="jf-rt">{w.find && w.find !== w.t ? <><b>{w.t}</b><small>{w.find}</small></> : w.t}</span>{w.st === "need" && <em>Needs you</em>}</button></li>))}</ul>}
      </div>
    </EdgeFly>
  );
}
export function EdgeFly({ top, start = 36, origin, className = "", children, onPointerEnter, onPointerLeave }) {
  const [pg, setPg] = useState(null);
  const read = (el) => { if (!el) return; const sd = document.querySelector(".side"), sx = sd ? sd.getBoundingClientRect().right : 64, y = top + 10;
    const hit = document.elementsFromPoint(sx + 0.5, y).find((e) => e !== el && !el.contains(e) && Math.abs(e.getBoundingClientRect().left - sx) < 1.5 && parseFloat(getComputedStyle(e).borderLeftWidth) > 0) || document.querySelector(".main");
    const hs = getComputedStyle(hit), w = parseFloat(hs.borderLeftWidth) || 1, c0 = hs.borderLeftColor, c = /rgba\([^)]*,\s*0\)|transparent/.test(c0) ? "rgb(232, 232, 232)" : c0;
    const left = Math.round(hit.getBoundingClientRect().left * 4) / 4, h = el.offsetHeight, wd = el.offsetWidth;
    const bg = getComputedStyle(document.body), m = /linear-gradient\((rgb[^)]*\))\s+(\d+)px,\s*(rgb[^)]*\))\s+(\d+)px\)/.exec(bg.backgroundImage);
    const at = (yy) => { if (!m) return bg.backgroundColor; const a0 = m[1].match(/\d+/g).map(Number), a1 = m[3].match(/\d+/g).map(Number), t = Math.max(0, Math.min(1, (yy - +m[2]) / (+m[4] - +m[2]))); return `rgb(${a0.map((v, k) => Math.round(v + (a1[k] - v) * t)).join(",")})`; };
    const fill = m ? `${m[0]} fixed` : bg.backgroundColor;
    setPg((pg0) => (pg0 && pg0.left === left && pg0.h === h && pg0.wd === wd && pg0.w === w && pg0.c === c ? pg0 : { left, h, wd, w, c, fill, at })); };
  // its content can grow while it's out (a notice opening up): the surface follows
  const elR = useRef(null);
  useEffect(() => { const el = elR.current; if (!el || typeof ResizeObserver === "undefined") return; const ro = new ResizeObserver(() => read(el)); ro.observe(el); return () => ro.disconnect(); }, []);
  return (
    <motion.div ref={(el) => { elR.current = el; read(el); }} className={`efly ${className}`} style={pg ? { top, left: pg.left, "--ef-w": `${pg.w}px`, "--ef-line": pg.c, "--ef-fill": pg.fill } : { top, visibility: "hidden" }}
      initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0.999, transition: { duration: 0.52 } }} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      {pg && <PushShape axis="x" size={pg.wd} w={pg.w} X={pg.w / 2} fill={pg.fill} fillAt={(y) => pg.at(top + y)} cross={pg.h} origin={origin ?? 6 + start / 2} start={start} className="ef-shape" />}
      <motion.div className="ef-in" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.06, ease: [0.4, 0, 1, 1] } }}>{children}</motion.div>
    </motion.div>
  );
}
function WatchList({ info, onToggle, onOpen, onClose, M, unread, detail, fly, onEnter, onLeave }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(null), [going, setGoing] = useState(() => new Set());
  useEffect(() => { const d = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest(".wl-btn")) onClose(); }; document.addEventListener("pointerdown", d, true); return () => document.removeEventListener("pointerdown", d, true); }, []);
  const rows = Object.entries(info).filter(([, v]) => v.on);
  const off = (tp) => { setGoing((g) => new Set(g).add(tp)); setTimeout(() => { onToggle(tp); setGoing((g) => { const n = new Set(g); n.delete(tp); return n; }); }, 320); };
  const T = toMotion(M.chat.swap);
  // in the chat's header the panel is the header's line pushing down: open on top, the line wrapping its sides and bottom, curving
  // into them at 14px joints, its height growing from the line; the rows land once it's out (the sidebar's flyout stays a flyout)
  // the sidebar's flyout is the same idea turned on its side: the page card's left edge pushing out to the right
  const push = true, side = !!fly, [pg, setPg0] = useState(null), setPg = (v) => setPg0((o) => (o && Object.keys(v).every((k) => typeof v[k] === "function" || o[k] === v[k]) ? o : v));
  // a row opening makes the list taller: the surface (and its joints) follow it, not the height it opened at
  const elW = useRef(null);
  useEffect(() => { const el = elW.current; if (!el || typeof ResizeObserver === "undefined") return; const ro = new ResizeObserver(() => readPg(el)); ro.observe(el); return () => ro.disconnect(); }, []);
  const readPg = (el) => { ref.current = el; elW.current = el; if (!el) return;
    if (side) { const mn = document.querySelector(".main"); if (!mn) return; const ms = getComputedStyle(mn), w = parseFloat(ms.borderLeftWidth) || 1, c = ms.borderLeftColor, left = Math.round(mn.getBoundingClientRect().left * 4) / 4, h = el.offsetHeight;
      // its fill is the sidebar's: the page background (a gradient pinned to the window), and the joints take its colour at their height
      const bg = getComputedStyle(document.body), m = /linear-gradient\((rgb[^)]*\))\s+(\d+)px,\s*(rgb[^)]*\))\s+(\d+)px\)/.exec(bg.backgroundImage);
      const at = (y) => { if (!m) return bg.backgroundColor; const a0 = m[1].match(/\d+/g).map(Number), a1 = m[3].match(/\d+/g).map(Number), t = Math.max(0, Math.min(1, (y - +m[2]) / (+m[4] - +m[2]))); return `rgb(${a0.map((v, k) => Math.round(v + (a1[k] - v) * t)).join(",")})`; };
      const top = el.getBoundingClientRect().top, fill = m ? `${m[0]} fixed` : bg.backgroundColor, ft = at(top - 7), fb = at(top + h + 7);
      setPg({ left, h, w, c, fill, ft, fb, at, top }); return; }
    const hd = el.closest(".chat-head"), par = el.offsetParent; if (!hd || !par) return;
    const hs = getComputedStyle(hd), w = parseFloat(hs.borderBottomWidth) || 1, c = hs.borderBottomColor; // the header's own line: its width and colour
    const top = Math.round((hd.getBoundingClientRect().bottom - w - par.getBoundingClientRect().top) * 4) / 4, h = el.offsetHeight;
    // it spreads from the bell: its centre, measured from the panel's left edge
    const bt = hd.querySelector(".wl-btn"), bx = bt ? bt.getBoundingClientRect() : null, cw = el.offsetWidth, ox = bx ? Math.round(bx.left + bx.width / 2 - el.getBoundingClientRect().left) : cw - 20;
    setPg({ top, h, w, c, ox, cw }); };

  const PUSH = { duration: 0.5, ease: [0.32, 0.72, 0, 1] }, R = 14;
  // the same recipe as Topics: the edge pushes out on one curve and draws back in; the heading, then each row, land just behind it

  const hovT = useRef(0);
  const hov = (tp) => { clearTimeout(hovT.current); hovT.current = setTimeout(() => setOpen(tp), 110); }; // a beat of intent, so sweeping past doesn't open every row
  useEffect(() => () => clearTimeout(hovT.current), []);
  return (
    <motion.div ref={readPg} className={`wl is-push${fly ? " is-fly is-side" : ""}`} style={side ? (pg ? { top: fly.top, left: pg.left, "--wp-w": `${pg.w}px`, "--wp-line": pg.c, "--wp-fill": pg.fill } : { top: fly.top, left: fly.left, visibility: "hidden" }) : pg ? { top: pg.top, "--wp-w": `${pg.w}px`, "--wp-line": pg.c } : { visibility: "hidden" }} onPointerEnter={onEnter} onPointerLeave={onLeave}
      initial={push ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.98 }} animate={push ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={push ? { opacity: 0.999, transition: { duration: 0.52 } } : { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.14 } }} transition={T}
      onPointerDown={(e) => e.stopPropagation()}>
      {pg && (side
        ? <PushShape axis="x" size={320} w={pg.w} X={pg.w / 2} fill={pg.fill} fillAt={(y) => pg.at(pg.top + y)} cross={pg.h} origin={6 + (fly.h || 28) / 2} start={fly.h || 28} className="wp-shape is-side" />
        : <PushShape axis="y" size={pg.h} w={pg.w} fill="#fff" ext={0} cross={pg.cw} origin={pg.ox} start={30} className="wp-shape" />)}
      <motion.div className="wp-in" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.06, ease: [0.4, 0, 1, 1] } }}>
      <div className="wl-h"><b>Watching</b><span>{rows.length || ""}</span></div>
      {rows.length === 0 ? <p className="wl-empty">Nothing yet. Use the bell under any answer and North tells you in the chat when it moves.</p> : (
        <ul>
          <AnimatePresence initial={false}>
            {rows.map(([tp, v], ri) => { const isOpen = open === tp, d = isOpen ? detail(tp) : null;
              return (
                <motion.li key={tp} layout="position" style={{ "--i": ri + 1 }} className={isOpen ? "is-open" : ""} initial={false} onPointerEnter={() => hov(tp)} exit={{ opacity: 0, height: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}>
                  <div className="wl-row">
                    <button className="wl-main" aria-expanded={isOpen} onClick={() => setOpen(tp)} onFocus={() => setOpen(tp)}>
                      <b>{tp}{unread && unread.has(tp) && <i className="wl-new">New</i>}</b>
                      <small>{v.last || (v.since === "Today" ? "No change yet" : `No change since ${v.since}`)}</small>
                    </button>
                    <button className={`wl-sw${v.on && !going.has(tp) ? " is-on" : ""}`} role="switch" aria-checked={v.on && !going.has(tp)} aria-label={`Stop watching ${tp}`} onClick={() => off(tp)}><i /></button>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && d && (
                      <motion.div key="d" className="wl-d" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0, transition: { duration: 0.18 } }} transition={T}>
                        <div className="wl-d-in">
                          {d.now && <div className="wl-num"><b>{d.now}</b><span>{d.label}</span></div>}
                          {d.text && <p>{d.text.split(/(?<=[.!?])\s+/)[0]}</p>}
                          <button className="wl-go" onClick={() => onOpen(tp)}>{v.job ? "Open in Agents" : "Open in chat"} <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3" /></svg></button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              ); })}
          </AnimatePresence>
        </ul>
      )}
      </motion.div>
    </motion.div>
  );
}
// "Dustin and Rick own it." → "Dustin and Rick" (who a Google Chat handoff would bring in)
function ownersIn(t) {
  const r = (t || "").match(/(?:^|[.!?]\s+|\n)((?:[A-Z][A-Za-z]+)(?: [A-Z][A-Za-z]+)?(?: and (?:[A-Z][A-Za-z]+)(?: [A-Z][A-Za-z]+)?)?) owns? (?:it|this|the)/);
  return r ? r[1] : null;
}
// a follow-up on a chart that's still attached: answer the part asked (who owns it, what's driving it), not the whole read again
function followOn(ex, q) {
  const paras = ex.text.split(/\n\n+/).filter(Boolean), s = (q || "").toLowerCase();
  const pick = /who|own|responsib/.test(s) ? paras.find((p) => /\bowns?\b/.test(p))
    : /what is|what's this|mean|defin/.test(s) ? paras[paras.length - 1]
    : /target|pace|plan|on track|behind|ahead/.test(s) ? paras[0] : paras[1] || paras[0];
  return { ...ex, steps: [`Reading ${ex.topic} again`], text: pick || paras[1] || paras[0], card: null };
}
export function explainFor(qt, metrics = []) {
  const cc = !qt.title && Object.values(ANSWERS).map((a) => a.card).find((cd) => cd && (qt.t || "").startsWith(cd.title));
  const parts = cc ? [cc.title, ...qt.t.slice(cc.title.length).split(" · ").filter(Boolean)] : (qt.t || "").split(" · ");
  const title = qt.title || parts[0], point = qt.point || (qt.k === "point" ? parts.slice(1).join(" · ") : null), big = qt.big || (qt.k === "chart" ? parts[1] : null);
  // pointing at one bar: that reading comes first
  const at = point ? `That point: ${point.replace(/ · /g, ", ")}.` : "";
  const out = (paras) => ({ topic: title, explain: true, steps: [`Reading ${title}`, "Checking it against target", "Finding what moved it"], text: [at, ...paras].filter(Boolean).join("\n\n"), follow: [] });
  // a key metric tile (Home or Company health)
  const m = metrics.find((x) => qt.id && x.id === qt.id) || (!qt.lane && metrics.find((x) => x.label === title));
  if (m && LEADS[m.id]) return out(LEADS[m.id]);
  if (LEADS[title]) return out(LEADS[title]);
  // a square in the Company health heatmap
  const lane = LANES.find((l) => l[0] === qt.lane) || (!qt.lane && LANES.find((l) => l[3].some((r) => r[0] === title)));
  const row = lane && lane[3].find((r) => r[0] === title);
  if (row) {
    const [n, v, p, s, foot] = row, [ln, , lp, rows] = lane, who = OWNERS[ln];
    const fm = (foot || "").match(/^(pace|target|ceiling) (.+)$/), kind = fm ? fm[1] : null, goal = fm ? fm[2] : null;
    const DEF_ALT = { GRR: "How much of last year's revenue from existing customers we kept, ignoring growth." };
    const def = (DEF_ALT[n] || DESC[n] || "").replace(/ Lower is better\.$/, "");
    if (v === "—" || s === "No data") return out([`${n} has no live data yet, so North can't tell you whether it's on track.`, `It needs a data connection before it can be scored. ${owns(who)} the ${ln} lane.`, def && `It measures ${lc(def)}`]);
    if (p == null) return out([kind ? `${n} is at ${v} against a ${goal} ${kind}, but it isn't scored yet because there's no pace set for it.` : `${n} is at ${v}, with no target set, so it isn't scored.`,
      `${owns(who)} ${ln}.${def ? ` It measures ${lc(def)}` : ""}`]);
    const scored = rows.filter((r) => r[2] != null), worst = scored.reduce((a, r) => (r[2] < a[2] ? r : a), scored[0]);
    const g = gapText(v, goal), ceiling = kind === "ceiling", lowerBetter = /Lower is better/.test(DESC[n] || "") || / under$/.test(s);
    const gap = g ? `, ${g}` : "";
    let lead;
    if (ceiling) lead = p < 85 ? `${n} is over its ceiling: ${v} against ${goal}${g ? `, ${g.replace(" over", "")} too long` : ""}.` : `${n} is well under its ceiling: ${v} against ${goal}.`;
    else if (lowerBetter) lead = p >= 100 ? `${n} is lower than expected, which is good: ${v} against a ${goal} ${kind}${g ? `, ${g.replace(" short", " less")}` : ""}.` : `${n} is running high: ${v} against a ${goal} ${kind}${g ? `, ${g.replace(" over", " more")}` : ""}.`;
    else if (p >= 110) lead = `${n} is ahead of ${kind}: ${v} against ${goal}${gap} (${s}).`;
    else if (p >= 95) lead = `${n} is on ${kind}: ${v} against ${goal} (${s}).`;
    else if (p >= 85) lead = `${n} is close to ${kind} but not there: ${v} against ${goal}${gap}.`;
    else if (p >= 70) lead = `${n} is behind ${kind}: ${v} against ${goal}${gap} (${s}).`;
    else lead = `${n} is off plan: ${v} against a ${goal} ${kind}${gap}. That's ${s} of ${kind}.`;
    // why: the known cause, or where it sits in its lane — skipped when there's nothing worth saying
    const why = CELL_WHY[`${ln}|${n}`]
      || (worst === row && lp < 85 ? `It's the weakest number in ${ln}, and the main reason the lane is at ${lp}%.`
      : p >= 110 && lp < 85 ? `It's a bright spot in ${ln}, a lane at ${lp}% overall.`
      : lp < 85 && worst !== row ? `${ln} is at ${lp}% overall; the bigger miss there is ${worst[0]} (${worst[3]}).` : "");
    return out([lead, why, `${owns(who)} ${ln}.${def ? ` It measures ${lc(def)}` : ""}`]);
  }
  // a chart North drew in this thread
  const c = cc || Object.values(ANSWERS).map((a) => a.card).find((cd) => cd && cd.title === title);
  if (c) return out([`${c.title} is at ${c.big}${c.chip ? `, ${lc(c.chip[1])}` : ""}.`, c.sub]);
  return out([`${DESC[title] || `This is ${title}.`}${big ? ` It's at ${big}.` : ""}`]);
}

// ------------------------------------------------------------------ chart cards (Figma 733:325166 · Orin charts)
// Built to the Figma nodes, not by eye: 556 card, 20 inset, 22/28 title, 14/20 sub, 72 number with a 24px chip,
// the dot field from y88, and the 80px action tray whose stacked inner shadows sit it under the chart.
// Every card is live: hover reads a value, click hands that value to North, and ⤢ opens it full screen.
const GRAD = [[255, 114, 92], [109, 79, 194], [9, 132, 134]]; // coral → purple → teal (ticks)
const lerpHex = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };
const tickColor = (t) => { const [x, y, k] = t < 0.5 ? [GRAD[0], GRAD[1], t / 0.5] : [GRAD[1], GRAD[2], (t - 0.5) / 0.5]; return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`; };
const attach = (t, k = "point") => window.dispatchEvent(new CustomEvent("north:attach", { detail: { k, t } }));
function useW(ref, init = 516) {
  const [w, setW] = useState(init);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(Math.round(el.getBoundingClientRect().width))); ro.observe(el); setW(Math.round(el.getBoundingClientRect().width)); return () => ro.disconnect(); }, []);
  return w;
}
function Chip({ dir, text }) {
  return <span className={`cc-chip ${dir === "up" ? "is-up" : "is-down"}`}>{dir === "up" ? "↗" : "↘"} {text}</span>;
}
function Head({ c, onExpand, full }) {
  return (
    <div className="cc-head">
      <div><h4>{c.title}</h4><p>{c.sub}</p></div>
      {c.pin && <span className="cc-pin" title="Pin to Home"><PinIcon id={c.pin} /></span>}
      {onExpand && (
        <button className="ibtn cc-x" aria-label={full ? "Close full screen" : "Open full screen"} title={full ? "Close (Esc)" : "Open full screen"} onClick={onExpand}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {full ? <path d="M6.5 2.5v4h-4M9.5 13.5v-4h4M6.5 6.5 2.5 2.5M9.5 9.5l4 4" /> : <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" />}
          </svg>
        </button>
      )}
    </div>
  );
}
function Tray({ t, onAct, loading }) {
  if (!t && !loading) return null;
  return (
    <div className={`cc-tray${loading ? " is-loading" : ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {loading ? (
          <motion.span key="l" className="cc-tray-l cc-load" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            <i className="cc-shim" style={{ width: 210, height: 14 }} /><i className="cc-shim" style={{ width: 150, height: 10 }} />
          </motion.span>
        ) : (
          <motion.span key="t" className="cc-tray-l" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><b>{t.title}</b><small>{t.sub}</small></motion.span>
        )}
      </AnimatePresence>
      {loading && <i className="cc-shim cc-shim-btn" />}
      {!loading && t && t.done && <motion.em className="cc-tray-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t.done}</motion.em>}
      {!loading && t && !t.done && <motion.button className="cc-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.05 }} whileTap={{ scale: 0.97 }} onClick={() => onAct(t)}>{t.button}</motion.button>}
    </div>
  );
}
// rows under a chart: label · 14 small ticks · value. Hovering a row lights its share of the chart above.
function TickRows({ rows, p, colors, hov, setHov, title }) {
  const max = Math.max(...rows.map((r) => r[1]));
  return (
    <div className="cc-trows" onPointerLeave={() => setHov(null)}>{rows.map(([l, f, v], r) => {
      const k = Math.max(1, Math.round((f / max) * 14)), rp = win(p, r * 0.08, 1), cols = colors(r, k);
      return (
        <div className={`cc-trow${hov != null && hov !== r ? " is-dim" : ""}${hov === r ? " is-on" : ""}`} key={l} onPointerEnter={() => setHov(r)} onClick={() => attach(`${title} · ${l} · ${v}`)}>
          <span>{l}</span>
          <span className="cc-mini">{Array.from({ length: 14 }, (_, i) => { const lit = i < k && stag(rp, i, 14, 0.6) > 0.5; return <i key={i} className={lit ? "on grain" : ""} style={{ "--i": i, ...(lit ? { backgroundColor: cols[i], borderColor: "transparent" } : null) }} />; })}</span>
          <b>{v}</b>
        </div>
      );
    })}</div>
  );
}

// trend · big number: 2px spikes on a 5.6 pitch, lavender → purple → ink.
// The flag is the cursor: it rests on what moved the line (coral) and follows the pointer to read any day (navy),
// leaving a coral stub where the event was. One marker, one behaviour — no separate tooltip.
let _cv; const textW = (s, font) => { _cv = _cv || document.createElement("canvas").getContext("2d"); _cv.font = font; return _cv.measureText(s).width; };
export const CARD = { flag: { type: "spring", stiffness: 520, damping: 44 }, morph: { type: "easing", duration: 0.45, ease: [0.5, 0, 0.15, 1] } }; // Chat keeps this in step with DialKit
export function TrendPlot({ c, p, H = 102, mini = false, ghost = false }) {
  const gid = useMemo(() => "cc-spk-" + Math.random().toString(36).slice(2, 8), []); // its own gradient: several plots on screen never borrow a hidden one
  const box = useRef(null), W = useW(box);
  const n = mini ? Math.max(24, Math.floor((W + 2) / 4.2)) : 92, FLAG = mini ? 0 : 22; // fixed count: a resize scales the spikes, it never reshuffles them
  const vals = useMemo(() => Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * (c.series.length - 1), a = Math.floor(t), b2 = Math.min(c.series.length - 1, a + 1), k = t - a;
    const u = (i / (n - 1)) * 96; // ~one jitter step per spike at chat width; continuous, so more spikes just sample it finer
    return c.series[a] + (c.series[b2] - c.series[a]) * k + Math.sin(u * 1.7) * 1.2 + Math.sin(u * 0.53) * 1.6;
  }), [n, c]);
  const max = Math.max(...vals), pitch = W / n, sp = win(p, 0.08, 0.72), bw = mini ? 1.5 : Math.max(1.2, Math.min(3.4, pitch * 0.36));
  const markI = c.mark ? Math.round((c.mark.at / (c.series.length - 1)) * (n - 1)) : null;
  const [hov, setHov] = useState(null);
  const dayOf = (i) => `Oct ${1 + Math.floor((i / (n - 1)) * 26)}`;
  const valOf = (i) => `$${(vals[i] * 0.31).toFixed(1)}K`;
  const move = (e) => {
    if (mini) return; const r = e.currentTarget.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
    const i = clamp(Math.floor(((e.clientX - r.left) * sx) / pitch), 0, n - 1), top = H - (vals[i] / max) * (H - FLAG - 6);
    setHov((e.clientY - r.top) * sy >= top - 6 ? i : null);
  };
  const ff = useMemo(() => getComputedStyle(document.body).fontFamily, []);
  const at = hov ?? markI, reading = hov != null && hov !== markI;
  const lab = at == null ? "" : reading ? `${dayOf(hov)} · ${valOf(hov)}` : c.mark.label, ask = hov != null ? "Ask ›" : "";
  const fw = at == null ? 0 : Math.ceil(textW(lab, `500 12px ${ff}`) + (ask ? textW(ask, `500 12px ${ff}`) + 10 : 0) + 15);
  const xOf = (i) => i * pitch + pitch / 2, ax = at == null ? 0 : xOf(at), side = ax - fw >= 0 ? -fw : 0;
  const col = reading ? NAVY : CORAL, T = CARD.flag, show = win(p, 0.55, 0.8);
  return (
    <div className={`cc-plot${mini ? " is-mini" : ""}`} ref={box} style={{ height: H }} onPointerMove={move} onPointerLeave={() => setHov(null)}
      onClick={(e) => { if (hov != null) { e.stopPropagation(); attach(reading ? `${c.title} · ${dayOf(hov)} · ${valOf(hov)}` : `${c.title} · ${c.mark.label}`); } }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${c.title}, daily`}>
        <defs><linearGradient id={gid} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#d3c8f3" /><stop offset=".55" stopColor="#7a5cd0" /><stop offset="1" stopColor="#3b2a86" /></linearGradient></defs>
        <g filter="url(#grain)">{vals.map((v, i) => {
          const t0 = stag(sp, i, n, 0.6), t = 1 - Math.pow(1 - t0, 3), h = (v / max) * (H - FLAG - 6) * t;
          return <rect key={i} x={xOf(i) - bw / 2} y={H - h} width={bw} height={h} fill={hov === i ? NAVY : `url(#${gid})`} opacity={hov == null || hov === i ? 1 : 0.4} style={{ transition: "opacity .15s" }} />;
        })}</g>
        {ghost && vals.map((_, i) => { const h = (0.32 + 0.1 * Math.sin(i * 0.9) + 0.06 * Math.sin(i * 0.31)) * (H - FLAG - 6); return <rect key={"g" + i} className="cc-ghost" x={xOf(i) - bw / 2} y={H - h} width={bw} height={h} style={{ "--i": i }} />; })}
        <rect x="0" y={H - 0.5} width={W} height="0.5" fill="#e2e2e2" />
        {markI != null && <motion.g initial={false} animate={{ opacity: reading ? show : 0 }} transition={{ duration: 0.16 }}>
          <rect x={xOf(markI) - 0.5} y="0" width="1" height={H} fill={CORAL} opacity=".45" />
          {!mini && <rect x={xOf(markI) - 3} y="0" width="6" height="6" fill={CORAL} />}
        </motion.g>}
        {at != null && (
          <motion.g initial={false} animate={{ x: ax }} transition={T} style={{ opacity: show, pointerEvents: "none" }}>
            <rect x="-0.5" y="0" width="1" height={H} fill={col} style={{ transition: "fill .18s" }} />
            {!mini && <motion.g initial={false} animate={{ x: side }} transition={T}>
              <motion.rect y="0" height={FLAG} initial={false} animate={{ width: fw }} transition={T} fill={col} style={{ transition: "fill .18s" }} />
              <text x="7.5" y="15" fontSize="12" fontWeight="500" fill="#fefbf9">{lab}{ask && <tspan dx="10" fillOpacity=".62">{ask}</tspan>}</text>
            </motion.g>}
          </motion.g>
        )}
      </svg>
    </div>
  );
}
const trendRowColors = () => Array(14).fill(0).map((_, i) => `rgb(${[109 + (211 - 109) * (1 - i / 13) * 0.55, 79 + (200 - 79) * (1 - i / 13) * 0.55, 194 + (243 - 194) * (1 - i / 13) * 0.55].map(Math.round).join(",")})`);
function TrendCard({ c, p, onAct, onExpand, full, rich, loading }) {
  const [rowHov, setRowHov] = useState(null);
  const H = useSpringTo(full ? 240 : rich ? 140 : 102, CARD.morph);
  return (
    <div className={`cc${rich ? " is-flat" : ""}${loading ? " is-loading" : ""}`}>
      <div className="cc-body">
        <Head c={c} onExpand={onExpand} full={full} />
        <div className="cc-graph">
          <div className="cc-big"><span>{c.big}</span><Chip dir={c.chip[0]} text={c.chip[1]} /></div>
          <TrendPlot c={c} p={p} H={Math.round(H)} ghost={!!loading} />
        </div>
        {c.rows && <div className="cc-break"><h5 className="cc-h5">{c.rowsTitle}</h5>
          <TickRows rows={c.rows} p={win(p, 0.12, 0.9)} hov={rowHov} setHov={setRowHov} title={c.title} colors={trendRowColors} /></div>}
        <AnimatePresence initial={false}>{full && <More key="more" c={c} p={p} />}</AnimatePresence>
      </div>
      <Tray t={c.tray} onAct={onAct} loading={loading} />
    </div>
  );
}

// ticks · progress: the board's tick chart, not a lookalike — 55 ticks, 9 wide on a 13.22 pitch, 96 tall in a 723 frame
// (visuals.jsx BookedTicks), rx 1, grain on every lit tick, paper + 0.5 line for the empty ones. It scales with the card.
// Lit ticks carry one coral → purple → teal run; each row below owns its stretch of that run.
// Hover works like the sidebar: the highlight starts at the tick under the cursor and spreads out to the ends of
// that stretch, each tick growing up from the baseline as it's reached; everything else falls back.
const TK = { W: 723, N: 55, tw: 9, th: 96 }; TK.pitch = (TK.W - TK.tw) / (TK.N - 1);
function TicksPlot({ c, p, mini = false, lead = null }) {
  const { W: VW, N, tw, pitch } = TK, th = TK.th;
  const on = Math.round(c.fill * N), tp = win(p, 0.08, 0.66);
  const [hov, setHov] = useState(null), [org, setOrg] = useState(0);
  const tot = c.rows.reduce((a, r) => a + r[1], 0);
  let acc = 0; const span = c.rows.map(([, f]) => { const a = Math.round((acc / tot) * on); acc += f; return [a, Math.round((acc / tot) * on)]; });
  const rowOf = (i) => span.findIndex(([a, b]) => i >= a && i < b);
  const colors = (r) => { const [a, b] = span[r]; return Array.from({ length: 14 }, (_, i) => tickColor((a + ((b - a - 1) * i) / 13) / (N - 1))); };
  const tickAt = (e) => { const r = e.currentTarget.getBoundingClientRect(); return clamp(Math.round((((e.clientX - r.left) / r.width) * VW - tw / 2) / pitch), 0, N - 1); };
  const fromRow = (r) => { if (r != null) setOrg(span[r][0]); setHov(r); };
  const ticks = (
    <div className={`cc-ticks${mini ? " is-mini" : ""}`} onPointerLeave={() => setHov(null)}
      onPointerMove={(e) => { if (mini) return; const i = tickAt(e), r = i < on ? rowOf(i) : null; if (r !== hov) { if (r != null) setOrg(i); setHov(r); } }}
      onClick={(e) => { if (mini || hov == null) return; e.stopPropagation(); attach(`${c.title} · ${c.rows[hov][0]} · ${c.rows[hov][2]}`); }}>
      <svg viewBox={`0 0 ${VW} ${th}`} preserveAspectRatio={mini ? "none" : "xMidYMid meet"} role="img" aria-label={c.title}>
        {Array.from({ length: N }, (_, i) => {
          const x = i * pitch, f = i < on ? stag(tp, i, N, 0.7) : 0, g = 1 - Math.pow(1 - f, 3), done = f > 0.5, r = rowOf(i), mine = hov != null && done && r === hov;
          const cls = `cc-tk${mine ? " is-up" : ""}${hov != null && !mine ? " is-dim" : ""}`, d = { "--d": Math.abs(i - org) };
          return (
            <g key={i}>
              {f < 1 && <rect x={x + 0.25} y="0.25" width={tw - 0.5} height={th - 0.5} rx="1" fill={C.paper} stroke={C.line} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />}
              {f > 0 ? <rect className={cls} style={d} x={x} y={th - th * g} width={tw} height={th * g} rx="1" fill={tickColor(i / (N - 1))} filter="url(#grain)" />
                : <rect className={cls} style={d} x={x + 0.25} y="0.25" width={tw - 0.5} height={th - 0.5} rx="1" fill="none" />}
            </g>
          );
        })}
      </svg>
    </div>);
  return (
    <>
      {mini ? ticks : <div className="cc-graph">{lead}{c.goal ? <div className="cc-goalwrap"><span className="cc-goal"><i />{c.goal}</span>{ticks}</div> : ticks}</div>}
      {!mini && <div className="cc-break"><TickRows rows={c.rows} p={win(p, 0.12, 0.9)} hov={hov} setHov={fromRow} title={c.title} colors={colors} /></div>}
    </>
  );
}
function TicksCard({ c, p, onAct, onExpand, full, rich, loading }) {
  return (
    <div className={`cc${rich ? " is-flat" : ""}${loading ? " is-loading" : ""}`}>
      <div className="cc-body">
        <Head c={c} onExpand={onExpand} full={full} />
        <TicksPlot c={c} p={p} lead={<div className="cc-big is-ticks"><span>{c.big}</span><Chip dir={c.chip[0]} text={c.chip[1]} /></div>} />
        <AnimatePresence initial={false}>{full && <More key="more" c={c} p={p} />}</AnimatePresence>
      </div>
      <Tray t={c.tray} onAct={onAct} loading={loading} />
    </div>
  );
}

// radial bars · split: a thick ring cut into ~94 wedges (the Figma ring is a 66.8 stroke on r100, dashed 5.39 / 1.28);
// each part takes its run of wedges clockwise from twelve o'clock, the rest stays #f3f1ef.
// Hover a part or its key row: that part's wedges each grow outward from their inner edge in a clockwise ripple
// (nothing lifts), everything else fades back. The key carries the share and owner; no highlight box.
function RingPlot({ c, p, mini = false }) {
  const N = 94, R = 100, SW = 66.77, ri = R - SW / 2, ro = R + SW / 2, gap = 1.28 / R, step = (Math.PI * 2) / N, sp = win(p, 0.05, 0.8);
  const [hov, setHov] = useState(null), [org, setOrg] = useState(0);
  const fromKey = (k) => { setOrg(k >= 0 ? parts[k].a : restA); setHov(k); };
  let acc = 0; const parts = c.parts.map(([l, v, col, owner]) => { const a = Math.round((acc / c.whole) * N); acc += v; return { l, v, col, owner, a, b: Math.round((acc / c.whole) * N) }; });
  const partOf = (i) => parts.findIndex((q) => i >= q.a && i < q.b);
  // one wedge drawn pointing straight up, then rotated into place, so scaleY grows it along its own radius
  const WEDGE = useMemo(() => {
    const h = (step - gap) / 2, P = (r, a) => `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
    return `M${P(ri, -h)}L${P(ro, -h)}A${ro} ${ro} 0 0 1 ${P(ro, h)}L${P(ri, h)}A${ri} ${ri} 0 0 0 ${P(ri, -h)}Z`;
  }, []);
  const fmt = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}M` : `$${Math.round(v)}K`);
  const restV = c.whole - parts.reduce((t, q) => t + q.v, 0), restA = parts.length ? parts[parts.length - 1].b : 0;
  return (
        <div className={`cc-ring${mini ? " is-mini" : ""}`} onPointerLeave={() => setHov(null)}>
          <svg viewBox={`${-ro - 14} ${-ro - 14} ${2 * ro + 28} ${2 * ro + 28}`} role="img" aria-label={c.title}
            onPointerMove={(e) => {
              if (mini) return; const b = e.currentTarget.getBoundingClientRect(), s = b.width / (2 * ro + 28);
              const dx = (e.clientX - b.left) / s - (ro + 14), dy = (e.clientY - b.top) / s - (ro + 14), rr = Math.hypot(dx, dy);
              if (rr < ri - 2 || rr > ro + 16) { if (hov != null) setHov(null); return; }
              const i = Math.floor((((Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * N) % N, k = partOf(i);
              if (k !== hov) { setOrg(i); setHov(k); }
            }}>
            <circle r={ri + SW / 2 + 0.5} fill="#fefbf9" />
            {[...parts.map((q, k) => k), -1].map((k) => (
              <g key={k} className={`cc-ring-part${hov === k ? " is-on" : ""}${hov != null && hov !== k ? " is-dim" : ""}`} filter="url(#grain)"
                onClick={() => attach(k >= 0 ? `${c.title} · ${parts[k].l} · ${fmt(parts[k].v)}` : `${c.title} · ${c.rest ? c.rest[0] : "the rest"} · ${fmt(restV)}`)}>
                {Array.from({ length: N }, (_, i) => {
                  if (partOf(i) !== k) return null;
                  const t = stag(sp, i, N, 0.7), e = 1 - Math.pow(1 - t, 3), col = k >= 0 ? lerpHex("#f3f1ef", parts[k].col, Math.min(1, t * 1.6)) : "#f3f1ef";
                  return <g key={i} transform={`rotate(${((i + 0.5) * 360) / N})`}><g style={{ transform: `scaleY(${0.35 + 0.65 * e})`, transformBox: "fill-box", transformOrigin: "50% 100%" }}><path className="cc-wedge" d={WEDGE} fill={col} style={{ "--d": Math.abs(i - org) }} /></g></g>;
                })}
              </g>
            ))}
          </svg>
          <ul className="cc-legend">{parts.map((q, i) => (
            <li key={q.l} className={hov === i ? "is-on" : hov != null ? "is-dim" : ""} style={{ opacity: win(p, 0.5 + i * 0.08, 0.8 + i * 0.05) }} onPointerEnter={() => fromKey(i)} onClick={() => attach(`${c.title} · ${q.l} · ${fmt(q.v)}`)}>
              <i className="grain" style={{ backgroundColor: q.col }} /><b>{fmt(q.v)}</b><u /><span>{q.l}</span>
              <em>{Math.round((q.v / c.whole) * 100)}%{q.owner ? ` · ${q.owner}` : ""}</em>
            </li>
          ))}
          {c.rest && <li className={`is-rest${hov === -1 ? " is-on" : hov != null ? " is-dim" : ""}`} onPointerEnter={() => fromKey(-1)}><i className="grain" /><b>{fmt(restV)}</b><u /><span>{c.rest[0]}</span><em>{Math.round((restV / c.whole) * 100)}%</em></li>}
          </ul>
        </div>
  );
}
function RingCard({ c, p, onAct, onExpand, full, rich, loading }) {
  return (
    <div className={`cc${rich ? " is-flat" : ""}${loading ? " is-loading" : ""}`}>
      <div className="cc-body">
        <Head c={c} onExpand={onExpand} full={full} />
        <div className="cc-graph"><RingPlot c={c} p={p} /></div>
        <AnimatePresence initial={false}>{full && <More key="more" c={c} p={p} />}</AnimatePresence>
      </div>
      <Tray t={c.tray} onAct={onAct} loading={loading} />
    </div>
  );
}
// only when a card is open full screen: the numbers behind the chart, then the rows they came from
function More({ c, p }) {
  const m = c.more; if (!m) return null;
  return (
    <motion.div className="cc-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
      <div className="cc-stats" style={{ "--i": 0 }}>{m.stats.map(([l, v, sub]) => <div key={l}><span>{l}</span><b>{v}</b><small>{sub}</small></div>)}</div>
      <table className="cc-table">
        <thead><tr style={{ "--i": 1 }}>{m.cols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{m.rows.map((r, k) => <tr key={r[0]} style={{ "--i": 2 + k }} onClick={() => attach(`${c.title} · ${r[0]}`)}>{r.map((v, i) => <td key={i} className={/^−/.test(v) ? "is-neg" : /^\+/.test(v) ? "is-pos" : ""}>{v}</td>)}</tr>)}</tbody>
      </table>
      {m.note && <p className="cc-note" style={{ "--i": 2 + m.rows.length }}>{m.note}</p>}
    </motion.div>
  );
}
export function ChatVisual({ c, p = 1, mini = false }) {
  // the click that opened the tile lands on whatever is now under the cursor; don't let it ask about a bar
  const t0 = useRef(Date.now());
  const guard = (e) => { if (!mini && Date.now() - t0.current < 600) { e.stopPropagation(); e.preventDefault(); } };
  const v = c.kind === "trend" ? <TrendPlot c={c} p={p} H={mini ? 34 : 220} mini={mini} /> : c.kind === "ticks" ? <TicksPlot c={c} p={p} mini={mini} /> : <RingPlot c={c} p={p} mini={mini} />;
  return <div className={`cc-embed${mini ? " is-mini" : ""}`} onClickCapture={guard}>{v}{!mini && c.kind === "trend" && c.rows && <div className="cc-break"><h5 className="cc-h5">{c.rowsTitle}</h5><EmbedRows c={c} p={p} /></div>}</div>;
}
function EmbedRows({ c, p }) { const [h, setH] = useState(null); return <TickRows rows={c.rows} p={win(p, 0.4, 1)} hov={h} setHov={setH} title={c.title} colors={trendRowColors} />; }
// a chart from the product itself (the board's charts, ARR movement) inside the chat's card: same chart, same build-on
const VIZ = { booked: BookedTicks, winrate: WinRings, logos: LogosArea, demo: DemoRuler, exp: ExpansionLines, ttv: TtvLollipop };
// the line chart in a card: its two numbers above (done in navy, pace in coral, matching the lines), the chart full width under them
function LinesWithHead({ p, d, narrow }) {
  const cfg = d || { big: [734.0, "K", 1, "booked"], sub: [1.01, "M", 2, "pace by now"] };
  const n = (x) => `$${x[0].toFixed(x[2])}${x[1]}`;
  return (
    <>
      <div className="cc-lines-head"><b>{n(cfg.big)}</b><span>{cfg.big[3]}</span><i>{n(cfg.sub)}</i><em>{cfg.sub[3]}</em></div>
      <ExpansionLines p={p} d={d || undefined} narrow={narrow} bare />
    </>
  );
}
function VizPlot({ c, p }) {
  // narrow card: a label that would land on top of one already placed is hidden (wide again → all back)
  const box = useRef(null), W = useW(box), done = p >= 1;
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const texts = [...el.querySelectorAll("svg text")]; texts.forEach((t) => (t.style.visibility = ""));
    if (W > 470 || !done) return;
    // headline type is never hidden; only the small labels (axis ticks, captions) give way when they'd collide
    const small = (t) => parseFloat(t.getAttribute("font-size") || "99") <= 13;
    // big type's box carries empty leading above the digits; trim it so a caption sitting over a number isn't counted as a hit
    const kept = texts.filter((t) => !small(t)).map((t) => { const r = t.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top + r.height * 0.24, bottom: r.bottom - r.height * 0.12, width: r.width }; }).filter((r) => r.width);
    texts.filter(small).forEach((t) => {
      const r = t.getBoundingClientRect(); if (!r.width) return;
      const hit = kept.some((k) => r.left < k.right + 2 && r.right > k.left - 2 && r.top < k.bottom - 1 && r.bottom > k.top + 1);
      if (hit) t.style.visibility = "hidden"; else kept.push(r);
    });
  }, [W, done]);
  const V = VIZ[c.viz];
  return <div ref={box} className={`cc-viz${c.viz === "arr" ? " is-arr" : ""}`}>{c.viz === "arr" ? <ArrChart M={CARD.M} p={p} foot={W < 470 ? 38 : 20} /> : c.viz === "lines" || c.viz === "exp" ? <LinesWithHead p={p} d={c.lines} narrow={W < 470} /> : c.viz === "ruler" ? <DemoRuler p={p} d={c.ruler} /> : V ? <V p={p} /> : null}</div>;
}
function VizCard({ c, p, onAct, onExpand, full, rich }) {
  return (
    <div className={`cc is-viz${rich ? " is-flat" : ""}`}>
      <div className="cc-body">
        <Head c={c} onExpand={onExpand} full={full} />
        <div className="cc-graph"><VizPlot c={c} p={p} /></div>
        <AnimatePresence initial={false}>{full && c.more && <More key="more" c={c} p={p} />}</AnimatePresence>
      </div>
      <Tray t={c.tray} onAct={onAct} />
    </div>
  );
}
// a table answer: the family table (the one a card opens into), in the card itself. Click a row and that row opens in the
// same card: its numbers in the stats strip, where it stands, and its own next step in the tray. The back button returns.
const ST_COL = { Onboarding: PURPLE, Live: TEAL, "At risk": "#b1042f" };
const BACK = <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.2 2 3.2 5l3 3" /></svg>;
function TableCard({ c, onAct, onExpand, full, rich }) {
  const T = c.table, [sel, setSel] = useState(null), r = sel != null ? T.rows[sel] : null, d = r && c.detail ? c.detail[r[0]] : null;
  const go = (k) => (e) => { e.stopPropagation(); setSel(k); };
  const tr = { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -10, transition: { duration: 0.12 } }, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } };
  return (
    <div className={`cc is-table${rich ? " is-flat" : ""}`}>
      <div className="cc-body">
        <AnimatePresence mode="wait" initial={false}>{d ? (
          <motion.div key={r[0]} {...tr}>
            <button className="cc-back" onClick={(e) => { e.stopPropagation(); setSel(null); }}>{BACK}{c.title}</button>
            <Head c={{ title: r[0], sub: d.sub }} />
            <div className="cc-more is-in">
              <div className="cc-stats">{d.stats.map(([l, v, sub]) => <div key={l}><span>{l}</span><b style={l === "Where it stands" && ST_COL[v] ? { color: ST_COL[v] } : null}>{v}</b><small>{sub}</small></div>)}</div>
              <p className="cc-says">{d.note}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="all" {...tr}>
            <Head c={c} onExpand={onExpand} full={full} />
            <div className="cc-more is-in">
              <table className="cc-table">
                <thead><tr>{T.cols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{T.rows.map((row, k) => <tr key={row[0]} tabIndex={0} onClick={go(k)} onKeyDown={(e) => e.key === "Enter" && go(k)(e)}>{row.map((v, i) => <td key={i}>{i === T.status ? <span className="cc-st"><i style={{ background: ST_COL[v] || NAVY }} />{v}</span> : v}</td>)}</tr>)}</tbody>
              </table>
              {T.note && <p className="cc-note">{T.note}</p>}
            </div>
          </motion.div>
        )}</AnimatePresence>
      </div>
      <Tray t={d ? d.tray : c.tray} onAct={onAct} />
    </div>
  );
}
// a page chart with no chat card of its own: its own chart, drawn by the page, inside the same card as every chat chart
function PageCard({ c, p, rich }) {
  const ref = useRef(null), [w, setW] = useState(0);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const f = () => setW(Math.round(el.clientWidth)); f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, []);
  return (
    <div className={`cc is-viz is-page${rich ? " is-flat" : ""}`}>
      <div className="cc-body"><Head c={c} /><div className="cc-graph" ref={ref}>{w > 0 && CARRY.render ? CARRY.render(c.id, w, p) : null}</div></div>
    </div>
  );
}
function Card(props) {
  const k = props.c.kind;
  return k === "trend" ? <TrendCard {...props} /> : k === "ticks" ? <TicksCard {...props} /> : k === "viz" ? <VizCard {...props} /> : k === "table" ? <TableCard {...props} /> : k === "page" ? <PageCard {...props} /> : <RingCard {...props} />;
}
const toCSV = (c) => {
  if (!c) return "";
  if (c.kind === "trend") return ["day,value", ...c.series.map((v, i) => `Oct ${i + 1},${v}`)].join("\n");
  if (c.kind === "viz") return `${c.title}\n${(c.more && c.more.rows ? [c.more.cols.join(","), ...c.more.rows.map((r) => r.join(","))] : []).join("\n")}`;
  if (c.kind === "table") return [c.table.cols.join(","), ...c.table.rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
  if (c.kind === "ticks") return ["lever,share,impact", ...c.rows.map(([l, f, v]) => `"${l}",${f},${v}`)].join("\n");
  return ["lane,gap_k", ...c.parts.map(([l, v]) => `"${l}",${v}`)].join("\n");
};

// ------------------------------------------------------------------ one North answer: thinking steps → streamed text → card → actions
function useStream(text, run, speed, armed = run) {
  const words = useMemo(() => (text || "").split(/(\s+)/), [text]);
  // armed: this answer will stream, so it starts empty (not "already complete") — otherwise its first frame reads as done
  const [n, setN] = useState(armed && !REDUCED ? 0 : words.length);
  useEffect(() => {
    if (REDUCED || (!run && !armed)) { setN(words.length); return; }
    if (!run) { setN(0); return; } // armed but not started yet: stays empty until it streams
    setN(0);
    let i = 0; const t = setInterval(() => { i += 2; setN(i); if (i >= words.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text, run]);
  return [words.slice(0, n).join(""), n >= words.length, words.length ? Math.min(1, n / words.length) : 1];
}
// one subject, one surface: while a piece of work is open beside the chat, what a question makes (a chart, a table) goes into
// that work, under what you asked, and draws itself in there; the chat keeps the words and a line pointing at where it went
export function DocCard({ c, k, live = true, delay = 0.3 }) {
  const p = useReplay(live ? `doc-${k}` : "still", { type: "easing", duration: 1.2, ease: [0.22, 1, 0.36, 1] }, { delay, reduced: REDUCED || !live });
  return <Card c={c} p={p} onAct={() => {}} rich />;
}
const addToJob = (jid, rec) => {
  const A = (window.__northAdded = window.__northAdded || {}); (A[jid] = A[jid] || []).push(rec);
  window.dispatchEvent(new CustomEvent("north:job-add", { detail: { id: jid, k: rec.k } }));
};
function JobRef({ r }) {
  return (
    <motion.button className="ch-jref" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => window.dispatchEvent(new CustomEvent("north:job-focus", { detail: { k: r.k } }))}>
      <span className="ch-jref-i" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2 10V6.5M4.7 10V3.5M7.3 10V5.5M10 10V2" /></svg></span>
      <span className="ch-jref-t"><b>{r.title}</b><small>{r.sub || "Added to the work"}</small></span>
      <svg className="ch-jref-a" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6h7M6.5 3l3 3-3 3" /></svg>
    </motion.button>
  );
}
// a chart arriving in the thread: it opens from nothing (so what's below slides down rather than jumps) and its parts rise in
// one after another (title, number, the chart drawing as it comes, then its rows and its action): one motion, not a pop
function CardIn({ show, live, children }) {
  const [done, setDone] = useState(!live);
  return (
    <motion.div className={live && !done ? "cc-enter" : undefined} initial={live ? { opacity: 0, height: 0 } : false}
      animate={show ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }} style={{ overflow: done ? "visible" : "hidden" }}
      transition={{ height: { duration: 0.55, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      onAnimationComplete={() => show && setDone(true)}>{children}</motion.div>
  );
}
// a huddle's chart: the same card, size, draw-in and expand as an answer's chart. It draws itself on once the agent's words are
// in; expanded, the one in the thread steps aside while the full card is open, and builds itself again when it lands back
function HudCard({ m, M, wide, isFull, onFull, onAct }) {
  const ref = useRef(null), live = useRef(!m.seen).current;
  const [go, setGo] = useState(!live);
  // the agent's words land over min(1600, words x 30)ms; the chart starts as the last of them do (no frame before that)
  useEffect(() => { if (!live) return; const words = (m.text || "").split(/\s+/).length, t = setTimeout(() => setGo(true), Math.min(1600, words * 30) + 120); return () => clearTimeout(t); }, []);
  const cp = useReplay(go ? `hud-${m.id}` : "wait", M.chat.draw, { reduced: REDUCED || !live });
  const [rb, setRb] = useState(0), was = useRef(false);
  useEffect(() => { if (was.current && !isFull) setRb((n) => n + 1); was.current = isFull; }, [isFull]);
  const rp = useReplay(rb && M.chat.rebuildOn ? `hrb-${m.id}-${rb}` : "none", M.chat.rebuild, { reduced: REDUCED || !rb || !M.chat.rebuildOn });
  const p = !go ? 0 : rb && M.chat.rebuildOn ? rp : cp;
  if (!go) return null;
  return (
    <CardIn show live={live}>
      <motion.div ref={ref} data-cc={m.id} initial={false} animate={{ opacity: isFull ? 0 : 1 }} transition={{ duration: 0 }}>
        <Card c={m.card} p={p} onAct={onAct} rich={wide} onExpand={m.card.more ? () => onFull(m.id, ref.current.getBoundingClientRect()) : null} />
      </motion.div>
    </CardIn>
  );
}
function Answer({ m, M, onAct, onFollow, toast, onDone, typing, isFull, onFull, watching, onWatch, wide, onBeside, reserve, onContinue, onSummarize, gcOn, hintWatch, hintGc, onHintOff, after, inWork = false }) {
  const actsRef = useRef(null); const [gcX, setGcX] = useState(null);
  useLayoutEffect(() => { if (!hintGc) return; const b = actsRef.current && actsRef.current.querySelector(".ch-gc"); if (b) setGcX(b.offsetLeft + b.offsetWidth / 2); }, [hintGc]);
  const cardRef = useRef(null);
  const live = useRef(m.fresh && !m.finished).current; // fixed at mount: an answer already read doesn't replay when the chat comes back, a new one always draws
  const [phase, setPhase] = useState(live ? "think" : "done");
  const [step, setStep] = useState(0);
  const a = m.answer;
  useEffect(() => {
    if (!live) return;
    const per = M.chat.think * 1000;
    // asked live: the steps keep walking (and hold on the last) until the reply arrives
    if (a.pending) { let i = 0; setStep(0); const t = setInterval(() => { i = Math.min(i + 1, a.steps.length - 1); setStep(i); }, per * 1.6); return () => clearInterval(t); }
    const ts = a.steps.map((_, i) => setTimeout(() => setStep(i), i * per));
    ts.push(setTimeout(() => setPhase("text"), a.steps.length * per));
    return () => ts.forEach(clearTimeout);
  }, [!!a.pending]);
  const [shown, textDone, textP] = useStream(a.text, phase !== "think" && live, M.chat.wordMs, live);
  // the chart comes in as the words finish (about 90% in), overlapping the last of them, not after a pause
  const near = phase === "done" || (phase === "text" && textP >= 0.9);
  // no skeleton phase: North thinks, writes, and then the chart arrives and draws itself on (like the charts on the pages)
  useEffect(() => { if (textDone && phase === "text") { setPhase("done"); onDone && onDone(); } }, [textDone, phase]);
  const [cardIn, setCardIn] = useState(!live);
  useEffect(() => { if (!near || cardIn) return; const t = setTimeout(() => setCardIn(true), 30); return () => clearTimeout(t); }, [near]);
  const [cardShow, setCardShow] = useState(!live);
  // show it once the thread has finished settling around it (so it never moves once you can see it); at most 0.9s
  useEffect(() => {
    if (!cardIn || cardShow) return;
    let raf = 0, t0 = performance.now(), calm = 0;
    const tick = () => {
      const l = cardRef.current && cardRef.current.closest(".chat-list");
      const gap = l ? l.scrollHeight - l.scrollTop - l.clientHeight : 0;
      calm = gap <= 1 ? calm + 1 : 0;
      if (calm >= 3 || performance.now() - t0 > 320) setCardShow(true); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [cardIn]);
  const cp = useReplay(cardShow ? `card-${m.id}` : "wait", M.chat.draw, { reduced: REDUCED || !live });
  // back from full screen: the chart builds itself again in the thread as the full card lands on it
  const [rb, setRb] = useState(0), wasFull = useRef(false);
  const [ret, setRet] = useState(false);
  useEffect(() => { if (wasFull.current && !isFull) { setRb((n) => n + 1); setRet(true); const t = setTimeout(() => setRet(false), 900); wasFull.current = isFull; return () => clearTimeout(t); } wasFull.current = isFull; }, [isFull]);
  const rp = useReplay(rb && M.chat.rebuildOn ? `rb-${m.id}-${rb}` : "none", M.chat.rebuild, { reduced: REDUCED || !rb || !M.chat.rebuildOn });
  const p = !cardShow ? 0 : rb && M.chat.rebuildOn ? rp : cp;
  const [menu, setMenu] = useState(null), [menuX, setMenuX] = useState(0);
  const copy = async () => {
    const body = `${a.text}${a.card ? `\n\n${a.card.title}\n${toCSV(a.card)}` : ""}`;
    try { await navigator.clipboard.writeText(body); toast("Copied the answer and its data"); } catch (e) { toast("Copy isn't allowed here — select the text instead"); }
  };
  const exp = (fmt) => {
    setMenu(null);
    const name = `${(a.card?.title || "north-answer").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${fmt === "Sheets" ? "csv" : fmt.toLowerCase()}`;
    try { const url = URL.createObjectURL(new Blob([toCSV(a.card)], { type: "text/csv" })); const el = document.createElement("a"); el.href = url; el.download = name; el.click(); setTimeout(() => URL.revokeObjectURL(url), 1500); } catch (e) {}
    toast(fmt === "Sheets" ? "Opened as a new Google Sheet" : `${name} exported`);
  };
  const share = async (to) => {
    setMenu(null);
    if (to === "text") { try { await navigator.clipboard.writeText(`${m.topic ? m.topic + "\n\n" : ""}${a.text}${a.card ? `\n\n${a.card.title}${a.card.big ? `: ${a.card.big}` : ""}` : ""}`); toast("Copied as text"); } catch (e) { toast("Copy isn't allowed here — select the text instead"); } }
    else if (to === "slide") toast(`Slide made · ${a.card ? a.card.title : m.topic || "this answer"} · opens in Google Slides`);
    else toast(`Deck made · ${m.topic || "this topic"} · opens in Google Slides`);
  };
  return (
    <div className="ch-msg ch-north-msg" style={reserve ? { minHeight: reserve } : undefined}>
      <div className="ch-north-body">
        {m.proactive && <span className="ch-update"><i />{a.update || "Update"} · {a.when || "just now"}</span>}
        {/* what North is doing, at the top of the answer while it works: Thinking → Writing → Pulling the data; folds away when done */}
        <AnimatePresence initial={false} mode="popLayout">
          {live && phase === "think" && (
            <motion.div key="st" className="nr-status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, transition: { duration: 0.18 } }}>
              <b>North</b>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={phase} className="nr-status-l" initial={{ opacity: 0, y: 6, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={toMotion(M.chat.swap)}>
                  {phase === "think" ? "Thinking" : "Writing"}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="popLayout" initial={false}>
                {phase === "think" && (
                  <motion.em key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={toMotion(M.chat.swap)}>
                    {a.steps[step]}
                  </motion.em>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        {phase !== "think" && (
          <motion.div key="ans" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {a.synth && <span className="nr-synth"><OrbStack size={14} M={M} /><b>Where they land</b></span>}
            <p className="ch-text">{shown}{!textDone && <i className="ch-caret" />}</p>
          </motion.div>
        )}
        {m.toJob && inWork && phase === "done" && <JobRef r={m.toJob} />}
        <AnimatePresence>
          {near && a.card && cardIn && !inWork && (
            <CardIn key="card" show={cardShow} live={live}>
              <motion.div ref={cardRef} data-cc={m.id} className={ret ? "is-return" : undefined} initial={false} animate={{ opacity: isFull ? 0 : 1 }} transition={{ duration: 0 }}>
                <Card c={a.card} p={p} onAct={onAct} rich={wide}
                  onExpand={a.card.more ? () => onFull(m.id, cardRef.current.getBoundingClientRect()) : null} />
              </motion.div>
            </CardIn>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === "done" && a.pinned && a.follow && a.follow.length > 0 && onFollow && (
            <motion.div key="opts" className="ch-opts" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}>
              {a.follow.map((f) => <motion.button key={f} variants={{ h: { opacity: 0, y: 4 }, s: { opacity: 1, y: 0 } }} onClick={() => onFollow(f)}>{f}</motion.button>)}
            </motion.div>
          )}
          {phase === "done" && (cardIn || !a.card) && !a.pinned && (
            <motion.div ref={actsRef} className="ch-acts" initial="h" animate={cardShow || !a.card ? "s" : "h"} variants={{ s: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }}>
              {/* icons on one line; hovering one opens it up to say what it does */}
              {[["Copy", copy], ["Export", (e) => { setMenuX(e.currentTarget.offsetLeft); setMenu(menu === "x" ? null : "x"); }], ["Share", (e) => { setMenuX(e.currentTarget.offsetLeft); setMenu(menu === "s" ? null : "s"); }]].map(([l, fn]) => {
                const on = (l === "Export" && menu === "x") || (l === "Share" && menu === "s");
                return <ActBtn key={l} M={M} label={l} icon={<ActIcon k={l} />} open={on} className={on ? "is-on" : ""} onClick={fn} />;
              })}
              {/* hand it to the people who own it: the talking happens in Google Chat, North comes along */}
              {onContinue && (
                <ActBtn key="gc" M={M} label="Google Chat" icon={<GcIcon />} open={!!gcOn || menu === "g"} className={`ch-gc${gcOn || menu === "g" ? " is-on" : ""}${hintGc && !gcOn ? " is-hint" : ""}`} aria-pressed={!!gcOn}
                  // one button: with more than one answer on this topic it asks what to send, otherwise it just drafts this one
                  onClick={(e) => { if (gcOn || !onSummarize) { setMenu(null); onContinue(); return; } setMenuX(e.currentTarget.offsetLeft); setMenu(menu === "g" ? null : "g"); }} />
              )}
              {onWatch && (
                <ActBtn key="watch" M={M} label={watching ? "Watching" : "Watch"} open={watching} className={`ch-watch${watching ? " is-watching" : ""}${hintWatch ? " is-hint" : ""}`} aria-pressed={watching} onClick={onWatch}
                  icon={<svg width="14" height="14" viewBox="0 0 16 16" fill={watching ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><circle cx="4.6" cy="10.6" r="2.6" /><circle cx="11.4" cy="10.6" r="2.6" /><path d="M7.2 10.2h1.6" fill="none" strokeLinecap="round" /><path d="M2.1 9.7 3.5 4.6a1.4 1.4 0 0 1 1.35-1.05h.35c.62 0 1.1.5 1.1 1.1V8.4" fill="none" strokeLinecap="round" /><path d="M13.9 9.7 12.5 4.6a1.4 1.4 0 0 0-1.35-1.05h-.35c-.62 0-1.1.5-1.1 1.1V8.4" fill="none" strokeLinecap="round" /></svg>} />
              )}
              <AnimatePresence>
                {hintGc && onContinue && !gcOn && gcX != null && (
                  <motion.div key="gtip" className="ob-tip is-left" role="note" style={{ left: 0, maxWidth: "calc(100% + 4px)", "--cx": `${gcX}px` }}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.14 } }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                    <span><b>Share in Google Chat</b>Send one answer, a chart or a whole topic to a channel or a DM. North drafts the message.</span>
                    <button className="ob-tip-x" aria-label="Dismiss" onClick={onHintOff}><svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l6 6M8 2 2 8" /></svg></button>
                  </motion.div>
                )}
                {hintWatch && onWatch && !watching && (
                  <motion.div key="wtip" className="ob-tip" role="note" initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.14 } }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                    <span><b>Watch {m.topic}</b>Get an update in this chat when the numbers change.</span>
                    <button className="ob-tip-x" aria-label="Dismiss" onClick={onHintOff}><svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l6 6M8 2 2 8" /></svg></button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {menu && (
                  <motion.div className="ch-menu" initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } }} transition={toMotion(M.chat.swap)}
                    style={{ left: menuX }}>
                    {menu === "g"
                      ? [["one", "This answer", "North drafts a message with it"], ["all", `All of ${m.topic}`, "North summarizes the whole topic"]].map(([k, l, d]) => <button key={k} onClick={() => { setMenu(null); k === "one" ? onContinue() : onSummarize(); }}><b>{l}</b><small>{d}</small></button>)
                      : menu === "x"
                      ? [["CSV", "Raw data"], ["PNG", "The chart as an image"], ["Sheets", "Live Google Sheet"]].map(([f, d]) => <button key={f} onClick={() => exp(f)}><b>{f}</b><small>{d}</small></button>)
                      : [["text", "Copy as text", "For a message or a doc"], ["slide", "Make a slide", "This answer, as one slide"], ["deck", "Make a deck", `All of ${m.topic || "this topic"}`]].map(([k, l, d]) => <button key={k} onClick={() => share(k)}><b>{l}</b><small>{d}</small></button>)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        {/* whatever North offers next (an agent to bring in) sits right under the actions, inside the answer's room — not below it */}
        <AnimatePresence>{phase === "done" && after}</AnimatePresence>
      </div>
    </div>
  );
}
// an answer action: just the icon; hovering (or focus, or while it's open) pushes the label out to the right of the icon,
// and everything after it slides over. Width animates to the label's real size, so the push is visible, not a pop.
// an agent's answer gets the same row as North's: copy, share, take it to Google Chat
function AgentActs({ m, M, toast, onContinue, gcOn, watching, onWatch }) {
  const copy = () => { try { navigator.clipboard.writeText(m.text || "").catch(() => {}); } catch (e) {} toast("Copied"); };
  return (
    <motion.div className="ch-acts ag-acts2" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}>
      <ActBtn M={M} label="Copy" icon={<ActIcon k="Copy" />} onClick={copy} />
      <ActBtn M={M} label="Share" icon={<ActIcon k="Share" />} onClick={() => toast("Shared with Heather and Caleb")} />
      {onContinue && <ActBtn M={M} label={m.agent === "north" ? "Google Chat" : `Take ${AGENTS[m.agent].n} to Google Chat`} icon={<GcIcon />} open={!!gcOn} className={`ch-gc${gcOn ? " is-on" : ""}`} aria-pressed={!!gcOn} onClick={onContinue} />}
      {onWatch && <ActBtn M={M} label={watching ? "Watching" : "Watch"} open={watching} className={`ch-watch${watching ? " is-watching" : ""}`} aria-pressed={watching} onClick={onWatch}
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill={watching ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><circle cx="4.6" cy="10.6" r="2.6" /><circle cx="11.4" cy="10.6" r="2.6" /><path d="M7.2 10.2h1.6" fill="none" strokeLinecap="round" /><path d="M2.1 9.7 3.5 4.6a1.4 1.4 0 0 1 1.35-1.05h.35c.62 0 1.1.5 1.1 1.1V8.4" fill="none" strokeLinecap="round" /><path d="M13.9 9.7 12.5 4.6a1.4 1.4 0 0 0-1.35-1.05h-.35c-.62 0-1.1.5-1.1 1.1V8.4" fill="none" strokeLinecap="round" /></svg>} />}
    </motion.div>
  );
}
function ActBtn({ icon, label, open, M, className = "", ...rest }) {
  const [h, setH] = useState(false);
  const show = open || h, t = toMotion(M.chat.actOpen);
  return (
    <motion.button className={`ch-act ${className}`} aria-label={label} onPointerEnter={() => setH(true)} onPointerLeave={() => setH(false)} onFocus={(e) => e.currentTarget.matches(":focus-visible") && setH(true)} onBlur={() => setH(false)}
      variants={{ h: { opacity: 0, y: 4 }, s: { opacity: 1, y: 0 } }} {...rest}>
      {icon}
      <motion.span className="ch-act-l" initial={false} animate={{ width: show ? "auto" : 0, marginLeft: show ? 6 : 0, opacity: show ? 1 : 0 }}
        transition={{ width: t, marginLeft: t, opacity: { duration: show ? 0.2 : 0.1, delay: show ? 0.05 : 0 } }}>{label}</motion.span>
    </motion.button>
  );
}
function ActIcon({ k }) {
  const d = { Copy: "M5.5 5.5V3.8c0-.7.6-1.3 1.3-1.3h5.4c.7 0 1.3.6 1.3 1.3v5.4c0 .7-.6 1.3-1.3 1.3h-1.7M3.8 5.5h5.4c.7 0 1.3.6 1.3 1.3v5.4c0 .7-.6 1.3-1.3 1.3H3.8c-.7 0-1.3-.6-1.3-1.3V6.8c0-.7.6-1.3 1.3-1.3Z", Export: "M8 2.5v7.5M5 7l3 3 3-3M3 11.5v1c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-1", Share: "M10.5 4.5 8 2 5.5 4.5M8 2v8M4.5 7.5H4c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-4c0-.6-.4-1-1-1h-.5" }[k];
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

// ------------------------------------------------------------------ the chat
// Four ways it sits: a command bar over a blurred page (⌘K, before you've asked anything) → once you ask,
// it pops into a column on the left and the sidebar folds to its rail → push it out and it floats at the
// bottom over a live page → hide it and it's a pill. Context comes in three grains: highlighted text,
// a whole chart, or one bar / point on a chart (hold ⌥, or the target button, and click it).
const SPOKEN = "Why is Outbound behind pace this month?";
const RAIL = 64, SIDE = 232;
// the space under the page card: even with the top, unless the dials' timeline is showing
const gapB = () => (document.documentElement.classList.contains("dials-off") ? 13 : 72);
// K's bar sits up in the page, where your eye already is, not against the bottom edge where it's easy to miss
const barB = () => Math.max(gapB() + 7, Math.round(window.innerHeight * 0.3));
// the sidebar beside a docked chat: its rail by default, the full sidebar if you open it (the chat and page move over)
const sideW = () => { const r = document.documentElement.classList; return r.contains("chat-dock") && r.contains("side-open") ? SIDE : RAIL; };
// while the chat or sidebar is moving, the page underneath holds its simulation still (see agents-concept holdStill)
export function moving(ms = 650) { const r = document.documentElement.classList; r.add("is-moving"); clearTimeout(moving.t); moving.t = setTimeout(() => r.remove("is-moving"), ms); }
export function syncRail() {
  const r = document.documentElement.classList, dock = r.contains("chat-dock") || r.contains("chat-full"); // docked or full screen: the sidebar folds to its rail
  const want = dock ? !r.contains("side-open") : r.contains("side-rail");
  if (r.contains("is-rail") !== want) { moving(); r.add("side-anim"); clearTimeout(syncRail.t); syncRail.t = setTimeout(() => r.remove("side-anim"), 640); } // folding transitions run only while it folds
  r.toggle("is-rail", want);
}
// full screen = the page's own card. The frame opens from the card's rectangle to .main's (no flying content):
// the thread's card fades as the frame grows, the full layout fades in once it has room, and closing reverses it.
const rectOf = (r) => ({ left: r.left, top: r.top, width: r.width, height: r.height });
// where an expanded chart opens: in a full-screen chat, the conversation area (right of your chats, under the header) so it stays
// part of the chat; beside the page (dock), over the page card
function pageRect() {
  const sh = document.querySelector(".chat-shell.is-full");
  if (sh) { const S = sh.getBoundingClientRect(), col = sh.querySelector(".chs-col"), hd = sh.querySelector(".chat-head"), g = 16;
    const L = col ? col.getBoundingClientRect().right : S.left, T = hd ? hd.getBoundingClientRect().bottom : S.top;
    return { left: L + g, top: T + g, width: S.right - L - g * 2, height: S.bottom - T - g * 2 }; }
  const el = document.querySelector(".main"); return el ? rectOf(el.getBoundingClientRect()) : { left: 0, top: 0, width: innerWidth, height: innerHeight }; }
function FullCard({ m, M, from, onClose, onAct, flat }) {
  const [to, setTo] = useState(pageRect);
  const frameRef = useRef(null);
  const [settled, setSettled] = useState(false); // once open, it tracks the page card exactly (chat resized, window resized)
  useEffect(() => {
    const el = document.querySelector(".main"); const r = () => setTo((o) => { const n = pageRect(); return Math.abs(o.left - n.left) < 0.5 && Math.abs(o.width - n.width) < 0.5 && Math.abs(o.top - n.top) < 0.5 && Math.abs(o.height - n.height) < 0.5 ? o : n; });
    const done = setTimeout(() => setSettled(true), (M.chat.morph.duration || 0.6) * 1000 + 160);
    const ro = el ? new ResizeObserver(r) : null; if (ro) ro.observe(el);
    addEventListener("resize", r);
    // the page card also moves while the grid animates; follow it frame by frame
    let raf = 0; const tick = () => { r(); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);
    return () => { clearTimeout(done); ro && ro.disconnect(); removeEventListener("resize", r); cancelAnimationFrame(raf); };
  }, []);
  // closing is driven from here, not by unmounting: frame and layout turn back in the same commit, and the parent only
  // drops the card once the frame has landed on the thread's card (which then shows in that same frame)
  const [closing, setClosing] = useState(null);
  const shutting = useRef(false);
  const shut = () => {
    if (shutting.current) return; shutting.current = true;
    // it lands on the thread's chart where you can see all of it: if the thread had scrolled it under the header (or below the
    // field), the thread moves first, unseen behind the open card, so the card never shrinks into a spot that's half hidden
    const bringIn = (el) => { const l = el.closest(".chat-list"); if (!l) return; window.dispatchEvent(new Event("north:unstick")); /* stop following the bottom */ const L = l.getBoundingClientRect(), r = el.getBoundingClientRect();
      const hd = document.querySelector(".chat-shell .chat-head"), top = Math.max(L.top, hd ? hd.getBoundingClientRect().bottom : L.top) + 16;
      const fld = document.querySelector(".chat-shell .chat-compose"), bot = Math.min(L.bottom, fld ? fld.getBoundingClientRect().top : L.bottom) - 16;
      if (r.top < top) l.scrollTop -= top - r.top; else if (r.bottom > bot && r.height < bot - top) l.scrollTop += r.bottom - bot; };
    const go = () => setClosing((c) => { if (c) return c; const el = document.querySelector(`[data-cc="${m.id}"]`); if (el) bringIn(el); return el ? rectOf(el.getBoundingClientRect()) : from; });
    const b = body.current && body.current.querySelector(".cc-body"), inner = body.current, fr = frameRef.current;
    if (b && b.scrollTop > 2 && inner && fr) {
      // scrolled down: no visible scroll-back. The content dips out, jumps to the top unseen (pinned title snaps back to its
      // resting size with no transition), then comes back as the card collapses.
      animate(inner, { opacity: 0 }, { duration: 0.11, ease: "linear" }).then(() => {
        fr.dataset.reset = "1"; b.scrollTop = 0; setScrolled(false);
        requestAnimationFrame(() => { go(); requestAnimationFrame(() => { delete fr.dataset.reset; animate(inner, { opacity: 1 }, { duration: 0.18, ease: [0.22, 1, 0.36, 1] }); }); });
      });
    } else go();
  };
  const shutRef = useRef(shut); shutRef.current = shut;
  useEffect(() => {
    const k = (e) => e.key === "Escape" && (e.stopImmediatePropagation(), shutRef.current()), q = () => shutRef.current();
    window.addEventListener("keydown", k, true); window.addEventListener("north:shutfull", q);
    return () => { window.removeEventListener("keydown", k, true); window.removeEventListener("north:shutfull", q); };
  }, []);
  // One card, not two. The frame starts exactly on the card in the thread, wearing the thread layout; one frame later it
  // switches to the page layout and CSS eases type, padding, chart height and ring width across while the frame springs
  // out. Closing runs the same thing backwards, and the thread's card is only swapped back in once the frame has landed
  // (Chat waits for the exit to finish), so nothing fades and there's never a second chart on screen.
  const present = !closing;
  // what sits under the chart comes in while the card is still landing (60% of the way through its grow, when it's within a few
  // percent of its width), so the card and its contents arrive as one. Waiting for the card to settle first read as a second,
  // late animation
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), (M.chat.morph.duration ?? 0.45) * 600); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [grown, setGrown] = useState(false);
  // grow on the next frame, frame and layout in the same commit, so the type starts moving the instant the card does
  useEffect(() => { const r = requestAnimationFrame(() => setGrown(true)); return () => cancelAnimationFrame(r); }, []);
  const big = grown && present;
  const body = useRef(null);

  // scrolling the open card: the title and its buttons stay pinned at the top (and tighten a step)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const b = body.current && body.current.querySelector(".cc-body"); if (!b) return;
    const on = () => setScrolled(b.scrollTop > 8); b.addEventListener("scroll", on, { passive: true }); return () => b.removeEventListener("scroll", on);
  }, [big]);
  const v = {
    // in flight it rides above the chat (61) so it never slips behind it; once settled full screen it drops back under (59)
    // frame, type and chart all ride one curve (M.chat.morph) so nothing runs ahead of anything else
    // the frame waits one frame so it starts on the same tick as the CSS type/padding transitions (the in-out curve is steep mid-way)
    shut: (r) => ({ ...rectOf(r || from), borderRadius: 8, zIndex: 64, transition: { ...toMotion(M.chat.morph), delay: 0.032, zIndex: { duration: 0 } } }),
    open: { ...to, borderRadius: 16, zIndex: settled ? (flat ? 62 : 59) : 64, transition: settled ? { duration: 0 } : { ...toMotion(M.chat.morph), delay: 0.032, zIndex: { duration: 0 } } },
  };
  return (
    <motion.div ref={frameRef} className={`cc-full${big ? " is-big" : ""}${ready ? " is-ready" : ""}${closing ? " is-closing" : ""}${!settled || closing ? " is-moving" : ""}${big && scrolled ? " is-scrolled" : ""}${flat ? " is-flatsrc" : ""}${!flat && from && from.width - 1 <= 470 ? " is-narrow" : ""}`} custom={closing || from} variants={v} initial="shut" animate={grown && !closing ? "open" : "shut"}
      onAnimationComplete={(def) => { if (def === "open") setSettled(true); else if (def === "shut" && closing) onClose(); }}
      style={{ "--morph-d": `${M.chat.morph.duration ?? 0.5}s`, "--morph-e": `cubic-bezier(${(M.chat.morph.ease || [0.22, 1, 0.36, 1]).join(",")})` }}>
      <div className="cc-full-in" ref={body}>
        <Card c={m.answer.card} p={1} onAct={(t) => { shut(); onAct(t); }} onExpand={shut} full={big} rich={flat && !big} />
      </div>
    </motion.div>
  );
}
export const PICK = ".hm-open, .hm-cell, .mtile, .card";
const AIM_IDS = new WeakMap(); let aimSeq = 0; // each chart gets its own ring
// the chart a question was about, if it's on the page right now
const findChart = (q) => {
  if (!q || q.k === "text") return null;
  if (q.id) { const el = [...document.querySelectorAll(`.mtile[data-id="${q.id}"]`)].find((e) => !e.closest(".ch-carry, .carry-fly")); if (el) return el; }
  const want = q.lane ? `${q.lane}: ${q.title}` : null;
  return [...document.querySelectorAll(PICK)].filter((el) => !el.closest(".ch-carry, .carry-fly")).find((el) => (want ? (el.getAttribute("aria-label") || "").startsWith(want) : readTarget(el, true)?.title === q.title)) || null;
};
const aimId = (el) => { if (!AIM_IDS.has(el)) AIM_IDS.set(el, ++aimSeq); return AIM_IDS.get(el); };
// the chart you asked about comes with you: a copy of the card lifts off the page and flies into its place above your question in
// the full-screen chat, tracking that place while the chat opens around it; the copy in the thread shows once it lands
const CARRY_MAX = 520;
// the chat's own card for a chart on the page: the one North already answers with when it matches (Total ARR is ARR movement,
// Felix ARR its October pace), else the page's own chart in a chat card. Nothing is drawn that the page doesn't have.
const normT = (t) => (t || "").toLowerCase().replace(/[–—·:\-]/g, " ").replace(/\s+/g, " ").trim();
function chatCardFor(qt, id) {
  if (id === "felix") return FELIX_PACE; if (id === "total") return ANSWERS.arr.card;
  const t = normT(qt && qt.title), k = t && Object.keys(ANSWERS).find((x) => ANSWERS[x].card && normT(ANSWERS[x].card.title) === t);
  if (k) return ANSWERS[k].card;
  return id && CARRY.render && CARRY.render(id, 600, 1) ? { kind: "page", id, title: qt.title, sub: "Last 6 months" } : null;
}
// the page fills this in: given a chart's id and size, the real chart component (live: hover, tooltips), so the chart that lands in
// the thread is the chart, not a picture of it; anything it can't render stays the card as it looked
export const CARRY = { render: null };
function snapChart(el) { const id = el.dataset.id || null, live = !!(id && CARRY.render && CARRY.render(id)), src = (live && el.querySelector(".mt-mini")) || el;
  const r = src.getBoundingClientRect(), c = src.cloneNode(true); c.removeAttribute("data-id"); c.querySelectorAll(".tip").forEach((t) => t.remove());
  return { id, live, html: c.outerHTML, w: r.width, h: r.height, rect: { l: r.left, t: r.top, w: r.width, h: r.height }, rad: getComputedStyle(src).borderTopLeftRadius }; }
function flyCarry(cv, sel0) { const sel = cv.live ? `${sel0} .ch-carry-plot` : sel0, hold = cv.live ? sel0 : null;
  const g = document.createElement("div"); g.className = "carry-fly"; g.innerHTML = cv.html; const R = cv.rect;
  Object.assign(g.style, { left: `${R.l}px`, top: `${R.t}px`, width: `${cv.w}px`, height: `${cv.h}px`, borderRadius: cv.rad });
  document.body.appendChild(g);
  const D = 680, e = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), t0 = performance.now();
  const step = (now) => { const t = Math.min(1, (now - t0) / D), k = e(t), tg = document.querySelector(sel);
    const box = hold ? document.querySelector(hold) : tg; if (box && !box.classList.contains("is-flying") && t < 1) box.classList.add("is-flying");
    const T = tg ? tg.getBoundingClientRect() : null;
    // a live chart: the small bars keep their shape and land on the big chart's baseline, across its bar area (geo(600, 200):
    // bars from x 44, baseline at 178), so the real bars grow up out of them; a copied card lands on its slot
    let to = { l: R.l, t: R.t, w: R.w };
    if (T && T.width) { if (cv.live) { const fx = T.width / 600, w = T.width - 44 * fx, h = cv.h * (w / cv.w); to = { l: T.left + 44 * fx, t: T.top + 178 * (T.height / 200) - h, w }; } else to = { l: T.left, t: T.top, w: T.width }; }
    const l = R.l + (to.l - R.l) * k, tp = R.t + (to.t - R.t) * k, sc = (R.w + (to.w - R.w) * k) / cv.w;
    g.style.transform = `translate(${l - R.l}px, ${tp - R.t}px) scale(${sc})`;
    if (t < 1) requestAnimationFrame(step);
    else { box && box.classList.remove("is-flying"); g.style.transition = "opacity .28s ease-out"; g.style.opacity = "0"; setTimeout(() => g.remove(), 300); } };
  requestAnimationFrame(step);
}
// the ring never draws over the top bar or outside the page: it's clipped to the page's scrolling area
const ringRect = (el) => { const r = el.getBoundingClientRect(), sc = el.closest(".scroll"), v = sc ? sc.getBoundingClientRect() : { top: 0, left: 0, right: innerWidth, bottom: innerHeight };
  return { l: r.left, t: r.top, w: r.width, h: r.height, rad: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 8, vt: v.top, vl: v.left, vr: v.right, vb: v.bottom }; };
// the glass edge on a chart. Hovering while pointing: sits on that chart, glint toward the cursor.
// Held (the chart you picked): follows the chart as the page scrolls, glint follows the pointer anywhere on screen.
function GlassRing({ k, r: r0, el, ang, M, onGone }) {
  const ref = useRef(null);
  const [r, setR] = useState(() => r0 || (el && ringRect(el)));
  useEffect(() => {
    if (!el) return;
    let raf = 0;
    const f = () => {
      if (!el.isConnected) { onGone && onGone(); return; }
      const n = ringRect(el); setR((o) => (o && o.l === n.l && o.t === n.t && o.w === n.w && o.h === n.h && o.vt === n.vt && o.vb === n.vb ? o : n));
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    const mv = (e) => { const b = ref.current; if (!b) return; const q = b.getBoundingClientRect(); b.style.setProperty("--ar-at", `${(Math.atan2(e.clientY - (q.top + q.height / 2), e.clientX - (q.left + q.width / 2)) * 180) / Math.PI + 90}deg`); };
    addEventListener("pointermove", mv);
    return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", mv); };
  }, [el]);
  const R = el ? r : r0; if (!R) return null;
  const o = M.chat.aimBand / 2, L = R.l - o, T = R.t - o, W = R.w + o * 2, H = R.h + o * 2;
  const clip = R.vt != null ? `inset(${Math.max(0, R.vt - T)}px ${Math.max(0, L + W - R.vr)}px ${Math.max(0, T + H - R.vb)}px ${Math.max(0, R.vl - L)}px)` : undefined;
  return (
    <motion.div ref={ref} className={`chat-aim-ring is-${k}${el ? " is-held" : ""}`} initial={{ opacity: 0, scale: 1.012 }}
      animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.006, transition: { duration: M.chat.aimOut, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: M.chat.aimIn, ease: [0.16, 1, 0.3, 1] }}
      style={{ left: L, top: T, width: W, height: H, borderRadius: R.rad + o, clipPath: clip, "--ar-band": `${M.chat.aimBand}px`, "--ar-blur": `${M.chat.aimBlur}px`, "--ar-spin": `${M.chat.aimSpin}s`, "--ar-sheen": M.chat.aimSheen, "--ar-glint": M.chat.aimGlint, ...(ang != null ? { "--ar-at": `${ang}deg` } : {}) }}>
      <i className="ar-glass" /><i className="ar-sheen" /><i className="ar-glint" /><i className="ar-rim" />
    </motion.div>
  );
}
const tidy = (t) => (t || "").replace(/\s+/g, " ").trim();
// what a chart is called, its headline number, and (if the cursor is on a mark) the point under it
export function readTarget(el, whole = false) {
  const card = el && el.closest(PICK); if (!card) return null;
  const titleEl = card.querySelector("h1, h2, h3, .mo-lab, [class*='-lab'], [class*='title']");
  let title = tidy(card.classList.contains("mtile") ? card.getAttribute("aria-label") : (titleEl && titleEl.textContent) || card.getAttribute("aria-label")).replace(/^Open /, "");
  if (!title) title = tidy(card.textContent).slice(0, 40);
  // the headline: the largest short number on the card
  let big = "", best = 0;
  card.querySelectorAll("span, b, div, strong, em").forEach((n) => {
    if (n.children.length > 1) return; const t = tidy(n.textContent); if (!t || t.length > 10 || !/\d/.test(t)) return;
    const f = parseFloat(getComputedStyle(n).fontSize); if (f > best) { best = f; big = t; }
  });
  // a chart's own hover tooltip is showing → the cursor is on one bar or point; take what the tooltip says
  const tipEl = card.querySelector(".tip.tip-level, .tip");
  const tip = tipEl && !whole ? tidy([...tipEl.querySelectorAll(".tip-e, .tip-t, .tip-c em, .tip-c b")].map((n) => n.textContent).join(" · ") || tipEl.textContent) : "";
  if (card.classList.contains("hm-open")) return { card, title: card.dataset.name, big, point: null, id: null, lane: card.dataset.lane || null };
  const lane = card.classList.contains("hm-cell") ? ((card.getAttribute("aria-label") || "").match(/^([^:]+):/) || [])[1] || null : null;
  return { card, title, big, point: tip || null, id: card.dataset.id || null, lane };
}
const ModeIcon = ({ k, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={NAVY} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    {k === "full" ? <><rect x="2.5" y="3" width="11" height="10" rx="2" /><rect x="4.5" y="5" width="7" height="6" rx="1" fill={NAVY} stroke="none" opacity=".85" /></>
      : k === "dock" ? <><rect x="2.5" y="3" width="11" height="10" rx="2" /><rect x="2.5" y="3" width="4" height="10" rx="1.5" fill={NAVY} stroke="none" opacity=".85" /></>
      : <><rect x="2.5" y="3" width="11" height="10" rx="2" /><rect x="5" y="8.5" width="6" height="3" rx="1" fill={NAVY} stroke="none" opacity=".85" /></>}
  </svg>
);
// off: navy · on: purple, lighter than navy so it sits in the soft glass instead of on top of it
const TargetIcon = ({ on }) => (
  // a bullseye: two rings and a solid centre
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={on ? "#744ccb" : NAVY} strokeWidth="1.4" aria-hidden="true" style={{ transition: "stroke .2s" }}>
    <circle cx="10" cy="10" r="7.6" /><circle cx="10" cy="10" r="4.5" /><circle className="dot" cx="10" cy="10" r="1.75" fill={on ? "#744ccb" : NAVY} stroke="none" />
  </svg>
);
const CtxIcon = ({ k }) => k === "text"
  ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 4h10M3 8h10M3 12h6" /></svg>
  : k === "point" ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="5" /><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none" /></svg>
  : <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="2.5" y="8" width="2.6" height="5.5" rx=".6" /><rect x="6.7" y="5" width="2.6" height="8.5" rx=".6" /><rect x="10.9" y="2.5" width="2.6" height="11" rx=".6" /></svg>;
const ctxText = (c) => (c.k === "text" ? `“${c.t}”` : c.t);

// the topics rail: one line per subject down the chat's left edge. Hover and it opens into the list;
// pick one and the thread scrolls to it, and your next question carries on from there.
function TopicsRail({ topics, active, onPick, M, open, setOpen, peek }) {
  const t = useRef(null), [up, setUp] = useState(false); // stays raised until the panel has fully gone back into the line
  const cur = topics.some((x) => x.title === active) ? active : topics[topics.length - 1]?.title; // never none: the newest, if the scroll hasn't said
  // the joints: where the divider turns into the panel's top and bottom lines, a 14px curve drawn as a vector stroke at exactly the
  // divider's width (--tp-w) on its centre line (--tp-x), so line and curve render as one. White under it covers the straight bits.
  const [g, setG] = useState({ w: 1, x: 0.5 });
  const readG = (el) => { if (!el) return; const cs = getComputedStyle(el), w = parseFloat(cs.getPropertyValue("--tp-w")) || 1, x = parseFloat(cs.getPropertyValue("--tp-x")) || 0.5; if (w !== g.w || x !== g.x) setG({ w, x }); };

  useEffect(() => { if (open) setUp(true); }, [open]);
  // the panel is the divider pushing out: its right edge travels out from the line, the top and bottom lines stretch with it,
  // and the left stays open (the white covers the divider's own stretch). The topics land once it's out; closing pulls it back in.
  const PUSH = { duration: 0.5, ease: [0.32, 0.72, 0, 1] };
  return (
    <div className={`ch-index${open ? " is-open" : ""}${open || up ? " is-up" : ""}`} onPointerEnter={() => { clearTimeout(t.current); setOpen(true); }} onPointerLeave={() => { t.current = setTimeout(() => setOpen(false), 140); }}>
      <div className="ch-index-lines" aria-hidden="true">
        {topics.map((x, k) => <i key={x.title} style={{ "--i": k, "--o": k - (topics.length - 1) / 2 }} className={`${x.title === cur ? "on" : ""}${x.unread ? " is-new" : ""}`} />)}
      </div>
      <AnimatePresence onExitComplete={() => setUp(false)}>
        {open && (
          <motion.div ref={readG} className="ch-index-panel" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0.999, transition: { duration: 0.52 } }}>
            <PushShape axis="x" size={240} w={g.w} X={g.x} fill="#fff" className="tp-shape" />
            <motion.b initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3, ease: [0.22, 1, 0.36, 1] } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>Topics</motion.b>
            {peek && <small className="ch-index-peek">Every subject you've asked about. Hover this edge to come back to one.</small>}
            <ul>
              {topics.map((x, i) => (
                <motion.li key={x.title} className={x.title === cur ? "is-on" : ""} onClick={() => { onPick(x.title); setOpen(false); }}
                  initial={{ opacity: 0, x: -10, y: -(i - (topics.length - 1) / 2) * 26 }} animate={{ opacity: 1, x: 0, y: 0, transition: { delay: 0.12 + i * 0.03, duration: 0.42, ease: [0.32, 0.72, 0, 1] } }}
                  exit={{ opacity: 0, x: -6, y: -(i - (topics.length - 1) / 2) * 26, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}>
                  <span className="ch-index-t">{x.title}{x.watched && <svg className="ch-index-bell" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="1.2" aria-label="Watching"><circle cx="4.6" cy="10.6" r="2.6" /><circle cx="11.4" cy="10.6" r="2.6" /><path d="M7.2 10.2h1.6" fill="none" strokeLinecap="round" /><path d="M2.1 9.7 3.5 4.6a1.4 1.4 0 0 1 1.35-1.05h.35c.62 0 1.1.5 1.1 1.1V8.4" fill="none" strokeLinecap="round" /><path d="M13.9 9.7 12.5 4.6a1.4 1.4 0 0 0-1.35-1.05h-.35c-.62 0-1.1.5-1.1 1.1V8.4" fill="none" strokeLinecap="round" /></svg>}{x.unread && <em>New</em>}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// the new chat's lines: what kind of thing each one is, in one glyph (an agent gets its orb)
function CmIcon({ k }) {
  const p = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round", className: `cm-ic is-${k}`, "aria-hidden": true };
  if (k === "need") return <svg {...p}><path d="M2.5 9.5h3l1 2h3l1-2h3" /><path d="M2.5 9.5 4.2 4h7.6l1.7 5.5v3h-11Z" /></svg>; // your inbox: decisions waiting
  if (k === "up") return <svg {...p}><path d="M2.5 11.5 6.5 7.5l2.5 2.5 4.5-5" /><path d="M10.5 5h3v3" /></svg>;
  if (k === "down") return <svg {...p}><path d="M2.5 4.5 6.5 8.5 9 6l4.5 5" /><path d="M10.5 11h3V8" /></svg>;
  return <svg {...p}><path d="M2.5 9.5 6 7l3 2 4.5-3.5" /></svg>;
}
// the conversations, inside the chat window. Full screen: a quiet column. Docked: folded to the edge, hover to open.
// You look for a person, not a subject: conversations are grouped by who's in them (Heather; Heather and Jordan; Riley; North),
// each group headed by their names, and each conversation under it is its subject with the last word underneath. Groups
// with something waiting on you come first, then the most recent.
function ChatsRail({ chats, cur, topics, activeTopic, onPickChat, onPickTopic, onNew, M, open, setOpen, peek, col, files = [] }) {
  const t = useRef(null), [q, setQ] = useState(""), [hv, setHv] = useState(null), at = useRef({ x: 100, w: 220 });
  const glide = (M && M.hover && M.hover.glide) || { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] };
  const nmP = (p) => (PEOPLE[p] ? PEOPLE[p].n : AGENTS[p] ? AGENTS[p].n : p);
  const qq = q.trim().toLowerCase(), L = chats.filter((c) => !qq || `${c.title} ${c.topics.join(" ")} ${[...(c.ppl || []), ...c.ags].map(nmP).join(" ")}`.toLowerCase().includes(qq));
  const groups = [];
  L.forEach((c) => { const who = [...(c.ppl || []), ...c.ags], k = who.length ? who.join("+") : "north"; let g = groups.find((y) => y.k === k);
    if (!g) groups.push((g = { k, who, L: [], ask: false, at: 0 })); g.L.push(c); if (c.ask) g.ask = true; g.at = Math.max(g.at, c.at); });
  groups.sort((a, b) => (b.ask ? 1 : 0) - (a.ask ? 1 : 0) || b.at - a.at);
  const names = (who) => { const n = who.map(nmP); return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n[0]; };
  const head = (g) => g.k === "north" ? <><NorthLogo size={14} /><b>North</b></> : <><Stack ids={g.who} size={16} face={(w, s) => (PEOPLE[w] ? <PFace id={w} size={s} /> : <Orb id={w} size={s} />)} /><b>{names(g.who)}</b></>;
  const enter = (k) => (e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(k); };
  const leave = (k) => () => setHv((h) => (h === k ? null : h));
  const nmOf = (m) => (m.role === "user" ? "You" : m.role === "person" ? PEOPLE[m.who].n : m.role === "agent" ? AGENTS[m.agent].n : "North");
  const lineOf = (c) => c.ask ? `${PEOPLE[c.ask].n} asked you` : c.last ? `${nmOf(c.last)}: ${(c.last.text || (c.last.answer && c.last.answer.text) || "").replace(/\s+/g, " ")}` : "";
  // laid out the way people already know from Slack: direct messages by person, then the conversations with North by topic.
  // A name goes bold with a count only when that person is waiting on you
  const ppl = groups.filter((g) => g.k !== "north" && (g.who || []).some((w) => PEOPLE[w])), withN = groups.filter((g) => !ppl.includes(g));
  const [openG, setOpenG] = useState(null), [shut, setShut] = useState({});
  const pickG = (g) => { const c0 = g.L.find((c) => c.ask) || g.L[0]; if (g.L.length > 1) setOpenG((k) => (k === g.k ? null : g.k)); onPickChat(c0.id); setOpen(false); };
  const Sec = ({ k, label, children }) => (
    <section className={`sl-sec${shut[k] ? " is-shut" : ""}`}>
      <button type="button" className="sl-sh" aria-expanded={!shut[k]} onClick={() => setShut((s) => ({ ...s, [k]: !s[k] }))}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 4 5 6.5 7.5 4" /></svg>{label}</button>
      {!shut[k] && <ul>{children}</ul>}
    </section>);
  const body = (
    <>
      <div className="chs-h"><b>Conversations</b><button className="chs-new" onClick={() => { onNew(); setOpen(false); }}><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M6 2v8M2 6h8" /></svg>New</button></div>
      <label className="chs-s"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" strokeLinecap="round" /></svg><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a person or a conversation" /></label>
      <div className="chs-l sl">
        {/* files first: they aren't conversations. One opens full view in the pane; F or the button steps it down beside a chat */}
        {files.length > 0 && !qq && <Sec k="files" label="Files">{files.map((fl) => (
          <li key={fl.k}><button type="button" className="sl-r is-topic" onClick={(e) => showFile(fl.k, e.currentTarget, { full: true })}>
            <span className="sl-f"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={fl.kind === "Deck" ? "M3 3.5h10v7H3zM8 10.5v2M5.5 12.5h5" : "M4.5 2.5h5l2 2v9h-7zM6.5 7h3M6.5 9.5h3"} /></svg></span>
            <span className="sl-n">{fl.t}</span></button></li>))}</Sec>}
        {ppl.length > 0 && <Sec k="dm" label="Direct messages">{ppl.map((g) => { const on = g.L.some((c) => c.id === cur), ex = g.L.length > 1 && (openG === g.k || on), n = g.L.filter((c) => c.ask).length;
          return <li key={g.k}>
            <button type="button" className={`sl-r${on ? " is-on" : ""}${n ? " is-ask" : ""}`} onClick={() => pickG(g)}>
              <span className="sl-f"><Stack ids={g.who} size={20} face={(w, s) => (PEOPLE[w] ? <PFace id={w} size={s} /> : <Orb id={w} size={s} />)} /></span>
              <span className="sl-n">{g.who.map(nmP).join(", ")}</span>{n > 0 && <em className="sl-c">{n}</em>}</button>
            {ex && <ul className="sl-sub">{g.L.map((c) => <li key={c.id}><button type="button" className={`sl-t${c.id === cur ? " is-on" : ""}`} onClick={() => { onPickChat(c.id); setOpen(false); }}>{c.title}</button></li>)}</ul>}
          </li>; })}</Sec>}
        {withN.length > 0 && <Sec k="north" label="North">{withN.flatMap((g) => g.L).sort((a, b) => b.at - a.at).map((c) => (
          <li key={c.id}><button type="button" className={`sl-r is-topic${c.id === cur ? " is-on" : ""}`} onClick={() => { onPickChat(c.id); setOpen(false); }}>
            <span className="sl-f"><NorthLogo size={12} /></span><span className="sl-n">{c.title}</span></button></li>))}</Sec>}
        {L.length === 0 && <p className="chs-0">Nobody and nothing matches that.</p>}
      </div>
    </>);
  if (col) return <aside className="chs-col">{body}</aside>;
  return (
    <div className={`ch-index${open ? " is-open" : ""}${open || up ? " is-up" : ""}`} onPointerEnter={() => { clearTimeout(t.current); setOpen(true); }} onPointerLeave={() => { t.current = setTimeout(() => setOpen(false), 140); }}>
      <div className="ch-index-lines" aria-hidden="true">
        {chats.slice(0, 12).map((c) => <i key={c.id} className={`${c.id === cur ? "on" : ""}${c.unread ? " is-new" : ""}`} />)}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="ch-index-panel chs-panel" initial={{ opacity: 0, x: -8, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -6, filter: "blur(3px)", transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            {body}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- live answers: anything the scripted prototype doesn't cover (or would repeat) is answered by Claude, from North's own numbers
// each topic's next step, kept before the chat cards drop their trays: a huddle comes back with it as a decision you can take
const NEXT = Object.fromEntries(Object.keys(ANSWERS).filter((k) => ANSWERS[k].card && ANSWERS[k].card.tray).map((k) => [k, ANSWERS[k].card.tray]));
["outbound", "nrr", "arr", "winrate", "logos", "demo", "exp", "ttv", "scenario"].forEach((k) => { if (ANSWERS[k] && ANSWERS[k].card) delete ANSWERS[k].card.tray; });
// a seat's next steps: what's theirs to do. Sam doesn't "tell Sam"; leadership's moves stay with leadership.
const SEAT_NEXT = { sam: {
  logos: { title: "Hold demo volume through Oct 31", sub: "Your team, 4 days left", button: "See why demos stall", q: "Why aren’t my held demos closing?" },
  outbound: null, lanes: null, year: null, nrr: null, winrate: null, scenario: null } };
const nextFor = (k) => { const S = SEAT_NEXT[getWho()]; return S && k in S ? S[k] : NEXT[k] || null; };
Object.values(UPDATES).forEach((u) => { if (u.card) delete u.card.tray; });
const CHART_KEYS = ["outbound", "year", "lanes", "nrr", "arr", "winrate", "logos", "demo", "exp", "ttv", "scenario"];
let KB = null;
const northKB = () => KB || (KB = [
  "Fello sells Calvin, an AI teammate for real-estate teams. North is Fello's company-health copilot. Data is October month to date (it's the last days of October).",
  "Scoreboard: Total ARR $35.75M, 89% of the $40.03M plan, $4.28M left; pace by now $37.31M ($1.56M behind); at October's rate the year ends at $38.94M, $1.09M short. Monthly ending ARR May–Oct: $29.5M, $30.6M, $31.3M, $32.06M, $34.15M, $35.75M (best month Sep +$2.09M; Oct +$1.60M). Net new ARR Oct $1.60M vs $1.78M pace, $1.87M target ($180K behind); by month May–Oct 1.62, 1.88, 2.03, 1.32, 1.76, 1.55 ($M). NRR 99.9% vs 100.0% target. GRR 97.7% vs 96.93% target. Felix ARR $12.99M vs $13.06M Oct target ($70K to go), up from $5.1M in May. Avg ARR per account $13.1K (target $12.8K). Paying accounts 2,717 (target 2,800). ARR to GTM comp 31.3x (target 26.0x). Expansion ARR at 72% of pace.",
  "Owners: Total ARR Rick; NRR and Net new ARR Dustin Deno; GRR PD and Rick; Felix ARR Dustin and Rick; Outbound Caleb; Expansion Heather (VP Sales); New Business / new logos Sam; SMB renewals Jordan; product/integrations PD.",
  "Levers to close the $1.09M: Outbound back to pace +$680K (Caleb, one SDR back on outbound); expansion win rate to 45% +$300K (Heather, exec sponsor on the top 10); new logos on pace +$160K (Sam). All three: $40.08M.",
  ...Object.values(ANSWERS).filter((a) => a.topic && a.text).map((a) => `${a.topic}: ${a.text}${a.card && a.card.big ? ` (${a.card.title}: ${a.card.big})` : ""}`),
  ...Object.values(LEADS).map((v) => v.join(" ")),
].join("\n"));
const CHART_LIST = () => CHART_KEYS.map((k) => `${k}: ${ANSWERS[k].card.title} — ${ANSWERS[k].card.sub || ""}`).join("\n");
const keyOf = (card) => card && CHART_KEYS.find((k) => ANSWERS[k].card === card);
// a chart North drew for this answer: ticks (progress toward something, split into 2-4 parts) or a ring (where a $K total sits)
const liveCard = (ch) => {
  if (!ch || typeof ch !== "object") return null;
  const S = (v, n = 80) => String(v == null ? "" : v).slice(0, n), num = (v) => (typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, "")));
  const title = S(ch.title, 60), sub = S(ch.sub, 110); if (!title) return null;
  if (ch.type === "ticks") {
    const rows = (Array.isArray(ch.rows) ? ch.rows : []).filter((r) => Array.isArray(r) && r.length >= 3 && isFinite(num(r[1]))).slice(0, 4)
      .map(([l, f, v]) => [S(l, 34), clamp(num(f), 0.02, 1), S(v, 12)]);
    if (rows.length < 2 || !ch.big) return null;
    const chip = Array.isArray(ch.chip) && ch.chip[1] ? [ch.chip[0] === "down" ? "down" : "up", S(ch.chip[1], 30)] : ["up", ""];
    return { kind: "ticks", title, sub, big: S(ch.big, 10), chip, fill: clamp(isFinite(num(ch.fill)) ? num(ch.fill) : 0.6, 0.05, 1), rows, goal: ch.goal ? S(ch.goal, 28) : null, live: true };
  }
  if (ch.type === "ruler") {
    const you = num(ch.value), target = num(ch.target), unit = ["%", "$M", "$K", "days", "x"].includes(ch.unit) ? ch.unit : "%";
    if (!isFinite(you) || !isFinite(target)) return null;
    let lo = isFinite(num(ch.min)) ? num(ch.min) : 0, hi = isFinite(num(ch.max)) ? num(ch.max) : Math.max(you, target) * 1.25;
    if (hi <= Math.max(you, target)) hi = Math.max(you, target) * 1.15; if (lo >= Math.min(you, target)) lo = 0;
    const pre = unit.startsWith("$") ? "$" : "", suf = unit === "$M" ? "M" : unit === "$K" ? "K" : unit === "days" ? "d" : unit;
    const step = (hi - lo) / 3, ticks = [0, 1, 2, 3].map((k) => +(lo + step * k).toFixed(2));
    return { kind: "viz", viz: "ruler", title, sub, live: true, ruler: { you, target, lo, hi, ticks, pre, suf, dec: unit === "$M" ? 2 : unit === "$K" || unit === "days" ? 0 : 1, lowerBetter: !!ch.lowerBetter, label: title } };
  }
  if (ch.type === "lines") {
    const pts = (Array.isArray(ch.actual) ? ch.actual : []).filter((r) => Array.isArray(r) && isFinite(num(r[0])) && isFinite(num(r[1]))).map(([d, v]) => [clamp(Math.round(num(d)), 1, 31), num(v)]).sort((a, b) => a[0] - b[0]);
    const goalEnd = num(ch.target); if (pts.length < 2 || !isFinite(goalEnd)) return null;
    if (pts[0][0] !== 1) pts.unshift([1, 0]);
    const today = pts[pts.length - 1][0], now = pts[pts.length - 1][1], paceNow = goalEnd * (today - 1) / 30, mx = Math.max(goalEnd, now) * 1.08;
    const m = mx >= 1, big = (v) => (m ? [+v.toFixed(2), "M", 2] : [Math.round(v * 1000), "K", 0]);
    const tk = [0, 1, 2, 3].map((k) => +((mx / 3) * k).toFixed(2));
    return { kind: "viz", viz: "lines", title, sub, live: true, lines: { book: pts, goal: [[1, 0], [31, goalEnd]], max: tk[3], ticks: tk, today,
      big: [...big(now), S(ch.doneLabel || "so far", 14)], sub: [...big(paceNow), "pace by now"], target: S(ch.targetLabel || "target", 24), rowsK: [S(ch.doneLabel || "So far", 14), "Pace"], label: title } };
  }
  if (ch.type === "ring") {
    const cols = [CORAL, PURPLE, TEAL, "#c98a2b"];
    const parts = (Array.isArray(ch.parts) ? ch.parts : []).filter((r) => Array.isArray(r) && num(r[1]) > 0).slice(0, 4).map(([l, v, o], i) => [S(l, 24), num(v), cols[i], o ? S(o, 20) : undefined]);
    if (parts.length < 2) return null;
    const sum = parts.reduce((a, r) => a + r[1], 0), whole = Math.max(num(ch.whole) || 0, sum);
    return { kind: "radial", title, sub, whole, parts, rest: whole > sum * 1.001 ? [S(ch.restLabel || "Everything else", 24), ""] : null, live: true };
  }
  return null;
};

const OB_KEY = "north.firstrun.v1";
const obLoad = () => { try { const o = JSON.parse(localStorage.getItem(OB_KEY) || "{}"); return { learned: o.learned || [], shown: o.shown || {} }; } catch (e) { return { learned: [], shown: {} }; } };

// ---- "add the Outbound demos chart to Home": a pin by name, from the bubble or the chat, without finding the chart first.
// Everything that can sit on Home: Company health's scoreboard, every lane metric with numbers, and the answers that pin.
const PIN_WORDS = /^(?:(?:hey|ok|okay)\s+)?(?:north[,\s]+)?(?:(?:can|could|would|will) you\s+|please\s+|pls\s+|go ahead and\s+|let'?s\s+)?/i;
const PIN_DEST = "(?:(?:my|the)\\s+)?(?:home(?:\\s?page|\\s+screen)?|dashboard)|(?:up\\s+)?here|(?:on\\s+)?(?:this|my|the)\\s+(?:page|screen|dashboard)|up top";
const PIN_ADD = "add|pin|put|stick|save|throw|drop|bring|show|get|keep|place|stick";
function pinIntent(text) {
  const t = text.trim().replace(PIN_WORDS, "").replace(/[?.!\s]+$/, "").replace(/\s+(?:please|for me|too)$/i, "");
  const dest = (d) => (/home|dashboard/i.test(d) ? "home" : "here"), R = (x) => new RegExp(x, "i");
  let m;
  // arranging what's already there: "move NRR first", "put Felix ARR at the end", "move NRR before Total ARR", "swap NRR and Felix ARR"
  const MV = "move|put|bring|drag|shift|place|stick|slide";
  const T = t.replace(R(`\\s+(?:on|in)\\s+(?:${PIN_DEST})$`), "");
  if ((m = T.match(R(`^(?:${MV})\\s+(.+?)\\s+(?:to\\s+|at\\s+|in\\s+)?(?:the\\s+)?(first|front|start|beginning|top|left|lead|last|end|bottom)(?:\\s+(?:place|spot|slot|of the row|of the line))?$`))))
    return { move: /^(last|end|bottom)$/i.test(m[2]) ? "last" : "first", what: m[1] };
  if ((m = T.match(R(`^make\\s+(.+?)\\s+(?:the\\s+)?(first|last)(?:\\s+(?:one|tile|chart))?$`)))) return { move: m[2].toLowerCase(), what: m[1] };
  if ((m = T.match(R(`^(?:${MV})\\s+(.+?)\\s+(before|ahead of|in front of|after|behind|next to|beside)\\s+(.+)$`)))) return { move: /^(after|behind|next to|beside)$/i.test(m[2]) ? "after" : "before", what: m[1], ref: m[3] };
  if ((m = T.match(R(`^(?:swap|switch|trade)\\s+(.+?)\\s+(?:and|with|for)\\s+(.+)$`)))) return { move: "swap", what: m[1], ref: m[2] };
  // "add NRR to Home", "put NRR on this page", "add NRR here", "pin GRR up top"
  if ((m = t.match(R(`^(?:${PIN_ADD})\\s+(.+?)\\s+(?:(?:to|on|onto|in|into)\\s+)?(${PIN_DEST})$`)))) return { add: true, what: m[1], dest: dest(m[2]) };
  // "I want NRR on my home", "can I get NRR here", "give me NRR on this page"
  if ((m = t.match(R(`^(?:i(?:'d| would)? (?:want|like)|give me|let me (?:see|have)|can i (?:get|have|see)|i need)\\s+(.+?)\\s+(?:(?:on|in|to)\\s+)?(${PIN_DEST})$`)))) return { add: true, what: m[1], dest: dest(m[2]) };
  if ((m = t.match(R(`^(?:remove|unpin|take|drop|pull|get rid of|hide)\\s+(.+?)\\s+(?:from|off(?: of)?|out of)\\s+(${PIN_DEST})$`)))) return { add: false, what: m[1], dest: dest(m[2]) };
  // no place named: only taken as a pin when the words are a chart's name (so "add Lisa to the chat" still goes to North)
  if ((m = t.match(/^(?:pin|add)\s+(.+)$/i))) return { add: true, what: m[1], dest: "home", loose: true };
  if ((m = t.match(/^unpin\s+(.+)$/i))) return { add: false, what: m[1], dest: "home" };
  return null;
}
const pinToks = (x) => String(x).toLowerCase().replace(/[–—·:]/g, " ").replace(/[^a-z0-9$%. ]/g, " ").split(/\s+/).filter(Boolean)
  .filter((w) => !/^(the|a|an|my|our|chart|charts|tile|graph|metric|number|numbers|card|for|of|to|this|that|one|rate'?s)$/.test(w)).map((w) => (w.length > 3 ? w.replace(/s$/, "") : w));
function pinCatalog(metrics) {
  const out = [], seen = new Set(), add = (id, name, lane = "") => { const k = canon(id); if (seen.has(k)) return; seen.add(k); out.push({ id: k, name, lane, toks: new Set([...pinToks(name), ...pinToks(lane)]), nt: pinToks(name) }); };
  metrics.filter((m) => /^ch-/.test(m.id)).forEach((m) => add(m.id, m.label));
  const own = (seatOf() || { lanes: [] }).lanes; // a seat's own lane needs no lane name
  LANES.forEach(([lane, , , tiles], r) => tiles.forEach(([n, v], c) => { if (v && v !== "—") add(`${r}-${c}`, n.includes(lane) || own.includes(r) ? n : `${lane} ${/^[A-Z][a-z]/.test(n) ? n[0].toLowerCase() + n.slice(1) : n}`, lane); }));
  Object.values(CHAT_TILES).forEach((t) => add(t.id, t.label));
  return out;
}
// every word you said has to be in the chart's name or its lane; among those, the one whose name you said most of
function pinMatch(what, metrics) {
  const q = pinToks(what); if (!q.length) return { hits: [] };
  const all = pinCatalog(metrics), full = all.filter((it) => q.every((w) => it.toks.has(w)));
  const sc = (it) => it.nt.filter((w) => q.includes(w)).length / it.nt.length;
  if (full.length) { const best = Math.max(...full.map(sc)); return { hits: full.filter((it) => sc(it) === best) }; }
  const part = all.map((it) => [it, q.filter((w) => it.toks.has(w)).length]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return { hits: [], near: part.slice(0, 3).map(([it]) => it) };
}
// ------------------------------------------------------------------ teammates in the chat
// One chat: a conversation is about one subject and anyone can be in it. A teammate's message reads like an agent's (face,
// name, role, then what they said); people joining is one quiet line; a project's brief is where the conversation landed
function PFace({ id, size = 18 }) { const p = PEOPLE[id], ph = PHOTOS[id]; return <span className={`tp-face${ph ? " is-ph" : ""}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.5), background: ph ? `center/cover url(${ph})` : p ? p.col : "#1f4b70" }}>{ph ? null : p ? p.n[0] : "S"}</span>; }
function PersonMsg({ m, M }) {
  const p = PEOPLE[m.who], Tm = toMotion(M.chat.swap);
  return (
    <motion.div className="ch-msg ag-msg tp-msg" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      <div className="ag-body">
        <span className="ag-who"><span className="ag-orb"><PFace id={m.who} size={18} /></span>
          <motion.b initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ ...Tm, delay: 0.06 }}>{p.n}</motion.b><small>{p.role}</small></span>
        <p className="ag-text">{m.text}</p>
        {m.file && <FileCard f={m.file} />}
      </div>
    </motion.div>);
}
function PJoin({ m, M }) {
  const n = andList(m.who.map((w) => PEOPLE[w].n));
  return (
    <motion.div className="ch-msg ag-join tp-join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <Stack ids={m.who} size={20} face={(w, s) => <PFace id={w} size={s} />} />
      <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...toMotion(M.chat.swap), delay: 0.15 }}>{n} {m.who.length > 1 ? "are" : "is"} in this conversation{m.day === "Today" ? ", with everything above" : ""}</motion.span>
    </motion.div>);
}
function TeamBrief({ b }) { return <dl className="tp-brief">{b.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>; }

export function Chat({ M, api, pageName = "Home", metrics = [] }) {
  if (typeof window !== "undefined") window.__northExplain = (q) => explainFor(q, metrics); // prototype: lets the review script read every explanation
  const [state, setState] = useState("closed"); // closed | full | dock | float | hidden  (bar: retired, kept for the veil)
  CARD.flag = toMotion(M.chat.flag); CARD.morph = M.chat.morph; CARD.M = M;
  useEffect(() => { const st = document.documentElement.style; st.setProperty("--cc-grow", M.chat.grow); st.setProperty("--cc-ripple", `${M.chat.ripple}ms`); }, [M.chat.grow, M.chat.ripple]);
  // the page slides on the same curve the chat moves on
  useEffect(() => { const st = document.documentElement.style, t = M.chat.shift || {}; st.setProperty("--shift-d", `${t.duration ?? 0.55}s`); st.setProperty("--shift-e", `cubic-bezier(${(t.ease || [0.25, 1, 0.5, 1]).join(",")})`); }, [M.chat.shift]);
  // where "just talking" opens: full screen for a fresh session, then wherever you last left it.
  // Asking about something on the page (highlight, a chart's ask, ⌥-pick, an Ask North button) docks so it stays in view.
  const lastMode = useRef("full");
  const [msgs, setMsgs] = useState(() => SEEDED());
  const [cont, setCont] = useState(null);
  // the chat you're in: an id, "__new" for a fresh one, or null for the latest. New messages join it.
  const [chat, setChatS] = useState(null), chatRef = useRef(null); const setChat = (c) => { chatRef.current = c; setChatS(c); };
  const newChatId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const who = useWho(), acts = useActions();
  const WATCH_SEED = SEAT_WATCH[who] || {
    "Felix ARR": { on: true, since: "Friday", last: "This morning · Initech added Felix",
      d: { label: "Felix ARR", now: "$12.99M", vals: [5.1, 6.4, 7.9, 9.42, 11.55, 12.99], when: "This morning", chg: { dir: "up", delta: "+$94K", note: "since Friday" }, text: "Initech added Felix this morning; $70K left to October's target." } },
    "Total ARR trend": { on: true, since: "Friday", last: "This morning · October passed $35.7M",
      d: { label: "Total ARR", now: "$35.75M", when: "This morning", chg: { dir: "up", delta: "+$1.60M", note: "October so far" }, text: "October added $1.60M; at this rate the year still lands $1.09M short." } },
    "Expansion win rate": { on: true, since: "Friday", last: "Yesterday · two sponsored deals closed",
      d: { label: "Expansion win rate", now: "31.9%", vals: [27.4, 28.6, 30.1, 29.2, 29.8, 31.9], when: "Yesterday", chg: { dir: "up", delta: "+2.1 pts", note: "since Friday" }, text: "Two deals with an exec sponsor closed. Still about half the 60% goal." } },
    "NRR dip in SMB": { on: true, since: "Tuesday", last: "Yesterday · Hooli renewed early",
      d: { label: "SMB renewals touched this month", now: "38%", vals: [61, 58, 55, 49, 44, 38], when: "Yesterday", chg: { dir: "up", delta: "Hooli renewed", note: "1 of 4 quiet accounts" }, text: "Hooli renewed early, but three of the four quiet accounts still haven't been contacted." } } };
  const [watched, setWatched] = useState(() => new Set(Object.keys(WATCH_SEED)));
  const [watchInfo, setWatchInfo] = useState(WATCH_SEED);
  const [watchOpen, setWatchOpen] = useState(false);
  // a change counts in the sidebar until you've looked at it (opened Watching once); after that only new changes count
  const [wSeen, setWSeen] = useState(() => new Set()), watchItems = useRef([]);
  const markWatchSeen = () => setWSeen((s0) => { const n = new Set(s0); watchItems.current.forEach((x) => n.add(x.tp + "|" + x.when)); return n.size === s0.size ? s0 : n; });
  const [watchFly, setWatchFly] = useState(null); // the list opened from the sidebar's Watching row: { top, left }
  const flyT = useRef(0), headT = useRef(0);
  // going full screen can land the Watching button under a still cursor (it sits where the full screen button was): only a real
  // hover opens the list, never the layout moving under you
  const fullAt = useRef(0); useEffect(() => { if (state === "full") { fullAt.current = performance.now(); setWatchOpen(false); } }, [state]);
  useEffect(() => { if (watchFly || watchOpen) markWatchSeen(); }, [!!watchFly, watchOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => {
    // once you've talked about a topic today (or opened its catch-up), it's not news on Home any more
    const talked = new Set(msgs.filter((x) => (x.role === "user" && x.day === "Today") || x.catchup).map((x) => x.catchup || x.topic));
    const items = Object.entries(watchInfo).filter(([tp, v]) => v.on && !talked.has(tp) && (v.d?.chg || (v.last && /^Just now/.test(v.last)))).map(([tp, v]) => {
      const d = watchDetail(tp); const upd = [...msgsRef.current].reverse().find((x) => x.topic === tp && x.proactive && !x.catchup), more = ((upd && upd.answer.text) || (SEED_UPD[tp] && SEED_UPD[tp].text) || "").split(/\n\n+/)[0];
      return { tp, more, label: v.d?.label || d.label || tp, now: v.d?.now || d.now, vals: v.d?.vals || d.vals || null, chg: v.d?.chg || { dir: "up", delta: v.last.replace(/^Just now · /, ""), note: "" }, text: v.d?.text || d.text, when: v.d?.when || "Just now" }; });
    watchItems.current = items; dispatchEvent(new CustomEvent("north:watching", { detail: { n: items.filter((x) => !wSeen.has(x.tp + "|" + x.when)).length, total: watched.size, items, quiet: Object.values(watchInfo).filter((v) => v.on && !v.d?.chg && !(v.last && /^Just now/.test(v.last))).length } }));
  }); return () => clearTimeout(t); }, [watched.size, watchInfo, msgs, wSeen]);
  const watchDetail = (tp) => {
    const wj = watchInfo[tp]; if (wj && wj.job) { const w = window.__northAgents?.watchOf(wj.job); return { label: "", now: null, vals: null, text: w ? w.line : "", job: wj.job }; }
    const seed = WATCH_SEED[tp] && WATCH_SEED[tp].d, ms = msgsRef.current || [];
    const upd = [...ms].reverse().find((x) => x.topic === tp && x.proactive);
    const ans = upd || [...ms].reverse().find((x) => x.topic === tp && x.role === "north" && x.answer && !x.kind && !x.answer.synth);
    const card = ans && ans.answer.card, tile = Object.values(CHAT_TILES).find((t) => t.thread && t.thread.title === tp), met = metrics.find((x) => x.label === tp);
    const two = (t) => (t || "").replace(/\n+/g, " ").split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    const vals = (card && card.series && card.series.slice(-14)) || (seed && seed.vals) || (tile && tile.series.vals) || (met && met.series && met.series.vals) || null;
    return { label: (upd || !seed) && card ? card.title : seed ? seed.label : (tile && tile.label) || (met && met.label) || tp,
      now: (upd || !seed) && card && card.big ? card.big : seed ? seed.now : (tile && tile.value) || (met && met.value) || null, vals,
      text: upd ? two(upd.answer.text) : seed ? seed.text : two(ans && ans.answer.text) };
  };
  const [unread, setUnread] = useState(() => new Set());
  const watchT = useRef({}); // a past topic you picked up again from the topics rail
  const asked = useRef(false); // the blurred bar is only for the first question of a session
  const [val, setVal] = useState("");
  const [quote, setQuote] = useState(null); // { k: text | chart | point, t }
  const [voice, setVoice] = useState(null); // null | { words }
  const [toastMsg, setToast] = useState(null);
  const [sel, setSel] = useState(null); // highlight-to-ask chip
  const [pick, setPick] = useState(false); // false | "alt" | "btn"
  const [aim, setAim] = useState(null); // { r, x, y, label, k }
  // "@" in the chat field lists the agents
  const atM = val.match(/(^|\s)@(\w*)$/), atList = atM ? AGENT_IDS.filter((id) => id.startsWith(atM[2].toLowerCase())) : [];
  useEffect(() => { if (atM) learn("at"); }, [!!atM]);
  const [atAct, setAtAct] = useState(0);
  // the list opens right above where you typed the @, inside the field (not at the edge of the chat)
  const [atX, setAtX] = useState(0);
  useLayoutEffect(() => {
    const ta = inputRef.current; if (!atList.length || !ta || ta.tagName !== "TEXTAREA") return;
    const form = ta.closest(".chat-input"), c = caretXY(ta), f = form.getBoundingClientRect(), r = ta.getBoundingClientRect();
    const at = Math.max(0, ta.value.lastIndexOf("@")); const x0 = r.left - f.left + c.x - (ta.value.length - at) * 7.5;
    setAtX(Math.max(6, Math.min(x0 - 10, f.width - 240)));
  }, [val, atList.length]);
  const pickAt = (id) => { setVal((v) => v.replace(/@(\w*)$/, `@${AGENTS[id].n} `)); setAtAct(0); inputRef.current && inputRef.current.focus(); };
  const [gcPrev, setGcPrev] = useState(null); // the Google Chat side, opened from a "Continued in Google Chat" link
  const [held, setHeld] = useState(null);
  const [peek, setPeek] = useState(null);
  // first run: North teaches itself one move at a time, in surfaces that already exist. A hint retires the moment you use the move
  // (not when you dismiss it), shows at most obCap times, and never two at once.
  const [ob, setOb] = useState(() => (M.chat.obKeep ? obLoad() : { learned: [], shown: {} }));
  const obRef = useRef(ob); obRef.current = ob;
  useEffect(() => { try { localStorage.setItem(OB_KEY, JSON.stringify(ob)); } catch (e) {} }, [ob]);
  const learn = (k) => setOb((o) => (o.learned.includes(k) ? o : { ...o, learned: [...o.learned, k] }));
  const shownHint = (k) => setOb((o) => ({ ...o, shown: { ...o.shown, [k]: (o.shown[k] || 0) + 1 } }));
  // every hint shows once per first run (the ⌥ one's cap is a dial); using the move, by key or by button, retires it
  const mayHint = (k) => M.chat.obOn && !obRef.current.learned.includes(k) && !(k === "alt" && obRef.current.learned.includes("btn")) && (obRef.current.shown[k] || 0) < (k === "alt" ? M.chat.obCap : 1);
  const [nudge, setNudge] = useState(null); // hovering a chart, first run: { id, el, x, y, title } → "hold ⌥"
  const nudgeRef = useRef(null); nudgeRef.current = nudge;
  const nudgeLbl = useRef(null), lastNudge = useRef(0), ptr = useRef([0, 0]);
  // K's speech bubble: born where your cursor is, its tail on the cursor, above what you're pointing at (below it near the top edge)
  const lastPtr = useRef(null), bubRef = useRef(null), bubW = useRef(280), bubCtx = useRef(null), [bub, setBub] = useState(null);
  const BUB_MIN = 200, BUB_MAX = 440;
  // the bubble is your message before you send it: its 4px corner sits on the cursor (the same tail your messages have in the chat),
  // opening right and up; near the right edge it opens left, near the top it opens down
  const bubGeo = (w) => { const b = bubRef.current, W = window.innerWidth, H = window.innerHeight, r = b.x - 2 + w > W - 16, flip = b.y < 150;
    const l = r ? Math.max(16, b.x + 2 - w) : Math.max(16, b.x - 2);
    return { l, w, flip, r, tx: r ? w - 6 : 6, bottom: Math.round(H - (b.y - 6)), top: Math.round(b.y + 20) }; };
  useEffect(() => { const mv = (e) => { lastPtr.current = { x: e.clientX, y: e.clientY, t: performance.now() }; }; window.addEventListener("pointermove", mv, { passive: true }); return () => window.removeEventListener("pointermove", mv); }, []);
  const [hintWatch, setHintWatch] = useState(null); // the answer whose Watch is offered
  const obSeen = useRef(0), obLast = useRef(0), obMuted = useRef(false); // answers since load, the answer that last got an offer, waved one away
  const [topicsPeek, setTopicsPeek] = useState(false);
  const peekTopics = () => { shownHint("topics"); learn("topics"); setTopicsPeek(true); setTopicsOpen(true);
    setTimeout(() => { setTopicsPeek(false); const r = document.querySelector(".ch-index"); if (!(r && r.matches(":hover"))) setTopicsOpen(false); }, M.chat.obPeekMs); };
  const [hintGc, setHintGc] = useState(null); // { id, who } — the answer whose Google Chat handoff is offered (names its owners) // hovering a question's reference: its chart glows again // the chart you picked: { id, el, k } — keeps its glass edge
  const inputRef = useRef(null), listRef = useRef(null), shellRef = useRef(null);
  const drag = useDragControls();
  const x = useMotionValue(0), y = useMotionValue(0);
  const L = useMotionValue(0), T = useMotionValue(0), Wd = useMotionValue(M.chat.width), Hd = useMotionValue(150);
  // morph, don't travel: fade + blur out where it is, re-form where it's going
  const op = useMotionValue(0), sc = useMotionValue(0.97), bl = useMotionValue(8), blur = useTransform(bl, (v) => (v > 0.05 ? `blur(${v}px)` : "none"));
  const holdRail = useRef(false); // opening full screen: the page holds still under the chat until it has formed
  const tailX = useTransform([L, Wd], ([l, w]) => (bubRef.current ? `${Math.max(20, Math.min(w - 20, bubRef.current.x - l))}px` : "50%")); // the tail stays on the cursor as the bubble widens
  const [origin, setOrigin] = useState("50% 0%");
  const stick = useRef(true);
  useEffect(() => { const f = () => { stick.current = false; }; window.addEventListener("north:unstick", f); return () => window.removeEventListener("north:unstick", f); }, []);
  const spaceT = useRef(null), voiceT = useRef(null); // the thread follows new content only while you're at the bottom
  const floatX = useRef(null);
  // where you put the pop-out chat and how big you made it (or the job card it took over from): it stays there until you move it
  const floatBox = useRef(null);
  const [full, setFull] = useState(null); // { id, from } — the answer whose card is open full screen
  const back = useRef(null);
  const wasFloat = useRef(null); // the pop-out stepped into the dock for a full view; it goes back when that view closes
  const backToFloat = (k) => { if (wasFloat.current === k) { wasFloat.current = null; if (stRef.current === "dock") open({ mode: "float" }); } };
  const openFull = (id, from) => { if (stRef.current === "float") { wasFloat.current = "full"; open({ mode: "dock" }); } setFull({ id, from, flat: stRef.current === "full" }); };
  const closeFull = () => { setFull(null); backToFloat("full"); const f = document.activeElement; if (f && f.closest && f.closest(".cc-x")) f.blur(); }; // called once the card has landed
  const [dockW, setDockW] = useState(M.chat.dockW); // drag the column's right edge to make it wider
  const dockWRef = useRef(dockW); dockWRef.current = dockW;
  const frame = (mode) => {
    const W = window.innerWidth, H = window.innerHeight;
    if (mode === "bar" && bubRef.current) { const g = bubGeo(bubW.current); return { l: g.l, t: g.flip ? g.top : H - g.bottom - 40, w: g.w, h: 40 }; }
    if (mode === "dock") { const sw = sideW(), w = Math.min(dockWRef.current, W - sw - 24); return { l: sw, t: 13, w, h: H - 13 - gapB() }; }
    // full: exactly the page card's frame (what .main fills when the chat isn't docked)
    if (mode === "full") { const sw = document.documentElement.classList.contains("side-open") ? SIDE : RAIL; return { l: sw, t: 13, w: W - sw - 12, h: H - 13 - gapB() }; }
    // the bar and the answer panel it grows into sit on the same bottom edge, centred over the page (not the sidebar)
    const af = document.querySelector(".agx .ask-dock.is-north")?.getBoundingClientRect(), own = af && af.width > 0;
    const mr = document.querySelector(".main")?.getBoundingClientRect(), sw = mr ? mr.left : sideW(), cx = own ? af.left + af.width / 2 : mr ? mr.left + mr.width / 2 : sw + (W - sw) / 2, bot = own ? Math.round(H - af.bottom) : gapB() + 7;
    if (mode === "float" && floatBox.current) { const fb = floatBox.current, w = clamp(fb.w, 320, W - 32), h = clamp(fb.h, 200, H - 26), l = clamp(fb.l, 16, W - 16 - w), t = clamp(fb.t, 13, H - 13 - h); return { l, t, w, h }; }
    if (mode === "float") { const w = own ? af.width : Math.min(M.chat.width, W - sw - 32), h = Math.min(M.chat.floatH, H - 120); const l = floatX.current == null ? cx - w / 2 : Math.max(16, Math.min(W - 16 - w, floatX.current)); return { l, t: H - bot - h, w, h }; }
    const w = Math.min(M.chat.width, W - sw - 32); return { l: cx - w / 2, t: H - (own ? bot : barB()) - 150, w, h: 150 };
  };
  const place = (mode, instant) => {
    const f = frame(mode), tr = toMotion(M.chat.open);
    x.set(0); y.set(0);
    [[L, f.l], [T, f.t], [Wd, f.w], [Hd, f.h]].forEach(([mv, v]) => (instant ? mv.set(v) : animate(mv, v, tr)));
  };
  const prevSt = useRef(null); const stRef = useRef(state); stRef.current = state;
  const msgsRef = useRef(msgs); msgsRef.current = msgs;
  const newRef = useRef(false); // the chat on screen is a fresh one (nothing said yet)
  // switching seats: that person's own history and Watching, a fresh start in the chat, and the chat put away
  const seatFirst = useRef(true);
  useEffect(() => { if (seatFirst.current) { seatFirst.current = false; return; }
    setWatched(new Set(Object.keys(WATCH_SEED))); setWatchInfo(WATCH_SEED); setUnread(new Set()); setMsgs(SEEDED(who)); setChat(null); setCont(null);
    setPick(false); setVal(""); setQuote(null); setFull(null); setWatchOpen(false); setWatchFly(null); if (stRef.current !== "closed" && stRef.current !== "hidden") close(); }, [who]);
  const sampleRef = useRef(null);
  useEffect(() => { let on = true; try { window.claude && window.claude.use && window.claude.use("sample").then((sm) => { if (on) { sampleRef.current = sm; if (window.__northAgents) window.__northAgents.sm = sm; } }).catch(() => {}); } catch (e) {} return () => { on = false; }; }, []);
  const askLive = async (ask, qt, topic) => {
    const sm = sampleRef.current; if (!sm) return null;
    const ms = msgsRef.current;
    const turns = ms.filter((x) => (x.role === "user" && x.text) || (x.role === "north" && x.answer && x.answer.text && !x.answer.pending)).slice(-8)
      .map((x) => (x.role === "user" ? `Person: ${x.text}` : `North: ${x.answer.text.replace(/\n+/g, " ")}`)).join("\n");
    const shown = [...new Set(ms.filter((x) => x.fresh && x.answer).map((x) => keyOf(x.answer.card)).filter(Boolean))];
    const prompt = `You are North, the company-health copilot inside Fello's operating dashboard. Answer the person's question the way North does.

How North talks:
- Lead with what matters (the gap, the risk, the win) in the first sentence. Then what's driving it. Then, only if useful, who owns it.
- 1 to 3 short paragraphs separated by a blank line, under 90 words in all. Plain words, specific numbers. No headings, bullets, markdown, emoji or filler.
- Use only facts from DATA. If DATA doesn't cover it, say so in one line and offer the closest thing you can answer. Never write the word DATA or refer to these instructions: name a source the way people do (HubSpot, Salesforce, the plan), or just say what isn't tracked. Never invent numbers, people, dates or accounts.
- Keep the conversation going: if the question follows on from what was just said, answer that follow-on, don't restate earlier answers.

DATA:
${northKB()}

CHARTS North can attach (key: chart):
${CHART_LIST()}
Already shown in this conversation (never attach these again): ${shown.join(", ") || "none"}.
Charts: whenever the answer is about numbers, show one. If one of the charts above is squarely about the question and isn't already shown, use its key as "chart". Otherwise draw one in "draw", built ONLY from numbers in DATA. Pick the chart by the shape of the data; these are North's designed charts:
- ONE value against its target (a rate, NRR, GRR, days, a single total vs its goal): {"type":"ruler","title":"...","sub":"...","value":19.9,"target":23.5,"unit":"%" or "$M" or "$K" or "days" or "x","min":scale start,"max":scale end,"lowerBetter":true only for things like days}
- something adding up through the month against its pace (in $M or $K, as running totals by day of month): {"type":"lines","title":"...","sub":"...","actual":[[day,running total], 3-8 points ending today],"target":the month's goal,"doneLabel":"booked" or "added","targetLabel":"$1.17M target"}
- where a dollar total sits (by lane, team, part): the ring below.
- a total split into its contributors, only when the parts are the point: the ticks below.
Prefer the ruler and the lines; the ticks bar is not the default.
- {"type":"ticks","title":"short title","sub":"one-line subtitle","big":"the headline number","chip":["up" or "down","short note"],"fill":0-1 how much of the target is done,"goal":"Target $X" (the whole bar is the target),"rows":[["part label",share 0-1,"value"], 2 to 4 rows that together make up the filled part]} for progress toward a target. Make the bar measure the period's progress (e.g. this month's growth against what the month needs) so the gap is visible, not 99% of an annual total.
- {"type":"ring","title":"...","sub":"...","whole":total in $K,"parts":[["label",value in $K,"owner"], 2 to 4 parts],"restLabel":"what the rest is"} for where a dollar total sits.
Use "draw": null only for answers with no numbers (who, why without figures, yes/no).

Conversation so far (oldest first):
${turns || "(nothing yet)"}

Current topic: ${topic || "none"}${qt ? `\nThe person attached this from the page: ${qt.t}` : ""}
Question: ${ask}

Reply with only JSON: {"text": "the answer, paragraphs separated by \\n\\n", "chart": "one key from the list or none", "draw": null or a chart object as above, "topic": "the current topic exactly if this continues it, else a new 2-4 word title"}`;
    const r = await sm.json(prompt, { modelTier: "quick", cache: false });
    if (!r || typeof r.text !== "string" || !r.text.trim()) throw { code: "empty_completion" };
    const ck = CHART_KEYS.includes(r.chart) && !shown.includes(r.chart) ? r.chart : null;
    return { steps: [], text: r.text.trim(), card: ck ? ANSWERS[ck].card : liveCard(r.draw), key: ck || "live", topic: (typeof r.topic === "string" && r.topic.trim().slice(0, 40)) || topic, follow: [] };
  };
  const busy = msgs.some((m) => m.role === "north" && m.fresh && !m.finished);
  const showing = state === "bar" || state === "dock" || state === "float" || state === "full";
  const isOpen = (st) => st === "bar" || st === "dock" || st === "float" || st === "full";
  const ctxMode = () => (stRef.current === "float" ? "float" : "dock"); // asking about something: keep it in view

  const toast = (t) => { setToast(t); clearTimeout(toast.t); toast.t = setTimeout(() => setToast(null), 2200); };
  // the field grows to fit what's written, like Claude's
  const fitInput = () => { const el = inputRef.current; if (!el || el.tagName !== "TEXTAREA") return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 196)}px`; el.style.overflowY = el.scrollHeight > 196 ? "auto" : "hidden"; };
  useLayoutEffect(fitInput, [val, state, voice]);
  // and again whenever its width changes: measured mid-morph (the bubble opening into full screen) it was a few pixels wide, the
  // placeholder wrapped letter by letter, and the field stayed at its tallest
  useEffect(() => { const el = inputRef.current; if (!el || typeof ResizeObserver === "undefined") return; let w = el.offsetWidth;
    const ro = new ResizeObserver(() => { if (el.offsetWidth !== w) { w = el.offsetWidth; fitInput(); } }); ro.observe(el); return () => ro.disconnect(); }, [state, voice]);
  const focusInput = () => setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
  const ORIGIN = { bar: "50% 100%", dock: "0% 50%", float: "50% 100%", full: "50% 40%" };
  const formIn = (soft) => { if (soft) { bl.set(0); animate(op, 1, { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }); animate(sc, 1, { duration: 0.6, ease: [0.32, 0.72, 0, 1] }); return; } // soft: the bubble's answer arrives unasked-for, so it eases in rather than appears
    const t = bubRef.current && stRef.current === "bar" ? { type: "spring", visualDuration: 0.4, bounce: 0.2 } : toMotion(M.chat.open); bl.set(0); animate(op, 1, { duration: 0.18, ease: [0.22, 1, 0.36, 1] }); animate(sc, 1, t); };
  const morphT = useRef(null);
  const openedAt = useRef(0);
  const open = (opts = {}) => {
    openedAt.current = performance.now(); moving();
    const st = stRef.current, was = !isOpen(st);
    const mode = opts.mode || (was ? lastMode.current : st);
    if (mode !== "bar") lastMode.current = mode;
    if (was) { place(mode, true); op.set(0); bl.set(0); if (mode === "full") holdRail.current = true;
      if (mode === "bar" && bubRef.current) { const g = bubGeo(bubW.current); sc.set(0.4); setOrigin(`${g.r ? "100%" : "0%"} ${g.flip ? "0%" : "100%"}`); } else { sc.set(0.985); setOrigin(ORIGIN[mode]); }
      setState(mode); requestAnimationFrame(formIn); }
    else if (mode !== st || opts.reform) {
      clearTimeout(morphT.current);
      animate(op, 0, { duration: opts.soft ? 0.11 : 0.08 }); animate(sc, 0.99, { duration: opts.soft ? 0.11 : 0.08 });
      morphT.current = setTimeout(() => { if (mode === "full" && st === "bar") holdRail.current = true; place(mode, true); sc.set(opts.soft ? 0.975 : 0.985); setOrigin(ORIGIN[mode]); setState(mode); requestAnimationFrame(() => formIn(opts.soft)); }, opts.soft ? 110 : 85);
    } else place(mode, false);
    stRef.current = mode; // it's open from this keystroke on: the next keys add to the field instead of opening it again
    if (opts.quote !== undefined) setQuote(opts.quote);
    if (opts.text !== undefined) setVal(opts.text);
    focusInput();
  };
  // already open: the chat reshapes into its new place on one curve while the page slides in or out behind it
  function shift(mode, opts = {}) {
    openedAt.current = performance.now(); moving(750);
    const st = stRef.current; if (mode !== "bar") lastMode.current = mode;
    if (opts.quote !== undefined) setQuote(opts.quote);
    if (opts.text !== undefined) setVal(opts.text);
    if (!isOpen(st) || mode === st) { focusInput(); return; }
    clearTimeout(morphT.current); x.stop(); y.stop(); x.set(0); y.set(0); op.set(1); sc.set(1); bl.set(0);
    if (st === "bar" && shellRef.current) { const r = shellRef.current.getBoundingClientRect(); L.set(r.left); T.set(r.top); Wd.set(r.width); Hd.set(r.height); }
    if (mode === "full" && st === "bar") holdRail.current = true; // the page holds still until the chat has covered it
    setOrigin(ORIGIN[mode]); setState(mode);
    const f = frame(mode), tr = toMotion(M.chat.shift);
    [[L, f.l], [T, f.t], [Wd, f.w], [Hd, f.h]].forEach(([mv, v]) => animate(mv, v, tr));
    focusInput();
  }
  // the room for an answer: everything below your question down to the bottom of the thread
  const [reserve, setReserve] = useState(0);
  const makeRoom = () => {
    const el = listRef.current; if (!el) return;
    const us = el.querySelectorAll(".ch-user"), u = us[us.length - 1]; if (!u) return;
    const hd = u.previousElementSibling && u.previousElementSibling.classList.contains("ch-topic") ? u.previousElementSibling : u;
    const cs = getComputedStyle(el), padT = parseFloat(cs.paddingTop), padB = parseFloat(cs.paddingBottom), gap = parseFloat(cs.rowGap) || 28;
    const above = u.offsetTop + u.offsetHeight - hd.offsetTop;
    setReserve(Math.max(0, Math.round(el.clientHeight - padT - padB - above - gap)));
    stick.current = true; // the thread glides there (the follow loop eases to the new bottom)
  };
  // the room follows the chat's size (dock ⇄ full screen, window resize)
  useEffect(() => { if (!reserve) return; const t = setTimeout(makeRoom, 620); return () => clearTimeout(t); }, [state]);
  useEffect(() => { const r = () => reserve && makeRoom(); addEventListener("resize", r); return () => removeEventListener("resize", r); });
  // "move NRR first", "put Felix ARR after Total ARR", "swap NRR and Felix ARR": only what's on your Home moves; it just happens
  // (the same toast as adding), and anything unclear gets one line back in the thread
  const moveByName = (pi, ask, say) => {
    const find = (what) => { const r = pinMatch(what, metrics), here = r.hits.filter((h) => acts.onHome(h.id)); return here.length === 1 ? here[0] : r.hits.length === 1 ? r.hits[0] : here[0] || null; };
    const it = find(pi.what), ref = pi.ref ? find(pi.ref) : null;
    let text = null;
    if (!it) text = `I couldn’t find “${pi.what}” on your Home.`;
    else if (!acts.onHome(it.id)) text = `${it.name} isn’t on your Home. Add it first?`;
    else if (pi.ref && (!ref || !acts.onHome(ref.id))) text = `I couldn’t find “${pi.ref}” on your Home.`;
    else if (ref && tileOf(ref.id) === tileOf(it.id)) text = `That’s the same chart.`;
    if (!text) { const where = pi.move === "first" || pi.move === "last" ? pi.move : { [pi.move]: ref.id };
      acts.moveHome(it.id, where);
      text = pi.move === "first" ? `Moved ${it.name} first` : pi.move === "last" ? `Moved ${it.name} to the end` : pi.move === "swap" ? `Swapped ${it.name} and ${ref.name}` : `Moved ${it.name} ${pi.move} ${ref.name}`;
      if (say) return text;
      if (stRef.current === "bar" || newRef.current || !isOpen(stRef.current)) { if (isOpen(stRef.current)) close(); }
      toast(text); return "quiet"; }
    if (say) return null; // not done: let North take it as a question, where it answers in the thread
    const id = Date.now().toString(36); asked.current = true;
    setMsgs((ms) => { const prev = [...ms].reverse().find((m) => m.role === "user" || m.catchup), topic = (prev && prev.topic) || "Today";
      return [...ms.map((m) => ({ ...m, last: false })), { id: id + "u", role: "user", text: ask, topic, day: "Today" }, { id, role: "north", answer: { steps: [], text, follow: it && !acts.onHome(it.id) ? [`Add ${it.name} to Home`] : [], noSum: true, pinned: true }, topic, fresh: true, last: true }]; });
    if (stRef.current === "bar") lift();
    return true;
  };
  useEffect(() => { window.__northHomeCmd = (raw) => { const pi = pinIntent(raw); if (!pi) return null; const r = pinByName(pi, raw, null, true); return typeof r === "string" ? r : null; }; return () => { window.__northHomeCmd = null; }; });
  const pinByName = (pi, ask, qt, say) => {
    pi = { ...pi, what: pi.what.replace(/\s+back$/i, "") }; // "put NRR back on my Home"
    if (pi.move) return moveByName(pi, ask, say);
    const pron = /^(this|that|it|this one|that one|this chart|that chart|the chart)$/i.test(pi.what.trim());
    let hit = null, hits = [], near = [];
    if (pron) { const card = qt && qt.card ? null : [...msgsRef.current].reverse().find((m) => m.role === "north" && m.answer && m.answer.card)?.answer.card;
      const cand = qt && qt.id ? canon(qt.id) : card && card.pin ? card.pin : null;
      const it = cand && pinCatalog(metrics).find((x) => x.id === cand);
      if (it) hit = it; else if (!qt && !card) return false; }
    else { const r = pinMatch(pi.what, metrics); hits = r.hits; near = r.near || []; if (hits.length === 1) hit = hits[0]; }
    if (pi.loose && !hit && !hits.length) return false; // "add Lisa", "pin the note": not a chart, so North takes it as a question
    // "here" is the page you're on. Only Home holds pinned charts, so anywhere else North offers Home instead
    if (say && (!hit || (pi.dest === "here" && pageName !== "Home" && pi.add))) return null; // spoken and not clear-cut: North answers it in the thread
    if (hit && pi.dest === "here" && pageName !== "Home" && pi.add) {
      const id = Date.now().toString(36), on0 = acts.onHome(hit.id);
      const text = on0 ? `${hit.name} is already on your Home. Charts can only be pinned to Home for now.` : `Charts can only be pinned to Home for now, not ${pageName === "Agents" ? "the Agents page" : pageName === "Company health" ? "Company health" : "this page"}. Want ${hit.name} on Home?`;
      setMsgs((ms) => { const prev = [...ms].reverse().find((m) => m.role === "user" || m.catchup), topic = (prev && prev.topic) || "Today";
        return [...ms.map((m) => ({ ...m, last: false })), { id: id + "u", role: "user", text: ask, quote: qt, topic, day: "Today" }, { id, role: "north", answer: { steps: [], text, follow: on0 ? [] : [`Add ${hit.name} to Home`], noSum: true, pinned: true }, topic, fresh: true, last: true }]; });
      asked.current = true; if (stRef.current === "bar") lift(); return true; }
    const on = (id) => acts.onHome(id), bar = stRef.current === "bar";
    let text, follow = [];
    if (hit) {
      // it just happens: no answer in the thread. From the bubble or an empty chat, the chat steps aside so you see Home take it;
      // mid-conversation the chat stays where it is and says so in a toast. Everything on your Home is yours to take off, its own
      // four included (and to put back by name)
      if (pi.add && on(hit.id)) text = `${hit.name} is already on your Home`;
      else if (!pi.add && !on(hit.id)) text = `${hit.name} isn’t on your Home`;
      else { acts.toggleHome(hit.id); text = pi.add ? `Added ${hit.name} to your Home` : `Took ${hit.name} off your Home`; }
      if (say) return text;
      if (bar || newRef.current || !isOpen(stRef.current)) { if (isOpen(stRef.current)) close(); }
      if (!pron) setQuote(null); // a chart you were pointing at isn't what you asked to add: let it go
      toast(text); return "quiet";
    } else if (hits.length > 1) { text = `There’s more than one: ${hits.slice(0, 4).map((h) => h.name).join(", ")}. Which one?`; follow = hits.slice(0, 3).map((h) => `${pi.add ? "Add" : "Remove"} ${h.name} ${pi.add ? "to" : "from"} Home`); }
    else if (pron) text = "That chart can’t go on Home yet. Name the metric and I’ll add it.";
    else { text = near.length ? `I couldn’t find a chart called “${pi.what}”. Did you mean one of these?` : `I couldn’t find a chart called “${pi.what}”.`; follow = near.map((h) => `${pi.add ? "Add" : "Remove"} ${h.name} ${pi.add ? "to" : "from"} Home`); }
    const id = Date.now().toString(36); asked.current = true;
    setMsgs((ms) => { const prev = [...ms].reverse().find((m) => m.role === "user" || m.catchup), topic = (prev && prev.topic) || "Today";
      return [...ms.map((m) => ({ ...m, last: false })), { id: id + "u", role: "user", text: ask, quote: qt, topic, day: "Today" }, { id, role: "north", answer: { steps: [], text, follow, noSum: true, pinned: true }, topic, fresh: true, last: true }]; });
    if (bar) lift();
    return true;
  };
  // ---- teammates: an @name brings them into the conversation you're in, with everything above; once people are in it,
  // what you say goes to them. North stays in the room: it notices work in what's said and offers it, keeps a conversation to
  // its subject, and turns a conversation that has grown a few pieces of work into a project. Nothing happens without a tap.
  const teamT = useRef([]), later = (ms, f) => teamT.current.push(setTimeout(f, ms));
  const inChatOf = (id) => msgsRef.current.filter((m) => m.chat === id);
  const pplOf = (id) => { const S0 = new Set(); inChatOf(id).forEach((m) => { if (m.role === "person") S0.add(m.who); if (m.role === "pjoin") m.who.forEach((w) => S0.add(w)); }); return [...S0]; };
  const askOf = (id) => { let a = null; inChatOf(id).forEach((m) => { if (m.role === "person" && m.asks) a = m.who; if (m.role === "user") a = null; }); return a; };
  const nameOfChat = (id) => { const ms = inChatOf(id), r = [...ms].reverse().find((m) => m.retitle); return r ? r.retitle : (ms.find((m) => m.topic) || {}).topic; };
  const postTo = (id, m) => { stick.current = true; const k = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setMsgs((x) => { const tp = [...x].reverse().find((y) => y.chat === id && y.topic); return [...x.map((mm) => ({ ...mm, last: false })), { id: k, chat: id, topic: tp ? tp.topic : m.topic, day: "Today", last: true, ...m }]; }); return k; };
  const say = (id, who, text, extra = {}) => postTo(id, { role: "person", who, text, ...extra });
  const offer = (id, text, next, sug) => postTo(id, { role: "agent", agent: "north", chit: true, text, next, sug });
  const replyOf = (who, about) => /pricing|renewal/i.test(about) ? "Let’s hold pricing until onboarding is done. I’ll bring it back here after the setup call." : "Got it. I’ll come back to you here.";
  // the walkthrough's webinar conversation (sample): Heather and Jordan talk it through, Riley joins when a number comes up
  const runWebinar = (id) => {
    later(1500, () => say(id, "heather", "Yes. Brokerages keep asking how other teams use Felix on listings. That’s the hook."));
    later(3300, () => say(id, "jordan", "Customer Value could bring two customers to speak. How many brokerages are big enough to draw a crowd?"));
    later(4500, () => postTo(id, { role: "agent-join", ids: ["riley"], joined: true }));
    later(5600, () => postTo(id, { role: "agent", agent: "riley", chit: true, text: "38 brokerages in HubSpot have more than 50 agents, and 9 of them are already customers. (Sample figures.)" }));
    later(7600, () => say(id, "jordan", "I’ll pull the customer list by Thursday and ask the two best fits."));
    later(8400, () => offer(id, "Jordan said she’ll pull the customer list by Thursday.", { title: "Make it a piece of work, Jordan’s, due Thursday", button: "Make it a piece", ok: "Jordan has it, due Thursday", nok: "Left as talk" }, { id: "p-cust" }));
  };
  const teamAccept = (m, yes) => {
    const id = m.chat, k = m.sug.id, via = nameOfChat(id); if (!yes) return;
    if (k === "p-cust") {
      talk.addPiece({ k: "p-cust", from: id, via, t: "Customer speakers for the webinar", people: ["jordan"], zone: "moving", pr: 2, stTxt: "Due Thursday",
        line: "Jordan pulls the customer list and asks the two best fits. North checks in with her Thursday if it isn’t in." });
      later(1800, () => say(id, "heather", "I’ll need those 38 brokerages as an invite list."));
      later(2700, () => offer(id, "Orin can build Heather’s invite list from HubSpot.", { title: "Give the invite list to Orin", button: "Give it to Orin", ok: "Orin has it", nok: "Left as talk" }, { id: "p-inv" }));
    } else if (k === "p-inv") {
      talk.addPiece({ k: "p-inv", from: id, via, t: "Webinar invite list", ag: "orin", zone: "moving", pr: 1, stTxt: "Working", line: "Orin is building it from HubSpot." });
      later(4200, () => { talk.updPiece("p-inv", { zone: "landed", stTxt: "Done", line: "Ready: 38 brokerages with more than 50 agents (sample)." });
        postTo(id, { role: "agent", agent: "orin", chit: true, text: "The invite list is ready: 38 brokerages, sample data." }); });
      later(5600, () => say(id, "heather", "Sam, can you pick the date? Late January works for marketing.", { asks: true }));
      later(6400, () => offer(id, "Heather asked you to pick the date.", { title: "Make it yours", button: "Make it mine", ok: "It’s yours. Answer Heather here and it’s done", nok: "Not now" }, { id: "p-date" }));
    } else if (k === "p-date") {
      talk.addPiece({ k: "p-date", from: id, via, t: "Pick the webinar date", people: ["sam"], zone: "need", pr: 2, stTxt: "Needs you", act: "Answer Heather", line: "Heather suggested late January. Answer in the conversation and it’s done." });
      later(1400, () => offer(id, "This conversation has three pieces of work now.", { title: "Make it a project", button: "Make it a project", ok: "It’s a project: Q1 brokerage webinar", nok: "Kept as a conversation" }, { id: "proj" }));
    } else if (k === "proj") {
      postTo(id, { role: "agent", agent: "north", chit: true, retitle: "Q1 brokerage webinar", text: "Here’s where you landed.",
        brief: [["Hook", "How other brokerages use Felix on listings"], ["Speakers", "Two customers, picked by Jordan"], ["Invites", "38 brokerages over 50 agents (sample)"], ["Date", "Late January, Sam to confirm"]] });
      talk.get().pieces.filter((x) => x.from === id).forEach((x) => talk.updPiece(x.k, { via: "Q1 brokerage webinar" }));
    } else if (k === "mv") {
      setMsgs((x) => x.filter((y) => y.id !== m.sug.ref));
      postTo("t-bw", { role: "user", text: m.sug.text, topic: "Brightwater Realty" });
    }
  };
  // what you say in a conversation with people in it. North reads it for where it belongs and what it settles
  const teamSend = (ask, named, here, quiet = false, title = null) => {
    const id = here || newChatId(), had = here ? pplOf(here) : [], fresh = named.filter((n) => !had.includes(n));
    const text = ask.replace(/@[a-z]+[,:]?/gi, "").replace(/\s+/g, " ").trim().replace(/^[,.\s-]+/, ""), body = text ? text[0].toUpperCase() + text.slice(1) : ask;
    const web = !here && /webinar/i.test(text) && named.includes("heather") && named.includes("jordan");
    const topic = (here && nameOfChat(here)) || title || (web ? "Q1 webinar for brokerages" : titleOf(text));
    const b = Date.now().toString(36), wait = here ? askOf(here) : null;
    stick.current = true; asked.current = true; setCont(null);
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: b + "u", role: "user", text: ask, chat: id, topic, day: "Today" },
      ...(fresh.length ? [{ id: b + "p", role: "pjoin", who: fresh, chat: id, topic, day: "Today" }] : [])]);
    if (!quiet) { setChat(id); if (stRef.current === "bar") lift(); }
    if (web) { runWebinar(id); return; }
    if (/brightwater/i.test(text) && !/brightwater/i.test(topic)) { later(700, () => offer(id, `This is about Brightwater Realty, not ${topic}.`, { title: "Move it to Brightwater Realty", button: "Move it", ok: "Moved to Brightwater Realty", nok: "Kept here" }, { id: "mv", ref: b + "u", text: body })); return; }
    const dp = talk.piece("p-date");
    if (dp && dp.zone === "need" && dp.from === id) { talk.updPiece("p-date", { zone: "landed", act: null, stTxt: "Done", line: `You picked: ${body}` }); later(1300, () => say(id, "heather", "Locking it in. Thanks.")); return; }
    if (wait) { later(1400, () => say(id, wait, id === "t-slide" ? "Got it. I’ll update the slide." : "Thanks.")); return; }
    const agentSaid = here && [...msgsRef.current].reverse().find((m) => m.chat === here && m.role === "agent" && m.agent !== "north" && m.text && !m.typing);
    if (fresh.length && agentSaid) {
      const first = (agentSaid.text.match(/^[^.!?]+[.!?]/) || [agentSaid.text])[0];
      later(900, () => postTo(id, { role: "agent", agent: "north", chit: true, topic, text: `Caught ${andList(fresh.map((k) => PEOPLE[k].n))} up: ${AGENTS[agentSaid.agent].n} is working ${topic} with you. Latest: ${first}` }));
      later(2600, () => say(id, fresh[0], `Thanks, I’m caught up. I’ll take anything on ${topic} that needs me here.`)); return; }
    if (fresh.length) later(1600, () => say(id, fresh[0], replyOf(fresh[0], topic + " " + text)));
  };
  // Home opens a conversation by id, or posts into one (the Brightwater hand-off happens on its piece)
  useEffect(() => {
    const o = (e) => { const id = e.detail && e.detail.id; if (!id) return; open({ mode: "full", quote: null }); setTimeout(() => { setChat(id); setCont(null); stick.current = true; requestAnimationFrame(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }); }, 60); };
    const p = (e) => { const d = e.detail || {}; if (d.id && d.m) postTo(d.id, d.m); };
    // a reply sent from where the conversation is open on the page: it goes in, the chat stays where it is
    // @ someone in it: a teammate joins; an agent picks it up in the conversation and says so (what it finds comes later, here)
    const s = (e) => { const d = e.detail || {}; if (!d.text) return;
      if (!d.id) { if (d.people && d.people.length) teamSend(d.text, d.people.filter((k) => PEOPLE[k]), null, true, d.topic || null); return; } // a new conversation (a comment on a file nobody's talking about yet)
      const ppl = Object.keys(PEOPLE).filter((k) => new RegExp(`@${PEOPLE[k].n}\\b`, "i").test(d.text)), ags = agentsIn(d.text);
      teamSend(d.text, ppl, d.id, true);
      ags.forEach((a, i) => later(1300 + i * 900, () => postTo(d.id, { role: "agent", agent: a, chit: true, text: AG_ACK[a] || "On it. I’ll post it here." }))); };
    const fo = () => { if (isOpen(stRef.current)) close(); if (pageRef.current !== "Home") dispatchEvent(new CustomEvent("north:go", { detail: "home" })); };
    addEventListener("north:open-file", fo);
    // said out loud while a conversation is open full screen: it goes into that conversation, never a new one
    const vs = (e) => { if (!document.documentElement.classList.contains("chat-talking")) return; const id = chatRef.current; if (!id || id === "__new") return;
      // an agent addressed out loud goes to the agent, the same as typing @ them, even with people in the conversation
      if (agentsIn(e.detail.raw).length) { e.preventDefault(); sendRef.current && sendRef.current(e.detail.raw); e.detail.done = "Asked here"; return; }
      const ppl = pplOf(id).filter((k) => k !== "sam" && PEOPLE[k]); if (e.detail.need && !e.detail.need.every((k) => ppl.includes(k))) return;
      const text = bodyFor(e.detail, ppl); e.preventDefault();
      if (ppl.length) { dispatchEvent(new CustomEvent("north:talk-send", { detail: { id, text } })); e.detail.done = `Sent to ${andList(ppl.map((k) => PEOPLE[k].n))}`; }
      else { sendRef.current && sendRef.current(text); e.detail.done = "Asked here"; } };
    addEventListener("north:voice-say", vs);
    const cp = (e) => { const d = e.detail || {}; composeTopic.current = d.topic || null; setChat("__new"); setCont(null); setQuote(null); setHeld(null);
      // "float": a small window in the page's bottom-right corner, over the page and movable, so what you're looking at stays in view
      if (d.mode === "float") { const W = innerWidth, H = innerHeight, w = Math.min(400, W - 32), h = Math.min(460, H - 120); floatBox.current = { l: W - w - 24, t: H - h - 24, w, h }; }
      open({ mode: d.mode || "full", quote: null }); setVal(d.text || "");
      // the full chat's field mounts as it opens: focus it then, the caret after the names
      setTimeout(() => { const el = inputRef.current; if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch {} } }, 420); };
    addEventListener("north:compose", cp); const offCp = () => removeEventListener("north:compose", cp);
    addEventListener("north:open-thread", o); addEventListener("north:talk-post", p); addEventListener("north:talk-send", s);
    return () => { offCp(); removeEventListener("north:open-thread", o); removeEventListener("north:talk-post", p); removeEventListener("north:talk-send", s); removeEventListener("north:open-file", fo); removeEventListener("north:voice-say", vs); };
  });
  const sendRef = useRef(null), composeTopic = useRef(null);
  const send = (q, qt = quote, north = false) => { // north: a chart's action asks North itself, never whichever agent spoke last
    // any seat: a command ("make a deck…", "bring up the webinar deck", "book 30 minutes with Heather…") does the thing, and North
    // says so here. Arranging Home ("add NRR to my Home", "move NRR first") is handled below, as a toast, not a message
    const cq = String(q ?? val ?? "").trim(); // typed in the field (no q) or handed in, the same
    // a page that answers for itself (Meetings: "Thursday", "the pipeline review"): the page brings it up and the bar steps away
    if (!north && cq && window.__northPageFind && !peopleIn(cq).length) { const r = window.__northPageFind(cq); if (r) { setVal && setVal(""); close(); return; } }
    if (!north && cq && !qt && !pinIntent(cq) && !peopleIn(cq).length) { window.__northFromChat = true; /* a message to people is a message, never a page command ("…with Paul" isn't "show me 1:1 with Paul") */ let r; try { r = runCommand(cq); } finally { window.__northFromChat = false; } if (r) { const id = chatRef.current && chatRef.current !== "__new" ? chatRef.current : newChatId();
      postTo(id, { role: "user", text: cq, topic: titleOf(cq) }); setChat(id); setVal && setVal("");
      later(600, () => postTo(id, { role: "agent", agent: "north", chit: true, text: getWho() === "sam" ? `${r}. It’ll be in your work when it’s ready.` : `${r}.` })); return; } }
    const text = (q ?? val).trim(); if (!text && !qt) return;
    setHintWatch(null); setHintGc(null);
    if (!qt) setHeld(null); // a question that isn't about the chart: the chart's glass edge lets go
    stick.current = true;
    const id = Date.now().toString(36);
    const ask = text || "Tell me about this";
    // a Google Chat draft is open: what you say edits it ("tag Lisa", "post it in sales leadership", "send it");
    // a question still goes to North
    const draft = [...msgsRef.current].reverse().find((x) => x.kind === "gchat" && x.gc.step === "compose");
    if (draft && text && !/google chat|gchat|g chat|hangouts?/i.test(ask)) {
      const r = applyCommand(draft.gc, ask);
      if (r) { updGc(draft.id, { ...r.g, flash: r.did.join(" · ") || null, ...(r.send ? { step: "sending", flash: null } : {}) }); setVal(""); return; }
    }
    // "add Outbound demos booked to Home": done on the spot. From the bubble it just happens (the bubble steps aside so you see the
    // tile arrive); in a conversation North says so in one line, with the way back
    const pi = text && pinIntent(text);
    if (pi) { if (pinByName(pi, ask, qt)) { setVal(""); return; } }
    // teammates: naming one brings them in; once people are in a conversation, what you say goes to them (naming an agent or
    // North still asks them)
    { const bringP = /\b(bring|loop|pull|add|invite|include|cc)\b/i.test(ask) && !agentsIn(ask).length;
      const named = [...new Set([...peopleIn(ask), ...(bringP ? Object.keys(PEOPLE).filter((k) => k !== "sam" && new RegExp(`\\b${PEOPLE[k].n}\\b`, "i").test(ask)) : [])])], here = chatRef.current === "__new" ? null : chatRef.current || latestChat(msgsRef.current);
      const inHere = here ? pplOf(here) : [];
      if ((named.length || inHere.length) && !agentsIn(ask).length && !/@north\b/i.test(ask)) { const into = here && (inHere.length || named.length) ? here : null, tp = into ? null : composeTopic.current; composeTopic.current = null;
        teamSend(ask, named, into, false, tp); setVal(""); return; } }
    // an account: when the question names a deal (or this conversation is about one), the agents named, or the agents already
    // working it here, answer about that account from its own facts. Two or more huddle, then keep working on it as a job.
    { const here = chatRef.current === "__new" ? null : chatRef.current || latestChat(msgsRef.current), tg = agentsIn(ask).sort((x, y) => ask.toLowerCase().indexOf("@" + x) - ask.toLowerCase().indexOf("@" + y));
      const deal = dealIn(ask.replace(/@\w+/g, "")) || (here ? dealIn(([...msgsRef.current].reverse().find((m) => m.chat === here && m.topic) || {}).topic) : null);
      const crew = deal ? dealCrew.current[deal.id] || [] : [], ags = tg.length ? tg.filter((x) => x !== "north") : crew;
      if (deal && ags.length && !/@north\b/i.test(ask)) { runDeal(ags, deal, ask, here); setVal(""); return; } }
    // the agents' own work: "Orin, what are you working on", "what do I need to do", "have Riley check …", "pick up what Orin and I
    // talked about", or a reply to an agent you were just talking to. Answered from the Agents floor, in that agent's voice.
    const hereId = chatRef.current === "__new" ? "__none__" : chatRef.current || latestChat(msgsRef.current);
    // two or more agents named: each answers. About their work ("what are you working on"), each from its own jobs, one after
    // another under one copy of the question; anything else, each gives its take (below)
    const tagged = agentsIn(ask).sort((x, y) => ask.toLowerCase().indexOf("@" + x) - ask.toLowerCase().indexOf("@" + y)); // in the order you named them
    { const ck = chatRef.current && chatRef.current !== "__new" ? chatRef.current : null, had = (ck && crewRef.current[ck]) || [], owner = jtRef.current && ck === jobKey(jtRef.current.id) ? jtRef.current.ag : null;
      const fresh = tagged.filter((x) => !had.includes(x) && x !== owner), bare = !ask.replace(/@\w+[,:]?/g, "").replace(/\b(and|&|hey|hi|yo|pls|please)\b/gi, "").replace(/[\s,.!?]+/g, "");
      const ckey = ck || "__pending";
      if (fresh.length) { const now = [...had, ...fresh]; crewRef.current = { ...crewRef.current, [ckey]: now }; setCrew((c) => ({ ...c, [ckey]: now })); }
      if (bare && tagged.length) { // just names: they join, a line says so, nobody answers yet (ask them something next)
        const base = Date.now().toString(36), topic = (jtRef.current && ck === jobKey(jtRef.current.id) && jtRef.current.t) || cont || ([...msgsRef.current].reverse().find((m) => m.topic) || {}).topic || "Agents";
        asked.current = true; stick.current = true; setReserve(0);
        setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: base + "j", role: "agent-join", joined: true, ids: fresh.length ? fresh : tagged, again: !fresh.length, topic, day: "Today" }]);
        if (stRef.current === "bar") lift(); setVal(""); return; } }
    // people already in this conversation answer an untagged question together (folded huddle, one answers)
    const inCrew = ((chatRef.current && crewRef.current[chatRef.current]) || crewRef.current.__pending || []);
    // job lists only when you ask about their work; anything naming the business (ARR, a lane, a target) goes to a huddle below
    const aboutWork = /working on|on (your|their) plates?|your (jobs|work|queue)|what are you (doing|up to)|how far along|what('s| is) running/i.test(ask);
    if (tagged.length > 1 && aboutWork && window.__northAgents) {
      const scope = msgsRef.current.filter((m) => m.chat == null || m.chat === hereId);
      const each = tagged.map((aid) => window.__northAgents.match(ask.replace(new RegExp(`@(?!${aid}\\b)\\w+\\s*`, "gi"), ""), scope, msgsRef.current));
      if (each.every((x, i) => x && x.ag === tagged[i])) { each.forEach((x, i) => agentT.current.push(setTimeout(() => runNa(x, ask, qt, i > 0), i * M.chat.agentGapMs))); setVal(""); return; }
    }
    if (jtRef.current && chatRef.current === jobKey(jtRef.current.id) && !(OFF_RX.test(ask) && !BIZ_RX.test(ask.replace(/@\w+/g, "")))) { runJob(jtRef.current, ask, qt); setVal(""); return; }
    if (!tagged.length && inCrew.length && !(jtRef.current && chatRef.current === jobKey(jtRef.current.id))) {
      if (inCrew.length === 1) { runAgents(inCrew, ask, false, qt); setVal(""); return; }
      runHuddle(inCrew[0], inCrew, ask, qt); setVal(""); return; }
    // a group chat about something that isn't the business ("@Fia @Calvin what should I order tonight"): everyone you named
    // answers, one after another, in their own voice. Nobody refuses and nobody huddles over dinner
    { const ppl = AGENT_IDS.filter((x) => new RegExp(`\\b@?${x}\\b`, "i").test(ask)).sort((x, y) => ask.toLowerCase().search(new RegExp(`\\b@?${x}\\b`)) - ask.toLowerCase().search(new RegExp(`\\b@?${y}\\b`)));
      if (ppl.length && (tagged.length || ppl.length > 1) && OFF_RX.test(ask) && !BIZ_RX.test(ask.replace(/@\w+/g, ""))) { runChit(ppl, ask, qt); setVal(""); return; } }
    // a huddle: "@Riley talk to Calvin and Orin and figure out …", "convene the team": the lead talks it through with the others out of
    // sight and comes back with where they landed (the old convene, where all three posted and North summed up, is this now)
    { const named = AGENT_IDS.filter((x) => new RegExp(`\\b@?${x}\\b`, "i").test(ask)).sort((x, y) => ask.toLowerCase().search(new RegExp(`\\b@?${x}\\b`)) - ask.toLowerCase().search(new RegExp(`\\b@?${y}\\b`)));
      const team = /convene|leadership team|bring in (the )?(team|everyone|agents)|what do (the )?agents think|huddle|(all|the) (three|agents)/i.test(ask);
      const talk = /huddle|talk (to|with|about|it (out|through))|discuss|bring up|sync (with|up)|get (together|with)|figure (it|this|that)? ?out|work (it|this) out|heads together|between (you|them)/i.test(ask);
      if (team || tagged.length >= 2 || (talk && named.length >= 2)) { const lead = agentsIn(ask).sort((x, y) => ask.toLowerCase().indexOf("@" + x) - ask.toLowerCase().indexOf("@" + y))[0] || named[0] || "riley";
        runHuddle(lead, named.length >= 2 ? (named.includes(lead) ? named : [lead, ...named]) : CORE_IDS, ask, qt); setVal(""); return; } }

    // bringing someone in by name, no @: "bring in Riley", "loop Calvin in", "what does Orin think", "ask Fia". They join this
    // conversation and give their take on what's on screen, the same as the Bring in button
    { const named = AGENT_IDS.filter((x) => new RegExp(`\\b${x}\\b`, "i").test(ask));
      const bring = /\b(bring|loop|pull|get|add|invite)\b[^.?!]*\b(in|into|here|on this)\b|\bwhat (does|would|do) \w+( and \w+)? (think|say)|^(ask|cc)\b|\b(join|weigh in)\b/i.test(ask);
      if (named.length && !tagged.length && bring) {
        const lastNa = [...msgsRef.current].reverse().find((x) => x.role === "agent" && x.na && !x.typing);
        if (named.length === 1 && lastNa && lastNa.agent !== named[0]) { bringNa(lastNa, named[0]); setVal(""); return; }
        runAgents(named, ask, false, qt); setVal(""); return; } }
    const na = !north && tagged.length < 2 && window.__northAgents && window.__northAgents.match(ask, msgsRef.current.filter((m) => m.chat == null || m.chat === hereId), msgsRef.current);
    if (na) { runNa(na, ask, qt); setVal(""); return; }
    // the agents: "convene the team …" gets all three and North's sum-up; "@Riley …" gets the ones you tagged
    if (tagged.length) { runAgents(tagged, ask, false, qt); setVal(""); return; }
    // "continue this in Google Chat with Caleb and Heather" → the same handoff the button opens, with those people
    if (/google chat|gchat|g chat|hangouts?/i.test(ask)) {
      const prev = [...msgsRef.current].reverse().find((x) => x.role === "user");
      // "summarize this part / the Outbound section and send it to Google Chat" → a section summary
      if (/summar|recap|wrap (this|it) up|this (part|section|conversation|thread)|everything/i.test(ask)) {
        const tops = [...new Set(msgsRef.current.filter((x) => x.role === "north" && x.answer).map((x) => x.topic))];
        const s2 = ask.toLowerCase(), named = tops.find((tp) => tp && tp.toLowerCase().split(/\s+/).filter((w) => w.length > 3).some((w) => s2.includes(w)));
        const today = [...new Set(msgsRef.current.filter((x) => x.role === "user" && x.day === "Today").map((x) => x.topic))];
        const scope = /today|everything|whole|all of (this|it)|this conversation|this thread/i.test(ask) ? today : named || activeTopic || (prev && prev.topic);
        startGcSection(scope, namesIn(ask), [{ id: id + "u", role: "user", text: ask, quote: qt, topic: (prev && prev.topic) || "Today", day: "Today" }], ask);
        setVal(""); setQuote(null);
        return;
      }
      startGc(null, namesIn(ask), [{ id: id + "u", role: "user", text: ask, quote: qt, topic: (prev && prev.topic) || "Today", day: "Today" }], ask);
      setVal(""); setQuote(null);
      return;
    }
    // pointing at a chart gets an explanation of that chart, never another chart (drafting stays an action)
    // the context stays on until you take it off: the first question about a chart gets its explanation; a follow-up
    // that names something else goes where it names, anything else stays on the chart
    const onChart = qt && (qt.k === "chart" || qt.k === "point") && !/draft|note/i.test(text);
    const named = text ? answerFor(text, null, cont) : null, namesSomething = named && !(named === ANSWERS.lanes && !/lane|sales/i.test(text));
    let a = onChart ? (qt.used ? (namesSomething ? named : followOn(explainFor(qt, metrics), text)) : explainFor(qt, metrics)) : answerFor(ask, qt, cont);
    // the script only knows so much: a question it doesn't recognise, one it would answer with a chart already on screen,
    // or a follow-on about an attached chart goes to Claude (with North's numbers); without Claude, at least don't repeat the chart
    const fallback = !onChart && a === ANSWERS.lanes && !/lane|sales|behind|gap/i.test(ask);
    const repeat = a.card && msgsRef.current.some((x) => x.fresh && x.answer && x.answer.card === a.card);
    const goLive = !!sampleRef.current && (fallback || repeat || (onChart && qt.used && !namesSomething));
    if (!goLive && repeat) a = { ...a, card: null };
    if (!goLive && fallback) a = { ...a, topic: null }; // a guess shouldn't drag the question into another topic
    if (goLive) a = { pending: true, steps: ["Reading the question", "Pulling the numbers", "Writing it up"], text: "", topic: null, ask, qt };
    asked.current = true;
    // asking from the bubble about a chart: the chart comes with you into the conversation
    const carryEl = stRef.current === "bar" && onChart && !qt.used ? findChart(qt) || (qt.card && qt.card.isConnected ? qt.card : null) : null;
    const carried = carryEl ? chatCardFor(qt, carryEl.dataset.id || qt.id || null) : null;
    if (carried && !a.pending) a = { ...a, card: carried };
    setMsgs((ms) => {
      const prev = [...ms].reverse().find((m) => m.role === "user" || m.catchup); // a Watching catch-up counts as where you are
      const topic = cont || a.topic || (prev && prev.topic) || "Today";
      return [...ms.map((m) => ({ ...m, last: false })), { id: id + "u", role: "user", text: ask, quote: qt, topic, day: "Today", }, { id, role: "north", answer: a, topic, fresh: true, last: true }];
    });
    // no flight: the chat forms and the chart draws in where it belongs (a tile turning into a chart mid-air read as a mistake)
    if (goLive) {
      const pt = cont || [...msgsRef.current].reverse().find((m) => (m.role === "user" && m.id !== id + "u") || m.catchup)?.topic || null;
      const land = (ans) => setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, answer: carried && !ans.card ? { ...ans, card: carried } : ans, topic: ans.topic || m.topic } : m.id === id + "u" ? { ...m, topic: ans.topic || m.topic } : m)));
      askLive(ask, qt, pt).then(land).catch(() => {
        const s0 = onChart ? followOn(explainFor(qt, metrics), text) : answerFor(ask, qt, cont);
        land({ ...s0, steps: [], card: msgsRef.current.some((x) => x.fresh && x.answer && x.answer.card === s0.card) ? null : s0.card });
      });
    }
    setVal(""); setQuote((q0) => (q0 ? { ...q0, used: true } : q0));
    setReserve(0); requestAnimationFrame(() => requestAnimationFrame(makeRoom));
    // the first question lifts the bar into the conversation, wherever it last lived
    // sending from the centred field: the field grows into the full-screen conversation (one shape, one curve)
    const st = stRef.current; if (st === "bar") lift();
  };
  const runNa = (na, ask, qt = null, more = false) => { // more: another named agent answering the same question (no second copy of it)
    const base = Date.now().toString(36) + (more ? na.ag : ""), mid = base + "a", hist = msgsRef.current;
    if (na.topic) { const pm = [...hist].reverse().find((m) => m.role === "agent" && m.na && m.topic === na.topic && m.chat); if (pm) setChat(pm.chat); }
    const inChat = chatRef.current === "__new" ? null : chatRef.current || latestChat(hist), lastHere = [...hist].reverse().find((m) => m.chat === inChat && (m.role === "user" || m.role === "agent"));
    const topic = na.topic || (na.stay && lastHere ? lastHere.topic : null) || na.chat || (lastHere && lastHere.topic) || "Agents";
    asked.current = true; stick.current = true; setReserve(0);
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), ...(more ? [] : [{ id: base + "u", role: "user", text: ask, quote: qt, topic, day: "Today" }]),
      { id: mid, role: "agent", agent: na.ag, typing: true, topic, lookAt: "the work" }]);
    const land = (text) => { setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, text, na: true, q: ask, jobs: na.jobs, snap: na.snap, acted: na.actedOn || null } : mm)));
      if (na.started) { const cm = msgsRef.current.find((mm) => mm.id === mid); autoWatch(na.started, cm && cm.chat, topic); } };
    const t0 = Date.now(), sm = sampleRef.current;
    (sm ? window.__northAgents.voice(sm, na, ask, hist.filter((m) => m.chat === inChat)) : Promise.resolve(na.text)).catch(() => na.text).then((t) => setTimeout(() => land(t || na.text), Math.max(0, 700 - (Date.now() - t0))));
    const st = stRef.current; if (st === "bar") lift();
  };
  // an account conversation: the chat is named for the deal; each agent reads the deal from its own role (Claude words it when
  // the page can ask; the facts are the deal's own either way); two or more start a job that keeps working and reports back here
  const dealCrew = useRef({});
  const runDeal = async (ags, deal, ask, here) => {
    const inDeal = here && dealIn(([...msgsRef.current].reverse().find((m) => m.chat === here && m.topic) || {}).topic)?.id === deal.id;
    const id = inDeal ? here : newChatId(), topic = deal.n, fresh = ags.filter((a) => !(dealCrew.current[deal.id] || []).includes(a));
    dealCrew.current[deal.id] = [...new Set([...(dealCrew.current[deal.id] || []), ...ags])];
    asked.current = true; stick.current = true; setReserve(0); setChat(id);
    postTo(id, { role: "user", text: ask, topic });
    if (fresh.length > 1) postTo(id, { role: "agent-join", ids: fresh, joined: true, topic });
    if (stRef.current === "bar") lift();
    const said = [], sm = sampleRef.current;
    // a follow-up to the agents already on it gets one answer, from whoever owns what's in the way (or the first of them)
    const follow = inDeal && !fresh.length, owner = deal.threats[0] && DEAL_THREATS[deal.threats[0].k].by.find((x) => ags.includes(x));
    const who = follow ? [owner || ags[0]] : ags;
    // two or more on it: a huddle, not a row of separate takes. They talk it through in one folded row (open it to read the
    // room), then the lead comes back with where they landed and the work they've started
    if (!follow && ags.length > 1) {
      const lead = ags[0], others = ags.slice(1), first = (t) => (t.match(/^[^.!?]+[.!?]/) || [t])[0];
      const tr = [[lead, `${deal.n} has to sign by ${deal.close}. What’s your read?`], ...others.map((a) => [a, takeOf(a, deal)]), [lead, nextOf(deal)]];
      const dur = 900 + tr.length * 1150, hk = postTo(id, { role: "huddle", lead, ids: ags, topic, transcript: tr, t0: Date.now(), dur });
      const A = window.__northAgents, j = jobFor(deal), had = dealCrew.current[`job:${deal.id}`];
      later(dur, () => { setMsgs((x) => x.map((m) => (m.id === hk ? { ...m, done: true } : m)));
        let jid = had; if (!had && A && A.start) { jid = A.start(j.t, ags, 2, j.think); dealCrew.current[`job:${deal.id}`] = jid;
          const pk = `job-${deal.id}`, crew = andList(ags.map((x) => AGENTS[x].n));
          talk.addPiece({ k: pk, from: id, via: deal.n, t: j.t, ag: lead, zone: "moving", pr: 1, stTxt: "Working", line: `${crew} are on it. They’ll post in the conversation when it lands.` });
          const tick = setInterval(() => { const st = A.states([jid])[jid]; if (st === "done" || st === "gone") { clearInterval(tick); talk.updPiece(pk, { zone: "landed", stTxt: "Done", line: `${crew} finished it. It’s in the ${deal.n} conversation.` }); } }, 2000); }
        postTo(id, { role: "agent", agent: lead, hud: ags, topic, src: "Huddle · " + ags.map((x) => AGENTS[x].n).join(" · "),
          text: `Here’s where we landed. ${others.map((a) => `${AGENTS[a].n}’s read: ${first(takeOf(a, deal))}`).join(" ")} The move: ${nextOf(deal).charAt(0).toLowerCase() + nextOf(deal).slice(1)}${jid && !had ? `\n\nWe’ve started “${j.t}” and it’s under In progress. I’ll post here when it lands.` : ""}` });
        if (jid && !had) autoWatch(jid, id, topic); });
      return; }
    for (let i = 0; i < who.length; i++) {
      const a = who[i]; await new Promise((r) => setTimeout(r, i ? 500 : 350));
      const k = postTo(id, { role: "agent", agent: a, typing: true, topic, lookAt: deal.n });
      const t0 = Date.now(), text = sm ? await liveTake(sm, a, deal, ask, said) : follow ? nextOf(deal) : takeOf(a, deal); said.push([a, text]);
      await new Promise((r) => setTimeout(r, Math.max(0, 900 - (Date.now() - t0))));
      setMsgs((x) => x.map((m) => (m.id === k ? { ...m, typing: false, text } : m)));
    }
  };
  // agents speak one after another (dots, then their take); a convened round ends with North's sum-up
  const agentT = useRef([]);
  const runAgents = (ids, ask, convene, qt = null, after = null) => {
    const ms = msgsRef.current;
    const here = chatRef.current === "__new" ? null : chatRef.current || latestChat(ms);
    const lastA = [...ms].reverse().find((x) => x.role === "north" && x.answer && !x.answer.synth && x.fresh && x.chat === here); // this chat only; with nothing asked yet, they weigh in on the year
    const rest = (ask || "").replace(/@\w+/g, "").replace(/convene( the)?( ai)?( leadership)? team( on)?/i, "").trim();
    // what they weigh in on: what you named, else what you were just looking at
    const named = rest.length > 3 && !/^(what|thoughts|any)\b/i.test(rest) ? answerFor(rest, qt, cont) : null;
    const useNamed = named && named.key && named.key !== "lanes";
    const key = useNamed ? named.key : lastA ? lastA.answer.key || "x" : "year";
    const topic = useNamed ? named.topic : lastA ? lastA.topic : ANSWERS.year.topic || "Path to $40M";
    const tk = takesFor(key, topic);
    const base = Date.now().toString(36);
    asked.current = true; stick.current = true; setReserve(0);
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), ...(ask ? [{ id: base + "u", role: "user", text: ask, quote: qt, topic, day: "Today" }] : []),
      ...(convene ? [{ id: base + "j", role: "agent-join", ids, topic }] : [])]);
    const gap = M.chat.agentGapMs, type = M.chat.agentTypeMs;
    ids.forEach((aid, i) => {
      const mid = `${base}-${aid}`;
      agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x, { id: mid, role: "agent", agent: aid, typing: true, topic, lookAt: (tk[aid].src || "").split(" · ")[0] }]); }, (convene ? 700 : 250) + i * gap));
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, text: tk[aid].t, src: tk[aid].src } : mm))), (convene ? 700 : 250) + i * gap + type));
    });
    if (convene) agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x, { id: base + "n", role: "north", topic, fresh: true, last: true,
      answer: { synth: true, key: "synth", topic, steps: ["Reading Orin, Riley and Calvin", "Finding where they differ"], text: tk.synth, follow: [] } }]); }, 700 + ids.length * gap + 300));
    const st = stRef.current; if (st === "bar") lift();
  };
  const runJob = (J, ask, qt = null) => {
    const A = window.__northAgents, info = A && A.job(J.id), base = Date.now().toString(36), topic = J.t;
    const order = (xs) => xs.sort((x, y) => ask.toLowerCase().indexOf("@" + x) - ask.toLowerCase().indexOf("@" + y));
    const tagged0 = order(agentsIn(ask)), plain = ask.replace(/@\w+[,:]?/g, "").replace(/\s+/g, " ").trim();
    const joined = (crewRef.current[jobKey(J.id)] || []).filter((x) => x !== J.ag), tagged = tagged0.length ? tagged0 : joined.length ? [J.ag, ...joined] : tagged0; // people in this thread are in on it
    const talk = /huddle|talk (to|with|about|it (out|through))|discuss|figure (it|this|that)? ?out|work (it|this) out|heads together|between (you|them)/i.test(ask);
    asked.current = true; stick.current = true; setReserve(0);
    const user = { id: base + "u", role: "user", text: ask, quote: qt, topic, day: "Today" };
    // finished work and an instruction, not a question: the owner takes the note and brings back a new version
    const ack = /^(thanks|thank you|ty|great|perfect|looks good|lgtm|ok|okay|k|cool|nice|got it|sweet|awesome|amazing|love it|love this|nice one|good|yep|yes|yeah|no|nope|wow|fair|makes sense|interesting|hmm+|sounds good)\b/i.test(plain)
      && !/\b(more|see|show|tell|explain|why|how|what|detail|deeper|dig|break|walk)\b/i.test(plain); // "nice, let's see more" wants more, not a thank-you
    const instr = /^(make|change|add|remove|use|split|swap|turn|drop|redo|rework|try|switch|break|sort|group|put|move|include|exclude|focus|compare|rename|shorten|expand|instead|show it|show me it as|lose|cut|only|also)\b/i.test(plain) || plain.split(/\s+/).length >= 5;
    const asks = /\?\s*$/.test(plain) || /^(which|who|whom|whose|when|where|why|how|what|is|are|was|were|do|does|did|can|could|should|would|will|any|tell me|walk me|explain)\b/i.test(plain);
    if (info && info.st === "done" && A.isAsk && !A.isAsk(plain) && !asks && !tagged0.some((x) => x !== J.ag) && !ack && instr) {
      A.rework(J.id, plain.replace(/[.!]+$/, ""));
      const mid = base + "a";
      setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), user, { id: mid, role: "agent", agent: J.ag, typing: true, topic, lookAt: "the work" }]);
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, chit: true, text: `Got it. I’ll rework it with that and bring v${(info.v || 1) + 1} back here.` } : mm))), 800));
      return; }
    // work that isn't finished yet, and a note on how to do it: the owner takes it on board (no new version to promise yet)
    if (info && info.st !== "done" && !asks && !(A.isAsk && A.isAsk(plain)) && !tagged0.some((x) => x !== J.ag) && !ack && instr) {
      const mid = base + "a", txt = info.st === "need" ? "Noted. I’ll work it that way once you say go." : info.st === "run" ? "Got it. I’ll work that in from here and show you where it changed things." : "Noted. I’ll work it that way when it starts.";
      setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), user, { id: mid, role: "agent", agent: J.ag, typing: true, topic, lookAt: "the work" }]);
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, chit: true, text: txt } : mm))), 800));
      return; }
    if (ack && !tagged0.length) { const mid = base + "a";
      setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), user, { id: mid, role: "agent", agent: J.ag, typing: true, topic }]);
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, chit: true, text: "Glad it helps. Anything you want changed, just say." } : mm))), 700)); return; }
    // something that isn't a question or an instruction at all (a typo, keyboard mash): say so rather than repeat an answer
    { const a0 = answerFor(plain, null, null), words = plain.split(/\s+/).filter(Boolean);
      const real = /\b(what|why|how|who|which|where|when|this|that|it|change|make|show|tell|think|cost|worth|next|help|explain|more|less)\b/i.test(plain) || BIZ_RX.test(plain) || OFF_RX.test(plain) || tagged0.length;
      if (!real && (!a0 || a0 === ANSWERS.lanes) && words.length <= 3) { const mid = base + "a";
        setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), user, { id: mid, role: "agent", agent: J.ag, typing: true, topic }]);
        agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, chit: true, text: "Not sure I follow. Ask me about this, or tell me what to change." } : mm))), 700)); return; } }
    // what the question is about: this job's lane first
    const a = { ...((/\b(accounts?|deals?|customers?|reps?|who closed|list)\b/i.test(plain) && ANSWERS.accounts) || answerFor(`${J.laneN} ${plain}`, null, null) || ANSWERS.lanes) }, tk = takesFor(a.key || "x", a.topic || topic);
    const own = a.card && info && info.viz && a.card.title.toLowerCase() === info.viz.toLowerCase(); // the work already shows this chart
    const others = tagged.filter((x) => x !== J.ag);
    // "@Riley @Calvin talk it through": they huddle in this thread, then the owner reports back with the answer (and its chart, into the work)
    if ((talk && others.length) || tagged.length >= 2) {
      const ids = tagged.length >= 2 ? (talk && !tagged.includes(J.ag) ? [J.ag, ...tagged] : tagged) : [J.ag, ...others], hl = ids[0];
      const H = huddleFor(a.key || "x", topic, hl, ids, plain), hid = base + "h", dur = 900 + H.transcript.length * 1150;
      setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), user, { id: hid, role: "huddle", lead: hl, ids, topic, transcript: H.transcript, t0: Date.now(), dur }]);
      agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x.map((mm) => (mm.id === hid ? { ...mm, done: true } : { ...mm, last: false })),
        { id: base + "o", role: "agent", agent: hl, hud: ids, topic, text: H.asked + "\n\n" + H.text, src: "Huddle · " + H.src, na: true, q: ask, last: true, ...(a.card && !own ? { card: a.card } : {}) }]); }, dur));
      return; }
    // otherwise the one you asked answers (the owner, unless you @'d only someone else), then anyone else you named adds a line
    const lead = tagged.length && !tagged.includes(J.ag) ? tagged[0] : J.ag, rest = tagged.filter((x) => x !== lead);
    // the work's own chart is at the top of this window already: point there instead of drawing it again
    const showMe = /\b(chart|graph|visual|plot|pull (it|the chart) up)\b/i.test(plain), card = own ? null : a.card;
    const leadText = own && showMe ? "That’s the chart up top." : showMe && card ? `Here’s ${card.title}.` : a.text;
    if (own && showMe) setTimeout(() => { const el = listRef.current; if (el) el.scrollTo({ top: 0, behavior: "smooth" }); }, 1100);

    const mid = base + "a";
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), user, { id: mid, role: "agent", agent: lead, typing: true, topic, lookAt: (tk[lead] && tk[lead].src || "the work").split(" · ")[0] }]);
    agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, na: true, q: ask, text: lead === J.ag ? leadText : (tk[lead] ? tk[lead].t : a.text), src: lead === J.ag ? null : tk[lead] && tk[lead].src, ...(lead === J.ag && card ? { card } : {}) } : mm))), 900));
    rest.forEach((aid, i) => { const m2 = `${base}-${aid}`, at = 900 + (i + 1) * Math.max(900, M.chat.agentGapMs * 0.7);
      agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x, { id: m2, role: "agent", agent: aid, typing: true, topic }]); }, at - 600));
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === m2 ? { ...mm, typing: false, text: tk[aid] ? tk[aid].t : "", src: tk[aid] && tk[aid].src } : mm))), at)); });
  };
  const runChit = (ids, ask, qt = null) => {
    const base = Date.now().toString(36), k = chitKind(ask), prev = [...msgsRef.current].reverse().find((m) => m.role === "user"), topic = (prev && prev.topic) || "Agents";
    asked.current = true; stick.current = true; setReserve(0);
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: base + "u", role: "user", text: ask, quote: qt, topic, day: "Today" }]);
    if (ids.length > 1) { // a group: they huddle where you can watch, then the first one you named comes back with the call
      const lead = ids[0], others = ids.slice(1), P = CHIT_PICK[k], line = (a) => CHIT[k][a] || CHIT.any[a];
      const transcript = [[lead, CHIT_OPEN[k] || "Quick one from the boss. Thoughts?"], ...others.map((a) => [a, line(a)]), [lead, line(lead)]];
      const text = P ? `${others.map((a) => `${AGENTS[a].n} says ${P[a]}`).join(", ").replace(/, ([^,]*)$/, " and $1")}. My call: ${P[lead]}. ${CHIT_WHY[k][lead] || ""}`.trim()
        : `${others.map((a) => AGENTS[a].n).join(" and ")} ${others.length > 1 ? "are" : "is"} good. ${line(lead)}`;
      const hid = base + "h", dur = 900 + transcript.length * 1150;
      setMsgs((x) => [...x, { id: hid, role: "huddle", lead, ids, topic, transcript, t0: Date.now(), dur }]);
      agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x.map((mm) => (mm.id === hid ? { ...mm, done: true } : { ...mm, last: false })),
        { id: base + "o", role: "agent", agent: lead, hud: ids, topic, chit: true, text, src: "Huddle · " + ids.map((a) => AGENTS[a].n).join(" · "), last: true }]); }, dur));
      const st1 = stRef.current; if (st1 === "bar") lift(); return; }
    const gap = Math.max(900, M.chat.agentGapMs * 0.7), type = Math.max(700, M.chat.agentTypeMs * 0.7);
    ids.forEach((aid, i) => { const mid = `${base}-${aid}`;
      agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x, { id: mid, role: "agent", agent: aid, typing: true, topic, lookAt: "it" }]); }, 300 + i * gap));
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, chit: true, text: CHIT[k][aid] || CHIT.any[aid] } : mm))), 300 + i * gap + type)); });
    const st = stRef.current; if (st === "bar") lift();
  };
  const runHuddle = (lead, ids, ask, qt = null) => {
    const ms = msgsRef.current, here = chatRef.current === "__new" ? null : chatRef.current || latestChat(ms);
    const lastA = [...ms].reverse().find((x) => x.role === "north" && x.answer && !x.answer.synth && x.fresh && x.chat === here);
    const rest = (ask || "").replace(/@\w+/g, "").replace(/\b(talk (to|with)|and|figure( it| this)? out|huddle|orin|riley|calvin|marco|fia)\b/gi, " ").replace(/\s+/g, " ").trim();
    // the matcher always lands somewhere (its default is where Sales is behind), so that default only counts when it was asked for
    const named0 = rest.length > 3 ? answerFor(rest, qt, cont) : null, named = named0 && (named0 !== ANSWERS.lanes || /lane|sales|where|behind|slip/i.test(rest)) ? named0 : null, useNamed = named && named.key;
    // outside the business (dinner plans): the lead says so plainly rather than huddling on whatever was last on screen
    const BIZ = /arr|revenue|pipeline|outbound|inbound|deal|logo|nrr|grr|churn|renew|win|demo|plan|forecast|target|gap|behind|slip|account|customer|expansion|sales|lane|quota|hir|budget|cost|margin|board|metric|number|chart|q4|year|sdr|rep|team|lever|pace|goal/i;
    const refers = /\b(this|that|it|these|those|agree|sense|thoughts?|think|here)\b/i.test(rest);
    const OFF = /dinner|lunch|breakfast|weather|movie|film|game|joke|birthday|vacation|holiday|music|song|recipe|restaurant|sports?|football|basketball/i;
    if (rest.length > 3 && !useNamed && !BIZ.test(rest) && !refers && (OFF.test(rest) || !lastA)) {
      const base0 = Date.now().toString(36), mid0 = base0 + "a"; asked.current = true; stick.current = true;
      setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: base0 + "u", role: "user", text: ask, quote: qt, topic: "Agents", day: "Today" }, { id: mid0, role: "agent", agent: lead, typing: true, topic: "Agents", lookAt: "it" }]);
      agentT.current.push(setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid0 ? { ...mm, typing: false, text: "That one's outside what we can see. We work from the business numbers, so point us at something there and we'll talk it through." } : mm))), 900));
      const st0 = stRef.current; if (st0 === "bar") lift(); return; }
    const arrQ = !useNamed && /\barr\b|revenue/i.test(rest);
    const key = arrQ ? "arr" : /slip|behind|gap|where/i.test(rest) && !useNamed ? "lanes" : useNamed ? named.key : lastA ? lastA.answer.key || "x" : "year";
    const topic = arrQ ? ANSWERS.arr.topic : useNamed ? named.topic : key === "lanes" ? ANSWERS.lanes.topic : lastA ? lastA.topic : ANSWERS.year.topic || "Path to $40M";
    const H = huddleFor(key, topic, lead, ids, rest.replace(/^(and|,|\s)+/i, "").trim()), base = Date.now().toString(36), hid = base + "h";
    // asked for the numbers ("what are the ARR numbers"): they lead with them, as North states them, before where the huddle landed
    if (/numbers?|figures?|what('s| is| are)|how (are|is|'s)|where (are|is)|today/i.test(rest) && ANSWERS[key] && ANSWERS[key].text) H.text = ANSWERS[key].text + "\n\n" + H.text;
    H.text = H.asked + "\n\n" + H.text; // the report starts with what you asked
    asked.current = true; stick.current = true; setReserve(0);
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: base + "u", role: "user", text: ask, quote: qt, topic, day: "Today" },
      { id: hid, role: "huddle", lead, ids, topic, transcript: H.transcript, t0: Date.now(), dur: 900 + H.transcript.length * 1150 }]);
    const card0 = ANSWERS[key] && ANSWERS[key].card; // the chart the topic has comes back with them
    const A = window.__northAgents, dec = H.decide && A && A.rows ? A.rows((j) => j.ag === lead && j.st === "need" && H.decide.test(j.t)) : { rows: [], snap: {} };
    // and the action rides on it, in the chart's own tray (the big button): a decision the lead has waiting, else the topic's next step
    const need = dec.rows[0], tray = need ? { title: need.t, sub: `${AGENTS[lead].n} needs your call`, button: need.act || "Approve", job: need } : nextFor(key);
    const card = card0 && { ...card0, tray };
    const T = 900 + H.transcript.length * 1150;
    // done: the room closes up (it stays above, to reopen) and the lead comes back with where they landed
    agentT.current.push(setTimeout(() => { stick.current = true; setMsgs((x) => [...x.map((mm) => (mm.id === hid ? { ...mm, done: true } : { ...mm, last: false })),
      { id: base + "o", role: "agent", agent: lead, hud: ids, topic, text: H.text, src: "Huddle · " + H.src, na: true, q: ask, jobs: card ? [] : dec.rows, snap: dec.snap, last: true,
        ...(card ? { card, answer: { card, key, noSum: true } } : {}), next: !card && !dec.rows.length && nextFor(key) ? nextFor(key) : null }]); }, T));
    const st = stRef.current; if (st === "bar") lift();
  };
  useEffect(() => () => agentT.current.forEach(clearTimeout), []);
  const n2wC = (n) => ["no", "one", "two", "three", "four", "five", "six"][n] || String(n);
  const LANE_NEXT = { orin: ["riley", "what this work is worth"], riley: ["calvin", "the accounts behind these numbers"], calvin: ["orin", "the pipeline side of it"], marco: ["orin", "the pipeline it feeds"], fia: ["riley", "what it means for the plan"] };
  const nextLane = (m) => { const other = (m.jobs || []).map((j) => j.ag).find((g) => g && g !== m.agent);
    const n = (m.jobs || []).filter((j) => j.ag === other).length;
    return other ? [other, n === 1 ? "the one they share" : `the ${n2wC(n)} they share`] : LANE_NEXT[m.agent] || null; };
  // a decision answered in the thread: the row settles, and whoever owns it says what happens next
  function decide(m, j, yes) {
    const na = window.__northAgents && window.__northAgents.decide(j.id, yes); if (!na) return;
    setMsgs((x) => x.map((mm) => (mm.id === m.id ? { ...mm, decided: { ...(mm.decided || {}), [j.id]: yes ? "yes" : "no" } } : mm)));
    const mid = Date.now().toString(36) + "d"; stick.current = true;
    setTimeout(() => setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: mid, role: "agent", agent: na.ag, typing: true, topic: m.topic, chat: m.chat, lookAt: "it" }]), 180);
    setTimeout(() => setMsgs((x) => x.map((mm) => (mm.id === mid ? { ...mm, typing: false, text: na.text, na: true, q: yes ? `yes to ${j.t}` : `not now on ${j.t}`, jobs: [], snap: {}, acted: na.actedOn || null } : mm))), 900);
    if (yes) toast(`${j.act || "Approved"} · ${AGENTS[na.ag].n} has it`);
    if (yes) setTimeout(() => autoWatch(na.started, m.chat, m.topic), 400);
    // you just made this change yourself: a watch on it shouldn't announce it back to you
    mineRef.current.add(j.id);
    focusInput();
  };
  // what you set in motion is watched for you: each job you started or said yes to is a row in Watching. When one lands, the
  // agent behaves like a good colleague, not an alert:
  //   · it waits for a pause: never while you're typing, reading an open chart, or North is mid-answer
  //   · it interrupts at most once in a while: after a notice, finished work goes quietly to "ready" (the count beside Agents)
  //     for a spell; only something that needs your call still comes out
  //   · things that land together come out together, as one
  //   · on the Agents page the floor already shows it, so nothing comes out
  const [jobModal, setJobModal] = useState(null); // a piece of work's full view: centred over the page, or beside the chat
  const jobModalRef = useRef(null); jobModalRef.current = jobModal;
  // ── one subject, one window. A job has its own thread ("job:<id>") and the thread IS the window: the work itself (its chart,
  // what came out, where it stands) sits at the top, the conversation runs under it, and there's one field. Asking on a job
  // card turns the card into that window, in place. Full screen is North's full screen with the same thread. One ×.
  const [jt, setJt] = useState(null), jtRef = useRef(null); jtRef.current = jt;
  // who's in each conversation, like a Slack or Hangouts thread: tag someone and they join it (and stay in it). A question in a
  // conversation with people in it goes to them: they talk it through (folded) and one of them answers
  const [crew, setCrew] = useState({}), crewRef = useRef({}); crewRef.current = crew;
  const jobKey = (id) => "job:" + id;
  const enterJob = (id, { rect = null, mode = null } = {}) => {
    const info = window.__northAgents && window.__northAgents.job && window.__northAgents.job(id); if (!info) return false;
    const st = stRef.current, prev = jtRef.current ? jtRef.current.prev : { chat: chatRef.current, cont, mode: st };
    const J = { id, ag: info.ag, t: info.t, laneN: info.laneN, prev }; jtRef.current = J; setJt(J); setTimeout(() => setJobModal(null), rect ? 180 : 0); // the card hands over to the window, no gap
    const key = jobKey(id); setChat(key); setCont(info.t); setQuote(null); setHeld(null); wasFloat.current = null;
    if (!msgsRef.current.some((m) => m.chat === key)) { // first visit: the work at the top, then the owner's one line
      const hello = info.st === "done" ? "Ask me anything about this, or tell me what to change and I’ll bring back a new version."
        : info.st === "need" ? "This one needs your call. Ask me anything before you decide." : "I’m still on this. Ask how it’s going, or steer it.";
      const b = Date.now().toString(36);
      setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id: b + "w", role: "agent", work: id, agent: info.ag, chat: key, topic: info.t, day: "Today", na: true, deliv: info.d ? [info.d] : [], text: (window.__northAgents.workText && window.__northAgents.workText(id)) || info.t },
        { id: b + "o", role: "agent", agent: info.ag, chat: key, topic: info.t, day: "Today", chit: true, hello: true, text: hello }]); }
    if (rect) { const h = Math.min(innerHeight - Math.max(24, rect.top) - 24, Math.max(rect.height + 200, 560)); floatBox.current = { l: rect.left, t: Math.max(24, rect.top), w: rect.width, h }; }
    if (mode && st !== mode) open({ mode, quote: null, reform: true }); // asked for a place (a job continued in North from Home docks beside the page)
    else if (mode) {}
    else if (st === "closed" || st === "hidden" || st === "bar") open({ mode: "float", quote: null, reform: true });
    else if (st === "dock") open({ mode: "float", quote: null });
    else if (rect) open({ mode: "float", quote: null, reform: true });
    requestAnimationFrame(() => requestAnimationFrame(() => { const el = listRef.current; if (el) el.scrollTop = 0; }));
    return true;
  };
  const toggleFull = () => (stRef.current === "full" ? open({ mode: "float" }) : shift("full"));
  // back to the conversation you came from (shown in the thread's header when there is one)
  const leaveJob = () => { const cur = jtRef.current; if (!cur) return; setJt(null); jtRef.current = null; const p = cur.prev;
    setChat(p.chat); setCont(p.cont); floatBox.current = null;
    if (p.mode === "closed" || p.mode === "hidden" || p.mode === "bar") close(); else if (p.mode === "full") shift("full"); else open({ mode: p.mode === "dock" ? "dock" : "float" }); };
  const closeAll = () => { const cur = jtRef.current; if (cur) { setJt(null); jtRef.current = null; setChat(cur.prev.chat); setCont(cur.prev.cont); } floatBox.current = null; close(); };
  useEffect(() => { document.documentElement.classList.toggle("view-full", !!full || !!(jobModal && jobModal.beside)); }, [full, jobModal]);
  const enterJobRef = useRef(null); enterJobRef.current = enterJob; sendRef.current = send;
  // full screen from a job card: that job's window, full screen (the card becomes it)
  useEffect(() => { const f = (e) => { if (enterJobRef.current(e.detail.id)) setTimeout(() => shift("full"), 60); }; addEventListener("north:job-full", f); return () => removeEventListener("north:job-full", f); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = (e) => { const st = stRef.current, inChat = st === "float" || st === "dock" || st === "full";
      if (inChat && enterJobRef.current(e.detail.id)) return;
      setJobModal({ ids: [e.detail.id], i: 0, from: e.detail.from, beside: false, k: Date.now() }); };
    addEventListener("north:open-job", f); return () => removeEventListener("north:open-job", f); }, []);
  // a note typed into a job opened somewhere else (Sam's board): the job's own thread opens from where it was, and the note goes in
  useEffect(() => { const f = (e) => { const { id, q, from, mode } = e.detail || {}; if (!id) return;
      enterJobRef.current(id, { rect: mode ? null : from || null, mode: mode || null }); if (q) setTimeout(() => sendRef.current && sendRef.current(q, null), 240); };
    addEventListener("north:job-ask", f); return () => removeEventListener("north:job-ask", f); }, []);
  const [jobNote, setJobNote] = useState(null), jobSt = useRef({}), noteT = useRef(0), pend = useRef([]), coolUntil = useRef(0), lastAct = useRef(0);
  const [ready, setReady] = useState({}), readyRef = useRef(ready); readyRef.current = ready; // landed and not yet looked at: id → item
  const pageRef = useRef(pageName); pageRef.current = pageName;
  const COOL = 45000, SHOW = 7000;
  useEffect(() => { jobSt.current = {}; pend.current = []; setReady({}); setJobNote(null); }, [who]);
  useEffect(() => { const f = () => { lastAct.current = Date.now(); }; ["keydown", "pointerdown", "wheel"].forEach((e) => addEventListener(e, f, true)); return () => ["keydown", "pointerdown", "wheel"].forEach((e) => removeEventListener(e, f, true)); }, []);
  const userBusy = () => { const ae = document.activeElement;
    return Date.now() - lastAct.current < 1400 || !!document.querySelector(".mtile.is-open, .cc-full, .ch-caret, .nr-status") || !!(ae && /TEXTAREA|INPUT/.test(ae.tagName) && ae.value && ae.value.trim()); };
  // a piece of work lands once: a hand-off from Home and the agent's own job for it can both report back, so the same agent and
  // title replace each other, keeping the one that says what came of it
  const land = (ws) => setReady((R) => { const n = { ...R }; ws.forEach((w) => { const dup = Object.values(n).find((x) => x.id !== w.id && x.ag === w.ag && x.t === w.t);
    if (dup) { if (dup.find && !w.find) return; delete n[dup.id]; } n[w.id] = w; }); return n; });
  const seen = (ids) => setReady((R) => { const n = { ...R }; ids.forEach((id) => delete n[id]); return n; });
  useEffect(() => { dispatchEvent(new CustomEvent("north:ready", { detail: { n: Object.keys(ready).length } })); }, [ready]);
  useEffect(() => { if (pageName === "Agents") { seen(Object.keys(readyRef.current)); pend.current = []; } }, [pageName]); // you're looking at the floor
  const endNote = (dismissed) => { clearTimeout(noteT.current); setJobNote((n) => { if (n && dismissed) seen(n.items.map((w) => w.id)); return null; }); coolUntil.current = Date.now() + COOL; };
  useEffect(() => {
    const t = setInterval(() => { const A = window.__northAgents; if (!A?.watchOf) return;
      const mineW = A.jobs().filter((j) => j.watchBy === getWho()); if (!mineW.length) return;
      const ups = {}, landed = [];
      mineW.forEach((j) => { const w = A.watchOf(j.id); if (!w) return; const was = jobSt.current[j.id]; jobSt.current[j.id] = w.st;
        if (was === w.st) return;
        ups[w.t] = { job: w.id, on: true, since: "Today", last: `Just now · ${w.line}` };
        if (was && (w.st === "done" || w.st === "need") && !w.approved) landed.push(w); });
      // Watching is for what you chose to follow: a job you asked to watch keeps its row current; nothing joins on its own
      if (Object.keys(ups).length) setWatchInfo((wi) => { let ch = false; const n = { ...wi }; Object.entries(ups).forEach(([k, v]) => { if (!wi[k] || !wi[k].job) return; ch = true; n[k] = { ...wi[k], last: v.last }; }); return ch ? n : wi; });
      if (landed.length && !(pageRef.current === "Agents" && stRef.current !== "full")) { land(landed); pend.current.push(...landed); }
    }, 1500);
    // the delivery: at a pause, within the budget, all together
    // Sam's seat: what lands goes to Home's In progress (and the conversation it came from), never a notice flying over the page
    const d = setInterval(() => { if (getWho() === "sam") { pend.current = []; return; } if (!pend.current.length || flyRef.current || userBusy()) return;
      if (pageRef.current === "Agents" && stRef.current !== "full") { pend.current = []; return; }
      const cool = Date.now() < coolUntil.current, go = pend.current.filter((w) => !cool || w.st === "need" || w.demo);
      if (!go.length) { pend.current = []; return; } // they wait, quietly, in "ready"
      let held = false;
      setJobNote((n) => { if (n && n.opened) { held = true; return n; } const items = n ? [...n.items, ...go.filter((g) => !n.items.some((x) => x.id === g.id))] : go; return { k: n ? n.k : Date.now(), items }; });
      if (!held) { pend.current = pend.current.filter((w) => !go.includes(w)); clearTimeout(noteT.current); noteT.current = setTimeout(() => endNote(false), SHOW); }
    }, 600);
    const wj = (e) => { const A = window.__northAgents, id = e.detail && e.detail.id, w = A && A.watchOf(id); if (!w) return;
      setWatchInfo((wi) => { const on = !(wi[w.t] && wi[w.t].on); return { ...wi, [w.t]: { job: w.id, since: "Today", last: `Today · ${w.line}`, on } }; });
      setWatched((ws) => { const n = new Set(ws); n.has(w.t) ? n.delete(w.t) : n.add(w.t); return n; }); };
    addEventListener("north:watch-job", wj);
    const o = (e) => { const items = Object.values(readyRef.current); if (!items.length) return; clearTimeout(noteT.current);
      setJobNote((n) => (n && n.list ? n : { k: Date.now(), items, list: true, opened: !(e && e.detail && e.detail.hover), hover: !!(e && e.detail && e.detail.hover) })); };
    // a hover peek closes a moment after you leave, unless you moved onto it
    const lv = () => { clearTimeout(noteT.current); noteT.current = setTimeout(() => setJobNote((n) => (n && n.hover && !n.opened ? null : n)), 350); };
    addEventListener("north:ready-open", o); addEventListener("north:ready-leave", lv);
    // work she handed to a person finished (from Home): it comes back the same way an agent's does, by Agents in the sidebar,
    // and opening it takes it into the chat with what was done
    const hd = (e) => { const x = e.detail; if (!x) return; const w = { id: x.id, t: x.t, st: "done", ag: x.to, n: x.n, find: x.find, hand: true,
      attach: { k: "chart", t: `@${x.n} · ${x.t} · Done`, title: x.t, big: "Done" } };
      land([w]); pend.current.push(w); };
    addEventListener("north:hand-done", hd);
    return () => { clearInterval(t); clearInterval(d); removeEventListener("north:ready-open", o); removeEventListener("north:ready-leave", lv); removeEventListener("north:watch-job", wj); removeEventListener("north:hand-done", hd); };
  }, []);
  useEffect(() => { window.__northWatchedJobs = new Set(Object.values(watchInfo).filter((v) => v.on && v.job).map((v) => v.job)); dispatchEvent(new Event("north:watched-jobs")); }, [watchInfo]);
  const flyRef = useRef(null); flyRef.current = watchFly; useEffect(() => { if (watchFly) setJobNote(null); }, [!!watchFly]);
  const openJob = (id) => { seen([id]); endNote(false); if (stRef.current === "full") close(); window.__northAgents?.open(id); };
  // Watch on an agent's answer: the jobs it named. When one finishes, needs you or starts, its agent says so in that chat
  const [agWatch, setAgWatch] = useState({}), agWatchRef = useRef(agWatch); agWatchRef.current = agWatch; const mineRef = useRef(new Set());
  const autoWatch = (id, chat, topic) => { if (!id) return; const A = window.__northAgents; setAgWatch((w) => ({ ...w, ["auto:" + id]: { auto: true, chat, topic, base: A ? A.states([id]) : {} } })); };
  const toggleAgWatch = (m) => { const A = window.__northAgents, ids = (m.jobs || []).map((j) => j.id);
    setAgWatch((w) => { const n = { ...w }; if (n[m.id]) delete n[m.id]; else n[m.id] = { chat: m.chat, topic: m.topic, base: A ? A.states(ids) : {} }; return n; });
    if (!agWatchRef.current[m.id]) toast(`Watching · ${AGENTS[m.agent].n} will post here when these move`); };
  useEffect(() => {
    const t = setInterval(() => { const A = window.__northAgents, W = agWatchRef.current; if (!A || !Object.keys(W).length) return;
      const posts = [], next = {};
      Object.entries(W).forEach(([mid, w]) => { const now = A.states(Object.keys(w.base)); next[mid] = { ...w, base: now };
        Object.entries(now).forEach(([id, st]) => { if (st !== w.base[id]) { if (mineRef.current.has(id)) return; const c = A.changed(id, w.base[id]); if (c) posts.push({ ...c, chat: w.chat, topic: w.topic }); } }); });
      Object.keys(next).forEach((k) => { if (next[k].auto && Object.values(next[k].base).every((st) => st === "done" || st === "gone")) delete next[k]; });
      setAgWatch(next); mineRef.current.clear(); if (!posts.length) return;
      const groups = []; posts.forEach((c) => { const g = groups.find((y) => y.chat === c.chat && y.ag === c.ag); if (g) g.L.push(c); else groups.push({ chat: c.chat, ag: c.ag, topic: c.topic, L: [c] }); });
      const N = (n) => ["", "One", "Two", "Three", "Four", "Five", "Six"][n] || String(n);
      setMsgs((x) => { let out = x.map((mm) => ({ ...mm, last: false }));
        groups.forEach((g, k) => { const dl = g.L.filter((c) => c.done), qu = g.L.filter((c) => !c.done);
          // finished work is handed back: the thing itself, what it found, and a way into it
          const dT = (n) => (n === 1 ? "That’s done. Here’s what came out of it." : `${N(n)} are done. Here’s what came out of them.`);
          if (dl.length) { const inC = out.filter((mm) => mm.chat === g.chat), tl = inC[inC.length - 1];
            // still the last thing in the chat: the same delivery grows instead of stacking another one
            if (tl && tl.role === "agent" && tl.deliv && tl.agent === g.ag) { const all = [...tl.deliv, ...dl.map((c) => c.done)]; out = out.map((mm) => (mm.id === tl.id ? { ...mm, deliv: all, text: dT(all.length) } : mm)); }
            else out.push({ id: Date.now().toString(36) + "d" + k, role: "agent", agent: g.ag, na: true, deliv: dl.map((c) => c.done), jobs: [], snap: {}, chat: g.chat, topic: g.topic, text: dT(dl.length) }); }
          if (!qu.length) return;
          const inChat = out.filter((mm) => mm.chat === g.chat), tail = inChat[inChat.length - 1], line = qu.map((c) => c.text).join(" ");
          if (tail && tail.role === "agent" && tail.update && tail.agent === g.ag) { out = out.map((mm) => (mm.id === tail.id ? { ...mm, text: `${mm.text} ${line}` } : mm)); return; }
          out.push({ id: Date.now().toString(36) + "w" + k, role: "agent", agent: g.ag, update: true, na: true, text: line, jobs: [], snap: {}, chat: g.chat, topic: g.topic }); });
        return out; });
      groups.forEach((g) => { if (g.chat !== chatRef.current) setUnread((u) => new Set([...u, g.topic])); });
    }, 2500);
    return () => clearInterval(t);
  }, []);
  const shareD = (m, d, k, l) => { window.__northAgents?.seen(d.id);
    if (k === "gc") { startGc(m.id, [d.who.split(/\s*\/\s*/)[0]], [], "", d); return; }
    if (k === "link" || k === "text") { try { navigator.clipboard.writeText(k === "text" ? `${d.t}. ${d.result || ""}` : `north.fello.ai/work/${d.id}`).catch(() => {}); } catch (e) {} }
    toast(window.__northAgents.shareDone(k, l));
  };
  // Share from a job on the Agents page: the work comes into the chat you're in, with the Google Chat draft under it
  useEffect(() => { window.__northShare = (d) => { const st = stRef.current; if (!isOpen(st)) open({ mode: ctxMode() });
    const id = Date.now().toString(36) + "s", here = chatRef.current === "__new" ? null : chatRef.current || latestChat(msgsRef.current);
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), { id, role: "agent", agent: d.ag, na: true, deliv: [d], jobs: [], snap: {}, topic: d.t, ...(here ? { chat: here } : {}), text: "Here it is, ready to send." }]);
    setTimeout(() => startGc(id, [d.who.split(/\s*\/\s*/)[0]], [], "", d), 350); };
    return () => { window.__northShare = null; }; });
  const bringNa = (m, aid) => { learn("at"); setMsgs((x) => x.map((mm) => (mm.id === m.id ? { ...mm, brought: true } : mm))); send(`@${AGENTS[aid].n} what do you make of this?`, null); };
  const bringAgent = (msgId, aid) => {
    learn("at");
    setMsgs((x) => x.map((mm) => (mm.id === msgId ? { ...mm, brought: true } : mm)));
    runAgents([aid], "", false);
  };
  const close = () => { moving(); setState(asked.current ? "hidden" : "closed"); setVoice(null); setPick(false); setHeld(null); };
  // Continue in Google Chat: North drafts the handoff under the answer (people, where, a short brief)
  // a whole section (a topic in the thread): North writes the summary, nobody has to read the thread
  const startGcSection = (topicOrList, names = [], extra = [], cmd = "") => {
    const ms = msgsRef.current;
    const want = [].concat(topicOrList).filter(Boolean);
    const all = ms.filter((x) => x.role === "north" && x.answer && !x.answer.noSum);
    const order = [...new Set(all.map((x) => x.topic).filter(Boolean))];
    const sections = order.filter((tp) => want.includes(tp));
    if (!sections.length) { toast("Nothing to summarize in that section yet"); return; }
    const open = ms.find((x) => x.kind === "gchat" && x.gc.step === "compose" && x.gc.summary);
    if (open && want.length === 1 && open.gc.sections.length === 1 && open.gc.sections[0] === want[0]) { setMsgs((x) => x.filter((mm) => mm.id !== open.id)); return; }
    const first = (t) => (t.split(/(?<=[.!?])\s+/)[0] || t).replace(/\n+/g, " ").replace(/^Picking this back up: /, "");
    const secs = {};
    // each answer as a written paragraph (its recap, or its first two sentences)
    const para = (a) => a.sum || (a.text.replace(/^Picking this back up: /, "").split(/\n\n+/)[0].split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));
    order.forEach((tp) => { const an = all.filter((x) => x.topic === tp); secs[tp] = { n: an.length, charts: an.filter((x) => x.answer.card).length, paras: [...new Set(an.slice(-3).map((x) => para(x.answer)))] }; });
    const mine = all.filter((x) => sections.includes(x.topic));
    const base = mine.find((x) => x.answer.gc)?.answer.gc || suggestFor(`${sections.join(" ")} ${mine.map((x) => x.answer.text).join(" ")}`);
    const cards = mine.map((x) => x.answer.card).filter(Boolean), card = cards[cards.length - 1] || null;
    const people = [...new Set(names.length ? names : mine.flatMap((x) => (x.answer.gc ? x.answer.gc.people : [])).concat(base.people || []))].slice(0, 4);
    const id = "gc" + Date.now().toString(36), last = mine[mine.length - 1];
    let gc = summaryOf({ step: "compose", people, suggested: base.people || [], dest: "new", space: base.space || "#sales-leadership", lead: first(last.answer.text), card,
      order, secs, sections, ask: base.ask || "What should we do about this before Monday?",
      r1who: base.r1who || null, reply1: base.reply1 || "Thanks. @North what's the one thing to do first?", reply2: base.reply2 || first(last.answer.text), replies: 0 });
    if (cmd) { const r = applyCommand(gc, cmd, true); if (r) gc = { ...r.g, people: names.length ? names : r.g.people }; }
    if (open) setMsgs((x) => x.filter((mm) => mm.id !== open.id));
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), ...extra, { id, role: "north", kind: "gchat", section: sections[0], for: last.id, topic: sections[0], gc }]);
    setReserve(0); stick.current = true;
  };
  const startGc = (forId, names = [], extra = [], cmd = "", dl = null) => {
    learn("gc"); setHintGc(null);
    const ms = msgsRef.current;
    // the button again: put the draft away
    const open = forId && ms.find((x) => x.kind === "gchat" && x.gc.step === "compose" && x.for === forId);
    if (open) { setMsgs((x) => x.filter((mm) => mm.id !== open.id)); return; }
    const picked = forId ? ms.find((x) => x.id === forId) : [...ms].reverse().find((x) => x.role === "north" && x.answer);
    // from an agent's take: the answer it was about, with that agent along; from an answer: any agents who weighed in on it
    const at = picked ? ms.indexOf(picked) : -1;
    let src = picked && picked.role === "agent" && !picked.na ? [...ms.slice(0, at)].reverse().find((x) => x.role === "north" && x.answer && x.chat === picked.chat) || null : picked;
    if (src && src.role === "agent") { const ds = dl ? [dl] : src.deliv || [];
      src = { ...src, role: "north", answer: { text: ds.length ? ds.map((d) => `${d.t}${d.v > 1 ? ` (v${d.v})` : ""}. ${d.result || ""}`).join("\n\n") : src.text, topic: ds.length ? ds[0].t : src.topic, key: "agents", noSum: true } }; }
    if (!src) { toast("Ask North something first, then take it to Google Chat"); return; }
    const si = ms.indexOf(src);
    const agentsOn = picked.role === "agent" ? [picked]
      : ms.slice(si + 1).filter((x, k, arr) => x.role === "agent" && !x.typing && x.topic === src.topic && !arr.slice(0, k).some((y) => y.role === "user" && !agentsIn(y.text).length && !/convene/i.test(y.text)));
    const roundAgents = src.answer.synth ? ms.slice(0, si).filter((x) => x.role === "agent" && !x.typing && x.topic === src.topic).slice(-3) : [];
    const agents = [...new Map([...roundAgents, ...agentsOn].map((x) => [x.agent, { id: x.agent, text: x.text }])).values()];
    const base = src.answer.synth ? [...ms.slice(0, si)].reverse().find((x) => x.role === "north" && x.answer && !x.answer.synth && x.topic === src.topic) : null;
    const a = src.answer, card = a.card || (base && base.answer.card) || null;
    const paras = a.text.split(/\n\n+/);
    const sug = a.gc || (base && base.answer.gc) || { ...suggestFor(`${src.topic} ${a.text} ${card ? card.title : ""}`), r1who: null,
      reply1: "Looking now. @North what's behind this?", reply2: (paras[1] || paras[0]).trim() };
    const people = [...new Set([...(names.length ? names : sug.people)])];
    const lead = (a.text.split(/(?<=[.!?])\s+/)[0] || a.text).replace(/\n+/g, " ");
    const id = "gc" + Date.now().toString(36);
    const dv = picked && picked.role === "agent" ? (dl ? [dl] : picked.deliv || []) : [];
    if (dv.length) agents.forEach((g) => { g.text = dv.map((d) => `${d.t}${d.v > 1 ? ` (v${d.v})` : ""}: ${d.result || ""}`).join(" "); });
    let gc = { step: "compose", people, suggested: sug.people, dest: "new", space: sug.space, topic: src.topic || "From North", lead, card,
      brief: dv.length ? `${AGENTS[picked.agent].n} finished ${dv.length === 1 ? `“${dv[0].t}”` : `${dv.length} pieces of work`} for us. ${dv.map((d) => d.result || "").join(" ")} Have a look when you can.` : `Looking at ${src.topic || "this"} in North. ${lead} ${sug.ask}`, r1who: sug.r1who, reply1: sug.reply1, reply2: sug.reply2, replies: 0,
      // agents come along: they're in Google Chat too, post their own take, and answer when they're tagged there
      agents, r2agent: agents.length ? agents[agents.length - 1].id : null };
    if (agents.length) gc.reply1 = gc.reply1.replace("@North", `@${AGENTS[gc.r2agent].n}`);
    if (cmd) { const r = applyCommand(gc, cmd, true); if (r) gc = { ...r.g, people: names.length ? names : r.g.people }; }
    setMsgs((x) => [...x.map((mm) => ({ ...mm, last: false })), ...extra, { id, role: "north", kind: "gchat", for: forId || src.id, topic: src.topic, gc }]);
    setReserve(0); stick.current = true;
  };
  const openFromLink = (srcId) => {
    const st = stRef.current; if (!isOpen(st)) open();
    setTimeout(() => {
      const el = document.querySelector(`[data-cc="${srcId}"]`), m = msgsRef.current.find((x) => x.id === srcId);
      if (!el) return;
      stick.current = false; el.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => { if (m && m.answer.card && m.answer.card.more) setFull({ id: srcId, from: el.getBoundingClientRect(), flat: stRef.current === "full" }); else { el.classList.add("is-found"); setTimeout(() => el.classList.remove("is-found"), 1400); } }, 420);
    }, 260);
  };
  const updGc = (id, gc) => setMsgs((x) => (gc ? x.map((mm) => (mm.id === id ? { ...mm, gc } : mm)) : x.filter((mm) => mm.id !== id)));
  // just talking (⌘K, typing on the page, the sidebar's Ask North): a fresh session starts as a centred field over the
  // blurred page and only becomes full screen once you send; mid-conversation it reopens the thread where you left it
  // ⌘K, or just typing: always the floating field first, wherever you are. What you send opens the chat beside the page
  // K: a fresh ask. If the mouse moved in the last few seconds the bubble is born at the cursor, carrying what it's on
  const summon = (opts = {}) => {
    const p = lastPtr.current, here = !isOpen(stRef.current) && p && performance.now() - p.t < 8000 && p.x > 0 && p.y > 0 && p.x < window.innerWidth && p.y < window.innerHeight;
    let q = null;
    if (here) { q = bubCtxAt(p.x, p.y); if (q) setHeld({ id: aimId(q.el), el: q.el, k: "chart" }); if (q) delete q.el; }
    bubRef.current = here ? { x: p.x, y: p.y } : null; bubW.current = BUB_MIN; setBub(bubRef.current);
    open({ quote: q, ...opts, mode: "bar" });
  };
  useEffect(() => { if (state !== "bar" && bubRef.current) { bubRef.current = null; setBub(null); } }, [state]);
  // what the bubble is on: the card or chart under the cursor, as a whole (so it holds steady while you move within it)
  function bubCtxAt(x, y) { const el = document.elementFromPoint(x, y), t = el && !el.closest(".chat-shell, .side, [class*='dialkit']") ? readTarget(el, true) : null;
    return t ? { k: "chart", t: `${t.title}${t.big ? ` · ${t.big}` : ""}`, title: t.title, id: t.id, lane: t.lane, el: t.card } : null; }
  // the bubble stays stuck to the cursor until you send or press Esc; crossing into another card swaps what it's about
  useEffect(() => {
    if (!bub || state !== "bar") return;
    let raf = 0, card = held?.el || null;
    const mv = (e) => { const x = e.clientX, y = e.clientY; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      if (!bubRef.current || !shellRef.current) return; bubRef.current = { x, y };
      const g = bubGeo(bubW.current), sh = shellRef.current; L.set(g.l); sh.style.left = `${g.l}px`;
      sh.style.setProperty("--bar-b", `${g.bottom}px`); sh.style.setProperty("--bub-t", `${g.top}px`); sh.classList.toggle("is-flip", g.flip); sh.classList.toggle("is-r", g.r);
      const q = bubCtxAt(x, y), el = q ? q.el : null;
      if (el !== card) { card = el; if (q) { delete q.el; setQuote(q); setHeld({ id: aimId(el), el, k: "chart" }); } else { setQuote(null); setHeld(null); } }
    }); };
    window.addEventListener("pointermove", mv, { passive: true });
    return () => { window.removeEventListener("pointermove", mv); cancelAnimationFrame(raf); };
  }, [bub, state]);
  // as the bubble widens, the field re-measures, so a line that now fits doesn't leave an empty one behind
  useEffect(() => Wd.on("change", () => { if (!bubRef.current) return; const el = inputRef.current; if (!el || el.tagName !== "TEXTAREA") return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 196)}px`; }), []);
  // the bubble widens with what you write (200 → 440), then wraps. It resizes in the same frame as the keystroke, before paint,
  // like a native field: an animated width lags the text, which wraps to a second line and snaps back
  useLayoutEffect(() => {
    if (!bub || state !== "bar") return;
    const el = inputRef.current, sh = shellRef.current; if (!el || !sh) return;
    const c = bubCtx.current || (bubCtx.current = document.createElement("canvas").getContext("2d")), cs = getComputedStyle(el); c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const tw = Math.max(0, ...String(val || el.placeholder || "").split("\n").map((l) => c.measureText(l).width));
    const want = Math.round(Math.max(BUB_MIN, Math.min(BUB_MAX, Math.ceil(tw) + 44))); // 28 padding + room for the caret
    if (want !== bubW.current) { bubW.current = want; const g = bubGeo(want); sh.style.width = `${want}px`; sh.style.left = `${g.l}px`; Wd.set(want); L.set(g.l); }
    el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 196)}px`;
  }, [val, bub, state, quote]);
  // pointing needs the page in view: from the centred field or full screen, the chat docks first, then you point
  const togglePick = () => {
    if (pick) { setPick(false); return; }
    const st = stRef.current;
    if (st === "full") shift("dock"); // the bar stays put (it steps aside while you choose) and takes the chart as context
    setPick("btn");
  };
  const openCtx = (opts = {}) => {
    const st = stRef.current;
    if (st === "full") return shift("dock", opts);
    if (st === "bar") { if (opts.quote !== undefined) setQuote(opts.quote); if (opts.text !== undefined) setVal(opts.text); openedAt.current = performance.now(); return focusInput(); } // K's bar: the thing you picked rides along, you ask, then it grows
    return open({ ...opts, mode: ctxMode() });
  };
  api.current = {
    open: () => summon(), // just talking: ⌘K, the sidebar row, typing anywhere → centred field (or where you last left it)
    talk: (q) => { const pi = q && pinIntent(q); if (pi) { setChat("__new"); setCont(null); const r = pinByName(pi, q, null); if (r === "quiet") return; if (r) { open({ mode: "full", quote: null }); return; } } setChat("__new"); setCont(null); setHeld(null); open({ mode: "full", quote: null }); if (q) setTimeout(() => send(q, null), 120); }, // Home's field, the sidebar row: a fresh chat, your history beside it
    type: (t) => open({ text: t }), // started typing in Home's ask field: carry on in the chat
    ask: (q, qt) => { openCtx(); setTimeout(() => send(q, qt ?? null), 120); }, // an Ask North button: about something → docked
    toggle: () => (isOpen(stRef.current) ? close() : summon()),
    // Home's target: point first; the chat docks when you pick a chart (the page doesn't move while you're choosing)
    point: () => { if (stRef.current === "full" || stRef.current === "bar") togglePick(); else setPick((p) => (p ? false : "btn")); },
    // prototype: forget what's been learned and start the first run over
    replayFirstRun: () => {
      Object.values(watchT.current).forEach((t) => typeof t === "number" && clearTimeout(t)); watchT.current = {};
      setOb({ learned: [], shown: {} }); lastNudge.current = 0; setHintWatch(null); setHintGc(null); obSeen.current = 0; obLast.current = 0; obMuted.current = false; setNudge(null);
      setWatched(new Set(Object.keys(WATCH_SEED))); setWatchInfo(WATCH_SEED); setUnread(new Set()); setMsgs(SEEDED()); asked.current = false;
      setPick(false); setHeld(null); setVal(""); setQuote(null); setFull(null); setGcPrev(null); setState("closed");
    },
    // the sidebar's Watching row: hover opens the list beside it, leaving closes it (unless you moved onto the list)
    watchFly: (r) => { clearTimeout(flyT.current); if (r) setWatchFly({ top: r.top - 6, left: r.right + 8, h: r.height }); else flyT.current = setTimeout(() => setWatchFly(null), 140); },
    goWatch: (tp, mode) => goWatch(tp, mode), // Home's "what changed": open that topic's catch-up (full screen)
    hide: close, // the sidebar took you somewhere: full screen gets out of the way (docked stays beside the page)
  };

  useLayoutEffect(() => { if (state === "dock" || state === "float" || state === "full") { const el = listRef.current; if (el && stick.current) el.scrollTop = el.scrollHeight; } }, [state]);
  // coming back to an update: land on it
  useEffect(() => {
    if (state !== "dock" && state !== "float") return;
    const t = setTimeout(() => { const el = listRef.current; if (!el) return; const ups = el.querySelectorAll(".ch-topic.is-update"); const h = ups[ups.length - 1]; if (unread.size && h) { stick.current = false; } if (unread.size && h) el.scrollTo({ top: el.scrollTop + h.getBoundingClientRect().top - el.getBoundingClientRect().top - 12, behavior: "smooth" }); else el.scrollTo({ top: el.scrollHeight }); setUnread(new Set()); }, 220);
    return () => clearTimeout(t);
  }, [state]);
  useEffect(() => {
    let raf = 0;
    const follow = () => { const el = listRef.current; if (el && stick.current) { let gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      // floating over the page: keep your question at the top so the answer reads from its first line; the rest scrolls
      if (stRef.current === "float") { const us = el.querySelectorAll(".ch-user"), u = us[us.length - 1]; if (u) { const hd = u.previousElementSibling && u.previousElementSibling.classList.contains("ch-topic") ? u.previousElementSibling : u; gap = Math.min(gap, hd.getBoundingClientRect().top - el.getBoundingClientRect().top - 12); } } if (gap > 0.5) el.scrollTop += Math.max(1, gap * 0.18); } raf = requestAnimationFrame(follow); };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, []);

  // talking in the chat is the same voice as everywhere else (⌃ held, or the voice button on Home): the bar becomes the voice, what
  // you say shows as you say it, and it goes into this conversation, commands included. Held Space lets go to send
  const startVoice = () => {
    spaceT.current = "on";
    // a conversation open: the words go into it. Nothing open: the same as holding ⌃ (a command, else a question to North)
    if (isOpen(stRef.current) && stRef.current !== "bar") voiceBus.start((t) => send(t, null)); else { if (stRef.current === "bar") close(); voiceBus.start(); }
  };
  const endVoice = () => {
    clearInterval(voiceT.current); spaceT.current = null; setVoice(null);
    voiceBus.finish();
  };
  // text that began elsewhere (a "d" the dials held back): open with it, or add it to what's in the field
  useEffect(() => { window.__northType = (t) => { if (!isOpen(stRef.current)) { if (/k$/i.test(t)) summon(); } else { setVal((v) => v + t); focusInput(); } }; return () => { window.__northType = null; }; });
  // keyboard: ⌘K toggles · Esc hides · start typing anywhere · hold Space to talk · hold ⌥ to point at a chart
  useEffect(() => {
    const down = (e) => {
      const st = stRef.current, typing = isTyping(document.activeElement), inDial = e.target.closest && e.target.closest('[class*="dialkit"]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const s = window.getSelection && String(window.getSelection()).trim();
        if (s) { learn("text"); openCtx({ quote: { k: "text", t: s.slice(0, 220) } }); setSel(null); return; } // highlighted words → docked, so the page stays in view
        // open somewhere but you're not in it: ⌘K takes you to its field. Already in it: ⌘K puts it away
        // closed: a fresh chat, full screen, history beside it. Already talking: the same chat, bigger. Full: put it away
        if (st === "full") close(); else if (isOpen(st)) shift("full"); else { setChat("__new"); setCont(null); setHeld(null); open({ mode: "full", quote: null }); }
        return;
      }
      if (e.key === "Escape") {
        if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".agx .ask-dock")) { document.activeElement.blur(); return; }
        // the ask field on a Home or a team page: Esc lets go of it, so K works again straight after
        if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".home-ask, .ask-slot, .dh-ask") && !document.activeElement.closest(".chat-shell")) { document.activeElement.blur(); return; }
        if (pick) { e.preventDefault(); setPick(false); setAim(null); return; }
        // Esc never loses a conversation: the bare field closes, full screen steps down to the pop-out, otherwise it just lets go of the field
        if (st === "bar") { e.preventDefault(); close(); return; }
        // …unless there's no conversation yet (a fresh one, still showing what you could ask): then there's nothing to keep, so it closes
        if (st === "full" && !jobModalRef.current) { e.preventDefault(); if (document.querySelector(".chat-shell .chat-moving")) close(); else shift("float"); return; }
        if (isOpen(st)) { e.preventDefault(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); return; }
      }
      // hold ⌥ to point — only while the page is in view (not over the centred field or full screen)
      if (e.key === "Alt" && st !== "full" && st !== "bar" && (!typing || document.activeElement.closest(".chat-shell")) && !inDial && !e.repeat) { setPick((p) => p || "alt"); return; }
      // K opens the bar from anywhere you aren't typing, the dials panel included
      // K is always "bring up the chat": closed, it opens; already up (floating, docked, full) but you're not in it, it takes
      // you into its field. It never types a "k" into a chat you weren't typing in
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPick(false); setAim(null);
        if (!isOpen(st)) summon(); else focusInput(); return; }
      if (inDial || typing || e.metaKey || e.ctrlKey || e.altKey) return;
      // the field is open but the cursor isn't in it yet (it's still arriving, or you clicked the page): keys, spaces too, go in
      if (M.chat.typeAnywhere && e.key.length === 1 && isOpen(st) && document.activeElement !== inputRef.current) { e.preventDefault(); setVal((v) => v + e.key); focusInput(); return; }
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat || spaceT.current) return;
        spaceT.current = setTimeout(startVoice, M.chat.holdMs);
        return;
      }
      if (e.key.toLowerCase() === "k" && !e.shiftKey && !isOpen(st)) { e.preventDefault(); setPick(false); setAim(null); summon(); }
      else if (M.chat.typeAnywhere && e.key.length === 1 && isOpen(st) && st !== "bar" && document.activeElement !== inputRef.current) { e.preventDefault(); setVal((v) => v + e.key); focusInput(); }
      // keys typed while the field is still arriving land in it, not on the page
      else if (e.key.length === 1 && st === "bar" && document.activeElement !== inputRef.current) { e.preventDefault(); setVal((v) => v + e.key); focusInput(); }
    };
    const up = (e) => {
      if (e.key === "Alt") { setPick((p) => (p === "alt" ? false : p)); setAim((a) => (pick === "alt" ? null : a)); return; }
      if (e.code !== "Space" || !spaceT.current) return;
      if (spaceT.current === "on") endVoice();
      else { clearTimeout(spaceT.current); spaceT.current = null; document.querySelector(".scroll")?.scrollBy({ top: 360, behavior: "smooth" }); }
    };
    const blur = () => setPick((p) => (p === "alt" ? false : p));
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  });

  // anything on the page can hand North a piece of context: a chart's ask button, or clicking a bar while its tooltip shows
  useEffect(() => {
    const attach = (e) => { if (full) window.dispatchEvent(new Event("north:shutfull")); const { el, ...q } = e.detail || {}; if (el) setHeld({ id: aimId(el), el, k: q.k || "chart" }); openCtx({ quote: q }); };
    const barClick = (e) => {
      if (pick || !e.target.closest) return;
      if (e.target.closest(".chat-shell, .chat-pill, [class*='dialkit'], button, a, input")) return;
      const card = e.target.closest(PICK); if (!card) return;
      if (!(e.target.closest("svg") || e.target.closest(".tip") || e.target.closest("[class*='plot'], [class*='chart']"))) return; // the tooltip's "Click to ask North" counts as the chart
      const t = readTarget(e.target); if (!t || !t.point) return;
      e.preventDefault(); e.stopPropagation();
      setHeld({ id: aimId(t.card), el: t.card, k: "point" });
      openCtx({ quote: { k: "point", t: `${t.title} · ${t.point}`, title: t.title, point: t.point, id: t.id, lane: t.lane } });
    };
    window.addEventListener("north:attach", attach); document.addEventListener("click", barClick, true);
    return () => { window.removeEventListener("north:attach", attach); document.removeEventListener("click", barClick, true); };
  });

  // point at a chart: ring the chart under the cursor; on a bar or point, name that point; click adds it as context
  useEffect(() => {
    const root = document.documentElement; root.classList.toggle("chat-picking", !!pick);
    if (!pick) { setAim(null); return; }
    const n0 = nudgeRef.current;
    if (n0 && n0.el.isConnected) { const t0 = readTarget(n0.el, true); if (t0) setAim({ id: n0.id, r: ringRect(n0.el), x: ptr.current[0], y: ptr.current[1], k: "chart", label: `${t0.title}${t0.big ? ` · ${t0.big}` : ""}` }); }
    const move = (e) => {
      if (e.target.closest && e.target.closest(".chat-shell, .chat-pill, .ask-aim, .chat-pickbar, [class*='dialkit']")) { setAim(null); return; }
      const t = readTarget(e.target);
      if (!t) { setAim(null); return; }
      setAim({ id: aimId(t.card), r: ringRect(t.card), x: e.clientX, y: e.clientY, k: t.point ? "point" : "chart", label: t.point ? `${t.title} · ${t.point}` : `${t.title}${t.big ? ` · ${t.big}` : ""}` });
    };
    const click = (e) => {
      if (e.target.closest && e.target.closest(".chat-shell, .chat-pill, .ask-aim, .chat-pickbar, [class*='dialkit']")) return;
      const t = readTarget(e.target);
      e.preventDefault(); e.stopPropagation();
      if (!t) return;
      const c = { k: t.point ? "point" : "chart", t: t.point ? `${t.title} · ${t.point}` : `${t.title}${t.big ? ` · ${t.big}` : ""}`, title: t.title, big: t.big, point: t.point, id: t.id, lane: t.lane };
      learn(pick === "alt" ? "alt" : "btn");
      setPick(false); setAim(null);
      setHeld({ id: aimId(t.card), el: t.card, k: c.k });
      openCtx({ quote: c });
    };
    const stop = (e) => { if (!(e.target.closest && e.target.closest(".chat-shell, .chat-pill, .ask-aim, .chat-pickbar, [class*='dialkit']"))) { e.stopPropagation(); } };
    document.addEventListener("pointermove", move, true); document.addEventListener("click", click, true); document.addEventListener("pointerdown", stop, true);
    return () => { root.classList.remove("chat-picking"); document.removeEventListener("pointermove", move, true); document.removeEventListener("click", click, true); document.removeEventListener("pointerdown", stop, true); };
  }, [pick]);

  // first run, the lead move: rest on a chart and it glows faintly, with "hold ⌥" at the cursor. Hold it and the same glass lights up.
  const nudgeOk = M.chat.obOn && !ob.learned.includes("alt") && !ob.learned.includes("btn") && !pick && state !== "full" && state !== "bar" && !full;
  useEffect(() => {
    if (!nudgeOk) { if (nudgeRef.current) lastNudge.current = Date.now(); setNudge(null); return; }
    let card = null, t = 0;
    const off = () => { clearTimeout(t); if (nudgeRef.current) { lastNudge.current = Date.now(); setNudge(null); } };
    const move = (e) => {
      ptr.current = [e.clientX, e.clientY];
      const c = e.target.closest && !e.target.closest(".chat-shell, .chat-pill, .sel-ask, [class*='dialkit']") ? e.target.closest(PICK) : null;
      if (c !== card) {
        off(); card = c;
        if (c && Date.now() - lastNudge.current > M.chat.obGap * 1000) t = setTimeout(() => {
          if (card !== c || !mayHint("alt")) return;
          const tg = readTarget(c, true); shownHint("alt");
          setNudge({ id: aimId(c), el: c, x: ptr.current[0], y: ptr.current[1], title: tg ? `${tg.title}${tg.big ? ` · ${tg.big}` : ""}` : "" });
        }, M.chat.obDwell);
      } else if (nudgeLbl.current) { nudgeLbl.current.style.left = `${e.clientX}px`; nudgeLbl.current.style.top = `${e.clientY}px`; }
    };
    const down = (e) => { if (!(e.target.closest && e.target.closest('[class*="dialkit"]'))) { off(); card = null; } };
    const sc = document.querySelector(".scroll");
    document.addEventListener("pointermove", move, true); document.addEventListener("pointerdown", down, true); sc && sc.addEventListener("scroll", off, { passive: true });
    return () => { clearTimeout(t); document.removeEventListener("pointermove", move, true); document.removeEventListener("pointerdown", down, true); sc && sc.removeEventListener("scroll", off); };
  }, [nudgeOk, M.chat.obDwell, M.chat.obGap]);

  // highlight anything on a page → "Ask North" chip above it
  useEffect(() => {
    const check = () => {
      const s = window.getSelection(); const text = s ? String(s).trim() : "";
      if (!text || text.length < 2 || !s.rangeCount) { setSel(null); return; }
      const node = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
      if (!node || node.closest(".chat-shell, .dialkit, [class*='dialkit']")) { setSel(null); return; }
      const r = s.getRangeAt(0).getBoundingClientRect();
      setSel({ text: text.slice(0, 220), x: r.left + r.width / 2, y: r.top });
    };
    const onUp = () => setTimeout(check, 10);
    const clear = () => setSel(null);
    document.addEventListener("mouseup", onUp); document.addEventListener("keyup", onUp);
    document.querySelector(".scroll")?.addEventListener("scroll", clear, { passive: true });
    return () => { document.removeEventListener("mouseup", onUp); document.removeEventListener("keyup", onUp); document.querySelector(".scroll")?.removeEventListener("scroll", clear); };
  }, []);

  // drag the header: out of the column → it floats at the bottom; back toward the left edge → it docks again
  const onDragEnd = () => {
    x.stop(); y.stop(); const dx = x.get(), dy = y.get(), W = window.innerWidth;
    L.set(L.get() + dx); T.set(T.get() + dy); x.set(0); y.set(0);
    const cx = L.get() + Wd.get() / 2;
    if (state === "dock") {
      if (Math.hypot(dx, dy) < M.chat.floatAt) return open({ mode: "dock", reform: true });
      floatX.current = L.get(); floatBox.current = { l: L.get(), t: T.get(), w: M.chat.width, h: Math.min(M.chat.floatH, window.innerHeight - 120) }; return open({ mode: "float" });
    }
    // floating: it stays where you drop it (pushed into the sidebar's edge, it docks)
    if (L.get() < sideW() - 24) return open({ mode: "dock" });
    floatBox.current = { l: L.get(), t: T.get(), w: Wd.get(), h: Hd.get() }; place("float", false);
  };
  const popOut = () => { floatX.current = null; open({ mode: state === "dock" ? "float" : "dock" }); };
  const toFull = () => shift("full");
  // where a first answer opens: full screen, except on the Agents page, where the chat docks beside the board so you stay on it
  function answerMode() { return "full"; }
  // the bubble lifting into the answer: full screen forms in place (the same open as the sidebar's Ask North), the dock reshapes
  function lift() { const md = answerMode(); if (md === "full") open({ mode: "full", reform: true, soft: true }); else shift(md); } // a question from the bubble opens full screen (a chart you asked about comes with it); the dock stays one click away on its icon
  const toDock = () => (state === "float" ? open({ mode: "dock" }) : shift("dock"));
  // closed, chat lives in the sidebar's Ask North row: lit while open, a coral dot when a watched topic moved
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("chat-open", isOpen(state));
    root.classList.toggle("chat-unread", unread.size > 0 && !isOpen(state));
  }, [state, unread.size]);
  useEffect(() => {
    // only the bare field closes when you click away. Once it's a conversation (pop-out, docked, full) it stays until you
    // press its ×: a stray click while resizing or reading must never lose it
    if (state !== "bar") return;
    const KEEP = ".chat-shell, .chat-pill, .chat-pickbar, .chat-aim-label, .wl, .ch-menu, .gc-modal, .chat-toast, [class*='dialkit']";
    const onClick = (e) => {
      if (pick || performance.now() - openedAt.current < 120) return; // this same click just opened or moved it
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.some((el) => el && el.matches && el.matches(KEEP))) return;
      close();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [state, pick]);
  useEffect(() => {
    if (state !== "float") return;
    let raf = 0;
    const fit = () => { raf = 0; const sh = shellRef.current, ls = listRef.current; if (!sh || !ls || floatBox.current) return; // placed or sized by you: it keeps that
      const kids = [...ls.children].filter((c) => c.offsetParent !== null); if (!kids.length) return;
      const cs = getComputedStyle(ls), inner = kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const other = sh.offsetHeight - ls.clientHeight, H = window.innerHeight, cap = Math.min(Math.round(H * 0.46), 440);
      const af = document.querySelector(".agx .ask-dock.is-north")?.getBoundingClientRect(), want = Math.round(Math.min(cap, Math.max(180, other + inner))), bot = af && af.width > 0 ? Math.round(H - af.bottom) : gapB() + 7;
      if (Math.abs(want - Hd.get()) < 3) return;
      const tr = toMotion(M.chat.shift); animate(Hd, want, tr); animate(T, H - bot - want, tr); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(fit); };
    const ro = new ResizeObserver(kick), mo = new MutationObserver(kick);
    const ls = listRef.current; if (ls) { ro.observe(ls); [...ls.children].forEach((c) => ro.observe(c)); mo.observe(ls, { childList: true, subtree: true, characterData: true }); }
    const t = setTimeout(kick, 60);
    return () => { ro.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); clearTimeout(t); };
  }, [state]);
  // docked: the sidebar folds to its rail and the page makes room
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("chat-dock", state === "dock");
    root.classList.toggle("chat-full", state === "full");
    // a conversation is in front of you (full, docked or popped out, not the bare ⌘K field): voice talks into it
    root.classList.toggle("chat-talking", state === "full" || state === "dock" || state === "float");
    // leaving full screen: the page underneath is already laid out beside the rail, so the sidebar stays folded and the page is
    // simply revealed in place (unfolding it here moved the page diagonally as the chat left). One click on the toggle opens it.
    const was = prevSt.current; prevSt.current = state;
    if (was === "full" && state !== "dock" && state !== "full" && !root.classList.contains("side-open")) root.classList.add("side-rail");
    if (state !== "dock" && state !== "full") root.classList.remove("side-open");
    root.style.setProperty("--chat-dock", `${sideW() + Math.min(dockW, window.innerWidth - sideW() - 24) + 12}px`);
    // opening full screen: the sidebar folds once the chat has covered the page, so the page never slides while you can see it
    if (holdRail.current && state === "full") { const t = setTimeout(() => { holdRail.current = false; syncRail(); }, 520); return () => clearTimeout(t); }
    holdRail.current = false; syncRail();
  }, [state, dockW]);
  useEffect(() => { setDockW(M.chat.dockW); }, [M.chat.dockW]);
  useEffect(() => {
    const onSide = () => {
      syncRail();
      const root = document.documentElement;
      root.style.setProperty("--chat-dock", `${sideW() + Math.min(dockWRef.current, window.innerWidth - sideW() - 24) + 12}px`);
      const st = stRef.current;
      if (st === "dock" || st === "full") { const f = frame(st), tr = { duration: 0.4, ease: [0.32, 0.72, 0, 1] }; animate(L, f.l, tr); animate(Wd, f.w, tr); }
    };
    window.addEventListener("north:side", onSide); return () => window.removeEventListener("north:side", onSide);
  }, []);
  useEffect(() => { if (showing) place(state, false); }, [M.chat.width, M.chat.floatW, M.chat.floatH, M.chat.barTop]);
  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    const root = document.documentElement; root.classList.add("chat-resizing");
    const move = (ev) => { const w = clamp(ev.clientX - sideW(), 340, Math.min(980, window.innerWidth * 0.66)); Wd.set(w); setDockW(w); };
    const up = () => { root.classList.remove("chat-resizing"); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const startFloatResize = (ed) => (e) => {
    e.preventDefault(); e.stopPropagation();
    const root = document.documentElement; root.classList.add("chat-resizing");
    const x0 = e.clientX, y0 = e.clientY, b = { l: L.get(), t: T.get(), w: Wd.get(), h: Hd.get() }, W = window.innerWidth, H = window.innerHeight;
    const move = (ev) => { const dx = ev.clientX - x0, dy = ev.clientY - y0; let { l, t, w, h } = b;
      if (ed.includes("e")) w = clamp(b.w + dx, 320, W - 16 - b.l);
      if (ed.includes("s")) h = clamp(b.h + dy, 200, H - 13 - b.t);
      if (ed.includes("w")) { w = clamp(b.w - dx, 320, b.l + b.w - 16); l = b.l + b.w - w; }
      if (ed.includes("n")) { h = clamp(b.h - dy, 200, b.t + b.h - 13); t = b.t + b.h - h; }
      L.set(l); T.set(t); Wd.set(w); Hd.set(h); floatBox.current = { l, t, w, h }; };
    const up = () => { root.classList.remove("chat-resizing"); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  useEffect(() => { const r = () => { const st = stRef.current; if (isOpen(st)) place(st, true); }; addEventListener("resize", r); return () => removeEventListener("resize", r); }, []);
  const toggleWatch = (topic) => {
    const on = !watched.has(topic); learn("watch"); setHintWatch(null);
    setWatched((w) => { const n = new Set(w); on ? n.add(topic) : n.delete(topic); return n; });
    setWatchInfo((w) => ({ ...w, [topic]: { since: "Today", last: null, ...(w[topic] || {}), on } }));
    if (!on) { clearTimeout(watchT.current[topic]); toast(`Stopped watching ${topic}`); return; }
    toast("Watching · North will post here when it moves");
    const u = UPDATES[topic];
    if (u && !watchT.current[topic + ":done"]) watchT.current[topic] = setTimeout(() => {
      watchT.current[topic + ":done"] = true;
      setWatchInfo((w) => ({ ...w, [topic]: { ...(w[topic] || {}), last: `Just now · ${u.update || "Update"}` } }));
      const id = "w" + Date.now().toString(36);
      setMsgs((ms) => [...ms.map((m) => ({ ...m, last: false })), { id, role: "north", topic, proactive: true, answer: u, fresh: true, last: true }]);
      setUnread((s0) => new Set(s0).add(topic));
    }, M.chat.watchMs * 1000);
  };
  const last = msgs[msgs.length - 1];
  // topics: a run of messages under one subject; reopening an old subject starts a new run of it
  const users = msgs.map((m, i) => [m, i]).filter(([m]) => m.role === "user");
  const latestChat = (ms) => { const m = [...ms].reverse().find((x) => x.chat); return m ? m.chat : null; };
  useEffect(() => {
    if (!msgs.some((m) => m.chat == null)) return;
    let nextCur = chatRef.current;
    setMsgs((ms) => { let cur = chatRef.current; const out = [];
      ms.forEach((m) => {
        if (m.chat != null) { out.push(m); return; }
        if (m.proactive || m.catchup) { const prev = [...out].reverse().find((x) => x.topic === m.topic && x.chat), c = prev ? prev.chat : newChatId(); out.push({ ...m, chat: c }); if (m.catchup) cur = c; return; }
        if (!cur || cur === "__new") { const lc = cur === "__new" ? null : latestChat(out), lm = lc && [...out].reverse().find((x) => x.chat === lc && x.role === "user");
          cur = lc && lm && (lm.day || "Today") === "Today" ? lc : newChatId(); } // a new day starts a new chat
        out.push({ ...m, chat: cur }); });
      nextCur = cur; return out; });
    setTimeout(() => { if (nextCur && nextCur !== chatRef.current) setChat(nextCur); }, 0);
  }, [msgs]);
  const shown = chat === "__new" ? "__none__" : chat || latestChat(msgs);
  // the same room wherever a conversation opens: a deal's thread in the full chat brings its account in beside it, as it
  // does on Home; moving to another conversation takes it away
  const shownTopic = (msgs.find((m) => m.chat === shown && m.topic) || {}).topic || "";
  useEffect(() => { const host = shellRef.current; if (!host || state !== "full") return; const room = ROOM_OF_THREAD[shown] || dealIn(shownTopic)?.id;
    // a deal's account no longer opens by itself (too much at once); the conversation offers it at the top. Moving on folds it away
    const t = setTimeout(() => { dispatchEvent(new CustomEvent("north:file-close", { detail: { host, onlyRoom: true } })); }, 0);
    return () => clearTimeout(t); }, [shown, state, shownTopic]);
  const roomNow = state === "full" ? ROOM_OF_THREAD[shown] || dealIn(shownTopic)?.id : null;
  const vis = (m) => m.chat == null || m.chat === shown;
  const visIdx = msgs.map((m, i) => (vis(m) ? i : -1)).filter((i) => i >= 0), prevVis = {}; visIdx.forEach((i, k) => { prevVis[i] = k ? visIdx[k - 1] : -1; });
  const startsTopic = (i) => prevVis[i] === -1 || prevVis[i] == null || msgs[prevVis[i]].topic !== msgs[i].topic || !!msgs[prevVis[i]].proactive;
  const isReopen = (i) => msgs.slice(0, i).some((m) => vis(m) && m.topic === msgs[i].topic);
  const lastHdr = msgs.reduce((k, m, i) => (vis(m) && m.role === "user" && startsTopic(i) ? i : k), -1);
  const shownN = visIdx.length, lastVis = visIdx.length ? visIdx[visIdx.length - 1] : -1;
  const topics = useMemo(() => {
    const out = [];
    msgs.forEach((m) => {
      if (!vis(m)) return;
      if (m.role !== "user" && !m.proactive) return;
      let t = out.find((x) => x.title === m.topic); if (!t) { t = { title: m.topic, day: m.day || "Today", n: 0, last: m.text }; out.push(t); }
      if (m.proactive) { t.day = "Today"; t.last = m.answer.update; return; }
      t.n += 1; t.day = m.day; t.last = m.text;
    });
    return out.map((t) => ({ ...t, watched: watched.has(t.title), unread: unread.has(t.title) }));
  }, [msgs, watched, unread, shown]);
  // the chats: named by their first subject, grouped by the agents in them, most recent first
  // each conversation: who's in it (people and agents), what it's called, whether it's waiting on you, and the last thing said
  const [seenN, setSeenN] = useState({});
  const chats = useMemo(() => { const out = new Map();
    msgs.forEach((m, i) => { if (!m.chat) return; let c = out.get(m.chat); if (!c) out.set(m.chat, (c = { id: m.chat, title: null, ags: new Set(), ppl: new Set(), at: i, unread: false, topics: [], by: null, ask: null, last: null, n: 0 }));
      if (!c.by && m.role !== "user") c.by = m.role === "agent" ? m.agent : m.role === "agent-join" ? "team" : "north";
      c.at = i; c.n += 1; if ((m.role === "user" || m.proactive || m.role === "person" || m.role === "pjoin" || (m.role === "agent" && m.chit)) && m.topic && !c.title) c.title = m.topic;
      if (m.role === "agent" && m.agent !== "north") c.ags.add(m.agent); if (m.role === "agent-join" && m.ids) m.ids.forEach((a) => c.ags.add(a));
      if (m.role === "person") c.ppl.add(m.who); if (m.role === "pjoin") m.who.forEach((w) => c.ppl.add(w));
      if (m.retitle) c.retitle = m.retitle;
      if (m.role === "person" && m.asks) c.ask = m.who; if (m.role === "user") c.ask = null;
      // a private offer (a routine only you can see) is never the conversation's last word: Home's preview is for everyone's words
      if (!m.typing && !m.routine && (m.role === "user" || m.role === "person" || (m.role === "agent" && !m.sug) || (m.role === "north" && m.answer))) c.last = m;
      if ((m.role === "user" || m.proactive) && m.topic && !c.topics.includes(m.topic)) c.topics.push(m.topic); if (unread.has(m.topic)) c.unread = true; });
    return [...out.values()].filter((c) => c.title).map((c) => ({ ...c, title: c.retitle || c.title, ags: [...c.ags].slice(0, 3), ppl: [...c.ppl],
      fresh: c.last && c.last.role !== "user" && (seenN[c.id] || 0) < c.n })).sort((a, b) => (b.ask ? 1 : 0) - (a.ask ? 1 : 0) || b.at - a.at); }, [msgs, unread, seenN]);
  // a conversation you're looking at is read; what's in the ones with people goes to Home (what's waiting on you, the last word)
  useEffect(() => { if (!shown || state === "closed" || state === "hidden") return; const c = chats.find((x) => x.id === shown); if (c && (seenN[c.id] || 0) < c.n) setSeenN((s0) => ({ ...s0, [c.id]: c.n })); }, [shown, state, chats]);
  useEffect(() => { talk.setThreads(chats.filter((c) => c.ppl.length).map((c) => ({ id: c.id, t: c.title, people: c.ppl, ags: c.ags, ask: c.ask, fresh: c.fresh,
    last: c.last && { who: c.last.role === "user" ? "sam" : c.last.role === "person" ? c.last.who : c.last.agent || "north", text: c.last.text || (c.last.answer && c.last.answer.text) || "" },
    msgs: msgs.filter((m) => m.chat === c.id && (m.role === "user" || m.role === "person" || (m.role === "agent" && !m.sug))).map((m) => [m.role === "user" ? "sam" : m.role === "person" ? m.who : m.agent, m.day === "Today" ? "Now" : m.day || "", m.text, m.file, m.routine || null]) }))); }, [chats]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const trackTopic = () => {
    const el = listRef.current; if (!el) return;
    const hs = [...el.querySelectorAll(".ch-topic")]; let cur = hs[0]?.dataset.topic;
    const top = (h) => h.getBoundingClientRect().top - el.getBoundingClientRect().top;
    hs.forEach((h) => { if (top(h) < el.clientHeight * 0.4) cur = h.dataset.topic; });
    setActiveTopic(cur);
    const nearEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearEnd && stRef.current !== "hidden") setUnread((u) => (u.size ? new Set() : u));
  };
  const topicKey = topics.map((x) => x.title).join("|");
  useEffect(() => { const t = setTimeout(trackTopic, 80); return () => clearTimeout(t); }, [msgs.length, state, topicKey]); // a live answer can rename its topic after you ask
  const pickChat = (id) => { stick.current = true; setChat(id); setCont(null); requestAnimationFrame(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }); focusInput(); };
  const newChat = () => { setChat("__new"); setCont(null); setQuote(null); setHeld(null); focusInput(); };
  const pickTopic = (title) => {
    const tm = [...msgsRef.current].reverse().find((m) => m.topic === title && m.chat);
    if (tm && tm.chat !== shown) { setChat(tm.chat); setTimeout(() => pickTopic(title), 60); return; }
    const el = listRef.current; if (!el) return;
    const hs = [...el.querySelectorAll(".ch-topic")].filter((h) => h.dataset.topic === title), h = hs[hs.length - 1];
    if (h) { stick.current = false; el.scrollTo({ top: el.scrollTop + h.getBoundingClientRect().top - el.getBoundingClientRect().top - 12, behavior: "smooth" }); h.classList.remove("is-flash"); void h.offsetWidth; h.classList.add("is-flash"); }
    setUnread((u) => { if (!u.has(title)) return u; const n = new Set(u); n.delete(title); return n; });
    const latest = [...msgs].reverse().find((m) => m.role === "user" && vis(m));
    setCont(latest && latest.topic === title ? null : title);
    focusInput();
  };
  // Watching → Open in chat: the chat comes back on that topic's latest update (an update North posted while you were away lands in the thread first)
  const SEED_UPD = {
    "Felix ARR": { steps: [], update: "Initech added Felix", when: "this morning", text: "Initech added Felix this morning (+$94K). Felix ARR is $12.99M, $70K from October's $13.06M target, and up from $5.1M in May.",
      card: FELIX_PACE },
    "Expansion win rate": { steps: [], update: "Two sponsored deals closed", when: "yesterday", text: "Two expansion deals with an exec sponsor closed yesterday, taking the win rate from 29.8% to 31.9%.\n\nIt's still about half the 60% goal. The losses are deals over $50K with no sponsor on our side, which is Heather's lever.", card: ANSWERS.winrate.card },
    "Total ARR trend": { steps: [], update: "October passed $35.7M", when: "this morning", text: "October has added $1.60M so far, second only to September's +$2.09M. At this rate the year ends at $38.94M, $1.09M short of the $40.03M plan.", card: ANSWERS.arr.card },
    "NRR dip in SMB": { steps: [], update: "Hooli renewed early", when: "yesterday", card: { kind: "viz", viz: "ruler", title: "SMB renewals touched this month", sub: "Jordan's 29 renewals due by Dec 31, against the 60% goal",
      ruler: { you: 38, target: 60, lo: 0, hi: 100, ticks: [0, 25, 50, 75, 100], pre: "", suf: "%", dec: 0, label: "SMB renewals touched against the 60% goal" } }, text: "Hooli renewed on Thursday, a month early and at the same seat count. Three of the four quiet accounts still haven't been contacted, and Brightline renews Nov 14.", follow: ["Draft a note to Jordan about the other three", "Who renews next?"] } };
  // Open in chat from Watching: North catches you up — what changed since you last looked (with the chart when there is one), or that nothing has
  const goWatch = (tp, mode) => { if (watchInfo[tp] && watchInfo[tp].job) { openJob(watchInfo[tp].job); return; } { const m = [...msgsRef.current].reverse().find((x) => x.topic === tp && x.chat); setChat(m ? m.chat : "__new"); }
    if (mode) open({ mode }); // from Home's briefing: the catch-up takes the whole screen
    else if (!isOpen(stRef.current)) open({ mode: ctxMode() });
    const ms = msgsRef.current, last = ms[ms.length - 1];
    if (!(last && last.catchup === tp)) {
      const upd = [...ms].reverse().find((x) => x.topic === tp && x.proactive && !x.catchup), u = (upd && upd.answer) || SEED_UPD[tp], info = watchInfo[tp] || {}, d = watchDetail(tp);
      const card = u ? u.card || (tp === "NRR dip in SMB" ? ANSWERS.nrr.card : null) : null;
      const shownCard = card && ms.some((x) => x.answer && x.answer.card === card && !x.catchup) && false;
      const text = u
        ? `${u.text}\n\n${d.now && !u.text.includes(d.now) ? `${d.label} is at ${d.now} now. ` : ""}Nothing else on this has moved since${info.since && info.since !== "Today" ? ` ${info.since}` : " you started watching"}.`
        : `No change since ${info.since && info.since !== "Today" ? info.since : "you started watching"}. ${d.text || ""}`.trim();
      setMsgs((m0) => [...m0.map((x) => ({ ...x, last: false })), { id: "c" + Date.now().toString(36), role: "north", topic: tp, proactive: true, catchup: tp, fresh: true, last: true,
        answer: { steps: ["Checking what changed"], update: u ? "What changed" : "No change", when: u ? (u.when || "today") : `since ${info.since || "today"}`, text, card: shownCard ? null : card, key: card ? keyOf(card) || "x" : "x" } }]);
      setUnread((s0) => { if (!s0.has(tp)) return s0; const n = new Set(s0); n.delete(tp); return n; });
    }
    // follow the catch-up as it writes (and its chart lands), like any new answer. No "Continuing" strip: the topic is
    // already the live end of the thread, so the next question carries on in it by itself
    setReserve(0); stick.current = true; setCont(null);
  };
  // a pinned answer on Home opens back into its thread (or asks it again if that thread isn't in this session)
  const topicRef = useRef(null);
  topicRef.current = ({ title, q }) => {
    const known = msgs.some((m) => m.topic === title);
    openCtx();
    setTimeout(() => (known ? pickTopic(title) : send(q, null)), 160);
  };
  useEffect(() => { const on = (e) => topicRef.current && topicRef.current(e.detail); window.addEventListener("north:topic", on); return () => window.removeEventListener("north:topic", on); }, []);
  const suggestions = SEAT_SUGS[who] ? SEAT_SUGS[who][pageName] || SEAT_SUGS[who]._ : pageName === "Agents" ? ["What’s Caleb doing?", "If Outbound drops below 30% of pace, have Riley check the pipeline", "What is Orin working on?"] : pageName === "Company health" ? ["Why is Outbound behind?", "Path to $40M", "Which lanes are behind?"] : ["Path to $40M", "Why is Outbound behind?", "What changed this week?"];
  const isBar = state === "bar";
  const sv = { h: { opacity: 0, y: 6, filter: "blur(3px)" }, s: { opacity: 1, y: 0, filter: "blur(0px)" } };
  // a new chat opens in the middle of the window, with what's moving right now underneath (not pills: live lines)
  const isNew = shown === "__none__" && !isBar;
  newRef.current = isNew;
  const [texOn, setTexOn] = useState(false); // the new-chat texture starts only once the window has landed (it's heavy to build)
  useEffect(() => { if (!(isNew && state === "full")) { setTexOn(false); return; } const t = setTimeout(() => setTexOn(true), 260); return () => clearTimeout(t); }, [isNew, state]);
  const [phI, setPhI] = useState(0);
  useEffect(() => { if (!isNew && !isBar) return; setPhI(0); const t = setInterval(() => setPhI((i) => i + 1), 3200); return () => clearInterval(t); }, [isNew, isBar]);
  const newRows = (() => { if (!isNew) return []; const A = window.__northAgents, js0 = A?.jobs ? A.jobs() : [], js = seatOf(who) ? js0.filter((j) => j.mine) : js0, need = js.filter((j) => j.st === "need");
    const out = [];
    // Sam's seat counts what Home counts (people asking you included), so the number here and on Ask North always agree
    const homeN = who === "sam" ? talk.get().need : null, nN = homeN ? homeN.length : need.length;
    if (nN) out.push({ k: "need", t: "Waiting on you", lines: [`${nN} ${nN === 1 ? "decision" : "decisions"} to make`, homeN ? homeN[0].t : need[0].t], ask: "What do I need to do?", mark: "need" });
    Object.entries(watchInfo).filter(([, v]) => v.on).slice(0, 3).forEach(([tp, v]) => { const d = watchDetail(tp);
      out.push({ k: tp, t: tp, dir: (d.chg || (v.d && v.d.chg) || {}).dir, lines: [d.now ? `${d.now}${d.label && !tp.toLowerCase().includes(d.label.toLowerCase()) ? ` · ${d.label}` : ""}` : v.last || "No change yet", (v.last || "").replace(/^[^·]*·\s*/, "") || d.text].filter(Boolean), vals: d.vals, watch: tp, unread: unread.has(tp) }); });
    const busy = AGENT_IDS.map((id) => [id, js.filter((j) => j.ag === id && j.st === "run").sort((a, b) => b.prog - a.prog)]).sort((a, b) => b[1].length - a[1].length)[0];
    if (busy && busy[1].length) out.push({ k: "busy", t: `@${AGENTS[busy[0]].n}`, lines: [`${busy[1].length} ${busy[1].length === 1 ? "job" : "jobs"} running`, busy[1][0].t], ask: `@${AGENTS[busy[0]].n} what are you working on?`, ag: busy[0] });
    return out.slice(0, 5); })();
  // K's bar: no chips, the questions live in the field as hint text; Enter on an empty field asks the one showing
  const barQ = [null, ...suggestions], barPick = barQ[phI % barQ.length];
  const newPh = ["Ask North anything…", "Try “What do I need to do?”", "Try “@Riley check Outbound’s pipeline against pace”", "Try “Why is Outbound behind?”"];

  return createPortal(
    <>
      {/* the page blurs only for the first question */}
      <AnimatePresence>
        {false && isBar && !pick && (
          <motion.div key="veil" className="chat-veil" style={{ "--veil-blur": `${M.chat.blur}px` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.chat.veil)} onClick={close} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showing && (
          <motion.section key="chat" ref={shellRef} data-dochost="" data-dochost-l=".chat-list" className={`chat-shell${full ? " has-ccfull" : ""} is-${state}${isBar && bub ? ` is-bub${bubGeo(bubW.current).flip ? " is-flip" : ""}${bubGeo(bubW.current).r ? " is-r" : ""}` : ""}${state === "full" && chats.length > 0 ? " has-chats" : ""}${isNew && state === "full" ? " is-newchat" : ""}${voice ? " is-voice" : ""}${pick && isBar ? " is-aside" : ""}`} role="dialog" aria-label="Ask North"
            drag={!isBar && state !== "full"} dragControls={drag} dragListener={false} dragMomentum={false} dragElastic={0} onDragEnd={onDragEnd}
            style={{ x, y, left: L, top: T, width: Wd, height: Hd, opacity: op, scale: sc, filter: blur, transformOrigin: origin, borderRadius: 16, "--glass-a": M.chat.glass, "--glass-blur": `${M.chat.glassBlur}px`, "--col": `${M.chat.fullCol}px`, "--full-a": M.chat.fullGlass, ...(state === "full" && M.chat.fullGlass >= 1 ? { backdropFilter: "none", WebkitBackdropFilter: "none" } : {}), "--tail": `${M.chat.tail}px`, "--bar-b": `${isBar && bub ? bubGeo(bubW.current).bottom : barB()}px`, ...(isBar && bub ? { "--bub-t": `${bubGeo(bubW.current).top}px`, "--tail-x": tailX } : {}) }}
            exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}>
            {!isBar && (
              <motion.header className="chat-head" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.04 }}
                onPointerDown={(e) => state !== "full" && !e.target.closest("button") && drag.start(e)} onDoubleClick={() => (state === "full" ? toDock() : state === "dock" ? toFull() : popOut())}>
                {jt && chat === jobKey(jt.id) ? <span className="ch-jt">
                  {jt.prev && jt.prev.chat && !["closed", "hidden", "bar"].includes(jt.prev.mode) && <button className="ibtn ch-jt-back" aria-label="Back to the conversation" title="Back to the conversation" onClick={leaveJob}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={NAVY} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg></button>}
                  <AgentMark id={jt.ag} size={16} /><b>{AGENTS[jt.ag].n}</b><span>{jt.t}</span></span> : (() => {
                    // talking with people: the window says who, before the first message too (the names already in the field)
                    const live = chat && chat !== "__new" ? pplOf(chat) : peopleIn(val), ppl = live.filter((k) => k !== "sam" && PEOPLE[k]);
                    return ppl.length ? <span className="ch-ppl"><Stack ids={ppl} size={16} face={(w, sz) => <PFace id={w} size={sz} />} /><b>{andList(ppl.map((k) => PEOPLE[k].n))}</b></span> : <b>North</b>; })()}
                {(crew[chat] || []).length > 0 && <span className="ch-crew" title={`In this conversation: ${crew[chat].map((x) => AGENTS[x].n).join(", ")}`}>{crew[chat].map((x, i) => <span key={x} style={{ zIndex: 9 - i }}><AgentMark id={x} size={16} /></span>)}</span>}
                <span className="chat-spacer" />
                {/* everything you're watching: check it, switch any of it off or back on */}
                {state === "full" && (<div className="wl-wrap" onPointerEnter={() => { clearTimeout(headT.current); if (performance.now() - fullAt.current > 700) setWatchOpen(true); }} onPointerMove={() => { if (!watchOpen && performance.now() - fullAt.current > 700) { clearTimeout(headT.current); setWatchOpen(true); } }} onPointerLeave={() => { headT.current = setTimeout(() => setWatchOpen(false), 140); }}>
                  <button className={`ibtn wl-btn${watchOpen ? " is-on" : ""}`} aria-label="Watching" aria-expanded={watchOpen} onClick={() => setWatchOpen(true)}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={NAVY} strokeWidth="1.25" strokeLinejoin="round"><circle cx="4.6" cy="10.6" r="2.6" /><circle cx="11.4" cy="10.6" r="2.6" /><path d="M7.2 10.2h1.6" fill="none" strokeLinecap="round" /><path d="M2.1 9.7 3.5 4.6a1.4 1.4 0 0 1 1.35-1.05h.35c.62 0 1.1.5 1.1 1.1V8.4" fill="none" strokeLinecap="round" /><path d="M13.9 9.7 12.5 4.6a1.4 1.4 0 0 0-1.35-1.05h-.35c-.62 0-1.1.5-1.1 1.1V8.4" fill="none" strokeLinecap="round" /></svg>
                    {(() => { const k = watchItems.current.filter((x) => !wSeen.has(x.tp + "|" + x.when)).length; return k > 0 ? <em>{k}</em> : null; })()}
                  </button>
                  <AnimatePresence>
                    {watchOpen && <WatchList key="wl" info={watchInfo} M={M} unread={unread} detail={watchDetail} onToggle={toggleWatch} onClose={() => setWatchOpen(false)}
                      onOpen={(tp) => { setWatchOpen(false); goWatch(tp); }} />}
                  </AnimatePresence>
                </div>)}
                {/* move it: full screen ⇄ docked beside the page ⇄ popped out over it */}
                {jt && chat === jobKey(jt.id) && (state === "full" ? <button className="ibtn" aria-label="Exit full screen" title="Exit full screen" onClick={toggleFull}><ModeIcon k="float" /></button>
                  : <button className="ibtn" aria-label="Full screen" title="Full screen" onClick={toggleFull}><ModeIcon k="full" /></button>)}
                {!(jt && chat === jobKey(jt.id)) && state !== "full" && <button className="ibtn" aria-label="Full screen" title="Full screen" onClick={toFull}><ModeIcon k="full" /></button>}
                {!(jt && chat === jobKey(jt.id)) && state !== "dock" && <button className="ibtn" aria-label="Dock beside the page" title="Dock beside the page" onClick={toDock}><ModeIcon k="dock" /></button>}
                {!(jt && chat === jobKey(jt.id)) && state === "dock" && <button className="ibtn" aria-label="Pop out" title="Pop out over the page" onClick={popOut}><ModeIcon k="float" /></button>}
                <button className="ibtn" aria-label="Hide chat" title="Close" onClick={closeAll}><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={NAVY} strokeWidth="1.25" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
              </motion.header>
            )}

            {!isBar && (
              <div className="chat-list" data-note="follows new content until you scroll up; growth or resizing never unpins it" ref={listRef} onScroll={(e) => { const el = e.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) stick.current = true; trackTopic(); }}
                onWheel={(e) => { if (e.deltaY < 0) stick.current = false; }} onTouchMove={() => { stick.current = false; }}
                onKeyDown={(e) => { if (["PageUp", "ArrowUp", "Home"].includes(e.key)) stick.current = false; }}
                onPointerDown={(e) => { if (e.target === e.currentTarget) stick.current = false; }}>
                {shownN === 0 && !isNew && !voice && !val.trim() && (
                  <motion.div className="chat-empty" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}>
                    <motion.h3 variants={sv}>What do you want to know?</motion.h3>
                  </motion.div>
                )}
                {roomNow && ROOMS[roomNow] && <div className="fx-rel ch-about"><button type="button" onClick={(e) => showFile(`acct-${roomNow}`, e.currentTarget, { host: shellRef.current })}>
                  <span>About</span><b>{ROOMS[roomNow].deal.n}</b><em>{ROOMS[roomNow].score ? `Likely to close ${ROOMS[roomNow].score.now} of 100 · signs by ${ROOMS[roomNow].deal.close}` : `Signs by ${ROOMS[roomNow].deal.close}`}</em></button></div>}
                {msgs.map((m, i) => !vis(m) ? null : m.role === "user" ? (
                  <React.Fragment key={m.id}>
                  {startsTopic(i) && (
                    <div className={`ch-topic${i === lastHdr ? " is-cur" : ""}`} data-topic={m.topic} data-day={m.day}>
                      <b>{m.topic}</b><span>{m.day}{isReopen(i) ? " · picked up again" : ""}</span>{watched.has(m.topic) && <em className="ch-topic-w">Watching</em>}
                    </div>
                  )}
                  {m.carry && (() => { const k = Math.min(1, CARRY_MAX / m.carry.w), live = m.carry.live && CARRY.render ? CARRY.render(m.carry.id) : null; return (
                    <div className="ch-carry-row">{live
                      ? <div className="ch-carry is-live" data-carry={m.id}>{live}</div>
                      : <div className="ch-carry" data-carry={m.id} inert="" style={{ width: m.carry.w * k, height: m.carry.h * k, borderRadius: m.carry.rad }}>
                        <div className="ch-carry-in" style={{ width: m.carry.w, height: m.carry.h, transform: `scale(${k})` }} dangerouslySetInnerHTML={{ __html: m.carry.html }} /></div>}</div>); })()}
                  <motion.div className="ch-msg ch-user" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={toMotion(M.chat.swap)}>
                    {/* what the question was about rides inside the bubble as one quiet line; hovering it lights that chart again */}
                    <span className={`ch-bubble${m.quote ? " has-ref" : ""}`}>
                      {m.quote && (
                        <span className={`ch-ref is-${m.quote.k}`} onPointerEnter={() => { const el = findChart(m.quote); el && setPeek({ id: aimId(el), el, k: m.quote.k }); }} onPointerLeave={() => setPeek(null)}>
                          <CtxIcon k={m.quote.k} /><span>{m.quote.k === "text" ? `“${m.quote.t}”` : m.quote.title ? `${m.quote.title}${m.quote.point ? ` · ${m.quote.point}` : ""}` : m.quote.t}</span>
                        </span>
                      )}
                      {m.text}
                    </span>
                    {m.file && <FileCard f={m.file} />}
                  </motion.div>
                  </React.Fragment>
                ) : (
                  <React.Fragment key={m.id}>
                  {m.proactive && (
                    <div className="ch-topic is-update" data-topic={m.topic}>
                      <b>{m.topic}</b><span>Watching · update</span>
                    </div>
                  )}
                  {m.work ? (window.__northAgents && window.__northAgents.JobWork ? <div className="ch-msg ch-work"><window.__northAgents.JobWork id={m.work} />
                    {/* the same tray every answer has: copy, share, take it to Google Chat, watch this work */}
                    <AgentActs m={m} M={M} toast={toast} onContinue={() => startGc(m.id)} gcOn={msgs.some((x) => x.kind === "gchat" && x.gc.step === "compose" && !x.gc.summary && x.for === m.id)}
                      watching={(() => { const w = window.__northAgents.watchOf && window.__northAgents.watchOf(m.work); return !!(w && watchInfo[w.t] && watchInfo[w.t].on); })()}
                      onWatch={() => dispatchEvent(new CustomEvent("north:watch-job", { detail: { id: m.work } }))} /></div> : null) : m.role === "person" ? <PersonMsg m={m} M={M} /> : m.role === "pjoin" ? <PJoin m={m} M={M} /> : m.role === "agent" ? <AgentMsg m={m} M={M} onDecide={(j, yes) => decide(m, j, yes)} onShare={(d, k, l) => shareD(m, d, k, l)}
                    onNext={(yes) => { setMsgs((x) => x.map((mm) => (mm.id === m.id ? { ...mm, nextDone: yes ? "yes" : "no" } : mm))); if (m.sug) teamAccept(m, yes); else if (yes && m.next.q) send(m.next.q, null); }}
                    extra={m.hello ? null : m.routine ? <RoutineCard id={m.routine} /> : m.brief ? <TeamBrief b={m.brief} /> : m.card ? <HudCard m={m} M={M} wide={state === "full"} isFull={!!full && full.id === m.id} onFull={openFull}
                      onAct={(t) => { const done = t.job ? `${t.job.act || "Approved"} · ${AGENTS[m.agent].n} has it` : "On it";
                        setMsgs((x) => x.map((mm) => (mm.id === m.id ? { ...mm, card: { ...mm.card, tray: { ...mm.card.tray, done } }, answer: mm.answer && { ...mm.answer, card: { ...mm.card, tray: { ...mm.card.tray, done } } } } : mm)));
                        if (t.job) decide(m, t.job, true); else if (t.share) toast("Shared with Heather and Caleb"); else if (t.q) send(t.q, null, true); }} /> : null}
                    acts={m.update || m.deliv || m.chit ? null : <AgentActs m={m} M={M} toast={toast} watching={!!agWatch[m.id]} onWatch={m.na && !m.update && (m.jobs || []).some((j) => j.st !== "done") ? () => toggleAgWatch(m) : null} onContinue={() => startGc(m.id)} gcOn={msgs.some((x) => x.kind === "gchat" && x.gc.step === "compose" && !x.gc.summary && x.for === m.id)} />}
                    after={m.na && !m.update && i === lastVis && !m.brought && !(jt && chat === jobKey(jt.id)) ? (() => { const nx = nextLane(m); return nx && !(m.hud && m.hud.includes(nx[0])) ? <AgentSuggest key="sug" id={nx[0]} why={nx[1]} M={M} onBring={() => bringNa(m, nx[0])} /> : null; })() : null} /> : m.role === "agent-join" ? <AgentJoin ids={m.ids} topic={m.topic} M={M} joined={!!m.joined} again={!!m.again} /> : m.role === "huddle" ? <Huddle m={m} M={M} /> : m.kind === "gchat" ? (
                    <GcHandoff m={m} M={M} update={updGc} toast={toast} onPreview={() => setGcPrev(m.id)} />
                  ) : (
                  <Answer m={m} M={M} toast={toast} onContinue={m.answer && !m.answer.pinned ? () => startGc(m.id) : null}
                    onSummarize={m.topic && msgs.filter((x) => x.role === "north" && x.answer && !x.answer.noSum && x.topic === m.topic).length > 1 ? () => startGcSection(m.topic) : null} gcOn={msgs.some((x) => x.kind === "gchat" && x.gc.step === "compose" && !x.gc.summary && x.for === m.id)} typing={!!val.trim()} onFollow={(f) => send(f, null)} isFull={!!full && full.id === m.id} onFull={openFull}
                    wide={state === "full"} reserve={m.last && state !== "float" ? reserve : 0} onBeside={(pg) => { shift("dock"); window.dispatchEvent(new CustomEvent("north:go", { detail: pg })); }}
                    onDone={() => { setMsgs((ms) => ms.map((x2) => (x2.id === m.id ? { ...x2, finished: true } : x2)));
                      // one note at a time: Watch first; once that's learned, the Google Chat handoff on an answer that names who owns it
                      if (!m.proactive && m.topic) setTimeout(() => {
                        // spaced out: a couple of answers between offers; closing one just means you've read it
                        const n = ++obSeen.current; if (obMuted.current || (obLast.current && n - obLast.current < M.chat.obSpacing)) return;
                        if (mayHint("watch")) { setHintWatch(m.id); shownHint("watch"); obLast.current = n; return; }
                        if (mayHint("gc") && !m.answer.synth) { setHintGc({ id: m.id }); shownHint("gc"); obLast.current = n; return; }
                        // the topics rail shows itself: it opens for a moment, then folds back — nothing to read or dismiss
                        if (mayHint("topics") && msgsRef.current.filter((x) => x.role === "user" && x.day === "Today").length >= 2) { peekTopics(); obLast.current = n; }
                      }, M.chat.obWatchDelay * 1000); }}
                    hintWatch={hintWatch === m.id && !watched.has(m.topic)} hintGc={hintGc && hintGc.id === m.id ? hintGc : null}
                    onHintOff={() => { if (hintWatch === m.id) { setHintWatch(null); learn("watch"); } else { setHintGc(null); learn("gc"); } }}
                    onAct={(t) => (t.share ? toast("Shared with Heather and Caleb") : t.q && send(t.q, null))}
                    watching={watched.has(m.topic)} onWatch={m.topic && !msgs.slice(i + 1).some((x) => x.role === "north" && x.kind !== "gchat" && x.topic === m.topic) ? () => toggleWatch(m.topic) : null}
                    // the answer crosses into someone else's lane: North offers that agent, once
                    after={m.role === "north" && m.answer && !m.answer.synth && !m.answer.pinned && m.finished && !m.brought && i === lastVis && takesFor(m.answer.key, m.topic).suggest ? (() => { const [aid, why] = takesFor(m.answer.key, m.topic).suggest;
                      return <AgentSuggest key="sug" id={aid} why={why} M={M} onBring={() => bringAgent(m.id, aid)} />; })() : null} />
                  )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {!isBar && state !== "float" && topics.length > 1 && <TopicsRail topics={topics} active={activeTopic} onPick={pickTopic} M={M} open={topicsOpen} peek={topicsPeek} setOpen={(o) => { setTopicsOpen(o); if (o) learn("topics"); }} />}
            {!isBar && state === "full" && chats.length > 0 && <ChatsRail files={[...new Map(msgs.filter((m) => m.file).map((m) => [m.file.k, m.file])).values()]} chats={chats} cur={shown} topics={topics} activeTopic={activeTopic} onPickChat={pickChat} onPickTopic={pickTopic} onNew={newChat} col={state === "full"} M={M} open={topicsOpen} peek={topicsPeek} setOpen={(o) => { setTopicsOpen(o); if (o) learn("topics"); }} />}

            <div className="chat-compose">
              <AnimatePresence initial={false}>
                {cont && !(jt && chat === jobKey(jt.id)) && (
                  <motion.div key="cont" className="chat-ctx is-cont" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={toMotion(M.chat.swap)}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h8M8 4.5 11.5 8 8 11.5" /></svg>
                    <span>Continuing · {cont}</span><button className="ibtn" aria-label="Stop continuing this topic" onClick={() => setCont(null)}>×</button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {/* in full screen, once you've asked about it the chart is in the conversation: no banner repeating it (follow-ups still stay on it) */}
                {quote && !(state === "full" && quote.used) && (
                  <motion.div key={quote.t} className={`chat-ctx is-${quote.k}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={toMotion(M.chat.swap)}>
                    <CtxIcon k={quote.k} /><span>{ctxText(quote)}</span><button className="ibtn" aria-label="Remove context" onClick={() => { setQuote(null); setHeld(null); }}>×</button>
                  </motion.div>
                )}
              </AnimatePresence>
              {isNew && state === "full" && <motion.h3 className="chat-new-h" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>What do you want to work on?</motion.h3>}
              <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
              {/* @ in the field: bring in an agent */}
              <AnimatePresence>
                {atList.length > 0 && (
                  <motion.div key="at" className="ag-pick" style={{ left: atX }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }} transition={toMotion(M.chat.swap)} onMouseDown={(e) => e.preventDefault()}>
                    {atList.map((id, i) => (
                      <button type="button" key={id} className={i === atAct ? "is-act" : ""} onMouseEnter={() => setAtAct(i)} onClick={(e) => { e.preventDefault(); pickAt(id); }}>
                        <AgentMark id={id} size={20} /><b>{AGENTS[id].n}</b><small>{AGENTS[id].role}</small>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

                <AnimatePresence mode="popLayout" initial={false}>
                  {voice ? (
                    <motion.div key="v" className="chat-voice" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      <span className="chat-wave">{Array.from({ length: 18 }, (_, i) => <motion.i key={i} animate={{ scaleY: [0.3, 1, 0.45, 0.85, 0.3] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }} />)}</span>
                      <span className="chat-heard">{voice.words ? SPOKEN.split(" ").slice(0, voice.words).join(" ") : "Listening…"}</span>
                      <small>Release to send</small>
                    </motion.div>
                  ) : (
                    // grows with what you write (up to ~8 lines, then scrolls) · Enter sends · Shift+Enter for a new line
                    <motion.textarea key="t" ref={inputRef} rows={1} value={val} onChange={(e) => setVal(e.target.value)} placeholder={msgs.some((x) => x.kind === "gchat" && x.gc.step === "compose" && vis(x)) ? "Tell North who to tag, where to post, or say send…" : quote ? "Ask about this…"
                      : jt && chat === jobKey(jt.id) ? `Ask ${AGENTS[jt.ag].n} about this, or @ someone in…`
                      : isBar ? (bub ? "Ask North…" : barPick ? `Try “${barPick}”` : "Ask North anything…")
                      : isNew ? "Ask North anything, or @ a teammate…"
                      : (() => { const c = chats.find((x) => x.id === shown); return c && c.ppl.length; })() ? `Message ${andList(chats.find((x) => x.id === shown).ppl.map((p) => PEOPLE[p].n))}, or @ an agent…` // people are in it: what you say goes to them (the same words as the reply field on Home)
                      : lastVis >= 0 && msgs[lastVis].role === "agent" && msgs[lastVis].deliv ? `Tell ${AGENTS[msgs[lastVis].agent].n} what to change…` // finished work just landed: a reply is feedback on it
                      : M.chat.obOn && !ob.learned.includes("at") && msgs.some((x) => x.role === "north" && x.fresh && x.finished && !x.proactive) ? "Type @ to bring in an agent…" : "Ask North anything…"} aria-label="Ask North"
                      onKeyDown={(e) => {
                        if (atList.length) {
                          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setAtAct((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + atList.length) % atList.length); return; }
                          if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickAt(atList[atAct] || atList[0]); return; }
                          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setVal((v) => v + " "); return; }
                        }
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (isBar && !bub && !val.trim() && barPick) send(barPick, null); else send(); }
                      }}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} />
                  )}
                </AnimatePresence>
                <button type="button" className="ibtn chat-tool" aria-label="Attach" title="Attach a file" onClick={() => toast("Attaching files is coming — for now, point at a chart with the target")}>
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="9.25" y="3" width="1.5" height="14" rx=".75" fill={NAVY} /><rect x="3" y="9.25" width="14" height="1.5" rx=".75" fill={NAVY} /></svg>
                </button>
                {/* point at anything on the page — a chart, a bar, a tile — and it rides along as context (or hold ⌥) */}
                <button type="button" className={`ibtn chat-tool chat-aim${pick ? " is-on" : ""}`} aria-pressed={!!pick} aria-label="Point at a chart" title="Point at a chart or a bar (or hold ⌥)" style={{ "--ar-spin": `${M.chat.aimSpin}s` }} onClick={togglePick}>
                  <TargetIcon on={!!pick} />
                </button>
                <motion.button type={val || quote ? "submit" : "button"} className="voice chat-send" aria-label={val || quote ? "Send" : "Talk to North"} whileTap={{ scale: 0.92 }}
                  onClick={(e) => { if (!val && !quote) { e.preventDefault(); voiceBus.on() ? endVoice() : startVoice(); } }}>
                  {val || quote ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3M4 7l4-4 4 4" /></svg>
                    : <span className="bars">{[5, 9, 13, 9, 5].map((h, i) => <i key={i} style={{ height: h }} />)}</span>}
                </motion.button>
              </form>
              {/* stays put while you type, so the field never moves */}
              {isNew && (
                <motion.div className="chat-moving" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}>
                  {newRows.map((r) => (
                    <motion.button key={r.k} className={`cm-r${r.unread ? " is-new" : ""}`} variants={sv} onClick={() => (r.watch ? goWatch(r.watch) : send(r.ask, null))}>
                      <span className="cm-t">{r.ag ? <Orb id={r.ag} size={14} /> : <CmIcon k={r.mark ? "need" : r.dir || "flat"} />}<b>{r.t}</b></span>
                      <span className="cm-l"><span>{r.lines[0]}</span></span>
                      {r.vals ? <Spark vals={r.vals} /> : <span className="cm-sp" />}
                    </motion.button>))}
                  <motion.span className="cm-k" variants={sv}>Type <kbd>@</kbd> to bring in Orin, Riley or Calvin</motion.span>
                </motion.div>
              )}
              {isBar && !val.trim() && (
                <motion.div className="chat-sugs" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}>
                  {suggestions.map((s2) => <motion.button key={s2} variants={sv} onClick={() => send(s2, null)}>{s2}</motion.button>)}
                  <motion.span className="chat-tip" variants={sv}>Tap the target (or hold <kbd>⌥</kbd>) and click any chart to ask about it</motion.span>
                </motion.div>
              )}
            </div>

            {isNew && state === "full" && <div className="chat-newfill" />}
            {/* the new chat sits on the same woven texture as Home's header: the agents' work as dots, words under your cursor */}
            {/* the glow is part of the surface (cheap: three gradients), there from the first frame; the dot field is heavy, so it follows */}
            <AnimatePresence>{isNew && state === "full" && <motion.div key="glow" className="nw-tex" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}><ChatGlow /></motion.div>}</AnimatePresence>
            <AnimatePresence>{isNew && state === "full" && texOn && <motion.div key="tex" className="nw-tex" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}><HomeWork scope=".chat-shell" keep={[".chat-new-h", ".chat-input", ".cm-r", ".cm-k"]} dials="Chat · new chat texture" calm pools={false} onAsk={(q) => send(q, null)} /></motion.div>}</AnimatePresence>
            {state === "float" && ["n", "e", "s", "w", "ne", "nw", "se", "sw"].map((ed) => <div key={ed} className={`chat-fr is-${ed}`} onPointerDown={startFloatResize(ed)} onDoubleClick={() => { floatBox.current = null; place("float", false); }} title="Drag to resize · double-click to reset" />)}
            {state === "dock" && <div className="chat-resize" onPointerDown={startResize} onDoubleClick={() => { setDockW(M.chat.dockW); animate(Wd, M.chat.dockW, toMotion(M.chat.open)); }} title="Drag to resize · double-click to reset" />}
            <AnimatePresence>{toastMsg && <motion.div key={toastMsg} className="chat-toast" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={toMotion(M.chat.swap)}>✓ {toastMsg}</motion.div>}</AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>

      {/* prototype: see a job land. Starts one of your jobs; it finishes a few seconds later, wherever you are */}
      {pageName === "Home" && state !== "full" && <button className="demo-land" onClick={() => { window.__northAgents?.demoLand(); toast("Started a job · it lands in a few seconds"); }}>Demo · a job lands</button>}
      {pageName === "Home" && state !== "full" && <button className="demo-land demo-voice" onClick={() => voiceBus.demo(demoFor())}>Demo · voice</button>}
      {/* North noticed a pattern (the same notes on three deck reviews) and offers to take the first pass from now on */}
      {pageName === "Home" && state !== "full" && getWho() === "sam" && <button className="demo-land demo-routine" onClick={() => {
        // the offer comes where the pattern just happened: the webinar conversation, under the note Sam keeps giving. It's
        // only for Sam (like a private note in a shared channel); nothing the card does is posted to the others until he says so
        const id = "t-web"; proposeDeckReview();
        dispatchEvent(new CustomEvent("north:open-thread", { detail: { id } }));
        if (!msgs.some((x) => x.routine === "deckreview")) later(650, () => { postTo(id, { role: "agent", agent: "north", chit: true, routine: "deckreview",
          text: "Only you can see this. That’s the third deck you’ve sent back with the same note, so here’s an offer." });
          // and it waits on Home like anything else that needs you: one row, private, until you approve it or say not this
          talk.addPiece({ k: "rt-deckreview", from: id, via: "Q1 webinar for brokerages", t: "Review decks before they reach you", ag: "north", zone: "need", pr: 1, act: "Look at it", rt: true, stTxt: "Only you see this",
            line: "Only you see this. It would give your usual deck note before decks reach you." }); });
        // the card is taller than the view: start where North starts talking, not at the bottom of the card
        const toTop = () => { stick.current = false; const r = document.querySelector(".rt"), l = r && r.closest(".chat-list"); if (!r || !l) return;
          const msg = r.closest(".ch-msg") || r; l.scrollTo({ top: l.scrollTop + msg.getBoundingClientRect().top - l.getBoundingClientRect().top - 24 }); stick.current = false; };
        setTimeout(toTop, 1500); }}>Demo · a routine</button>}
      {/* Beyonce's: the third Monday she's asked Orin for the sync doc, so North offers to make it a routine, in the sync conversation */}
      {pageName === "Home" && state !== "full" && getWho() === "seth" && <button className="demo-land demo-routine" onClick={() => {
        const id = "t-sync"; proposeMondaySync();
        dispatchEvent(new CustomEvent("north:open-thread", { detail: { id } }));
        if (!msgs.some((x) => x.routine === "mondaysync")) later(650, () => { postTo(id, { role: "agent", agent: "north", chit: true, routine: "mondaysync",
          text: "Only you can see this. That’s the third Monday you’ve asked Orin for the sync doc, so here’s an offer." });
          talk.addPiece({ k: "rt-mondaysync", from: id, via: "Monday leadership sync", t: "Draft the Monday sync doc, every Monday", ag: "north", zone: "need", pr: 1, act: "Look at it", rt: true, stTxt: "Only you see this",
            line: "Only you see this. Orin would draft it every Monday at 7:00, before the sync." }); });
        const toTop = () => { stick.current = false; const r = document.querySelector(".rt"), l = r && r.closest(".chat-list"); if (!r || !l) return;
          const msg = r.closest(".ch-msg") || r; l.scrollTo({ top: l.scrollTop + msg.getBoundingClientRect().top - l.getBoundingClientRect().top - 24 }); stick.current = false; };
        setTimeout(toTop, 1500); }}>Demo · a routine</button>}
      {/* a job you set in motion landed (or needs you): it pushes out of the sidebar's edge beside Agents, and folds back */}
      {/* the job view lives with the Agents floor; it reaches the chat through the bridge (no import cycle) */}
      <AnimatePresence>{jobModal && window.__northAgents?.JobModal && <window.__northAgents.JobModal key={jobModal.k} ids={jobModal.ids} start={jobModal.i} from={jobModal.from} beside={!!jobModal.beside}
        onClose={() => setJobModal(null)}
        onAsk={(q, d, at, jid) => { const id = jid || jobModal.ids[jobModal.i || 0];
          const r = document.querySelector(".jm-card")?.getBoundingClientRect(); // the card becomes the window, where it is
          enterJob(id, { rect: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null }); setTimeout(() => send(q, null), 240); }} />}</AnimatePresence>
      <AnimatePresence>{jobNote && <JobNote key={jobNote.k} n={jobNote} M={M} onModal={(ids, i, from) => { seen(ids); endNote(true); setJobModal({ ids, i, from, k: Date.now() }); }} onClose={() => endNote(true)} onAway={() => endNote(false)}
        onHold={() => { clearTimeout(noteT.current); setJobNote((n) => (n && !n.opened ? { ...n, opened: true } : n)); }} onLetGo={() => { noteT.current = setTimeout(() => endNote(false), jobNote && jobNote.hover ? 500 : 2500); }} />}</AnimatePresence>
      {/* a confirmation for something done from the bubble after it stepped aside (a pin by name) */}
      <AnimatePresence>{toastMsg && !showing && <motion.div key={"p" + toastMsg} className="chat-toast is-page" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={toMotion(M.chat.swap)}>✓ {toastMsg}</motion.div>}</AnimatePresence>
      {/* Watching, from the sidebar: same list, beside the row, on any page */}
      <AnimatePresence>
        {watchFly && <WatchList key="wlf" fly={watchFly} info={watchInfo} M={M} unread={unread} detail={watchDetail} onToggle={toggleWatch} onClose={() => setWatchFly(null)}
          onEnter={() => clearTimeout(flyT.current)} onLeave={() => { flyT.current = setTimeout(() => setWatchFly(null), 140); }}
          onOpen={(tp) => { setWatchFly(null); goWatch(tp); }} />}
      </AnimatePresence>
      <OrbDefs />
      {/* prototype: #orbs shows the three orbs large, for review */}
      {typeof location !== "undefined" && location.hash === "#orbs" && (
        <div id="spec" style={{ position: "fixed", left: 40, top: 40, zIndex: 999, display: "flex", gap: 48, padding: 36, background: "#fff", borderRadius: 14 }}>
          {AGENT_IDS.map((id) => <Orb key={id} id={id} size={180} />)}
          <Orb id="calvin" size={180} live />
        </div>
      )}
      {/* the Google Chat side of a handoff (prototype preview), opened from its link */}
      <AnimatePresence>
        {gcPrev && msgs.find((x) => x.id === gcPrev) && (() => { const g = msgs.find((x) => x.id === gcPrev).gc;
          const srcId = msgs.find((x) => x.id === gcPrev).for;
          return <GcPreview key="gcp" g={g} M={M} onClose={() => setGcPrev(null)} snapshot={g.card ? <Card c={g.card} p={1} onAct={() => {}} /> : null}
            onOpen={() => { setGcPrev(null); openFromLink(srcId); }} />; })()}
      </AnimatePresence>

      {/* a chat card opened full screen */}
      <AnimatePresence>
        {full && msgs.find((m) => m.id === full.id) && (
          <FullCard key={full.id} m={msgs.find((m) => m.id === full.id)} from={full.from} flat={full.flat} M={M} onClose={closeFull} onAct={(t) => (t.share ? toast("Shared with Heather and Caleb") : t.q && send(t.q, null))} />
        )}
      </AnimatePresence>

      {/* point at a chart: a ring on the chart, a dot on the point, and what will be added */}
      <AnimatePresence>
        {/* the chart you picked keeps its glass edge until you take the context off or end the conversation */}
        {held && isOpen(state) && state !== "full" && <GlassRing key={`held-${held.id}`} k={held.k} el={held.el} M={M} onGone={() => setHeld(null)} />}
        {peek && !(held && held.id === peek.id) && isOpen(state) && state !== "full" && <GlassRing key={`peek-${peek.id}`} k={peek.k} el={peek.el} M={M} onGone={() => setPeek(null)} />}
        {/* pointing: the chart under the cursor. Moving to another chart fades this one off in place and the next one on — it never slides */}
        {nudge && !pick && !(held && held.id === nudge.id) && <GlassRing key={`aim-${nudge.id}`} k="hint" el={nudge.el} M={M} onGone={() => setNudge(null)} />}
        {pick && aim && !(held && held.id === aim.id) && (() => { const cx = aim.r.l + aim.r.w / 2, cy = aim.r.t + aim.r.h / 2;
          return <GlassRing key={`aim-${aim.id}`} k={aim.k} r={aim.r} ang={(Math.atan2(aim.y - cy, aim.x - cx) * 180) / Math.PI + 90} M={M} />; })()}
      </AnimatePresence>
      <AnimatePresence>
        {nudge && !pick && (
          <motion.div key={`nudge-${nudge.id}`} ref={nudgeLbl} className="chat-aim-label is-nudge" style={{ left: nudge.x, top: nudge.y }}
            initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }} transition={{ duration: M.chat.aimIn + 0.08, ease: [0.16, 1, 0.3, 1] }}>
            <kbd className="ob-key">⌥</kbd>Hold to ask North about this<em>{nudge.title}</em>
          </motion.div>
        )}
      </AnimatePresence>
      {pick && aim && (
        <div className="chat-aim-label" style={{ left: aim.x, top: aim.y }}>
          <i />{aim.k === "point" ? "Ask about this point" : "Ask about this chart"}<em>{aim.label}</em>
        </div>
      )}
      <AnimatePresence>
        {pick && (
          <motion.div key="pickbar" className="chat-pickbar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={toMotion(M.chat.swap)}>
            <TargetIcon on /> {pick === "btn" && M.chat.obOn && !ob.learned.includes("alt") && !ob.learned.includes("btn") ? <>Click a chart to ask North about it<span className="ob-next">Next time, just hold <kbd>⌥</kbd></span></> : <>Click a chart, or one bar or point, to ask North about it <kbd>esc</kbd></>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* highlight-to-ask */}
      <AnimatePresence>
        {sel && state !== "full" && !pick && ( // chat open beside the page too: you can still lift words from the page into it
          <motion.button key="sel" className="sel-ask" style={{ left: sel.x, top: sel.y }} onMouseDown={(e) => e.preventDefault()}
            onClick={() => { learn("text"); openCtx({ quote: { k: "text", t: sel.text } }); setSel(null); window.getSelection()?.removeAllRanges(); }}
            initial={{ opacity: 0, y: 6, scale: 0.9, x: "-50%" }} animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }} exit={{ opacity: 0, y: 4, scale: 0.95, x: "-50%", transition: { duration: 0.12 } }} transition={toMotion(M.chat.swap)}>
            <NorthLogo ask light size={16} /> Ask North about this <kbd>⌘K</kbd>
          </motion.button>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
