import { Application } from 'spectron';
import electron from 'electron';
import * as path from 'path';

jest.setTimeout(20000);
describe('Main Window', () => {
    let app: Application;

    beforeAll(async () => {
        app = new Application({
            path: electron.toString(),
            args: [path.join(__dirname, '..', '..')],
            env: {
                ELECTRON_ENABLE_LOGGING: 1
            }
        });

        await app.start();
        app.client.getMainProcessLogs().then(logs => {
            logs.forEach(log => {
                console.log(log);
            });
        });
    });

    afterAll(() => {
        if (app.isRunning()) {
            return app.stop();
        }
    });

    it('opens the window', async () => {
        const { client, browserWindow } = app;

        await client.waitUntilWindowLoaded();
        const title = await browserWindow.getTitle();

        expect(title).toBe('Time-Logger');
    });

    it('has a timer', async () => {
        const { client } = app;
        await client.waitUntilWindowLoaded();
        await client.$('#start-timer-button').click();
        await new Promise(resolve => setTimeout(resolve, 100));
        const text = await client.getText('#left-time-text');
        expect(text).toBe('25:00');
        await new Promise(resolve => {
            setTimeout(async () => {
                const text = await client.getText('#left-time-text');
                expect(text).toBe('24:59');
                resolve();
            }, 1000);
        });
    });
});
