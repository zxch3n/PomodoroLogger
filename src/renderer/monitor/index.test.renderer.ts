import { Monitor } from './index';

describe('Monitor', () => {
    it('calls the listener', done => {
        let times = 0;
        const monitor = new Monitor(
            (name, data, url) => {
                expect(url).toBeUndefined();
                expect(data).toHaveProperty('apps');
                expect(Object.keys(data.apps).length).toBeGreaterThanOrEqual(1);
                times += 1;
                if (times >= 3) {
                    done();
                }
            },
            500,
            undefined
        );
        monitor.start();
    });

    it('can be stopped', async () => {
        let count = 0;
        const monitor = new Monitor(() => {
            count += 1;
        }, 50);
        monitor.start();
        monitor.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
        const newCount = count;
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(count).toEqual(newCount);
    });

    it('can be resumed', async () => {
        let count = 0;
        const monitor = new Monitor(() => {
            count += 1;
        }, 50);
        monitor.start();
        monitor.stop();
        await new Promise(resolve => setTimeout(resolve, 100));
        const newCount = count;
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(count).toEqual(newCount);
        monitor.resume();
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(count).toBeGreaterThan(newCount);
    });

    it('can be cleared', async () => {
        // TODO:
    });

    it('can resume correctly', async () => {
        // TODO:
    });

    it('can clear correctly', async () => {
        // TODO:
    });

    it('will normalize timer when session is finished', async () => {
        const monitor = new Monitor(() => {}, 500);
        monitor.start();
        await new Promise(r => setTimeout(r, 1000));
        monitor.stop();
        let sum = 0;
        for (const app in monitor.sessionData.apps) {
            const titles = monitor.sessionData.apps[app].titleSpentTime;
            for (const t in titles) {
                sum += titles[t].normalizedWeight;
            }
        }

        expect(sum).toBeCloseTo(1);
    });
});
