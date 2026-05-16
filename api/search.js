export default async function handler(req, res) {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        error: "Missing search query",
      });
    }

    const apiKey = process.env.GETGEMS_API_KEY;
    const searchUrl = process.env.GETGEMS_SEARCH_URL;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GETGEMS_API_KEY",
      });
    }

    if (!searchUrl) {
      return res.status(500).json({
        error: "Missing GETGEMS_SEARCH_URL",
      });
    }

    const url = new URL(searchUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
         Authorization: apiKey,
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "GetGems request failed",
        details: data,
      });
    }

    return res.status(200).json({
      query,
      raw: data,
      results: normalizeResults(data),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Search failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function normalizeResults(data) {
  const possible =
    data?.results ||
    data?.items ||
    data?.nfts ||
    data?.data ||
    [];

  if (!Array.isArray(possible)) return [];

  return possible.slice(0, 24).map((item, index) => {
    const name =
      item?.name ||
      item?.metadata?.name ||
      item?.title ||
      `Collectible #${index + 1}`;

    const collection =
      item?.collection?.name ||
      item?.collection_name ||
      item?.metadata?.collection ||
      "TON Collectible";

    const image =
      item?.image ||
      item?.preview ||
      item?.metadata?.image ||
      item?.metadata?.content_url ||
      item?.content?.uri ||
      "";

    const value =
      item?.price ||
      item?.floor_price ||
      item?.sale?.price ||
      null;

    return {
      id: item?.address || item?.id || item?.index || `${name}-${index}`,
      name,
      collection,
      image,
      value,
      raw: item,
    };
  });
}
