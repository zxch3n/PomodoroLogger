/**
 * @jest-environment node
 */

import { PomodoroRecord } from '../../renderer/monitor';
import { getTitlesProjectPairs, predict, trainTitlesProjectPair } from './learner';
import nedb from 'nedb';

export const sessionDB = new nedb({
    filename: `${__dirname}/../../../__mocks__/session.nedb`,
    autoload: true
});

jest.setTimeout(200000);
async function getTitlesProjectMapFromDB() {
    const records: PomodoroRecord[] = await new Promise((resolve, reject) => {
        sessionDB.find({}, {}, (err, docs) => {
            if (err) reject(err);
            resolve(docs as PomodoroRecord[]);
        });
    });

    return getTitlesProjectPairs(records);
}

describe('Main.Learner', () => {
    it('getTitleProject pairs correctly', async () => {
        const v = await getTitlesProjectMapFromDB();
        expect(v[0]).toHaveProperty('titles');
        expect(v[0]).toHaveProperty('project');
        for (const title in v[0].titles) {
            expect(typeof v[0].titles[title]).toBe('number');
            expect(v[0].titles[title]).not.toBeNaN();
        }
    });

    it('can be trained (overfit)', async () => {
        const v = await getTitlesProjectMapFromDB();
        const { model, invertEncode } = await trainTitlesProjectPair(v, { epochs: 40 });
        let t = 0;
        let f = 0;
        for (const { titles, project } of v) {
            const pred = await predict(model, titles, invertEncode);
            console.log(pred, project);
            if (pred === project) {
                t += 1;
            } else {
                f += 1;
            }
        }

        expect(t / (t + f)).toBeGreaterThan(0.7);
    });
});
