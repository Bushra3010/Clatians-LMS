/** Share with the phone's share sheet, or copy the text when there is none. Browser-only. */
export async function shareText(title: string, text: string): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ title, text }); return "shared"; }
    await navigator.clipboard.writeText(`${title}\n${text}`);
    return "copied";
  } catch {
    return "cancelled";
  }
}
