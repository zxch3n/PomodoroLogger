import { BaseWorker, Message } from './BaseWorker';

class MWorker {
    private userListeners: { [name: string]: any[] } = { message: [] };
    constructor(private workerListeners: { [name: string]: any }) {}

    postMessage(msg: Message) {
        this.workerListeners[msg.type](this.listen, msg);
    }

    listen = (msg: Message) => {
        for (const listener of this.userListeners['message'].concat()) {
            listener({ data: msg });
        }
    };

    addEventListener(msg: string, listener: any) {
        this.userListeners[msg].push(listener);
    }

    removeEventListener(msg: string, listener: any) {
        const index = this.userListeners[msg].indexOf(listener);
        this.userListeners[msg].splice(index, 1);
    }
}

type Listen = (msg: Message) => void;
describe('BaseWorker', () => {
    it('should create workable handler', async () => {
        class TestWorker extends BaseWorker {
            // @ts-ignore
            protected worker = new MWorker({
                start: (listen: Listen, msg: Message) => listen({ code: msg.code, type: 'start' })
            });
        }

        const testWorker = new TestWorker();
        await testWorker.createHandler(
            { type: 'start' },
            {
                start: (acc, done) => done()
            }
        );
    });

    it('should avoid conflict when running in parallel', async () => {
        class TestWorker extends BaseWorker {
            // @ts-ignore
            protected worker = new MWorker({
                start: (listen: Listen, msg: Message) => {
                    setTimeout(
                        () => listen({ code: msg.code, type: 'start', payload: msg.payload }),
                        500
                    );
                }
            });
        }

        const testWorker = new TestWorker();
        const promises: Promise<any>[] = [];
        for (let i = 0; i < 20; i += 1) {
            promises.push(
                testWorker.createHandler(
                    { type: 'start', payload: i },
                    {
                        start: (data, done) => done(data)
                    }
                )
            );
        }

        const ans = await Promise.all(promises);
        for (let i = 0; i < 20; i += 1) {
            expect(ans[i]).toEqual(i);
        }
    });

    it('should reject promise when error happen', async () => {
        class TestWorker extends BaseWorker {
            // @ts-ignore
            protected worker = new MWorker({
                start: (listen: Listen, msg: Message) =>
                    listen({ code: msg.code, type: 'error', payload: msg.payload })
            });
        }

        const testWorker = new TestWorker();
        expect(
            await testWorker.createHandler({ type: 'start' }, {}).catch(error => {
                return 'error';
            })
        ).toBe('error');
    });

    it('should reject when timeout', async () => {
        class TestWorker extends BaseWorker {
            // @ts-ignore
            protected worker = new MWorker({
                start: (listen: Listen, msg: Message) => {
                    setTimeout(
                        () => listen({ code: msg.code, type: 'error', payload: msg.payload }),
                        1000
                    );
                }
            });
        }

        const testWorker = new TestWorker();
        expect(
            await testWorker.createHandler({ type: 'start' }, {}, 100).catch(error => {
                return 'error';
            })
        ).toBe('error');
    });
});
