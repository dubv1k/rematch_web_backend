import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 1. Берём турниры из KV
      const tournaments = (await kv.get('tournaments')) || [];

      // 2. Строка "сегодня" в формате YYYY-MM-DD (UTC)
      const todayStr = new Date().toISOString().slice(0, 10);

      // 3. Фильтруем: оставляем турниры с датой >= сегодня
      const filtered = tournaments.filter((t) => {
        if (!t.date) return true;            // без даты — не трогаем
        if (typeof t.date !== 'string') return true;
        // если дата раньше сегодняшней — выкидываем
        return t.date >= todayStr;
      });

      // 4. Если что-то реально удалили — сохраняем обратно в KV
      if (filtered.length !== tournaments.length) {
        await kv.set('tournaments', filtered);
      }

      // 5. Отдаём уже очищенный список
      return res.status(200).json(filtered);
    }

    if (req.method === 'POST') {
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
