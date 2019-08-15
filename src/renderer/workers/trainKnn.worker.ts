import { dbPaths, env, modelPath } from '../../config';
import { PomodoroRecord } from '../monitor/type';
import { KNN } from '../../main/learner/appKnn';
import { sample } from '../../utils/random';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import nedb from 'nedb';

env.isWorker = true;

const ctx: Worker = self as any;
function log(info: string) {
    ctx.postMessage({ payload: info, type: 'log' });
}

async function getRecords() {
    const sessionDB = new nedb({ filename: dbPaths.sessionDBPath, autoload: false });
    let reloadTimes = 0;
    const loadDatabase = () => {
        sessionDB.loadDatabase(err => {
            if (err) {
                reloadTimes += 1;
                if (reloadTimes > 10) {
                    console.error(err);
                    return;
                }

                return setTimeout(loadDatabase, 200);
            }
        });
    };

    loadDatabase();
    const records: PomodoroRecord[] = await new Promise((resolve, reject) => {
        sessionDB.find({}, {}, (err, docs) => {
            if (err) {
                console.error(err);
                reject(err);
            }

            resolve(docs as PomodoroRecord[]);
        });
    });

    return records.filter(r => r.projectId !== undefined);
}

let knn = new KNN();
async function train(isTest = false) {
    try {
        const records = await getRecords();
        if (records.length === 0) {
            ctx.postMessage({
                type: 'error',
                payload: 'Training array is empty'
            });
            return;
        }

        let train;
        let test;
        if (isTest) {
            [train, test] = sample(records, 0.5);
        } else {
            [train, test] = sample(records, 1);
        }

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

async function loadModel(dbSize: number = 0) {
    if (!existsSync(modelPath.knnPath)) {
        await train();
        saveModel();
    } else {
        const json = JSON.parse(readFileSync(modelPath.knnPath, { encoding: 'utf-8' }));
        knn = KNN.fromJson(json);
    }

    if (!knn.isTrained || dbSize - knn.length > 20 || dbSize / knn.length > 1.5) {
        await train();
        saveModel();
    }

    ctx.postMessage({
        type: 'onDone'
    });
}

function predict(payload: PomodoroRecord[]) {
    const record = payload as PomodoroRecord[];
    const ans = knn.predict(record);
    ctx.postMessage({
        type: 'predict',
        payload: ans
    });
}

ctx.addEventListener('message', async ({ data: { type, payload } }) => {
    try {
        if (type === 'trainModel') {
            knn = new KNN();
            await train(false);
        } else if (type === 'testModel') {
            knn = new KNN();
            await train(true);
        } else if (type === 'saveModel') {
            saveModel();
        } else if (type === 'loadModel') {
            await loadModel(payload.dbSize);
        } else if (type === 'predict') {
            predict(payload);
        }
    } catch (e) {
        console.error(e);
        ctx.postMessage({
            type: 'error',
            payload: JSON.stringify(e)
        });
    }
});
