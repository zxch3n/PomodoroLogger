import { remote } from 'electron';
import { projectDB, sessionDB, settingDB } from '../main/db';
import nedb from 'nedb';
import { reject } from 'q';

type dbTypes = 'projectDB' | 'sessionDB' | 'settingDB';
let dbs: { [key in dbTypes]: nedb };
if (remote) {
    dbs = remote.getGlobal('sharedDB');
}

// @ts-ignore
if (!dbs) {
    dbs = {
        projectDB,
        sessionDB,
        settingDB
    };
}

export async function getIdFromProjectName(name: string) {
    return await new Promise<string>((resolve, reject) => {
        dbs.projectDB.findOne({ name }, (err, doc) => {
            if (err) {
                reject(err);
                return;
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

            resolve(doc.name);
        });
    });
}

export default dbs;
