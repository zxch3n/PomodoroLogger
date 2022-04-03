import { actions, boardReducer, KanbanBoardState } from './action';
import { Dispatch } from 'redux';
import { dbBaseDir, dbPaths } from '../../../../config';
import { existsSync, unlink, mkdir } from 'fs';
import { promisify } from 'util';
import shortid from 'shortid';
import dbs from '../../../dbs';
import { AsyncDB } from '../../../../utils/dbHelper';
import { KanbanBoard } from '../type';

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
            try {
                state = boardReducer(state, action);
            } catch (e) {
                console.warn(e);
            }
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

        await actions.addListById(_id, 'list')(dispatch);
        const list = state[_id].lists;
        expect(list[list.length - 1]).toBe('list');
    });

    it('should update after editing, setLastVisit, onTimerFinished, remove', async () => {
        const _id = shortid.generate();
        let state: KanbanBoardState = {};
        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            try {
                state = boardReducer(state, action);
            } catch (e) {
                console.warn(e);
            }
        };
        await actions.addBoard(_id, _id)(dispatch);
        actions.editBoard(_id, 'new_name', 'new_name')(dispatch);
        actions.setLastVisitTime(_id, 1000)(dispatch);
        expect(state[_id].lastVisitTime).toBe(1000);
        await actions.onTimerFinished(_id, '111', 123, [])(dispatch);
        expect(state[_id].name).toBe('new_name');
        expect(state[_id].description).toBe('new_name');
        expect(state[_id].relatedSessions).toStrictEqual(['111']);
        expect(state[_id].spentHours).toStrictEqual(123);
        await new Promise((r) => setTimeout(r, 500));
        const board = await db.findOne({ _id });
        expect(board).toStrictEqual(state[_id]);
        actions.deleteBoard(_id)(dispatch);
        expect(state[_id]).toBeUndefined();
    });

    it('should add list directly', async () => {
        const _id = shortid.generate();
        let state: KanbanBoardState = {};
        let added = false;
        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            if (action.type.startsWith('[List]')) {
                if (action.payload.title === 'title') {
                    added = true;
                    return;
                }
            }
            try {
                state = boardReducer(state, action);
            } catch (e) {
                console.warn(e);
            }
        };
        await actions.addBoard(_id, _id)(dispatch);
        await actions.addList(_id, 'title')(dispatch);
        expect(added).toBeTruthy();

        await actions.renameBoard(_id, 'lalala')(dispatch);
        expect(state[_id].name).toBe('lalala');
        const lists = state[_id].lists.concat();
        await actions.deleteList(_id, state[_id].lists[0])(dispatch);
        expect(state[_id].lists).toStrictEqual(lists.slice(1));
        const oldState = Object.assign(state, {});
        state = {};
        await actions.fetchBoards()(dispatch);
        // TODO
        // expect(state).toStrictEqual(oldState);
    });
});
