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
});
