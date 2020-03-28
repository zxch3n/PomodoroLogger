/* istanbul ignore file */
import { remote } from 'electron';
import { DBs, refreshDbs as _refresh } from '../main/db';
import { DBWorker } from './workers/DBWorker';
import { KanbanBoard } from './components/Kanban/Board/action';
import { workers } from './workers';

let dbs: typeof DBs;
if (remote) {
    dbs = remote.getGlobal('sharedDB');
}

// @ts-ignore
if (!dbs) {
    dbs = DBs;
}

export async function getIdFromProjectName(name: string) {
    return await new Promise<string>((resolve, reject) => {
        dbs.projectDB.findOne({ name }, (err, doc) => {
            if (err) {
                reject(err);
                return;
            }

            if (!doc) {
                reject(new Error(`cannot find name=${name}`));
                return;
            }

            resolve(doc._id);
        });
    });
}

export async function getNameFromBoardId(_id: string) {
    const worker = workers.dbWorkers.kanbanDB;
    const board: KanbanBoard = await worker.findOne({ _id });
    return board.name;
}

export const refreshDbs = _refresh;
export default dbs;
