import { remote } from 'electron';
import { projectDB } from '../main/db';
import nedb from 'nedb';

type dbTypes = 'projectDB';
let dbs: { [key in dbTypes]: nedb };
if (remote) {
    dbs = remote.getGlobal('sharedDB');
} else {
    dbs = {
        projectDB
    };
}

export default dbs;
