import nedb from 'nedb';
import {todoDBPath, projectDBPath} from '../config';

export const todoDB = new nedb({filename: todoDBPath, autoload: true});
export const projectDB = new nedb({filename: projectDBPath, autoload: true});

