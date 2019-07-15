import { Monitor } from './index';

describe('Monitor', () => {
    it('calls the listener', done => {
        let times = 0;
        const monitor = new Monitor(
            (name, data, url) => {
                expect(data).toHaveProperty('apps');
                expect(Object.keys(data.apps).length).toBeGreaterThanOrEqual(1);
                console.log(JSON.stringify(data));
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
});
