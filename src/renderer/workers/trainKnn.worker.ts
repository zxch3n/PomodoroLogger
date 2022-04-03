import { dbPaths, env, modelPath } from '../../config';
import { PomodoroRecord } from '../monitor/type';
import { KNN } from '../../main/learner/appKnn';
import { sample } from '../../utils/random';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import nedb from 'nedb';

const ctx: Worker = self as any;

async function getRecords() {
    const sessionDB = new nedb({ filename: dbPaths.sessionDB, autoload: false });
    let reloadTimes = 0;
    const loadDatabase = () => {
        sessionDB.loadDatabase((err) => {
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

    return records.filter((r) => r.boardId !== undefined);
}

let knn = new KNN();
async function train(isTest: boolean, code: number) {
    try {
        const records = await getRecords();
        if (records.length === 0) {
            ctx.postMessage({
                code,
                type: 'error',
                payload: 'Training array is empty',
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
            code,
            type: 'setProgress',
            payload: 20,
        });
        knn.fit(train);
        ctx.postMessage({
            code,
            type: 'setProgress',
            payload: 80,
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
            code,
            type: 'setAcc',
            payload: t / (t + f),
        });
        ctx.postMessage({
            code,
            type: 'setProgress',
            payload: 100,
        });
    } catch (e: any) {
        console.error(e);
        ctx.postMessage({
            code,
            type: 'error',
            payload: e.toString(),
        });
    }
}

function saveModel(code: number) {
    const json = knn.toJson();
    try {
        writeFileSync(modelPath.knnPath, JSON.stringify(json), { encoding: 'utf-8' });
        ctx.postMessage({
            code,
            type: 'onDone',
        });
    } catch (e) {
        ctx.postMessage({
            code,
            type: 'error',
            payload: e,
        });
    }
}

async function loadModel(dbSize: number, code: number) {
    if (!existsSync(modelPath.knnPath)) {
        await train(false, code);
        saveModel(code);
    } else {
        const json = JSON.parse(readFileSync(modelPath.knnPath, { encoding: 'utf-8' }));
        knn = KNN.fromJson(json);
    }

    if (!knn.isTrained || dbSize - knn.length > 20 || dbSize / knn.length > 1.5) {
        await train(false, code);
        saveModel(code);
    }

    ctx.postMessage({
        code,
        type: 'onDone',
    });
}

function predict(payload: PomodoroRecord[], code: number) {
    const record = payload as PomodoroRecord[];
    const ans = knn.predict(record);
    ctx.postMessage({
        code,
        type: 'predict',
        payload: ans,
    });
}

ctx.addEventListener('message', async ({ data: { type, payload, code } }) => {
    try {
        if (type === 'trainModel') {
            knn = new KNN();
            await train(false, code);
        } else if (type === 'testModel') {
            knn = new KNN();
            await train(true, code);
        } else if (type === 'saveModel') {
            saveModel(code);
        } else if (type === 'loadModel') {
            await loadModel(payload.dbSize, code);
        } else if (type === 'predict') {
            predict(payload, code);
        }
    } catch (e) {
        console.error(e);
        ctx.postMessage({
            code,
            type: 'error',
            payload: JSON.stringify(e),
        });
    }
});
