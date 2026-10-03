import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

export async function GET(request) {
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!redirectUri || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Spotify settings in .env.local." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("spotify_oauth_state")?.value;

  const cookieOptions = {
    httpOnly: true,
    secure: new URL(redirectUri).protocol === "https:",
    sameSite: "lax",
    path: "/",
  };

  function fail(message, status = 400) {
    const response = NextResponse.json({ error: message }, { status });
    response.cookies.set("spotify_oauth_state", "", {
      ...cookieOptions,
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (
    !state ||
    !savedState ||
    Buffer.byteLength(state) !== Buffer.byteLength(savedState) ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(savedState))
  ) {
    return fail("Login verification failed. Start Spotify login again.");
  }

  if (url.searchParams.has("error")) {
    return fail("Spotify access was not granted. You can try again.");
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return fail("Spotify did not return an authorization code.");
  }

  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      return fail(
        `Spotify token exchange failed (${tokenResponse.status}).`,
        502
      );
    }

    const data = await tokenResponse.json();

    if (!data.access_token) {
      return fail("Spotify did not return an access token.", 502);
    }

    const home = new URL("/", redirectUri);
    home.searchParams.set("spotify", "connected");

    const response = NextResponse.redirect(home);

    response.cookies.set("spotify_access_token", data.access_token, {
      ...cookieOptions,
      maxAge: Math.max(1, Math.floor(Number(data.expires_in) || 3600) - 60),
    });

    response.cookies.set("spotify_oauth_state", "", {
      ...cookieOptions,
      maxAge: 0,
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return fail("Could not connect to Spotify. Please try again.", 502);
  }
}