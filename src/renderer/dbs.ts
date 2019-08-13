import { remote } from 'electron';
import { DBs } from '../main/db';
import { env } from '../config';

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
            }

            resolve(doc._id);
        });
    });
}

export async function getNameFromProjectId(_id: string) {
    return await new Promise<string>((resolve, reject) => {
        dbs.projectDB.findOne({ _id }, (err, doc) => {
            if (err) {
                reject(err);
                return;
            }

            if (!doc) {
                reject(new Error(`cannot find _id=${_id}`));
            }

            resolve(doc.name);
        });
    });
}

export default dbs;
