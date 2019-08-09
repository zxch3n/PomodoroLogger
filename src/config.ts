import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const dbBaseDir = process.env.NODE_ENV !== 'test' ? './db' : './__test__db';

if (!existsSync(dbBaseDir)) {
    mkdirSync(dbBaseDir);
}

export const dbPaths = {
    projectDBPath: join(dbBaseDir, 'projects.nedb'),
    sessionDBPath: join(dbBaseDir, 'session.nedb'),
    settingDBPath: join(dbBaseDir, 'setting.nedb')
};
