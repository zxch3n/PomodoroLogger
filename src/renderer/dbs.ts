/* istanbul ignore file */
import { DBs, refreshDbs as _refresh, loadDBs as _loadDBs } from '../main/db';

export let refreshDbs = _refresh;
export let loadDBs = _loadDBs;
export let dbs: typeof DBs;

if (process.env.NODE_ENV === 'test') {
    loadDBs();
} else {
    import('@electron/remote').then((remote) => {
        dbs = remote.getGlobal('sharedDB');
        const utils = remote.getGlobal('utils');
        refreshDbs = utils.refreshDbs;
        loadDBs = utils.loadDBs;
    });
}

// @ts-ignore
if (!dbs) {
    dbs = DBs;
}

export default dbs;
