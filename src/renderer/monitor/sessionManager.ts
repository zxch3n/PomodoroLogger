import { workers } from '../workers';
import { PomodoroRecord } from './type';
import { dbBaseDir } from '../../config';
import * as fs from 'fs';
import nedb from 'nedb';

const dbWorkers = workers.dbWorkers;
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

/* istanbul ignore next */
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
    // @ts-ignore
    await dbWorkers.sessionDB.insert(record).catch((err) => console.error(err));
}

export async function removeSession(startTime: number) {
    // @ts-ignore
    await dbWorkers.sessionDB.remove({ startTime });
}

export async function getTodaySessions(): Promise<PomodoroRecord[]> {
    const todayStartTime = new Date(new Date().toDateString()).getTime();
    const ans = ((await dbWorkers.sessionDB.find(
        { startTime: { $gt: todayStartTime } },
        {}
    )) as unknown) as PomodoroRecord[];
    return ans;
}

export async function getAllSession(): Promise<PomodoroRecord[]> {
    // @ts-ignore
    return (await dbWorkers.sessionDB.find({}, {})) as PomodoroRecord[];
}

export async function loadDB(path: string): Promise<nedb> {
    const db = new nedb({ filename: path });
    return new Promise((resolve, reject) => {
        let times = 0;
        const load = () => {
            db.loadDatabase((err) => {
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
        db.loadDatabase((err) => {
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

export const deleteFolderRecursive = (path: string) => {
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

/* istanbul ignore next */
export async function deleteAllUserData() {
    if (fs.existsSync(dbBaseDir)) {
        deleteFolderRecursive(dbBaseDir);
    }
}

export function getIndexToTitleApp(record: PomodoroRecord): [string, string][] {
    const indexToTitle: [string, string][] = [];
    for (const app in record.apps) {
        for (const title in record.apps[app].titleSpentTime) {
            indexToTitle[record.apps[app].titleSpentTime[title].index] = [title, app];
        }
    }

    return indexToTitle;
}
