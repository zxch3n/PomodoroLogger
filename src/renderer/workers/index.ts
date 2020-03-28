/**
 * Define All Web Workers
 *
 * Because this project uses worker-loader, which can only run in the renderer process,
 * it's thus under the renderer directory.
 */

import { KnnWorker } from './knnWorker';
import { Tokenizer } from './tokenizer';
import { dbPaths } from '../../config';
import { DBWorker } from './DBWorker';

// @ts-ignore
const dbWorkers: { [name in keyof typeof dbPaths]: DBWorker } = {};
let actualWorker: any;
function initWorkers() {
    if (actualWorker) {
        actualWorker.terminate();
        actualWorker = undefined;
    }

    for (const key in dbPaths) {
        const dbName = key as keyof typeof dbPaths;
        if (dbWorkers[dbName] == null) {
            const worker: DBWorker = actualWorker
                ? new DBWorker(dbName, actualWorker)
                : new DBWorker(dbName);
            dbWorkers[dbName] = worker;
            actualWorker = worker.getWorker();
        } else {
            if (!actualWorker) {
                actualWorker = new DBWorker(dbName).getWorker();
            }

            dbWorkers[dbName].setWorker(actualWorker);
        }
    }
}

initWorkers();
export const restartDBWorkers = initWorkers;
export const workers = {
    dbWorkers,
    knn: new KnnWorker(),
    tokenizer: new Tokenizer(),
};
