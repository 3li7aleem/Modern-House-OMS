export default async function handler(req, res) {
  const targetBase = process.env.DESKTOP_API_URL || 'https://washer-lines-shop-shark.trycloudflare.com';

  let file = req.query.file;
  if (Array.isArray(file)) file = file.join('/');
  if (!file) {
    const match = (req.url || '').match(/download[/?=]([^&?#]+)/);
    if (match) file = decodeURIComponent(match[1]);
  }
  file = String(file || '').replace(/\/+$/, '');

  const cleanBase = targetBase.replace(/\/+$/, '');
  const targetUrl = `${cleanBase}/download/${encodeURIComponent(file)}`;

  try {
    const response = await fetch(targetUrl);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const data = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(502).json({ error: 'Failed to proxy file download' });
  }
}
