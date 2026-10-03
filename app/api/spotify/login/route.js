import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return Response.json(
      {
        error:
          "Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI.",
      },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();

  const scopes = [
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-private",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: scopes,
  });

  const spotifyUrl =
    `https://accounts.spotify.com/authorize?${params.toString()}`;

  const response = NextResponse.redirect(spotifyUrl);

  response.cookies.set(
    "spotify_oauth_state",
    state,
    {
      httpOnly: true,
      secure:
        new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    }
  );

  return response;
}