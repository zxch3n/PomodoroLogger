import { BaseWorker } from './BaseWorker';
import Worker from 'worker-loader!./db.worker';
import nedb from 'nedb';
import dbs from '../dbs';
import { dbPaths } from '../../config';

class TrueDBWorker extends BaseWorker {
    protected worker = new Worker();

    constructor(private dbType: keyof typeof dbPaths) {
        super();
    }

    genHandler = (op: string) => async (...args: any[]): Promise<any> => {
        return await this.createHandler(
            {
                type: op,
                payload: {
                    args,
                    // @ts-ignore
                    path: dbPaths[this.dbType]
                }
            },
            {
                done: (payload, done) => done(payload)
            },
            30000
        );
    };

    find = this.genHandler('find');
    findOne = this.genHandler('findOne');
    insert = this.genHandler('insert');
    update = this.genHandler('update');
    remove = this.genHandler('remove');
}

/**
 * For testing (not using worker)
 *
 */
class FakeDBWorker {
    private readonly db: nedb;

    constructor(private dbType: string) {
        // @ts-ignore
        this.db = dbs[dbType];
    }

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
