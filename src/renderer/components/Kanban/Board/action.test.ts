import { actions, boardReducer, KanbanBoard, KanbanBoardState } from './action';
import { Dispatch } from 'redux';
import { dbBaseDir, dbPaths } from '../../../../config';
import { existsSync, unlink, mkdir } from 'fs';
import { promisify } from 'util';
import shortid = require('shortid');
import dbs from '../../../dbs';
import { AsyncDB } from '../../../../utils/dbHelper';

const db = new AsyncDB(dbs.kanbanDB);
beforeEach(async () => {
    if (existsSync(dbPaths.kanbanDB)) {
        await promisify(unlink)(dbPaths.kanbanDB).catch(() => {});
    }

    if (!existsSync(dbBaseDir)) {
        await promisify(mkdir)(dbBaseDir).catch(() => {});
    }
});

describe('boardReducer', () => {
    it('reduce MOVE_LIST', async () => {
        let state: KanbanBoardState = {};
        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            try {
                state = boardReducer(state, action);
            } catch (e) {
                console.warn(e);
            }
        };

        await actions.addBoard('B0', 'B0')(dispatch);
        expect(state['B0'].lists.length).toBe(3);
        const lists = state['B0'].lists.concat();
        await actions.moveList('B0', 0, 2)(dispatch);
        expect(state['B0'].lists).toStrictEqual([lists[1], lists[2], lists[0]]);
    });
});

describe('board actions', () => {
    it('move list', async () => {
        const _id = shortid.generate();
        let state: KanbanBoardState = {};
        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            console.log('before', state);
            try {
                state = boardReducer(state, action);
            } catch (e) {
                console.warn(e);
            }

            console.log(action, state);
        };
        await actions.addBoard(_id, 'B0')(dispatch);
        const doc: KanbanBoard = await db.findOne({ _id });
        expect(doc.lists.length).toBe(3);
        delete doc.lastVisitTime;
        expect(doc).toStrictEqual(state[_id]);
        await actions.moveList(_id, 0, 2)(dispatch);
        const newDoc: KanbanBoard = await db.findOne({ _id });
        expect(newDoc.lists[0]).toBe(doc.lists[1]);
        expect(newDoc.lists[1]).toBe(doc.lists[2]);
        expect(newDoc.lists[2]).toBe(doc.lists[0]);
        delete newDoc.lastVisitTime;
        expect(newDoc).toStrictEqual(state[_id]);
    });
});
