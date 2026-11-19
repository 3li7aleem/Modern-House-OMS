export default async function handler(req, res) {
  const targetBase = process.env.DESKTOP_API_URL;
  if (!targetBase) {
    return res.status(500).json({ error: 'DESKTOP_API_URL binding not configured' });
  }

  try {
    const url = new URL(req.url, targetBase);
    const headers = { ...req.headers };
    delete headers.host;

    const options = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(url.toString(), options);
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
