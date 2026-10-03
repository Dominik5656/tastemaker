import { NextResponse } from "next/server";

export const runtime = "nodejs";

function reply(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
 const origin = request.headers.get("origin");
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

if (!redirectUri) {
  return reply({ error: "Missing SPOTIFY_REDIRECT_URI." }, 500);
}

const allowedOrigin = new URL(redirectUri).origin;

if (!origin || origin !== allowedOrigin) {
  return reply({ error: "Invalid request origin." }, 403);
}

  const token = request.cookies.get("spotify_access_token")?.value;

  if (!token) {
    return reply(
      { error: "Connect Spotify before saving.", needsLogin: true },
      401
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "Invalid request data." }, 400);
  }

  if (
    !Array.isArray(body.uris) ||
    body.uris.length === 0 ||
    body.uris.length > 100 ||
    body.uris.some(
      (uri) =>
        typeof uri !== "string" ||
        !/^spotify:track:[A-Za-z0-9]{22}$/.test(uri)
    )
  ) {
    return reply({ error: "Provide between 1 and 100 valid tracks." }, 400);
  }

  const uris = [...new Set(body.uris)];
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 100)
      : "TasteMaker Playlist";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let playlistUrl = null;
  let created = false;

  try {
    const createResponse = await fetch(
      "https://api.spotify.com/v1/me/playlists",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          public: false,
          description: "Created with TasteMaker.",
        }),
        cache: "no-store",
      }
    );

    if (!createResponse.ok) {
      return reply(
        {
          error: `Spotify could not create the playlist (${createResponse.status}).`,
          needsLogin: createResponse.status === 401,
        },
        createResponse.status === 401 ? 401 : 502
      );
    }

    created = true;
    const playlist = await createResponse.json();
    playlistUrl =
      playlist.external_urls?.spotify ||
      `https://open.spotify.com/playlist/${playlist.id}`;

    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ uris }),
        cache: "no-store",
      }
    );

    if (!addResponse.ok) {
      return reply(
        {
          error: `Playlist created, but adding songs failed (${addResponse.status}). Check it before trying again.`,
          playlistUrl,
        },
        502
      );
    }

    return reply({
      success: true,
      added: uris.length,
      playlistUrl,
    });
  } catch {
    return reply(
      {
        error: created
          ? "Playlist creation succeeded, but saving songs could not be confirmed. Check Spotify before trying again."
          : "Could not confirm playlist creation. Check Spotify before trying again.",
        playlistUrl,
      },
      502
    );
  }
}