import nedb from 'nedb';
import { dbPaths } from '../config';

const { projectDBPath, sessionDBPath, settingDBPath } = dbPaths;
export const projectDB = new nedb({ filename: projectDBPath, autoload: true });
export const sessionDB = new nedb({ filename: sessionDBPath, autoload: true });
export const settingDB = new nedb({ filename: settingDBPath, autoload: true });
