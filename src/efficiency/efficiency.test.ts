import {
    EfficiencyAnalyser,
    compressArray,
    getEfficiency,
    EFFICIENCY_INC_RATE
} from './efficiency';
import { createRecord } from '../../test/utils';

describe('Efficiency Analysis', () => {
    it('compress arr correctly', () => {
        {
            const a = [true, false, false, false, false, true, true];
            const b = [1, 2, 3, 3, 3, 4, 5];
            compressArray(a, b);
            expect(a).toStrictEqual([true, false, true]);
            expect(b).toStrictEqual([1, 11, 9]);
        }
        {
            const a: any = [];
            const b: any = [];
            compressArray(a, b);
            expect(a).toStrictEqual([]);
            expect(b).toStrictEqual([]);
        }
        {
            const a = [true];
            const b = [1];
            compressArray(a, b);
            expect(a).toStrictEqual([true]);
            expect(b).toStrictEqual([1]);
        }
    });

    it('should calculate the overall efficiency correctly', () => {
        expect(getEfficiency([true, false], [100, 100])).toBeLessThan(0.5);
        expect(
            getEfficiency([true, false, true, false, true], [0.5, 0.5, 0.5, 0.5, 0.5])
        ).toBeLessThan(0.05);
        expect(getEfficiency([false], [1000])).toBe(1);
        expect(getEfficiency([true, false], [0, 1000])).toBeGreaterThan(0.95);
    });
});

describe('EfficiencyAnalyser', () => {
    it('should get efficiency correctly', () => {
        const ef = new EfficiencyAnalyser([{ app: 'facebook' }, { title: 'title' }]);
        let record = createRecord('aa', 100, [['Facebook', 100]]);
        record.stayTimeInSecond = [3600 * 100];
        record.switchActivities = [0];
        expect(ef.analyse(record)).toBe(0);

        record = createRecord('aa', 10, [['assbook', 10]]);
        record.stayTimeInSecond = [10 * 3600];
        record.switchActivities = [0];
        expect(ef.analyse(record)).toBe(1);

        record = createRecord('aa', 10, [['assbook', 10]]);
        record.apps.assbook.titleSpentTime['title'] = { occurrence: 1, normalizedWeight: 1 };
        record.stayTimeInSecond = [10 * 3600];
        record.switchActivities = [0];
        expect(ef.analyse(record)).toBe(0);

        record = createRecord('aa', 10, [['assbook', 10], ['bb', 0]]);
        record.apps.assbook.titleSpentTime['bb'] = { occurrence: 1, normalizedWeight: 0.5 };
        record.apps.assbook.titleSpentTime['title'] = { occurrence: 1, normalizedWeight: 0.5 };
        record.stayTimeInSecond = [5 * 3600, 0, 5 * 3600];
        record.switchActivities = [0, 1, 0];
        expect(ef.analyse(record)).toBeCloseTo(0.5);
    });

    it('should break it down to title level', () => {
        const ef = new EfficiencyAnalyser([{ app: 'facebook' }, { title: 'title' }]);
        const record = createRecord('aa', 10, [['assbook', 10]]);
        record.apps.assbook.titleSpentTime['bb'] = { occurrence: 100, normalizedWeight: 0.3 };
        record.apps.assbook.titleSpentTime['title'] = { occurrence: 100, normalizedWeight: 0.3 };
        record.apps.assbook.titleSpentTime['aa'] = { occurrence: 100, normalizedWeight: 0.4 };
        record.stayTimeInSecond = [5 * 3600];
        record.switchActivities = [0];
        expect(ef.analyse(record)).toBeCloseTo(1 / 3);
    });
});
