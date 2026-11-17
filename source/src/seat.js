// whose seat the prototype is viewed from. One switch (the account menu at the foot of the sidebar) and every part of North
// reads it: Home, the Agents page, the chat. Seth is leadership and sees everything; anyone else sees their own lane's work,
// and the agents only say what that person may see.
import { useEffect, useState } from "react";

let who = "seth";
const subs = new Set();
export const getWho = () => who;
export function setSeat(id) { if (id === who) return; who = id; subs.forEach((f) => f(id)); }
export function useWho() {
  const [w, set] = useState(who);
  useEffect(() => { subs.add(set); set(who); return () => subs.delete(set); }, []);
  return w;
}
// the seats that are built out. Jordan's waits on sample figures, so Jordan still sees leadership's content.
export const SEATS = {
  sam: { n: "Sam", lanes: [2], laneName: "New Business", dept: "Sales" },
};
export const seatOf = (w = who) => SEATS[w] || null;
// what a non-leadership seat may not hear: anyone's pay. Agents drop the sentence rather than reword it.
const PRIVATE = /\b(comp|salary|salaries|pay ?roll|bonus)\b/i;
export function scrub(text, w = who) {
  if (!SEATS[w] || !text || typeof text !== "string") return text;
  return text.split(/\n\n+/).map((par) => par.split(/(?<=[.!?])\s+/).filter((s) => !PRIVATE.test(s)).join(" ")).filter((p) => p.trim()).join("\n\n");
}
