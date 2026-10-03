export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedToken = null;
let tokenExpiresAt = 0;

const VIBE_KEYWORDS = {
  story: [
    "drama",
    "mystery",
    "role-playing",
    "adventure",
  ],

  horror: [
    "horror",
    "survival",
    "thriller",
  ],

  relaxing: [
    "sandbox",
    "simulation",
    "indie",
    "strategy",
  ],

  "open-world": [
    "open world",
    "sandbox",
    "adventure",
    "role-playing",
  ],

  multiplayer: [
    "multiplayer",
    "co-operative",
    "action",
    "shooter",
  ],

  competitive: [
    "competitive",
    "sport",
    "shooter",
    "fighting",
    "strategy",
  ],

  indie: [
    "indie",
  ],

  weird: [
    "science fiction",
    "fantasy",
    "mystery",
    "surreal",
  ],
};

function normalize(
  value = ""
) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s-]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function coverUrl(
  imageId
) {
  if (!imageId) {
    return null;
  }

  return `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`;
}

function getYear(
  timestamp
) {
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

function hashString(
  value
) {
  let hash =
    2166136261;

  for (
    let index = 0;
    index <
    value.length;
    index++
  ) {
    hash ^=
      value.charCodeAt(
        index
      );

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return (
    hash >>> 0
  );
}

function randomFromSeed(
  value
) {
  let seed =
    hashString(
      value
    );

  seed +=
    0x6d2b79f5;

  let t = seed;

  t =
    Math.imul(
      t ^
        (t >>> 15),
      t | 1
    );

  t ^=
    t +
    Math.imul(
      t ^
        (t >>> 7),
      t | 61
    );

  return (
    (
      t ^
      (t >>> 14)
    ) >>>
    0
  ) /
    4294967296;
}

function mapGame(
  game,
  reason
) {
  return {
    id:
      game.id,

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
      (
        game.genres ||
        []
      ).map(
        (genre) =>
          genre.name
      ),

    themes:
      (
        game.themes ||
        []
      ).map(
        (theme) =>
          theme.name
      ),

    platforms:
      (
        game.platforms ||
        []
      ).map(
        (platform) =>
          platform.name
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

    reason:
      reason ||
      "Taste match",
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
        method:
          "POST",

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

        cache:
          "no-store",
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

function platformMatches(
  game,
  filter
) {
  if (
    !filter ||
    filter === "all"
  ) {
    return true;
  }

  const platformText =
    (
      game.platforms ||
      []
    )
      .map(
        (platform) =>
          normalize(
            platform.name
          )
      )
      .join(" ");

  if (
    filter === "pc"
  ) {
    return (
      platformText.includes(
        "pc"
      ) ||
      platformText.includes(
        "windows"
      ) ||
      platformText.includes(
        "linux"
      ) ||
      platformText.includes(
        "mac"
      )
    );
  }

  if (
    filter ===
    "playstation"
  ) {
    return platformText.includes(
      "playstation"
    );
  }

  if (
    filter === "xbox"
  ) {
    return platformText.includes(
      "xbox"
    );
  }

  if (
    filter === "switch"
  ) {
    return platformText.includes(
      "switch"
    );
  }

  return true;
}

function getVibeMatch(
  game,
  vibes
) {
  if (
    !vibes.length
  ) {
    return null;
  }

  const text =
    [
      ...(game.genres ||
        []).map(
        (item) =>
          item.name
      ),

      ...(game.themes ||
        []).map(
        (item) =>
          item.name
      ),
    ]
      .map(normalize)
      .join(" ");

  for (
    const vibe of
    vibes
  ) {
    const keywords =
      VIBE_KEYWORDS[
        vibe
      ] || [];

    if (
      keywords.some(
        (keyword) =>
          text.includes(
            normalize(
              keyword
            )
          )
      )
    ) {
      return vibe;
    }
  }

  return null;
}

export async function POST(
  request
) {
  let body;

  try {
    body =
      await request.json();
  } catch {
    return Response.json(
      {
        error:
          "Invalid request.",
      },
      {
        status: 400,
      }
    );
  }

  const seedIds =
    Array.isArray(
      body.seedIds
    )
      ? [
          ...new Set(
            body.seedIds
              .map(Number)
              .filter(
                Number.isFinite
              )
          ),
        ].slice(
          0,
          8
        )
      : [];

  if (
    !seedIds.length
  ) {
    return Response.json(
      {
        error:
          "Add at least one favorite game first.",
      },
      {
        status: 400,
      }
    );
  }

  const likedIds =
    Array.isArray(
      body.likedIds
    )
      ? body.likedIds
          .map(Number)
          .filter(
            Number.isFinite
          )
          .slice(
            0,
            12
          )
      : [];

  const dislikedIds =
    Array.isArray(
      body.dislikedIds
    )
      ? body.dislikedIds
          .map(Number)
          .filter(
            Number.isFinite
          )
      : [];

  const blockedIds =
    Array.isArray(
      body.blockedIds
    )
      ? body.blockedIds
          .map(Number)
          .filter(
            Number.isFinite
          )
      : [];

  const excludeIds =
    Array.isArray(
      body.excludeIds
    )
      ? body.excludeIds
          .map(Number)
          .filter(
            Number.isFinite
          )
      : [];

  const count =
    Math.min(
      20,
      Math.max(
        6,
        Number(
          body.count
        ) || 12
      )
    );

  const discoveryValue =
    Number(
      body.discovery
    );

  const discovery =
    Number.isFinite(
      discoveryValue
    )
      ? Math.min(
          100,
          Math.max(
            0,
            discoveryValue
          )
        )
      : 55;

  const platform =
    typeof body.platform ===
      "string"
      ? body.platform
      : "all";

  const vibes =
    Array.isArray(
      body.vibes
    )
      ? body.vibes
          .filter(
            (vibe) =>
              typeof vibe ===
                "string" &&
              VIBE_KEYWORDS[
                vibe
              ]
          )
          .slice(
            0,
            3
          )
      : [];

  const nonce =
    String(
      body.nonce ||
        Date.now()
    );

  try {
    const tasteIds =
      [
        ...new Set([
          ...seedIds,
          ...likedIds,
        ]),
      ].slice(
        0,
        20
      );

    const seedGames =
      await igdbRequest(
        "games",
        `
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
            url,
            similar_games;

          where
            id = (${tasteIds.join(
              ","
            )})
            & themes != (42);

          limit 30;
        `
      );

    if (
      !seedGames.length
    ) {
      return Response.json(
        {
          error:
            "Could not load your selected games.",
        },
        {
          status: 404,
        }
      );
    }

    const primarySeeds =
      seedGames.filter(
        (game) =>
          seedIds.includes(
            game.id
          )
      );

    const genreWeights =
      new Map();

    const themeWeights =
      new Map();

    for (
      const game of
      seedGames
    ) {
      const weight =
        likedIds.includes(
          game.id
        )
          ? 4
          : 3;

      for (
        const genre of
        game.genres ||
        []
      ) {
        genreWeights.set(
          genre.id,
          (
            genreWeights.get(
              genre.id
            ) || 0
          ) + weight
        );
      }

      for (
        const theme of
        game.themes ||
        []
      ) {
        if (
          theme.id === 42
        ) {
          continue;
        }

        themeWeights.set(
          theme.id,
          (
            themeWeights.get(
              theme.id
            ) || 0
          ) + weight
        );
      }
    }

    const similarIds =
      [
        ...new Set(
          primarySeeds.flatMap(
            (game) =>
              game.similar_games ||
              []
          )
        ),
      ].slice(
        0,
        100
      );

    const candidates =
      new Map();

    function addCandidates(
      games,
      source
    ) {
      for (
        const game of
        games
      ) {
        if (
          !game?.id
        ) {
          continue;
        }

        const existing =
          candidates.get(
            game.id
          );

        if (existing) {
          existing.sources.add(
            source
          );

          continue;
        }

        candidates.set(
          game.id,
          {
            ...game,

            sources:
              new Set([
                source,
              ]),
          }
        );
      }
    }

    if (
      similarIds.length
    ) {
      const similarGames =
        await igdbRequest(
          "games",
          `
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
              id = (${similarIds.join(
                ","
              )})
              & version_parent = null
              & themes != (42);

            limit 100;
          `
        );

      addCandidates(
        similarGames,
        "similar"
      );
    }

    const genreIds =
      [
        ...genreWeights.keys(),
      ].slice(
        0,
        8
      );

    const themeIds =
      [
        ...themeWeights.keys(),
      ].slice(
        0,
        8
      );

    const conditions = [];

    if (
      genreIds.length
    ) {
      conditions.push(
        `genres = (${genreIds.join(
          ","
        )})`
      );
    }

    if (
      themeIds.length
    ) {
      conditions.push(
        `themes = (${themeIds.join(
          ","
        )})`
      );
    }

    if (
      conditions.length
    ) {
      const minimumVotes =
        discovery >= 75
          ? 2
          : 5;

      const discoveryGames =
        await igdbRequest(
          "games",
          `
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
              & themes != (42)
              & total_rating_count >= ${minimumVotes}
              & (${conditions.join(
                " | "
              )});

            sort total_rating_count desc;

            limit 100;
          `
        );

      addCandidates(
        discoveryGames,
        "discovery"
      );
    }

    const excluded =
      new Set([
        ...seedIds,
        ...likedIds,
        ...dislikedIds,
        ...blockedIds,
        ...excludeIds,
      ]);

    const discoveryFactor =
      discovery /
      100;

    const ranked =
      [
        ...candidates.values(),
      ]
        .filter(
          (game) =>
            !excluded.has(
              game.id
            )
        )
        .filter(
          (game) =>
            platformMatches(
              game,
              platform
            )
        )
        .map(
          (game) => {
            let genreScore =
              0;

            let themeScore =
              0;

            for (
              const genre of
              game.genres ||
              []
            ) {
              genreScore +=
                genreWeights.get(
                  genre.id
                ) || 0;
            }

            for (
              const theme of
              game.themes ||
              []
            ) {
              themeScore +=
                themeWeights.get(
                  theme.id
                ) || 0;
            }

            const similarSeed =
              primarySeeds.find(
                (seed) =>
                  (
                    seed.similar_games ||
                    []
                  ).includes(
                    game.id
                  )
              );

            const vibeMatch =
              getVibeMatch(
                game,
                vibes
              );

            const rating =
              game.total_rating ||
              game.rating ||
              0;

            const ratingCount =
              game.total_rating_count ||
              game.rating_count ||
              0;

            let score = 0;

            score +=
              genreScore *
              (
                3.7 -
                discoveryFactor *
                  1.2
              );

            score +=
              themeScore *
              (
                4.4 -
                discoveryFactor *
                  1.25
              );

            if (
              similarSeed
            ) {
              score +=
                18 -
                discoveryFactor *
                  9;
            }

            if (
              vibeMatch
            ) {
              score +=
                8;
            }

            score +=
              Math.min(
                rating / 20,
                5
              );

            score +=
              Math.min(
                Math.log10(
                  ratingCount +
                    1
                ) *
                  1.5,
                5
              );

            if (
              game.sources.has(
                "discovery"
              )
            ) {
              score +=
                discoveryFactor *
                5;
            }

            const overlap =
              genreScore +
              themeScore;

            if (
              discovery >=
                70 &&
              overlap > 0 &&
              overlap <= 5
            ) {
              score +=
                4;
            }

            score +=
              randomFromSeed(
                `${nonce}-${game.id}`
              ) *
              (
                2 +
                discoveryFactor *
                  6
              );

            let reason =
              "Taste match";

            if (
              vibeMatch
            ) {
              const vibeName =
                vibeMatch
                  .replace(
                    "-",
                    " "
                  );

              reason =
                `${vibeName} vibe`;
            } else if (
              similarSeed
            ) {
              reason =
                `Similar to ${similarSeed.name}`;
            } else {
              const matchingGenre =
                (
                  game.genres ||
                  []
                ).find(
                  (genre) =>
                    genreWeights.has(
                      genre.id
                    )
                );

              const matchingTheme =
                (
                  game.themes ||
                  []
                ).find(
                  (theme) =>
                    themeWeights.has(
                      theme.id
                    )
                );

              if (
                matchingTheme
              ) {
                reason =
                  `${matchingTheme.name} connection`;
              } else if (
                matchingGenre
              ) {
                reason =
                  `${matchingGenre.name} match`;
              } else if (
                discovery >=
                70
              ) {
                reason =
                  "Wild-card pick";
              }
            }

            return {
              game,

              score,

              reason,
            };
          }
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        )
        .slice(
          0,
          count
        );

    const games =
      ranked.map(
        ({
          game,
          reason,
        }) =>
          mapGame(
            game,
            reason
          )
      );

    return Response.json(
      {
        games,

        meta: {
          discovery,

          seedGames:
            primarySeeds.map(
              (game) =>
                game.name
            ),

          vibes,

          platform,

          candidateCount:
            candidates.size,

          feedbackUsed:
            likedIds.length >
              0 ||
            dislikedIds.length >
              0,
        },
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
      "Game recommendation error:",
      error
    );

    return Response.json(
      {
        error:
          error.message ||
          "Could not build recommendations.",
      },
      {
        status: 502,
      }
    );
  }
}