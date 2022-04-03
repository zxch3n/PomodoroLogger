import { ipcMain, dialog, app, nativeImage, Notification } from 'electron';
import { IpcEventName, WorkerMessageType } from './type';
import { sendWorkerMessage } from '../worker/fork';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs';
import { writeAllFile } from '../io/write';
import { restart, win } from '../init';
import { readAllData } from '../io/read';
import { activeWin } from '../activeWin';

/**
 * token is used to identify the sender of the message
 * @param name
 * @param callback
 */
function handle(name: string, callback: (...args: any[]) => Promise<void> | any) {
    ipcMain.on(name, async (event, token, ...args) => {
        try {
            const ans = await callback(...args);
            event.reply('reply', token, ans);
        } catch (e) {
            console.error(e);
            event.reply('reply', token, 'error', (e as any).toString());
        }
    });
}

export function initialize() {
    handle(IpcEventName.ActiveWin, activeWin);
    handle(IpcEventName.FocusOnWindow, () => {
        if (!win) return;
        win.show();
        win.focus();
    });
    handle(IpcEventName.Notify, (title, body, iconPath) => {
        const notification = new Notification({
            title,
            body,
            icon: iconPath && nativeImage.createFromPath(iconPath),
        });
        notification.show();
    });
    handle(IpcEventName.OpenDevTools, () => {
        if (!win) return;
        win.webContents.openDevTools({ activate: true, mode: 'detach' });
    });
    handle(IpcEventName.MinimizeWindow, (on, contentHeight) => {
        if (!win) return;
        win.setAlwaysOnTop(on);
        const { height } = win.getBounds();
        if (on) {
            win.setBounds({ height: height - contentHeight + 43, width: 366 });
        } else {
            win.setBounds({ height: 800, width: 1080 });
        }
    });
    handle(IpcEventName.OpenAtLogin, (on) => {
        if (on) {
            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden: true,
            });
        } else {
            app.setLoginItemSettings({
                openAtLogin: false,
            });
        }
    });
    handle(IpcEventName.ExportData, async () => {
        const path = await dialog.showSaveDialog({
            defaultPath: 'pomodoro-logger-exported-data.json',
            filters: [
                {
                    name: 'Json',
                    extensions: ['json'],
                },
                {
                    name: 'All Files',
                    extensions: ['*'],
                },
            ],
        });
        if (path.canceled || !path.filePath) {
            return;
        }

        const data = await readAllData();
        await promisify(writeFile)(path.filePath, JSON.stringify(data), { encoding: 'utf-8' });
    });

    handle(IpcEventName.ImportData, async () => {
        const path = await dialog.showOpenDialog({
            filters: [
                {
                    name: 'Json',
                    extensions: ['json'],
                },
                {
                    name: 'All Files',
                    extensions: ['*'],
                },
            ],
            properties: ['openFile'],
        });
        if (path.canceled || path.filePaths.length === 0) {
            return;
        }

        const dataPath = path.filePaths[0];
        const data = JSON.parse(await promisify(readFile)(dataPath, { encoding: 'utf-8' }));
        const merged = await sendWorkerMessage({
            type: WorkerMessageType.MergeData,
            payload: {
                external: data,
                source: await readAllData(),
            },
        });

        // TODO: Show Warning
        await writeAllFile(merged.payload.merged);
        restart();
    });
}
