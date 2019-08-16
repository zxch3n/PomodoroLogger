import { join } from 'path';
const dirPath = './__test__perf_db/';
import * as config from '../../src/config';
config.dbPaths.projectDBPath = join(dirPath, 'projects.nedb');
config.dbPaths.sessionDBPath = join(dirPath, 'session.nedb');

import { getPomodoroCalendarData } from '../../src/renderer/components/History/op';
import { generateAndSave } from './fakeDataGenerator';
import { existsSync } from 'fs';
import { getAllSession } from '../../src/renderer/monitor/sessionManager';

jest.setTimeout(15 * 1000);
beforeAll(async done => {
    if (!existsSync(dirPath)) {
        await generateAndSave(dirPath);
    }

    done();
});

describe('Records Agg in History', () => {
    it('Calendar Agg is fast enough', async () => {
        const startTime = new Date().getTime();
        const sessions = await getAllSession();
        getPomodoroCalendarData(sessions);
        expect(new Date().getTime() - startTime).toBeLessThan(5000);
    });
});
