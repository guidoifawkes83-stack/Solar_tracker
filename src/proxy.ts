import { NextRequest, NextResponse } from "next/server";

// Whole-site password gate. Simple on purpose: this is a one-person tool,
// not a multi-user product, so a single shared passcode (checked against
// SITE_PASSWORD) is enough. The cookie is signed-ish by being an HMAC of
// the password itself, so it can't be forged without knowing the password.

const COOKIE_NAME = "smt_auth";

async function expectedToken(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Buffer.from(digest).toString("hex");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const password = process.env.SITE_PASSWORD;
  if (!password) {
    // Fail closed with a clear message rather than silently letting anyone in.
    return new NextResponse(
      "SITE_PASSWORD is not set. Add it in your hosting provider's environment variables.",
      { status: 500 }
    );
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const expected = await expectedToken(password);

  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
