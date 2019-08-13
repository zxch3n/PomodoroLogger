import { PomodoroRecord } from '../../monitor/type';
import { dbPaths, env, modelPath } from '../../../config';
import { KNN } from '../../../main/learner/appKnn';
import { sample } from '../../../utils/random';
import { readFileSync, writeFileSync } from 'fs';
import nedb from 'nedb';

const ctx: Worker = self as any;
function log(info: string) {
    ctx.postMessage({ payload: info, type: 'log' });
}

env.isWorker = true;

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
        console.log('getting record');
        const records = await getRecords();
        console.log('length', records.length);
        const [train, test] = sample(records, 0.5);
        console.log('split test train');
        ctx.postMessage({
            type: 'setProgress',
            payload: 20
        });
        knn.fit(train);
        console.log('fitted');
        ctx.postMessage({
            type: 'setProgress',
            payload: 80
        });
        const preds = knn.predict(test);
        console.log('pred');
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
        console.log('done');
    } catch (e) {
        console.error(e);
        ctx.postMessage({
            type: 'error',
            payload: e.toString()
        });
    }
}

ctx.addEventListener('message', async (event: any) => {
    console.log(event.data);
    if (event.data === 'startTraining') {
        knn = new KNN();
        await train();
    } else if (event.data === 'saveModel') {
        const json = knn.toJson();
        writeFileSync(modelPath.knnPath, JSON.stringify(json), { encoding: 'utf-8' });
    } else if (event.data === 'loadModel') {
        const json = JSON.parse(readFileSync(modelPath.knnPath, { encoding: 'utf-8' }));
        knn = KNN.fromJson(json);
    }
});
