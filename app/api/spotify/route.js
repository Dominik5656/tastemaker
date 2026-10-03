export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query || query.length > 200) {
    return Response.json(
      {
        error: "Enter a search query between 1 and 200 characters.",
      },
      { status: 400 }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error: "Spotify credentials are missing from .env.local.",
      },
      { status: 500 }
    );
  }

  try {
    // Get access token
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${clientId}:${clientSecret}`
            ).toString("base64"),

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          grant_type: "client_credentials",
        }),

        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      return Response.json(
        {
          error:
            "Spotify authentication failed. Check your app credentials.",
        },
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const artistMatch = query.match(
      /^artist:"([^"]+)"$/i
    );

    // =====================================================
    // ARTIST SEARCH
    // =====================================================

    if (artistMatch) {
      const requestedArtist = artistMatch[1];

      // First find the artist
      const artistParams = new URLSearchParams({
        q: requestedArtist,
        type: "artist",
        market: "SK",
        limit: "10",
      });

      const artistResponse = await fetch(
        `https://api.spotify.com/v1/search?${artistParams.toString()}`,
        {
          headers,
          cache: "no-store",
        }
      );

      if (!artistResponse.ok) {
        throw new Error("Artist search failed.");
      }

      const artistData =
        await artistResponse.json();

      const artists =
        artistData.artists?.items ?? [];

      // Prefer exact artist name
      const artist =
        artists.find(
          (item) =>
            item.name.toLowerCase().trim() ===
            requestedArtist.toLowerCase().trim()
        ) || artists[0];

      if (!artist) {
        return Response.json({
          tracks: [],
          requestedArtist,
        });
      }

      // Get artist albums/singles
      const albums = [];

      for (
        let offset = 0;
        offset < 30;
        offset += 10
      ) {
        const albumParams =
          new URLSearchParams({
            include_groups:
              "album,single,appears_on",
            market: "SK",
            limit: "10",
            offset: String(offset),
          });

        const albumResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}/albums?${albumParams.toString()}`,
          {
            headers,
            cache: "no-store",
          }
        );

        if (!albumResponse.ok) {
          break;
        }

        const albumData =
          await albumResponse.json();

        const items =
          albumData.items ?? [];

        albums.push(...items);

        if (!albumData.next || items.length === 0) {
          break;
        }
      }

      // Remove duplicate albums
      const uniqueAlbums = [
        ...new Map(
          albums.map((album) => [
            album.id,
            album,
          ])
        ).values(),
      ];

      const collectedTracks = [];

      // Go through albums until we have enough songs
      for (const album of uniqueAlbums) {
        if (collectedTracks.length >= 60) {
          break;
        }

        const trackParams =
          new URLSearchParams({
            market: "SK",
            limit: "50",
          });

        const trackResponse = await fetch(
          `https://api.spotify.com/v1/albums/${album.id}/tracks?${trackParams.toString()}`,
          {
            headers,
            cache: "no-store",
          }
        );

        if (!trackResponse.ok) {
          continue;
        }

        const trackData =
          await trackResponse.json();

        for (const track of trackData.items ?? []) {
          const hasRequestedArtist =
            (track.artists ?? []).some(
              (trackArtist) =>
                trackArtist.id === artist.id
            );

          if (!hasRequestedArtist) {
            continue;
          }

          collectedTracks.push({
            ...track,
            albumName: album.name,
            albumImage:
              album.images?.[0]?.url ?? null,
          });
        }
      }

      // Remove duplicate songs by title
      // This avoids deluxe/remaster copies appearing twice.
      const uniqueTracks = [];

      const seenNames = new Set();

      for (const track of collectedTracks) {
        const key = track.name
          .toLowerCase()
          .replace(
            /\s*-\s*(remaster(ed)?|live|edit|version).*$/i,
            ""
          )
          .trim();

        if (seenNames.has(key)) {
          continue;
        }

        seenNames.add(key);

        uniqueTracks.push(track);
      }

      const tracks = uniqueTracks
        .slice(0, 30)
        .map((track) => ({
          id: track.id,

          title: track.name,

          artist: (track.artists ?? [])
            .map((a) => a.name)
            .join(", "),

          url:
            track.external_urls?.spotify ??
            null,

          uri: track.uri,

          album:
            track.albumName ?? null,

          
        image:
             track.album?.images?.[0]?.url ?? null,
        }));

      return Response.json({
        tracks,
        count: tracks.length,
        requestedArtist: artist.name,
      });
    }

    // =====================================================
    // NORMAL TRACK SEARCH
    // =====================================================

    const found = [];

    for (
      let offset = 0;
      offset < 30;
      offset += 10
    ) {
      const params = new URLSearchParams({
        q: query,
        type: "track",
        market: "SK",
        limit: "10",
        offset: String(offset),
      });

      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?${params.toString()}`,
        {
          headers,
          cache: "no-store",
        }
      );

      if (!searchResponse.ok) {
        return Response.json(
          {
            error:
              searchResponse.status === 429
                ? "Spotify is receiving too many requests. Please try again later."
                : "Spotify search failed.",
          },
          { status: 502 }
        );
      }

      const data =
        await searchResponse.json();

      const items =
        data.tracks?.items ?? [];

      found.push(
        ...items.filter(
          (track) =>
            track?.id &&
            track?.uri &&
            track?.name
        )
      );

      if (!data.tracks?.next) {
        break;
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

    const tracks = unique
      .slice(0, 30)
      .map((track) => ({
        id: track.id,

        title: track.name,

        artist: (track.artists ?? [])
          .map((artist) => artist.name)
          .join(", "),

        url:
          track.external_urls?.spotify ??
          null,

        uri: track.uri,

        album:
          track.album?.name ?? null,

        image:
          track.album?.images?.[0]?.url ??
          null,
      }));

    return Response.json({
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error(
      "Spotify API error:",
      error
    );

    return Response.json(
      {
        error:
          "Could not connect to Spotify. Please try again.",
      },
      { status: 502 }
    );
  }
}