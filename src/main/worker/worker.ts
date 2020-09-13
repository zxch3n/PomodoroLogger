import { WorkerMessage, WorkerMessageType, WorkerResponse } from '../ipc/type';
import { handleMergeData } from './dataHandlers';

const handlers: { [T in WorkerMessageType]: (msg: WorkerMessage<T>) => void } = {
    [WorkerMessageType.MergeData]: async (msg) => {
        const payload = await handleMergeData(msg);
        send({
            payload,
            id: msg.id || Math.random(),
            type: msg.type,
        });
    },
};

process.on('message', async <T extends WorkerMessageType>(msg: WorkerMessage<T>) => {
    const callback = handlers[msg.type];
    callback && callback(msg as any);
});

function send(msg: WorkerResponse) {
    process.send!(msg);
}
