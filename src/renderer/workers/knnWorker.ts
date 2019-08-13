import Worker from 'worker-loader!./trainKnn.worker';
import { PomodoroRecord } from '../monitor/type';
import { BaseWorker } from './BaseWorker';

export class KnnWorker extends BaseWorker {
    protected worker: Worker = new Worker();
    constructor() {
        super();
    }

    async train(onDone: (accuracy: number) => void, onProgress: (progress: number) => void) {
        return this.createHandler(
            { type: 'trainModel' },
            {
                setProgress: onProgress,
                setAcc: (acc, done) => {
                    onDone(acc);
                    done();
                }
            },
            30000
        );
    }

    public async predict(record: PomodoroRecord | PomodoroRecord[]) {
        let records = record;
        if (!Array.isArray(record)) {
            records = [record];
        }

        return this.createHandler(
            { type: 'predict', payload: records },
            {
                predict: (payload, done) => {
                    if (!Array.isArray(record)) {
                        done(payload[0] as string);
                    } else {
                        done(payload as string[]);
                    }
                }
            }
        );
    }

    async loadModel() {
        return this.createHandler(
            { type: 'loadModel' },
            {
                onDone: (payload, done) => done()
            }
        );
    }

    async saveModel() {
        return this.createHandler(
            { type: 'saveModel' },
            {
                onDone: (payload, done) => done()
            }
        );
    }
}
