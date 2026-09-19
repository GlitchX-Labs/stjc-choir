/** "2026-09-19" -> "19/09/2026" (no Date object, so no timezone slip) */
export const fmtDate = (d: string) => d.split("-").reverse().join("/");

export const todayISO = () => new Date().toISOString().slice(0, 10);
