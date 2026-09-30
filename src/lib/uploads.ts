import "server-only";

export type UploadResult = {
 url: string;
};

export async function uploadImage(input: {
 buffer: Buffer;
 contentType: string;
 fileName: string;
 folder?: string;
}): Promise<UploadResult> {
 // At blog-free local/default installs, images are served from /uploads via the
 // admin API. When BLOB_READ_WRITE_TOKEN is set, stream to Vercel Blob instead.
 if (process.env.BLOB_READ_WRITE_TOKEN) {
 const { put } = await import("@vercel/blob");
 const res = await put(`${input.folder ?? "products"}/${Date.now()}-${input.fileName}`, input.buffer, {
 access: "public",
 contentType: input.contentType,
 });
 return { url: res.url };
 }

 throw new Error(
 "Uploads are not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) or use the local /uploads endpoint.",
 );
}

export function isImageContentType(contentType: string): boolean {
 return [
 "image/jpeg",
 "image/png",
 "image/webp",
 "image/gif",
 "image/avif",
 "image/svg+xml",
 ].includes(contentType.toLowerCase());
}

export function maxUploadBytes(): number {
 return 8 * 1024 * 1024; // 8 MB
}