import { NextResponse } from "next/server";

const ADMIN_CODE = String(process.env.ADMIN_MANAGE_CODE || "CXL-GG212508").toUpperCase();

export async function POST(request) {
  try {
    const body = await request.json();
    const code = String(body?.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }

    if (code !== ADMIN_CODE) {
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set({
      name: "salas_admin",
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
