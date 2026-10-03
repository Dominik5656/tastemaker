import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPOTIFY_API =
  "https://api.spotify.com/v1";

function normalize(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function hashString(value) {
  let hash = 2166136261;

  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    hash ^=
      value.charCodeAt(i);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

function seededShuffle(
  items,
  seedText
) {
  const result = [
    ...items,
  ];

  let seed =
    hashString(
      seedText ||
        "tastemaker"
    );

  function random() {
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

  for (
    let i =
      result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        random() *
          (i + 1)
      );

    [
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function mapTrack(
  track,
  source = "discovery"
) {
  return {
    id:
      track.id,

    title:
      track.name,

    artist:
      (
        track.artists ||
        []
      )
        .map(
          (artist) =>
            artist.name
        )
        .join(", "),

    artists:
      (
        track.artists ||
        []
      ).map(
        (artist) => ({
          id:
            artist.id,

          name:
            artist.name,
        })
      ),

    album:
      track.album?.name ||
      null,

    image:
      track.album
        ?.images?.[0]
        ?.url ||
      null,

    url:
      track
        .external_urls
        ?.spotify ||
      null,

    uri:
      track.uri,

    source,
  };
}

async function getClientToken() {
  const clientId =
    process.env
      .SPOTIFY_CLIENT_ID;

  const clientSecret =
    process.env
      .SPOTIFY_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    throw Object.assign(
      new Error(
        "Spotify credentials are missing."
      ),
      {
        status: 500,
      }
    );
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
              "client_credentials",
          }),

        cache:
          "no-store",
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.access_token
  ) {
    throw Object.assign(
      new Error(
        "Spotify authentication failed."
      ),
      {
        status: 502,
      }
    );
  }

  return data.access_token;
}

async function refreshUserToken(
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

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function applyRefreshedToken(
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

async function spotify(
  path,
  token
) {
  const response =
    await fetch(
      `${SPOTIFY_API}${path}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    const error =
      new Error(
        response.status ===
          429
          ? "Spotify is receiving too many requests. Try again in a moment."
          : `Spotify request failed (${response.status}).`
      );

    error.status =
      response.status ===
        429
        ? 429
        : 502;

    throw error;
  }

  return response.json();
}

async function searchTracks(
  query,
  token,
  offset = 0
) {
  const params =
    new URLSearchParams({
      q:
        query,

      type:
        "track",

      market:
        "SK",

      limit:
        "10",

      offset:
        String(
          Math.max(
            0,
            offset
          )
        ),
    });

  const data =
    await spotify(
      `/search?${params.toString()}`,
      token
    );

  return (
    data.tracks
      ?.items ||
    []
  );
}

async function findArtist(
  name,
  token
) {
  const params =
    new URLSearchParams({
      q:
        name,

      type:
        "artist",

      market:
        "SK",

      limit:
        "10",
    });

  const data =
    await spotify(
      `/search?${params.toString()}`,
      token
    );

  const artists =
    data.artists
      ?.items ||
    [];

  const wanted =
    normalize(name);

  return (
    artists.find(
      (artist) =>
        normalize(
          artist.name
        ) ===
        wanted
    ) ||
    artists[0] ||
    null
  );
}

function trackHasExcludedArtist(
  track,
  excludedArtistNames
) {
  if (
    !excludedArtistNames.size
  ) {
    return false;
  }

  return (
    track.artists ||
    []
  ).some(
    (artist) =>
      excludedArtistNames.has(
        normalize(
          artist.name
        )
      )
  );
}

function addTracks(
  bucket,
  tracks,
  source,
  knownFavoriteKeys,
  excludedArtistNames,
  excludedTrackIds
) {
  for (
    const track of
    tracks
  ) {
    if (
      !track?.id ||
      !track?.uri ||
      !track?.name
    ) {
      continue;
    }

    if (
      excludedTrackIds.has(
        track.id
      )
    ) {
      continue;
    }

    if (
      trackHasExcludedArtist(
        track,
        excludedArtistNames
      )
    ) {
      continue;
    }

    const primaryArtist =
      track.artists?.[0]
        ?.name || "";

    const favoriteKey =
      `${normalize(
        primaryArtist
      )}::${normalize(
        track.name
      )}`;

    if (
      knownFavoriteKeys.has(
        favoriteKey
      )
    ) {
      continue;
    }

    bucket.set(
      track.id,

      mapTrack(
        track,
        source
      )
    );
  }
}

function pickUnique(
  output,
  used,
  items,
  amount
) {
  for (
    const item of
    items
  ) {
    if (
      output.length >=
      amount
    ) {
      break;
    }

    if (
      !item?.id ||
      used.has(
        item.id
      )
    ) {
      continue;
    }

    used.add(
      item.id
    );

    output.push(
      item
    );
  }
}

function json(
  data,
  status = 200,
  refreshed = null
) {
  const response =
    NextResponse.json(
      data,
      {
        status,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );

  applyRefreshedToken(
    response,
    refreshed
  );

  return response;
}

export async function GET(
  request
) {
  const query =
    new URL(
      request.url
    ).searchParams
      .get("q")
      ?.trim();

  if (
    !query ||
    query.length > 200
  ) {
    return Response.json(
      {
        error:
          "Enter a search query between 1 and 200 characters.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const token =
      await getClientToken();

    const found = [];

    for (
      let offset = 0;
      offset < 30;
      offset += 10
    ) {
      const items =
        await searchTracks(
          query,
          token,
          offset
        );

      found.push(
        ...items
      );

      if (
        items.length < 10
      ) {
        break;
      }
    }

    const unique = [
      ...new Map(
        found.map(
          (track) => [
            track.id,
            track,
          ]
        )
      ).values(),
    ];

    return Response.json({
      tracks:
        unique
          .slice(
            0,
            30
          )
          .map(
            (track) =>
              mapTrack(
                track,
                "search"
              )
          ),

      count:
        Math.min(
          unique.length,
          30
        ),
    });
  } catch (error) {
    console.error(
      "Spotify search error:",
      error
    );

    return Response.json(
      {
        error:
          error.message ||
          "Could not connect to Spotify.",
      },
      {
        status:
          error.status ||
          502,
      }
    );
  }
}

export async function POST(
  request
) {
  let body;

  try {
    body =
      await request.json();
  } catch {
    return json(
      {
        error:
          "Invalid request data.",
      },
      400
    );
  }

  const artists =
    Array.isArray(
      body.artists
    )
      ? body.artists
          .filter(
            (artist) =>
              typeof artist ===
              "string"
          )
          .map(
            (artist) =>
              artist.trim()
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            8
          )
      : [];

  if (
    !artists.length
  ) {
    return json(
      {
        error:
          "Add at least one artist first.",
      },
      400
    );
  }

  const count =
    Math.min(
      30,
      Math.max(
        10,
        Number(
          body.count
        ) || 10
      )
    );

  const discovery =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          body.discovery
        ) || 50
      )
    );

  const nonce =
    String(
      body.nonce ||
        Date.now()
    );

  const favoriteSongs =
    body.favoriteSongs &&
    typeof body.favoriteSongs ===
      "object"
      ? body.favoriteSongs
      : {};

  const likedTracks =
    Array.isArray(
      body.likedTracks
    )
      ? body.likedTracks.slice(
          0,
          20
        )
      : [];

  const excludedTrackIds =
    new Set(
      [
        ...(
          Array.isArray(
            body.excludeIds
          )
            ? body.excludeIds
            : []
        ),

        ...(
          Array.isArray(
            body.dislikedTrackIds
          )
            ? body.dislikedTrackIds
            : []
        ),
      ]
        .filter(
          (id) =>
            typeof id ===
            "string"
        )
        .slice(
          0,
          150
        )
    );

  const excludedArtistNames =
    new Set(
      (
        Array.isArray(
          body.excludedArtists
        )
          ? body.excludedArtists
          : []
      )
        .filter(
          (name) =>
            typeof name ===
            "string"
        )
        .map(
          normalize
        )
        .filter(
          Boolean
        )
        .slice(
          0,
          30
        )
    );

  const knownFavoriteKeys =
    new Set();

  for (
    const artist of
    artists
  ) {
    const songs =
      favoriteSongs[
        normalize(
          artist
        )
      ] || [];

    for (
      const song of
      Array.isArray(
        songs
      )
        ? songs
        : []
    ) {
      if (
        typeof song ===
        "string"
      ) {
        knownFavoriteKeys.add(
          `${normalize(
            artist
          )}::${normalize(
            song
          )}`
        );
      }
    }
  }

  const likedArtistNames =
    [];

  for (
    const track of
    likedTracks
  ) {
    const trackArtists =
      Array.isArray(
        track?.artists
      )
        ? track.artists.map(
            (artist) =>
              typeof artist ===
              "string"
                ? artist
                : artist?.name
          )
        : typeof track?.artist ===
          "string"
        ? track.artist.split(
            ","
          )
        : [];

    for (
      const name of
      trackArtists
    ) {
      const cleanName =
        typeof name ===
        "string"
          ? name.trim()
          : "";

      if (
        !cleanName ||
        excludedArtistNames.has(
          normalize(
            cleanName
          )
        )
      ) {
        continue;
      }

      likedArtistNames.push(
        cleanName
      );
    }
  }

  const uniqueLikedArtists =
    [
      ...new Map(
        likedArtistNames.map(
          (name) => [
            normalize(name),
            name,
          ]
        )
      ).values(),
    ].slice(
      0,
      5
    );

  try {
    const token =
      await getClientToken();

    const artistMatches =
      (
        await Promise.all(
          artists.map(
            (artist) =>
              findArtist(
                artist,
                token
              )
          )
        )
      ).filter(
        Boolean
      );

    const likedArtistMatches =
      (
        await Promise.all(
          uniqueLikedArtists.map(
            (artist) =>
              findArtist(
                artist,
                token
              )
          )
        )
      ).filter(
        Boolean
      );

    if (
      !artistMatches.length
    ) {
      return json({
        tracks: [],

        meta: {
          discovery,

          seedArtists:
            artists,

          usedGenres:
            [],

          connectedTasteUsed:
            false,

          feedbackUsed:
            likedArtistMatches.length >
            0,
        },
      });
    }

    const close =
      new Map();

    const collaborator =
      new Map();

    const adventurous =
      new Map();

    const feedback =
      new Map();

    const collaboratorNames =
      new Map();

    const genreNames =
      new Set();

    const seedIds =
      new Set(
        artistMatches.map(
          (artist) =>
            artist.id
        )
      );

    const seedNames =
      new Set(
        artistMatches.map(
          (artist) =>
            normalize(
              artist.name
            )
        )
      );

    await Promise.all(
      artistMatches.map(
        async (
          artist
        ) => {
          const offsetBase =
            (
              hashString(
                `${nonce}-${artist.id}`
              ) % 3
            ) * 10;

          const offsets =
            discovery < 35
              ? [
                  0,
                  10,
                ]
              : [
                  offsetBase,

                  (
                    offsetBase +
                    10
                  ) % 30,

                  (
                    offsetBase +
                    20
                  ) % 30,
                ];

          const batches =
            await Promise.all(
              offsets.map(
                (offset) =>
                  searchTracks(
                    `artist:"${artist.name.replace(
                      /"/g,
                      ""
                    )}"`,
                    token,
                    offset
                  )
              )
            );

          for (
            const tracks of
            batches
          ) {
            const exactArtistTracks =
              tracks.filter(
                (track) =>
                  (
                    track.artists ||
                    []
                  ).some(
                    (
                      trackArtist
                    ) =>
                      trackArtist.id ===
                        artist.id ||
                      normalize(
                        trackArtist.name
                      ) ===
                        normalize(
                          artist.name
                        )
                  )
              );

            addTracks(
              close,

              exactArtistTracks,

              "close",

              knownFavoriteKeys,

              excludedArtistNames,

              excludedTrackIds
            );

            for (
              const track of
              exactArtistTracks
            ) {
              for (
                const trackArtist of
                track.artists ||
                []
              ) {
                if (
                  trackArtist.id !==
                    artist.id &&
                  !seedIds.has(
                    trackArtist.id
                  ) &&
                  !seedNames.has(
                    normalize(
                      trackArtist.name
                    )
                  ) &&
                  !excludedArtistNames.has(
                    normalize(
                      trackArtist.name
                    )
                  )
                ) {
                  collaboratorNames.set(
                    trackArtist.id ||
                      normalize(
                        trackArtist.name
                      ),

                    trackArtist.name
                  );
                }
              }
            }
          }

          try {
            const fullArtist =
              await spotify(
                `/artists/${artist.id}`,
                token
              );

            for (
              const genre of
              fullArtist.genres ||
              []
            ) {
              if (
                typeof genre ===
                  "string" &&
                genre.trim()
              ) {
                genreNames.add(
                  genre.trim()
                );
              }
            }
          } catch (
            error
          ) {
            console.warn(
              `Could not load genres for ${artist.name}:`,
              error.message
            );
          }
        }
      )
    );

    if (
      likedArtistMatches.length
    ) {
      await Promise.all(
        likedArtistMatches.map(
          async (
            artist,
            index
          ) => {
            const offset =
              (
                hashString(
                  `${nonce}-liked-${artist.id}-${index}`
                ) % 2
              ) * 10;

            const tracks =
              await searchTracks(
                `artist:"${artist.name.replace(
                  /"/g,
                  ""
                )}"`,
                token,
                offset
              );

            addTracks(
              feedback,

              tracks,

              "feedback",

              knownFavoriteKeys,

              excludedArtistNames,

              excludedTrackIds
            );
          }
        )
      );
    }

    const collaboratorList =
      seededShuffle(
        [
          ...collaboratorNames.values(),
        ],
        `${nonce}-collaborators`
      ).slice(
        0,
        discovery < 30
          ? 3
          : 6
      );

    await Promise.all(
      collaboratorList.map(
        async (
          name,
          index
        ) => {
          const offset =
            discovery > 65
              ? (
                  (
                    index +
                    hashString(
                      nonce
                    )
                  ) %
                  3
                ) * 10
              : 0;

          const tracks =
            await searchTracks(
              `artist:"${name.replace(
                /"/g,
                ""
              )}"`,
              token,
              offset
            );

          addTracks(
            collaborator,

            tracks,

            "collaborator",

            knownFavoriteKeys,

            excludedArtistNames,

            excludedTrackIds
          );
        }
      )
    );

    const genres =
      seededShuffle(
        [
          ...genreNames,
        ],
        `${nonce}-genres`
      ).slice(
        0,
        3
      );

    if (
      discovery >= 35 &&
      genres.length
    ) {
      await Promise.all(
        genres.map(
          async (
            genre,
            index
          ) => {
            const offset =
              (
                hashString(
                  `${nonce}-${genre}-${index}`
                ) % 3
              ) * 10;

            const tracks =
              await searchTracks(
                `genre:"${genre.replace(
                  /"/g,
                  ""
                )}"`,
                token,
                offset
              );

            addTracks(
              adventurous,

              tracks,

              "genre",

              knownFavoriteKeys,

              excludedArtistNames,

              excludedTrackIds
            );
          }
        )
      );
    }

    let connectedTasteUsed =
      false;

    let refreshedUserToken =
      null;

    let userToken =
      request.cookies.get(
        "spotify_access_token"
      )?.value ||
      null;

    const refreshToken =
      request.cookies.get(
        "spotify_refresh_token"
      )?.value ||
      null;

    if (
      discovery >= 55 &&
      (
        userToken ||
        refreshToken
      )
    ) {
      async function getTopArtists(
        tokenToUse
      ) {
        return fetch(
          `${SPOTIFY_API}/me/top/artists?time_range=medium_term&limit=5`,
          {
            headers: {
              Authorization:
                `Bearer ${tokenToUse}`,
            },

            cache:
              "no-store",
          }
        );
      }

      try {
        let topResponse =
          userToken
            ? await getTopArtists(
                userToken
              )
            : null;

        if (
          (
            !topResponse ||
            topResponse.status ===
              401
          ) &&
          refreshToken
        ) {
          refreshedUserToken =
            await refreshUserToken(
              refreshToken
            );

          userToken =
            refreshedUserToken
              ?.access_token ||
            null;

          if (userToken) {
            topResponse =
              await getTopArtists(
                userToken
              );
          }
        }

        if (
          topResponse?.ok
        ) {
          const topData =
            await topResponse.json();

          const topArtists =
            (
              topData.items ||
              []
            ).filter(
              (artist) =>
                !seedIds.has(
                  artist.id
                ) &&
                !excludedArtistNames.has(
                  normalize(
                    artist.name
                  )
                )
            );

          connectedTasteUsed =
            topArtists.length >
            0;

          await Promise.all(
            topArtists
              .slice(
                0,
                4
              )
              .map(
                async (
                  artist,
                  index
                ) => {
                  const offset =
                    (
                      (
                        index +
                        hashString(
                          nonce
                        )
                      ) %
                      2
                    ) * 10;

                  const tracks =
                    await searchTracks(
                      `artist:"${artist.name.replace(
                        /"/g,
                        ""
                      )}"`,
                      token,
                      offset
                    );

                  addTracks(
                    adventurous,

                    tracks,

                    "spotify-taste",

                    knownFavoriteKeys,

                    excludedArtistNames,

                    excludedTrackIds
                  );
                }
              )
          );
        }
      } catch (
        error
      ) {
        console.warn(
          "Spotify top-artists personalization skipped:",
          error.message
        );
      }
    }

    const closeItems =
      seededShuffle(
        [
          ...close.values(),
        ],
        `${nonce}-close`
      );

    const collaboratorItems =
      seededShuffle(
        [
          ...collaborator.values(),
        ],
        `${nonce}-collab`
      );

    const adventurousItems =
      seededShuffle(
        [
          ...adventurous.values(),
        ],
        `${nonce}-adventure`
      );

    const feedbackItems =
      seededShuffle(
        [
          ...feedback.values(),
        ],
        `${nonce}-feedback`
      );

    const progress =
      discovery / 100;

    const feedbackQuota =
      likedArtistMatches.length
        ? Math.max(
            1,
            Math.round(
              count *
                0.22
            )
          )
        : 0;

    const remainingCount =
      Math.max(
        0,
        count -
          feedbackQuota
      );

    const closeQuota =
      Math.max(
        2,

        Math.round(
          remainingCount *
            (
              0.76 -
              0.54 *
                progress
            )
        )
      );

    const collaboratorQuota =
      Math.max(
        1,

        Math.round(
          remainingCount *
            (
              0.18 +
              0.28 *
                progress
            )
        )
      );

    const output = [];

    const used =
      new Set(
        excludedTrackIds
      );

    pickUnique(
      output,
      used,
      feedbackItems,
      feedbackQuota
    );

    pickUnique(
      output,
      used,
      closeItems,
      feedbackQuota +
        closeQuota
    );

    pickUnique(
      output,
      used,
      collaboratorItems,
      feedbackQuota +
        closeQuota +
        collaboratorQuota
    );

    pickUnique(
      output,
      used,
      adventurousItems,
      count
    );

    const allCandidates =
      seededShuffle(
        [
          ...feedbackItems,
          ...closeItems,
          ...collaboratorItems,
          ...adventurousItems,
        ],

        `${nonce}-fallback`
      );

    pickUnique(
      output,
      used,
      allCandidates,
      count
    );

    const response =
      json(
        {
          tracks:
            output.slice(
              0,
              count
            ),

          meta: {
            discovery,

            seedArtists:
              artistMatches.map(
                (artist) =>
                  artist.name
              ),

            usedGenres:
              genres,

            connectedTasteUsed,

            feedbackUsed:
              likedArtistMatches.length >
              0,

            excludedArtists:
              [
                ...excludedArtistNames,
              ],
          },
        },
        200,
        refreshedUserToken
      );

    return response;
  } catch (error) {
    console.error(
      "TasteMaker discovery error:",
      error
    );

    return json(
      {
        error:
          error.message ||
          "Could not build recommendations.",
      },
      error.status ||
        502
    );
  }
}