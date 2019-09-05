import { remote } from 'electron';
import { DBs } from '../main/db';
import { DBWorker } from './workers/DBWorker';
import { KanbanBoard } from './components/Kanban/Board/action';

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
    const worker = new DBWorker('kanbanDB');
    const board: KanbanBoard = await worker.findOne({ _id });
    return board.name;
}

export default dbs;
