import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '***REMOVED***';
const DB_NAME = 'manga-generator';
const COLLECTION_NAME = 'images';

let clientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGODB_URI);
  }
  return clientPromise;
}

// POST - Save image
export async function POST(request: NextRequest) {
  try {
    const { id, imageData } = await request.json();

    if (!id || !imageData) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      );
    }

    const mongoClient = await getClient();
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Upsert image
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

// GET - Load image
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

    const mongoClient = await getClient();
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

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

// POST - Batch save images
export async function PUT(request: NextRequest) {
  try {
    const { images } = await request.json(); // Array of {id, imageData}

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Invalid images array' },
        { status: 400 }
      );
    }

    const mongoClient = await getClient();
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Batch upsert
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

// DELETE - Delete image(s)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // Comma-separated IDs for batch delete

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'Image ID(s) required' },
        { status: 400 }
      );
    }

    const mongoClient = await getClient();
    const db = mongoClient.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    if (ids) {
      // Batch delete
      const idArray = ids.split(',').map(id => id.trim()).filter(id => id);
      const result = await collection.deleteMany({ id: { $in: idArray } });
      return NextResponse.json({ success: true, deletedCount: result.deletedCount }, { status: 200 });
    } else if (id) {
      // Single delete
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

