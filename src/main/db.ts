import nedb from 'nedb';
import { projectDBPath, sessionDBPath } from '../config';

export const projectDB = new nedb({ filename: projectDBPath, autoload: true });
export const sessionDB = new nedb({ filename: sessionDBPath, autoload: true });
