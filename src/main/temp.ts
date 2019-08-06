import { getTitlesProjectPairs, predict, trainTitlesProjectPair } from './learner';
import { PomodoroRecord } from '../renderer/monitor';
import nedb from 'nedb';

export const sessionDB = new nedb({
    filename: `${__dirname}/../../__mocks__/session.nedb`,
    autoload: true
});
async function getTitlesProjectMapFromDB() {
    const records: PomodoroRecord[] = await new Promise((resolve, reject) => {
        sessionDB.find({}, {}, (err: any, docs: any) => {
            if (err) reject(err);
            resolve(docs as PomodoroRecord[]);
        });
    });

    return getTitlesProjectPairs(records);
}

export async function temp() {
    const v = await getTitlesProjectMapFromDB();
    const { model, invertEncode } = await trainTitlesProjectPair(v, { epochs: 10 });
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

    expect(t / (t + f)).toBeGreaterThan(0.7);
}
