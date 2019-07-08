import {remote} from 'electron';
import {todoDB, projectDB} from '../main/db';
import nedb from 'nedb';


type dbTypes = 'todoDB' | 'projectDB';
let dbs: {[key in dbTypes]: nedb};
if (remote) {
    dbs = remote.getGlobal('sharedDB');
} else {
    dbs = {
        todoDB,
        projectDB
    };
}

console.log("DBS", dbs);
export default dbs;
