import { processImportBatch, processImportBatchImgs }
from 'backend/mediaImporter';

$w.onReady(() => {

    $w('#startButton').onClick(async () => {

        let keepGoing = true;

        while (keepGoing) {

            const results =
                await processImportBatchImgs(20);

            console.log(results);

            if (!results.length) {
                keepGoing = false;
            }

            // slight delay
            await new Promise(resolve =>
                setTimeout(resolve, 1500)
            );
        }

        console.log('IMPORT COMPLETE');
    });
});
