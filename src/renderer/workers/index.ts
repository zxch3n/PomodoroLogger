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
let actualWorker;
for (const key in dbPaths) {
    // @ts-ignore
    const worker: DBWorker = actualWorker ? new DBWorker(key, actualWorker) : new DBWorker(key);
    // @ts-ignore
    dbWorkers[key] = worker;
    actualWorker = worker.getWorker();
}

export const workers = {
    dbWorkers,
    knn: new KnnWorker(),
    tokenizer: new Tokenizer()
};
