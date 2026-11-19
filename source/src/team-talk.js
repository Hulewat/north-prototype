// The talk between people (and the work that falls out of it), shared by the chat, where the talk happens, and Home, where
// what needs you shows. One chat: a conversation is about one subject and anyone can be in it (North, agents, teammates).
// The chat publishes a summary of each conversation with people in it; Home reads it and opens a conversation by id.
export const PEOPLE = {
  heather: { id: "heather", n: "Heather", role: "VP Sales", col: "#744ccb" },
  jordan: { id: "jordan", n: "Jordan", role: "Customer Value", col: "#098486" },
  lisa: { id: "lisa", n: "Lisa", role: "Marketing", col: "#257985" },
  paul: { id: "paul", n: "Paul", role: "Product marketing", col: "#257985" },
  dustin: { id: "dustin", n: "Dustin", role: "Product & Eng", col: "#257985" },
  caleb: { id: "caleb", n: "Caleb", role: "Sales · Outbound", col: "#744ccb" }, // so a meeting can start a chat with him
};
export const peopleIn = (t) => [...new Set([...(t || "").matchAll(/@([a-z]+)/gi)].map((m) => m[1].toLowerCase()).filter((n) => PEOPLE[n]))];
// North's name for a conversation: what it's about, from the first thing said (the filler and the question mark left off)
export const titleOf = (t) => { let x = (t || "").replace(/@[a-z]+[,:]?/gi, "").replace(/\s+/g, " ").trim().replace(/^[,.\s-]+/, "")
  .replace(/^(thinking about|what about|can we talk about|quick one on|about|re:?)\s+/i, "").replace(/[,.]?\s*(thoughts|can we talk|any ideas|what do you think)\??$/i, "").replace(/[?.!]+$/, "").trim();
  x = x.split(/\s+/).slice(0, 6).join(" "); return x ? x[0].toUpperCase() + x.slice(1) : "New conversation"; };

const S = { threads: [], pieces: [], need: [], files: [] }, subs = new Set();
const emit = () => subs.forEach((f) => f({ ...S }));
export const talk = {
  get: () => S,
  sub: (f) => { subs.add(f); return () => subs.delete(f); },
  setThreads: (t) => { S.threads = t; emit(); },
  // what's waiting on you, as Home lists it: the chat opens on the same list
  setNeed: (n) => { S.need = n; emit(); },
  // files belong to the team they're about (a deck of Sales' deals lives in Sales); everything else points at them
  setFile: (f) => { S.files = [...S.files.filter((x) => x.k !== f.k), f]; emit(); },
  addPiece: (p) => { S.pieces = [...S.pieces.filter((x) => x.k !== p.k), p]; emit(); },
  updPiece: (k, f) => { S.pieces = S.pieces.map((x) => (x.k === k ? { ...x, ...f } : x)); emit(); },
  piece: (k) => S.pieces.find((x) => x.k === k),
  // Home asks the chat to open a conversation, or to post into one (the Brightwater hand-off happens on its piece)
  open: (id) => window.dispatchEvent(new CustomEvent("north:open-thread", { detail: { id } })),
  post: (id, m) => window.dispatchEvent(new CustomEvent("north:talk-post", { detail: { id, m } })),
};
if (typeof window !== "undefined") window.__northTalk = talk;
