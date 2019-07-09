import nedb from 'nedb';
import {projectDBPath} from '../config';

export const projectDB = new nedb({filename: projectDBPath, autoload: true});

