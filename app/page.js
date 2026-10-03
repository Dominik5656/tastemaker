"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

function normalize(
  text = ""
) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function distance(
  a,
  b
) {
  const matrix =
    Array.from(
      {
        length:
          b.length + 1,
      },
      () =>
        Array(
          a.length + 1
        ).fill(0)
    );

  for (
    let i = 0;
    i <= a.length;
    i++
  ) {
    matrix[0][i] = i;
  }

  for (
    let j = 0;
    j <= b.length;
    j++
  ) {
    matrix[j][0] = j;
  }

  for (
    let j = 1;
    j <= b.length;
    j++
  ) {
    for (
      let i = 1;
      i <= a.length;
      i++
    ) {
      if (
        a[i - 1] ===
        b[j - 1]
      ) {
        matrix[j][i] =
          matrix[j - 1][
            i - 1
          ];
      } else {
        matrix[j][i] =
          Math.min(
            matrix[j - 1][
              i
            ] + 1,

            matrix[j][
              i - 1
            ] + 1,

            matrix[j - 1][
              i - 1
            ] + 1
          );
      }
    }
  }

  return matrix[
    b.length
  ][a.length];
}

function Icon({
  name,
  size = 18,
}) {
  const common = {
    width: size,
    height: size,
    viewBox:
      "0 0 24 24",
    fill: "none",
    stroke:
      "currentColor",
    strokeWidth: 1.9,
    strokeLinecap:
      "round",
    strokeLinejoin:
      "round",

    "aria-hidden":
      true,
  };

  if (
    name ===
    "sparkles"
  ) {
    return (
      <svg {...common}>
        <path d="M12 3l1.15 3.3L16.5 7.5l-3.35 1.2L12 12l-1.15-3.3L7.5 7.5l3.35-1.2L12 3Z" />

        <path d="M18.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />

        <path d="M5.5 14.5l.85 2.35 2.35.85-2.35.85L5.5 21l-.85-2.45-2.35-.85 2.35-.85L5.5 14.5Z" />
      </svg>
    );
  }

  if (
    name === "music"
  ) {
    return (
      <svg {...common}>
        <path d="M9 18V5l11-2v13" />
        <circle
          cx="6"
          cy="18"
          r="3"
        />
        <circle
          cx="17"
          cy="16"
          r="3"
        />
      </svg>
    );
  }

  if (
    name ===
    "spotify"
  ) {
    return (
      <svg {...common}>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M7.3 9.8c3.3-1 6.8-.8 9.8.7" />

        <path d="M7.9 12.7c2.7-.75 5.7-.55 8.2.65" />

        <path d="M8.5 15.4c2.15-.55 4.4-.4 6.4.5" />
      </svg>
    );
  }

  if (
    name === "plus"
  ) {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (
    name === "arrow"
  ) {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </svg>
    );
  }

  if (
    name === "copy"
  ) {
    return (
      <svg {...common}>
        <rect
          x="8"
          y="8"
          width="11"
          height="11"
          rx="2"
        />

        <path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }

  if (
    name === "trash"
  ) {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="m6 7 1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  if (
    name === "refresh"
  ) {
    return (
      <svg {...common}>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 9A7 7 0 0 1 18.7 7.7L20 12" />
        <path d="M17.9 15A7 7 0 0 1 5.3 16.3L4 12" />
      </svg>
    );
  }

  if (
    name === "check"
  ) {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  return null;
}

function sourceLabel(
  source
) {
  if (
    source === "close"
  ) {
    return "Close match";
  }

  if (
    source ===
    "collaborator"
  ) {
    return "Connected artist";
  }

  if (
    source === "genre"
  ) {
    return "Genre discovery";
  }

  if (
    source ===
    "spotify-taste"
  ) {
    return "Your Spotify taste";
  }

  return "Discovery";
}

export default function Home() {
  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    songInput,
    setSongInput,
  ] =
    useState("");

  const [
    favorites,
    setFavorites,
  ] =
    useState([]);

  const [
    favoriteSongs,
    setFavoriteSongs,
  ] =
    useState({});

  const [
    favoriteArtistData,
    setFavoriteArtistData,
  ] =
    useState({});

  const [
    artistResults,
    setArtistResults,
  ] =
    useState([]);

  const [
    searchingArtists,
    setSearchingArtists,
  ] =
    useState(false);

  const [
    selectedArtist,
    setSelectedArtist,
  ] =
    useState(null);

  const [
    songResults,
    setSongResults,
  ] =
    useState([]);

  const [
    searchingSongs,
    setSearchingSongs,
  ] =
    useState(false);

  const [
    selectedSong,
    setSelectedSong,
  ] =
    useState(null);

  const [
    tracks,
    setTracks,
  ] =
    useState([]);

  const [
    trackCount,
    setTrackCount,
  ] =
    useState(15);

  const [
    discovery,
    setDiscovery,
  ] =
    useState(55);

  const [
    mixMeta,
    setMixMeta,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingStage,
    setLoadingStage,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    playlistUrl,
    setPlaylistUrl,
  ] =
    useState("");

  const [
    spotifyUser,
    setSpotifyUser,
  ] =
    useState(null);

  const [
    profileLoaded,
    setProfileLoaded,
  ] =
    useState(false);

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
            (
              Array.isArray(
                songs
              )
                ? songs.length
                : 0
            ),

          0
        ),

      [favoriteSongs]
    );

  const discoveryLabel =
    useMemo(
      () => {
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
      },
      [discovery]
    );

  const discoveryHint =
    useMemo(
      () => {
        if (
          discovery <= 25
        ) {
          return "Mostly close to the artists you added.";
        }

        if (
          discovery <= 55
        ) {
          return "A mix of familiar names and connected artists.";
        }

        if (
          discovery <= 80
        ) {
          return "More collaborators, genres and unexpected picks.";
        }

        return "Push far outside the obvious choices.";
      },
      [discovery]
    );

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "tastemaker-profile-v3"
        );

      if (saved) {
        const parsed =
          JSON.parse(
            saved
          );

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
      }
    } catch (error) {
      console.warn(
        "Could not restore TasteMaker profile:",
        error
      );
    } finally {
      setProfileLoaded(
        true
      );
    }
  }, []);

  useEffect(() => {
    if (
      !profileLoaded
    ) {
      return;
    }

    localStorage.setItem(
      "tastemaker-profile-v3",

      JSON.stringify({
        favorites,
        favoriteSongs,
        favoriteArtistData,
        trackCount,
        discovery,
      })
    );
  }, [
    profileLoaded,
    favorites,
    favoriteSongs,
    favoriteArtistData,
    trackCount,
    discovery,
  ]);

  useEffect(() => {
    let cancelled =
      false;

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
          setSpotifyUser(
            null
          );
        }
      }
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const spotifyStatus =
      params.get(
        "spotify"
      );

    if (
      spotifyStatus ===
      "connected"
    ) {
      setMessage(
        "Spotify connected. Your TasteMaker mix can now use your Spotify taste too."
      );
    } else if (
      spotifyStatus ===
      "verification_failed"
    ) {
      setMessage(
        "Spotify login verification failed. Try Connect Spotify again from this site."
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
      setArtistResults(
        []
      );

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
        normalize(
          query
        )
    ) {
      setArtistResults(
        []
      );

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

            if (
              !response.ok
            ) {
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
      setSongResults(
        []
      );

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
        normalize(
          query
        )
    ) {
      setSongResults(
        []
      );

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

            if (
              !response.ok
            ) {
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
    if (!loading) {
      setLoadingStage(
        ""
      );

      return;
    }

    const stages = [
      "Reading your taste...",
      "Finding connected artists...",
      "Digging past the obvious picks...",
      "Building your mix...",
    ];

    let index = 0;

    setLoadingStage(
      stages[0]
    );

    const timer =
      setInterval(
        () => {
          index =
            Math.min(
              index + 1,
              stages.length -
                1
            );

          setLoadingStage(
            stages[index]
          );
        },
        900
      );

    return () =>
      clearInterval(
        timer
      );
  }, [loading]);

  function clearResults() {
    setTracks([]);
    setMixMeta(null);
    setPlaylistUrl("");
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
          )]:
            artistData,
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
              previous[
                key
              ]
            )
              ? previous[
                  key
                ]
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

    setSelectedSong(
      null
    );

    setArtistResults(
      []
    );

    setSongResults(
      []
    );

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

    if (
      !typedArtist
    ) {
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

      if (
        !response.ok
      ) {
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
          normalize(
            artist
          );

        const updated = {
          ...previous,
        };

        updated[key] =
          (
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
          delete updated[
            key
          ];
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

  function clearTasteProfile() {
    if (
      !window.confirm(
        "Clear your saved TasteMaker profile?"
      )
    ) {
      return;
    }

    setFavorites([]);

    setFavoriteSongs(
      {}
    );

    setFavoriteArtistData(
      {}
    );

    setTracks([]);

    setMixMeta(null);

    setPlaylistUrl("");

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

    try {
      const response =
        await fetch(
          "/api/spotify",
          {
            method: "POST",

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

      setTracks(
        data.tracks ||
          []
      );

      setMixMeta(
        data.meta ||
          null
      );

      if (
        !data.tracks
          ?.length
      ) {
        setMessage(
          "No mix came back this time. Try another artist or discovery level."
        );
      } else if (
        regenerate
      ) {
        setMessage(
          `Fresh mix generated with ${data.tracks.length} songs.`
        );
      } else {
        setMessage(
          `Built a ${data.tracks.length}-song mix around your taste.`
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
              (
                track
              ) =>
                `${track.artist} — ${track.title}`
            )
            .join(
              "\n"
            )
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
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  `TasteMaker ${discoveryLabel} Mix`,

                uris:
                  tracks.map(
                    (
                      track
                    ) =>
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

  const heroCover =
    tracks.find(
      (track) =>
        track.image
    )?.image ||
    null;

  return (
    <main className="tm">
      <style>{`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          background: #050705;
        }

        body {
          margin: 0;
          background: #050705;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        .tm {
          --bg: #050705;
          --surface: rgba(11, 15, 12, .78);
          --surface2: rgba(15, 20, 16, .92);
          --line: rgba(255,255,255,.075);
          --line2: rgba(255,255,255,.12);
          --text: #f5f8f6;
          --muted: #89958d;
          --dim: #5d6861;
          --green: #6af08e;
          --green2: #35d96a;

          min-height: 100vh;
          overflow-x: hidden;
          position: relative;

          color: var(--text);

          background:
            radial-gradient(
              circle at 18% -5%,
              rgba(87,255,139,.15),
              transparent 31%
            ),
            radial-gradient(
              circle at 100% 18%,
              rgba(31,185,82,.12),
              transparent 27%
            ),
            radial-gradient(
              circle at 52% 100%,
              rgba(52,221,104,.07),
              transparent 38%
            ),
            linear-gradient(
              180deg,
              #071008 0%,
              #050705 45%,
              #030403 100%
            );

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .tm::before {
          content: "";
          position: fixed;
          inset: 0;

          pointer-events: none;

          z-index: 0;

          background-image:
            linear-gradient(
              rgba(255,255,255,.012) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.012) 1px,
              transparent 1px
            );

          background-size:
            56px 56px;

          mask-image:
            linear-gradient(
              to bottom,
              #000,
              transparent 84%
            );
        }

        .ambient {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .blob {
          position: absolute;

          border-radius: 999px;

          filter:
            blur(95px);

          opacity: .42;

          animation:
            float 16s
            ease-in-out
            infinite;
        }

        .blob.one {
          width: 380px;
          height: 380px;

          top: 120px;
          left: -170px;

          background:
            rgba(
              78,
              245,
              125,
              .18
            );
        }

        .blob.two {
          width: 360px;
          height: 360px;

          top: 620px;
          right: -180px;

          background:
            rgba(
              34,
              202,
              91,
              .13
            );

          animation-delay:
            -6s;
        }

        .blob.three {
          width: 280px;
          height: 280px;

          top: 1260px;
          left: 38%;

          background:
            rgba(
              93,
              240,
              135,
              .08
            );

          animation-delay:
            -10s;
        }

        @keyframes float {
          0%,
          100% {
            transform:
              translate3d(
                0,
                0,
                0
              )
              scale(1);
          }

          50% {
            transform:
              translate3d(
                0,
                34px,
                0
              )
              scale(1.08);
          }
        }

        .shell {
          width:
            min(
              1180px,
              calc(
                100% - 28px
              )
            );

          margin:
            0 auto;

          padding:
            16px 0 70px;

          position:
            relative;

          z-index: 1;
        }

        .nav {
          position:
            sticky;

          top:
            12px;

          z-index:
            300;

          min-height:
            68px;

          padding:
            10px 11px
            10px 18px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            14px;

          border:
            1px solid
            var(--line);

          border-radius:
            22px;

          background:
            rgba(
              7,
              10,
              8,
              .66
            );

          backdrop-filter:
            blur(24px)
            saturate(140%);

          box-shadow:
            0 20px 65px
            rgba(
              0,
              0,
              0,
              .28
            ),
            inset
            0 1px 0
            rgba(
              255,
              255,
              255,
              .025
            );
        }

        .brand img {
          width:
            170px;

          max-width:
            42vw;

          display:
            block;
        }

        .navRight {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          min-width:
            0;
        }

        .modePill {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          min-height:
            40px;

          padding:
            0 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );

          border-radius:
            999px;

          color:
            #8e9a92;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          font-size:
            10px;

          font-weight:
            850;

          letter-spacing:
            .09em;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }

        .liveDot {
          width:
            7px;

          height:
            7px;

          border-radius:
            50%;

          background:
            var(--green);

          box-shadow:
            0 0 15px
            rgba(
              106,
              240,
              142,
              .9
            );
        }

        .connect,
        .userPill {
          min-height:
            43px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px;

          border-radius:
            999px;

          text-decoration:
            none;

          transition:
            transform
            .16s ease,
            filter
            .16s ease,
            background
            .16s ease;
        }

        .connect {
          padding:
            0 16px;

          color:
            #061008;

          background:
            linear-gradient(
              135deg,
              #95f9ad,
              #55e47f 48%,
              #2dca63
            );

          font-size:
            11px;

          font-weight:
            950;

          box-shadow:
            0 12px 34px
            rgba(
              47,
              213,
              97,
              .18
            );
        }

        .connect:hover,
        .userPill:hover {
          transform:
            translateY(
              -2px
            );
        }

        .userPill {
          max-width:
            220px;

          justify-content:
            flex-start;

          padding:
            5px 12px
            5px 5px;

          border:
            1px solid
            rgba(
              106,
              240,
              142,
              .12
            );

          background:
            rgba(
              106,
              240,
              142,
              .055
            );

          color:
            #e8f7ec;
        }

        .userAvatar {
          width:
            33px;

          height:
            33px;

          border-radius:
            50%;

          object-fit:
            cover;

          background:
            #172019;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );
        }

        .userAvatarFallback {
          display:
            grid;

          place-items:
            center;

          color:
            var(--green);

          flex:
            0 0 auto;
        }

        .userText {
          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;

          line-height:
            1.05;
        }

        .userText strong {
          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          font-size:
            11px;

          font-weight:
            900;
        }

        .userText small {
          margin-top:
            4px;

          color:
            #72db8e;

          font-size:
            8px;

          font-weight:
            800;

          text-transform:
            uppercase;

          letter-spacing:
            .07em;
        }

        .hero {
          padding:
            102px 0 62px;

          text-align:
            center;
        }

        .eyebrow {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          padding:
            9px 13px;

          border:
            1px solid
            rgba(
              106,
              240,
              142,
              .14
            );

          border-radius:
            999px;

          background:
            rgba(
              106,
              240,
              142,
              .05
            );

          color:
            #9bf5b4;

          font-size:
            10px;

          font-weight:
            900;

          letter-spacing:
            .13em;

          text-transform:
            uppercase;
        }

        .hero h1 {
          max-width:
            1020px;

          margin:
            24px auto 0;

          font-size:
            clamp(
              55px,
              8.8vw,
              112px
            );

          line-height:
            .88;

          letter-spacing:
            -.073em;

          font-weight:
            950;

          text-wrap:
            balance;
        }

        .accent {
          background:
            linear-gradient(
              135deg,
              #d8ffe1 0%,
              #8df6aa 30%,
              #57e683 58%,
              #27c95f
            );

          -webkit-background-clip:
            text;

          background-clip:
            text;

          color:
            transparent;

          filter:
            drop-shadow(
              0 10px
              28px
              rgba(
                55,
                220,
                103,
                .14
              )
            );
        }

        .hero p {
          width:
            min(
              720px,
              100%
            );

          margin:
            27px auto 0;

          color:
            #8d9991;

          font-size:
            clamp(
              15px,
              2vw,
              18px
            );

          line-height:
            1.72;

          text-wrap:
            balance;
        }

        .heroChips {
          display:
            flex;

          justify-content:
            center;

          flex-wrap:
            wrap;

          gap:
            8px;

          margin-top:
            27px;
        }

        .heroChip {
          min-height:
            34px;

          padding:
            0 11px;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              .02
            );

          color:
            #748077;

          font-size:
            10px;

          font-weight:
            750;
        }

        .workspace {
          display:
            grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            318px;

          gap:
            18px;

          align-items:
            start;
        }

        .glass {
          border:
            1px solid
            var(--line);

          border-radius:
            30px;

          background:
            linear-gradient(
              145deg,
              rgba(
                255,
                255,
                255,
                .036
              ),
              rgba(
                255,
                255,
                255,
                .009
              )
            ),
            rgba(
              9,
              13,
              10,
              .8
            );

          box-shadow:
            0 30px 100px
            rgba(
              0,
              0,
              0,
              .34
            ),
            inset
            0 1px 0
            rgba(
              255,
              255,
              255,
              .025
            );

          backdrop-filter:
            blur(22px)
            saturate(130%);
        }

        .builder {
          position:
            relative;

          z-index:
            5;

          padding:
            30px;

          overflow:
            visible;
        }

        .builder::before {
          content:
            "";

          position:
            absolute;

          width:
            230px;

          height:
            230px;

          top:
            -120px;

          right:
            -100px;

          border-radius:
            50%;

          background:
            rgba(
              81,
              226,
              123,
              .075
            );

          filter:
            blur(58px);

          pointer-events:
            none;
        }

        .sectionLabel {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          color:
            #70e992;

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            .15em;

          text-transform:
            uppercase;
        }

        .sectionTitle {
          margin:
            9px 0 0;

          color:
            #f8fbf9;

          font-size:
            clamp(
              28px,
              4vw,
              39px
            );

          line-height:
            1.03;

          letter-spacing:
            -.046em;

          font-weight:
            950;
        }

        .sectionCopy {
          max-width:
            650px;

          margin:
            10px 0 0;

          color:
            #7c8980;

          font-size:
            12px;

          line-height:
            1.7;
        }

        .formGrid {
          margin-top:
            27px;

          display:
            grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            minmax(
              0,
              1fr
            )
            auto;

          gap:
            10px;

          align-items:
            end;
        }

        .field {
          position:
            relative;

          min-width:
            0;
        }

        .field label {
          display:
            block;

          margin:
            0 0 8px
            2px;

          color:
            #98a49c;

          font-size:
            9px;

          font-weight:
            850;

          letter-spacing:
            .1em;

          text-transform:
            uppercase;
        }

        .input {
          width:
            100%;

          height:
            56px;

          padding:
            0 16px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .075
            );

          border-radius:
            16px;

          outline:
            none;

          background:
            rgba(
              4,
              7,
              5,
              .74
            );

          color:
            #f6faf7;

          font-size:
            13px;

          font-weight:
            650;

          transition:
            .16s ease;
        }

        .input::placeholder {
          color:
            #505a53;
        }

        .input:focus {
          border-color:
            rgba(
              106,
              240,
              142,
              .4
            );

          background:
            rgba(
              5,
              9,
              6,
              .95
            );

          box-shadow:
            0 0 0 4px
            rgba(
              91,
              232,
              132,
              .07
            );
        }

        .addBtn {
          height:
            56px;

          padding:
            0 20px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          border:
            0;

          border-radius:
            16px;

          background:
            #eef4ef;

          color:
            #09100b;

          font-size:
            12px;

          font-weight:
            950;

          cursor:
            pointer;

          transition:
            .16s ease;

          white-space:
            nowrap;
        }

        .addBtn:hover:not(:disabled) {
          transform:
            translateY(
              -2px
            );

          background:
            #fff;
        }

        .dropdown {
          position:
            absolute;

          left:
            0;

          right:
            0;

          top:
            calc(
              100% + 8px
            );

          z-index:
            700;

          max-height:
            390px;

          overflow-y:
            auto;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .09
            );

          border-radius:
            18px;

          background:
            rgba(
              8,
              11,
              9,
              .985
            );

          box-shadow:
            0 28px 74px
            rgba(
              0,
              0,
              0,
              .52
            );

          backdrop-filter:
            blur(22px);
        }

        .searching {
          padding:
            15px;

          color:
            #7d8981;

          font-size:
            11px;

          font-weight:
            750;
        }

        .searchResult {
          width:
            100%;

          padding:
            10px 12px;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          border:
            0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .043
            );

          background:
            transparent;

          color:
            #fff;

          text-align:
            left;

          cursor:
            pointer;

          transition:
            background
            .14s ease;
        }

        .searchResult:last-child {
          border-bottom:
            0;
        }

        .searchResult:hover {
          background:
            rgba(
              106,
              240,
              142,
              .05
            );
        }

        .resultArt {
          width:
            46px;

          height:
            46px;

          flex:
            0 0 auto;

          object-fit:
            cover;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );

          background:
            #161c18;
        }

        .resultArt.artist {
          border-radius:
            50%;
        }

        .resultArt.song {
          border-radius:
            10px;
        }

        .resultFallback {
          display:
            grid;

          place-items:
            center;

          color:
            var(--green);
        }

        .resultText {
          min-width:
            0;
        }

        .resultName {
          color:
            #f3f7f4;

          font-size:
            12px;

          font-weight:
            850;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .resultMeta {
          margin-top:
            4px;

          color:
            #68746c;

          font-size:
            10px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .tasteGrid {
          margin-top:
            21px;

          display:
            grid;

          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );

          gap:
            9px;
        }

        .tasteCard {
          min-width:
            0;

          padding:
            11px;

          display:
            grid;

          grid-template-columns:
            auto
            minmax(
              0,
              1fr
            )
            auto;

          align-items:
            center;

          gap:
            11px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            17px;

          background:
            rgba(
              255,
              255,
              255,
              .02
            );

          transition:
            .15s ease;
        }

        .tasteCard:hover {
          transform:
            translateY(
              -1px
            );

          border-color:
            rgba(
              106,
              240,
              142,
              .13
            );

          background:
            rgba(
              106,
              240,
              142,
              .026
            );
        }

        .tasteAvatar {
          width:
            44px;

          height:
            44px;

          border-radius:
            50%;

          object-fit:
            cover;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );

          background:
            #151c17;
        }

        .tasteFallback {
          display:
            grid;

          place-items:
            center;

          color:
            var(--green);
        }

        .tasteText {
          min-width:
            0;
        }

        .tasteArtist {
          color:
            #f1f6f2;

          font-size:
            12px;

          font-weight:
            900;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .seedText {
          margin-top:
            4px;

          color:
            #647068;

          font-size:
            9px;
        }

        .songSeeds {
          grid-column:
            2 / 4;

          display:
            flex;

          flex-wrap:
            wrap;

          gap:
            5px;

          margin-top:
            -2px;
        }

        .songSeed {
          max-width:
            100%;

          padding:
            5px 8px;

          border:
            1px solid
            rgba(
              106,
              240,
              142,
              .08
            );

          border-radius:
            999px;

          background:
            rgba(
              106,
              240,
              142,
              .03
            );

          color:
            #829187;

          font-size:
            9px;

          cursor:
            pointer;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .songSeed:hover {
          color:
            #c8f7d4;

          border-color:
            rgba(
              106,
              240,
              142,
              .18
            );
        }

        .removeBtn {
          width:
            30px;

          height:
            30px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            transparent;

          border-radius:
            50%;

          background:
            transparent;

          color:
            #59645d;

          cursor:
            pointer;
        }

        .removeBtn:hover {
          color:
            #fff;

          background:
            rgba(
              255,
              255,
              255,
              .04
            );

          border-color:
            rgba(
              255,
              255,
              255,
              .06
            );
        }

        .settings {
          margin-top:
            22px;

          padding-top:
            20px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .052
            );

          display:
            grid;

          gap:
            18px;
        }

        .settingRow {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            16px;
        }

        .controlLabel {
          color:
            #eaf0eb;

          font-size:
            11px;

          font-weight:
            850;
        }

        .controlHint {
          max-width:
            450px;

          margin-top:
            4px;

          color:
            #606b63;

          font-size:
            9px;

          line-height:
            1.45;
        }

        .select {
          height:
            42px;

          padding:
            0 34px
            0 13px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          border-radius:
            12px;

          outline:
            0;

          background:
            #0a0e0b;

          color:
            #edf2ee;

          font-size:
            11px;

          font-weight:
            800;

          cursor:
            pointer;
        }

        .sliderWrap {
          width:
            min(
              330px,
              48%
            );

          min-width:
            230px;
        }

        .sliderTop {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            10px;

          margin-bottom:
            8px;

          color:
            #7d8981;

          font-size:
            9px;
        }

        .sliderTop strong {
          color:
            #aef7c0;

          font-size:
            10px;
        }

        .range {
          width:
            100%;

          accent-color:
            #55e47f;

          cursor:
            pointer;
        }

        .rangeLabels {
          display:
            flex;

          justify-content:
            space-between;

          margin-top:
            6px;

          color:
            #4f5a52;

          font-size:
            8px;

          font-weight:
            800;

          text-transform:
            uppercase;

          letter-spacing:
            .06em;
        }

        .generate {
          width:
            100%;

          height:
            60px;

          margin-top:
            18px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            10px;

          border:
            0;

          border-radius:
            17px;

          background:
            linear-gradient(
              135deg,
              #96f9ad 0%,
              #59e684 45%,
              #2fd168 100%
            );

          color:
            #061008;

          font-size:
            13px;

          font-weight:
            950;

          cursor:
            pointer;

          box-shadow:
            0 15px 38px
            rgba(
              42,
              207,
              95,
              .17
            );

          transition:
            .16s ease;
        }

        .generate:hover:not(:disabled) {
          transform:
            translateY(
              -2px
            );

          filter:
            brightness(
              1.035
            );

          box-shadow:
            0 20px 46px
            rgba(
              42,
              207,
              95,
              .22
            );
        }

        .status {
          min-height:
            18px;

          margin:
            12px 0 0;

          text-align:
            center;

          color:
            #78857c;

          font-size:
            10px;

          line-height:
            1.55;
        }

        .sidePanel {
          position:
            sticky;

          top:
            98px;

          padding:
            22px;
        }

        .sidePanel h3 {
          margin:
            8px 0 0;

          color:
            #f4f8f5;

          font-size:
            21px;

          line-height:
            1.06;

          letter-spacing:
            -.035em;

          font-weight:
            950;
        }

        .sidePanel p {
          margin:
            9px 0 0;

          color:
            #717d75;

          font-size:
            10px;

          line-height:
            1.62;
        }

        .stats {
          margin-top:
            19px;

          display:
            grid;

          gap:
            8px;
        }

        .stat {
          padding:
            12px 13px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .047
            );

          border-radius:
            14px;

          background:
            rgba(
              255,
              255,
              255,
              .017
            );
        }

        .stat span {
          color:
            #6d7971;

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            .05em;

          text-transform:
            uppercase;
        }

        .stat strong {
          color:
            #f6faf7;

          font-size:
            17px;

          font-weight:
            950;

          letter-spacing:
            -.03em;
        }

        .connectCard {
          margin-top:
            16px;

          padding:
            14px;

          border:
            1px solid
            rgba(
              106,
              240,
              142,
              .09
            );

          border-radius:
            15px;

          background:
            rgba(
              106,
              240,
              142,
              .032
            );
        }

        .connectCardTitle {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          color:
            #c8f9d4;

          font-size:
            10px;

          font-weight:
            900;
        }

        .connectCardText {
          margin-top:
            7px;

          color:
            #6e7b72;

          font-size:
            9px;

          line-height:
            1.55;
        }

        .clearBtn {
          width:
            100%;

          margin-top:
            12px;

          padding:
            9px 10px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            11px;

          background:
            transparent;

          color:
            #5d6861;

          font-size:
            9px;

          font-weight:
            800;

          cursor:
            pointer;
        }

        .clearBtn:hover {
          color:
            #cbd4cd;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );
        }

        .results {
          margin-top:
            18px;

          padding:
            25px;

          overflow:
            hidden;
        }

        .playlistHero {
          display:
            grid;

          grid-template-columns:
            150px
            minmax(
              0,
              1fr
            );

          gap:
            22px;

          align-items:
            end;

          padding-bottom:
            22px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );
        }

        .playlistCover {
          width:
            150px;

          aspect-ratio:
            1;

          border-radius:
            22px;

          object-fit:
            cover;

          background:
            linear-gradient(
              145deg,
              #16351f,
              #08110b
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          box-shadow:
            0 24px 60px
            rgba(
              0,
              0,
              0,
              .35
            );
        }

        .playlistCoverFallback {
          display:
            grid;

          place-items:
            center;

          color:
            #72e994;
        }

        .resultsTitle {
          margin:
            7px 0 0;

          font-size:
            clamp(
              34px,
              5vw,
              58px
            );

          line-height:
            .94;

          letter-spacing:
            -.058em;

          font-weight:
            950;
        }

        .mixMeta {
          margin-top:
            10px;

          color:
            #718077;

          font-size:
            10px;

          line-height:
            1.55;
        }

        .genreTags {
          margin-top:
            12px;

          display:
            flex;

          flex-wrap:
            wrap;

          gap:
            6px;
        }

        .genreTag {
          padding:
            6px 8px;

          border:
            1px solid
            rgba(
              106,
              240,
              142,
              .08
            );

          border-radius:
            999px;

          background:
            rgba(
              106,
              240,
              142,
              .026
            );

          color:
            #76c98b;

          font-size:
            8px;

          font-weight:
            800;

          text-transform:
            capitalize;
        }

        .resultsActions {
          margin-top:
            16px;

          display:
            flex;

          gap:
            8px;

          flex-wrap:
            wrap;
        }

        .ghostBtn,
        .saveBtn {
          min-height:
            40px;

          padding:
            0 14px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          border-radius:
            12px;

          font-size:
            10px;

          font-weight:
            900;

          cursor:
            pointer;

          transition:
            .14s ease;
        }

        .ghostBtn {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .065
            );

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            #e5ebe6;
        }

        .ghostBtn:hover:not(:disabled) {
          background:
            rgba(
              255,
              255,
              255,
              .05
            );

          transform:
            translateY(
              -1px
            );
        }

        .saveBtn {
          border:
            0;

          background:
            linear-gradient(
              135deg,
              #8ff8aa,
              #3ddd73
            );

          color:
            #061008;
        }

        .saveBtn:hover:not(:disabled) {
          transform:
            translateY(
              -1px
            );
        }

        .trackList {
          margin-top:
            17px;

          display:
            grid;

          gap:
            7px;
        }

        .track {
          padding:
            8px 9px;

          display:
            grid;

          grid-template-columns:
            28px
            auto
            minmax(
              0,
              1fr
            )
            auto;

          align-items:
            center;

          gap:
            11px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .043
            );

          border-radius:
            15px;

          background:
            rgba(
              255,
              255,
              255,
              .017
            );

          transition:
            .15s ease;
        }

        .track:hover {
          transform:
            translateX(
              3px
            );

          border-color:
            rgba(
              106,
              240,
              142,
              .11
            );

          background:
            rgba(
              106,
              240,
              142,
              .024
            );
        }

        .trackNumber {
          color:
            #566159;

          font-size:
            9px;

          text-align:
            center;

          font-variant-numeric:
            tabular-nums;
        }

        .cover {
          width:
            54px;

          height:
            54px;

          border-radius:
            11px;

          object-fit:
            cover;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          background:
            #141a16;
        }

        .coverFallback {
          display:
            grid;

          place-items:
            center;

          color:
            var(--green);

          font-size:
            9px;

          font-weight:
            950;
        }

        .trackText {
          min-width:
            0;
        }

        .trackName {
          margin:
            0;

          color:
            #f4f8f5;

          font-size:
            12px;

          font-weight:
            900;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .trackArtist {
          margin:
            4px 0 0;

          color:
            #6b776f;

          font-size:
            10px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .sourceBadge {
          display:
            inline-block;

          margin-top:
            5px;

          color:
            #5f986f;

          font-size:
            8px;

          font-weight:
            800;
        }

        .trackLink {
          min-height:
            33px;

          padding:
            0 10px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          border:
            1px solid
            rgba(
              106,
              240,
              142,
              .09
            );

          border-radius:
            10px;

          background:
            rgba(
              106,
              240,
              142,
              .028
            );

          color:
            #75e796;

          font-size:
            9px;

          font-weight:
            850;

          text-decoration:
            none;

          white-space:
            nowrap;
        }

        .playlistLink {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          margin-top:
            14px;

          color:
            #7bed9c;

          font-size:
            10px;

          font-weight:
            900;

          text-decoration:
            none;
        }

        .footer {
          padding:
            34px 0 4px;

          text-align:
            center;

          color:
            #455048;

          font-size:
            9px;

          line-height:
            1.7;
        }

        .footer strong {
          color:
            #74e494;

          font-weight:
            850;
        }

        button:disabled,
        input:disabled,
        select:disabled {
          opacity:
            .55;

          cursor:
            wait;
        }

        @media (
          max-width:
            930px
        ) {
          .workspace {
            grid-template-columns:
              1fr;
          }

          .sidePanel {
            position:
              relative;

            top:
              auto;
          }

          .stats {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }

        @media (
          max-width:
            740px
        ) {
          .shell {
            width:
              min(
                100% - 18px,
                1180px
              );

            padding-top:
              9px;
          }

          .nav {
            top:
              8px;

            min-height:
              62px;

            padding:
              9px 10px
              9px 13px;

            border-radius:
              18px;
          }

          .brand img {
            width:
              142px;
          }

          .modePill {
            display:
              none;
          }

          .connect {
            min-height:
              38px;

            padding:
              0 12px;

            font-size:
              9px;
          }

          .userPill {
            max-width:
              170px;
          }

          .hero {
            padding:
              72px 4px
              42px;
          }

          .hero h1 {
            font-size:
              clamp(
                49px,
                15vw,
                78px
              );
          }

          .formGrid {
            grid-template-columns:
              1fr;
          }

          .addBtn {
            width:
              100%;
          }

          .builder,
          .results {
            padding:
              20px;

            border-radius:
              23px;
          }

          .tasteGrid {
            grid-template-columns:
              1fr;
          }

          .settingRow {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .sliderWrap {
            width:
              100%;

            min-width:
              0;
          }

          .stats {
            grid-template-columns:
              1fr;
          }

          .playlistHero {
            grid-template-columns:
              105px
              minmax(
                0,
                1fr
              );

            gap:
              15px;

            align-items:
              center;
          }

          .playlistCover {
            width:
              105px;

            border-radius:
              17px;
          }

          .track {
            grid-template-columns:
              22px
              auto
              minmax(
                0,
                1fr
              );
          }

          .trackLink {
            grid-column:
              2 / -1;

            width:
              100%;
          }
        }

        @media (
          max-width:
            460px
        ) {
          .brand img {
            width:
              124px;
          }

          .userText small {
            display:
              none;
          }

          .userPill {
            max-width:
              135px;

            padding-right:
              9px;
          }

          .connect span:last-child {
            display:
              none;
          }

          .playlistHero {
            grid-template-columns:
              1fr;

            align-items:
              start;
          }

          .playlistCover {
            width:
              118px;
          }
        }
      `}</style>

      <div className="ambient">
        <div className="blob one" />

        <div className="blob two" />

        <div className="blob three" />
      </div>

      <div className="shell">
        <nav className="nav">
          <div className="brand">
            <img
              src="/tastemaker-logo.png"
              alt="TasteMaker"
            />
          </div>

          <div className="navRight">
            <div className="modePill">
              <span className="liveDot" />

              Smart discovery
            </div>

            {spotifyUser ? (
              <a
                className="userPill"

                href={
                  spotifyUser.url ||
                  "https://open.spotify.com"
                }

                target="_blank"

                rel="noopener noreferrer"

                title="Open Spotify profile"
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
                  <span className="userAvatar userAvatarFallback">
                    <Icon
                      name="spotify"
                      size={16}
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
                  size={16}
                />

                <span>
                  Connect Spotify
                </span>
              </a>
            )}
          </div>
        </nav>

        <section className="hero">
          <div className="eyebrow">
            <Icon
              name="sparkles"
              size={14}
            />

            Your taste, pushed further
          </div>

          <h1>
            Find music that feels

            <br />

            <span className="accent">
              like you found it first.
            </span>
          </h1>

          <p>
            Add what you already love,
            choose how adventurous you
            want to be, and TasteMaker
            builds a fresh mix from
            artists, collaborators,
            genres and your connected
            Spotify taste.
          </p>

          <div className="heroChips">
            <span className="heroChip">
              <Icon
                name="music"
                size={13}
              />

              Live Spotify search
            </span>

            <span className="heroChip">
              <Icon
                name="sparkles"
                size={13}
              />

              Dynamic discovery engine
            </span>

            <span className="heroChip">
              <Icon
                name="refresh"
                size={13}
              />

              Regenerate anytime
            </span>
          </div>
        </section>

        <div className="workspace">
          <section className="glass builder">
            <div className="sectionLabel">
              <span className="liveDot" />

              Taste builder
            </div>

            <h2 className="sectionTitle">
              Start with what you love.
            </h2>

            <p className="sectionCopy">
              Add artists and optional
              favorite songs. Your profile
              is saved on this device, so
              refreshing the page no longer
              wipes everything out.
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

                  aria-label="Favorite artist"

                  placeholder="Search an artist..."

                  value={
                    input
                  }

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

                  disabled={
                    busy
                  }

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

                  aria-label="Favorite song"

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

                  disabled={
                    busy
                  }

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

                disabled={
                  busy
                }
              >
                <Icon
                  name="plus"
                  size={16}
                />

                Add taste
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
                              ? `${songs.length} song seed${songs.length > 1 ? "s" : ""}`
                              : "Artist seed"}
                          </div>
                        </div>

                        <button
                          type="button"

                          className="removeBtn"

                          disabled={
                            busy
                          }

                          onClick={() =>
                            removeArtist(
                              artist
                            )
                          }

                          title="Remove artist"

                          aria-label={`Remove ${artist}`}
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

                                  title="Remove song seed"
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

            <div className="settings">
              <div className="settingRow">
                <div>
                  <div className="controlLabel">
                    Playlist length
                  </div>

                  <div className="controlHint">
                    How many tracks should
                    TasteMaker build?
                  </div>
                </div>

                <select
                  className="select"

                  value={
                    trackCount
                  }

                  disabled={
                    busy
                  }

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

              <div className="settingRow">
                <div>
                  <div className="controlLabel">
                    Discovery level
                  </div>

                  <div className="controlHint">
                    {
                      discoveryHint
                    }
                  </div>
                </div>

                <div className="sliderWrap">
                  <div className="sliderTop">
                    <span>
                      {discovery}%
                    </span>

                    <strong>
                      {
                        discoveryLabel
                      }
                    </strong>
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

                    disabled={
                      busy
                    }

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
              </div>
            </div>

            <button
              type="button"

              className="generate"

              disabled={
                busy
              }

              onClick={() =>
                findSongs(
                  false
                )
              }
            >
              {loading ? (
                <>
                  {
                    loadingStage
                  }
                </>
              ) : (
                <>
                  Generate{" "}
                  {discoveryLabel.toLowerCase()}{" "}
                  mix

                  <Icon
                    name="arrow"
                    size={17}
                  />
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
          </section>

          <aside className="glass sidePanel">
            <div className="sectionLabel">
              Taste profile
            </div>

            <h3>
              Your mix at a glance.
            </h3>

            <p>
              TasteMaker now pulls from
              your seed artists,
              collaborators, genre signals
              and, when connected, your
              Spotify listening taste.
            </p>

            <div className="stats">
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
                  Discovery
                </span>

                <strong>
                  {discovery}%
                </strong>
              </div>
            </div>

            <div className="connectCard">
              <div className="connectCardTitle">
                <Icon
                  name={
                    spotifyUser
                      ? "check"
                      : "spotify"
                  }

                  size={14}
                />

                {spotifyUser
                  ? "Spotify connected"
                  : "Spotify optional"}
              </div>

              <div className="connectCardText">
                {spotifyUser
                  ? `Connected as ${spotifyUser.displayName}. Higher discovery levels can also use your Spotify top artists.`
                  : "You can generate mixes without signing in. Connect Spotify to save playlists and add another taste signal."}
              </div>
            </div>

            {favorites.length >
              0 && (
              <button
                type="button"

                className="clearBtn"

                onClick={
                  clearTasteProfile
                }
              >
                Clear saved taste profile
              </button>
            )}
          </aside>
        </div>

        {tracks.length >
          0 && (
          <section className="glass results">
            <div className="playlistHero">
              {heroCover ? (
                <img
                  className="playlistCover"

                  src={
                    heroCover
                  }

                  alt="Album artwork from the mix"
                />
              ) : (
                <div className="playlistCover playlistCoverFallback">
                  <Icon
                    name="music"

                    size={34}
                  />
                </div>
              )}

              <div>
                <div className="sectionLabel">
                  TasteMaker mix
                </div>

                <h2 className="resultsTitle">
                  {discoveryLabel} Mix
                </h2>

                <div className="mixMeta">
                  {tracks.length} tracks ·{" "}
                  {discovery}% discovery

                  {mixMeta?.connectedTasteUsed
                    ? " · personalized with your Spotify taste"
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

                    disabled={
                      busy
                    }

                    onClick={() =>
                      findSongs(
                        true
                      )
                    }
                  >
                    <Icon
                      name="refresh"
                      size={14}
                    />

                    Make another mix
                  </button>

                  <button
                    type="button"

                    className="ghostBtn"

                    disabled={
                      busy
                    }

                    onClick={
                      copyTracks
                    }
                  >
                    <Icon
                      name="copy"
                      size={14}
                    />

                    Copy songs
                  </button>

                  <button
                    type="button"

                    className="saveBtn"

                    disabled={
                      busy
                    }

                    onClick={
                      savePlaylist
                    }
                  >
                    <Icon
                      name="spotify"
                      size={14}
                    />

                    {saving
                      ? "Saving..."
                      : "Save to Spotify"}
                  </button>
                </div>
              </div>
            </div>

            <div className="trackList">
              {tracks.map(
                (
                  track,
                  index
                ) => (
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
                      <div className="cover coverFallback">
                        {index + 1}
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

                        <Icon
                          name="arrow"

                          size={11}
                        />
                      </a>
                    )}
                  </div>
                )
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
                Open saved playlist in
                Spotify

                <Icon
                  name="arrow"
                  size={13}
                />
              </a>
            )}
          </section>
        )}

        <footer className="footer">
          <div>
            TasteMaker · Discovery built
            around what you already love
          </div>

          <div>
            Designed &amp; built by{" "}

            <strong>
              Dominik Sakalik
            </strong>

            {" "}✦ 2026
          </div>
        </footer>
      </div>
    </main>
  );
}