import { env } from '../../../config';
import { DBs } from '../../../main/db';
import {
    getTitlesProjectPairs,
    predict,
    trainTitlesProjectPair
} from '../../../main/learner/learner';
import { readdir } from 'fs';
import { dirname, join } from 'path';
import { PomodoroRecord } from '../../monitor/type';

env.isWorker = true;

const ctx: Worker = self as any;

function log(info: string) {
    ctx.postMessage({ payload: info, type: 'log' });
}

readdir(dirname(__dirname), (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    for (const file of files) {
        const f = join(dirname(__dirname), file);
        readdir(f, (err, files) => {
            console.log(f, files);
        });
    }
});

async function getTitlesProjectMapFromDB() {
    const records: PomodoroRecord[] = await new Promise((resolve, reject) => {
        DBs.sessionDB.find({}, {}, (err, docs) => {
            if (err) reject(err);
            resolve(docs as PomodoroRecord[]);
        });
    });

    return getTitlesProjectPairs(records);
}

async function train() {
    try {
        const epochs = 40;
        const v = await getTitlesProjectMapFromDB();
        const { model, invertEncode } = await trainTitlesProjectPair(v, {
            epochs,
            callback: (epoch, log) => {
                ctx.postMessage({
                    type: 'setProgress',
                    progress: (epoch / epochs) * 100
                });

                console.log(epoch / epochs);
            }
        });
        ctx.postMessage({
            type: 'setProgress',
            payload: 100
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
            payload: t / (t + f)
        });
    } catch (e) {
        ctx.postMessage({
            type: 'error',
            payload: e.toString()
        });
    }
}

ctx.addEventListener('message', async (event: any) => {
    if (event.data === 'startTraining') {
        await train();
    }
});
