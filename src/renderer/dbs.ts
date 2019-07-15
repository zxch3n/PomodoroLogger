import { remote } from 'electron';
import { projectDB, sessionDB } from '../main/db';
import nedb from 'nedb';

type dbTypes = 'projectDB' | 'sessionDB';
let dbs: { [key in dbTypes]: nedb };
if (remote) {
    dbs = remote.getGlobal('sharedDB');
}

// @ts-ignore
if (!dbs) {
    dbs = {
        projectDB,
        sessionDB
    };
}

export default dbs;
