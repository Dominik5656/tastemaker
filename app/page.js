"use client";

import { useEffect, useState } from "react";

const relatedArtists = {
  "frank ocean": ["Steve Lacy", "Daniel Caesar"],
  "steve lacy": ["Frank Ocean", "Daniel Caesar"],
  "daniel caesar": ["Frank Ocean", "Steve Lacy"],
};

function normalize(text) {
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

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
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

export default function Home() {
  const [input, setInput] = useState("");
  const [songInput, setSongInput] = useState("");

  const [favoriteSongs, setFavoriteSongs] = useState({});
  const [favorites, setFavorites] = useState([]);

  const [artistResults, setArtistResults] = useState([]);
  const [searchingArtists, setSearchingArtists] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [favoriteArtistData, setFavoriteArtistData] = useState({});

  const [songResults, setSongResults] = useState([]);
  const [searchingSongs, setSearchingSongs] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const [tracks, setTracks] = useState([]);
  const [trackCount, setTrackCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");

  const busy = loading || saving;

  // =========================
  // ARTIST SEARCH
  // =========================

  useEffect(() => {
    const query = input.trim();

    if (query.length < 2) {
      setArtistResults([]);
      setSearchingArtists(false);
      return;
    }

    if (
      selectedArtist &&
      normalize(selectedArtist.name) === normalize(query)
    ) {
      setArtistResults([]);
      setSearchingArtists(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearchingArtists(true);

        const response = await fetch(
          `/api/search-artists?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Artist search failed."
          );
        }

        setArtistResults(data.artists || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setArtistResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingArtists(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, selectedArtist]);

  // =========================
  // SONG SEARCH
  // =========================

  useEffect(() => {
    const query = songInput.trim();

    if (query.length < 2) {
      setSongResults([]);
      setSearchingSongs(false);
      return;
    }

    if (
      selectedSong &&
      normalize(selectedSong.name) === normalize(query)
    ) {
      setSongResults([]);
      setSearchingSongs(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearchingSongs(true);

        const artistName =
          selectedArtist?.name || input.trim();

        const params = new URLSearchParams({
          q: query,
        });

        if (artistName) {
          params.set("artist", artistName);
        }

        const response = await fetch(
          `/api/search-songs?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Song search failed."
          );
        }

        setSongResults(data.songs || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setSongResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingSongs(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [songInput, selectedArtist, input, selectedSong]);

  // THIS WAS MISSING IN YOUR FILE
  function clearResults() {
    setTracks([]);
    setMessage("");
    setPlaylistUrl("");
  }

  function saveArtistAndSong(
    artistName,
    songTitle,
    artistData = null
  ) {
    setFavorites((previous) => {
      const alreadyExists = previous.some(
        (artist) =>
          normalize(artist) === normalize(artistName)
      );

      if (alreadyExists) {
        return previous;
      }

      return [...previous, artistName];
    });

    if (artistData) {
      setFavoriteArtistData((previous) => ({
        ...previous,
        [normalize(artistName)]: artistData,
      }));
    }

    if (songTitle) {
      setFavoriteSongs((previous) => {
        const key = normalize(artistName);
        const existingSongs = previous[key] || [];

        const alreadyExists = existingSongs.some(
          (song) =>
            normalize(song) === normalize(songTitle)
        );

        if (alreadyExists) {
          return previous;
        }

        return {
          ...previous,
          [key]: [...existingSongs, songTitle],
        };
      });
    }

    setInput("");
    setSongInput("");

    setSelectedArtist(null);
    setSelectedSong(null);

    setArtistResults([]);
    setSongResults([]);

    clearResults();
  }

  async function addArtist(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const typedArtist = input.trim();
    const typedSong = songInput.trim();

    if (!typedArtist) {
      setMessage("Enter an artist name first.");
      return;
    }

    if (
      selectedArtist &&
      normalize(selectedArtist.name) ===
        normalize(typedArtist)
    ) {
      saveArtistAndSong(
        selectedArtist.name,
        typedSong,
        selectedArtist
      );

      return;
    }

    try {
      const response = await fetch(
        `/api/search-artists?q=${encodeURIComponent(
          typedArtist
        )}`
      );

      if (!response.ok) {
        saveArtistAndSong(
          typedArtist,
          typedSong
        );

        return;
      }

      const data = await response.json();

      const spotifyArtists =
        data.artists || [];

      if (spotifyArtists.length === 0) {
        saveArtistAndSong(
          typedArtist,
          typedSong
        );

        return;
      }

      const normalizedInput =
        normalize(typedArtist);

      const exactMatch =
        spotifyArtists.find(
          (artist) =>
            normalize(artist.name) ===
            normalizedInput
        );

      if (exactMatch) {
        saveArtistAndSong(
          exactMatch.name,
          typedSong,
          exactMatch
        );

        return;
      }

      const rankedArtists =
        spotifyArtists
          .map((artist) => {
            const normalizedArtist =
              normalize(artist.name);

            const editDistance =
              distance(
                normalizedInput,
                normalizedArtist
              );

            const maxLength = Math.max(
              normalizedInput.length,
              normalizedArtist.length
            );

            const similarity =
              maxLength === 0
                ? 0
                : 1 -
                  editDistance /
                    maxLength;

            return {
              ...artist,
              similarity,
              editDistance,
            };
          })
          .sort((a, b) => {
            if (
              b.similarity !==
              a.similarity
            ) {
              return (
                b.similarity -
                a.similarity
              );
            }

            return (
              a.editDistance -
              b.editDistance
            );
          });

      const bestMatch =
        rankedArtists[0];

      if (
        bestMatch &&
        bestMatch.similarity >= 0.55
      ) {
        const confirmed =
          window.confirm(
            `Did you mean "${bestMatch.name}"?`
          );

        if (confirmed) {
          saveArtistAndSong(
            bestMatch.name,
            typedSong,
            bestMatch
          );

          return;
        }
      }

      saveArtistAndSong(
        typedArtist,
        typedSong
      );
    } catch (error) {
      console.error(
        "Artist search error:",
        error
      );

      saveArtistAndSong(
        typedArtist,
        typedSong
      );
    }
  }

  function removeSong(
    artist,
    title
  ) {
    setFavoriteSongs((previous) => {
      const updated = {
        ...previous,
      };

      if (title === undefined) {
        delete updated[
          normalize(artist)
        ];
      } else {
        updated[normalize(artist)] = (
          updated[
            normalize(artist)
          ] || []
        ).filter(
          (song) =>
            normalize(song) !==
            normalize(title)
        );

        if (
          updated[
            normalize(artist)
          ].length === 0
        ) {
          delete updated[
            normalize(artist)
          ];
        }
      }

      return updated;
    });

    clearResults();
  }

  function removeArtist(artist) {
    setFavorites((previous) =>
      previous.filter(
        (name) =>
          normalize(name) !==
          normalize(artist)
      )
    );

    setFavoriteArtistData(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated[
          normalize(artist)
        ];

        return updated;
      }
    );

    removeSong(artist);
  }

  async function findSongs() {
    if (!favorites.length) {
      setMessage(
        "Add at least one artist first."
      );

      return;
    }

    setLoading(true);
    clearResults();

    try {
      async function search(query) {
        const response =
          await fetch(
            `/api/spotify?q=${encodeURIComponent(
              query
            )}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Spotify search failed."
          );
        }

        return data.tracks || [];
      }

      const found = [];
      const missing = [];

      const artistsToSearch =
        new Map();

      for (const artist of favorites) {
        artistsToSearch.set(
          normalize(artist),
          artist
        );

        for (
          const title of
          favoriteSongs[
            normalize(artist)
          ] || []
        ) {
          const cleanArtist =
            artist.replace(/"/g, "");

          const cleanTitle =
            title.replace(/"/g, "");

          const results =
            await search(
              `track:"${cleanTitle}" artist:"${cleanArtist}"`
            );

          const match =
            results.find(
              (track) =>
                normalize(
                  track.title
                ) ===
                normalize(title)
            );

          if (match) {
            found.push(match);
          } else {
            missing.push(
              `${artist} — ${title}`
            );
          }
        }
      }

      for (const artist of favorites) {
        for (
          const similar of
          relatedArtists[
            normalize(artist)
          ] || []
        ) {
          artistsToSearch.set(
            normalize(similar),
            similar
          );
        }
      }

      const batches = [];

      for (
        const artist of
        artistsToSearch.values()
      ) {
        batches.push(
          await search(
            `artist:"${artist.replace(
              /"/g,
              ""
            )}"`
          )
        );
      }

      const longest = Math.max(
        0,
        ...batches.map(
          (batch) => batch.length
        )
      );

      for (
        let index = 0;
        index < longest;
        index++
      ) {
        for (const batch of batches) {
          if (batch[index]) {
            found.push(
              batch[index]
            );
          }
        }
      }

      const unique = [
        ...new Map(
          found.map((track) => [
            track.id,
            track,
          ])
        ).values(),
      ];

      const selected =
        unique.slice(
          0,
          trackCount
        );

      setTracks(selected);

      let text =
        selected.length <
        trackCount
          ? `Found ${selected.length} unique songs. You requested ${trackCount}.`
          : `Your playlist contains ${selected.length} songs.`;

      if (missing.length) {
        text +=
          ` Favorite songs not matched: ${missing.join(
            "; "
          )}.`;
      }

      setMessage(text);
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Search failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyTracks() {
    try {
      await navigator.clipboard.writeText(
        tracks
          .map(
            (track) =>
              `${track.artist} — ${track.title}`
          )
          .join("\n")
      );

      setMessage(
        "Track list copied!"
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

            body: JSON.stringify({
              name:
                "TasteMaker Playlist",

              uris: tracks.map(
                (track) =>
                  track.uri
              ),
            }),
          }
        );

      const data =
        await response.json();

      if (data.playlistUrl) {
        setPlaylistUrl(
          data.playlistUrl
        );
      }

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not save the playlist."
        );

        return;
      }

      setMessage(
        `Saved ${data.added} songs to Spotify!`
      );
    } catch {
      setMessage(
        "Saving could not be confirmed."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // STYLES
  // =========================

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, #1d2a22 0%, #0b0d0c 42%, #060706 100%)",
      color: "#ffffff",
      fontFamily:
        "Inter, Arial, Helvetica, sans-serif",
      padding:
        "40px 20px 80px",
    },

    container: {
      width: "100%",
      maxWidth: 900,
      margin: "0 auto",
    },

    navbar: {
      display: "flex",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 70,
    },

    badge: {
      padding: "7px 12px",
      borderRadius: 999,
      border:
        "1px solid #2d3a31",
      background: "#101411",
      color: "#9ca8a0",
      fontSize: 12,
      fontWeight: 600,
    },

    hero: {
      textAlign: "center",
      marginBottom: 42,
    },

    heroLabel: {
      display:
        "inline-block",
      padding: "8px 14px",
      borderRadius: 999,
      background:
        "rgba(34, 197, 94, 0.12)",
      border:
        "1px solid rgba(34, 197, 94, 0.25)",
      color: "#75ef9b",
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 18,
    },

    title: {
      fontSize:
        "clamp(42px, 8vw, 72px)",
      margin: 0,
      letterSpacing: "-4px",
      lineHeight: 0.95,
      fontWeight: 900,
    },

    titleAccent: {
      color: "#62e887",
    },

    subtitle: {
      maxWidth: 620,
      margin:
        "22px auto 0",
      color: "#9ba49e",
      fontSize: 17,
      lineHeight: 1.7,
    },

    card: {
      background:
        "rgba(18, 22, 19, 0.88)",
      border:
        "1px solid #273129",
      borderRadius: 24,
      padding: 28,
      boxShadow:
        "0 24px 80px rgba(0, 0, 0, 0.35)",
      backdropFilter:
        "blur(18px)",
    },

    sectionTitle: {
      margin: 0,
      marginBottom: 6,
      fontSize: 20,
      fontWeight: 800,
    },

    sectionSubtitle: {
      margin: 0,
      marginBottom: 22,
      color: "#879189",
      fontSize: 14,
    },

    form: {
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(210px, 1fr))",
      gap: 12,
    },

    artistSearchWrapper: {
      position: "relative",
      width: "100%",
    },

    songSearchWrapper: {
      position: "relative",
      width: "100%",
    },

    searchDropdown: {
      position: "absolute",
      top:
        "calc(100% + 8px)",
      left: 0,
      right: 0,
      zIndex: 100,
      background: "#111612",
      border:
        "1px solid #2b362e",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow:
        "0 18px 45px rgba(0,0,0,0.45)",
      maxHeight: 360,
      overflowY: "auto",
    },

    songDropdown: {
      position: "absolute",
      top:
        "calc(100% + 8px)",
      left: 0,
      right: 0,
      zIndex: 100,
      background: "#111612",
      border:
        "1px solid #2b362e",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow:
        "0 18px 45px rgba(0,0,0,0.45)",
      maxHeight: 380,
      overflowY: "auto",
    },

    input: {
      width: "100%",
      boxSizing:
        "border-box",
      background: "#0b0e0c",
      border:
        "1px solid #2b342e",
      color: "#ffffff",
      padding:
        "15px 16px",
      borderRadius: 12,
      outline: "none",
      fontSize: 15,
    },

    artistResult: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding:
        "11px 13px",
      background:
        "transparent",
      border: "none",
      borderBottom:
        "1px solid #202821",
      color: "#ffffff",
      cursor: "pointer",
      textAlign: "left",
    },

    artistResultImage: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      objectFit: "cover",
      flexShrink: 0,
    },

    artistResultFallback: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "#263029",
      color: "#62e887",
      display: "flex",
      alignItems: "center",
      justifyContent:
        "center",
      fontSize: 20,
      flexShrink: 0,
    },

    artistResultName: {
      fontSize: 15,
      fontWeight: 700,
    },

    searchingText: {
      padding: 14,
      color: "#89948c",
      fontSize: 14,
    },

    songResult: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding:
        "10px 12px",
      background:
        "transparent",
      border: "none",
      borderBottom:
        "1px solid #202821",
      color: "#ffffff",
      cursor: "pointer",
      textAlign: "left",
    },

    songResultImage: {
      width: 52,
      height: 52,
      borderRadius: 8,
      objectFit: "cover",
      flexShrink: 0,
    },

    songResultFallback: {
      width: 52,
      height: 52,
      borderRadius: 8,
      background: "#263029",
      color: "#62e887",
      display: "flex",
      alignItems: "center",
      justifyContent:
        "center",
      fontSize: 20,
      flexShrink: 0,
    },

    songResultInfo: {
      minWidth: 0,
    },

    songResultTitle: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: 750,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow:
        "ellipsis",
    },

    songResultArtist: {
      marginTop: 4,
      color: "#879189",
      fontSize: 12,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow:
        "ellipsis",
    },

    addButton: {
      padding:
        "15px 22px",
      borderRadius: 12,
      border: "none",
      background:
        "linear-gradient(135deg, #76f499, #28d967)",
      color: "#07140a",
      fontWeight: 800,
      fontSize: 15,
      cursor:
        busy
          ? "wait"
          : "pointer",
      opacity:
        busy ? 0.6 : 1,
    },

    artistList: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 22,
    },

    artistChip: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding:
        "9px 12px",
      borderRadius: 999,
      border:
        "1px solid #303b33",
      background: "#171c18",
      color: "#ecf4ee",
      fontSize: 14,
    },

    removeButton: {
      border: "none",
      background:
        "transparent",
      color: "#7e8a82",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 15,
      padding: 0,
    },

    songTag: {
      color: "#8b978f",
      fontSize: 12,
      marginLeft: 4,
    },

    settingsRow: {
      marginTop: 24,
      display: "flex",
      gap: 16,
      alignItems: "center",
      justifyContent:
        "space-between",
      flexWrap: "wrap",
      paddingTop: 22,
      borderTop:
        "1px solid #222a24",
    },

    select: {
      background: "#0b0e0c",
      border:
        "1px solid #303a32",
      color: "#ffffff",
      borderRadius: 10,
      padding:
        "10px 14px",
      outline: "none",
    },

    generateButton: {
      width: "100%",
      marginTop: 20,
      padding:
        "17px 22px",
      borderRadius: 14,
      border: "none",
      background:
        "linear-gradient(135deg, #6cf28d, #20c95b)",
      color: "#07140a",
      fontSize: 16,
      fontWeight: 900,
      cursor:
        busy
          ? "wait"
          : "pointer",
      opacity:
        busy ? 0.6 : 1,
      boxShadow:
        "0 12px 34px rgba(40, 217, 103, 0.18)",
    },

    status: {
      minHeight: 22,
      color: "#9ca69f",
      fontSize: 14,
      marginTop: 16,
      textAlign: "center",
    },

    resultsCard: {
      marginTop: 26,
      background: "#101411",
      border:
        "1px solid #273129",
      borderRadius: 24,
      padding: 26,
    },

    resultsHeader: {
      display: "flex",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
      marginBottom: 20,
    },

    resultsTitle: {
      margin: 0,
      fontSize: 24,
      fontWeight: 800,
    },

    smallButton: {
      padding:
        "10px 14px",
      borderRadius: 10,
      border:
        "1px solid #334038",
      background: "#171d19",
      color: "#f2f7f3",
      cursor:
        busy
          ? "wait"
          : "pointer",
      fontWeight: 700,
    },

    saveButton: {
      padding:
        "10px 14px",
      borderRadius: 10,
      border: "none",
      background: "#53e57d",
      color: "#07140a",
      cursor:
        busy
          ? "wait"
          : "pointer",
      fontWeight: 800,
    },

    trackList: {
      display: "grid",
      gap: 10,
    },

    trackCard: {
      display: "flex",
      justifyContent:
        "space-between",
      gap: 12,
      alignItems: "center",
      padding:
        "15px 16px",
      borderRadius: 14,
      background: "#151a16",
      border:
        "1px solid #242d26",
    },

    trackInfo: {
      minWidth: 0,
    },

    trackTitle: {
      margin: 0,
      fontSize: 15,
      fontWeight: 750,
      color: "#ffffff",
    },

    trackArtist: {
      margin: "4px 0 0",
      color: "#818c84",
      fontSize: 13,
    },

    spotifyLink: {
      flexShrink: 0,
      textDecoration: "none",
      color: "#63ea8a",
      fontSize: 13,
      fontWeight: 700,
    },

    openPlaylist: {
      display:
        "inline-block",
      marginTop: 14,
      color: "#62e887",
      textDecoration: "none",
      fontWeight: 700,
    },

    footer: {
      marginTop: 35,
      textAlign: "center",
      color: "#59625c",
      fontSize: 12,
    },
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <nav style={styles.navbar}>
          <img
            src="/tastemaker-logo.png"
            alt="TasteMaker"
            style={{
              width: "220px",
              maxWidth: "55%",
              height: "auto",
              borderRadius: "14px",
            }}
          />

          <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  }}
>
  <div style={styles.badge}>
    MUSIC DISCOVERY
  </div>

  <a
    href="/api/spotify/login"
    style={{
      padding: "9px 15px",
      borderRadius: 999,
      background: "#1DB954",
      color: "#07140a",
      textDecoration: "none",
      fontSize: 13,
      fontWeight: 800,
      whiteSpace: "nowrap",
    }}
  >
    Connect to Spotify
  </a>
</div>
        </nav>

        <section style={styles.hero}>
          <div style={styles.heroLabel}>
            YOUR TASTE. YOUR PLAYLIST.
          </div>

          <h1 style={styles.title}>
            Find your next
            <br />

            <span style={styles.titleAccent}>
              favorite song.
            </span>
          </h1>

          <p style={styles.subtitle}>
            Add artists and songs you already love.
            TasteMaker will build a playlist around
            your music taste.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Build your taste profile
          </h2>

          <p style={styles.sectionSubtitle}>
            Start with an artist. Adding a favorite
            song is optional.
          </p>

          <form
            onSubmit={addArtist}
            style={styles.form}
          >
            <div style={styles.artistSearchWrapper}>
              <input
                aria-label="Favorite artist"
                placeholder="Search for an artist..."
                value={input}
                onChange={(event) => {
                  setInput(
                    event.target.value
                  );

                  setSelectedArtist(
                    null
                  );
                }}
                disabled={busy}
                autoComplete="off"
                style={styles.input}
              />

              {searchingArtists && (
                <div style={styles.searchDropdown}>
                  <div style={styles.searchingText}>
                    Searching artists...
                  </div>
                </div>
              )}

              {!searchingArtists &&
                artistResults.length > 0 && (
                  <div style={styles.searchDropdown}>
                    {artistResults.map(
                      (artist) => (
                        <button
                          type="button"
                          key={artist.id}
                          style={styles.artistResult}
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
                              src={artist.image}
                              alt=""
                              style={
                                styles.artistResultImage
                              }
                            />
                          ) : (
                            <div
                              style={
                                styles.artistResultFallback
                              }
                            >
                              ♪
                            </div>
                          )}

                          <span
                            style={
                              styles.artistResultName
                            }
                          >
                            {artist.name}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
            </div>

            <div style={styles.songSearchWrapper}>
              <input
                aria-label="Favorite song"
                placeholder="Search for a song (optional)..."
                value={songInput}
                onChange={(event) => {
                  setSongInput(
                    event.target.value
                  );

                  setSelectedSong(
                    null
                  );
                }}
                disabled={busy}
                autoComplete="off"
                style={styles.input}
              />

              {searchingSongs && (
                <div style={styles.songDropdown}>
                  <div style={styles.searchingText}>
                    Searching songs...
                  </div>
                </div>
              )}

              {!searchingSongs &&
                songResults.length > 0 && (
                  <div style={styles.songDropdown}>
                    {songResults.map(
                      (song) => (
                        <button
                          type="button"
                          key={song.id}
                          style={styles.songResult}
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
                              src={song.image}
                              alt=""
                              style={
                                styles.songResultImage
                              }
                            />
                          ) : (
                            <div
                              style={
                                styles.songResultFallback
                              }
                            >
                              ♪
                            </div>
                          )}

                          <div
                            style={
                              styles.songResultInfo
                            }
                          >
                            <div
                              style={
                                styles.songResultTitle
                              }
                            >
                              {song.name}
                            </div>

                            <div
                              style={
                                styles.songResultArtist
                              }
                            >
                              {song.artist}
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
              disabled={busy}
              style={styles.addButton}
            >
              + Add
            </button>
          </form>

          {favorites.length > 0 && (
            <div style={styles.artistList}>
              {favorites.map((artist) => {
                const songs =
                  favoriteSongs[
                    normalize(artist)
                  ] || [];

                const artistData =
                  favoriteArtistData[
                    normalize(artist)
                  ];

                return (
                  <div
                    key={artist}
                    style={styles.artistChip}
                  >
                    {artistData?.image ? (
                      <img
                        src={
                          artistData.image
                        }
                        alt=""
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius:
                            "50%",
                          objectFit:
                            "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius:
                            "50%",
                          background:
                            "#273029",
                          color:
                            "#62e887",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: 13,
                        }}
                      >
                        ♪
                      </div>
                    )}

                    <span>
                      {artist}

                      {songs.length > 0 && (
                        <span
                          style={
                            styles.songTag
                          }
                        >
                          {" "}
                          ·{" "}
                          {songs.join(
                            ", "
                          )}
                        </span>
                      )}
                    </span>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        removeArtist(
                          artist
                        )
                      }
                      style={
                        styles.removeButton
                      }
                      title="Remove artist"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={styles.settingsRow}>
            <div>
              <div
                style={{
                  fontWeight: 750,
                  marginBottom: 5,
                }}
              >
                Playlist length
              </div>

              <div
                style={{
                  color: "#7f8a82",
                  fontSize: 13,
                }}
              >
                Choose how many songs you want.
              </div>
            </div>

            <select
              value={trackCount}
              disabled={busy}
              onChange={(event) => {
                setTrackCount(
                  Number(
                    event.target.value
                  )
                );

                clearResults();
              }}
              style={styles.select}
            >
              {[10, 15, 20, 25, 30].map(
                (count) => (
                  <option
                    key={count}
                    value={count}
                  >
                    {count} songs
                  </option>
                )
              )}
            </select>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={findSongs}
            style={styles.generateButton}
          >
            {loading
              ? "Creating your playlist..."
              : "Generate Playlist ♪"}
          </button>

          <p
            role="status"
            style={styles.status}
          >
            {message}
          </p>
        </section>

        {tracks.length > 0 && (
          <section style={styles.resultsCard}>
            <div style={styles.resultsHeader}>
              <div>
                <div
                  style={{
                    color: "#67e58b",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 5,
                  }}
                >
                  YOUR PLAYLIST
                </div>

                <h2 style={styles.resultsTitle}>
                  TasteMaker Mix
                </h2>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={copyTracks}
                  style={styles.smallButton}
                >
                  Copy songs
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={savePlaylist}
                  style={styles.saveButton}
                >
                  {saving
                    ? "Saving..."
                    : "Save to Spotify"}
                </button>
              </div>
            </div>

            <div style={styles.trackList}>
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  style={styles.trackCard}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      minWidth: 0,
                    }}
                  >
                    {track.image ? (
  <img
    src={track.image}
    alt={`${track.title} album cover`}
    style={{
      width: 52,
      height: 52,
      borderRadius: 9,
      objectFit: "cover",
      flexShrink: 0,
    }}
  />
) : (
  <div
    style={{
      width: 52,
      height: 52,
      borderRadius: 9,
      background: "#202822",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#64e789",
      fontWeight: 800,
      flexShrink: 0,
    }}
  >
    {index + 1}
  </div>
)}

                    <div style={styles.trackInfo}>
                      <p style={styles.trackTitle}>
                        {track.title}
                      </p>

                      <p style={styles.trackArtist}>
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {track.url && (
                    <a
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.spotifyLink}
                    >
                      Spotify ↗
                    </a>
                  )}
                </div>
              ))}
            </div>

            {playlistUrl && (
              <a
                href={playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.openPlaylist}
              >
                Open saved playlist in Spotify →
              </a>
            )}
          </section>
        )}

        <footer style={styles.footer}>
          <div>
            TasteMaker · Music discovery based on what you already love
          </div>

          <div
            style={{
              marginTop: "12px",
              fontSize: "13px",
              letterSpacing: "0.5px",
            }}
          >
            Designed & built by{" "}
            <span
              style={{
                color: "#62e887",
                fontWeight: "800",
              }}
            >
              Dominik Sakalik
            </span>
            {" "}✦ 2026
          </div>
        </footer>
      </div>
    </main>
  );
}