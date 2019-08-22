import { Counter } from './Counter';

describe('Counter', () => {
    it('counts', () => {
        const counter = new Counter();
        counter.add('1', 1);
        counter.add('2', 0.5);
        counter.add('2', 1.5);
        counter.add('3', 1.5);
        counter.add('3', 1.5);
        expect(counter.dict).toStrictEqual({
            1: 1,
            2: 2,
            3: 3
        });

        const list = counter.list;
        const fromList = {};
        // @ts-ignore
        list.forEach(v => {
            fromList[v[0]] = v[1];
        });
        expect(fromList).toStrictEqual({
            1: 1,
            2: 2,
            3: 3
        });
    });

    it('lists topK correctly', () => {
        const counter = new Counter();
        for (let i = 1; i <= 1000; i += 1) {
            counter.add(i.toString(), i);
        }

        const ans = counter.getNameValuePairs({ topK: 100 });
        expect(Array.from(new Set(ans)).length).toBe(100);
        for (const v of ans) {
            expect(v.value).toBeGreaterThanOrEqual(901);
            expect(v.value.toString()).toEqual(v.name);
        }
    });

    it("'s toFixed works", () => {
        const counter = new Counter();
        for (let i = 0.01; i <= 1; i += 0.01) {
            counter.add(i.toFixed(2), i + Math.random() * 0.001);
        }

        const ans = counter.getNameValuePairs({ toFixed: 2 });
        for (const v of ans) {
            expect(v.value).toEqual(parseFloat(v.name));
        }
    });
});
