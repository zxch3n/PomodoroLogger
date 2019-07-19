import dbs from '../dbs';
import { PomodoroRecord } from './index';
import { promisify } from 'util';

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
    if (!record.projectId) {
        // TODO: invoke ML inference
    }
    consistencyCheck(record);
    await insert(record).catch(err => console.log(err));
}

export async function removeSession(startTime: number) {
    await remove({ startTime });
}

export async function getAllSession(): Promise<PomodoroRecord[]> {
    return (await find({})) as PomodoroRecord[];
}

export async function getDailyCount() {
    // TODO:
}
