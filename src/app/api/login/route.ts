import { cookies } from "next/headers";
import { SESSION_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!authEnabled()) {
    return Response.json({ ok: true, note: "Auth is disabled" });
  }

  const body = await request.json();
  const password = typeof body?.password === "string" ? body.password : "";

  if (!safeEqual(password, process.env.APP_PASSWORD!)) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({ ok: true });
}
