import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { validateRequest, imageSchema, batchImagesSchema } from '@/lib/utils/validation';

const COLLECTION_NAME = 'images';
const MAX_BODY_SIZE = 20 * 1024 * 1024;
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum size is 20MB.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { id, imageData } = validateRequest(imageSchema, body);

    const collection = await getCollection(COLLECTION_NAME);
    await collection.updateOne(
      { id },
      { $set: { id, imageData, updatedAt: Date.now() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving image to MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to save image', details: error.message },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTION_NAME);

    const image = await collection.findOne({ id });

    if (!image) {
      return NextResponse.json({ image: null }, { status: 200 });
    }

    return NextResponse.json({ image: image.imageData }, { status: 200 });
  } catch (error: any) {
    console.error('Error loading image from MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to load image', details: error.message },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum size is 20MB.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { images } = validateRequest(batchImagesSchema, body);

    const collection = await getCollection(COLLECTION_NAME);
    const operations = images.map(({ id, imageData }: { id: string; imageData: string }) => ({
      updateOne: {
        filter: { id },
        update: { $set: { id, imageData, updatedAt: Date.now() } },
        upsert: true
      }
    }));

    await collection.bulkWrite(operations);

    return NextResponse.json({ success: true, count: images.length }, { status: 200 });
  } catch (error: any) {
    console.error('Error batch saving images to MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to save images', details: error.message },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'Image ID(s) required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTION_NAME);

    if (ids) {
      const idArray = ids.split(',').map(id => id.trim()).filter(id => id);
      const result = await collection.deleteMany({ id: { $in: idArray } });
      return NextResponse.json({ success: true, deletedCount: result.deletedCount }, { status: 200 });
    } else if (id) {
      const result = await collection.deleteOne({ id });
      return NextResponse.json({ success: true, deletedCount: result.deletedCount }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting image(s) from MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to delete image(s)', details: error.message },
      { status: 500 }
    );
  }
}
