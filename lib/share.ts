/** navigator.share (iOS/Android) -> clipboard API -> execCommand. Returns how it went. */
export async function shareText(text: string, title?: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try { await navigator.share({ title, text }); return "shared"; }
    catch (e) { if ((e as Error).name === "AbortError") return "shared"; }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok ? "copied" : "failed";
  }
}
