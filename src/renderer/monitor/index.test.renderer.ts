import { Monitor } from './index';

describe('Monitor', () => {
    it('calls the listener', done => {
        const monitor = new Monitor(
            data => {
                expect(data).toHaveProperty('apps');
                expect(Object.keys(data.apps).length).toBeGreaterThanOrEqual(1);
                console.log(data);
                done();
            },
            500,
            undefined
        );
        monitor.start();
    });
});
