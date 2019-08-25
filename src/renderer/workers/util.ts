export type DoneType = (data: { payload: any; type: string }) => void;

export function addWorkerListeners(
    ctx: Worker,
    handleMap: { [type: string]: (payload: any, done: DoneType) => void }
) {
    ctx.addEventListener('message', async ({ data: { type, payload, code } }) => {
        if (!(type in handleMap)) {
            return;
        }

        const done = (data: { payload: any; type: string }) => {
            // @ts-ignore
            data.code = code;
            ctx.postMessage(data);
        };

        handleMap[type](payload, done);
    });
}
