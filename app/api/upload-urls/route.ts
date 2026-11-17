import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AwsClient } from 'aws4fetch';
import { SESSION_COOKIE } from '@/lib/auth';
import { YEAR } from '@/lib/calendar';

/**
 * Returns 5-minute presigned PUT URLs so the browser can upload the finished calendar (PNG + PDF)
 * straight to Cloudflare R2. One fixed key per distributor + year => re-downloads overwrite, never add files.
 */
export async function POST() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const account = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'helios-calendars';
  if (!account || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });
  }

  const aws = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' });
  const sign = async (ext: 'png' | 'pdf') => {
    const url = `https://${account}.r2.cloudflarestorage.com/${bucket}/calendars/${YEAR}/${id}.${ext}?X-Amz-Expires=300`;
    return (await aws.sign(new Request(url, { method: 'PUT' }), { aws: { signQuery: true } })).url;
  };

  return NextResponse.json({ png: await sign('png'), pdf: await sign('pdf') });
}
