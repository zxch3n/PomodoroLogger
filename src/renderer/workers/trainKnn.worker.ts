import { dbPaths, env, modelPath } from '../../config';
env.isWorker = true;

import { ApplicationSpentTime, PomodoroRecord } from '../monitor/type';
import { KNN } from '../../main/learner/appKnn';
import { sample } from '../../utils/random';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import nedb from 'nedb';

const ctx: Worker = self as any;
function log(info: string) {
    ctx.postMessage({ payload: info, type: 'log' });
}

async function getRecords() {
    const sessionDB = new nedb({ filename: dbPaths.sessionDBPath, autoload: false });
    sessionDB.loadDatabase(err => (err ? console.error('Worker...', err) : undefined));
    const records: PomodoroRecord[] = await new Promise((resolve, reject) => {
        sessionDB.find({}, {}, (err, docs) => {
            if (err) {
                console.error(err);
                reject(err);
            }

            resolve(docs as PomodoroRecord[]);
        });
    });

    return records;
}

let knn = new KNN();
async function train() {
    try {
        const records = await getRecords();
        const [train, test] = sample(records, 0.5);
        ctx.postMessage({
            type: 'setProgress',
            payload: 20
        });
        knn.fit(train);
        ctx.postMessage({
            type: 'setProgress',
            payload: 80
        });
        const preds = knn.predict(test);
        let t = 0;
        let f = 0;
        for (let i = 0; i < test.length; i += 1) {
            const pred = preds[i];
            const ans = test[i].projectId;
            if (pred === ans) {
                t += 1;
            } else {
                f += 1;
            }
        }

        ctx.postMessage({
            type: 'setAcc',
            payload: t / (t + f)
        });
        ctx.postMessage({
            type: 'setProgress',
            payload: 100
        });
    } catch (e) {
        console.error(e);
        ctx.postMessage({
            type: 'error',
            payload: e.toString()
        });
    }
}

function saveModel() {
    const json = knn.toJson();
    try {
        writeFileSync(modelPath.knnPath, JSON.stringify(json), { encoding: 'utf-8' });
        ctx.postMessage({
            type: 'onDone'
        });
    } catch (e) {
        ctx.postMessage({
            type: 'error',
            payload: e
        });
    }
}

async function loadModel() {
    if (!existsSync(modelPath.knnPath)) {
        await train();
        saveModel();
    } else {
        const json = JSON.parse(readFileSync(modelPath.knnPath, { encoding: 'utf-8' }));
        knn = KNN.fromJson(json);
    }

    if (!knn.isTrained) {
        await train();
        saveModel();
    }

    ctx.postMessage({
        type: 'onDone'
    });
}

ctx.addEventListener('message', async ({ data: { type, payload } }) => {
    if (type === 'trainModel') {
        knn = new KNN();
        await train();
    } else if (type === 'saveModel') {
        saveModel();
    } else if (type === 'loadModel') {
        await loadModel();
    } else if (type === 'predict') {
        const record = payload as PomodoroRecord[];
        const ans = knn.predict(record);
        ctx.postMessage({
            type: 'predict',
            payload: ans
        });
    }
});
