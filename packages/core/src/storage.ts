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
 * AWS SigV4 로 서명한 요청을 만든다.
 * R2 는 region 을 'auto' 로 받는다.
 */
function sign(
  cfg: StorageConfig,
  method: 'GET' | 'PUT',
  key: string,
  payload: Buffer | null,
  extraHeaders: Record<string, string> = {},
  now = new Date(),
): { url: string; headers: Record<string, string> } {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path = `/${cfg.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  // PUT 은 본문 해시를 서명에 넣어야 한다. 빈 해시로 서명하면 R2 가 거부한다.
  const payloadHash = sha256hex(payload ?? '');

  // 서명 대상 헤더는 이름 순으로 정렬돼야 한다. 순서가 틀리면 서명이 깨진다.
  const headerMap: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...Object.fromEntries(Object.entries(extraHeaders).map(([k, v]) => [k.toLowerCase(), v])),
  };
  const names = Object.keys(headerMap).sort();
  const canonicalHeaders = names.map((n) => `${n}:${headerMap[n]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256hex(canonicalRequest)}`;

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, dateStamp), region), service), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return {
    url: `https://${host}${path}`,
    headers: {
      ...headerMap,
      authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

/** 스토리지에서 객체를 읽는다. 없으면 null — 예외로 만들지 않는다. */
export async function getObject(key: string): Promise<Buffer | null> {
  const cfg = storageConfig();
  if (!cfg) return null;

  const { url, headers } = sign(cfg, 'GET', key, null);
  const res = await fetch(url, { headers });
  if (!res.ok) return null;

  return Buffer.from(await res.arrayBuffer());
}

/** 객체를 올린다. 실패하면 조용히 넘어가지 않고 터뜨린다 — 업로드는 사용자가 지켜보는 동작이다. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const cfg = storageConfig();
  if (!cfg) throw new Error('자산 스토리지(R2)가 연결되지 않았습니다');

  const { url, headers } = sign(cfg, 'PUT', key, body, { 'content-type': contentType });
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'content-length': String(body.byteLength) },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    throw new Error(`업로드에 실패했습니다 (${res.status})`);
  }
}
