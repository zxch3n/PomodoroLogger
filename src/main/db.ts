import nedb from 'nedb';
import { dbPaths } from '../config';

const { projectDBPath, sessionDBPath, settingDBPath } = dbPaths;
export const DBs = {
    projectDB: new nedb({ filename: projectDBPath, autoload: true }),
    sessionDB: new nedb({ filename: sessionDBPath, autoload: true }),
    settingDB: new nedb({ filename: settingDBPath, autoload: true })
};
