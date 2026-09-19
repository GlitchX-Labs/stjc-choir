import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { Role } from "./constants";

export type SessionUser = { id: string; username: string; display_name: string; role: Role };
export type SessionData = { user?: SessionUser };

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "stjc_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 },
};

export const getSession = () => getIronSession<SessionData>(cookies(), sessionOptions);
