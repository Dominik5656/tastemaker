import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Spotify login settings in .env.local." },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "playlist-modify-private",
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  );

  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: new URL(redirectUri).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}