export interface ServerlessRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

export interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

const DATA_GOV_PSI_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  const checkUpstream = req.query?.check === 'upstream';
  let upstreamStatus: 'not_checked' | 'reachable' | 'degraded' = 'not_checked';
  let latencyMs: number | null = null;

  if (checkUpstream) {
    const startedAt = Date.now();
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      const apiKey = process.env.DATA_GOV_SG_API_KEY?.trim();
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const upstreamRes = await fetch(DATA_GOV_PSI_ENDPOINT, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000),
      });
      latencyMs = Date.now() - startedAt;
      upstreamStatus = upstreamRes.ok ? 'reachable' : 'degraded';
    } catch {
      latencyMs = Date.now() - startedAt;
      upstreamStatus = 'degraded';
    }
  }

  res.status(200).json({
    ok: true,
    status: 'healthy',
    service: 'sg-hazewatch-api',
    endpoint: DATA_GOV_PSI_ENDPOINT,
    upstreamStatus,
    latencyMs,
    timestamp: new Date().toISOString(),
  });
}
