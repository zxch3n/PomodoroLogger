export interface Message {
    code?: number;
    type: string;
    payload?: any;
}

export abstract class BaseWorker {
    protected abstract worker: Worker;

    async createHandler(
        postMsg: Message,
        msgHandler: { [type: string]: (payload: any, done: (v?: any) => void) => any },
        timeout: number | undefined = 10000
    ) {
        // Use code to avoid conflict
        const _code = Math.random();
        postMsg.code = _code;
        return new Promise((resolve, reject) => {
            let isDone = false;
            const listener = ({
                data: { type, payload, code }
            }: {
                data: { type: string; payload: any; code: number };
            }) => {
                if (code !== _code) {
                    return;
                }

                if (!(type in msgHandler)) {
                    if (type === 'error') {
                        reject(payload);
                    }

                    return;
                }

                msgHandler[type](payload, done);
            };

            const done = (value?: any) => {
                if (isDone) {
                    return;
                }

                isDone = true;
                this.worker.removeEventListener('message', listener);
                resolve(value);
            };

            this.worker.addEventListener('message', listener);
            this.worker.postMessage(postMsg);

            if (timeout !== undefined) {
                setTimeout(() => {
                    if (isDone) return;
                    reject(new Error(`Timeout for ${JSON.stringify(postMsg)}`));
                }, timeout);
            }
        });
    }
}
