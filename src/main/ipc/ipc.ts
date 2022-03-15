import { ipcMain, dialog, app, BrowserWindow, nativeImage, Notification } from 'electron';
import { IpcEventName, WorkerMessageType } from './type';
import { sendWorkerMessage } from '../worker/fork';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs';
import { writeAllFile } from '../io/write';
import { restart, win } from '../init';
import { readAllData } from '../io/read';
import activeWin from 'active-win';

export function initialize() {
    ipcMain.handle(IpcEventName.FocusOnWindow, () => {
        if (!win) return;
        win.show();
        win.focus();
    });
    ipcMain.handle(IpcEventName.Notify, (e, title, body, iconPath) => {
        const notification = new Notification({
            title,
            body,
            icon: iconPath && nativeImage.createFromPath(iconPath),
        });
        notification.show();
    });
    ipcMain.handle(IpcEventName.OpenDevTools, () => {
        if (!win) return;
        win.webContents.openDevTools({ activate: true, mode: 'detach' });
    });
    ipcMain.handle(IpcEventName.MinimizeWindow, (event, on, contentHeight) => {
        if (!win) return;
        win.setAlwaysOnTop(on);
        const { height } = win.getBounds();
        if (on) {
            win.setBounds({ height: height - contentHeight + 43, width: 366 });
        } else {
            win.setBounds({ height: 800, width: 1080 });
        }
    });
    ipcMain.handle(IpcEventName.OpenAtLogin, (event, on) => {
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
    ipcMain.handle(IpcEventName.ActiveWin, activeWin);
    ipcMain.handle(IpcEventName.ExportData, async () => {
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

    ipcMain.handle(IpcEventName.ImportData, async () => {
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
