import { NextResponse } from "next/server";
import { tokenSchema } from "@/lib/validation";
import { verifyTokenAndListRepos } from "@/lib/github";
import { getTokenFromRequest, safeLogError, isRateLimited, getClientIp, isTrustedOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }

  const ip = getClientIp(req);
  if (isRateLimited(`repos:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 });
  }

  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Header token tidak ditemukan." }, { status: 401 });
  }

  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) {
    return NextResponse.json({ error: "Format token tidak valid." }, { status: 400 });
  }

  try {
    const result = await verifyTokenAndListRepos(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    safeLogError("api/repos", err);
    const status = (err as { status?: number }).status;
    if (status === 401) {
      return NextResponse.json({ error: "Token GitHub tidak valid atau sudah kedaluwarsa." }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal mengambil daftar repository." }, { status: 502 });
  }
  // Catatan: variabel `token` hanya ada dalam scope function ini dan tidak
  // pernah disimpan ke variabel global, database, atau file.
}
