import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/supabase";
import { currentUser } from "@/lib/auth";
import { AI_ROLES } from "@/lib/constants";

export const maxDuration = 60;

// Vercel rejects request bodies over 4.5 MB, so cap the PDF just under that.
const MAX_PDF = 4 * 1024 * 1024;

type Pick = { title: string; reason: string };

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !AI_ROLES.includes(user.role)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is not set on the server" }, { status: 500 });

  const form = await req.formData();
  const massId = String(form.get("mass_id") ?? "");
  const prompt = String(form.get("prompt") ?? "").trim().slice(0, 1000);
  const file = form.get("pdf");
  if (!massId) return NextResponse.json({ error: "Pick a Mass first" }, { status: 400 });
  if (!(file instanceof File) || file.type !== "application/pdf") return NextResponse.json({ error: "Upload a PDF of the readings" }, { status: 400 });
  if (file.size > MAX_PDF) return NextResponse.json({ error: "PDF is over 4 MB. Compress it or upload just the readings pages." }, { status: 413 });

  const [{ data: mass }, { data: rows }, { data: library }] = await Promise.all([
    db.from("mass_services").select("occasion, date").eq("id", massId).maybeSingle(),
    db.from("mass_songs").select("part").eq("mass_id", massId).order("sort_order", { nullsFirst: false }),
    db.from("song_lyrics").select("title, lyrics, categories"),
  ]);
  if (!mass) return NextResponse.json({ error: "Mass not found" }, { status: 404 });

  // Proclamation is a reading, not a song
  const parts = (rows ?? []).map((r) => r.part).filter((p) => p !== "Proclamation");
  const songs = library ?? [];
  const byTitle = new Map(songs.map((s) => [s.title.trim().toLowerCase(), s.title]));

  const catalogue = songs
    .map((s) => `- ${s.title} [tags: ${(s.categories ?? []).join(", ") || "none"}] ${s.lyrics.replace(/\s+/g, " ").slice(0, 160)}`)
    .join("\n");

  const instructions = `You help the choir master of a Catholic parish choir in Chennai choose hymns for Mass.
Read the attached PDF (the readings / liturgy guide) and recommend songs ONLY from the library below.

Mass occasion: ${mass.occasion}
Mass date: ${mass.date}
Parts to fill (use these exact names as JSON keys): ${parts.join(" | ")}
${prompt ? `Extra guidance from the choir master: ${prompt}\n` : ""}
For each part recommend 2 or 3 songs. Base choices on: the themes and tone of the readings, the liturgical season, the tags on each song (a song tagged for a part fits that part), and the guidance above. Do not repeat a song across parts. Copy titles exactly as written in the library.

Return ONLY valid JSON in this shape:
{"readings_summary": "two sentences on the readings' themes", "recommendations": {"<part name>": [{"title": "...", "reason": "one sentence"}]}}

Song library:
${catalogue}`;

  let text = "";
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const pdf = Buffer.from(await file.arrayBuffer()).toString("base64");
    const primary = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-latest";
    // Busy servers (503) and rate limits (429) are usually brief: retry the main model, then try the fallback
    const attempts = [primary, primary, fallback];
    for (let i = 0; ; i++) {
      try {
        const model = genAI.getGenerativeModel({ model: attempts[i], generationConfig: { responseMimeType: "application/json", temperature: 0.4 } });
        text = (await model.generateContent([{ inlineData: { data: pdf, mimeType: "application/pdf" } }, instructions])).response.text();
        break;
      } catch (err) {
        const busy = /\b(503|429)\b|overloaded|high demand/i.test(String(err));
        if (!busy || i === attempts.length - 1) throw err;
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      }
    }
  } catch (e) {
    console.error("gemini failed", e);
    // Callers are admin/choir_master only, so the provider's message is safe to show
    const detail = e instanceof Error ? e.message.replace(/key=[^\s&]+/g, "key=***").slice(0, 300) : "";
    return NextResponse.json({ error: `The AI service failed. ${detail}`.trim() }, { status: 502 });
  }

  let parsed: { readings_summary?: string; recommendations?: Record<string, Pick[]> };
  try { parsed = JSON.parse(text); } catch { return NextResponse.json({ error: "The AI reply was not valid JSON. Try again." }, { status: 502 }); }

  // Keep only real library titles under real parts
  const result: Record<string, Pick[]> = {};
  for (const part of parts) {
    const picks = (parsed.recommendations?.[part] ?? [])
      .map((p) => ({ title: byTitle.get(String(p.title ?? "").trim().toLowerCase()) ?? "", reason: String(p.reason ?? "") }))
      .filter((p) => p.title)
      .slice(0, 3);
    if (picks.length) result[part] = picks;
  }
  const summary = String(parsed.readings_summary ?? "");

  const { data: saved, error } = await db.from("recommendations")
    .insert({ mass_id: massId, readings_summary: summary, prompt, result, created_by: user.id })
    .select("id").single();
  if (error) console.error("recommendations insert failed (run sql/recommendations.sql?)", error.message);

  return NextResponse.json({ id: saved?.id ?? null, summary, result, parts });
}
