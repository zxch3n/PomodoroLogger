import { ipcMain, dialog } from 'electron';
import { IpcEventName, WorkerMessageType } from './type';
import { sendWorkerMessage } from '../worker/fork';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs';
import { writeAllFile } from '../io/write';
import { restart } from '../init';
import { readAllData } from '../io/read';
import { DBs, compact, refreshDbs } from '../db';

export function initialize() {
    ipcMain.handle(IpcEventName.ReleaseDB, async () => {
        await compact();
        for (const key in DBs) {
            // @ts-ignore
            delete DBs[key];
        }
    }),
        ipcMain.handle(IpcEventName.LoadDB, () => {
            return refreshDbs();
        }),
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
