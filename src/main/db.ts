import nedb from 'nedb';
import { dbPaths } from '../config';

const { projectDBPath, sessionDBPath, settingDBPath } = dbPaths;
export const DBs = {
    projectDB: new nedb({ filename: projectDBPath }),
    sessionDB: new nedb({ filename: sessionDBPath }),
    settingDB: new nedb({ filename: settingDBPath })
};

// Avoid nedb init error
let loaded = 0;
for (const db in DBs) {
    let times = 0;
    const load = () => {
        // @ts-ignore
        DBs[db].loadDatabase(err => {
            if (!err) {
                loaded += 1;
                return;
            }

            if (times > 10) {
                throw new Error(
                    `Cannot load database ${db} after 10 times tries. (${err.toString()})`
                );
            }

            setTimeout(load, 0);
            times += 1;
        });
    };

    load();
}
