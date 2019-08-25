import { createActionCreator, createReducer } from 'deox';
import { Dispatch } from 'redux';
import { AsyncDB } from '../../../../utils/dbHelper';
import { actions as listActions } from '../List/action';
import { actions as cardActions } from '../Card/action';
import dbs from '../../../dbs';
import shortid from 'shortid';

const db = new AsyncDB(dbs.kanbanDB);
type ListId = string;

export interface KanbanBoard {
    _id: string;
    name: string;
    spentHours: number;
    lists: ListId[]; // lists id in order
}

export type KanbanBoardState = { [_id: string]: KanbanBoard };

const addBoard = createActionCreator(
    '[Board]ADD',
    resolve => (_id: string, name: string, lists: string[]) => resolve({ _id, name, lists })
);

const setBoardMap = createActionCreator(
    '[Board]SET_BOARD_MAP',
    resolve => (boards: KanbanBoardState) => resolve(boards)
);

const moveList = createActionCreator(
    '[Board]MOVE_LIST',
    resolve => (_id: string, fromIndex: number, toIndex: number) =>
        resolve({ _id, fromIndex, toIndex })
);

const renameBoard = createActionCreator('[Board]RENAME', resolve => (_id, name) =>
    resolve({ _id, name })
);

const addList = createActionCreator('[Board]ADD_LIST', resolve => (_id, listId) =>
    resolve({ _id, cardId: listId })
);

const deleteBoard = createActionCreator('[Board]DEL_BOARD', resolve => _id => resolve({ _id }));

const deleteList = createActionCreator('[Board]DEL_LIST', resolve => (_id, listId) =>
    resolve({ _id, listId })
);

export const boardReducer = createReducer<KanbanBoardState, any>({}, handle => [
    handle(addBoard, (state, { payload: { _id, name, lists = [] } }) => ({
        ...state,
        [_id]: {
            _id,
            name,
            lists,
            spentHours: 0
        }
    })),

    handle(setBoardMap, (state, { payload }) => payload),
    handle(moveList, (state, { payload: { _id, fromIndex, toIndex } }) => {
        const newState = { ...state };
        const lists = newState[_id].lists.concat();
        const [rm] = lists.splice(fromIndex, 1);
        lists.splice(toIndex, 0, rm);
        newState[_id].lists = lists;
        return newState;
    }),

    handle(renameBoard, (state, { payload: { _id, name } }) => {
        return {
            ...state,
            [_id]: {
                ...state[_id],
                name
            }
        };
    }),

    handle(addList, (state, { payload: { _id, cardId } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            lists: [...state[_id].lists, cardId]
        }
    })),

    handle(deleteBoard, (state, { payload: { _id } }) => {
        const { [_id]: del, ...rest } = state;
        return rest;
    }),

    handle(deleteList, (state, { payload: { _id, listId } }) => {
        const newState = { ...state };
        newState[_id].lists = newState[_id].lists.filter(v => v !== listId);
        return newState;
    })
]);

export const actions = {
    fetchBoards: () => async (dispatch: Dispatch) => {
        const boards: KanbanBoard[] = await db.find({}, {});
        const boardMap: KanbanBoardState = {};
        for (const board of boards) {
            boardMap[board._id] = board;
        }

        await listActions.fetchLists()(dispatch);
        await cardActions.fetchCards()(dispatch);
        dispatch(setBoardMap(boardMap));
    },
    moveList: (_id: string, fromIndex: number, toIndex: number) => async (dispatch: Dispatch) => {
        dispatch(moveList(_id, fromIndex, toIndex));
        const board: KanbanBoard = await db.findOne({ _id });
        const lists = board.lists;
        const [del] = lists.splice(fromIndex, 1);
        lists.splice(toIndex, 0, del);
        await db.update({ _id }, { $set: { lists } });
    },
    renameBoard: (_id: string, name: string) => async (dispatch: Dispatch) => {
        dispatch(renameBoard(_id, name));
        await db.update({ _id }, { $set: { name } });
    },
    addList: (_id: string, listTitle: string) => async (dispatch: Dispatch) => {
        const listId = shortid.generate();
        dispatch(addList(_id, listId));
        await listActions.addList(listId, listTitle)(dispatch);
        await db.update({ _id }, { $push: { lists: listId } });
    },
    addListById: (_id: string, listId: string) => async (dispatch: Dispatch) => {
        dispatch(addList(_id, listId));
        await db.update({ _id }, { $push: { lists: listId } });
    },
    deleteBoard: (_id: string) => async (dispatch: Dispatch) => {
        dispatch(deleteBoard(_id));
        await db.remove({ _id });
    },
    deleteList: (_id: string, listId: string) => async (dispatch: Dispatch) => {
        dispatch(deleteList(_id, listId));
        await listActions.deleteCard(_id, listId)(dispatch);
        await db.update({ _id }, { $pull: { lists: listId } });
    },

    addBoard: (_id: string, name: string) => async (dispatch: Dispatch) => {
        const lists = [];
        for (const name of ['TODO', 'In Progress', 'Done']) {
            const listId = shortid.generate();
            await listActions.addList(listId, name)(dispatch);
            lists.push(listId);
        }
        dispatch(addBoard(_id, name, lists));

        await db.insert({
            _id,
            name,
            lists,
            spentHours: 0
        } as KanbanBoard);
    },

    moveCard: (fromListId: string, toListId: string, fromIndex: number, toIndex: number) => async (
        dispatch: Dispatch
    ) => {
        await listActions.moveCard(fromListId, toListId, fromIndex, toIndex)(dispatch);
    }
};

export type BoardActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
