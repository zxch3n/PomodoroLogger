import { actions, boardReducer, KanbanBoardState } from './action';
import { Dispatch } from 'redux';
import { dbBaseDir, dbPaths } from '../../../../config';
import { existsSync, unlink, mkdir } from 'fs';
import { promisify } from 'util';

beforeEach(async () => {
    if (existsSync(dbPaths.kanbanDBPath)) {
        await promisify(unlink)(dbPaths.kanbanDBPath).catch(() => {});
    }

    if (!existsSync(dbBaseDir)) {
        await promisify(mkdir)(dbBaseDir).catch(() => {});
    }
});

describe('Reducer', () => {
    it('reduce MOVE_LIST', async () => {
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

        await actions.addBoard('B0', 'B0')(dispatch);
        expect(state['B0'].lists.length).toBe(3);
        const lists = state['B0'].lists.concat();
        await actions.moveList('B0', 0, 2)(dispatch);
        expect(state['B0'].lists).toStrictEqual([lists[1], lists[2], lists[0]]);
    });
});
