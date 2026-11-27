import type { ServerlessRequest, ServerlessResponse } from './health.ts';

const DATA_GOV_PSI_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/psi';
const VALID_DATE_PARAM = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/;

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');

  const rawDate = Array.isArray(req.query?.date)
    ? req.query?.date[0]
    : req.query?.date;

  if (rawDate !== undefined && !VALID_DATE_PARAM.test(rawDate)) {
    res.status(400).json({
      error: 'Invalid date format. Expected YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.',
    });
    return;
  }

  const targetUrl = new URL(DATA_GOV_PSI_ENDPOINT);
  if (rawDate) {
    targetUrl.searchParams.set('date', rawDate);
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const apiKey = process.env.DATA_GOV_SG_API_KEY?.trim();
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      res.status(502).json({
        error: `Upstream Data.gov.sg PSI service returned HTTP ${upstream.status}.`,
      });
      return;
    }

    const payload = (await upstream.json()) as {
      code?: number;
      errorMsg?: string;
      data?: {
        items?: unknown[];
      };
    };

    if (!payload?.data?.items || !Array.isArray(payload.data.items)) {
      res.status(502).json({
        error: 'Unexpected response structure from Data.gov.sg PSI endpoint.',
      });
      return;
    }

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    res.status(200).json(payload);
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError');
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? 'Timed out waiting for Data.gov.sg PSI endpoint.'
        : 'Unable to reach Data.gov.sg PSI endpoint.',
    });
  }
}
