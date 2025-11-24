import { Redis } from '@vercel/kv';

const kv = Redis.fromEnv();

export default async function handler(req, res) {
  // CORS — чтобы фронт с GitHub Pages / другого домена мог обращаться
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Получаем список турниров
      const tournaments = (await kv.get('tournaments')) || [];
      return res.status(200).json(Array.isArray(tournaments) ? tournaments : []);
    }

    if (req.method === 'POST') {
      // Сохраняем полный список турниров
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Body must be an array' });
          }

          await kv.set('tournaments', data);
          return res.status(200).json({ ok: true });
        } catch (e) {
          console.error('Parse error in /api/tournaments:', e);
          return res.status(400).json({ error: 'Invalid JSON' });
        }
      });
      return;
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('Tournaments API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
