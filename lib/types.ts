export type Mass = { id: string; name: string; date: string; occasion: string; notes: string | null };

export type MassSong = {
  id: string; mass_id: string; part: string; song: string | null; beat_folder: string | null;
  page: string | null; slot: number | null; tempo: number | null; scale: string | null;
  notes: string | null; practiced: boolean; sort_order: number | null;
};

export type Lyric = { id: string; title: string; lyrics: string; categories: string[] };
