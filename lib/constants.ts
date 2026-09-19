export const MASS_PARTS = [
  "Entrance", "Lord Have Mercy", "Glory", "Psalm", "Acclamation", "Offertory",
  "Holy", "Proclamation", "Peace / Lamb of God", "Communion 1", "Communion 2", "Recessional",
];

export const WEDDING_PARTS = [
  "Entrance", "Lord Have Mercy", "Glory", "Psalm", "Acclamation", "Nuptial Song", "Offertory",
  "Holy", "Proclamation", "Peace / Lamb of God", "Communion 1", "Communion 2", "Recessional",
];

export const OCCASIONS = [
  "Ordinary Sunday", "Lenten Sunday", "Easter Sunday", "Advent Sunday", "Christmas",
  "Holy Week", "Feast", "Wedding Mass", "Custom",
];

export const BEAT_FOLDERS = [
  "Ballad", "Ballroom", "Country", "Dance", "Entertainer", "Latin",
  "Movie & Show", "Pop & Rock", "R&B", "Sing & Jazz", "World",
];

export const PAGES = ["P1", "P2", "P3", "P4", "P5", "P6"];
export const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type Role = "admin" | "choir_master" | "senior_member" | "member";

export const EDIT_ROLES: Role[] = ["admin", "choir_master", "senior_member"];
export const AI_ROLES: Role[] = ["admin", "choir_master"];

export const DEFAULT_PASSWORD = "stjc1234";

/** Parts for a new mass of the given occasion. */
export function partsFor(occasion: string): string[] {
  if (occasion === "Wedding Mass") return WEDDING_PARTS;
  if (occasion === "Lenten Sunday") return MASS_PARTS.filter((p) => p !== "Glory");
  return MASS_PARTS;
}
