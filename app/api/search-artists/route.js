export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query || query.length > 100) {
    return Response.json(
      { error: "Enter an artist name." },
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
      type: "artist",
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
        { error: "Artist search failed." },
        { status: 502 }
      );
    }

    const data = await searchResponse.json();

    const artists = (data.artists?.items || []).map(
      (artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        url: artist.external_urls?.spotify || null,
      })
    );

    return Response.json({ artists });
  } catch (error) {
    console.error("Artist search error:", error);

    return Response.json(
      { error: "Could not search Spotify." },
      { status: 502 }
    );
  }
}