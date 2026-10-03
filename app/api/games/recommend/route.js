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

function clamp(
  value,
  min,
  max,
  fallback
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(
      min,
      number
    )
  );
}

function mapGame(
  game,
  reason,
  tier
) {
  return {
    id:
      game.id,

    name:
      game.name ||
      "Unknown game",

    cover:
      coverUrl(
        game.cover
          ?.image_id
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

    franchises:
      (
        game.franchises ||
        []
      ).map(
        (
          franchise
        ) =>
          franchise.name
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

    discoveryTier:
      tier ||
      "connected",
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
        method:
          "POST",

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
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
    (
      data.expires_in ||
      3600
    ) *
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

        body:
          query,

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
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
    filter ===
      "all"
  ) {
    return true;
  }

  const platformText =
    (
      game.platforms ||
      []
    )
      .map(
        (
          platform
        ) =>
          normalize(
            platform.name
          )
      )
      .join(" ");

  if (
    filter ===
    "pc"
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
    filter ===
    "xbox"
  ) {
    return platformText.includes(
      "xbox"
    );
  }

  if (
    filter ===
    "switch"
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
      ...(
        game.genres ||
        []
      ).map(
        (item) =>
          item.name
      ),

      ...(
        game.themes ||
        []
      ).map(
        (item) =>
          item.name
      ),
    ]
      .map(
        normalize
      )
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
        (
          keyword
        ) =>
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

function getDiscoveryMode(
  discovery
) {
  if (
    discovery <= 20
  ) {
    return "Familiar";
  }

  if (
    discovery <= 45
  ) {
    return "Safe discovery";
  }

  if (
    discovery <= 70
  ) {
    return "Explorer";
  }

  if (
    discovery <= 90
  ) {
    return "Hidden paths";
  }

  return "Wild card";
}

function getPopularityLabel(
  popularity,
  hiddenGems
) {
  if (hiddenGems) {
    return "Hidden gems";
  }

  if (
    popularity <= 25
  ) {
    return "Mainstream";
  }

  if (
    popularity <= 60
  ) {
    return "Balanced";
  }

  if (
    popularity <= 85
  ) {
    return "Off the radar";
  }

  return "Deep cuts";
}

function allocateComposition(
  count,
  discovery,
  surprise
) {
  if (surprise) {
    return {
      close: 0,
      connected: 0,
      adventurous: 0,
      wild: 1,
    };
  }

  let ratios;

  if (
    discovery <= 20
  ) {
    ratios = {
      close:
        0.75,

      connected:
        0.2,

      adventurous:
        0.05,

      wild:
        0,
    };
  } else if (
    discovery <= 45
  ) {
    ratios = {
      close:
        0.55,

      connected:
        0.3,

      adventurous:
        0.1,

      wild:
        0.05,
    };
  } else if (
    discovery <= 70
  ) {
    ratios = {
      close:
        0.3,

      connected:
        0.35,

      adventurous:
        0.25,

      wild:
        0.1,
    };
  } else if (
    discovery <= 90
  ) {
    ratios = {
      close:
        0.15,

      connected:
        0.25,

      adventurous:
        0.35,

      wild:
        0.25,
    };
  } else {
    ratios = {
      close:
        0.05,

      connected:
        0.15,

      adventurous:
        0.35,

      wild:
        0.45,
    };
  }

  const keys = [
    "close",
    "connected",
    "adventurous",
    "wild",
  ];

  const exact =
    keys.map(
      (key) => ({
        key,

        value:
          ratios[key] *
          count,
      })
    );

  const result =
    Object.fromEntries(
      keys.map(
        (key) => [
          key,
          0,
        ]
      )
    );

  let used = 0;

  for (
    const item of
    exact
  ) {
    const floor =
      Math.floor(
        item.value
      );

    result[
      item.key
    ] = floor;

    used +=
      floor;
  }

  exact
    .sort(
      (a, b) =>
        (
          b.value %
          1
        ) -
        (
          a.value %
          1
        )
    )
    .slice(
      0,
      count - used
    )
    .forEach(
      (item) => {
        result[
          item.key
        ] += 1;
      }
    );

  return result;
}

function idSet(
  items = []
) {
  return new Set(
    items
      .map(
        (item) =>
          item.id
      )
      .filter(
        Number.isFinite
      )
  );
}

function overlapRatio(
  aSet,
  bSet
) {
  if (
    !aSet.size ||
    !bSet.size
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const value of
    aSet
  ) {
    if (
      bSet.has(
        value
      )
    ) {
      intersection++;
    }
  }

  return (
    intersection /
    Math.max(
      1,
      Math.min(
        aSet.size,
        bSet.size
      )
    )
  );
}

function gamesSimilarity(
  a,
  b
) {
  const franchiseA =
    new Set(
      (
        a.franchises ||
        []
      )
        .map(
          (item) =>
            normalize(
              item.name ||
                item.id ||
                ""
            )
        )
        .filter(Boolean)
    );

  const franchiseB =
    new Set(
      (
        b.franchises ||
        []
      )
        .map(
          (item) =>
            normalize(
              item.name ||
                item.id ||
                ""
            )
        )
        .filter(Boolean)
    );

  for (
    const key of
    franchiseA
  ) {
    if (
      franchiseB.has(
        key
      )
    ) {
      return 1.25;
    }
  }

  const genreSimilarity =
    overlapRatio(
      idSet(
        a.genres || []
      ),

      idSet(
        b.genres || []
      )
    );

  const themeSimilarity =
    overlapRatio(
      idSet(
        a.themes || []
      ),

      idSet(
        b.themes || []
      )
    );

  return (
    genreSimilarity *
      0.58 +
    themeSimilarity *
      0.42
  );
}

function buildTasteFingerprint(
  positiveGames,
  seedIds,
  likedIds
) {
  const genreMap =
    new Map();

  const themeMap =
    new Map();

  for (
    const game of
    positiveGames
  ) {
    const weight =
      likedIds.includes(
        game.id
      )
        ? 5
        : seedIds.includes(
            game.id
          )
        ? 3
        : 2;

    for (
      const genre of
      game.genres || []
    ) {
      const current =
        genreMap.get(
          genre.id
        ) || {
          name:
            genre.name,

          weight: 0,
        };

      current.weight +=
        weight;

      genreMap.set(
        genre.id,
        current
      );
    }

    for (
      const theme of
      game.themes || []
    ) {
      if (
        theme.id === 42
      ) {
        continue;
      }

      const current =
        themeMap.get(
          theme.id
        ) || {
          name:
            theme.name,

          weight: 0,
        };

      current.weight +=
        weight;

      themeMap.set(
        theme.id,
        current
      );
    }
  }

  function finish(
    map,
    limit
  ) {
    const values =
      [
        ...map.values(),
      ].sort(
        (a, b) =>
          b.weight -
          a.weight
      );

    const total =
      values.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.weight,
        0
      ) || 1;

    return values
      .slice(
        0,
        limit
      )
      .map(
        (item) => ({
          name:
            item.name,

          percent:
            Math.max(
              1,
              Math.round(
                (
                  item.weight /
                  total
                ) *
                  100
              )
            ),
        })
      );
  }

  return {
    genres:
      finish(
        genreMap,
        6
      ),

    themes:
      finish(
        themeMap,
        5
      ),
  };
}

function chooseTier({
  similarPositiveSeed,
  genreMatches,
  themeMatches,
}) {
  const matchCount =
    genreMatches +
    themeMatches;

  if (
    similarPositiveSeed ||
    (
      genreMatches >= 2 &&
      themeMatches >= 1
    )
  ) {
    return "close";
  }

  if (
    matchCount >= 2
  ) {
    return "connected";
  }

  if (
    matchCount === 1
  ) {
    return "adventurous";
  }

  return "wild";
}

function selectDiverse(
  ranked,
  count,
  targets,
  discoveryFactor,
  surprise
) {
  const selected = [];
  const used =
    new Set();

  function diversityAdjustedScore(
    item
  ) {
    if (
      !selected.length
    ) {
      return item.score;
    }

    let biggestSimilarity =
      0;

    for (
      const picked of
      selected
    ) {
      biggestSimilarity =
        Math.max(
          biggestSimilarity,

          gamesSimilarity(
            item.game,
            picked.game
          )
        );
    }

    const penaltyStrength =
      7 +
      discoveryFactor *
        15;

    return (
      item.score -
      biggestSimilarity *
        penaltyStrength
    );
  }

  function pickOne(
    pool
  ) {
    let best = null;

    let bestScore =
      -Infinity;

    for (
      const item of
      pool
    ) {
      if (
        used.has(
          item.game.id
        )
      ) {
        continue;
      }

      const adjusted =
        diversityAdjustedScore(
          item
        );

      if (
        adjusted >
        bestScore
      ) {
        best =
          item;

        bestScore =
          adjusted;
      }
    }

    if (best) {
      used.add(
        best.game.id
      );

      selected.push(
        best
      );
    }

    return best;
  }

  if (surprise) {
    const surprisePool =
      ranked.filter(
        (item) =>
          item.tier ===
          "wild"
      );

    pickOne(
      surprisePool.length
        ? surprisePool
        : ranked
    );

    return selected.slice(
      0,
      1
    );
  }

  const order =
    discoveryFactor >=
    0.7
      ? [
          "wild",
          "adventurous",
          "connected",
          "close",
        ]
      : [
          "close",
          "connected",
          "adventurous",
          "wild",
        ];

  for (
    const tier of
    order
  ) {
    const tierPool =
      ranked.filter(
        (item) =>
          item.tier ===
          tier
      );

    for (
      let index = 0;
      index <
      (
        targets[tier] ||
        0
      );
      index++
    ) {
      if (
        !pickOne(
          tierPool
        )
      ) {
        break;
      }
    }
  }

  while (
    selected.length <
    count
  ) {
    if (
      !pickOne(
        ranked
      )
    ) {
      break;
    }
  }

  return selected.slice(
    0,
    count
  );
}

function countComposition(
  items
) {
  const result = {
    close: 0,
    connected: 0,
    adventurous: 0,
    wild: 0,
  };

  for (
    const item of
    items
  ) {
    if (
      result[
        item.tier
      ] !==
      undefined
    ) {
      result[
        item.tier
      ] += 1;
    }
  }

  return result;
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
          30
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
      ? [
          ...new Set(
            body.likedIds
              .map(Number)
              .filter(
                Number.isFinite
              )
          ),
        ].slice(
          0,
          20
        )
      : [];

  const dislikedIds =
    Array.isArray(
      body.dislikedIds
    )
      ? [
          ...new Set(
            body.dislikedIds
              .map(Number)
              .filter(
                Number.isFinite
              )
          ),
        ].slice(
          0,
          20
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
          .slice(
            0,
            50
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
          .slice(
            0,
            100
          )
      : [];

  const surprise =
    body.surprise ===
    true;

  const count =
    surprise
      ? 1
      : Math.min(
          20,
          Math.max(
            6,
            Number(
              body.count
            ) || 12
          )
        );

  const discovery =
    surprise
      ? 100
      : clamp(
          body.discovery,
          0,
          100,
          55
        );

  const popularity =
    surprise
      ? Math.max(
          70,

          clamp(
            body.popularity,
            0,
            100,
            50
          )
        )
      : clamp(
          body.popularity,
          0,
          100,
          50
        );

  const hiddenGems =
    body.hiddenGems ===
    true;

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
          ...dislikedIds,
        ]),
      ].slice(
        0,
        60
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
            franchises.name,
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

          limit 60;
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

    const likedSeeds =
      seedGames.filter(
        (game) =>
          likedIds.includes(
            game.id
          )
      );

    const negativeSeeds =
      seedGames.filter(
        (game) =>
          dislikedIds.includes(
            game.id
          )
      );

    const positiveSeeds =
      seedGames.filter(
        (game) =>
          (
            seedIds.includes(
              game.id
            ) ||
            likedIds.includes(
              game.id
            )
          ) &&
          !dislikedIds.includes(
            game.id
          )
      );

    const genreWeights =
      new Map();

    const themeWeights =
      new Map();

    const dislikedGenreWeights =
      new Map();

    const dislikedThemeWeights =
      new Map();

    for (
      const game of
      seedGames
    ) {
      const isDisliked =
        dislikedIds.includes(
          game.id
        );

      const positiveWeight =
        likedIds.includes(
          game.id
        )
          ? 5
          : 3;

      const negativeWeight =
        5;

      for (
        const genre of
        game.genres || []
      ) {
        const map =
          isDisliked
            ? dislikedGenreWeights
            : genreWeights;

        map.set(
          genre.id,

          (
            map.get(
              genre.id
            ) || 0
          ) +
            (
              isDisliked
                ? negativeWeight
                : positiveWeight
            )
        );
      }

      for (
        const theme of
        game.themes || []
      ) {
        if (
          theme.id === 42
        ) {
          continue;
        }

        const map =
          isDisliked
            ? dislikedThemeWeights
            : themeWeights;

        map.set(
          theme.id,

          (
            map.get(
              theme.id
            ) || 0
          ) +
            (
              isDisliked
                ? negativeWeight
                : positiveWeight
            )
        );
      }
    }

    const tasteFingerprint =
      buildTasteFingerprint(
        positiveSeeds,
        seedIds,
        likedIds
      );

    const similarIds =
      [
        ...new Set(
          positiveSeeds.flatMap(
            (game) =>
              game.similar_games ||
              []
          )
        ),
      ].slice(
        0,
        150
      );

    const candidates =
      new Map();

    function addCandidates(
      games,
      source
    ) {
      for (
        const game of
        games || []
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
              franchises.name,
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

            limit 150;
          `
        );

      addCandidates(
        similarGames,
        "similar"
      );
    }

    const genreIds =
      [
        ...genreWeights.entries(),
      ]
        .sort(
          (a, b) =>
            b[1] -
            a[1]
        )
        .map(
          ([id]) =>
            id
        )
        .slice(
          0,
          10
        );

    const themeIds =
      [
        ...themeWeights.entries(),
      ]
        .sort(
          (a, b) =>
            b[1] -
            a[1]
        )
        .map(
          ([id]) =>
            id
        )
        .slice(
          0,
          10
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
        discovery >= 75 ||
        popularity >= 65
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
              franchises.name,
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

            limit 150;
          `
        );

      addCandidates(
        discoveryGames,
        "discovery"
      );
    }

    if (
      discovery >= 30 ||
      hiddenGems ||
      popularity >= 45 ||
      surprise
    ) {
      const broadMinimumVotes =
        hiddenGems ||
        popularity >= 70
          ? 3
          : 5;

      const hiddenUpperBound =
        hiddenGems
          ? "& total_rating_count <= 500"
          : popularity >=
            80
          ? "& total_rating_count <= 900"
          : "";

      const offsetBucket =
        Math.floor(
          randomFromSeed(
            `${nonce}-pool`
          ) *
            4
        );

      const offset =
        discovery >= 75 &&
        !hiddenGems &&
        popularity < 70
          ? offsetBucket *
            75
          : 0;

      const explorerGames =
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
              franchises.name,
              total_rating,
              total_rating_count,
              rating,
              rating_count,
              summary,
              url;

            where
              version_parent = null
              & themes != (42)
              & total_rating_count >= ${broadMinimumVotes}
              ${hiddenUpperBound};

            sort total_rating desc;

            limit 150;

            offset ${offset};
          `
        );

      addCandidates(
        explorerGames,

        hiddenGems
          ? "hidden"
          : "wild"
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

    const familiarity =
      1 -
      discoveryFactor;

    const popularityFactor =
      popularity /
      100;

    const obscurityFactor =
      hiddenGems
        ? Math.max(
            0.82,
            popularityFactor
          )
        : popularityFactor;

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

            let negativeGenreScore =
              0;

            let negativeThemeScore =
              0;

            let genreMatches =
              0;

            let themeMatches =
              0;

            for (
              const genre of
              game.genres ||
              []
            ) {
              const positive =
                genreWeights.get(
                  genre.id
                ) || 0;

              const negative =
                dislikedGenreWeights.get(
                  genre.id
                ) || 0;

              genreScore +=
                positive;

              negativeGenreScore +=
                negative;

              if (
                positive >
                0
              ) {
                genreMatches +=
                  1;
              }
            }

            for (
              const theme of
              game.themes ||
              []
            ) {
              const positive =
                themeWeights.get(
                  theme.id
                ) || 0;

              const negative =
                dislikedThemeWeights.get(
                  theme.id
                ) || 0;

              themeScore +=
                positive;

              negativeThemeScore +=
                negative;

              if (
                positive >
                0
              ) {
                themeMatches +=
                  1;
              }
            }

            const similarPositiveSeed =
              positiveSeeds.find(
                (seed) =>
                  (
                    seed.similar_games ||
                    []
                  ).includes(
                    game.id
                  )
              );

            const similarNegativeSeed =
              negativeSeeds.find(
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

            const overlap =
              genreScore +
              themeScore;

            const cappedGenreScore =
              Math.min(
                genreScore,
                14
              );

            const cappedThemeScore =
              Math.min(
                themeScore,
                14
              );

            const tier =
              chooseTier({
                similarPositiveSeed,
                genreMatches,
                themeMatches,
              });

            let score = 0;

            score +=
              cappedGenreScore *
              (
                0.25 +
                familiarity *
                  3.9
              );

            score +=
              cappedThemeScore *
              (
                0.3 +
                familiarity *
                  4.2
              );

            if (
              similarPositiveSeed
            ) {
              const likedBonus =
                likedIds.includes(
                  similarPositiveSeed.id
                )
                  ? 5
                  : 0;

              score +=
                2 +
                familiarity *
                  18 +
                likedBonus;
            }

            if (
              vibeMatch
            ) {
              score += 8;
            }

            score -=
              Math.min(
                negativeGenreScore,
                14
              ) *
              1.15;

            score -=
              Math.min(
                negativeThemeScore,
                14
              ) *
              1.35;

            if (
              similarNegativeSeed
            ) {
              score -= 18;
            }

            const qualityScore =
              Math.min(
                rating /
                  18,
                5.5
              );

            score +=
              qualityScore;

            const mainstreamStrength =
              Math.min(
                Math.log10(
                  ratingCount +
                    1
                ) /
                  3.2,
                1
              );

            score +=
              mainstreamStrength *
              (
                1 -
                obscurityFactor
              ) *
              9;

            if (
              ratingCount >= 5 &&
              ratingCount <=
                600
            ) {
              const hiddenQuality =
                Math.max(
                  0,
                  (
                    rating -
                    62
                  ) /
                    38
                );

              const rarity =
                1 -
                Math.min(
                  Math.log10(
                    ratingCount +
                      1
                  ) /
                    3,
                  1
                );

              score +=
                obscurityFactor *
                (
                  4 +
                  hiddenQuality *
                    7 +
                  rarity *
                    5
                );
            }

            if (
              hiddenGems &&
              rating >= 70 &&
              ratingCount >= 5 &&
              ratingCount <=
                500
            ) {
              score += 9;
            }

            if (
              ratingCount < 3
            ) {
              score -= 5;
            }

            if (
              game.sources.has(
                "discovery"
              )
            ) {
              score +=
                1.5 +
                discoveryFactor *
                  2.5;
            }

            if (
              game.sources.has(
                "wild"
              )
            ) {
              score +=
                discoveryFactor *
                13;
            }

            if (
              game.sources.has(
                "hidden"
              )
            ) {
              score +=
                obscurityFactor *
                12;
            }

            if (
              discovery >= 50
            ) {
              if (
                tier ===
                "wild"
              ) {
                score +=
                  discoveryFactor *
                    18;
              } else if (
                tier ===
                "adventurous"
              ) {
                score +=
                  discoveryFactor *
                    10;
              } else if (
                tier ===
                "connected"
              ) {
                score +=
                  discoveryFactor *
                    3;
              } else {
                score -=
                  discoveryFactor *
                  Math.min(
                    overlap,
                    20
                  ) *
                  0.55;
              }
            }

            if (
              surprise &&
              tier ===
                "wild"
            ) {
              score += 30;
            }

            score +=
              randomFromSeed(
                `${nonce}-${game.id}`
              ) *
              (
                2 +
                discoveryFactor *
                  11 +
                (
                  surprise
                    ? 10
                    : 0
                )
              );

            let reason =
              "Taste match";

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
              tier ===
                "wild" &&
              discovery >= 75
            ) {
              if (
                vibeMatch
              ) {
                reason =
                  `Wild card · ${vibeMatch.replace(
                    "-",
                    " "
                  )} vibe`;
              } else if (
                (
                  game.sources.has(
                    "hidden"
                  ) ||
                  hiddenGems
                ) &&
                rating >= 70 &&
                ratingCount <=
                  500
              ) {
                reason =
                  "Hidden gem outside your usual genres";
              } else {
                reason =
                  "Outside your usual genres";
              }
            } else if (
              (
                game.sources.has(
                  "hidden"
                ) ||
                hiddenGems
              ) &&
              rating >= 70 &&
              ratingCount <=
                500
            ) {
              reason =
                "Hidden gem with strong ratings";
            } else if (
              similarPositiveSeed
            ) {
              reason =
                `Similar to ${similarPositiveSeed.name}`;
            } else if (
              matchingTheme
            ) {
              reason =
                `Shares ${matchingTheme.name} themes with your taste`;
            } else if (
              matchingGenre &&
              tier ===
                "adventurous"
            ) {
              reason =
                `A different take on ${matchingGenre.name}`;
            } else if (
              matchingGenre
            ) {
              reason =
                `${matchingGenre.name} connection`;
            } else if (
              vibeMatch
            ) {
              reason =
                `${vibeMatch.replace(
                  "-",
                  " "
                )} vibe`;
            }

            return {
              game,
              score,
              reason,
              tier,
            };
          }
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    const targets =
      allocateComposition(
        count,
        discovery,
        surprise
      );

    const selected =
      selectDiverse(
        ranked,
        count,
        targets,
        discoveryFactor,
        surprise
      );

    const games =
      selected.map(
        ({
          game,
          reason,
          tier,
        }) =>
          mapGame(
            game,
            reason,
            tier
          )
      );

    const composition =
      countComposition(
        selected
      );

    return Response.json(
      {
        games,

        meta: {
          discovery,

          discoveryMode:
            getDiscoveryMode(
              discovery
            ),

          popularity,

          popularityLabel:
            getPopularityLabel(
              popularity,
              hiddenGems
            ),

          hiddenGems,

          surprise,

          seedGames:
            primarySeeds.map(
              (game) =>
                game.name
            ),

          likedSeedGames:
            likedSeeds.map(
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

          tasteFingerprint,

          composition,

          requestedComposition:
            targets,
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