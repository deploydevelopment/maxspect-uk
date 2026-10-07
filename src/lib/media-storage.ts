// Public URL for a file in the media-assets bucket.
// `relativePath` is the path under public/media, for example images/logo.png.

const BUCKET = "media-assets";

/** Storage keys are ASCII. Unsafe characters become `_x` plus their hex code. */
export function storageObjectPath(relativePath: string): string {
  return relativePath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) =>
      [...segment]
        .map((char) => {
          const code = char.codePointAt(0)!;
          return code < 128 ? char : `_x${code.toString(16)}_`;
        })
        .join(""),
    )
    .join("/");
}

export function storagePublicUrl(relativePath: string, baseUrl = process.env.SUPABASE_URL): string | null {
  const base = baseUrl?.replace(/\/$/, "");
  if (!base) return null;
  const clean = relativePath.replace(/^\/+/, "");
  if (!clean || clean.split("/").includes("..")) return null;
  const encoded = storageObjectPath(clean)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${BUCKET}/${encoded}`;
}
