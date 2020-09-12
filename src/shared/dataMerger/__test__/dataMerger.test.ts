import { DataMerger, SourceData } from '../dataMerger';
import { case0 } from './case0';
import { case1 } from './case1';
import { case2 } from './case2';

describe('Data Merger', () => {
    it('merges case 0', () => {
        const merger = new DataMerger();
        const output = merger.merge(case0.a, case0.b);
        expect(output).toStrictEqual(case0.expected);
    });
    it('merges case 1', () => {
        const merger = new DataMerger();
        const output = merger.merge(case1.a, case1.b);
        expect(output).toStrictEqual(case1.expected);
    });

    it('merges case 2', () => {
        const merger = new DataMerger();
        const output = merger.merge(case2.a, case2.b);
        expect(output).toStrictEqual(case2.expected);
    });
});
