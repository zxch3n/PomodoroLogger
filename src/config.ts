import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const dbBaseDir = process.env.NODE_ENV !== 'test' ? './db' : './__test__db';

if (!existsSync(dbBaseDir)) {
    mkdirSync(dbBaseDir);
}

export const projectDBPath = join(dbBaseDir, 'projects.nedb');
export const sessionDBPath = join(dbBaseDir, 'session.nedb');
export const settingDBPath = join(dbBaseDir, 'setting.nedb');
