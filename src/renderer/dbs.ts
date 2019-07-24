import { remote } from 'electron';
import { projectDB, sessionDB, settingDB } from '../main/db';
import nedb from 'nedb';

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

export default dbs;
