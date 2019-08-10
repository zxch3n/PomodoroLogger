import { env } from '../../../config';
env.isWorker = true;
import { PomodoroRecord } from '../../monitor';
import { sessionDB } from '../../../main/db';
import {
    getTitlesProjectPairs,
    predict,
    trainTitlesProjectPair
} from '../../../main/learner/learner';

const ctx: Worker = self as any;

function log(info: string) {
    ctx.postMessage({ payload: info, type: 'log' });
}

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
}

ctx.addEventListener('message', async (event: any) => {
    if (event.data === 'startTraining') {
        await train();
    }
});
