/* istanbul ignore file */
import { remote } from 'electron';
import { DBs, refreshDbs as _refresh, compact as _compact, loadDBs as _loadDBs } from '../main/db';

export let refreshDbs = _refresh;
export let compact = _compact;
export let loadDBs = _loadDBs;
export let dbs: typeof DBs;
if (remote) {
    dbs = remote.getGlobal('sharedDB');
    const utils = remote.getGlobal('utils');
    refreshDbs = utils.refreshDbs;
    compact = utils.compact;
    loadDBs = utils.loadDBs;
}

if (process.env.NODE_ENV === 'test') {
    loadDBs();
}

// @ts-ignore
if (!dbs) {
    dbs = DBs;
}

export default dbs;
