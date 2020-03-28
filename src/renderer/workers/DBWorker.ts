import { BaseWorker } from './BaseWorker';
import Worker from 'worker-loader!./db.worker';
import nedb from 'nedb';
import { dbs } from '../dbs';
import { dbPaths } from '../../config';

/* istanbul ignore next */
class TrueDBWorker extends BaseWorker {
    protected worker: Worker;

    constructor(private dbType: keyof typeof dbPaths, worker?: Worker) {
        super();
        this.worker = worker || new Worker();
    }

    getWorker() {
        return this.worker;
    }

    setWorker(worker: Worker) {
        this.worker = worker;
    }

    genHandler = (op: string) => async (...args: any[]): Promise<any> => {
        return await this.createHandler(
            {
                type: op,
                payload: {
                    args,
                    // @ts-ignore
                    path: dbPaths[this.dbType],
                },
            },
            {
                done: (payload, done) => done(payload),
            },
            30000
        );
    };

    find = this.genHandler('find');
    findOne = this.genHandler('findOne');
    insert = this.genHandler('insert');
    update = this.genHandler('update');
    remove = this.genHandler('remove');
    count = this.genHandler('count');
}

/**
 * For testing (not using worker)
 *
 */
class FakeDBWorker {
    private readonly db: nedb;

    constructor(private dbType: string, worker?: undefined) {
        // @ts-ignore
        this.db = dbs[dbType];
    }

    getWorker() {
        return undefined;
    }

    setWorker(worker: Worker) {}

    genHandler = (op: string) => async (...args: any[]): Promise<any> => {
        return await new Promise((resolve, reject) => {
            if (this.db === undefined) {
                reject(new Error('cannot init db'));
                return;
            }

            args.push((err: Error, doc?: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(doc);
            });

            // @ts-ignore
            this.db[op](...args);
        });
    };

    find: (query: any, projection: any) => Promise<any> = this.genHandler('find');
    findOne: (...args: any[]) => Promise<any> = this.genHandler('findOne');
    insert = this.genHandler('insert');
    update = this.genHandler('update');
    remove = this.genHandler('remove');
}

// @ts-ignore
export const DBWorker: typeof TrueDBWorker =
    process.env.NODE_ENV === 'test' ? FakeDBWorker : TrueDBWorker;
export type DBWorker = TrueDBWorker;
