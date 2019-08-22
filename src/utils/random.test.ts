import * as random from './random';

describe('util.random', () => {
    it('random int', () => {
        let sum = 0;
        const n = 1e3;
        for (let i = 0; i < n; i += 1) {
            const v = random.intRange(0, 100);
            expect(Math.floor(v)).toEqual(v);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(100);
            sum += v;
        }

        const avg = sum / n;
        expect(Math.abs(avg - 50)).toBeLessThan(20);
    });

    it('random range', () => {
        let sum = 0;
        const n = 1e3;
        for (let i = 0; i < n; i += 1) {
            const v = random.range(0, 100);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(100);
            const v1 = random.range(100);
            expect(v1).toBeGreaterThanOrEqual(0);
            expect(v1).toBeLessThan(100);
            sum += v;
        }

        const avg = sum / n;
        expect(Math.abs(avg - 50)).toBeLessThan(20);
    });

    it('samples randomly', () => {
        const arr = Array.from(Array(100).keys());
        const samples = random.sample(arr, 0.1);
        expect(samples[0].reduce((l, r) => l + r, 0) + samples[1].reduce((l, r) => l + r, 0)).toBe(
            4950
        );
        expect(samples[0].length).toBe(10);
    });

    it('throw error when sample rate is invalid', () => {
        const arr = Array.from(Array(100).keys());
        expect(random.sample(arr, 0)[0].length).toBe(0);
        expect(random.sample(arr, 1)[1].length).toBe(0);
        expect(() => random.sample(arr, -0.01)).toThrowError();
        expect(() => random.sample(arr, 1.01)).toThrowError();
    });
});
