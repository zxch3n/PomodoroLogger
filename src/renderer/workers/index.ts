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
for (const key in dbPaths) {
    // @ts-ignore
    dbWorkers[key] = new DBWorker(key);
}

export const workers = {
    dbWorkers,
    knn: new KnnWorker(),
    tokenizer: new Tokenizer()
};
