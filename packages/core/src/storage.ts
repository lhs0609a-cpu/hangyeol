/*
 * 자산 스토리지 — 10번 문서 §2 (R2 권장, 이그레스 무료).
 *
 * S3 호환 API 를 직접 서명해서 쓴다. SDK 를 넣지 않은 이유는
 * 우리가 쓰는 동작이 GET 하나뿐이기 때문이다. 의존성을 늘릴 이유가 없다.
 */

import { createHash, createHmac } from 'node:crypto';

export interface StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export function storageConfig(): StorageConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isStorageConfigured(): boolean {
  return storageConfig() !== null;
}

const sha256hex = (v: string | Buffer) => createHash('sha256').update(v).digest('hex');
const hmac = (key: Buffer | string, v: string) => createHmac('sha256', key).update(v).digest();

/**
 * AWS SigV4 로 서명한 GET 요청을 만든다.
 * R2 는 region 을 'auto' 로 받는다.
 */
function signedGet(cfg: StorageConfig, key: string, now = new Date()): { url: string; headers: Record<string, string> } {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const payloadHash = sha256hex('');

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `GET\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256hex(canonicalRequest)}`;

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), region), service), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return {
    url: `https://${host}${path}`,
    headers: {
      host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

/** 스토리지에서 객체를 읽는다. 없으면 null — 예외로 만들지 않는다. */
export async function getObject(key: string): Promise<Buffer | null> {
  const cfg = storageConfig();
  if (!cfg) return null;

  const { url, headers } = signedGet(cfg, key);
  const res = await fetch(url, { headers });
  if (!res.ok) return null;

  return Buffer.from(await res.arrayBuffer());
}
