import { compressArray, getEfficiency, EFFICIENCY_INC_RATE } from './efficiency';

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
