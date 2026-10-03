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

  const favoriteSongCount = Object.values(favoriteSongs).reduce(
    (total, songs) => total + songs.length,
    0
  );

  // ARTIST SEARCH
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
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Artist search failed.");
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

  // SONG SEARCH
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

        const artistName = selectedArtist?.name || input.trim();
        const params = new URLSearchParams({ q: query });

        if (artistName) {
          params.set("artist", artistName);
        }

        const response = await fetch(
          `/api/search-songs?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Song search failed.");
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
        (artist) => normalize(artist) === normalize(artistName)
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
          (song) => normalize(song) === normalize(songTitle)
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
      normalize(selectedArtist.name) === normalize(typedArtist)
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
        `/api/search-artists?q=${encodeURIComponent(typedArtist)}`
      );

      if (!response.ok) {
        saveArtistAndSong(typedArtist, typedSong);
        return;
      }

      const data = await response.json();
      const spotifyArtists = data.artists || [];

      if (spotifyArtists.length === 0) {
        saveArtistAndSong(typedArtist, typedSong);
        return;
      }

      const normalizedInput = normalize(typedArtist);

      const exactMatch = spotifyArtists.find(
        (artist) => normalize(artist.name) === normalizedInput
      );

      if (exactMatch) {
        saveArtistAndSong(
          exactMatch.name,
          typedSong,
          exactMatch
        );
        return;
      }

      const rankedArtists = spotifyArtists
        .map((artist) => {
          const normalizedArtist = normalize(artist.name);
          const editDistance = distance(
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
              : 1 - editDistance / maxLength;

          return {
            ...artist,
            similarity,
            editDistance,
          };
        })
        .sort((a, b) => {
          if (b.similarity !== a.similarity) {
            return b.similarity - a.similarity;
          }

          return a.editDistance - b.editDistance;
        });

      const bestMatch = rankedArtists[0];

      if (bestMatch && bestMatch.similarity >= 0.55) {
        const confirmed = window.confirm(
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

      saveArtistAndSong(typedArtist, typedSong);
    } catch (error) {
      console.error("Artist search error:", error);
      saveArtistAndSong(typedArtist, typedSong);
    }
  }

  function removeSong(artist, title) {
    setFavoriteSongs((previous) => {
      const updated = { ...previous };

      if (title === undefined) {
        delete updated[normalize(artist)];
      } else {
        updated[normalize(artist)] = (
          updated[normalize(artist)] || []
        ).filter(
          (song) => normalize(song) !== normalize(title)
        );

        if (updated[normalize(artist)].length === 0) {
          delete updated[normalize(artist)];
        }
      }

      return updated;
    });

    clearResults();
  }

  function removeArtist(artist) {
    setFavorites((previous) =>
      previous.filter(
        (name) => normalize(name) !== normalize(artist)
      )
    );

    setFavoriteArtistData((previous) => {
      const updated = { ...previous };
      delete updated[normalize(artist)];
      return updated;
    });

    removeSong(artist);
  }

  async function findSongs() {
    if (!favorites.length) {
      setMessage("Add at least one artist first.");
      return;
    }

    setLoading(true);
    clearResults();

    try {
      async function search(query) {
        const response = await fetch(
          `/api/spotify?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Spotify search failed.");
        }

        return data.tracks || [];
      }

      const found = [];
      const missing = [];
      const artistsToSearch = new Map();

      for (const artist of favorites) {
        artistsToSearch.set(normalize(artist), artist);

        for (
          const title of favoriteSongs[normalize(artist)] || []
        ) {
          const cleanArtist = artist.replace(/"/g, "");
          const cleanTitle = title.replace(/"/g, "");

          const results = await search(
            `track:"${cleanTitle}" artist:"${cleanArtist}"`
          );

          const match = results.find(
            (track) => normalize(track.title) === normalize(title)
          );

          if (match) {
            found.push(match);
          } else {
            missing.push(`${artist} — ${title}`);
          }
        }
      }

      for (const artist of favorites) {
        for (
          const similar of relatedArtists[normalize(artist)] || []
        ) {
          artistsToSearch.set(normalize(similar), similar);
        }
      }

      const batches = [];

      for (const artist of artistsToSearch.values()) {
        batches.push(
          await search(
            `artist:"${artist.replace(/"/g, "")}"`
          )
        );
      }

      const longest = Math.max(
        0,
        ...batches.map((batch) => batch.length)
      );

      for (let index = 0; index < longest; index++) {
        for (const batch of batches) {
          if (batch[index]) {
            found.push(batch[index]);
          }
        }
      }

      const unique = [
        ...new Map(
          found.map((track) => [track.id, track])
        ).values(),
      ];

      const selected = unique.slice(0, trackCount);
      setTracks(selected);

      let text =
        selected.length < trackCount
          ? `Found ${selected.length} unique songs. You requested ${trackCount}.`
          : `Your playlist contains ${selected.length} songs.`;

      if (missing.length) {
        text += ` Favorite songs not matched: ${missing.join("; ")}.`;
      }

      setMessage(text);
    } catch (error) {
      console.error(error);
      setMessage(
        error.message || "Search failed. Please try again."
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
            (track) => `${track.artist} — ${track.title}`
          )
          .join("\n")
      );

      setMessage("Track list copied!");
    } catch {
      setMessage("Copy failed. Please allow clipboard access.");
    }
  }

  async function savePlaylist() {
    if (!tracks.length || busy) {
      return;
    }

    setSaving(true);
    setPlaylistUrl("");
    setMessage("Saving to Spotify...");

    try {
      const response = await fetch("/api/spotify/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "TasteMaker Playlist",
          uris: tracks.map((track) => track.uri),
        }),
      });

      const data = await response.json();

      if (data.playlistUrl) {
        setPlaylistUrl(data.playlistUrl);
      }

      if (!response.ok) {
        setMessage(
          data.error || "Could not save the playlist."
        );
        return;
      }

      setMessage(`Saved ${data.added} songs to Spotify!`);
    } catch {
      setMessage("Saving could not be confirmed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="tm-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #050806;
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

        ::selection {
          background: rgba(91, 255, 141, 0.28);
          color: #fff;
        }

        .tm-page {
          --green: #69f28f;
          --green-2: #34df6f;
          --green-3: #1db954;
          --ink: #050806;
          --panel: rgba(13, 18, 15, 0.78);
          --panel-strong: rgba(15, 21, 17, 0.95);
          --line: rgba(255, 255, 255, 0.085);
          --muted: #8d9a91;
          --soft: #c9d2cc;

          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(circle at 12% 0%, rgba(78, 255, 128, 0.16), transparent 28%),
            radial-gradient(circle at 88% 12%, rgba(25, 180, 81, 0.11), transparent 26%),
            radial-gradient(circle at 50% 110%, rgba(55, 245, 113, 0.08), transparent 35%),
            linear-gradient(180deg, #071009 0%, #050806 44%, #040605 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .tm-noise {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.17;
          z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(
            to bottom,
            rgba(0,0,0,.75),
            transparent 80%
          );
        }

        .tm-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          pointer-events: none;
          opacity: 0.4;
          animation: tmFloat 14s ease-in-out infinite;
        }

        .tm-orb-one {
          width: 360px;
          height: 360px;
          background: rgba(66, 255, 121, 0.16);
          top: 160px;
          left: -130px;
        }

        .tm-orb-two {
          width: 300px;
          height: 300px;
          background: rgba(18, 180, 79, 0.14);
          top: 520px;
          right: -100px;
          animation-delay: -5s;
        }

        @keyframes tmFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(0, 28px, 0) scale(1.08);
          }
        }

        .tm-shell {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
          padding: 24px 0 70px;
          position: relative;
          z-index: 1;
        }

        .tm-nav {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 12px 14px 12px 18px;
          border: 1px solid var(--line);
          border-radius: 22px;
          background: rgba(8, 12, 9, 0.66);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.25);
          position: sticky;
          top: 14px;
          z-index: 300;
        }

        .tm-logo {
          display: block;
          width: 188px;
          max-width: 43vw;
          height: auto;
          object-fit: contain;
        }

        .tm-nav-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .tm-mini-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          color: #9cab9f;
          background: rgba(255,255,255,0.035);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .tm-mini-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 16px rgba(105, 242, 143, 0.9);
        }

        .tm-connect {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid rgba(109, 255, 149, 0.28);
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            #73f596 0%,
            #32dd6d 100%
          );
          color: #061209;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 10px 30px rgba(42, 214, 99, 0.2);
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            filter 160ms ease;
          white-space: nowrap;
        }

        .tm-connect:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
          box-shadow: 0 14px 36px rgba(42, 214, 99, 0.27);
        }

        .tm-spotify-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #061209;
          opacity: 0.9;
        }

        .tm-hero {
          padding: 96px 0 54px;
          text-align: center;
          position: relative;
        }

        .tm-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border: 1px solid rgba(105, 242, 143, 0.18);
          border-radius: 999px;
          color: #9af6b1;
          background: rgba(60, 230, 108, 0.07);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .tm-hero-title {
          margin: 24px auto 0;
          max-width: 900px;
          font-size: clamp(54px, 8vw, 96px);
          line-height: 0.93;
          letter-spacing: -0.065em;
          font-weight: 950;
          text-wrap: balance;
        }

        .tm-hero-title span {
          background: linear-gradient(
            135deg,
            #a5ffbb 0%,
            #5df287 46%,
            #27c95f 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .tm-hero-copy {
          width: min(650px, 100%);
          margin: 25px auto 0;
          color: #94a198;
          font-size: clamp(15px, 2vw, 18px);
          line-height: 1.75;
          text-wrap: balance;
        }

        .tm-hero-meta {
          margin-top: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tm-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 999px;
          color: #829087;
          background: rgba(255, 255, 255, 0.026);
          border: 1px solid rgba(255,255,255,0.055);
          font-size: 12px;
          font-weight: 650;
        }

        .tm-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 290px;
          gap: 18px;
          align-items: start;
        }

        .tm-card {
          position: relative;
          overflow: visible;
          border: 1px solid rgba(255,255,255,0.085);
          border-radius: 28px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.042),
              rgba(255,255,255,0.012)
            ),
            rgba(10, 14, 11, 0.82);
          backdrop-filter: blur(20px);
          box-shadow:
            0 28px 90px rgba(0,0,0,0.34),
            inset 0 1px 0 rgba(255,255,255,0.035);
        }

        .tm-builder {
          padding: 30px;
          z-index: 5;
        }

        .tm-card-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          top: -120px;
          right: -90px;
          border-radius: 50%;
          background: rgba(80, 255, 133, 0.10);
          filter: blur(45px);
          pointer-events: none;
        }

        .tm-section-kicker {
          color: #70ec92;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .tm-section-title {
          margin: 7px 0 0;
          color: #f7fbf8;
          font-size: clamp(25px, 4vw, 34px);
          line-height: 1.1;
          letter-spacing: -0.035em;
          font-weight: 900;
        }

        .tm-section-copy {
          margin: 10px 0 0;
          max-width: 590px;
          color: #859188;
          font-size: 14px;
          line-height: 1.65;
        }

        .tm-form {
          margin-top: 26px;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr)
            auto;
          gap: 11px;
          align-items: end;
        }

        .tm-field {
          position: relative;
          min-width: 0;
        }

        .tm-label {
          display: block;
          margin: 0 0 8px 2px;
          color: #a9b4ac;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .tm-input {
          width: 100%;
          height: 54px;
          padding: 0 16px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 15px;
          outline: none;
          background: rgba(3, 7, 4, 0.72);
          color: #f5faf6;
          font-size: 14px;
          font-weight: 650;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        .tm-input::placeholder {
          color: #59645c;
        }

        .tm-input:focus {
          border-color: rgba(103, 240, 141, 0.5);
          background: rgba(5, 10, 7, 0.92);
          box-shadow: 0 0 0 4px rgba(66, 226, 110, 0.085);
        }

        .tm-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .tm-add-button {
          height: 54px;
          padding: 0 20px;
          border: none;
          border-radius: 15px;
          background: linear-gradient(
            135deg,
            #7bf99d 0%,
            #33dd6e 100%
          );
          color: #061108;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 11px 30px rgba(40, 219, 101, 0.18);
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            filter 150ms ease;
          white-space: nowrap;
        }

        .tm-add-button:hover:not(:disabled),
        .tm-generate:hover:not(:disabled),
        .tm-save:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.04);
        }

        .tm-add-button:disabled,
        .tm-generate:disabled,
        .tm-save:disabled,
        .tm-copy:disabled {
          opacity: 0.52;
          cursor: wait;
        }

        .tm-dropdown {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          z-index: 500;
          max-height: 390px;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,0.095);
          border-radius: 18px;
          background: rgba(9, 13, 10, 0.98);
          box-shadow: 0 26px 70px rgba(0,0,0,0.52);
          backdrop-filter: blur(20px);
        }

        .tm-searching {
          padding: 16px;
          color: #88958c;
          font-size: 13px;
          font-weight: 700;
        }

        .tm-result {
          width: 100%;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.055);
          background: transparent;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          text-align: left;
          cursor: pointer;
          transition: background 140ms ease;
        }

        .tm-result:last-child {
          border-bottom: none;
        }

        .tm-result:hover {
          background: rgba(105, 242, 143, 0.075);
        }

        .tm-result-avatar {
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          object-fit: cover;
          background: #1a211c;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .tm-result-avatar.artist {
          border-radius: 50%;
        }

        .tm-result-avatar.song {
          border-radius: 10px;
        }

        .tm-result-fallback {
          display: grid;
          place-items: center;
          color: var(--green);
          font-size: 17px;
        }

        .tm-result-copy {
          min-width: 0;
        }

        .tm-result-title {
          color: #f4f8f5;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-result-subtitle {
          margin-top: 4px;
          color: #758079;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-taste-list {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .tm-taste-item {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 17px;
          background: rgba(255,255,255,0.025);
          transition:
            border-color 150ms ease,
            background 150ms ease;
        }

        .tm-taste-item:hover {
          border-color: rgba(105, 242, 143, 0.18);
          background: rgba(105, 242, 143, 0.035);
        }

        .tm-taste-avatar {
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          border-radius: 50%;
          object-fit: cover;
          background: #172019;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .tm-taste-fallback {
          display: grid;
          place-items: center;
          color: var(--green);
          font-weight: 900;
        }

        .tm-taste-copy {
          min-width: 0;
          flex: 1;
        }

        .tm-taste-artist {
          font-size: 13px;
          font-weight: 850;
          color: #f0f5f1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-taste-song {
          margin-top: 3px;
          color: #7f8b82;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-remove {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid transparent;
          border-radius: 50%;
          background: transparent;
          color: #637068;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .tm-remove:hover {
          color: #fff;
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.07);
        }

        .tm-controls {
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.065);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tm-control-title {
          color: #eef4ef;
          font-size: 13px;
          font-weight: 850;
        }

        .tm-control-subtitle {
          margin-top: 3px;
          color: #6f7b73;
          font-size: 11px;
        }

        .tm-select {
          height: 42px;
          padding: 0 36px 0 13px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          outline: none;
          background: #0a0e0b;
          color: #eef4ef;
          font-weight: 800;
          cursor: pointer;
        }

        .tm-generate {
          width: 100%;
          height: 58px;
          margin-top: 18px;
          border: none;
          border-radius: 17px;
          background: linear-gradient(
            135deg,
            #7df99f 0%,
            #4ee57e 42%,
            #24c95d 100%
          );
          color: #061008;
          font-size: 15px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 14px 35px rgba(38, 211, 94, 0.19);
        }

        .tm-status {
          min-height: 22px;
          margin: 14px 0 0;
          text-align: center;
          color: #89958c;
          font-size: 12px;
          line-height: 1.55;
        }

        .tm-side {
          position: sticky;
          top: 104px;
          padding: 22px;
        }

        .tm-side-title {
          margin: 7px 0 0;
          font-size: 20px;
          letter-spacing: -0.03em;
          font-weight: 900;
        }

        .tm-side-copy {
          margin: 8px 0 0;
          color: #78857c;
          font-size: 12px;
          line-height: 1.6;
        }

        .tm-stats {
          margin-top: 20px;
          display: grid;
          gap: 8px;
        }

        .tm-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 14px;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 14px;
          background: rgba(255,255,255,0.02);
        }

        .tm-stat-label {
          color: #7a877e;
          font-size: 11px;
          font-weight: 750;
        }

        .tm-stat-value {
          color: #f1f6f2;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .tm-side-note {
          margin-top: 17px;
          padding: 13px 14px;
          border-radius: 14px;
          color: #8b988f;
          background: rgba(87, 236, 126, 0.045);
          border: 1px solid rgba(87, 236, 126, 0.10);
          font-size: 11px;
          line-height: 1.6;
        }

        .tm-results {
          margin-top: 18px;
          padding: 26px;
          overflow: hidden;
        }

        .tm-results-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .tm-results-title {
          margin: 6px 0 0;
          color: #f5faf6;
          font-size: clamp(26px, 4vw, 36px);
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 950;
        }

        .tm-result-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tm-copy,
        .tm-save {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .tm-copy {
          border: 1px solid rgba(255,255,255,0.085);
          background: rgba(255,255,255,0.035);
          color: #e8eee9;
        }

        .tm-save {
          border: none;
          background: linear-gradient(135deg, #70f493, #31da6a);
          color: #061008;
        }

        .tm-track-list {
          display: grid;
          gap: 8px;
        }

        .tm-track {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 13px;
          padding: 10px 11px;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 17px;
          background: rgba(255,255,255,0.024);
          transition:
            transform 140ms ease,
            border-color 140ms ease,
            background 140ms ease;
        }

        .tm-track:hover {
          transform: translateX(3px);
          border-color: rgba(105, 242, 143, 0.14);
          background: rgba(105, 242, 143, 0.035);
        }

        .tm-cover {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.07);
          background: #161d18;
          box-shadow: 0 8px 20px rgba(0,0,0,0.18);
        }

        .tm-cover-fallback {
          display: grid;
          place-items: center;
          color: var(--green);
          font-weight: 950;
        }

        .tm-track-copy {
          min-width: 0;
        }

        .tm-track-title {
          margin: 0;
          color: #f5f8f6;
          font-size: 14px;
          font-weight: 850;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-track-artist {
          margin: 4px 0 0;
          color: #77847b;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-track-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 11px;
          border: 1px solid rgba(105, 242, 143, 0.13);
          border-radius: 10px;
          color: #79ef99;
          background: rgba(105, 242, 143, 0.04);
          text-decoration: none;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .tm-open-playlist {
          display: inline-flex;
          margin-top: 16px;
          color: #72ec92;
          font-size: 12px;
          font-weight: 850;
          text-decoration: none;
        }

        .tm-footer {
          padding: 34px 0 4px;
          text-align: center;
          color: #4f5a53;
          font-size: 11px;
          line-height: 1.7;
        }

        .tm-footer strong {
          color: #78e998;
          font-weight: 850;
        }

        @media (max-width: 900px) {
          .tm-layout {
            grid-template-columns: 1fr;
          }

          .tm-side {
            position: relative;
            top: auto;
          }

          .tm-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .tm-shell {
            width: min(100% - 20px, 1120px);
            padding-top: 10px;
          }

          .tm-nav {
            min-height: 64px;
            padding: 10px 11px 10px 14px;
            border-radius: 18px;
            top: 8px;
          }

          .tm-mini-badge {
            display: none;
          }

          .tm-connect {
            min-height: 38px;
            padding: 0 12px;
            font-size: 11px;
          }

          .tm-hero {
            padding: 70px 6px 38px;
          }

          .tm-hero-title {
            font-size: clamp(48px, 15vw, 72px);
          }

          .tm-form {
            grid-template-columns: 1fr;
          }

          .tm-add-button {
            width: 100%;
          }

          .tm-builder,
          .tm-results {
            padding: 21px;
            border-radius: 22px;
          }

          .tm-taste-list {
            grid-template-columns: 1fr;
          }

          .tm-stats {
            grid-template-columns: 1fr;
          }

          .tm-track {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .tm-track-link {
            grid-column: 1 / -1;
            width: 100%;
          }
        }

        @media (max-width: 430px) {
          .tm-logo {
            width: 145px;
          }

          .tm-connect {
            padding: 0 10px;
          }

          .tm-spotify-dot {
            display: none;
          }
        }
      `}</style>

      <div className="tm-noise" />
      <div className="tm-orb tm-orb-one" />
      <div className="tm-orb tm-orb-two" />

      <div className="tm-shell">
        <nav className="tm-nav">
          <img
            className="tm-logo"
            src="/tastemaker-logo.png"
            alt="TasteMaker"
          />

          <div className="tm-nav-actions">
            <div className="tm-mini-badge">
              <span className="tm-mini-dot" />
              Music discovery
            </div>

            <a
              className="tm-connect"
              href="/api/spotify/login"
            >
              <span className="tm-spotify-dot" />
              Connect Spotify
            </a>
          </div>
        </nav>

        <section className="tm-hero">
          <div className="tm-eyebrow">
            <span className="tm-mini-dot" />
            Built around your taste
          </div>

          <h1 className="tm-hero-title">
            Find the songs you
            <br />
            <span>didn&apos;t know you loved.</span>
          </h1>

          <p className="tm-hero-copy">
            Drop in the artists and songs already on repeat.
            TasteMaker turns your taste into a clean, instant
            playlist built for discovery.
          </p>

          <div className="tm-hero-meta">
            <div className="tm-meta-pill">
              Live Spotify search
            </div>

            <div className="tm-meta-pill">
              Artist + song matching
            </div>

            <div className="tm-meta-pill">
              Save straight to Spotify
            </div>
          </div>
        </section>

        <div className="tm-layout">
          <section className="tm-card tm-builder">
            <div className="tm-card-glow" />

            <div className="tm-section-kicker">
              01 · Build your taste
            </div>

            <h2 className="tm-section-title">
              Start with what you already love.
            </h2>

            <p className="tm-section-copy">
              Add an artist, optionally pair them with a
              favorite song, then keep stacking your profile
              until it feels like you.
            </p>

            <form
              className="tm-form"
              onSubmit={addArtist}
            >
              <div className="tm-field">
                <label
                  className="tm-label"
                  htmlFor="artist-search"
                >
                  Favorite artist
                </label>

                <input
                  id="artist-search"
                  className="tm-input"
                  aria-label="Favorite artist"
                  placeholder="Search an artist..."
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    setSelectedArtist(null);
                  }}
                  disabled={busy}
                  autoComplete="off"
                />

                {searchingArtists && (
                  <div className="tm-dropdown">
                    <div className="tm-searching">
                      Searching artists...
                    </div>
                  </div>
                )}

                {!searchingArtists &&
                  artistResults.length > 0 && (
                    <div className="tm-dropdown">
                      {artistResults.map((artist) => (
                        <button
                          type="button"
                          key={artist.id}
                          className="tm-result"
                          onClick={() => {
                            setInput(artist.name);
                            setSelectedArtist(artist);
                            setArtistResults([]);
                          }}
                        >
                          {artist.image ? (
                            <img
                              className="tm-result-avatar artist"
                              src={artist.image}
                              alt=""
                            />
                          ) : (
                            <div className="tm-result-avatar artist tm-result-fallback">
                              ♪
                            </div>
                          )}

                          <div className="tm-result-copy">
                            <div className="tm-result-title">
                              {artist.name}
                            </div>

                            <div className="tm-result-subtitle">
                              Artist
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>

              <div className="tm-field">
                <label
                  className="tm-label"
                  htmlFor="song-search"
                >
                  Favorite song · optional
                </label>

                <input
                  id="song-search"
                  className="tm-input"
                  aria-label="Favorite song"
                  placeholder="Search a song..."
                  value={songInput}
                  onChange={(event) => {
                    setSongInput(event.target.value);
                    setSelectedSong(null);
                  }}
                  disabled={busy}
                  autoComplete="off"
                />

                {searchingSongs && (
                  <div className="tm-dropdown">
                    <div className="tm-searching">
                      Searching songs...
                    </div>
                  </div>
                )}

                {!searchingSongs &&
                  songResults.length > 0 && (
                    <div className="tm-dropdown">
                      {songResults.map((song) => (
                        <button
                          type="button"
                          key={song.id}
                          className="tm-result"
                          onClick={() => {
                            setSongInput(song.name);
                            setSelectedSong(song);
                            setSongResults([]);
                          }}
                        >
                          {song.image ? (
                            <img
                              className="tm-result-avatar song"
                              src={song.image}
                              alt=""
                            />
                          ) : (
                            <div className="tm-result-avatar song tm-result-fallback">
                              ♪
                            </div>
                          )}

                          <div className="tm-result-copy">
                            <div className="tm-result-title">
                              {song.name}
                            </div>

                            <div className="tm-result-subtitle">
                              {song.artist}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>

              <button
                type="submit"
                className="tm-add-button"
                disabled={busy}
              >
                + Add taste
              </button>
            </form>

            {favorites.length > 0 && (
              <div className="tm-taste-list">
                {favorites.map((artist) => {
                  const songs =
                    favoriteSongs[normalize(artist)] || [];

                  const artistData =
                    favoriteArtistData[normalize(artist)];

                  return (
                    <div
                      className="tm-taste-item"
                      key={artist}
                    >
                      {artistData?.image ? (
                        <img
                          className="tm-taste-avatar"
                          src={artistData.image}
                          alt=""
                        />
                      ) : (
                        <div className="tm-taste-avatar tm-taste-fallback">
                          ♪
                        </div>
                      )}

                      <div className="tm-taste-copy">
                        <div className="tm-taste-artist">
                          {artist}
                        </div>

                        <div className="tm-taste-song">
                          {songs.length > 0
                            ? songs.join(", ")
                            : "Artist added to your taste profile"}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="tm-remove"
                        disabled={busy}
                        onClick={() =>
                          removeArtist(artist)
                        }
                        title="Remove artist"
                        aria-label={`Remove ${artist}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="tm-controls">
              <div>
                <div className="tm-control-title">
                  Playlist length
                </div>

                <div className="tm-control-subtitle">
                  Choose how deep you want the mix to go.
                </div>
              </div>

              <select
                className="tm-select"
                value={trackCount}
                disabled={busy}
                onChange={(event) => {
                  setTrackCount(
                    Number(event.target.value)
                  );

                  clearResults();
                }}
              >
                {[10, 15, 20, 25, 30].map((count) => (
                  <option
                    key={count}
                    value={count}
                  >
                    {count} songs
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="tm-generate"
              disabled={busy}
              onClick={findSongs}
            >
              {loading
                ? "Building your mix..."
                : "Generate my playlist  ♪"}
            </button>

            <p
              className="tm-status"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          </section>

          <aside className="tm-card tm-side">
            <div className="tm-section-kicker">
              Taste profile
            </div>

            <h3 className="tm-side-title">
              Your mix at a glance.
            </h3>

            <p className="tm-side-copy">
              Every artist and favorite song shapes the
              playlist you generate.
            </p>

            <div className="tm-stats">
              <div className="tm-stat">
                <span className="tm-stat-label">
                  Artists
                </span>

                <span className="tm-stat-value">
                  {favorites.length}
                </span>
              </div>

              <div className="tm-stat">
                <span className="tm-stat-label">
                  Favorite songs
                </span>

                <span className="tm-stat-value">
                  {favoriteSongCount}
                </span>
              </div>

              <div className="tm-stat">
                <span className="tm-stat-label">
                  Playlist target
                </span>

                <span className="tm-stat-value">
                  {trackCount}
                </span>
              </div>
            </div>

            <div className="tm-side-note">
              You can discover without signing in. Connect
              Spotify when you want to save the finished
              playlist to your account.
            </div>
          </aside>
        </div>

        {tracks.length > 0 && (
          <section className="tm-card tm-results">
            <div className="tm-results-header">
              <div>
                <div className="tm-section-kicker">
                  02 · Your playlist
                </div>

                <h2 className="tm-results-title">
                  TasteMaker Mix
                </h2>
              </div>

              <div className="tm-result-actions">
                <button
                  type="button"
                  className="tm-copy"
                  disabled={busy}
                  onClick={copyTracks}
                >
                  Copy songs
                </button>

                <button
                  type="button"
                  className="tm-save"
                  disabled={busy}
                  onClick={savePlaylist}
                >
                  {saving
                    ? "Saving..."
                    : "Save to Spotify"}
                </button>
              </div>
            </div>

            <div className="tm-track-list">
              {tracks.map((track, index) => (
                <div
                  className="tm-track"
                  key={track.id}
                >
                  {track.image ? (
                    <img
                      className="tm-cover"
                      src={track.image}
                      alt={`${track.title} album cover`}
                    />
                  ) : (
                    <div className="tm-cover tm-cover-fallback">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  )}

                  <div className="tm-track-copy">
                    <p className="tm-track-title">
                      {track.title}
                    </p>

                    <p className="tm-track-artist">
                      {track.artist}
                    </p>
                  </div>

                  {track.url && (
                    <a
                      className="tm-track-link"
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open ↗
                    </a>
                  )}
                </div>
              ))}
            </div>

            {playlistUrl && (
              <a
                className="tm-open-playlist"
                href={playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open saved playlist in Spotify →
              </a>
            )}
          </section>
        )}

        <footer className="tm-footer">
          <div>
            TasteMaker · Music discovery based on what
            you already love
          </div>

          <div>
            Designed &amp; built by{" "}
            <strong>Dominik Sakalik</strong> ✦ 2026
          </div>
        </footer>
      </div>
    </main>
  );
}