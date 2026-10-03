import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function refreshAccessToken(
  refreshToken
) {
  const clientId =
    process.env
      .SPOTIFY_CLIENT_ID;

  const clientSecret =
    process.env
      .SPOTIFY_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret ||
    !refreshToken
  ) {
    return null;
  }

  const response =
    await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method:
          "POST",

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
              "refresh_token",

            refresh_token:
              refreshToken,
          }),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getProfile(
  token
) {
  return fetch(
    "https://api.spotify.com/v1/me",
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },

      cache:
        "no-store",
    }
  );
}

export async function GET(
  request
) {
  let accessToken =
    request.cookies.get(
      "spotify_access_token"
    )?.value;

  const refreshToken =
    request.cookies.get(
      "spotify_refresh_token"
    )?.value;

  let refreshed =
    null;

  if (
    !accessToken &&
    refreshToken
  ) {
    refreshed =
      await refreshAccessToken(
        refreshToken
      );

    accessToken =
      refreshed?.access_token ||
      null;
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        connected:
          false,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  let profileResponse =
    await getProfile(
      accessToken
    );

  if (
    profileResponse.status ===
      401 &&
    refreshToken
  ) {
    refreshed =
      await refreshAccessToken(
        refreshToken
      );

    accessToken =
      refreshed?.access_token ||
      null;

    if (accessToken) {
      profileResponse =
        await getProfile(
          accessToken
        );
    }
  }

  if (
    !profileResponse.ok
  ) {
    return NextResponse.json(
      {
        connected:
          false,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  const profile =
    await profileResponse.json();

  const response =
    NextResponse.json(
      {
        connected:
          true,

        user: {
          id:
            profile.id ||
            profile.account_id ||
            null,

          displayName:
            profile.display_name ||
            "Spotify user",

          image:
            profile.images?.[0]
              ?.url ||
            null,

          url:
            profile
              .external_urls
              ?.spotify ||
            null,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );

  const secure =
    (
      process.env
        .SPOTIFY_REDIRECT_URI ||
      ""
    ).startsWith(
      "https://"
    );

  if (
    refreshed?.access_token
  ) {
    response.cookies.set(
      "spotify_access_token",
      refreshed.access_token,
      {
        httpOnly:
          true,

        secure,

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          Math.max(
            60,
            (refreshed.expires_in ||
              3600) -
              60
          ),
      }
    );
  }

  if (
    refreshed?.refresh_token
  ) {
    response.cookies.set(
      "spotify_refresh_token",
      refreshed.refresh_token,
      {
        httpOnly:
          true,

        secure,

        sameSite:
          "lax",

        path:
          "/",

        maxAge:
          60 *
          60 *
          24 *
          30,
      }
    );
  }

  return response;
}