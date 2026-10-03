export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedToken = null;
let tokenExpiresAt = 0;

let cachedStores = null;
let storesCachedAt = 0;

function normalizeTitle(
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
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function titleScore(
  a,
  b
) {
  const left =
    normalizeTitle(a);

  const right =
    normalizeTitle(b);

  if (
    !left ||
    !right
  ) {
    return 0;
  }

  if (
    left === right
  ) {
    return 100;
  }

  const leftWords =
    left.split(" ");

  const rightWords =
    right.split(" ");

  const rightSet =
    new Set(
      rightWords
    );

  const shared =
    leftWords.filter(
      (word) =>
        rightSet.has(
          word
        )
    ).length;

  const coverage =
    shared /
    Math.max(
      leftWords.length,
      rightWords.length
    );

  let score =
    coverage * 80;

  if (
    leftWords[0] ===
    rightWords[0]
  ) {
    score += 10;
  }

  if (
    left.startsWith(
      `${right} `
    ) ||
    right.startsWith(
      `${left} `
    )
  ) {
    score += 15;
  }

  return Math.min(
    100,
    score
  );
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

  return new Date(
    timestamp * 1000
  ).getUTCFullYear();
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

  if (!response.ok) {
    throw new Error(
      "IGDB authentication failed."
    );
  }

  const data =
    await response.json();

  if (
    !data.access_token
  ) {
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
  query
) {
  const clientId =
    process.env
      .IGDB_CLIENT_ID;

  const token =
    await getAccessToken();

  const response =
    await fetch(
      "https://api.igdb.com/v4/games",
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

  if (!response.ok) {
    const text =
      await response.text();

    console.error(
      "IGDB deals search error:",
      response.status,
      text
    );

    throw new Error(
      `IGDB request failed (${response.status}).`
    );
  }

  return response.json();
}

async function getCheapSharkStores() {
  if (
    cachedStores &&
    Date.now() -
      storesCachedAt <
      24 *
        60 *
        60 *
        1000
  ) {
    return cachedStores;
  }

  const response =
    await fetch(
      "https://www.cheapshark.com/api/1.0/stores",
      {
        headers: {
          "User-Agent":
            "TasteMaker/1.0 game-price-search",

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return {};
  }

  const stores =
    await response.json();

  cachedStores =
    Object.fromEntries(
      stores.map(
        (store) => [
          store.storeID,
          store.storeName,
        ]
      )
    );

  storesCachedAt =
    Date.now();

  return cachedStores;
}

async function searchCheapShark(
  query
) {
  const params =
    new URLSearchParams({
      title:
        query,

      pageSize:
        "60",

      sortBy:
        "Price",
    });

  const response =
    await fetch(
      `https://www.cheapshark.com/api/1.0/deals?${params.toString()}`,
      {
        headers: {
          "User-Agent":
            "TasteMaker/1.0 game-price-search",

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  if (
    response.status ===
    429
  ) {
    throw new Error(
      "The price service is busy. Try again in a moment."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Price search failed (${response.status}).`
    );
  }

  return response.json();
}

function mapDeal(
  deal,
  storeNames
) {
  const salePrice =
    Number(
      deal.salePrice ||
        0
    );

  const normalPrice =
    Number(
      deal.normalPrice ||
        salePrice ||
        0
    );

  const savings =
    Math.max(
      0,
      Number(
        deal.savings ||
          0
      )
    );

  return {
    dealId:
      deal.dealID,

    storeId:
      deal.storeID,

    storeName:
      storeNames[
        deal.storeID
      ] ||
      `Store ${deal.storeID}`,

    salePrice,

    normalPrice,

    savings:
      Math.round(
        savings
      ),

    isOnSale:
      String(
        deal.isOnSale
      ) === "1" &&
      normalPrice >
        salePrice,

    url:
      `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,

    steamRatingPercent:
      Number(
        deal.steamRatingPercent ||
          0
      ),

    steamRatingText:
      deal.steamRatingText ||
      null,

    metacriticScore:
      Number(
        deal.metacriticScore ||
          0
      ),
  };
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
          "Enter a game name between 2 and 100 characters.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const safeQuery =
      query
        .replace(
          /\\/g,
          "\\\\"
        )
        .replace(
          /"/g,
          '\\"'
        );

    const [
      games,
      cheapSharkDeals,
      storeNames,
    ] =
      await Promise.all([
        igdbRequest(
          `
            search "${safeQuery}";

            fields
              name,
              cover.image_id,
              first_release_date,
              genres.name,
              platforms.name,
              total_rating,
              rating,
              summary,
              url;

            where
              version_parent = null
              & themes != (42);

            limit 12;
          `
        ),

        searchCheapShark(
          query
        ),

        getCheapSharkStores(),
      ]);

    const results =
      games.map(
        (game) => {
          const matchedDeals =
            cheapSharkDeals
              .map(
                (deal) => ({
                  deal,

                  score:
                    titleScore(
                      game.name,
                      deal.title
                    ),
                })
              )
              .filter(
                (item) =>
                  item.score >=
                  60
              )
              .sort(
                (
                  a,
                  b
                ) => {
                  if (
                    b.score !==
                    a.score
                  ) {
                    return (
                      b.score -
                      a.score
                    );
                  }

                  return (
                    Number(
                      a.deal
                        .salePrice
                    ) -
                    Number(
                      b.deal
                        .salePrice
                    )
                  );
                }
              )
              .map(
                (item) =>
                  mapDeal(
                    item.deal,
                    storeNames
                  )
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  a.salePrice -
                  b.salePrice
              )
              .slice(
                0,
                5
              );

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

            summary:
              game.summary ||
              "",

            url:
              game.url ||
              null,

            bestDeal:
              matchedDeals[0] ||
              null,

            offers:
              matchedDeals,
          };
        }
      );

    return Response.json(
      {
        games:
          results,

        currency:
          "USD",

        priceCoverage:
          "PC digital stores",
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
      "Game deals route error:",
      error
    );

    return Response.json(
      {
        error:
          error.message ||
          "Could not search game prices.",
      },
      {
        status: 502,
      }
    );
  }
}