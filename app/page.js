"use client";
import { useEffect, useMemo, useState } from "react";

function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function distance(a, b) {
  const matrix = Array.from(
    { length: b.length + 1 },
    () => Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++)
    matrix[0][i] = i;

  for (let j = 0; j <= b.length; j++)
    matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] =
          matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function Icon({
  name,
  size = 18,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    sparkles: (
      <>
        <path d="M12 3l1.15 3.3L16.5 7.5l-3.35 1.2L12 12l-1.15-3.3L7.5 7.5l3.35-1.2L12 3Z" />
        <path d="M18.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
      </>
    ),

    music: (
      <>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </>
    ),

    spotify: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7.3 9.8c3.3-1 6.8-.8 9.8.7" />
        <path d="M7.9 12.7c2.7-.75 5.7-.55 8.2.65" />
        <path d="M8.5 15.4c2.15-.55 4.4-.4 6.4.5" />
      </>
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),

    copy: (
      <>
        <rect
          x="8"
          y="8"
          width="11"
          height="11"
          rx="2"
        />
        <path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="m6 7 1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 9A7 7 0 0 1 18.7 7.7L20 12" />
        <path d="M17.9 15A7 7 0 0 1 5.3 16.3L4 12" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    up: (
      <>
        <path d="M7 10v11" />
        <path d="M3 10h4v11H3z" />
        <path d="M7 19h9.4a2 2 0 0 0 1.9-1.4l2.1-7A2 2 0 0 0 18.5 8H14l.7-3.1A2.4 2.4 0 0 0 10.2 3L7 10Z" />
      </>
    ),

    down: (
      <>
        <path d="M7 14V3" />
        <path d="M3 3h4v11H3z" />
        <path d="M7 5h9.4a2 2 0 0 1 1.9 1.4l2.1 7a2 2 0 0 1-1.9 2.6H14l.7 3.1a2.4 2.4 0 0 1-4.5 1.9L7 14Z" />
      </>
    ),

    ban: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m5.6 5.6 12.8 12.8" />
      </>
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || null}
    </svg>
  );
}

function sourceLabel(source) {
  if (source === "close")
    return "Close match";

  if (source === "collaborator")
    return "Connected artist";

  if (source === "genre")
    return "Genre discovery";

  if (source === "spotify-taste")
    return "Your Spotify taste";

  if (source === "feedback")
    return "More like your picks";

  return "Discovery";
}

function buildMixName(
  discovery,
  meta,
  tracks
) {
  const soft = [
    "Velvet",
    "Quiet",
    "Soft",
    "Golden",
    "Sunday",
    "Afterglow",
  ];

  const balanced = [
    "Neon",
    "Midnight",
    "Parallel",
    "Electric",
    "Satellite",
    "Side B",
  ];

  const wild = [
    "Static",
    "Uncharted",
    "Off Grid",
    "Wild Signal",
    "After Hours",
    "Deep Cut",
  ];

  const nouns = [
    "Signal",
    "Drift",
    "Frequency",
    "Room",
    "Radio",
    "Current",
    "Archive",
    "Pulse",
  ];

  const firstPool =
    discovery <= 30
      ? soft
      : discovery <= 70
      ? balanced
      : wild;

  const seed =
    (tracks?.[0]?.id ||
      "tastemaker") +
    (meta?.usedGenres?.join("") ||
      "") +
    String(Date.now());

  let total = 0;

  for (
    let i = 0;
    i < seed.length;
    i++
  ) {
    total +=
      seed.charCodeAt(i);
  }

  return `${
    firstPool[
      total % firstPool.length
    ]
  } ${
    nouns[
      (total * 7) %
        nouns.length
    ]
  }`;
}

function CoverCollage({
  tracks,
  large = false,
}) {
  const images = tracks
    .filter(
      (track) => track.image
    )
    .slice(0, 4);

  if (!images.length) {
    return (
      <div
        className={`coverCollage coverFallback ${
          large ? "large" : ""
        }`}
      >
        <Icon
          name="music"
          size={
            large ? 42 : 26
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`coverCollage ${
        large ? "large" : ""
      }`}
    >
      {Array.from({
        length: 4,
      }).map((_, index) => {
        const item =
          images[
            index %
              images.length
          ];

        return (
          <img
            key={`${item.id}-${index}`}
            src={item.image}
            alt=""
          />
        );
      })}
    </div>
  );
}

export default function Home() {
  const [
    input,
    setInput,
  ] = useState("");

  const [
    songInput,
    setSongInput,
  ] = useState("");

  const [
    favorites,
    setFavorites,
  ] = useState([]);

  const [
    favoriteSongs,
    setFavoriteSongs,
  ] = useState({});

  const [
    favoriteArtistData,
    setFavoriteArtistData,
  ] = useState({});

  const [
    artistResults,
    setArtistResults,
  ] = useState([]);

  const [
    searchingArtists,
    setSearchingArtists,
  ] = useState(false);

  const [
    selectedArtist,
    setSelectedArtist,
  ] = useState(null);

  const [
    songResults,
    setSongResults,
  ] = useState([]);

  const [
    searchingSongs,
    setSearchingSongs,
  ] = useState(false);

  const [
    selectedSong,
    setSelectedSong,
  ] = useState(null);

  const [
    tracks,
    setTracks,
  ] = useState([]);

  const [
    trackCount,
    setTrackCount,
  ] = useState(15);

  const [
    discovery,
    setDiscovery,
  ] = useState(55);

  const [
    mixMeta,
    setMixMeta,
  ] = useState(null);

  const [
    mixName,
    setMixName,
  ] = useState(
    "TasteMaker Mix"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingStage,
    setLoadingStage,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    playlistUrl,
    setPlaylistUrl,
  ] = useState("");

  const [
    spotifyUser,
    setSpotifyUser,
  ] = useState(null);

  const [
    profileLoaded,
    setProfileLoaded,
  ] = useState(false);

  const [
    excludedInput,
    setExcludedInput,
  ] = useState("");

  const [
    excludedResults,
    setExcludedResults,
  ] = useState([]);

  const [
    searchingExcluded,
    setSearchingExcluded,
  ] = useState(false);

  const [
    selectedExcludedArtist,
    setSelectedExcludedArtist,
  ] = useState(null);

  const [
    excludedArtists,
    setExcludedArtists,
  ] = useState([]);

  const [
    likedTrackIds,
    setLikedTrackIds,
  ] = useState([]);

  const [
    dislikedTrackIds,
    setDislikedTrackIds,
  ] = useState([]);

  const [
    mixHistory,
    setMixHistory,
  ] = useState([]);

  const busy =
    loading || saving;

  const favoriteSongCount =
    useMemo(
      () =>
        Object.values(
          favoriteSongs
        ).reduce(
          (
            total,
            songs
          ) =>
            total +
            (Array.isArray(
              songs
            )
              ? songs.length
              : 0),
          0
        ),
      [favoriteSongs]
    );

  const discoveryLabel =
    useMemo(() => {
      if (
        discovery <= 25
      ) {
        return "Familiar";
      }

      if (
        discovery <= 55
      ) {
        return "Balanced";
      }

      if (
        discovery <= 80
      ) {
        return "Explorer";
      }

      return "Wild card";
    }, [discovery]);

  const discoveryHint =
    useMemo(() => {
      if (
        discovery <= 25
      ) {
        return "Stay close to the artists you already know.";
      }

      if (
        discovery <= 55
      ) {
        return "Mix familiar artists with fresh connections.";
      }

      if (
        discovery <= 80
      ) {
        return "Reach further into collaborators and genres.";
      }

      return "Go hunting for the least obvious picks.";
    }, [discovery]);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "tastemaker-profile-v4"
        ) ||
        localStorage.getItem(
          "tastemaker-profile-v3"
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(
            parsed.favorites
          )
        ) {
          setFavorites(
            parsed.favorites
          );
        }

        if (
          parsed.favoriteSongs &&
          typeof parsed.favoriteSongs ===
            "object"
        ) {
          setFavoriteSongs(
            parsed.favoriteSongs
          );
        }

        if (
          parsed.favoriteArtistData &&
          typeof parsed.favoriteArtistData ===
            "object"
        ) {
          setFavoriteArtistData(
            parsed.favoriteArtistData
          );
        }

        if (
          Number.isFinite(
            parsed.trackCount
          )
        ) {
          setTrackCount(
            parsed.trackCount
          );
        }

        if (
          Number.isFinite(
            parsed.discovery
          )
        ) {
          setDiscovery(
            parsed.discovery
          );
        }

        if (
          Array.isArray(
            parsed.excludedArtists
          )
        ) {
          setExcludedArtists(
            parsed.excludedArtists
          );
        }
      }

      const history =
        localStorage.getItem(
          "tastemaker-history-v1"
        );

      if (history) {
        const parsedHistory =
          JSON.parse(history);

        if (
          Array.isArray(
            parsedHistory
          )
        ) {
          setMixHistory(
            parsedHistory.slice(
              0,
              6
            )
          );
        }
      }
    } catch (error) {
      console.warn(
        "Could not restore TasteMaker data:",
        error
      );
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }

    localStorage.setItem(
      "tastemaker-profile-v4",
      JSON.stringify({
        favorites,
        favoriteSongs,
        favoriteArtistData,
        trackCount,
        discovery,
        excludedArtists,
      })
    );
  }, [
    profileLoaded,
    favorites,
    favoriteSongs,
    favoriteArtistData,
    trackCount,
    discovery,
    excludedArtists,
  ]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }

    localStorage.setItem(
      "tastemaker-history-v1",
      JSON.stringify(
        mixHistory
      )
    );
  }, [
    profileLoaded,
    mixHistory,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadSpotifyUser() {
      try {
        const response =
          await fetch(
            "/api/spotify/me",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (!cancelled) {
          setSpotifyUser(
            data.connected
              ? data.user
              : null
          );
        }
      } catch {
        if (!cancelled) {
          setSpotifyUser(null);
        }
      }
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const spotifyStatus =
      params.get("spotify");

    if (
      spotifyStatus ===
      "connected"
    ) {
      setMessage(
        "Spotify connected. Your listening taste can now help shape mixes."
      );
    } else if (
      spotifyStatus ===
      "verification_failed"
    ) {
      setMessage(
        "Spotify login verification failed. Try connecting again from this site."
      );
    } else if (
      spotifyStatus ===
      "token_error"
    ) {
      setMessage(
        "Spotify could not finish the login. Try connecting again."
      );
    } else if (
      spotifyStatus ===
      "denied"
    ) {
      setMessage(
        "Spotify connection was cancelled."
      );
    }

    if (spotifyStatus) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }

    loadSpotifyUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query =
      input.trim();

    if (
      query.length < 2
    ) {
      setArtistResults([]);

      setSearchingArtists(
        false
      );

      return;
    }

    if (
      selectedArtist &&
      normalize(
        selectedArtist.name
      ) ===
        normalize(query)
    ) {
      setArtistResults([]);

      setSearchingArtists(
        false
      );

      return;
    }

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        async () => {
          try {
            setSearchingArtists(
              true
            );

            const response =
              await fetch(
                `/api/search-artists?q=${encodeURIComponent(
                  query
                )}`,
                {
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Artist search failed."
              );
            }

            setArtistResults(
              data.artists ||
                []
            );
          } catch (
            error
          ) {
            if (
              error.name !==
              "AbortError"
            ) {
              console.error(
                error
              );

              setArtistResults(
                []
              );
            }
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setSearchingArtists(
                false
              );
            }
          }
        },
        280
      );

    return () => {
      clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    input,
    selectedArtist,
  ]);

  useEffect(() => {
    const query =
      songInput.trim();

    if (
      query.length < 2
    ) {
      setSongResults([]);

      setSearchingSongs(
        false
      );

      return;
    }

    if (
      selectedSong &&
      normalize(
        selectedSong.name
      ) ===
        normalize(query)
    ) {
      setSongResults([]);

      setSearchingSongs(
        false
      );

      return;
    }

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        async () => {
          try {
            setSearchingSongs(
              true
            );

            const artistName =
              selectedArtist
                ?.name ||
              input.trim();

            const params =
              new URLSearchParams({
                q: query,
              });

            if (
              artistName
            ) {
              params.set(
                "artist",
                artistName
              );
            }

            const response =
              await fetch(
                `/api/search-songs?${params.toString()}`,
                {
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Song search failed."
              );
            }

            setSongResults(
              data.songs ||
                []
            );
          } catch (
            error
          ) {
            if (
              error.name !==
              "AbortError"
            ) {
              console.error(
                error
              );

              setSongResults(
                []
              );
            }
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setSearchingSongs(
                false
              );
            }
          }
        },
        280
      );

    return () => {
      clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    songInput,
    selectedArtist,
    input,
    selectedSong,
  ]);

  useEffect(() => {
    const query =
      excludedInput.trim();

    if (
      query.length < 2
    ) {
      setExcludedResults([]);

      setSearchingExcluded(
        false
      );

      return;
    }

    if (
      selectedExcludedArtist &&
      normalize(
        selectedExcludedArtist.name
      ) ===
        normalize(query)
    ) {
      setExcludedResults([]);

      setSearchingExcluded(
        false
      );

      return;
    }

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        async () => {
          try {
            setSearchingExcluded(
              true
            );

            const response =
              await fetch(
                `/api/search-artists?q=${encodeURIComponent(
                  query
                )}`,
                {
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Artist search failed."
              );
            }

            const filtered =
              (
                data.artists ||
                []
              ).filter(
                (artist) =>
                  !excludedArtists.some(
                    (blocked) =>
                      normalize(
                        blocked
                      ) ===
                      normalize(
                        artist.name
                      )
                  )
              );

            setExcludedResults(
              filtered
            );
          } catch (error) {
            if (
              error.name !==
              "AbortError"
            ) {
              console.error(
                error
              );

              setExcludedResults(
                []
              );
            }
          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setSearchingExcluded(
                false
              );
            }
          }
        },
        280
      );

    return () => {
      clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    excludedInput,
    selectedExcludedArtist,
    excludedArtists,
  ]);

  useEffect(() => {
    if (!loading) {
      setLoadingStage("");

      return;
    }

    const stages = [
      "Reading your taste...",
      "Following artist connections...",
      "Filtering the obvious stuff...",
      "Building your mix...",
    ];

    let index = 0;

    setLoadingStage(
      stages[0]
    );

    const timer =
      setInterval(() => {
        index = Math.min(
          index + 1,
          stages.length - 1
        );

        setLoadingStage(
          stages[index]
        );
      }, 900);

    return () =>
      clearInterval(timer);
  }, [loading]);

  function clearResults({
    keepFeedback = false,
  } = {}) {
    setTracks([]);

    setMixMeta(null);

    setPlaylistUrl("");

    if (!keepFeedback) {
      setLikedTrackIds([]);

      setDislikedTrackIds(
        []
      );
    }
  }

  function saveArtistAndSong(
    artistName,
    songTitle,
    artistData = null
  ) {
    setFavorites(
      (previous) => {
        const exists =
          previous.some(
            (artist) =>
              normalize(
                artist
              ) ===
              normalize(
                artistName
              )
          );

        return exists
          ? previous
          : [
              ...previous,
              artistName,
            ];
      }
    );

    if (artistData) {
      setFavoriteArtistData(
        (previous) => ({
          ...previous,

          [normalize(
            artistName
          )]: artistData,
        })
      );
    }

    if (songTitle) {
      setFavoriteSongs(
        (previous) => {
          const key =
            normalize(
              artistName
            );

          const existing =
            Array.isArray(
              previous[key]
            )
              ? previous[key]
              : [];

          const exists =
            existing.some(
              (song) =>
                normalize(
                  song
                ) ===
                normalize(
                  songTitle
                )
            );

          if (exists) {
            return previous;
          }

          return {
            ...previous,

            [key]: [
              ...existing,
              songTitle,
            ],
          };
        }
      );
    }

    setInput("");

    setSongInput("");

    setSelectedArtist(
      null
    );

    setSelectedSong(null);

    setArtistResults([]);

    setSongResults([]);

    setMessage("");

    clearResults();
  }

  async function addArtist(
    event
  ) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const typedArtist =
      input.trim();

    const typedSong =
      songInput.trim();

    const songTitle =
      selectedSong &&
      normalize(
        selectedSong.name
      ) ===
        normalize(
          typedSong
        )
        ? selectedSong.name
        : typedSong;

    if (!typedArtist) {
      setMessage(
        "Enter an artist name first."
      );

      return;
    }

    if (
      selectedArtist &&
      normalize(
        selectedArtist.name
      ) ===
        normalize(
          typedArtist
        )
    ) {
      saveArtistAndSong(
        selectedArtist.name,
        songTitle,
        selectedArtist
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/search-artists?q=${encodeURIComponent(
            typedArtist
          )}`
        );

      if (!response.ok) {
        saveArtistAndSong(
          typedArtist,
          songTitle
        );

        return;
      }

      const data =
        await response.json();

      const spotifyArtists =
        data.artists ||
        [];

      if (
        !spotifyArtists.length
      ) {
        saveArtistAndSong(
          typedArtist,
          songTitle
        );

        return;
      }

      const normalizedInput =
        normalize(
          typedArtist
        );

      const exactMatch =
        spotifyArtists.find(
          (artist) =>
            normalize(
              artist.name
            ) ===
            normalizedInput
        );

      if (exactMatch) {
        saveArtistAndSong(
          exactMatch.name,
          songTitle,
          exactMatch
        );

        return;
      }

      const ranked =
        spotifyArtists
          .map(
            (artist) => {
              const artistName =
                normalize(
                  artist.name
                );

              const editDistance =
                distance(
                  normalizedInput,
                  artistName
                );

              const maxLength =
                Math.max(
                  normalizedInput.length,
                  artistName.length,
                  1
                );

              return {
                ...artist,

                similarity:
                  1 -
                  editDistance /
                    maxLength,

                editDistance,
              };
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.similarity -
                a.similarity ||
              a.editDistance -
                b.editDistance
          );

      const bestMatch =
        ranked[0];

      if (
        bestMatch &&
        bestMatch.similarity >=
          0.55
      ) {
        const confirmed =
          window.confirm(
            `Did you mean "${bestMatch.name}"?`
          );

        if (confirmed) {
          saveArtistAndSong(
            bestMatch.name,
            songTitle,
            bestMatch
          );

          return;
        }
      }

      saveArtistAndSong(
        typedArtist,
        songTitle
      );
    } catch (error) {
      console.error(
        "Artist search error:",
        error
      );

      saveArtistAndSong(
        typedArtist,
        songTitle
      );
    }
  }

  function removeSong(
    artist,
    title
  ) {
    setFavoriteSongs(
      (previous) => {
        const key =
          normalize(artist);

        const updated = {
          ...previous,
        };

        updated[key] = (
          updated[key] ||
          []
        ).filter(
          (song) =>
            normalize(
              song
            ) !==
            normalize(
              title
            )
        );

        if (
          !updated[key]
            .length
        ) {
          delete updated[key];
        }

        return updated;
      }
    );

    clearResults();
  }

  function removeArtist(
    artist
  ) {
    setFavorites(
      (previous) =>
        previous.filter(
          (name) =>
            normalize(
              name
            ) !==
            normalize(
              artist
            )
        )
    );

    setFavoriteArtistData(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated[
          normalize(
            artist
          )
        ];

        return updated;
      }
    );

    setFavoriteSongs(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated[
          normalize(
            artist
          )
        ];

        return updated;
      }
    );

    clearResults();
  }

  function addExcludedArtist() {
    const typedName =
      excludedInput.trim();

    const name =
      selectedExcludedArtist &&
      normalize(
        selectedExcludedArtist.name
      ) ===
        normalize(
          typedName
        )
        ? selectedExcludedArtist.name
        : typedName;

    if (!name) {
      return;
    }

    setExcludedArtists(
      (previous) => {
        const exists =
          previous.some(
            (artist) =>
              normalize(
                artist
              ) ===
              normalize(
                name
              )
          );

        return exists
          ? previous
          : [
              ...previous,
              name,
            ].slice(
              0,
              30
            );
      }
    );

    setExcludedInput("");

    setSelectedExcludedArtist(
      null
    );

    setExcludedResults([]);

    clearResults();
  }

  function removeExcludedArtist(
    name
  ) {
    setExcludedArtists(
      (previous) =>
        previous.filter(
          (artist) =>
            normalize(
              artist
            ) !==
            normalize(
              name
            )
        )
    );

    clearResults();
  }

  function toggleLike(
    trackId
  ) {
    setLikedTrackIds(
      (previous) =>
        previous.includes(
          trackId
        )
          ? previous.filter(
              (id) =>
                id !==
                trackId
            )
          : [
              ...previous,
              trackId,
            ]
    );

    setDislikedTrackIds(
      (previous) =>
        previous.filter(
          (id) =>
            id !==
            trackId
        )
    );
  }

  function toggleDislike(
    trackId
  ) {
    setDislikedTrackIds(
      (previous) =>
        previous.includes(
          trackId
        )
          ? previous.filter(
              (id) =>
                id !==
                trackId
            )
          : [
              ...previous,
              trackId,
            ]
    );

    setLikedTrackIds(
      (previous) =>
        previous.filter(
          (id) =>
            id !==
            trackId
        )
    );
  }

  function rememberMix(
    name,
    newTracks,
    meta
  ) {
    const entry = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,

      name,

      createdAt:
        Date.now(),

      discovery,

      tracks:
        newTracks,

      meta,
    };

    setMixHistory(
      (previous) => [
        entry,
        ...previous,
      ].slice(
        0,
        6
      )
    );
  }

  function loadHistoryMix(
    item
  ) {
    setMixName(
      item.name
    );

    setTracks(
      item.tracks ||
        []
    );

    setMixMeta(
      item.meta ||
        null
    );

    setDiscovery(
      item.discovery ??
        discovery
    );

    setLikedTrackIds([]);

    setDislikedTrackIds([]);

    setPlaylistUrl("");

    setMessage(
      `Loaded ${item.name} from your recent mixes.`
    );

    window.scrollTo({
      top:
        document.body
          .scrollHeight,

      behavior:
        "smooth",
    });
  }

  function clearTasteProfile() {
    if (
      !window.confirm(
        "Clear your saved TasteMaker profile?"
      )
    ) {
      return;
    }

    setFavorites([]);

    setFavoriteSongs({});

    setFavoriteArtistData(
      {}
    );

    setExcludedArtists(
      []
    );

    clearResults();

    setMessage(
      "Taste profile cleared."
    );
  }

  async function findSongs(
    regenerate = false
  ) {
    if (
      !favorites.length
    ) {
      setMessage(
        "Add at least one artist first."
      );

      return;
    }

    setLoading(true);

    setMessage("");

    setPlaylistUrl("");

    const likedTracks =
      tracks
        .filter(
          (track) =>
            likedTrackIds.includes(
              track.id
            )
        )
        .map(
          (track) => ({
            id:
              track.id,

            artist:
              track.artist,

            artists:
              track.artists,
          })
        );

    try {
      const response =
        await fetch(
          "/api/spotify",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                artists:
                  favorites,

                favoriteSongs,

                count:
                  trackCount,

                discovery,

                nonce:
                  `${Date.now()}-${Math.random()}`,

                excludeIds:
                  regenerate
                    ? tracks.map(
                        (
                          track
                        ) =>
                          track.id
                      )
                    : [],

                likedTracks,

                dislikedTrackIds,

                excludedArtists,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Recommendation search failed."
        );
      }

      const newTracks =
        data.tracks ||
        [];

      const newMeta =
        data.meta ||
        null;

      const newName =
        buildMixName(
          discovery,
          newMeta,
          newTracks
        );

      setTracks(
        newTracks
      );

      setMixMeta(
        newMeta
      );

      setMixName(
        newName
      );

      setLikedTrackIds([]);

      setDislikedTrackIds(
        []
      );

      if (
        !newTracks.length
      ) {
        setMessage(
          "No mix came back this time. Try another discovery level or fewer exclusions."
        );
      } else {
        rememberMix(
          newName,
          newTracks,
          newMeta
        );

        setMessage(
          regenerate
            ? `Fresh mix generated: ${newName}.`
            : `Built ${newName} with ${newTracks.length} tracks.`
        );
      }
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        error.message ||
          "Could not build your playlist."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function copyTracks() {
    try {
      await navigator
        .clipboard
        .writeText(
          tracks
            .map(
              (track) =>
                `${track.artist} — ${track.title}`
            )
            .join("\n")
        );

      setMessage(
        "Track list copied."
      );
    } catch {
      setMessage(
        "Copy failed. Please allow clipboard access."
      );
    }
  }

  async function savePlaylist() {
    if (
      !tracks.length ||
      busy
    ) {
      return;
    }

    setSaving(true);

    setPlaylistUrl("");

    setMessage(
      "Saving to Spotify..."
    );

    try {
      const response =
        await fetch(
          "/api/spotify/save",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  mixName ||
                  `TasteMaker ${discoveryLabel} Mix`,

                uris:
                  tracks.map(
                    (track) =>
                      track.uri
                  ),
              }),
          }
        );

      const data =
        await response.json();

      if (
        data.playlistUrl
      ) {
        setPlaylistUrl(
          data.playlistUrl
        );
      }

      if (
        !response.ok
      ) {
        if (
          data.needsLogin
        ) {
          setSpotifyUser(
            null
          );
        }

        setMessage(
          data.error ||
            "Could not save the playlist."
        );

        return;
      }

      setMessage(
        `Saved ${data.added} songs to Spotify.`
      );
    } catch {
      setMessage(
        "Saving could not be confirmed."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <main className="tm">
      <style>{`
:root{color-scheme:dark;}
*{box-sizing:border-box;}
html{scroll-behavior:smooth;background:#09090b;}
body{margin:0;background:#09090b;}
button,input,select{font:inherit;}
button,a{-webkit-tap-highlight-color:transparent;}

.tm{
  --bg:#09090b;
  --panel:#121216;
  --panel2:#18181e;
  --soft:#202027;
  --line:#292930;
  --text:#f7f4eb;
  --muted:#aaa7a0;
  --dim:#76736e;
  --lime:#b7ff5a;
  --purple:#8b78ff;
  --pink:#ff7f9f;

  min-height:100vh;
  overflow-x:hidden;
  color:var(--text);

  background:
    radial-gradient(
      circle at 92% 8%,
      rgba(139,120,255,.17),
      transparent 28%
    ),
    radial-gradient(
      circle at 5% 32%,
      rgba(183,255,90,.10),
      transparent 23%
    ),
    #09090b;

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.tm::before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  opacity:.45;

  background-image:
    radial-gradient(
      rgba(255,255,255,.06) .7px,
      transparent .7px
    );

  background-size:
    18px 18px;

  mask-image:
    linear-gradient(
      to bottom,
      #000,
      transparent 78%
    );
}

.shell{
  position:relative;
  z-index:1;

  width:min(
    1220px,
    calc(100% - 32px)
  );

  margin:0 auto;
  padding:18px 0 64px;
}

.nav{
  position:sticky;
  top:12px;
  z-index:500;

  min-height:70px;
  padding:10px 12px;

  display:flex;
  align-items:center;
  justify-content:space-between;

  gap:18px;

  border:1px solid
    rgba(255,255,255,.08);

  border-radius:20px;

  background:
    rgba(11,11,14,.86);

  backdrop-filter:
    blur(20px);

  box-shadow:
    0 18px 60px
    rgba(0,0,0,.30);
}

.brand{
  display:flex;
  align-items:center;
  gap:12px;
  min-width:0;
}

.brandLogo{
  width:44px;
  height:44px;

  border-radius:12px;
  object-fit:cover;

  background:#050505;

  box-shadow:
    inset 0 0 0 1px
    rgba(255,255,255,.08);
}

.brandText{
  display:flex;
  flex-direction:column;
  line-height:1;
}

.brandText strong{
  font-size:17px;
  letter-spacing:-.03em;
}

.brandText span{
  margin-top:5px;
  color:var(--dim);
  font-size:11px;
}

.navRight{
  display:flex;
  align-items:center;
  gap:10px;
}

.connect,
.userPill{
  min-height:44px;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  gap:9px;

  border-radius:14px;
  text-decoration:none;

  transition:.16s ease;
}

.connect{
  padding:0 16px;
  color:#090b07;
  background:var(--lime);

  font-size:14px;
  font-weight:900;
}

.connect:hover,
.userPill:hover{
  transform:
    translateY(-2px);
}

.userPill{
  max-width:230px;

  justify-content:flex-start;

  padding:
    5px 12px
    5px 5px;

  border:
    1px solid
    var(--line);

  background:
    var(--panel2);

  color:
    var(--text);
}

.userAvatar,
.userAvatarFallback{
  width:34px;
  height:34px;

  flex:0 0 auto;

  border-radius:10px;
  object-fit:cover;

  background:#0d0d10;
}

.userAvatarFallback{
  display:grid;
  place-items:center;
  color:var(--lime);
}

.userText{
  min-width:0;

  display:flex;
  flex-direction:column;
}

.userText strong{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;

  font-size:13px;
}

.userText small{
  margin-top:3px;

  color:
    var(--lime);

  font-size:10px;
}

.hero{
  min-height:610px;

  padding:
    92px 26px
    72px;

  display:grid;

  grid-template-columns:
    minmax(0,1.25fr)
    minmax(300px,.75fr);

  gap:62px;

  align-items:center;
}

.heroEyebrow{
  display:inline-flex;
  align-items:center;
  gap:8px;

  margin-bottom:24px;

  color:var(--lime);

  font-size:13px;
  font-weight:850;
}

.hero h1{
  margin:0;

  max-width:820px;

  font-size:
    clamp(
      58px,
      8.2vw,
      110px
    );

  line-height:.91;

  letter-spacing:
    -.068em;

  font-weight:950;

  text-wrap:balance;
}

.hero h1 .stroke{
  color:transparent;

  -webkit-text-stroke:
    1px
    rgba(247,244,235,.55);
}

.hero h1 .lime{
  color:var(--lime);
}

.heroCopy{
  max-width:690px;

  margin:
    28px 0 0;

  color:#b7b3ac;

  font-size:18px;
  line-height:1.7;
}

.heroActions{
  display:flex;
  flex-wrap:wrap;

  gap:10px;

  margin-top:30px;
}

.heroBadge{
  padding:
    10px 13px;

  display:inline-flex;
  align-items:center;

  gap:8px;

  border:
    1px solid
    var(--line);

  border-radius:12px;

  background:
    rgba(255,255,255,.025);

  color:#c9c6bf;

  font-size:13px;
  font-weight:700;
}

.heroArt{
  position:relative;

  min-height:370px;

  display:grid;
  place-items:center;
}

.orbit{
  position:absolute;

  width:340px;
  height:340px;

  border:
    1px solid
    rgba(255,255,255,.09);

  border-radius:50%;
}

.orbit::before,
.orbit::after{
  content:"";
  position:absolute;

  border-radius:50%;

  border:
    1px solid
    rgba(255,255,255,.07);
}

.orbit::before{
  inset:36px;
}

.orbit::after{
  inset:76px;
}

.heroCard{
  position:relative;

  width:min(
    310px,
    100%
  );

  padding:24px;

  border:
    1px solid
    rgba(255,255,255,.10);

  border-radius:26px;

  background:
    linear-gradient(
      160deg,
      rgba(139,120,255,.20),
      rgba(18,18,22,.96) 48%,
      rgba(183,255,90,.08)
    );

  box-shadow:
    0 35px 90px
    rgba(0,0,0,.42);

  transform:
    rotate(4deg);
}

.heroCardTop{
  display:flex;
  align-items:center;
  justify-content:space-between;

  gap:12px;
}

.heroCardLabel{
  color:#d8d4cc;

  font-size:13px;
  font-weight:800;
}

.heroDot{
  width:10px;
  height:10px;

  border-radius:50%;

  background:
    var(--lime);

  box-shadow:
    0 0 20px
    rgba(183,255,90,.8);
}

.heroCardBig{
  margin-top:42px;

  font-size:52px;
  font-weight:950;

  letter-spacing:
    -.06em;
}

.heroCardSmall{
  margin-top:6px;

  color:#aaa7a0;

  font-size:14px;
  line-height:1.55;
}

.heroBars{
  display:grid;
  gap:8px;

  margin-top:28px;
}

.heroBar{
  height:10px;

  border-radius:999px;

  background:#24242b;
  overflow:hidden;
}

.heroBar span{
  display:block;

  height:100%;

  border-radius:inherit;

  background:
    linear-gradient(
      90deg,
      var(--purple),
      var(--lime)
    );
}

.section{
  margin-top:20px;

  border:
    1px solid
    var(--line);

  border-radius:26px;

  background:
    var(--panel);

  overflow:visible;
}

.sectionHead{
  padding:
    28px 30px 0;

  display:flex;
  align-items:flex-start;
  justify-content:space-between;

  gap:20px;
}

.kicker{
  color:var(--lime);

  font-size:13px;
  font-weight:850;
}

.sectionTitle{
  margin:
    7px 0 0;

  font-size:
    clamp(
      30px,
      4vw,
      46px
    );

  line-height:1;

  letter-spacing:
    -.045em;
}

.sectionCopy{
  max-width:650px;

  margin:
    12px 0 0;

  color:var(--muted);

  font-size:16px;
  line-height:1.65;
}

.builderGrid{
  padding:
    28px 30px 30px;

  display:grid;

  grid-template-columns:
    minmax(0,1.35fr)
    minmax(320px,.65fr);

  gap:18px;
}

.panel{
  border:
    1px solid
    var(--line);

  border-radius:20px;

  background:#0d0d10;
}

.seedPanel{
  padding:22px;
}

.controlPanel{
  padding:22px;
}

.panelTitle{
  margin:0;

  font-size:20px;

  letter-spacing:
    -.025em;
}

.panelCopy{
  margin:
    7px 0 0;

  color:var(--muted);

  font-size:14px;
  line-height:1.55;
}

.formGrid{
  margin-top:22px;

  display:grid;

  grid-template-columns:
    minmax(0,1fr)
    minmax(0,1fr)
    auto;

  gap:10px;

  align-items:end;
}

.field{
  position:relative;
  min-width:0;
}

.field label{
  display:block;

  margin:
    0 0 8px
    2px;

  color:#c9c6bf;

  font-size:13px;
  font-weight:750;
}

.input{
  width:100%;
  height:54px;

  padding:
    0 15px;

  border:
    1px solid
    #303038;

  border-radius:13px;

  outline:none;

  background:#15151a;

  color:var(--text);

  font-size:15px;
  font-weight:650;

  transition:.15s ease;
}

.input::placeholder{
  color:#68656f;
}

.input:focus{
  border-color:
    var(--purple);

  box-shadow:
    0 0 0 3px
    rgba(139,120,255,.12);
}

.addBtn{
  height:54px;

  padding:
    0 18px;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  gap:8px;

  border:0;
  border-radius:13px;

  background:
    var(--text);

  color:#0c0c0f;

  font-size:14px;
  font-weight:900;

  cursor:pointer;
  white-space:nowrap;

  transition:.15s ease;
}

.addBtn:hover:not(:disabled){
  transform:
    translateY(-2px);
}

.dropdown{
  position:absolute;

  left:0;
  right:0;

  top:
    calc(100% + 8px);

  z-index:700;

  max-height:360px;

  overflow-y:auto;

  border:
    1px solid
    #34343c;

  border-radius:15px;

  background:#111116;

  box-shadow:
    0 24px 70px
    rgba(0,0,0,.52);
}

.searching{
  padding:15px;

  color:var(--muted);

  font-size:14px;
}

.searchResult{
  width:100%;

  padding:11px;

  display:flex;
  align-items:center;

  gap:12px;

  border:0;

  border-bottom:
    1px solid
    #24242a;

  background:transparent;

  color:var(--text);

  text-align:left;

  cursor:pointer;
}

.searchResult:hover{
  background:#19191f;
}

.searchResult:last-child{
  border-bottom:0;
}

.resultArt{
  width:48px;
  height:48px;

  flex:0 0 auto;

  object-fit:cover;

  background:#202027;
}

.resultArt.artist{
  border-radius:50%;
}

.resultArt.song{
  border-radius:10px;
}

.resultFallback{
  display:grid;
  place-items:center;

  color:var(--lime);
}

.resultText{
  min-width:0;
}

.resultName{
  font-size:14px;
  font-weight:850;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.resultMeta{
  margin-top:4px;

  color:var(--muted);

  font-size:12px;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.tasteGrid{
  margin-top:18px;

  display:grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        0,
        1fr
      )
    );

  gap:9px;
}

.tasteCard{
  min-width:0;

  padding:12px;

  display:grid;

  grid-template-columns:
    auto
    minmax(0,1fr)
    auto;

  align-items:center;

  gap:11px;

  border:
    1px solid
    #292930;

  border-radius:15px;

  background:#15151a;
}

.tasteAvatar{
  width:46px;
  height:46px;

  border-radius:12px;

  object-fit:cover;

  background:#202027;
}

.tasteFallback{
  display:grid;
  place-items:center;

  color:var(--lime);
}

.tasteText{
  min-width:0;
}

.tasteArtist{
  font-size:14px;
  font-weight:900;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.seedText{
  margin-top:4px;

  color:var(--muted);

  font-size:12px;
}

.removeBtn{
  width:34px;
  height:34px;

  display:grid;
  place-items:center;

  border:
    1px solid
    transparent;

  border-radius:10px;

  background:transparent;

  color:#7c7981;

  cursor:pointer;
}

.removeBtn:hover{
  color:#fff;

  border-color:#323239;

  background:#202027;
}

.songSeeds{
  grid-column:
    2 / 4;

  display:flex;
  flex-wrap:wrap;

  gap:6px;
}

.songSeed{
  padding:
    6px 9px;

  border:
    1px solid
    #2d2d34;

  border-radius:999px;

  background:#1b1b20;

  color:#bbb8b1;

  font-size:11px;

  cursor:pointer;
}

.controlBlock + .controlBlock{
  margin-top:24px;

  padding-top:24px;

  border-top:
    1px solid
    #26262c;
}

.controlTop{
  display:flex;
  align-items:center;
  justify-content:space-between;

  gap:12px;
}

.controlName{
  font-size:15px;
  font-weight:850;
}

.controlHint{
  margin-top:6px;

  color:var(--muted);

  font-size:13px;
  line-height:1.5;
}

.select{
  height:42px;

  padding:
    0 32px
    0 12px;

  border:
    1px solid
    #303038;

  border-radius:11px;

  background:#15151a;

  color:var(--text);

  font-size:14px;
  font-weight:800;
}

.range{
  width:100%;

  margin-top:14px;

  accent-color:
    var(--lime);

  cursor:pointer;
}

.rangeLabels{
  margin-top:7px;

  display:flex;
  justify-content:space-between;

  color:var(--dim);

  font-size:11px;
}

.excludeRow{
  margin-top:13px;

  display:flex;

  gap:8px;

  align-items:flex-start;
}

.excludeSearchWrap{
  position:relative;

  flex:1;

  min-width:0;
}

.excludeSearchWrap .dropdown{
  top:
    calc(100% + 8px);
}

.excludeRow .input{
  height:44px;

  font-size:14px;
}

.miniBtn{
  min-width:44px;
  height:44px;

  display:grid;
  place-items:center;

  border:0;

  border-radius:11px;

  background:
    var(--purple);

  color:#fff;

  cursor:pointer;
}

.excludeChips{
  display:flex;
  flex-wrap:wrap;

  gap:7px;

  margin-top:10px;
}

.excludeChip{
  padding:
    7px 9px;

  display:inline-flex;
  align-items:center;

  gap:6px;

  border:
    1px solid
    rgba(255,127,159,.24);

  border-radius:999px;

  background:
    rgba(255,127,159,.08);

  color:#ffb0c3;

  font-size:12px;

  cursor:pointer;
}

.generate{
  width:100%;
  height:60px;

  margin-top:22px;

  display:flex;
  align-items:center;
  justify-content:center;

  gap:10px;

  border:0;

  border-radius:15px;

  background:
    var(--lime);

  color:#0b0d08;

  font-size:16px;
  font-weight:950;

  cursor:pointer;

  transition:.16s ease;
}

.generate:hover:not(:disabled){
  transform:
    translateY(-2px);

  box-shadow:
    0 14px 40px
    rgba(183,255,90,.14);
}

.status{
  min-height:22px;

  margin:
    14px 0 0;

  color:var(--muted);

  text-align:center;

  font-size:13px;
  line-height:1.5;
}

.profileStrip{
  margin-top:18px;

  padding:
    16px 18px;

  display:grid;

  grid-template-columns:
    repeat(
      4,
      minmax(
        0,
        1fr
      )
    );

  gap:8px;

  border:
    1px solid
    var(--line);

  border-radius:18px;

  background:#0d0d10;
}

.stat{
  padding:12px;

  border-radius:12px;

  background:#15151a;
}

.stat span{
  color:var(--muted);

  font-size:12px;
}

.stat strong{
  display:block;

  margin-top:5px;

  font-size:22px;

  letter-spacing:
    -.03em;
}

.stat.spotifyStat strong{
  color:var(--lime);

  font-size:14px;
  line-height:1.2;
}

.results{
  padding:30px;
}

.playlistHero{
  display:grid;

  grid-template-columns:
    220px
    minmax(0,1fr);

  gap:28px;

  align-items:end;
}

.coverCollage{
  width:100%;

  aspect-ratio:1;

  display:grid;

  grid-template-columns:
    1fr 1fr;

  overflow:hidden;

  border-radius:18px;

  background:
    linear-gradient(
      145deg,
      #2a234c,
      #17200e
    );

  border:
    1px solid
    #34343c;
}

.coverCollage.large{
  width:220px;

  border-radius:24px;

  box-shadow:
    0 28px 70px
    rgba(0,0,0,.40);
}

.coverCollage img{
  width:100%;
  height:100%;

  object-fit:cover;

  min-width:0;
  min-height:0;
}

.coverFallback{
  display:grid;
  place-items:center;

  color:var(--lime);
}

.mixKicker{
  color:var(--lime);

  font-size:13px;
  font-weight:850;
}

.resultsTitle{
  margin:
    8px 0 0;

  font-size:
    clamp(
      42px,
      6vw,
      74px
    );

  line-height:.92;

  letter-spacing:
    -.055em;
}

.mixMeta{
  margin-top:13px;

  color:var(--muted);

  font-size:14px;
  line-height:1.55;
}

.genreTags{
  margin-top:12px;

  display:flex;
  flex-wrap:wrap;

  gap:7px;
}

.genreTag{
  padding:
    7px 10px;

  border:
    1px solid
    #303038;

  border-radius:999px;

  background:#17171c;

  color:#cbc7c0;

  font-size:12px;
}

.resultsActions{
  display:flex;
  flex-wrap:wrap;

  gap:8px;

  margin-top:19px;
}

.ghostBtn,
.saveBtn{
  min-height:44px;

  padding:
    0 14px;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  gap:8px;

  border-radius:12px;

  font-size:13px;
  font-weight:850;

  cursor:pointer;
}

.ghostBtn{
  border:
    1px solid
    #303038;

  background:#17171c;

  color:var(--text);
}

.saveBtn{
  border:0;

  background:
    var(--lime);

  color:#0b0d08;
}

.feedbackNotice{
  margin-top:20px;

  padding:
    13px 15px;

  border:
    1px solid
    rgba(139,120,255,.22);

  border-radius:13px;

  background:
    rgba(139,120,255,.07);

  color:#c8c1ff;

  font-size:13px;
  line-height:1.5;
}

.trackList{
  margin-top:22px;

  display:grid;

  gap:8px;
}

.track{
  padding:10px;

  display:grid;

  grid-template-columns:
    34px
    58px
    minmax(0,1fr)
    auto;

  align-items:center;

  gap:12px;

  border:
    1px solid
    #27272e;

  border-radius:15px;

  background:#111115;

  transition:.14s ease;
}

.track:hover{
  border-color:#3a3a44;

  background:#15151a;
}

.trackNumber{
  color:#66636d;

  font-size:12px;

  text-align:center;
}

.cover{
  width:58px;
  height:58px;

  border-radius:10px;

  object-fit:cover;

  background:#202027;
}

.coverFallbackSmall{
  display:grid;
  place-items:center;

  color:var(--lime);
}

.trackText{
  min-width:0;
}

.trackName{
  margin:0;

  color:var(--text);

  font-size:15px;
  font-weight:900;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.trackArtist{
  margin:
    5px 0 0;

  color:var(--muted);

  font-size:13px;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.sourceBadge{
  display:inline-block;

  margin-top:6px;

  color:#8f88c9;

  font-size:11px;
  font-weight:750;
}

.trackActions{
  display:flex;
  align-items:center;

  gap:6px;
}

.feedbackBtn,
.trackLink{
  min-width:38px;
  height:38px;

  padding:
    0 10px;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  gap:6px;

  border:
    1px solid
    #303038;

  border-radius:10px;

  background:#17171c;

  color:#aaa7b0;

  cursor:pointer;

  text-decoration:none;

  transition:.14s ease;
}

.feedbackBtn:hover,
.trackLink:hover{
  color:#fff;

  border-color:#44444f;
}

.feedbackBtn.like.active{
  color:#101407;

  border-color:
    var(--lime);

  background:
    var(--lime);
}

.feedbackBtn.dislike.active{
  color:#fff;

  border-color:
    var(--pink);

  background:#a94360;
}

.trackLink{
  color:var(--lime);

  font-size:12px;
  font-weight:850;
}

.playlistLink{
  margin-top:15px;

  display:inline-flex;
  align-items:center;

  gap:7px;

  color:var(--lime);

  font-size:14px;
  font-weight:850;

  text-decoration:none;
}

.history{
  padding:
    26px 30px
    30px;
}

.historyGrid{
  margin-top:18px;

  display:grid;

  grid-template-columns:
    repeat(
      3,
      minmax(
        0,
        1fr
      )
    );

  gap:10px;
}

.historyCard{
  padding:12px;

  display:grid;

  grid-template-columns:
    72px
    minmax(0,1fr);

  gap:12px;

  align-items:center;

  border:
    1px solid
    #292930;

  border-radius:16px;

  background:#111115;

  color:var(--text);

  text-align:left;

  cursor:pointer;
}

.historyCard:hover{
  border-color:#3d3d47;

  background:#15151a;
}

.historyCard .coverCollage{
  width:72px;

  border-radius:11px;
}

.historyName{
  font-size:14px;
  font-weight:900;

  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.historyMeta{
  margin-top:5px;

  color:var(--muted);

  font-size:12px;
}

.clearBtn{
  margin-top:18px;

  padding:
    10px 12px;

  border:
    1px solid
    #303038;

  border-radius:11px;

  background:transparent;

  color:#8b8790;

  font-size:12px;

  cursor:pointer;
}

.clearBtn:hover{
  color:#fff;

  background:#17171c;
}

.footer{
  padding:
    38px 0 8px;

  text-align:center;

  color:#68656e;

  font-size:12px;

  line-height:1.7;
}

.footer strong{
  color:#bdb8af;
}

button:disabled,
input:disabled,
select:disabled{
  opacity:.55;

  cursor:wait;
}

@media(max-width:960px){
  .hero{
    grid-template-columns:
      1fr;

    min-height:auto;

    padding-top:80px;
  }

  .heroArt{
    min-height:320px;
  }

  .builderGrid{
    grid-template-columns:
      1fr;
  }

  .profileStrip{
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
  }

  .historyGrid{
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
  }
}

@media(max-width:760px){
  .shell{
    width:
      min(
        calc(100% - 18px),
        1220px
      );

    padding-top:9px;
  }

  .nav{
    top:8px;

    min-height:62px;

    border-radius:16px;
  }

  .brandLogo{
    width:38px;
    height:38px;
  }

  .brandText span{
    display:none;
  }

  .brandText strong{
    font-size:15px;
  }

  .connect{
    min-height:40px;

    padding:
      0 12px;
  }

  .hero{
    padding:
      65px 8px
      46px;

    gap:30px;
  }

  .hero h1{
    font-size:
      clamp(
        52px,
        15vw,
        78px
      );
  }

  .heroCopy{
    font-size:16px;
  }

  .orbit{
    width:290px;
    height:290px;
  }

  .sectionHead{
    padding:
      22px 20px 0;
  }

  .builderGrid,
  .results,
  .history{
    padding:20px;
  }

  .formGrid{
    grid-template-columns:
      1fr;
  }

  .addBtn{
    width:100%;
  }

  .tasteGrid{
    grid-template-columns:
      1fr;
  }

  .playlistHero{
    grid-template-columns:
      140px
      minmax(0,1fr);

    gap:18px;

    align-items:center;
  }

  .coverCollage.large{
    width:140px;

    border-radius:18px;
  }

  .resultsTitle{
    font-size:
      clamp(
        38px,
        10vw,
        58px
      );
  }

  .track{
    grid-template-columns:
      28px
      52px
      minmax(0,1fr);
  }

  .cover{
    width:52px;
    height:52px;
  }

  .trackActions{
    grid-column:
      3 / -1;

    justify-content:flex-start;
  }

  .historyGrid{
    grid-template-columns:
      1fr;
  }
}

@media(max-width:520px){
  .brandText{
    display:none;
  }

  .userText small{
    display:none;
  }

  .userPill{
    max-width:135px;
  }

  .connect span{
    display:none;
  }

  .heroArt{
    min-height:280px;
  }

  .heroCard{
    width:250px;

    padding:20px;
  }

  .heroCardBig{
    font-size:44px;
  }

  .profileStrip{
    grid-template-columns:
      1fr 1fr;
  }

  .playlistHero{
    grid-template-columns:
      1fr;

    align-items:start;
  }

  .coverCollage.large{
    width:132px;
  }

  .resultsActions{
    display:grid;

    grid-template-columns:
      1fr;
  }

  .ghostBtn,
  .saveBtn{
    width:100%;
  }
}
      `}</style>

      <div className="shell">
        <nav className="nav">
          <div className="brand">
            <img
              className="brandLogo"
              src="/tastemaker-logo.png"
              alt="TasteMaker"
            />

            <div className="brandText">
              <strong>
                TasteMaker
              </strong>

              <span>
                music discovery
              </span>
            </div>
          </div>

          <div className="navRight">
            {spotifyUser ? (
              <a
                className="userPill"
                href={
                  spotifyUser.url ||
                  "https://open.spotify.com"
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {spotifyUser.image ? (
                  <img
                    className="userAvatar"
                    src={
                      spotifyUser.image
                    }
                    alt=""
                  />
                ) : (
                  <span className="userAvatarFallback">
                    <Icon
                      name="spotify"
                      size={17}
                    />
                  </span>
                )}

                <span className="userText">
                  <strong>
                    {
                      spotifyUser.displayName
                    }
                  </strong>

                  <small>
                    Spotify connected
                  </small>
                </span>
              </a>
            ) : (
              <a
                href="/api/spotify/login"
                className="connect"
              >
                <Icon
                  name="spotify"
                  size={17}
                />

                <span>
                  Connect Spotify
                </span>
              </a>
            )}
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="heroEyebrow">
              <Icon
                name="sparkles"
                size={15}
              />

              Built around your actual taste
            </div>

            <h1>
              Your taste.

              <br />

              <span className="stroke">
                Less obvious.
              </span>

              <br />

              <span className="lime">
                More you.
              </span>
            </h1>

            <p className="heroCopy">
              Give TasteMaker a few artists and songs you love.
              Tune how adventurous you feel, shape the next mix
              with feedback, and save the result straight to Spotify.
            </p>

            <div className="heroActions">
              <span className="heroBadge">
                <Icon
                  name="music"
                  size={15}
                />

                Live Spotify search
              </span>

              <span className="heroBadge">
                <Icon
                  name="up"
                  size={15}
                />

                Learns from feedback
              </span>

              <span className="heroBadge">
                <Icon
                  name="history"
                  size={15}
                />

                Recent mixes saved
              </span>
            </div>
          </div>

          <div
            className="heroArt"
            aria-hidden="true"
          >
            <div className="orbit" />

            <div className="heroCard">
              <div className="heroCardTop">
                <span className="heroCardLabel">
                  DISCOVERY LEVEL
                </span>

                <span className="heroDot" />
              </div>

              <div className="heroCardBig">
                {discovery}%
              </div>

              <div className="heroCardSmall">
                {discoveryLabel} mode

                <br />

                {discoveryHint}
              </div>

              <div className="heroBars">
                <div className="heroBar">
                  <span
                    style={{
                      width:
                        `${Math.max(
                          26,
                          discovery
                        )}%`,
                    }}
                  />
                </div>

                <div className="heroBar">
                  <span
                    style={{
                      width:
                        `${Math.max(
                          18,
                          100 -
                            discovery /
                              2
                        )}%`,
                    }}
                  />
                </div>

                <div className="heroBar">
                  <span
                    style={{
                      width:
                        `${Math.max(
                          34,
                          discovery *
                            0.72
                        )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <div>
              <div className="kicker">
                01 · BUILD YOUR TASTE
              </div>

              <h2 className="sectionTitle">
                Start with music you already love.
              </h2>

              <p className="sectionCopy">
                Add artists and optional favorite songs.
                Your taste profile stays saved on this device,
                because retyping everything after a refresh is barbaric.
              </p>
            </div>
          </div>

          <div className="builderGrid">
            <div className="panel seedPanel">
              <h3 className="panelTitle">
                Your seeds
              </h3>

              <p className="panelCopy">
                These are the starting points for every mix.
              </p>

              <form
                className="formGrid"
                onSubmit={
                  addArtist
                }
              >
                <div className="field">
                  <label htmlFor="artist-search">
                    Favorite artist
                  </label>

                  <input
                    id="artist-search"
                    className="input"
                    placeholder="Search an artist..."
                    value={input}
                    onChange={(
                      event
                    ) => {
                      setInput(
                        event.target.value
                      );

                      setSelectedArtist(
                        null
                      );
                    }}
                    disabled={busy}
                    autoComplete="off"
                  />

                  {searchingArtists && (
                    <div className="dropdown">
                      <div className="searching">
                        Searching artists...
                      </div>
                    </div>
                  )}

                  {!searchingArtists &&
                    artistResults.length >
                      0 && (
                      <div className="dropdown">
                        {artistResults.map(
                          (
                            artist
                          ) => (
                            <button
                              type="button"
                              className="searchResult"
                              key={
                                artist.id
                              }
                              onClick={() => {
                                setInput(
                                  artist.name
                                );

                                setSelectedArtist(
                                  artist
                                );

                                setArtistResults(
                                  []
                                );
                              }}
                            >
                              {artist.image ? (
                                <img
                                  className="resultArt artist"
                                  src={
                                    artist.image
                                  }
                                  alt=""
                                />
                              ) : (
                                <div className="resultArt artist resultFallback">
                                  <Icon
                                    name="music"
                                    size={17}
                                  />
                                </div>
                              )}

                              <div className="resultText">
                                <div className="resultName">
                                  {
                                    artist.name
                                  }
                                </div>

                                <div className="resultMeta">
                                  Artist
                                </div>
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>

                <div className="field">
                  <label htmlFor="song-search">
                    Favorite song · optional
                  </label>

                  <input
                    id="song-search"
                    className="input"
                    placeholder="Search a song..."
                    value={
                      songInput
                    }
                    onChange={(
                      event
                    ) => {
                      setSongInput(
                        event.target.value
                      );

                      setSelectedSong(
                        null
                      );
                    }}
                    disabled={busy}
                    autoComplete="off"
                  />

                  {searchingSongs && (
                    <div className="dropdown">
                      <div className="searching">
                        Searching songs...
                      </div>
                    </div>
                  )}

                  {!searchingSongs &&
                    songResults.length >
                      0 && (
                      <div className="dropdown">
                        {songResults.map(
                          (
                            song
                          ) => (
                            <button
                              type="button"
                              className="searchResult"
                              key={
                                song.id
                              }
                              onClick={() => {
                                setSongInput(
                                  song.name
                                );

                                setSelectedSong(
                                  song
                                );

                                setSongResults(
                                  []
                                );
                              }}
                            >
                              {song.image ? (
                                <img
                                  className="resultArt song"
                                  src={
                                    song.image
                                  }
                                  alt=""
                                />
                              ) : (
                                <div className="resultArt song resultFallback">
                                  <Icon
                                    name="music"
                                    size={17}
                                  />
                                </div>
                              )}

                              <div className="resultText">
                                <div className="resultName">
                                  {
                                    song.name
                                  }
                                </div>

                                <div className="resultMeta">
                                  {
                                    song.artist
                                  }
                                </div>
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>

                <button
                  type="submit"
                  className="addBtn"
                  disabled={busy}
                >
                  <Icon
                    name="plus"
                    size={16}
                  />

                  Add
                </button>
              </form>

              {favorites.length >
                0 && (
                <div className="tasteGrid">
                  {favorites.map(
                    (
                      artist
                    ) => {
                      const songs =
                        favoriteSongs[
                          normalize(
                            artist
                          )
                        ] || [];

                      const artistData =
                        favoriteArtistData[
                          normalize(
                            artist
                          )
                        ];

                      return (
                        <div
                          className="tasteCard"
                          key={
                            artist
                          }
                        >
                          {artistData?.image ? (
                            <img
                              className="tasteAvatar"
                              src={
                                artistData.image
                              }
                              alt=""
                            />
                          ) : (
                            <div className="tasteAvatar tasteFallback">
                              <Icon
                                name="music"
                                size={16}
                              />
                            </div>
                          )}

                          <div className="tasteText">
                            <div className="tasteArtist">
                              {
                                artist
                              }
                            </div>

                            <div className="seedText">
                              {songs.length
                                ? `${songs.length} favorite song${songs.length > 1 ? "s" : ""}`
                                : "Artist seed"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="removeBtn"
                            onClick={() =>
                              removeArtist(
                                artist
                              )
                            }
                            title="Remove artist"
                          >
                            <Icon
                              name="trash"
                              size={14}
                            />
                          </button>

                          {songs.length >
                            0 && (
                            <div className="songSeeds">
                              {songs.map(
                                (
                                  song
                                ) => (
                                  <button
                                    type="button"
                                    className="songSeed"
                                    key={
                                      song
                                    }
                                    onClick={() =>
                                      removeSong(
                                        artist,
                                        song
                                      )
                                    }
                                  >
                                    {song} ×
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <aside className="panel controlPanel">
              <h3 className="panelTitle">
                Tune the mix
              </h3>

              <p className="panelCopy">
                Decide how far TasteMaker should wander.
              </p>

              <div className="controlBlock">
                <div className="controlTop">
                  <div className="controlName">
                    Playlist length
                  </div>

                  <select
                    className="select"
                    value={
                      trackCount
                    }
                    disabled={busy}
                    onChange={(
                      event
                    ) => {
                      setTrackCount(
                        Number(
                          event.target.value
                        )
                      );

                      clearResults();
                    }}
                  >
                    {[
                      10,
                      15,
                      20,
                      25,
                      30,
                    ].map(
                      (
                        count
                      ) => (
                        <option
                          key={
                            count
                          }
                          value={
                            count
                          }
                        >
                          {count} songs
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="controlBlock">
                <div className="controlTop">
                  <div className="controlName">
                    Discovery level
                  </div>

                  <strong>
                    {discovery}% ·{" "}
                    {
                      discoveryLabel
                    }
                  </strong>
                </div>

                <div className="controlHint">
                  {
                    discoveryHint
                  }
                </div>

                <input
                  className="range"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={
                    discovery
                  }
                  disabled={busy}
                  onChange={(
                    event
                  ) => {
                    setDiscovery(
                      Number(
                        event.target.value
                      )
                    );

                    clearResults();
                  }}
                />

                <div className="rangeLabels">
                  <span>
                    Safe
                  </span>

                  <span>
                    Adventurous
                  </span>
                </div>
              </div>

              <div className="controlBlock">
                <div className="controlName">
                  Never recommend
                </div>

                <div className="controlHint">
                  Search Spotify for artists you want completely removed from generated mixes.
                </div>

                <div className="excludeRow">
                  <div className="excludeSearchWrap">
                    <input
                      className="input"
                      placeholder="Search an artist..."
                      value={
                        excludedInput
                      }
                      autoComplete="off"
                      onChange={(
                        event
                      ) => {
                        setExcludedInput(
                          event.target.value
                        );

                        setSelectedExcludedArtist(
                          null
                        );
                      }}
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          addExcludedArtist();
                        }
                      }}
                    />

                    {searchingExcluded && (
                      <div className="dropdown">
                        <div className="searching">
                          Searching artists...
                        </div>
                      </div>
                    )}

                    {!searchingExcluded &&
                      excludedResults.length >
                        0 && (
                        <div className="dropdown">
                          {excludedResults.map(
                            (
                              artist
                            ) => (
                              <button
                                type="button"
                                className="searchResult"
                                key={
                                  artist.id
                                }
                                onClick={() => {
                                  setExcludedInput(
                                    artist.name
                                  );

                                  setSelectedExcludedArtist(
                                    artist
                                  );

                                  setExcludedResults(
                                    []
                                  );
                                }}
                              >
                                {artist.image ? (
                                  <img
                                    className="resultArt artist"
                                    src={
                                      artist.image
                                    }
                                    alt=""
                                  />
                                ) : (
                                  <div className="resultArt artist resultFallback">
                                    <Icon
                                      name="music"
                                      size={17}
                                    />
                                  </div>
                                )}

                                <div className="resultText">
                                  <div className="resultName">
                                    {
                                      artist.name
                                    }
                                  </div>

                                  <div className="resultMeta">
                                    Never recommend this artist
                                  </div>
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      )}
                  </div>

                  <button
                    type="button"
                    className="miniBtn"
                    onClick={
                      addExcludedArtist
                    }
                    title="Exclude artist"
                  >
                    <Icon
                      name="ban"
                      size={17}
                    />
                  </button>
                </div>

                {excludedArtists.length >
                  0 && (
                  <div className="excludeChips">
                    {excludedArtists.map(
                      (
                        artist
                      ) => (
                        <button
                          type="button"
                          className="excludeChip"
                          key={
                            artist
                          }
                          onClick={() =>
                            removeExcludedArtist(
                              artist
                            )
                          }
                        >
                          {artist} ×
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="generate"
                disabled={busy}
                onClick={() =>
                  findSongs(
                    false
                  )
                }
              >
                {loading ? (
                  loadingStage
                ) : (
                  <>
                    <Icon
                      name="sparkles"
                      size={18}
                    />

                    Build my mix
                  </>
                )}
              </button>

              <p
                className="status"
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            </aside>
          </div>

          <div className="profileStrip">
            <div className="stat">
              <span>
                Artists
              </span>

              <strong>
                {
                  favorites.length
                }
              </strong>
            </div>

            <div className="stat">
              <span>
                Song seeds
              </span>

              <strong>
                {
                  favoriteSongCount
                }
              </strong>
            </div>

            <div className="stat">
              <span>
                Blocked artists
              </span>

              <strong>
                {
                  excludedArtists.length
                }
              </strong>
            </div>

            <div className="stat spotifyStat">
              <span>
                Spotify
              </span>

              <strong>
                {spotifyUser
                  ? `Connected as ${spotifyUser.displayName}`
                  : "Optional"}
              </strong>
            </div>
          </div>

          {favorites.length >
            0 && (
            <div
              style={{
                padding:
                  "0 30px 28px",
              }}
            >
              <button
                type="button"
                className="clearBtn"
                onClick={
                  clearTasteProfile
                }
              >
                Clear saved taste profile
              </button>
            </div>
          )}
        </section>

        {tracks.length >
          0 && (
          <section className="section results">
            <div className="playlistHero">
              <CoverCollage
                tracks={tracks}
                large
              />

              <div>
                <div className="mixKicker">
                  02 · YOUR MIX
                </div>

                <h2 className="resultsTitle">
                  {mixName}
                </h2>

                <div className="mixMeta">
                  {tracks.length} tracks ·{" "}
                  {discovery}% discovery

                  {mixMeta?.connectedTasteUsed
                    ? " · shaped with your Spotify taste"
                    : ""}

                  {mixMeta?.feedbackUsed
                    ? " · adjusted using your feedback"
                    : ""}
                </div>

                {mixMeta?.usedGenres?.length >
                  0 && (
                  <div className="genreTags">
                    {mixMeta.usedGenres.map(
                      (
                        genre
                      ) => (
                        <span
                          className="genreTag"
                          key={
                            genre
                          }
                        >
                          {
                            genre
                          }
                        </span>
                      )
                    )}
                  </div>
                )}

                <div className="resultsActions">
                  <button
                    type="button"
                    className="ghostBtn"
                    disabled={busy}
                    onClick={() =>
                      findSongs(
                        true
                      )
                    }
                  >
                    <Icon
                      name="refresh"
                      size={15}
                    />

                    Make another mix
                  </button>

                  <button
                    type="button"
                    className="ghostBtn"
                    disabled={busy}
                    onClick={
                      copyTracks
                    }
                  >
                    <Icon
                      name="copy"
                      size={15}
                    />

                    Copy songs
                  </button>

                  <button
                    type="button"
                    className="saveBtn"
                    disabled={busy}
                    onClick={
                      savePlaylist
                    }
                  >
                    <Icon
                      name="spotify"
                      size={15}
                    />

                    {saving
                      ? "Saving..."
                      : "Save to Spotify"}
                  </button>
                </div>
              </div>
            </div>

            <div className="feedbackNotice">
              Use{" "}
              <strong>
                More like this
              </strong>{" "}
              and{" "}
              <strong>
                Less like this
              </strong>
              , then hit{" "}
              <strong>
                Make another mix
              </strong>
              . Your likes become extra artist signals and disliked tracks are kept out of the next result.
            </div>

            <div className="trackList">
              {tracks.map(
                (
                  track,
                  index
                ) => {
                  const liked =
                    likedTrackIds.includes(
                      track.id
                    );

                  const disliked =
                    dislikedTrackIds.includes(
                      track.id
                    );

                  return (
                    <div
                      className="track"
                      key={
                        track.id
                      }
                    >
                      <div className="trackNumber">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      {track.image ? (
                        <img
                          className="cover"
                          src={
                            track.image
                          }
                          alt={`${track.title} album cover`}
                        />
                      ) : (
                        <div className="cover coverFallbackSmall">
                          <Icon
                            name="music"
                            size={18}
                          />
                        </div>
                      )}

                      <div className="trackText">
                        <p className="trackName">
                          {
                            track.title
                          }
                        </p>

                        <p className="trackArtist">
                          {
                            track.artist
                          }
                        </p>

                        <span className="sourceBadge">
                          {sourceLabel(
                            track.source
                          )}
                        </span>
                      </div>

                      <div className="trackActions">
                        <button
                          type="button"
                          className={`feedbackBtn like ${
                            liked
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            toggleLike(
                              track.id
                            )
                          }
                          title="More like this"
                          aria-label={`More like ${track.title}`}
                        >
                          <Icon
                            name="up"
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          className={`feedbackBtn dislike ${
                            disliked
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            toggleDislike(
                              track.id
                            )
                          }
                          title="Less like this"
                          aria-label={`Less like ${track.title}`}
                        >
                          <Icon
                            name="down"
                            size={15}
                          />
                        </button>

                        {track.url && (
                          <a
                            className="trackLink"
                            href={
                              track.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Spotify
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {playlistUrl && (
              <a
                className="playlistLink"
                href={
                  playlistUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Open saved playlist in Spotify

                <Icon
                  name="arrow"
                  size={14}
                />
              </a>
            )}
          </section>
        )}

        {mixHistory.length >
          0 && (
          <section className="section history">
            <div className="kicker">
              03 · RECENT MIXES
            </div>

            <h2 className="sectionTitle">
              Go back to something good.
            </h2>

            <p className="sectionCopy">
              Your latest mixes are saved in this browser.
            </p>

            <div className="historyGrid">
              {mixHistory.map(
                (
                  item
                ) => (
                  <button
                    type="button"
                    className="historyCard"
                    key={
                      item.id
                    }
                    onClick={() =>
                      loadHistoryMix(
                        item
                      )
                    }
                  >
                    <CoverCollage
                      tracks={
                        item.tracks ||
                        []
                      }
                    />

                    <div>
                      <div className="historyName">
                        {
                          item.name
                        }
                      </div>

                      <div className="historyMeta">
                        {item.tracks?.length ||
                          0}{" "}
                        tracks ·{" "}
                        {
                          item.discovery
                        }
                        % discovery
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </section>
        )}

        <footer className="footer">
          <div>
            TasteMaker · Music discovery without the same five recommendations forever.
          </div>

          <div>
            Designed &amp; built by{" "}

            <strong>
              Dominik Sakalik
            </strong>

            {" "}· 2026
          </div>
        </footer>
      </div>
    </main>
  );
}