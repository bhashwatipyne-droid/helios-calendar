import { AwsClient } from 'aws4fetch';

/** Cloudflare R2 via the S3 API. Returns null when the R2_* env vars are not set. */
export function r2() {
  const account = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'helios-calendars';
  if (!account || !accessKeyId || !secretAccessKey) return null;
  return {
    aws: new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' }),
    base: `https://${account}.r2.cloudflarestorage.com/${bucket}`,
  };
}

/** Presigned URL for one object (PUT for uploads, GET for admin downloads). */
export async function presign(method: 'GET' | 'PUT', key: string, expires = 300): Promise<string> {
  const c = r2();
  if (!c) throw new Error('R2 not configured');
  const url = `${c.base}/${key}?X-Amz-Expires=${expires}`;
  return (await c.aws.sign(new Request(url, { method }), { aws: { signQuery: true } })).url;
}

export type R2Object = { key: string; size: number; lastModified: string };

/** Lists every object under a prefix (handles pagination). */
export async function listAll(prefix: string): Promise<R2Object[]> {
  const c = r2();
  if (!c) throw new Error('R2 not configured');
  const out: R2Object[] = [];
  let token = '';
  for (;;) {
    const url = `${c.base}?list-type=2&max-keys=1000&prefix=${encodeURIComponent(prefix)}${
      token ? `&continuation-token=${encodeURIComponent(token)}` : ''
    }`;
    const res = await c.aws.fetch(url);
    if (!res.ok) throw new Error(`R2 list failed (${res.status})`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const b = m[1];
      const key = b.match(/<Key>([^<]*)<\/Key>/)?.[1];
      if (!key) continue;
      out.push({
        key,
        size: Number(b.match(/<Size>(\d+)<\/Size>/)?.[1] ?? 0),
        lastModified: b.match(/<LastModified>([^<]*)<\/LastModified>/)?.[1] ?? '',
      });
    }
    token = xml.match(/<NextContinuationToken>([^<]*)<\/NextContinuationToken>/)?.[1] ?? '';
    if (!/<IsTruncated>true<\/IsTruncated>/.test(xml) || !token) break;
  }
  return out;
}
