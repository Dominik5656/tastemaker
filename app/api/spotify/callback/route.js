import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);

  const code =
    url.searchParams.get("code");

  const returnedState =
    url.searchParams.get("state");

  const spotifyError =
    url.searchParams.get("error");

  const storedState =
    request.cookies.get(
      "spotify_oauth_state"
    )?.value;

  const clientId =
    process.env.SPOTIFY_CLIENT_ID;

  const clientSecret =
    process.env.SPOTIFY_CLIENT_SECRET;

  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI;

  if (!redirectUri) {
    return Response.json(
      {
        error:
          "Missing SPOTIFY_REDIRECT_URI.",
      },
      { status: 500 }
    );
  }

  const homeUrl =
    new URL(
      "/",
      redirectUri
    );

  if (spotifyError) {
    homeUrl.searchParams.set(
      "spotify",
      "denied"
    );

    return NextResponse.redirect(
      homeUrl
    );
  }

  if (
    !code ||
    !returnedState ||
    !storedState ||
    returnedState !== storedState
  ) {
    homeUrl.searchParams.set(
      "spotify",
      "verification_failed"
    );

    const response =
      NextResponse.redirect(
        homeUrl
      );

    response.cookies.set(
      "spotify_oauth_state",
      "",
      {
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  }

  if (
    !clientId ||
    !clientSecret
  ) {
    return Response.json(
      {
        error:
          "Spotify environment variables are missing.",
      },
      { status: 500 }
    );
  }

  try {
    const tokenResponse =
      await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",

          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${clientId}:${clientSecret}`
              ).toString(
                "base64"
              ),

            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams({
              grant_type:
                "authorization_code",

              code,

              redirect_uri:
                redirectUri,
            }),

          cache: "no-store",
        }
      );

    const tokenData =
      await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "Spotify token error:",
        tokenData
      );

      homeUrl.searchParams.set(
        "spotify",
        "token_error"
      );

      return NextResponse.redirect(
        homeUrl
      );
    }

    homeUrl.searchParams.set(
      "spotify",
      "connected"
    );

    const response =
      NextResponse.redirect(
        homeUrl
      );

    const secure =
      new URL(
        redirectUri
      ).protocol === "https:";

    response.cookies.set(
      "spotify_access_token",
      tokenData.access_token,
      {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",

        maxAge: Math.max(
          60,
          (tokenData.expires_in ||
            3600) - 60
        ),
      }
    );

    if (
      tokenData.refresh_token
    ) {
      response.cookies.set(
        "spotify_refresh_token",
        tokenData.refresh_token,
        {
          httpOnly: true,
          secure,
          sameSite: "lax",
          path: "/",

          maxAge:
            60 *
            60 *
            24 *
            30,
        }
      );
    }

    response.cookies.set(
      "spotify_oauth_state",
      "",
      {
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Spotify callback error:",
      error
    );

    homeUrl.searchParams.set(
      "spotify",
      "callback_error"
    );

    return NextResponse.redirect(
      homeUrl
    );
  }
}