import { createHash, timingSafeEqual } from 'node:crypto';

const digest = value => createHash('sha256').update(value).digest();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const { BINOM_POSTBACK_SECRET: secret, TIKTOK_PIXEL_ID: pixel,
    TIKTOK_ACCESS_TOKEN: token, TIKTOK_DEPOSIT_EVENT: depositEvent } = process.env;
  if (!secret) return res.status(503).end();
  const params = new URL(req.url, 'https://localhost').searchParams;
  if (!timingSafeEqual(digest(params.get('secret') || ''), digest(secret))) {
    return res.status(403).end();
  }
  const status = params.get('status');
  if (params.get('campaign') !== '2' || (status !== 'reg' && status !== 'dep')) {
    return res.status(204).end();
  }
  const click = params.get('clickid');
  const ttclid = params.get('ttclid');
  if (!click || !ttclid || /[{}]/.test(click + ttclid)) return res.status(422).end();
  const event = status === 'reg' ? 'CompleteRegistration' : depositEvent;
  const eventKey = status === 'reg' ? 'registration' : 'first-deposit';
  if (!pixel || !token || !event) return res.status(503).end();
  const conversion = {
    event,
    event_id: digest(`binom:2:${eventKey}:${click}`).toString('hex'),
    event_time: Math.floor(Date.now() / 1000),
    user: { ttclid }
  };
  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token },
      body: JSON.stringify({ event_source: 'web', event_source_id: pixel, data: [conversion] }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok || (await response.json()).code !== 0) return res.status(502).end();
    return res.status(204).end();
  } catch {
    return res.status(502).end();
  }
}
