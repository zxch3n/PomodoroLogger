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

    afterAll(async () => {
        if (app.isRunning()) {
            app.mainProcess.exit();
            app.browserWindow.close();
            return await app.stop();
        }
    });

    it('opens the window', async () => {
        const { client, browserWindow } = app;

        await client.waitUntilWindowLoaded();
        const title = await browserWindow.getTitle();

        expect(title).toBe('Pomodoro Logger');
    });

    it('has a timer', async () => {
        const { client } = app;
        await client.waitUntilWindowLoaded();
        await client.$('#start-timer-button').click();
        const text = await client.getText('#left-time-text');
        expect(text).toBe('25:00');
        await new Promise(resolve => {
            setTimeout(async () => {
                // Click again to stop timer
                await client.$('#start-timer-button').click();
                const text = await client.getText('#left-time-text');
                expect(text).toBe('24:59');
                setTimeout(async () => {
                    const text = await client.getText('#left-time-text');
                    expect(text).toBe('24:59');
                    resolve();
                }, 2000);
            }, 1000);
        });
    });

    it('timer can be cleared', async () => {
        const { client } = app;
        await client.waitUntilWindowLoaded();
        await client.$('#start-timer-button').click();
        await new Promise(r => setTimeout(r, 1500));
        await client.$('#start-timer-button').click();
        await new Promise(r => setTimeout(r, 1500));
        await client.$('#clear-timer-button').click();
        const newText = await client.getText('#left-time-text');
        expect(newText).toBe('25:00');
    });

    it('timer can choose focusing project', async () => {
        const { client } = app;
        await client.waitUntilWindowLoaded();
        await client.$('#focus-selector').click();
        const texts = await client.getText('.focus-option');
        console.log(texts);
        expect(texts.length).toBeGreaterThanOrEqual(1);
    });
});
