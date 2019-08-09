/**
 * Run by main process
 */

import { getTitlesProjectPairs, predict, trainTitlesProjectPair } from './learner';
import { PomodoroRecord } from '../../renderer/monitor';
import { sessionDB } from '../db';
const ctx: Worker = self as any;

async function getTitlesProjectMapFromDB() {
    const records: PomodoroRecord[] = await new Promise((resolve, reject) => {
        sessionDB.find({}, {}, (err, docs) => {
            if (err) reject(err);
            resolve(docs as PomodoroRecord[]);
        });
    });

    return getTitlesProjectPairs(records);
}

async function train() {
    const epochs = 40;
    const v = await getTitlesProjectMapFromDB();
    const { model, invertEncode } = await trainTitlesProjectPair(v, {
        epochs,
        callback: (epoch, log) => {
            ctx.postMessage({
                type: 'setProgress',
                progress: epoch / epochs
            });
        }
    });
    ctx.postMessage({
        type: 'setProgress',
        progress: 100
    });
    let t = 0;
    let f = 0;
    for (const { titles, project } of v) {
        const pred = await predict(model, titles, invertEncode);
        if (pred === project) {
            t += 1;
        } else {
            f += 1;
        }
    }

    ctx.postMessage({
        type: 'setAcc',
        acc: t / (t + f)
    });
}

ctx.addEventListener('message', async (event: any) => {
    if (event.data === 'startTraining') {
        await train();
    }
});
