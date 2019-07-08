import {actions, projectReducer} from './action';
import {cloneDeep} from 'lodash';
import {existsSync, unlink} from 'fs';
import {todoDBPath} from '../../../config';
import {promisify} from 'util';
import dbs from '../../dbs';

describe('Project reducer', ()=>{
    it ('has a default state', ()=>{
        const state = projectReducer(undefined, {type: ''});
        expect(state).toHaveProperty('projectList');
    });
});

