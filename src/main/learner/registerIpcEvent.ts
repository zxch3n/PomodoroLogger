/**
 * Run by main process
 */

import { ipcMain } from 'electron';
import Worker from 'worker-loader!./train.worker';
const worker = new Worker();

ipcMain.on('startTrain', async (event: any) => {
    worker.onmessage = (workerEvent: MessageEvent) => {
        if (workerEvent.data.type === 'setProgress') {
            event.reply('setTrainProgress', workerEvent.data.progress);
        } else if (workerEvent.data.type === 'setAcc') {
            event.reply('setTrainAcc', workerEvent.data.acc);
        }
    };
    worker.postMessage('startTrain');
});
