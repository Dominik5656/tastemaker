export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);

  const query = url.searchParams.get("q")?.trim();
  const selectedArtist = url.searchParams.get("artist")?.trim();

  if (!query || query.length > 100) {
    return Response.json(
      { error: "Enter a song name." },
      { status: 400 }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json(
      { error: "Spotify credentials are missing." },
      { status: 500 }
    );
  }

  try {
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
        { error: "Spotify authentication failed." },
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();

    const params = new URLSearchParams({
      q: query,
      type: "track",
      market: "SK",
      limit: "10",
    });

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        cache: "no-store",
      }
    );

    if (!searchResponse.ok) {
      return Response.json(
        { error: "Song search failed." },
        { status: 502 }
      );
    }

    const data = await searchResponse.json();

    let songs = (data.tracks?.items || []).map((track) => ({
      id: track.id,
      name: track.name,
      artist: (track.artists || [])
        .map((artist) => artist.name)
        .join(", "),
      artists: (track.artists || []).map((artist) => artist.name),
      image: track.album?.images?.[0]?.url || null,
      album: track.album?.name || null,
      uri: track.uri,
      url: track.external_urls?.spotify || null,
    }));

    // If an artist is already selected,
    // put songs by that artist first.
    if (selectedArtist) {
      const target = selectedArtist.toLowerCase().trim();

      songs = songs.sort((a, b) => {
        const aMatches = a.artists.some(
          (name) => name.toLowerCase().trim() === target
        );

        const bMatches = b.artists.some(
          (name) => name.toLowerCase().trim() === target
        );

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;

        return 0;
      });
    }

    return Response.json({ songs });
  } catch (error) {
    console.error("Song search error:", error);

    return Response.json(
      { error: "Could not search Spotify." },
      { status: 502 }
    );
  }
}