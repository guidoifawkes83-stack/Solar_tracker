import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "smt_auth";

async function tokenFor(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Buffer.from(digest).toString("hex");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");

  const expectedPassword = process.env.SITE_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json({ error: "SITE_PASSWORD not configured" }, { status: 500 });
  }

  if (password !== expectedPassword) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", next);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const res = NextResponse.redirect(new URL(next || "/", req.url), { status: 303 });
  res.cookies.set(COOKIE_NAME, await tokenFor(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
