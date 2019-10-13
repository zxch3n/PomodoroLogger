import Worker from 'worker-loader!./tokenizer.worker';
import { PomodoroRecord } from '../monitor/type';
import { BaseWorker } from './BaseWorker';

export class Tokenizer extends BaseWorker {
    protected worker = new Worker();

    public async tokenize(records: PomodoroRecord[]): Promise<[string, number][]> {
        if (process.env.NODE_ENV === 'test') {
            return [];
        }

        return (await this.createHandler(
            {
                type: 'tokenize',
                payload: records
            },
            {
                tokenize: (payload, done) => {
                    console.log(payload);
                    done(payload);
                }
            },
            5000
        )) as [string, number][];
    }
}
