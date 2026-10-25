import { createHash, timingSafeEqual } from "node:crypto";
import { getRequestHeader, setResponseHeader, useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export function passwordMatches(input: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(input).digest(), createHash("sha256").update(expected).digest());
}

export function ownerSessionValid(data: { unlocked?: boolean; version?: string }, expectedVersion: string) {
  return data.unlocked === true && typeof data.version === "string" && passwordMatches(data.version, expectedVersion);
}

export async function ownerSession(secret: string) {
  setResponseHeader("Cache-Control", "no-store");
  return useSession<{ unlocked?: boolean; version?: string }>({
    name: "voltedge-owner",
    password: secret,
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" },
  });
}

export function credentialVersion(password: string, secret: string) {
  return createHash("sha256").update(`${secret}\0${password}`).digest("hex");
}

export function requireSameOrigin() {
  const origin = getRequestHeader("origin");
  const host = getRequestHeader("host");
  if (!origin || !host || new URL(origin).host !== host) throw new Error("Request not allowed.");
}

export async function requireOwner(password: string, secret: string) {
  const session = await ownerSession(secret);
  if (!ownerSessionValid(session.data, credentialVersion(password, secret))) {
    throw redirect({ to: "/owner/login" });
  }
  return session;
}