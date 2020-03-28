import {
    addSession,
    removeSession,
    getAllSession,
    renameIllegalName,
    loadDB,
    loadDBSync,
    getTodaySessions,
    deleteFolderRecursive
} from './sessionManager';
import { join } from 'path';
import { dbBaseDir, dbPaths } from '../../config';
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'fs';
import { generateRandomName } from '../utils';
import { PomodoroRecord } from './type';
import { createRecord } from '../../../test/utils';
const { sessionDB } = dbPaths;

describe('sessionManager', () => {
    beforeAll(() => {
        if (existsSync(sessionDB)) {
            try {
                unlinkSync(sessionDB);
            } catch (e) {}
        }
    });

    it('addSession', async () => {
        const record: PomodoroRecord = {
            switchActivities: [],
            _id: generateRandomName(),
            boardId: generateRandomName(),
            startTime: new Date().getTime(),
            apps: {},
            switchTimes: 0,
            screenStaticDuration: 0,
            spentTimeInHour: 0
        };

        await addSession(record);
        const sessions = await getAllSession();
        const ans = sessions.find(v => v.boardId === record.boardId);
        expect(ans).toBeTruthy();
    });

    it('removeSession', async () => {
        const record: PomodoroRecord = {
            _id: generateRandomName(),
            boardId: generateRandomName(),
            startTime: new Date().getTime(),
            switchActivities: [],
            apps: {},
            switchTimes: 0,
            screenStaticDuration: 0,
            spentTimeInHour: 0
        };

        await addSession(record);
        await removeSession(record.startTime);
        const sessions = await getAllSession();
        const ans = sessions.find(v => v.boardId === record.boardId);
        expect(ans).toBeUndefined();
    });

    it('should rename illegal names', () => {
        const record = createRecord('123', 123, [
            ['abc.exe', 123],
            ['abd.exe', 123],
            ['abf.eeeee', 123]
        ]);
        record.apps['abc.exe'].titleSpentTime = {
            'hello.123': { normalizedWeight: 0.12, occurrence: 123, index: 0 }
        };
        renameIllegalName(record);
        for (const app in record.apps) {
            expect(app.length).toBe(3);
            for (const title in record.apps[app].titleSpentTime) {
                expect(title.indexOf('.')).toBe(-1);
            }
        }
    });

    it('should rm folder recursively', () => {
        const root = generateRandomName();
        let child = root;
        let index = 0;
        while (index < 20) {
            mkdirSync(child);
            writeFileSync(join(child, generateRandomName()), 'hello');
            child = join(child, generateRandomName());
            index += 1;
        }

        deleteFolderRecursive(root);
        expect(existsSync(root)).toBeFalsy();
    });

    it('should load Db', async () => {
        {
            const db = await loadDB(join(dbBaseDir, 'test_loading.db'));
        }
        {
            const db = await loadDB(join(dbBaseDir, 'test_loading.db'));
        }
        {
            const db = loadDBSync(join(dbBaseDir, 'test_loading.db'));
        }
        {
            const db = loadDBSync(join(dbBaseDir, 'test_loading.db'));
        }
    });

    it('should return today sessions', async () => {
        const todaySession = createRecord('today', 0, []);
        const yesterdayRecord = createRecord('yesterday', 0, []);
        yesterdayRecord.startTime =
            new Date().getTime() - (new Date().getHours() + 1) * 3600 * 1000;
        await addSession(todaySession);
        await addSession(yesterdayRecord);
        const sessions = await getTodaySessions();
        expect(sessions.some(record => record.boardId === 'today')).toBeTruthy();
        expect(sessions.every(record => record.boardId !== 'yesterday')).toBeTruthy();
    });
});
