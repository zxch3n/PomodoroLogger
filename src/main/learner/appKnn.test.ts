import { TopKManager, KNN, NameEncoder } from './appKnn';
import { ApplicationSpentTime, PomodoroRecord } from '../../renderer/monitor';
import { generateRandomName } from '../../renderer/utils';

describe('AppKNN TopManager', () => {
    it('gets the top 1 correctly', async () => {
        const ranker = new TopKManager<number>(1, (a, b) => a - b);
        for (let i = 0; i < 100; i += 1) {
            ranker.push(Math.random() + 1);
        }

        ranker.push(0);
        for (let i = 0; i < 100; i += 1) {
            ranker.push(Math.random() + 0.2);
        }

        const v = ranker.vote(x => x.toString());
        expect(v).toBe('0');
    });

    it('gets the top 10 correctly', async () => {
        const ranker = new TopKManager<[number, string]>(10, (a, b) => a[0] - b[0]);
        for (let i = 0; i < 100; i += 1) {
            ranker.push([Math.random() + 1, 'f']);
        }

        for (let i = 0; i < 10; i += 1) {
            ranker.push([Math.random() - 2, 't']);
        }

        for (let i = 0; i < 100; i += 1) {
            ranker.push([Math.random(), 'c']);
        }

        const v = ranker.vote(x => x[1]);
        expect(v).toBe('t');
        for (const a of ranker.arr) {
            expect(a[0]).toBeLessThan(-1);
        }
    });
});

function generateRecord(
    projectId: string | undefined,
    appUsage: { [appName: string]: number }
): PomodoroRecord {
    const apps: { [appName: string]: ApplicationSpentTime } = {};
    for (const app in appUsage) {
        apps[app] = {
            appName: app,
            spentTimeInHour: appUsage[app],
            lastUpdateTime: undefined,
            screenStaticDuration: 10,
            switchTimes: 3,
            titleSpentTime: {}
        };
    }

    return {
        projectId,
        apps,
        screenStaticDuration: undefined,
        spentTimeInHour: 0.4,
        startTime: 0,
        switchTimes: 9,
        todoId: undefined
    };
}

function createKnnTestCase(nProjects: number = 5, nCases: number = 50) {
    const records: PomodoroRecord[] = [];
    const appNames = Array(50)
        .fill(0)
        .map(generateRandomName);
    const inputs: PomodoroRecord[] = [];
    const ans: string[] = [];
    for (let i = 0; i < nProjects; i += 1) {
        const projectName = i.toString();
        const appUsage: { [s: string]: number } = {};
        for (const app of appNames) {
            appUsage[app] = Math.random();
        }

        for (let j = 0; j < nCases; j += 1) {
            const newUsage = Object.assign({}, appUsage);
            for (const key in newUsage) {
                newUsage[key] += Math.random() * 0.2 - 0.1;
            }

            records.push(generateRecord(projectName, newUsage));
        }

        inputs.push(generateRecord(undefined, appUsage));
        ans.push(projectName);
    }

    return {
        inputs,
        records,
        ans
    } as {
        inputs: PomodoroRecord[];
        records: PomodoroRecord[];
        ans: string[];
    };
}

describe('App KNN', () => {
    it('predict correctly', async () => {
        const { inputs, records, ans } = createKnnTestCase();
        const knn = new KNN();
        knn.fit(records);
        const pred = knn.predict(inputs);
        expect(pred).toStrictEqual(ans);
    });
});

describe('AppName NameEncoder', () => {
    it('encodes based on input mapping', async () => {
        const encoder = new NameEncoder({
            a: 0,
            b: 1,
            c: 2
        });

        const encoding = encoder.encode([
            { appName: 'a', time: 1 },
            { appName: 'b', time: 2 },
            { appName: 'c', time: 7 }
        ]);

        expect(encoding).toStrictEqual([0.1, 0.2, 0.7]);
    });
});
