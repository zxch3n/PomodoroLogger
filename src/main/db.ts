import nedb from 'nedb';
import { dbPaths } from '../config';

const { projectDB, sessionDB, settingDB, kanbanDB, cardsDB, listsDB } = dbPaths;
export const DBs = {
    projectDB: new nedb({ filename: projectDB }),
    sessionDB: new nedb({ filename: sessionDB }),
    settingDB: new nedb({ filename: settingDB }),
    kanbanDB: new nedb({ filename: kanbanDB }),
    cardsDB: new nedb({ filename: cardsDB }),
    listsDB: new nedb({ filename: listsDB })
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

            if (times > 13) {
                throw new Error(
                    `Cannot load database ${db} after 10 times tries. (${err.toString()})`
                );
            }

            setTimeout(load, 100);
            times += 1;
        });
    };

    load();
}
