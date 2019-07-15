import dbs from '../dbs';
import { PomodoroRecord } from './index';
import { promisify } from 'util';

const [find, insert, remove] = [dbs.projectDB.find, dbs.projectDB.insert, dbs.projectDB.remove].map(
    m => promisify(m.bind(dbs.projectDB))
);

function removeRedundantField(record: PomodoroRecord): PomodoroRecord {
    for (const app in record.apps) {
        // TODO: when add title spent time, add the following part
        // for (let title in record.apps[app].titleSpentTime) {
        //
        // }
        delete record.apps[app].lastUpdateTime;
    }

    return record;
}

function consistencyCheck(record: PomodoroRecord) {
    if (record.startTime === 0) {
        throw new Error();
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
    removeRedundantField(record);
    if (!record.projectId) {
        // TODO: invoke ML inference
    }
    consistencyCheck(record);
    await insert(record);
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
