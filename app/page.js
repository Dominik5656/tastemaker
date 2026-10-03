"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const VIBES = [
  {
    id: "story",
    label: "Story-rich",
  },
  {
    id: "horror",
    label: "Horror",
  },
  {
    id: "relaxing",
    label: "Relaxing",
  },
  {
    id: "open-world",
    label: "Open world",
  },
  {
    id: "multiplayer",
    label: "Multiplayer",
  },
  {
    id: "competitive",
    label: "Competitive",
  },
  {
    id: "indie",
    label: "Indie",
  },
  {
    id: "weird",
    label: "Weird",
  },
];

const PLATFORMS = [
  {
    id: "all",
    label: "Any platform",
  },
  {
    id: "pc",
    label: "PC",
  },
  {
    id: "playstation",
    label: "PlayStation",
  },
  {
    id: "xbox",
    label: "Xbox",
  },
  {
    id: "switch",
    label: "Nintendo Switch",
  },
];

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
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
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
    "aria-hidden": true,
  };

  const icons = {
    game: (
      <>
        <path d="M8 8h8a5 5 0 0 1 4.8 3.6l1 3.5a3 3 0 0 1-5.1 2.9l-1.8-2H9.1l-1.8 2a3 3 0 0 1-5.1-2.9l1-3.5A5 5 0 0 1 8 8Z" />
        <path d="M7 11v4M5 13h4" />
        <circle
          cx="17"
          cy="12"
          r=".7"
          fill="currentColor"
        />
        <circle
          cx="19"
          cy="14"
          r=".7"
          fill="currentColor"
        />
      </>
    ),

    sparkles: (
      <>
        <path d="M12 3l1.2 3.3 3.3 1.2-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z" />
        <path d="m18.5 14 .7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
      </>
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="m6 7 1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6 9a7 7 0 0 1 12-1l2 4" />
        <path d="M18 15a7 7 0 0 1-12 1l-2-4" />
      </>
    ),

    up: (
      <>
        <path d="M7 10v11" />
        <path d="M3 10h4v11H3z" />
        <path d="M7 19h9a2 2 0 0 0 2-1.5l2-7A2 2 0 0 0 18 8h-4l.7-3a2.4 2.4 0 0 0-4.5-2L7 10Z" />
      </>
    ),

    down: (
      <>
        <path d="M7 14V3" />
        <path d="M3 3h4v11H3z" />
        <path d="M7 5h9a2 2 0 0 1 2 1.5l2 7A2 2 0 0 1 18 16h-4l.7 3a2.4 2.4 0 0 1-4.5 2L7 14Z" />
      </>
    ),

    ban: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m5.6 5.6 12.8 12.8" />
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

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
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
      {icons[name] ||
        icons.game}
    </svg>
  );
}

function buildMixName(
  discovery,
  games
) {
  const safe = [
    "Comfort",
    "Familiar",
    "Golden",
    "Classic",
    "Home Base",
  ];

  const middle = [
    "Neon",
    "Parallel",
    "Next Level",
    "Side Quest",
    "After Hours",
  ];

  const wild = [
    "Uncharted",
    "Wild Card",
    "Off Grid",
    "Hidden Gem",
    "Unknown Signal",
  ];

  const endings = [
    "Quest",
    "Run",
    "Arcade",
    "Save File",
    "Session",
    "World",
  ];

  const first =
    discovery <= 30
      ? safe
      : discovery <= 70
      ? middle
      : wild;

  const seed =
    games?.[0]?.id ||
    Date.now();

  return `${
    first[
      Number(seed) %
        first.length
    ]
  } ${
    endings[
      Number(seed) %
        endings.length
    ]
  }`;
}

function GameCover({
  game,
  small = false,
}) {
  if (
    !game?.cover
  ) {
    return (
      <div
        className={
          small
            ? "coverSmall coverFallback"
            : "cover coverFallback"
        }
      >
        <Icon
          name="game"
          size={
            small
              ? 21
              : 34
          }
        />
      </div>
    );
  }

  return (
    <img
      className={
        small
          ? "coverSmall"
          : "cover"
      }

      src={
        game.cover
      }

      alt={`${game.name} cover`}
    />
  );
}

export default function Home() {
  const [
    query,
    setQuery,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    favorites,
    setFavorites,
  ] = useState([]);

  const [
    blockedQuery,
    setBlockedQuery,
  ] = useState("");

  const [
    blockedResults,
    setBlockedResults,
  ] = useState([]);

  const [
    searchingBlocked,
    setSearchingBlocked,
  ] = useState(false);

  const [
    blockedGames,
    setBlockedGames,
  ] = useState([]);

  const [
    recommendations,
    setRecommendations,
  ] = useState([]);

  const [
    discovery,
    setDiscovery,
  ] = useState(55);

  const [
    count,
    setCount,
  ] = useState(12);

  const [
    platform,
    setPlatform,
  ] = useState("all");

  const [
    vibes,
    setVibes,
  ] = useState([]);

  const [
    likedIds,
    setLikedIds,
  ] = useState([]);

  const [
    dislikedIds,
    setDislikedIds,
  ] = useState([]);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    mixName,
    setMixName,
  ] = useState(
    "TasteMaker Games"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingText,
    setLoadingText,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    ready,
    setReady,
  ] = useState(false);

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
        return "Stay close to games you already love.";
      }

      if (
        discovery <= 55
      ) {
        return "Mix obvious matches with fresh discoveries.";
      }

      if (
        discovery <= 80
      ) {
        return "Reach further into connected genres and themes.";
      }

      return "Push into games you probably would not find yourself.";
    }, [discovery]);

  useEffect(() => {
    try {
      const profile =
        localStorage.getItem(
          "tastemaker-games-profile-v1"
        );

      if (profile) {
        const parsed =
          JSON.parse(
            profile
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
          Array.isArray(
            parsed.blockedGames
          )
        ) {
          setBlockedGames(
            parsed.blockedGames
          );
        }

        if (
          Array.isArray(
            parsed.vibes
          )
        ) {
          setVibes(
            parsed.vibes
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
          Number.isFinite(
            parsed.count
          )
        ) {
          setCount(
            parsed.count
          );
        }

        if (
          typeof parsed.platform ===
          "string"
        ) {
          setPlatform(
            parsed.platform
          );
        }
      }

      const savedHistory =
        localStorage.getItem(
          "tastemaker-games-history-v1"
        );

      if (
        savedHistory
      ) {
        const parsed =
          JSON.parse(
            savedHistory
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          setHistory(
            parsed.slice(
              0,
              6
            )
          );
        }
      }
    } catch (
      error
    ) {
      console.warn(
        "Could not restore game profile:",
        error
      );
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    localStorage.setItem(
      "tastemaker-games-profile-v1",

      JSON.stringify({
        favorites,
        blockedGames,
        vibes,
        discovery,
        count,
        platform,
      })
    );
  }, [
    ready,
    favorites,
    blockedGames,
    vibes,
    discovery,
    count,
    platform,
  ]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    localStorage.setItem(
      "tastemaker-games-history-v1",
      JSON.stringify(
        history
      )
    );
  }, [
    ready,
    history,
  ]);

  useEffect(() => {
    const value =
      query.trim();

    if (
      value.length < 2
    ) {
      setSearchResults(
        []
      );

      setSearching(
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
            setSearching(
              true
            );

            const response =
              await fetch(
                `/api/games/search?q=${encodeURIComponent(
                  value
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
                  "Game search failed."
              );
            }

            setSearchResults(
              data.games ||
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

              setSearchResults(
                []
              );
            }
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setSearching(
                false
              );
            }
          }
        },
        300
      );

    return () => {
      clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const value =
      blockedQuery.trim();

    if (
      value.length < 2
    ) {
      setBlockedResults(
        []
      );

      setSearchingBlocked(
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
            setSearchingBlocked(
              true
            );

            const response =
              await fetch(
                `/api/games/search?q=${encodeURIComponent(
                  value
                )}`,
                {
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response.json();

            setBlockedResults(
              (
                data.games ||
                []
              ).filter(
                (game) =>
                  !blockedGames.some(
                    (
                      blocked
                    ) =>
                      blocked.id ===
                      game.id
                  )
              )
            );
          } catch (
            error
          ) {
            if (
              error.name !==
              "AbortError"
            ) {
              setBlockedResults(
                []
              );
            }
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setSearchingBlocked(
                false
              );
            }
          }
        },
        300
      );

    return () => {
      clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    blockedQuery,
    blockedGames,
  ]);

  useEffect(() => {
    if (!loading) {
      setLoadingText("");
      return;
    }

    const stages = [
      "Reading your game taste...",
      "Exploring connected genres...",
      "Avoiding the obvious picks...",
      "Checking hidden gems...",
      "Building your recommendations...",
    ];

    let stage = 0;

    setLoadingText(
      stages[0]
    );

    const timer =
      setInterval(() => {
        stage =
          Math.min(
            stage + 1,
            stages.length - 1
          );

        setLoadingText(
          stages[stage]
        );
      }, 850);

    return () =>
      clearInterval(
        timer
      );
  }, [loading]);

  function resetResults() {
    setRecommendations(
      []
    );

    setLikedIds([]);
    setDislikedIds([]);
  }

  function addFavorite(
    game
  ) {
    if (
      favorites.some(
        (item) =>
          item.id ===
          game.id
      )
    ) {
      setMessage(
        `${game.name} is already in your taste profile.`
      );

      setQuery("");
      setSearchResults([]);

      return;
    }

    setFavorites(
      (previous) =>
        [
          ...previous,
          game,
        ].slice(
          0,
          8
        )
    );

    setBlockedGames(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            game.id
        )
    );

    setQuery("");
    setSearchResults([]);

    resetResults();

    setMessage(
      `Added ${game.name}.`
    );
  }

  function removeFavorite(
    id
  ) {
    setFavorites(
      (previous) =>
        previous.filter(
          (game) =>
            game.id !== id
        )
    );

    resetResults();
  }

  function addBlockedGame(
    game
  ) {
    setBlockedGames(
      (previous) => {
        if (
          previous.some(
            (item) =>
              item.id ===
              game.id
          )
        ) {
          return previous;
        }

        return [
          ...previous,
          game,
        ].slice(
          0,
          30
        );
      }
    );

    setFavorites(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            game.id
        )
    );

    setRecommendations(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            game.id
        )
    );

    setBlockedQuery("");
    setBlockedResults([]);

    setMessage(
      `${game.name} will not be recommended.`
    );
  }

  function removeBlockedGame(
    id
  ) {
    setBlockedGames(
      (previous) =>
        previous.filter(
          (game) =>
            game.id !== id
        )
    );
  }

  function toggleVibe(
    id
  ) {
    setVibes(
      (previous) => {
        if (
          previous.includes(
            id
          )
        ) {
          return previous.filter(
            (item) =>
              item !== id
          );
        }

        if (
          previous.length >=
          3
        ) {
          return [
            ...previous.slice(
              1
            ),
            id,
          ];
        }

        return [
          ...previous,
          id,
        ];
      }
    );

    resetResults();
  }

  function toggleLike(
    id
  ) {
    setLikedIds(
      (previous) =>
        previous.includes(
          id
        )
          ? previous.filter(
              (item) =>
                item !== id
            )
          : [
              ...previous,
              id,
            ]
    );

    setDislikedIds(
      (previous) =>
        previous.filter(
          (item) =>
            item !== id
        )
    );
  }

  function toggleDislike(
    id
  ) {
    setDislikedIds(
      (previous) =>
        previous.includes(
          id
        )
          ? previous.filter(
              (item) =>
                item !== id
            )
          : [
              ...previous,
              id,
            ]
    );

    setLikedIds(
      (previous) =>
        previous.filter(
          (item) =>
            item !== id
        )
    );
  }

  function removeRecommendation(
    id
  ) {
    setRecommendations(
      (previous) =>
        previous.filter(
          (game) =>
            game.id !== id
        )
    );

    setDislikedIds(
      (previous) =>
        previous.includes(
          id
        )
          ? previous
          : [
              ...previous,
              id,
            ]
    );
  }

  function rememberMix(
    name,
    games
  ) {
    const entry = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,

      name,

      discovery,

      platform,

      vibes,

      games,

      createdAt:
        Date.now(),
    };

    setHistory(
      (previous) =>
        [
          entry,
          ...previous,
        ].slice(
          0,
          6
        )
    );
  }

  function loadHistory(
    item
  ) {
    setRecommendations(
      item.games ||
        []
    );

    setMixName(
      item.name ||
        "TasteMaker Games"
    );

    setDiscovery(
      item.discovery ??
        discovery
    );

    setPlatform(
      item.platform ||
        "all"
    );

    setVibes(
      item.vibes ||
        []
    );

    setLikedIds([]);
    setDislikedIds([]);

    setMessage(
      `Loaded ${item.name}.`
    );

    window.scrollTo({
      top:
        document.body
          .scrollHeight,

      behavior:
        "smooth",
    });
  }

  async function generate(
    regenerate = false
  ) {
    if (
      !favorites.length
    ) {
      setMessage(
        "Add at least one favorite game first."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/games/recommend",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                seedIds:
                  favorites.map(
                    (game) =>
                      game.id
                  ),

                likedIds,

                dislikedIds,

                blockedIds:
                  blockedGames.map(
                    (game) =>
                      game.id
                  ),

                excludeIds:
                  regenerate
                    ? recommendations.map(
                        (
                          game
                        ) =>
                          game.id
                      )
                    : [],

                count,

                discovery,

                platform,

                vibes,

                nonce:
                  `${Date.now()}-${Math.random()}`,
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
            "Could not build recommendations."
        );
      }

      const games =
        data.games || [];

      setRecommendations(
        games
      );

      setLikedIds([]);
      setDislikedIds([]);

      if (
        !games.length
      ) {
        setMessage(
          "No recommendations matched those settings. Try Any platform or fewer blocked games."
        );

        return;
      }

      const name =
        buildMixName(
          discovery,
          games
        );

      setMixName(
        name
      );

      rememberMix(
        name,
        games
      );

      setMessage(
        regenerate
          ? `Built a fresh list with ${games.length} games.`
          : `Found ${games.length} games for you.`
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        error.message ||
          "Could not generate recommendations."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyGames() {
    try {
      await navigator
        .clipboard
        .writeText(
          recommendations
            .map(
              (
                game,
                index
              ) =>
                `${index + 1}. ${game.name}${
                  game.year
                    ? ` (${game.year})`
                    : ""
                }`
            )
            .join("\n")
        );

      setMessage(
        "Game list copied."
      );
    } catch {
      setMessage(
        "Could not copy the list."
      );
    }
  }

  function clearProfile() {
    if (
      !window.confirm(
        "Clear your saved game taste?"
      )
    ) {
      return;
    }

    setFavorites([]);
    setBlockedGames([]);
    setVibes([]);
    setRecommendations([]);
    setLikedIds([]);
    setDislikedIds([]);

    setMessage(
      "Game taste profile cleared."
    );
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

        html,
        body {
          margin: 0;
          background: #09090b;
        }

        button,
        input,
        select {
          font: inherit;
        }

        .tm {
          --bg: #09090b;
          --panel: #121216;
          --panel2: #18181e;
          --line: #2b2b32;
          --text: #f7f4eb;
          --muted: #aaa7a0;
          --dim: #77747d;
          --lime: #b7ff5a;
          --purple: #8b78ff;
          --pink: #ff7f9f;

          min-height: 100vh;
          color: var(--text);

          background:
            radial-gradient(
              circle at 90% 8%,
              rgba(139,120,255,.18),
              transparent 28%
            ),
            radial-gradient(
              circle at 4% 32%,
              rgba(183,255,90,.10),
              transparent 24%
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

        .shell {
          width: min(
            1220px,
            calc(100% - 32px)
          );

          margin: 0 auto;

          padding:
            18px 0 64px;
        }

        .nav {
          position: sticky;
          top: 12px;
          z-index: 100;

          min-height: 68px;

          padding:
            10px 12px;

          display: flex;
          align-items: center;
          justify-content:
            space-between;

          gap: 16px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius: 20px;

          background:
            rgba(
              11,
              11,
              14,
              .88
            );

          backdrop-filter:
            blur(20px);

          box-shadow:
            0 18px 60px
            rgba(
              0,
              0,
              0,
              .28
            );
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .brandLogo {
          width: 44px;
          height: 44px;

          border-radius: 12px;

          object-fit: cover;

          background: #050505;
        }

        .brandWords {
          display: flex;
          flex-direction: column;
        }

        .brandWords strong {
          font-size: 17px;
          letter-spacing: -.03em;
        }

        .brandWords span {
          margin-top: 4px;

          color: var(--dim);

          font-size: 11px;
        }

        .mode {
          padding:
            9px 12px;

          display:
            inline-flex;

          align-items: center;

          gap: 7px;

          border:
            1px solid
            rgba(
              183,
              255,
              90,
              .20
            );

          border-radius: 999px;

          background:
            rgba(
              183,
              255,
              90,
              .07
            );

          color: var(--lime);

          font-size: 12px;
          font-weight: 850;
        }

        .hero {
          min-height: 600px;

          padding:
            92px 28px
            70px;

          display: grid;

          grid-template-columns:
            minmax(0,1.2fr)
            minmax(300px,.8fr);

          align-items: center;

          gap: 58px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          color: var(--lime);

          font-size: 13px;
          font-weight: 850;
        }

        .hero h1 {
          margin:
            23px 0 0;

          font-size:
            clamp(
              58px,
              8vw,
              108px
            );

          line-height: .91;

          letter-spacing:
            -.068em;

          font-weight: 950;
        }

        .stroke {
          color: transparent;

          -webkit-text-stroke:
            1px
            rgba(
              247,
              244,
              235,
              .55
            );
        }

        .lime {
          color: var(--lime);
        }

        .heroCopy {
          max-width: 680px;

          margin:
            28px 0 0;

          color: #b7b3ac;

          font-size: 18px;
          line-height: 1.7;
        }

        .heroBadges {
          margin-top: 28px;

          display: flex;
          flex-wrap: wrap;

          gap: 8px;
        }

        .badge {
          padding:
            9px 12px;

          display:
            inline-flex;

          align-items: center;

          gap: 7px;

          border:
            1px solid
            var(--line);

          border-radius: 11px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color: #c9c6bf;

          font-size: 12px;
          font-weight: 750;
        }

        .heroArt {
          position: relative;

          min-height: 370px;

          display: grid;
          place-items: center;
        }

        .orbit {
          position: absolute;

          width: 340px;
          height: 340px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius: 50%;
        }

        .orbit::before,
        .orbit::after {
          content: "";

          position: absolute;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .065
            );

          border-radius: 50%;
        }

        .orbit::before {
          inset: 38px;
        }

        .orbit::after {
          inset: 78px;
        }

        .heroCard {
          position: relative;

          width: 300px;

          padding: 24px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 26px;

          background:
            linear-gradient(
              150deg,
              rgba(
                139,
                120,
                255,
                .24
              ),
              #141419 50%,
              rgba(
                183,
                255,
                90,
                .10
              )
            );

          box-shadow:
            0 35px 90px
            rgba(
              0,
              0,
              0,
              .45
            );

          transform:
            rotate(4deg);
        }

        .heroCardLabel {
          color: #d7d3cc;

          font-size: 12px;
          font-weight: 850;
        }

        .heroCardNumber {
          margin-top: 36px;

          font-size: 56px;
          font-weight: 950;

          letter-spacing: -.06em;
        }

        .heroCardMode {
          color: var(--muted);

          line-height: 1.55;

          font-size: 13px;
        }

        .bar {
          height: 9px;

          margin-top: 22px;

          border-radius: 99px;

          overflow: hidden;

          background: #25252c;
        }

        .bar span {
          display: block;

          height: 100%;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              var(--purple),
              var(--lime)
            );
        }

        .section {
          margin-top: 20px;

          border:
            1px solid
            var(--line);

          border-radius: 26px;

          background:
            var(--panel);
        }

        .sectionHead {
          padding:
            28px 30px 0;
        }

        .kicker {
          color: var(--lime);

          font-size: 12px;
          font-weight: 850;
        }

        .sectionTitle {
          margin:
            7px 0 0;

          font-size:
            clamp(
              30px,
              4vw,
              46px
            );

          line-height: 1;

          letter-spacing: -.045em;
        }

        .sectionCopy {
          max-width: 650px;

          margin:
            12px 0 0;

          color: var(--muted);

          line-height: 1.6;
        }

        .builder {
          padding: 28px 30px 30px;

          display: grid;

          grid-template-columns:
            minmax(0,1.35fr)
            minmax(320px,.65fr);

          gap: 18px;
        }

        .panel {
          padding: 22px;

          border:
            1px solid
            var(--line);

          border-radius: 20px;

          background: #0e0e11;
        }

        .panel h3 {
          margin: 0;

          font-size: 20px;
        }

        .panelCopy {
          margin:
            7px 0 0;

          color: var(--muted);

          font-size: 13px;
          line-height: 1.55;
        }

        .searchWrap {
          position: relative;

          margin-top: 20px;
        }

        .input {
          width: 100%;
          height: 54px;

          padding:
            0 15px;

          border:
            1px solid
            #303038;

          border-radius: 13px;

          outline: none;

          background: #17171c;

          color: var(--text);

          font-size: 15px;
          font-weight: 650;
        }

        .input:focus {
          border-color:
            var(--purple);

          box-shadow:
            0 0 0 3px
            rgba(
              139,
              120,
              255,
              .12
            );
        }

        .input::placeholder {
          color: #68656f;
        }

        .dropdown {
          position: absolute;

          left: 0;
          right: 0;
          top:
            calc(
              100% + 8px
            );

          z-index: 40;

          max-height: 400px;

          overflow-y: auto;

          border:
            1px solid
            #35353e;

          border-radius: 15px;

          background: #111116;

          box-shadow:
            0 24px 70px
            rgba(
              0,
              0,
              0,
              .55
            );
        }

        .searchStatus {
          padding: 15px;

          color: var(--muted);

          font-size: 13px;
        }

        .searchResult {
          width: 100%;

          padding: 10px;

          display: grid;

          grid-template-columns:
            54px
            minmax(0,1fr)
            auto;

          align-items: center;

          gap: 12px;

          border: 0;

          border-bottom:
            1px solid
            #24242a;

          background:
            transparent;

          color: var(--text);

          text-align: left;

          cursor: pointer;
        }

        .searchResult:hover {
          background: #19191f;
        }

        .searchResult:last-child {
          border-bottom: 0;
        }

        .coverSmall {
          width: 54px;
          height: 72px;

          border-radius: 8px;

          object-fit: cover;

          background: #202027;
        }

        .coverFallback {
          display: grid;
          place-items: center;

          color: var(--lime);
        }

        .searchName {
          font-size: 14px;
          font-weight: 900;
        }

        .searchMeta {
          margin-top: 5px;

          color: var(--muted);

          font-size: 11px;
          line-height: 1.45;
        }

        .addWord {
          color: var(--lime);

          font-size: 11px;
          font-weight: 850;
        }

        .favorites {
          margin-top: 18px;

          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );

          gap: 9px;
        }

        .favorite {
          min-width: 0;

          padding: 10px;

          display: grid;

          grid-template-columns:
            46px
            minmax(0,1fr)
            auto;

          align-items: center;

          gap: 10px;

          border:
            1px solid
            #292930;

          border-radius: 14px;

          background: #16161b;
        }

        .favorite .coverSmall {
          width: 46px;
          height: 62px;
        }

        .favoriteName {
          overflow: hidden;

          text-overflow:
            ellipsis;

          white-space: nowrap;

          font-size: 13px;
          font-weight: 900;
        }

        .favoriteMeta {
          margin-top: 4px;

          color: var(--muted);

          font-size: 10px;
        }

        .iconBtn {
          width: 34px;
          height: 34px;

          display: grid;
          place-items: center;

          border:
            1px solid
            transparent;

          border-radius: 9px;

          background:
            transparent;

          color: #77747d;

          cursor: pointer;
        }

        .iconBtn:hover {
          border-color:
            #383840;

          background:
            #222228;

          color: #fff;
        }

        .control +
        .control {
          margin-top: 22px;

          padding-top: 22px;

          border-top:
            1px solid
            #27272e;
        }

        .controlTop {
          display: flex;

          align-items: center;
          justify-content:
            space-between;

          gap: 12px;
        }

        .controlTitle {
          font-size: 14px;
          font-weight: 850;
        }

        .controlValue {
          color: #d9d5cd;

          font-size: 12px;
          font-weight: 800;
        }

        .controlHint {
          margin-top: 6px;

          color: var(--muted);

          font-size: 12px;
          line-height: 1.5;
        }

        .select {
          height: 40px;

          padding:
            0 10px;

          border:
            1px solid
            #303038;

          border-radius: 10px;

          background: #17171c;

          color: var(--text);

          font-size: 12px;
          font-weight: 800;
        }

        .range {
          width: 100%;

          margin-top: 13px;

          accent-color:
            var(--lime);
        }

        .rangeLabels {
          margin-top: 5px;

          display: flex;
          justify-content:
            space-between;

          color: var(--dim);

          font-size: 10px;
        }

        .vibes {
          margin-top: 12px;

          display: flex;
          flex-wrap: wrap;

          gap: 7px;
        }

        .vibe {
          padding:
            8px 10px;

          border:
            1px solid
            #303038;

          border-radius: 999px;

          background: #17171c;

          color: #aaa7b0;

          font-size: 11px;
          font-weight: 800;

          cursor: pointer;
        }

        .vibe.active {
          border-color:
            var(--lime);

          background:
            var(--lime);

          color: #0b0d08;
        }

        .blockedSearch {
          margin-top: 12px;
        }

        .blockedChips {
          margin-top: 9px;

          display: flex;
          flex-wrap: wrap;

          gap: 6px;
        }

        .blockedChip {
          padding:
            6px 8px;

          border:
            1px solid
            rgba(
              255,
              127,
              159,
              .26
            );

          border-radius: 999px;

          background:
            rgba(
              255,
              127,
              159,
              .08
            );

          color: #ffb0c3;

          font-size: 10px;

          cursor: pointer;
        }

        .generate {
          width: 100%;
          height: 58px;

          margin-top: 22px;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 9px;

          border: 0;

          border-radius: 14px;

          background:
            var(--lime);

          color: #0b0d08;

          font-size: 15px;
          font-weight: 950;

          cursor: pointer;
        }

        .generate:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0 14px 40px
            rgba(
              183,
              255,
              90,
              .14
            );
        }

        button:disabled,
        input:disabled,
        select:disabled {
          opacity: .55;
          cursor: wait;
        }

        .status {
          min-height: 20px;

          margin:
            12px 0 0;

          color: var(--muted);

          text-align: center;

          font-size: 12px;
          line-height: 1.5;
        }

        .stats {
          padding:
            0 30px 28px;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0,1fr)
            );

          gap: 8px;
        }

        .stat {
          padding: 14px;

          border:
            1px solid
            var(--line);

          border-radius: 13px;

          background: #0e0e11;
        }

        .stat span {
          color: var(--muted);

          font-size: 11px;
        }

        .stat strong {
          display: block;

          margin-top: 4px;

          font-size: 20px;
        }

        .results {
          padding: 30px;
        }

        .resultsTop {
          display: flex;

          justify-content:
            space-between;

          align-items:
            flex-end;

          gap: 20px;

          flex-wrap: wrap;
        }

        .resultsTitle {
          margin:
            7px 0 0;

          font-size:
            clamp(
              40px,
              6vw,
              70px
            );

          letter-spacing:
            -.055em;

          line-height: .95;
        }

        .resultsMeta {
          margin-top: 11px;

          color: var(--muted);

          font-size: 13px;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;

          gap: 7px;
        }

        .action {
          min-height: 42px;

          padding:
            0 13px;

          display:
            inline-flex;

          align-items: center;
          justify-content: center;

          gap: 7px;

          border:
            1px solid
            #303038;

          border-radius: 11px;

          background: #17171c;

          color: var(--text);

          font-size: 12px;
          font-weight: 850;

          cursor: pointer;
        }

        .gameGrid {
          margin-top: 22px;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0,1fr)
            );

          gap: 12px;
        }

        .gameCard {
          min-width: 0;

          overflow: hidden;

          border:
            1px solid
            #292930;

          border-radius: 17px;

          background: #111115;
        }

        .cover {
          width: 100%;
          aspect-ratio: 264 / 374;

          object-fit: cover;

          background: #202027;
        }

        .gameBody {
          padding: 13px;
        }

        .reason {
          color: var(--lime);

          font-size: 10px;
          font-weight: 850;

          text-transform:
            uppercase;

          letter-spacing: .05em;
        }

        .gameName {
          margin:
            7px 0 0;

          font-size: 17px;
          font-weight: 900;

          line-height: 1.15;
        }

        .gameMeta {
          margin-top: 7px;

          color: var(--muted);

          font-size: 11px;
          line-height: 1.5;
        }

        .gameSummary {
          margin-top: 9px;

          color: #9b9892;

          font-size: 11px;
          line-height: 1.55;

          display:
            -webkit-box;

          -webkit-line-clamp: 3;
          -webkit-box-orient:
            vertical;

          overflow: hidden;
        }

        .rating {
          margin-top: 9px;

          color: #d9d5cd;

          font-size: 11px;
          font-weight: 800;
        }

        .gameActions {
          margin-top: 12px;

          display: flex;
          flex-wrap: wrap;

          gap: 5px;
        }

        .mini {
          min-height: 34px;

          padding:
            0 9px;

          display:
            inline-flex;

          align-items: center;
          justify-content: center;

          gap: 5px;

          border:
            1px solid
            #303038;

          border-radius: 9px;

          background: #18181d;

          color: #aaa7b0;

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;

          text-decoration: none;
        }

        .mini:hover {
          color: #fff;

          border-color:
            #484851;
        }

        .mini.like.active {
          border-color:
            var(--lime);

          background:
            var(--lime);

          color: #0b0d08;
        }

        .mini.dislike.active {
          border-color:
            var(--pink);

          background:
            #9c405a;

          color: #fff;
        }

        .openLink {
          color: var(--lime);
        }

        .feedbackBox {
          margin-top: 18px;

          padding: 12px 14px;

          border:
            1px solid
            rgba(
              139,
              120,
              255,
              .22
            );

          border-radius: 12px;

          background:
            rgba(
              139,
              120,
              255,
              .07
            );

          color: #c9c3ff;

          font-size: 12px;
          line-height: 1.5;
        }

        .history {
          padding: 28px 30px 30px;
        }

        .historyGrid {
          margin-top: 17px;

          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0,1fr)
            );

          gap: 9px;
        }

        .historyCard {
          padding: 12px;

          border:
            1px solid
            #292930;

          border-radius: 14px;

          background: #111115;

          color: var(--text);

          text-align: left;

          cursor: pointer;
        }

        .historyName {
          font-size: 14px;
          font-weight: 900;
        }

        .historyMeta {
          margin-top: 5px;

          color: var(--muted);

          font-size: 11px;
        }

        .clear {
          margin-top: 16px;

          padding:
            9px 11px;

          border:
            1px solid
            #303038;

          border-radius: 10px;

          background:
            transparent;

          color: #85818a;

          font-size: 11px;

          cursor: pointer;
        }

        .footer {
          padding:
            38px 0 8px;

          color: #68656e;

          text-align: center;

          font-size: 11px;

          line-height: 1.7;
        }

        .footer strong {
          color: #bdb8af;
        }

        @media (
          max-width: 1000px
        ) {
          .hero {
            grid-template-columns:
              1fr;
          }

          .builder {
            grid-template-columns:
              1fr;
          }

          .gameGrid {
            grid-template-columns:
              repeat(
                3,
                minmax(0,1fr)
              );
          }
        }

        @media (
          max-width: 760px
        ) {
          .shell {
            width:
              min(
                calc(
                  100% - 18px
                ),
                1220px
              );

            padding-top: 9px;
          }

          .nav {
            top: 8px;
          }

          .mode span {
            display: none;
          }

          .hero {
            min-height: auto;

            padding:
              68px 8px
              45px;

            gap: 30px;
          }

          .hero h1 {
            font-size:
              clamp(
                52px,
                15vw,
                78px
              );
          }

          .heroCopy {
            font-size: 16px;
          }

          .sectionHead {
            padding:
              22px 20px 0;
          }

          .builder,
          .results,
          .history {
            padding: 20px;
          }

          .stats {
            padding:
              0 20px 20px;

            grid-template-columns:
              1fr 1fr;
          }

          .favorites {
            grid-template-columns:
              1fr;
          }

          .gameGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );
          }

          .historyGrid {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 480px
        ) {
          .brandWords span {
            display: none;
          }

          .heroArt {
            min-height: 290px;
          }

          .orbit {
            width: 280px;
            height: 280px;
          }

          .heroCard {
            width: 245px;
          }

          .gameGrid {
            grid-template-columns:
              1fr 1fr;

            gap: 8px;
          }

          .gameName {
            font-size: 14px;
          }

          .gameSummary {
            display: none;
          }
        }
      `}</style>

      <div className="shell">
        <nav className="nav">
          <div className="brand">
            <img
              src="/tastemaker-logo.png"
              alt="TasteMaker"
              className="brandLogo"
            />

            <div className="brandWords">
              <strong>
                TasteMaker
              </strong>

              <span>
                game discovery
              </span>
            </div>
          </div>

          <div className="mode">
            <Icon
              name="game"
              size={16}
            />

            <span>
              Games Mode
            </span>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="eyebrow">
              <Icon
                name="sparkles"
                size={15}
              />

              Find what to play next
            </div>

            <h1>
              Your games.

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
              Add games you already love and TasteMaker will
              explore their genres, themes and connections to find
              games worth playing next.
            </p>

            <div className="heroBadges">
              <div className="badge">
                <Icon
                  name="game"
                  size={14}
                />

                Real game data
              </div>

              <div className="badge">
                <Icon
                  name="up"
                  size={14}
                />

                Learns from feedback
              </div>

              <div className="badge">
                <Icon
                  name="history"
                  size={14}
                />

                Saves recent picks
              </div>
            </div>
          </div>

          <div className="heroArt">
            <div className="orbit" />

            <div className="heroCard">
              <div className="heroCardLabel">
                DISCOVERY LEVEL
              </div>

              <div className="heroCardNumber">
                {discovery}%
              </div>

              <div className="heroCardMode">
                {discoveryLabel}

                <br />

                {discoveryHint}
              </div>

              <div className="bar">
                <span
                  style={{
                    width:
                      `${Math.max(
                        discovery,
                        5
                      )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <div className="kicker">
              01 · BUILD YOUR TASTE
            </div>

            <h2 className="sectionTitle">
              Start with games you love.
            </h2>

            <p className="sectionCopy">
              Search for up to eight favorites. These become
              the DNA of your recommendations.
            </p>
          </div>

          <div className="builder">
            <div className="panel">
              <h3>
                Your games
              </h3>

              <p className="panelCopy">
                Add a mix of favorites for better recommendations.
              </p>

              <div className="searchWrap">
                <input
                  className="input"

                  value={query}

                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }

                  placeholder="Search for a game..."

                  autoComplete="off"

                  disabled={
                    loading
                  }
                />

                {(
                  searching ||
                  searchResults.length >
                    0
                ) && (
                  <div className="dropdown">
                    {searching && (
                      <div className="searchStatus">
                        Searching games...
                      </div>
                    )}

                    {!searching &&
                      searchResults.map(
                        (
                          game
                        ) => (
                          <button
                            type="button"

                            key={
                              game.id
                            }

                            className="searchResult"

                            onClick={() =>
                              addFavorite(
                                game
                              )
                            }
                          >
                            <GameCover
                              game={
                                game
                              }

                              small
                            />

                            <div>
                              <div className="searchName">
                                {
                                  game.name
                                }
                              </div>

                              <div className="searchMeta">
                                {game.year ||
                                  "Unknown year"}

                                {game.genres
                                  ?.length
                                  ? ` · ${game.genres
                                      .slice(
                                        0,
                                        2
                                      )
                                      .map(
                                        (
                                          genre
                                        ) =>
                                          genre.name
                                      )
                                      .join(
                                        ", "
                                      )}`
                                  : ""}
                              </div>
                            </div>

                            <div className="addWord">
                              + ADD
                            </div>
                          </button>
                        )
                      )}
                  </div>
                )}
              </div>

              {favorites.length >
                0 && (
                <div className="favorites">
                  {favorites.map(
                    (
                      game
                    ) => (
                      <div
                        className="favorite"

                        key={
                          game.id
                        }
                      >
                        <GameCover
                          game={
                            game
                          }

                          small
                        />

                        <div>
                          <div className="favoriteName">
                            {
                              game.name
                            }
                          </div>

                          <div className="favoriteMeta">
                            {game.year ||
                              "Game"}

                            {game.rating
                              ? ` · ${game.rating}%`
                              : ""}
                          </div>
                        </div>

                        <button
                          type="button"

                          className="iconBtn"

                          title="Remove"

                          onClick={() =>
                            removeFavorite(
                              game.id
                            )
                          }
                        >
                          <Icon
                            name="trash"
                            size={14}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="panel">
              <h3>
                Tune the search
              </h3>

              <p className="panelCopy">
                Decide how adventurous TasteMaker should be.
              </p>

              <div className="control">
                <div className="controlTop">
                  <div className="controlTitle">
                    Number of games
                  </div>

                  <select
                    className="select"

                    value={
                      count
                    }

                    onChange={(
                      event
                    ) => {
                      setCount(
                        Number(
                          event.target
                            .value
                        )
                      );

                      resetResults();
                    }}
                  >
                    {[
                      8,
                      12,
                      16,
                      20,
                    ].map(
                      (
                        value
                      ) => (
                        <option
                          key={
                            value
                          }

                          value={
                            value
                          }
                        >
                          {
                            value
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="control">
                <div className="controlTop">
                  <div className="controlTitle">
                    Discovery
                  </div>

                  <div className="controlValue">
                    {discovery}% ·{" "}
                    {
                      discoveryLabel
                    }
                  </div>
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

                  onChange={(
                    event
                  ) => {
                    setDiscovery(
                      Number(
                        event.target
                          .value
                      )
                    );

                    resetResults();
                  }}
                />

                <div className="rangeLabels">
                  <span>
                    Familiar
                  </span>

                  <span>
                    Wild
                  </span>
                </div>
              </div>

              <div className="control">
                <div className="controlTop">
                  <div className="controlTitle">
                    Platform
                  </div>

                  <select
                    className="select"

                    value={
                      platform
                    }

                    onChange={(
                      event
                    ) => {
                      setPlatform(
                        event.target
                          .value
                      );

                      resetResults();
                    }}
                  >
                    {PLATFORMS.map(
                      (
                        option
                      ) => (
                        <option
                          key={
                            option.id
                          }

                          value={
                            option.id
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="control">
                <div className="controlTop">
                  <div className="controlTitle">
                    Game vibe
                  </div>

                  <div className="controlValue">
                    {vibes.length}/3
                  </div>
                </div>

                <div className="controlHint">
                  Choose up to three.
                </div>

                <div className="vibes">
                  {VIBES.map(
                    (
                      vibe
                    ) => (
                      <button
                        type="button"

                        key={
                          vibe.id
                        }

                        className={`vibe ${
                          vibes.includes(
                            vibe.id
                          )
                            ? "active"
                            : ""
                        }`}

                        onClick={() =>
                          toggleVibe(
                            vibe.id
                          )
                        }
                      >
                        {
                          vibe.label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="control">
                <div className="controlTitle">
                  Never recommend
                </div>

                <div className="controlHint">
                  Block games you already played or simply never want to see.
                </div>

                <div className="searchWrap blockedSearch">
                  <input
                    className="input"

                    value={
                      blockedQuery
                    }

                    onChange={(
                      event
                    ) =>
                      setBlockedQuery(
                        event.target
                          .value
                      )
                    }

                    placeholder="Search a game to block..."

                    autoComplete="off"
                  />

                  {(
                    searchingBlocked ||
                    blockedResults.length >
                      0
                  ) && (
                    <div className="dropdown">
                      {searchingBlocked && (
                        <div className="searchStatus">
                          Searching...
                        </div>
                      )}

                      {!searchingBlocked &&
                        blockedResults.map(
                          (
                            game
                          ) => (
                            <button
                              type="button"

                              className="searchResult"

                              key={
                                game.id
                              }

                              onClick={() =>
                                addBlockedGame(
                                  game
                                )
                              }
                            >
                              <GameCover
                                game={
                                  game
                                }

                                small
                              />

                              <div>
                                <div className="searchName">
                                  {
                                    game.name
                                  }
                                </div>

                                <div className="searchMeta">
                                  Never recommend
                                </div>
                              </div>

                              <Icon
                                name="ban"
                                size={15}
                              />
                            </button>
                          )
                        )}
                    </div>
                  )}
                </div>

                {blockedGames.length >
                  0 && (
                  <div className="blockedChips">
                    {blockedGames.map(
                      (
                        game
                      ) => (
                        <button
                          type="button"

                          className="blockedChip"

                          key={
                            game.id
                          }

                          onClick={() =>
                            removeBlockedGame(
                              game.id
                            )
                          }
                        >
                          {game.name} ×
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"

                className="generate"

                disabled={
                  loading ||
                  !favorites.length
                }

                onClick={() =>
                  generate(
                    false
                  )
                }
              >
                <Icon
                  name="sparkles"
                  size={18}
                />

                {loading
                  ? loadingText
                  : "Find my next games"}
              </button>

              <div
                className="status"

                role="status"
              >
                {message}
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <span>
                Favorite games
              </span>

              <strong>
                {
                  favorites.length
                }
              </strong>
            </div>

            <div className="stat">
              <span>
                Selected vibes
              </span>

              <strong>
                {
                  vibes.length
                }
              </strong>
            </div>

            <div className="stat">
              <span>
                Blocked
              </span>

              <strong>
                {
                  blockedGames.length
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

                className="clear"

                onClick={
                  clearProfile
                }
              >
                Clear game taste
              </button>
            </div>
          )}
        </section>

        {recommendations.length >
          0 && (
          <section className="section results">
            <div className="resultsTop">
              <div>
                <div className="kicker">
                  02 · YOUR NEXT GAMES
                </div>

                <h2 className="resultsTitle">
                  {mixName}
                </h2>

                <div className="resultsMeta">
                  {recommendations.length} games ·{" "}
                  {discovery}% discovery ·{" "}
                  {
                    PLATFORMS.find(
                      (
                        item
                      ) =>
                        item.id ===
                        platform
                    )?.label
                  }
                </div>
              </div>

              <div className="actions">
                <button
                  type="button"

                  className="action"

                  disabled={
                    loading
                  }

                  onClick={() =>
                    generate(
                      true
                    )
                  }
                >
                  <Icon
                    name="refresh"
                    size={15}
                  />

                  New picks
                </button>

                <button
                  type="button"

                  className="action"

                  onClick={
                    copyGames
                  }
                >
                  <Icon
                    name="copy"
                    size={15}
                  />

                  Copy list
                </button>
              </div>
            </div>

            <div className="feedbackBox">
              Like or dislike games before pressing <strong>New picks</strong>.
              TasteMaker will use that feedback when it builds the next list.
            </div>

            <div className="gameGrid">
              {recommendations.map(
                (
                  game
                ) => {
                  const liked =
                    likedIds.includes(
                      game.id
                    );

                  const disliked =
                    dislikedIds.includes(
                      game.id
                    );

                  return (
                    <article
                      className="gameCard"

                      key={
                        game.id
                      }
                    >
                      <GameCover
                        game={
                          game
                        }
                      />

                      <div className="gameBody">
                        <div className="reason">
                          {
                            game.reason
                          }
                        </div>

                        <h3 className="gameName">
                          {
                            game.name
                          }
                        </h3>

                        <div className="gameMeta">
                          {game.year ||
                            "Unknown year"}

                          {game.genres
                            ?.length
                            ? ` · ${game.genres
                                .slice(
                                  0,
                                  2
                                )
                                .join(
                                  ", "
                                )}`
                            : ""}
                        </div>

                        {game.platforms
                          ?.length >
                          0 && (
                          <div className="gameMeta">
                            {game.platforms
                              .slice(
                                0,
                                3
                              )
                              .join(
                                " · "
                              )}
                          </div>
                        )}

                        {game.rating >
                          0 && (
                          <div className="rating">
                            IGDB rating:{" "}
                            {
                              game.rating
                            }
                            /100
                          </div>
                        )}

                        {game.summary && (
                          <div className="gameSummary">
                            {
                              game.summary
                            }
                          </div>
                        )}

                        <div className="gameActions">
                          <button
                            type="button"

                            className={`mini like ${
                              liked
                                ? "active"
                                : ""
                            }`}

                            title="More like this"

                            onClick={() =>
                              toggleLike(
                                game.id
                              )
                            }
                          >
                            <Icon
                              name="up"
                              size={14}
                            />

                            More
                          </button>

                          <button
                            type="button"

                            className={`mini dislike ${
                              disliked
                                ? "active"
                                : ""
                            }`}

                            title="Less like this"

                            onClick={() =>
                              toggleDislike(
                                game.id
                              )
                            }
                          >
                            <Icon
                              name="down"
                              size={14}
                            />

                            Less
                          </button>

                          <button
                            type="button"

                            className="mini"

                            title="Never recommend"

                            onClick={() =>
                              addBlockedGame(
                                game
                              )
                            }
                          >
                            <Icon
                              name="ban"
                              size={13}
                            />
                          </button>

                          <button
                            type="button"

                            className="mini"

                            title="Remove"

                            onClick={() =>
                              removeRecommendation(
                                game.id
                              )
                            }
                          >
                            <Icon
                              name="trash"
                              size={13}
                            />
                          </button>

                          {game.url && (
                            <a
                              href={
                                game.url
                              }

                              className="mini openLink"

                              target="_blank"

                              rel="noopener noreferrer"
                            >
                              IGDB

                              <Icon
                                name="arrow"
                                size={12}
                              />
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        )}

        {history.length >
          0 && (
          <section className="section history">
            <div className="kicker">
              03 · RECENT PICKS
            </div>

            <h2 className="sectionTitle">
              Previous discoveries.
            </h2>

            <p className="sectionCopy">
              Recent recommendation lists are saved in this browser.
            </p>

            <div className="historyGrid">
              {history.map(
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
                      loadHistory(
                        item
                      )
                    }
                  >
                    <div className="historyName">
                      {
                        item.name
                      }
                    </div>

                    <div className="historyMeta">
                      {item.games?.length ||
                        0}{" "}
                      games ·{" "}
                      {
                        item.discovery
                      }
                      % discovery
                    </div>
                  </button>
                )
              )}
            </div>
          </section>
        )}

        <footer className="footer">
          <div>
            TasteMaker · Find your next game without scrolling through the same charts forever.
          </div>

          <div>
            Designed &amp; built by{" "}
            <strong>
              Dominik Sakalik
            </strong>{" "}
            · 2026
          </div>
        </footer>
      </div>
    </main>
  );
}