import { Application } from 'spectron';
import electron from 'electron';
import * as path from 'path';

jest.setTimeout(20000);
describe('Main Window', () => {
    let app: Application;

    beforeEach(() => {
        app = new Application({
            path: electron.toString(),
            args: [path.join(__dirname, '..', '..')]
            // requireName: 'electronRequire'
        });

        return app.start();
    });

    afterEach(() => {
        if (app.isRunning()) {
            return app.stop();
        }
    });

    it('opens the window', async () => {
        const { client, browserWindow } = app;

        await client.waitUntilWindowLoaded();
        const title = await browserWindow.getTitle();

        expect(title).toBe('Time Logger');
    });

    it('has a timer', async () => {
        const { client } = app;
        await client.waitUntilWindowLoaded();
        await client.click('#start-timer-button');
        const text = await client.getText('#left-time-text');
        expect(text).toBe('24:59');
    });
});
