export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedToken = null;
let tokenExpiresAt = 0;

function escapeQuery(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function coverUrl(imageId) {
  if (!imageId) {
    return null;
  }

  return `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`;
}

function getYear(timestamp) {
  if (!timestamp) {
    return null;
  }

  try {
    return new Date(
      timestamp * 1000
    ).getUTCFullYear();
  } catch {
    return null;
  }
}

function mapGame(game) {
  return {
    id: game.id,

    name:
      game.name ||
      "Unknown game",

    cover:
      coverUrl(
        game.cover?.image_id
      ),

    year:
      getYear(
        game.first_release_date
      ),

    genres:
      (game.genres || []).map(
        (genre) => ({
          id: genre.id,
          name: genre.name,
        })
      ),

    themes:
      (game.themes || []).map(
        (theme) => ({
          id: theme.id,
          name: theme.name,
        })
      ),

    platforms:
      (game.platforms || []).map(
        (platform) => ({
          id: platform.id,
          name: platform.name,
        })
      ),

    rating:
      Math.round(
        game.total_rating ||
          game.rating ||
          0
      ),

    ratingCount:
      game.total_rating_count ||
      game.rating_count ||
      0,

    summary:
      game.summary ||
      "",

    url:
      game.url ||
      null,
  };
}

async function getAccessToken() {
  const clientId =
    process.env
      .IGDB_CLIENT_ID;

  const clientSecret =
    process.env
      .IGDB_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "IGDB credentials are missing."
    );
  }

  if (
    cachedToken &&
    Date.now() <
      tokenExpiresAt -
        60_000
  ) {
    return cachedToken;
  }

  const params =
    new URLSearchParams({
      client_id:
        clientId,

      client_secret:
        clientSecret,

      grant_type:
        "client_credentials",
    });

  const response =
    await fetch(
      `https://id.twitch.tv/oauth2/token?${params.toString()}`,
      {
        method: "POST",
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "IGDB authentication failed."
    );
  }

  const data =
    await response.json();

  if (!data.access_token) {
    throw new Error(
      "IGDB did not return an access token."
    );
  }

  cachedToken =
    data.access_token;

  tokenExpiresAt =
    Date.now() +
    (data.expires_in ||
      3600) *
      1000;

  return cachedToken;
}

async function igdbRequest(
  endpoint,
  query
) {
  const clientId =
    process.env
      .IGDB_CLIENT_ID;

  const token =
    await getAccessToken();

  const response =
    await fetch(
      `https://api.igdb.com/v4/${endpoint}`,
      {
        method: "POST",

        headers: {
          "Client-ID":
            clientId,

          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",

          "Content-Type":
            "text/plain",
        },

        body: query,

        cache: "no-store",
      }
    );

  if (!response.ok) {
    const text =
      await response.text();

    console.error(
      "IGDB error:",
      response.status,
      text
    );

    throw new Error(
      `IGDB request failed (${response.status}).`
    );
  }

  return response.json();
}

export async function GET(
  request
) {
  const url =
    new URL(
      request.url
    );

  const query =
    url.searchParams
      .get("q")
      ?.trim();

  if (
    !query ||
    query.length < 2 ||
    query.length > 100
  ) {
    return Response.json(
      {
        error:
          "Enter a game name.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const safeQuery =
      escapeQuery(
        query
      );

    const games =
      await igdbRequest(
        "games",
        `
          search "${safeQuery}";

          fields
            name,
            cover.image_id,
            first_release_date,
            genres.name,
            themes.name,
            platforms.name,
            total_rating,
            total_rating_count,
            rating,
            rating_count,
            summary,
            url;

          where
            version_parent = null
            & themes != (42);

          limit 12;
        `
      );

    return Response.json(
      {
        games:
          games.map(
            mapGame
          ),
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Game search error:",
      error
    );

    return Response.json(
      {
        error:
          error.message ||
          "Could not search for games.",
      },
      {
        status: 502,
      }
    );
  }
}