export default async function handler(req, res) {
  const targetBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';

  try {
    const url = new URL(req.url, targetBase);
    const headers = { ...req.headers };
    delete headers.host;

    const response = await fetch(url.toString(), {
      method: req.method,
      headers
    });

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error('Error proxying download to desktop service:', error);
    res.status(502).json({ error: 'Failed to download file from desktop internal service' });
  }
}
