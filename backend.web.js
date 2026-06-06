import { webMethod, Permissions } from "wix-web-module";
import wixData from 'wix-data';
import { mediaManager } from 'wix-media-backend';

const COLLECTION = COLLECTION_ID_HERE;

export const processImportBatch = webMethod(Permissions.Anyone, async (limit = 20) => {
    const pendingItems = (await wixData.query(COLLECTION)
        .eq('importStatus', 'pending')
        .limit(limit)
        .find({ suppressAuth: true })).items;

    const results = [];
    
    for (const item of pendingItems) {
        try {
            await wixData.update(COLLECTION, {
                ...item,
                importStatus: 'processing'
            }, { suppressAuth: true });

            let newMagazineCover = item.magazineCover;
            let newMagazineFile = item.magazineFile;

            for (const file of [item.magazineCover, item.magazineFile]) {
                if (!file) continue;

                const response = await fetch(file);
                const contentType = response.headers.get('content-type');

                if (!response.ok) {
                    throw new Error(`Fetch failed ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const filename =
                    file.split('/').pop()?.split('?')[0] || `file-${Date.now()}`;

                const uploaded = await mediaManager.upload(
                    `/magazine-imports/${item._id}`,
                    buffer,
                    filename,
                    {
                        mediaOptions: {
                            mimeType: contentType || undefined
                        }
                    }
                );

                if (contentType?.includes('image/')) {
                    newMagazineCover = uploaded.fileUrl;
                } else if (contentType?.includes('pdf')) {
                    newMagazineFile = uploaded.fileUrl;
                }
            }

            await wixData.update(COLLECTION, {
                ...item,
                magazineCover: newMagazineCover,
                magazineFile: newMagazineFile,
                importStatus: 'complete',
                importedAt: new Date(),
                importError: null
            }, { suppressAuth: true });

            results.push({ success: true, id: item._id });
        } catch (err) {
            await wixData.update(COLLECTION, {
                ...item,
                importStatus: 'failed',
                importError: err.message
            }, { suppressAuth: true });

            results.push({
                success: false,
                id: item._id,
                error: err.message
            });
        }
    }

    return results;
});

export const processImportBatchImgs = webMethod(Permissions.Anyone, async (limit = 20) => {
    const pendingItems = (await wixData.query(COLLECTION)
        .eq('importStatus', 'pending')
        .limit(limit)
        .find({ suppressAuth: true })).items;

    const results = [];
    
    for (const item of pendingItems) {
        try {
            await wixData.update(COLLECTION, {
                ...item,
                importStatus: 'processing'
            }, { suppressAuth: true });

            // let newMagazineCover = item.magazineCover;
            // let newMagazineFile = item.magazineFile;
            let imageUrl = item.url
            let type = "turkey";
            let cat = "all";


            const response = await fetch(imageUrl);
            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                throw new Error(`Fetch failed ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const filename =
                imageUrl.split('/').pop()?.split('?')[0] || `file-${Date.now()}`;

            const uploaded = await mediaManager.upload(
                `/gallery-images/${type}/${cat}`,
                buffer,
                filename,
                {
                    mediaOptions: {
                        mimeType: contentType || undefined
                    }
                }
            );
            console.log('uploaded:', uploaded);
            // if (contentType?.includes('image/')) {
            //     newMagazineCover = uploaded.fileUrl;
            // } else if (contentType?.includes('pdf')) {
            //     newMagazineFile = uploaded.fileUrl;
            // }
            

            await wixData.update(COLLECTION, {
                ...item,
                importStatus: 'complete',
                importedAt: new Date(),
                importError: null
            }, { suppressAuth: true });

            results.push({ success: true, id: item._id });
        } catch (err) {
            await wixData.update(COLLECTION, {
                ...item,
                importStatus: 'failed',
                importError: err.message
            }, { suppressAuth: true });

            results.push({
                success: false,
                id: item._id,
                error: err.message
            });
        }
    }

    return results;
});
