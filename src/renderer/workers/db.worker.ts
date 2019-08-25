import nedb from 'nedb';
import { addWorkerListeners, DoneType } from './util';
const ctx: Worker = self as any;
const dbs: { [name: string]: nedb } = {};

export async function loadDB(path: string): Promise<nedb> {
    const db = new nedb({ filename: path });
    return await new Promise((resolve, reject) => {
        let times = 0;
        const load = () => {
            db.loadDatabase(err => {
                if (!err) {
                    resolve(db);
                    return;
                }

                times += 1;
                if (times > 10) {
                    reject(err);
                    return;
                }

                setTimeout(load, 100);
            });
        };

        load();
    });
}

function genHandleFunc(opName: string, leastArgNum: number = 0) {
    return async ({ args, path }: { args: any[]; path: string }, done: DoneType) => {
        if (leastArgNum > args.length) {
            throw new Error(
                `${opName} operation must have at least
                 ${leastArgNum} arguments but got ${args.length}`
            );
        }

        if (!(path in dbs)) {
            dbs[path] = await loadDB(path);
        }

        args.push((err: Error, doc: any) => {
            done({
                type: 'done',
                payload: doc
            });
        });

        // @ts-ignore
        dbs[path][opName](...args);
    };
}

addWorkerListeners(ctx, {
    find: genHandleFunc('find', 2),
    findOne: genHandleFunc('findOne', 1),
    update: genHandleFunc('update', 2),
    insert: genHandleFunc('insert', 1),
    remove: genHandleFunc('remove', 1)
});
