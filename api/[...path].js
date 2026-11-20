export default async function handler(req, res) {
  const targetBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';

  try {
    const rawUrl = req.url || '/';
    const path = rawUrl.startsWith('/api') ? rawUrl : `/api${rawUrl}`;
    const cleanBase = targetBase.replace(/\/+$/, '');
    const url = `${cleanBase}${path}`;

    const headers = { ...req.headers };
    delete headers.host;

    const options = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(url, options);
    const data = await response.arrayBuffer();

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error('Error proxying to desktop service:', error);
    res.status(502).json({ error: 'Failed to communicate with desktop internal service' });
  }
}
