import { NextResponse, type NextRequest } from "next/server";

// Cheap gate: cookie presence only. Real checks happen in requireUser()/assertRole().
export function middleware(req: NextRequest) {
  const hasCookie = req.cookies.has("stjc_session");
  const onLogin = req.nextUrl.pathname === "/login";
  if (!hasCookie && !onLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (hasCookie && onLogin) return NextResponse.redirect(new URL("/masses", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
