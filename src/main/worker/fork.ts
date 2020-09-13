import path from 'path';
import { fork } from 'child_process';
import { WorkerMessage, WorkerMessageType, WorkerResponse } from '../ipc/type';

export const workerProcess = fork(path.join(__dirname, `worker.js`));
const resolveMap: { [id: string]: (data: WorkerResponse<any>) => void } = {};

workerProcess.on('message', (msg: WorkerResponse) => {
    if (!msg.id) {
        return;
    }

    const callback = resolveMap[msg.id];
    if (callback) {
        callback(msg);
        delete resolveMap[msg.id];
    }
});

export async function sendWorkerMessage<T extends WorkerMessageType>(
    msg: WorkerMessage<T>,
    timeout: number = 60 * 1000
): Promise<WorkerResponse<T>> {
    const id = msg.id ?? Math.random();
    msg.id = id;

    return new Promise((resolve, reject) => {
        resolveMap[id] = resolve;
        setTimeout(() => {
            if (resolveMap[id] === resolve) {
                delete resolveMap[id];
                reject();
            }
        }, timeout);
        workerProcess.send(msg);
    });
}
