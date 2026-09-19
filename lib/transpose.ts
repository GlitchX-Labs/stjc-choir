const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/** "G+2" -> "A", "Em-5" -> "Bm". Flat roots stay flat, sharp roots stay sharp. Unparseable input is returned as-is. */
export function transposeKey(scale?: string | null): string {
  if (!scale || !scale.trim()) return "";
  const m = scale.trim().match(/^([A-G][b#]?)(m?)(?:([+-])(\d+))?$/);
  if (!m) return scale;
  const [, base, minor, sign, n] = m;
  let idx = SHARPS.indexOf(base);
  let table = SHARPS;
  if (idx === -1) { idx = FLATS.indexOf(base); table = FLATS; }
  if (idx === -1) return scale;
  const steps = n ? parseInt(n, 10) : 0;
  const shift = sign === "-" ? -steps : steps;
  return table[(((idx + shift) % 12) + 12) % 12] + minor;
}
