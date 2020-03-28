/* istanbul ignore file */
import { remote } from 'electron';
import { DBs, refreshDbs as _refresh } from '../main/db';

export let dbs: typeof DBs;
if (remote) {
    dbs = remote.getGlobal('sharedDB');
}

// @ts-ignore
if (!dbs) {
    dbs = DBs;
}

export const refreshDbs = _refresh;
export default dbs;
