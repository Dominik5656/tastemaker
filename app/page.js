"use client";

import { useEffect, useMemo, useState } from "react";

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

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

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

function Icon({ name, size = 18 }) {
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

  if (name === "sparkles") {
    return (
      <svg {...common}>
        <path d="M12 3l1.15 3.3L16.5 7.5l-3.35 1.2L12 12l-1.15-3.3L7.5 7.5l3.35-1.2L12 3Z" />
        <path d="M18.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
        <path d="M5.5 14.5l.85 2.35 2.35.85-2.35.85L5.5 21l-.85-2.45-2.35-.85 2.35-.85L5.5 14.5Z" />
      </svg>
    );
  }

  if (name === "music") {
    return (
      <svg {...common}>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </svg>
    );
  }

  if (name === "spotify") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M7.3 9.8c3.3-1 6.8-.8 9.8.7" />
        <path d="M7.9 12.7c2.7-.75 5.7-.55 8.2.65" />
        <path d="M8.5 15.4c2.15-.55 4.4-.4 6.4.5" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="m6 7 1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  return null;
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

  const favoriteSongCount = useMemo(
    () =>
      Object.values(favoriteSongs).reduce(
        (total, songs) => total + songs.length,
        0
      ),
    [favoriteSongs]
  );

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

        if (artistName) params.set("artist", artistName);

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
        (artist) =>
          normalize(artist) === normalize(artistName)
      );

      if (alreadyExists) return previous;

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

        if (alreadyExists) return previous;

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

    if (busy) return;

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
      const spotifyArtists = data.artists || [];

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

            const maxLength =
              Math.max(
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
            artist.replace(
              /"/g,
              ""
            );

          const cleanTitle =
            title.replace(
              /"/g,
              ""
            );

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

      const longest =
        Math.max(
          0,
          ...batches.map(
            (batch) =>
              batch.length
          )
        );

      for (
        let index = 0;
        index < longest;
        index++
      ) {
        for (
          const batch of
          batches
        ) {
          if (batch[index]) {
            found.push(
              batch[index]
            );
          }
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
          background: #060806;
        }

        body {
          margin: 0;
          background: #060806;
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
          --bg: #060806;
          --surface: rgba(12, 16, 13, 0.72);
          --surface-2: rgba(15, 20, 16, 0.92);
          --surface-3: rgba(255, 255, 255, 0.035);
          --line: rgba(255, 255, 255, 0.08);
          --line-strong: rgba(255, 255, 255, 0.13);
          --text: #f7faf8;
          --muted: #8e9a92;
          --dim: #667168;
          --green: #7cf29d;
          --green-2: #43df76;
          --green-3: #1db954;
          --green-soft: rgba(88, 239, 129, 0.1);

          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          color: var(--text);
          background:
            radial-gradient(circle at 15% 0%, rgba(76, 255, 129, 0.13), transparent 30%),
            radial-gradient(circle at 95% 17%, rgba(26, 199, 89, 0.11), transparent 27%),
            radial-gradient(circle at 50% 100%, rgba(59, 232, 109, 0.06), transparent 35%),
            linear-gradient(180deg, #071008 0%, #060806 38%, #040504 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .tm::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px);
          background-size: 54px 54px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 82%
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
          filter: blur(90px);
          opacity: 0.46;
          animation: floatBlob 15s ease-in-out infinite;
        }

        .blob.one {
          width: 360px;
          height: 360px;
          top: 120px;
          left: -120px;
          background:
            rgba(77, 255, 130, 0.18);
        }

        .blob.two {
          width: 330px;
          height: 330px;
          top: 580px;
          right: -140px;
          background:
            rgba(32, 200, 91, 0.14);
          animation-delay: -6s;
        }

        .blob.three {
          width: 260px;
          height: 260px;
          top: 1100px;
          left: 36%;
          background:
            rgba(87, 239, 132, 0.08);
          animation-delay: -11s;
        }

        @keyframes floatBlob {
          0%,
          100% {
            transform:
              translate3d(0,0,0)
              scale(1);
          }

          50% {
            transform:
              translate3d(0,32px,0)
              scale(1.08);
          }
        }

        .shell {
          width:
            min(
              1180px,
              calc(100% - 28px)
            );

          margin:
            0 auto;

          padding:
            18px 0 70px;

          position:
            relative;

          z-index:
            1;
        }

        .nav {
          position:
            sticky;

          top:
            14px;

          z-index:
            300;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            18px;

          min-height:
            68px;

          padding:
            10px 12px
            10px 18px;

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
              0.64
            );

          backdrop-filter:
            blur(22px)
            saturate(140%);

          box-shadow:
            0 20px 60px
              rgba(0,0,0,0.25),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.025
              );
        }

        .brand {
          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          min-width:
            0;
        }

        .brand img {
          width:
            175px;

          max-width:
            42vw;

          height:
            auto;

          display:
            block;
        }

        .navRight {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;
        }

        .modePill {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          min-height:
            40px;

          padding:
            0 13px;

          border-radius:
            999px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          background:
            rgba(
              255,
              255,
              255,
              0.028
            );

          color:
            #96a39a;

          font-size:
            11px;

          font-weight:
            800;

          letter-spacing:
            .08em;

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
            0 0 16px
            rgba(
              124,
              242,
              157,
              0.95
            );
        }

        .connect {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          min-height:
            42px;

          padding:
            0 16px;

          border-radius:
            999px;

          color:
            #061008;

          background:
            linear-gradient(
              135deg,
              #8cf7a7 0%,
              #51e17d 46%,
              #29c960 100%
            );

          text-decoration:
            none;

          font-size:
            12px;

          font-weight:
            950;

          box-shadow:
            0 12px 34px
            rgba(
              48,
              220,
              104,
              0.18
            );

          transition:
            transform .16s ease,
            filter .16s ease,
            box-shadow .16s ease;
        }

        .connect:hover {
          transform:
            translateY(-2px);

          filter:
            brightness(1.04);

          box-shadow:
            0 16px 40px
            rgba(
              48,
              220,
              104,
              0.24
            );
        }

        .hero {
          position:
            relative;

          padding:
            104px 0 66px;

          text-align:
            center;
        }

        .heroTopline {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          padding:
            9px 13px;

          border-radius:
            999px;

          border:
            1px solid
            rgba(
              124,
              242,
              157,
              0.15
            );

          background:
            rgba(
              124,
              242,
              157,
              0.055
            );

          color:
            #9bf5b4;

          font-size:
            11px;

          font-weight:
            900;

          letter-spacing:
            .12em;

          text-transform:
            uppercase;
        }

        .hero h1 {
          margin:
            24px auto 0;

          max-width:
            980px;

          font-size:
            clamp(
              56px,
              8.7vw,
              112px
            );

          line-height:
            .88;

          letter-spacing:
            -.072em;

          font-weight:
            950;

          text-wrap:
            balance;
        }

        .hero h1 .accent {
          background:
            linear-gradient(
              135deg,
              #d1ffdb 0%,
              #8bf5aa 28%,
              #58e687 56%,
              #27c95f 100%
            );

          -webkit-background-clip:
            text;

          background-clip:
            text;

          color:
            transparent;

          filter:
            drop-shadow(
              0 10px 28px
              rgba(
                55,
                220,
                103,
                0.14
              )
            );
        }

        .hero p {
          width:
            min(
              700px,
              100%
            );

          margin:
            28px auto 0;

          color:
            #929f96;

          font-size:
            clamp(
              15px,
              2vw,
              18px
            );

          line-height:
            1.75;

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
            9px;

          margin-top:
            28px;
        }

        .heroChip {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            7px;

          min-height:
            34px;

          padding:
            0 11px;

          border-radius:
            999px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.055
            );

          background:
            rgba(
              255,
              255,
              255,
              0.024
            );

          color:
            #78847c;

          font-size:
            11px;

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
            310px;

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
                0.038
              ),
              rgba(
                255,
                255,
                255,
                0.01
              )
            ),
            rgba(
              9,
              13,
              10,
              0.78
            );

          box-shadow:
            0 30px 100px
            rgba(
              0,
              0,
              0,
              0.34
            ),
            inset
            0 1px 0
            rgba(
              255,
              255,
              255,
              0.025
            );

          backdrop-filter:
            blur(22px)
            saturate(130%);
        }

        .builder {
          position:
            relative;

          padding:
            30px;

          overflow:
            visible;

          z-index:
            5;
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
            -115px;

          right:
            -90px;

          border-radius:
            50%;

          background:
            rgba(
              81,
              226,
              123,
              0.08
            );

          filter:
            blur(55px);

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
            10px;

          font-weight:
            950;

          letter-spacing:
            .14em;

          text-transform:
            uppercase;
        }

        .sectionTitle {
          margin:
            8px 0 0;

          color:
            #f8fbf9;

          font-size:
            clamp(
              28px,
              4vw,
              38px
            );

          line-height:
            1.04;

          letter-spacing:
            -.045em;

          font-weight:
            950;
        }

        .sectionCopy {
          margin:
            10px 0 0;

          max-width:
            640px;

          color:
            #7f8c83;

          font-size:
            13px;

          line-height:
            1.7;
        }

        .formGrid {
          margin-top:
            28px;

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
            0 0 8px 2px;

          color:
            #98a49c;

          font-size:
            10px;

          font-weight:
            850;

          letter-spacing:
            .09em;

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
              0.075
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
              0.72
            );

          color:
            #f6faf7;

          font-size:
            14px;

          font-weight:
            650;

          transition:
            .16s ease;
        }

        .input::placeholder {
          color:
            #515b54;
        }

        .input:focus {
          border-color:
            rgba(
              124,
              242,
              157,
              0.43
            );

          background:
            rgba(
              5,
              9,
              6,
              0.93
            );

          box-shadow:
            0 0 0 4px
            rgba(
              91,
              232,
              132,
              0.075
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
            none;

          border-radius:
            16px;

          background:
            #eef4ef;

          color:
            #09100b;

          font-size:
            13px;

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
            translateY(-2px);

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
            calc(100% + 8px);

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
              0.09
            );

          border-radius:
            18px;

          background:
            rgba(
              8,
              11,
              9,
              0.98
            );

          box-shadow:
            0 28px 74px
            rgba(
              0,
              0,
              0,
              0.52
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
            12px;

          font-weight:
            750;
        }

        .searchResult {
          width:
            100%;

          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          padding:
            11px 12px;

          border:
            none;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.045
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
            none;
        }

        .searchResult:hover {
          background:
            rgba(
              124,
              242,
              157,
              0.055
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
              0.065
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
          font-size:
            13px;

          font-weight:
            850;

          color:
            #f3f7f4;

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
            #69756d;

          font-size:
            11px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .tasteGrid {
          margin-top:
            22px;

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
          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          min-width:
            0;

          padding:
            11px 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.052
            );

          border-radius:
            17px;

          background:
            rgba(
              255,
              255,
              255,
              0.022
            );

          transition:
            border-color .15s ease,
            background .15s ease,
            transform .15s ease;
        }

        .tasteCard:hover {
          transform:
            translateY(-1px);

          border-color:
            rgba(
              124,
              242,
              157,
              0.14
            );

          background:
            rgba(
              124,
              242,
              157,
              0.028
            );
        }

        .tasteAvatar {
          width:
            44px;

          height:
            44px;

          flex:
            0 0 auto;

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
              0.06
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

          flex:
            1;
        }

        .tasteArtist {
          color:
            #f1f6f2;

          font-size:
            13px;

          font-weight:
            900;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .tasteSong {
          margin-top:
            4px;

          color:
            #6d7971;

          font-size:
            11px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .removeBtn {
          width:
            31px;

          height:
            31px;

          display:
            grid;

          place-items:
            center;

          flex:
            0 0 auto;

          border:
            1px solid
            transparent;

          border-radius:
            50%;

          background:
            transparent;

          color:
            #5e6962;

          cursor:
            pointer;

          transition:
            .14s ease;
        }

        .removeBtn:hover {
          color:
            #fff;

          background:
            rgba(
              255,
              255,
              255,
              0.04
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .controls {
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
              0.055
            );

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            14px;

          flex-wrap:
            wrap;
        }

        .controlLabel {
          color:
            #eaf0eb;

          font-size:
            12px;

          font-weight:
            850;
        }

        .controlHint {
          margin-top:
            4px;

          color:
            #616d65;

          font-size:
            10px;
        }

        .select {
          height:
            42px;

          padding:
            0 34px 0 13px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          border-radius:
            12px;

          outline:
            none;

          background:
            #0a0e0b;

          color:
            #edf2ee;

          font-size:
            12px;

          font-weight:
            800;

          cursor:
            pointer;
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
            none;

          border-radius:
            17px;

          background:
            linear-gradient(
              135deg,
              #92f8aa 0%,
              #59e683 44%,
              #2fd168 100%
            );

          color:
            #061008;

          font-size:
            14px;

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
              0.17
            );

          transition:
            .16s ease;
        }

        .generate:hover:not(:disabled) {
          transform:
            translateY(-2px);

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
              0.22
            );
        }

        .status {
          min-height:
            20px;

          margin:
            13px 0 0;

          text-align:
            center;

          color:
            #7c8980;

          font-size:
            11px;

          line-height:
            1.55;
        }

        .sidePanel {
          position:
            sticky;

          top:
            100px;

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
            #748078;

          font-size:
            11px;

          line-height:
            1.62;
        }

        .stats {
          margin-top:
            20px;

          display:
            grid;

          gap:
            8px;
        }

        .stat {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            12px;

          padding:
            13px 14px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.048
            );

          border-radius:
            14px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );
        }

        .stat span:first-child {
          color:
            #6f7b73;

          font-size:
            10px;

          font-weight:
            800;

          letter-spacing:
            .04em;

          text-transform:
            uppercase;
        }

        .stat strong {
          color:
            #f6faf7;

          font-size:
            18px;

          font-weight:
            950;

          letter-spacing:
            -.03em;
        }

        .connectCard {
          margin-top:
            17px;

          padding:
            14px;

          border-radius:
            15px;

          border:
            1px solid
            rgba(
              124,
              242,
              157,
              0.09
            );

          background:
            rgba(
              124,
              242,
              157,
              0.035
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
            11px;

          font-weight:
            900;
        }

        .connectCardText {
          margin-top:
            7px;

          color:
            #718077;

          font-size:
            10px;

          line-height:
            1.55;
        }

        .results {
          margin-top:
            18px;

          padding:
            25px;

          overflow:
            hidden;
        }

        .resultsHeader {
          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap:
            16px;

          flex-wrap:
            wrap;

          margin-bottom:
            18px;
        }

        .resultsTitle {
          margin:
            7px 0 0;

          font-size:
            clamp(
              29px,
              4vw,
              42px
            );

          line-height:
            .98;

          letter-spacing:
            -.052em;

          font-weight:
            950;
        }

        .resultsActions {
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
            11px;

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
              0.065
            );

          background:
            rgba(
              255,
              255,
              255,
              0.025
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
              0.05
            );
        }

        .saveBtn {
          border:
            none;

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
            translateY(-1px);
        }

        .trackList {
          display:
            grid;

          gap:
            7px;
        }

        .track {
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
            13px;

          padding:
            9px 10px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.045
            );

          border-radius:
            16px;

          background:
            rgba(
              255,
              255,
              255,
              0.018
            );

          transition:
            .15s ease;
        }

        .track:hover {
          transform:
            translateX(3px);

          border-color:
            rgba(
              124,
              242,
              157,
              0.12
            );

          background:
            rgba(
              124,
              242,
              157,
              0.026
            );
        }

        .cover {
          width:
            60px;

          height:
            60px;

          border-radius:
            12px;

          object-fit:
            cover;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );

          background:
            #141a16;

          box-shadow:
            0 9px 22px
            rgba(
              0,
              0,
              0,
              0.2
            );
        }

        .coverFallback {
          display:
            grid;

          place-items:
            center;

          color:
            var(--green);

          font-size:
            12px;

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
            13px;

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
            #6e7a72;

          font-size:
            11px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .trackLink {
          min-height:
            34px;

          padding:
            0 11px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          border-radius:
            10px;

          border:
            1px solid
            rgba(
              124,
              242,
              157,
              0.1
            );

          background:
            rgba(
              124,
              242,
              157,
              0.03
            );

          color:
            #77e997;

          font-size:
            10px;

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
            15px;

          color:
            #7bed9c;

          font-size:
            11px;

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
            #465049;

          font-size:
            10px;

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

        @media (max-width: 930px) {
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

        @media (max-width: 740px) {
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
              145px;
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
              10px;
          }

          .hero {
            padding:
              74px 4px 42px;
          }

          .hero h1 {
            font-size:
              clamp(
                50px,
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

          .stats {
            grid-template-columns:
              1fr;
          }

          .track {
            grid-template-columns:
              auto
              minmax(
                0,
                1fr
              );
          }

          .trackLink {
            grid-column:
              1 / -1;

            width:
              100%;
          }
        }

        @media (max-width: 430px) {
          .brand img {
            width:
              128px;
          }

          .connect {
            padding:
              0 10px;
          }

          .connect span:last-child {
            display:
              none;
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

              Live discovery
            </div>

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
          </div>
        </nav>

        <section className="hero">
          <div className="heroTopline">
            <Icon
              name="sparkles"
              size={14}
            />

            Your taste, upgraded
          </div>

          <h1>
            Music discovery

            <br />

            <span className="accent">
              without the noise.
            </span>
          </h1>

          <p>
            Add the artists and songs
            you already love.
            TasteMaker turns that into
            a clean, personal mix built
            around your actual taste.
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

              Taste-based discovery
            </span>

            <span className="heroChip">
              <Icon
                name="spotify"
                size={13}
              />

              Save straight to Spotify
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
              Build your profile.
            </h2>

            <p className="sectionCopy">
              Add an artist,
              optionally pair them
              with a favorite song,
              then generate a playlist
              around your taste.
            </p>

            <form
              className="formGrid"
              onSubmit={addArtist}
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
                        (artist) => (
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
                        (song) => (
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

                Add taste
              </button>
            </form>

            {favorites.length >
              0 && (
              <div className="tasteGrid">
                {favorites.map(
                  (artist) => {
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

                          <div className="tasteSong">
                            {songs.length >
                            0
                              ? songs.join(
                                  ", "
                                )
                              : "Artist added"}
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
                      </div>
                    );
                  }
                )}
              </div>
            )}

            <div className="controls">
              <div>
                <div className="controlLabel">
                  Playlist length
                </div>

                <div className="controlHint">
                  Choose how deep you
                  want the mix to go.
                </div>
              </div>

              <select
                className="select"
                value={trackCount}
                disabled={busy}
                onChange={(event) => {
                  setTrackCount(
                    Number(
                      event.target
                        .value
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
              className="generate"
              disabled={busy}
              onClick={findSongs}
            >
              {loading ? (
                <>
                  Building your mix...
                </>
              ) : (
                <>
                  Generate playlist

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
              Every artist and favorite
              song shapes what
              TasteMaker builds for you.
            </p>

            <div className="stats">
              <div className="stat">
                <span>
                  Artists
                </span>

                <strong>
                  {favorites.length}
                </strong>
              </div>

              <div className="stat">
                <span>
                  Favorite songs
                </span>

                <strong>
                  {favoriteSongCount}
                </strong>
              </div>

              <div className="stat">
                <span>
                  Target tracks
                </span>

                <strong>
                  {trackCount}
                </strong>
              </div>
            </div>

            <div className="connectCard">
              <div className="connectCardTitle">
                <Icon
                  name="spotify"
                  size={15}
                />

                Spotify ready
              </div>

              <div className="connectCardText">
                Discovery works without
                login. Connect Spotify
                when you want to save
                the finished playlist.
              </div>
            </div>
          </aside>
        </div>

        {tracks.length >
          0 && (
          <section className="glass results">
            <div className="resultsHeader">
              <div>
                <div className="sectionLabel">
                  Your playlist
                </div>

                <h2 className="resultsTitle">
                  TasteMaker Mix
                </h2>
              </div>

              <div className="resultsActions">
                <button
                  type="button"
                  className="ghostBtn"
                  disabled={busy}
                  onClick={copyTracks}
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
                  disabled={busy}
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
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
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
                          size={12}
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
                Open saved playlist
                in Spotify

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
            TasteMaker · Music discovery
            based on what you already love
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