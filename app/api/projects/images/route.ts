import { getCollection } from '@/lib/db/mongodb';
import type { Collection } from 'mongodb';

const MAX_BODY_SIZE = 25 * 1024 * 1024;
const COLLECTION_NAME = 'raw-images';

function extractRawImageIdFromSource(source: string): string | null {
  if (!source || typeof source !== 'string') return null;

  if (source.startsWith('page_') || source.startsWith('chat_') || source.startsWith('ref_')) {
    return source;
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const last = source.split('/').pop() || '';
    const noQuery = last.split('?')[0];
    const base = noQuery.replace(/\.(png|jpe?g|webp|gif)$/i, '');
    if (base.startsWith('page_') || base.startsWith('chat_') || base.startsWith('ref_')) {
      return base;
    }
  }

  return null;
}

async function fetchUrlAsBase64DataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/png';
    const buf = Buffer.from(await res.arrayBuffer());
    const b64 = buf.toString('base64');
    return `data:${contentType};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request body too large. Maximum size is 25MB.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body: any = await request.json();
    const imageIds: string[] = Array.isArray(body?.imageIds)
      ? body.imageIds.filter((x: unknown): x is string => typeof x === 'string')
      : [];

    const unique: string[] = [...new Set(imageIds.filter((x) => x.trim()))];
    const images: Record<string, string | null> = {};
    if (unique.length === 0) {
      return new Response(JSON.stringify({ images }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let collection: Collection | null = null;
    try {
      if (process.env.MONGODB_URI) {
        collection = await getCollection(COLLECTION_NAME);
      }
    } catch {
      collection = null;
    }

    await Promise.all(
      unique.map(async (src) => {
        try {
          if (src.startsWith('data:image/')) {
            images[src] = src;
            return;
          }

          const rawId = extractRawImageIdFromSource(src);
          if (rawId && collection) {
            try {
              const cached = await collection.findOne({ id: rawId });
              const cachedData = cached?.imageData;
              if (typeof cachedData === 'string' && cachedData.length > 0) {
                images[src] = cachedData;
                return;
              }
            } catch {
            }
          }

          if (src.startsWith('http://') || src.startsWith('https://')) {
            const dataUrl = await fetchUrlAsBase64DataUrl(src);
            images[src] = dataUrl;
            if (rawId && dataUrl && collection) {
              if (dataUrl.length <= 15 * 1024 * 1024) {
                try {
                  const existing = await collection.findOne({ id: rawId });
                  if (!existing) {
                    await collection.insertOne({
                      id: rawId,
                      imageData: dataUrl,
                      updatedAt: Date.now(),
                    });
                  }
                } catch {
                }
              }
            }
            return;
          }

          images[src] = null;
        } catch {
          images[src] = null;
        }
      }),
    );

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to load images', details: error?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
