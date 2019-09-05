import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const appdataDir =
    process.env.APPDATA ||
    (process.platform === 'darwin'
        ? process.env.HOME + '/Library/Preferences'
        : process.env.HOME + '/.local/share');
export const baseDir = join(appdataDir, 'PomodoroLogger');
if (!existsSync(baseDir)) {
    mkdirSync(baseDir);
}

const dbDir = process.env.NODE_ENV !== 'test' ? 'db' : '__test__db';
export const dbBaseDir = process.env.NODE_ENV === 'production' ? join(baseDir, dbDir) : dbDir;

if (!existsSync(dbBaseDir)) {
    mkdirSync(dbBaseDir);
}

export const dbPaths = {
    projectDB: join(dbBaseDir, 'projects.nedb'),
    sessionDB: join(dbBaseDir, 'session.nedb'),
    settingDB: join(dbBaseDir, 'setting.nedb'),
    kanbanDB: join(dbBaseDir, 'kanban.nedb'),
    cardsDB: join(dbBaseDir, 'cards.nedb'),
    listsDB: join(dbBaseDir, 'lists.nedb'),
    moveDB: join(dbBaseDir, 'moveCard.nedb')
};

let asarDirName;
let dir = __dirname;
let oldDir = undefined;
while (!dir.endsWith('.asar')) {
    if (oldDir === dir) {
        break;
    }

    oldDir = dir;
    dir = dirname(dir);
}

if (dir.endsWith('.asar')) {
    asarDirName = dirname(dir);
}

export const env = {
    electronAsarDir: asarDirName ? join(asarDirName, 'electron.asar') : undefined,
    appAsarDir: asarDirName ? join(asarDirName, 'app.asar') : undefined
};

export const modelPath = {
    knnPath: join(dbBaseDir, 'modelKnn.json')
};

export const DEBUG_TIME_SCALE = 120;
