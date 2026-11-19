import { createHash } from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.VERCEL_ENV !== 'production' || req.query.run !== 'TEST28155' || Date.now() > 1795093471468) return res.status(404).end();
  const { TIKTOK_PIXEL_ID: pixel, TIKTOK_ACCESS_TOKEN: token, TIKTOK_DEPOSIT_EVENT: event } = process.env;
  if (!pixel || !token || !event) return res.status(503).json({ error: 'Missing configuration' });
  const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': token },
    body: JSON.stringify({
      event_source: 'web', event_source_id: pixel, test_event_code: 'TEST28155',
      data: [{ event, event_time: Math.floor(Date.now() / 1000), event_id: 'easywin-TEST28155-ftd-check',
        user: { external_id: createHash('sha256').update('easywin synthetic test 28155').digest('hex') },
        page: { url: 'https://easymine67.vercel.app/' } }]
    }),
    signal: AbortSignal.timeout(10000)
  });
  const { code, message, request_id } = await response.json();
  return res.status(response.ok && code === 0 ? 200 : 502).json({ code, message, request_id, event, pixel });
}
