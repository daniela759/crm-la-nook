import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

/** Servește un fișier atașat (stocat în DB). Doar pentru utilizatori logați. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Neautorizat", { status: 401 });

  const { id } = await params;
  const att = await db.taskAttachment.findUnique({ where: { id } });
  if (!att || !att.data) return new Response("Negăsit", { status: 404 });

  const bytes = att.data as unknown as Uint8Array;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(att.filename)}`,
      "Content-Length": String(att.size ?? bytes.byteLength),
    },
  });
}
