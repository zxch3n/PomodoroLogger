import * as op from './op';
import { createRecord } from '../../../../test/utils';

describe('History aggregating operations', () => {
    it('agg empty record', async () => {
        const agg = await op.getAggPomodoroInfo([]);
        expect(agg).toStrictEqual({
            count: {
                day: 0,
                week: 0,
                month: 0
            },
            wordWeights: [],
            pieChart: {
                projectData: [],
                appData: []
            },
            calendarCount: {}
        });
    });

    it('getTimeSpentTimeFromRecord', async () => {
        const timeSpent = await op.getTimeSpentDataFromRecords([
            createRecord('pa', 11, [['a', 6], ['b', 5]]),
            createRecord('pb', 10, [['a', 5], ['b', 5]]),
            createRecord('pa', 10, [['c', 5], ['d', 5]])
        ]);

        expect(timeSpent.appData[0].name).toBe('A');
        expect(timeSpent.appData[0].value).toBe(11);
        expect(timeSpent.appData[1].name).toBe('B');
        expect(timeSpent.appData[1].value).toBe(10);
        expect(timeSpent.projectData[0].value).toBe(21);
        expect(timeSpent.projectData[1].value).toBe(10);
    });

    it('getTimeSpentTimeFromRecord with many app', async () => {
        const appData = [
            ['a', 6],
            ['b', 5],
            ['c', 4.9],
            ['d', 4.8],
            ['e', 4.7],
            ['f', 4.6],
            ['g', 4.5],
            ['h', 4.4],
            ['i', 4],
            ['j', 3],
            ['k', 2],
            ['l', 2],
            ['m', 2],
            ['n', 2]
        ] as [string, number][];
        const timeSpent = await op.getTimeSpentDataFromRecords([createRecord('pa', 100, appData)]);

        expect(timeSpent.appData.length).toBe(10);
        for (let i = 0; i < 10; i += 1) {
            expect(timeSpent.appData[i].name).toBe(appData[i][0].toUpperCase());
            expect(timeSpent.appData[i].value).toBe(appData[i][1]);
        }
    });
});
