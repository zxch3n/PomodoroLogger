import dbs from '../dbs';
import { promisify } from 'util';
import { PomodoroRecord } from './type';
import { dbBaseDir } from '../../config';
import * as fs from 'fs';
import nedb from 'nedb';

const [find, insert, remove] = [dbs.sessionDB.find, dbs.sessionDB.insert, dbs.sessionDB.remove].map(
    m => promisify(m.bind(dbs.sessionDB))
);

export function removeRedundantField(record: PomodoroRecord): PomodoroRecord {
    for (const app in record.apps) {
        // TODO: when add title spent time, add the following part
        // for (let title in record.apps[app].titleSpentTime) {
        //
        // }
        delete record.apps[app].lastUpdateTime;
    }

    return record;
}

export function renameIllegalName(record: PomodoroRecord) {
    for (const app in record.apps) {
        const appRow = record.apps[app];
        for (const title in appRow.titleSpentTime) {
            const newTitle = title.replace(/\./g, '-,-');
            if (title !== newTitle) {
                appRow.titleSpentTime[newTitle] = appRow.titleSpentTime[title];
                delete appRow.titleSpentTime[title];
            }
        }

        const newAppName = app.replace(/\..*$/g, '');
        if (newAppName !== app) {
            record.apps[newAppName] = appRow;
            delete record.apps[app];
        }
    }
}

function consistencyCheck(record: PomodoroRecord) {
    if (record.startTime === 0) {
        throw new Error('no startTime');
    }
    type field = 'switchTimes' | 'spentTimeInHour' | 'screenStaticDuration';
    function sumCheck(fieldName: field) {
        // @ts-ignore
        if (record[fieldName] === undefined) {
            return;
        }

        const aggFromApp = Object.values(record.apps).reduce((left, right) => {
            // @ts-ignore
            return left + right[fieldName];
        }, 0);

        // @ts-ignore
        if (Math.abs(aggFromApp - record[fieldName]) > 1e-6) {
            console.warn(`${fieldName} info does not add up`);
            // @ts-ignore
            record[fieldName] = aggFromApp;
        }
    }

    sumCheck('switchTimes');
    sumCheck('spentTimeInHour');
    sumCheck('screenStaticDuration');
}

export async function addSession(record: PomodoroRecord) {
    if (!record.boardId) {
        // TODO: invoke ML inference
    }
    consistencyCheck(record);
    await insert(record).catch(err => console.log(err));
}

export async function removeSession(startTime: number) {
    await remove({ startTime });
}

export async function getTodaySessions(): Promise<PomodoroRecord[]> {
    const todayStartTime = new Date(new Date().toDateString()).getTime();
    return ((await find({ startTime: { $gt: todayStartTime } })) as unknown) as PomodoroRecord[];
}

export async function getAllSession(): Promise<PomodoroRecord[]> {
    return (await find({})) as PomodoroRecord[];
}

export async function loadDB(path: string): Promise<nedb> {
    const db = new nedb({ filename: path });
    return new Promise((resolve, reject) => {
        let times = 0;
        const load = () => {
            db.loadDatabase(err => {
                if (!err) {
                    resolve(db);
                    return;
                }

                times += 1;
                if (times > 3) {
                    reject(err);
                    return;
                }

                setTimeout(load, 0);
            });
        };

        load();
    });
}

export function loadDBSync(path: string) {
    const db = new nedb({ filename: path });
    let times = 0;
    const load = () => {
        db.loadDatabase(err => {
            if (!err) {
                return;
            }

            times += 1;
            if (times > 3) {
                throw err;
            }

            return setTimeout(load, 0);
        });
    };

    return db;
}

export async function getDailyCount() {
    // TODO:
}

const deleteFolderRecursive = (path: string) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

export async function deleteAllUserData() {
    if (fs.existsSync(dbBaseDir)) {
        deleteFolderRecursive(dbBaseDir);
    }
}

export async function exportDBData() {
    const [projectDB, sessionDB, settingDB] = await Promise.all([
        promisify(dbs.projectDB.find.bind(dbs.projectDB, {}, {}))(),
        promisify(dbs.sessionDB.find.bind(dbs.sessionDB, {}, {}))(),
        promisify(dbs.settingDB.find.bind(dbs.settingDB, {}, {}))()
    ]);

    return {
        projectDB,
        sessionDB,
        settingDB
    };
}

export async function loadDBData() {
    // TODO
}
