import { NextRequest, NextResponse } from 'next/server';
import { MangaProject } from '@/lib/types';
import { getCollection } from '@/lib/db/mongodb';
import { validateRequest, projectSchema } from '@/lib/utils/validation';

const COLLECTION_NAME = 'projects';
const MAX_BODY_SIZE = 50 * 1024 * 1024;
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id') || 'default';

    const collection = await getCollection<MangaProject>(COLLECTION_NAME);

    const project = await collection.findOne({ id });

    if (!project) {
      return NextResponse.json({ project: null }, { status: 200 });
    }
    const imageIds: string[] = [];
    if (project.pages) {
      project.pages.forEach((page: any) => {
        if (page.url && !page.url.startsWith('data:image') && !page.url.startsWith('http')) {
          imageIds.push(page.url);
        }
      });
    }
    if (project.sessions) {
      project.sessions.forEach((session: any) => {
        if (session.pages) {
          session.pages.forEach((page: any) => {
            if (page.url && !page.url.startsWith('data:image') && !page.url.startsWith('http')) {
              imageIds.push(page.url);
            }
            if (page.config && page.config.referenceImages) {
              page.config.referenceImages.forEach((refImg: any) => {
                const imgUrl = typeof refImg === 'string' ? refImg : refImg.url;
                if (imgUrl && !imgUrl.startsWith('data:image') && !imgUrl.startsWith('http')) {
                  imageIds.push(imgUrl);
                }
              });
            }
          });
        }
        if (session.chatHistory) {
          session.chatHistory.forEach((msg: any) => {
            if (msg.imageUrl && !msg.imageUrl.startsWith('data:image') && !msg.imageUrl.startsWith('http')) {
              imageIds.push(msg.imageUrl);
            }
          });
        }
      });
    }
    const imagesMap = new Map<string, string>();
    if (imageIds.length > 0) {
      const imagesCollection = await getCollection('images');
      const images = await imagesCollection.find({ id: { $in: imageIds } }).toArray();
      images.forEach((img: any) => {
        imagesMap.set(img.id, img.imageData);
      });
    }
    const projectWithImages = JSON.parse(JSON.stringify(project));

    if (projectWithImages.pages) {
      projectWithImages.pages = projectWithImages.pages.map((page: any) => {
        if (page.url && imagesMap.has(page.url)) {
          return { ...page, url: imagesMap.get(page.url)! };
        }
        return page;
      });
    }

    if (projectWithImages.sessions) {
      projectWithImages.sessions = projectWithImages.sessions.map((session: any) => {
        const sessionCopy = { ...session };

        if (sessionCopy.pages) {
          sessionCopy.pages = sessionCopy.pages.map((page: any) => {
            if (page.url && imagesMap.has(page.url)) {
              page.url = imagesMap.get(page.url)!;
            }
            if (page.config && page.config.referenceImages) {
              page.config.referenceImages = page.config.referenceImages.map((refImg: any) => {
                const imgUrl = typeof refImg === 'string' ? refImg : refImg.url;
                if (imgUrl && imagesMap.has(imgUrl)) {
                  const restoredUrl = imagesMap.get(imgUrl)!;
                  if (typeof refImg === 'string') {
                    return restoredUrl;
                  } else {
                    return { ...refImg, url: restoredUrl };
                  }
                }
                return refImg;
              });
            }

            return page;
          });
        }

        if (sessionCopy.chatHistory) {
          sessionCopy.chatHistory = sessionCopy.chatHistory.map((msg: any) => {
            if (msg.imageUrl && imagesMap.has(msg.imageUrl)) {
              return { ...msg, imageUrl: imagesMap.get(msg.imageUrl)! };
            }
            return msg;
          });
        }

        return sessionCopy;
      });
    }

    return NextResponse.json({ project: projectWithImages }, { status: 200 });
  } catch (error: any) {
    console.error('Error loading project from MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to load project', details: error.message },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum size is 50MB.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const project = validateRequest(projectSchema, body) as MangaProject;

    const collection = await getCollection<MangaProject>(COLLECTION_NAME);
    const imagesToSave: Array<{ id: string; imageData: string }> = [];
    const projectWithoutImages = JSON.parse(JSON.stringify(project));
    if (project.pages) {
      projectWithoutImages.pages = project.pages.map((page: any) => {
        if (page.url && page.url.startsWith('data:image')) {
          const imageId = `page_${page.id}`;
          imagesToSave.push({ id: imageId, imageData: page.url });
          return { ...page, url: imageId };
        }
        return page;
      });
    }
    if (project.sessions) {
      projectWithoutImages.sessions = project.sessions.map((session: any) => {
        const sessionCopy = { ...session };
        if (session.pages) {
          sessionCopy.pages = session.pages.map((page: any) => {
            if (page.url && page.url.startsWith('data:image')) {
              const imageId = `page_${page.id}`;
              imagesToSave.push({ id: imageId, imageData: page.url });
              return { ...page, url: imageId };
            }
            return page;
          });
        }
        if (session.chatHistory) {
          sessionCopy.chatHistory = session.chatHistory.map((msg: any) => {
            if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
              const imageId = `chat_${msg.id}`;
              imagesToSave.push({ id: imageId, imageData: msg.imageUrl });
              return { ...msg, imageUrl: imageId };
            }
            return msg;
          });
        }
        if (session.pages) {
          sessionCopy.pages = sessionCopy.pages.map((page: any) => {
            if (page.config && page.config.referenceImages) {
              const refImages = page.config.referenceImages.map((refImg: any, idx: number) => {
                const imgUrl = typeof refImg === 'string' ? refImg : refImg.url;
                if (imgUrl && imgUrl.startsWith('data:image')) {
                  const imageId = `ref_${page.id}_${idx}`;
                  imagesToSave.push({ id: imageId, imageData: imgUrl });
                  if (typeof refImg === 'string') {
                    return imageId;
                  } else {
                    return { ...refImg, url: imageId };
                  }
                }
                return refImg;
              });
              page.config.referenceImages = refImages;
            }
            return page;
          });
        }

        return sessionCopy;
      });
    }
    if (imagesToSave.length > 0) {
      try {
        const imagesCollection = await getCollection('images');
        const operations = imagesToSave.map(({ id, imageData }) => ({
          updateOne: {
            filter: { id },
            update: { $set: { id, imageData, updatedAt: Date.now() } },
            upsert: true
          }
        }));
        await imagesCollection.bulkWrite(operations);
      } catch (imgError) {
        console.warn('Error saving images separately:', imgError);
      }
    }
    const { _id, ...projectToSave } = projectWithoutImages as any;
    await collection.updateOne(
      { id: project.id },
      { $set: projectToSave },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving project to MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to save project', details: error.message },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id') || 'default';

    const collection = await getCollection<MangaProject>(COLLECTION_NAME);

    await collection.deleteOne({ id });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting project from MongoDB:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', details: error.message },
      { status: 500 }
    );
  }
}
