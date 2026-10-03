import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(
  data,
  status = 200
) {
  return NextResponse.json(
    data,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

async function refreshAccessToken(
  refreshToken
) {
  const clientId =
    process.env.SPOTIFY_CLIENT_ID;

  const clientSecret =
    process.env.SPOTIFY_CLIENT_SECRET;

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
              "refresh_token",

            refresh_token:
              refreshToken,
          }),

        cache: "no-store",
      }
    );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function setRefreshedCookies(
  response,
  tokenData
) {
  if (
    !tokenData?.access_token
  ) {
    return;
  }

  const secure =
    (
      process.env
        .SPOTIFY_REDIRECT_URI ||
      ""
    ).startsWith(
      "https://"
    );

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
}

async function createPlaylist(
  token,
  name
) {
  return fetch(
    "https://api.spotify.com/v1/me/playlists",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        name,

        public: false,

        description:
          "Created with TasteMaker.",
      }),

      cache: "no-store",
    }
  );
}

export async function POST(
  request
) {
  const origin =
    request.headers.get(
      "origin"
    );

  const redirectUri =
    process.env
      .SPOTIFY_REDIRECT_URI;

  if (!redirectUri) {
    return reply(
      {
        error:
          "Missing SPOTIFY_REDIRECT_URI.",
      },
      500
    );
  }

  const allowedOrigin =
    new URL(
      redirectUri
    ).origin;

  if (
    !origin ||
    origin !== allowedOrigin
  ) {
    return reply(
      {
        error:
          "Invalid request origin.",
      },
      403
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return reply(
      {
        error:
          "Invalid request data.",
      },
      400
    );
  }

  if (
    !Array.isArray(
      body.uris
    ) ||
    body.uris.length === 0 ||
    body.uris.length > 100 ||
    body.uris.some(
      (uri) =>
        typeof uri !==
          "string" ||
        !/^spotify:track:[A-Za-z0-9]{22}$/.test(
          uri
        )
    )
  ) {
    return reply(
      {
        error:
          "Provide between 1 and 100 valid tracks.",
      },
      400
    );
  }

  const uris = [
    ...new Set(
      body.uris
    ),
  ];

  const name =
    typeof body.name ===
      "string" &&
    body.name.trim()
      ? body.name
          .trim()
          .slice(
            0,
            100
          )
      : "TasteMaker Mix";

  let accessToken =
    request.cookies.get(
      "spotify_access_token"
    )?.value;

  const refreshToken =
    request.cookies.get(
      "spotify_refresh_token"
    )?.value;

  let refreshed = null;

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
    return reply(
      {
        error:
          "Connect Spotify before saving.",

        needsLogin: true,
      },
      401
    );
  }

  let playlistUrl = null;
  let created = false;

  try {
    let createResponse =
      await createPlaylist(
        accessToken,
        name
      );

    if (
      createResponse.status ===
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
        createResponse =
          await createPlaylist(
            accessToken,
            name
          );
      }
    }

    if (
      !createResponse.ok
    ) {
      const response =
        reply(
          {
            error:
              `Spotify could not create the playlist (${createResponse.status}).`,

            needsLogin:
              createResponse.status ===
              401,
          },

          createResponse.status ===
            401
            ? 401
            : 502
        );

      setRefreshedCookies(
        response,
        refreshed
      );

      return response;
    }

    created = true;

    const playlist =
      await createResponse.json();

    playlistUrl =
      playlist
        .external_urls
        ?.spotify ||
      `https://open.spotify.com/playlist/${playlist.id}`;

    const addResponse =
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              uris,
            }),

          cache:
            "no-store",
        }
      );

    if (
      !addResponse.ok
    ) {
      const response =
        reply(
          {
            error:
              `Playlist created, but adding songs failed (${addResponse.status}). Check Spotify before trying again.`,

            playlistUrl,
          },
          502
        );

      setRefreshedCookies(
        response,
        refreshed
      );

      return response;
    }

    const response =
      reply({
        success: true,

        added:
          uris.length,

        playlistUrl,
      });

    setRefreshedCookies(
      response,
      refreshed
    );

    return response;
  } catch (error) {
    console.error(
      "Save playlist error:",
      error
    );

    const response =
      reply(
        {
          error: created
            ? "Playlist creation succeeded, but saving songs could not be confirmed. Check Spotify before trying again."
            : "Could not confirm playlist creation. Check Spotify before trying again.",

          playlistUrl,
        },
        502
      );

    setRefreshedCookies(
      response,
      refreshed
    );

    return response;
  }
}