import { createActionCreator, createReducer } from 'deox';
import { Dispatch } from 'redux';
import { actions as listActions } from '../List/action';
import { actions as cardActions } from '../Card/action';
import { actions as kanbanActions } from '../action';
import { actions as historyActions } from '../../History/action';
import { DBWorker } from '../../../workers/DBWorker';
import shortid from 'shortid';
import { lang } from '../../../../lang/en';
import { DistractingRow } from '../../Timer/action';
import { workers } from '../../../workers';

const db = workers.dbWorkers.kanbanDB;
type ListId = string;
type SessionId = string;

export interface AggInfo {
    lastUpdatedTime: number;
    spentTime: number;
    appSpentTime: { [app: string]: number };
    keywordWeights: { [key: string]: number };
}

export interface KanbanBoard {
    _id: string;
    name: string;
    spentHours: number;
    description: string;
    lists: ListId[]; // lists id in order
    focusedList: string;
    doneList: string;
    relatedSessions: SessionId[];
    dueTime?: number; // TODO: Add due time setting
    lastVisitTime?: number;
    aggInfo?: AggInfo;
    pin?: boolean;
    collapsed?: boolean;
    distractionList?: DistractingRow[];
}

export const defaultBoard: KanbanBoard = {
    _id: '',
    lists: [],
    name: '',
    focusedList: '',
    doneList: '',
    description: '',
    collapsed: false,
    relatedSessions: [],
    spentHours: 0
};

export type KanbanBoardState = { [_id: string]: KanbanBoard };

const addBoard = createActionCreator(
    '[Board]ADD',
    resolve => (
        _id: string,
        name: string,
        description: string,
        lists: string[],
        focusedList: string,
        doneList: string
    ) => resolve({ _id, name, description, lists, focusedList, doneList })
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

const setLastVisitTime = createActionCreator('[Board]SET_LAST_VISIT_TIME', resolve => (_id, time) =>
    resolve({ _id, time })
);

const onTimerFinished = createActionCreator(
    '[Board]ON_TIMER_FINISHED',
    resolve => (_id: string, sessionId: string, spentTime: number) =>
        resolve({ _id, sessionId, spentTime })
);

const editBoard = createActionCreator(
    '[Board]EDIT',
    resolve => (_id: string, name: string, description: string) =>
        resolve({ _id, name, description })
);

const setPin = createActionCreator('[Board]SET_PIN', resolve => (_id: string, pin: boolean) =>
    resolve({ _id, pin })
);

const updateAggInfo = createActionCreator(
    '[Board]UPDATE_AGG_INFO',
    resolve => (_id: string, aggInfo: AggInfo) => resolve({ _id, aggInfo })
);

const setDistractionList = createActionCreator(
    '[Board]SET_DISTRACTION_LIST',
    resolve => (_id: string, distractionList?: DistractingRow[]) =>
        resolve({ _id, distractionList })
);

const setCollapsed = createActionCreator(
    '[Board]SET_COLLAPSED',
    resolve => (_id: string, collapsed: boolean) => resolve({ _id, collapsed })
);

export const boardReducer = createReducer<KanbanBoardState, any>({}, handle => [
    handle(
        addBoard,
        (state, { payload: { _id, name, description, lists, focusedList, doneList } }) => ({
            ...state,
            [_id]: {
                ...defaultBoard,
                _id,
                description,
                name,
                lists,
                focusedList,
                doneList
            }
        })
    ),

    handle(setBoardMap, (state, { payload }) => payload),
    handle(setPin, (state, { payload: { _id, pin } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            pin
        }
    })),
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
    }),

    handle(onTimerFinished, (state, { payload: { _id, sessionId, spentTime } }) => {
        return {
            ...state,
            [_id]: {
                ...state[_id],
                relatedSessions: state[_id].relatedSessions.concat([sessionId]),
                spentHours: state[_id].spentHours + spentTime
            }
        };
    }),

    handle(setLastVisitTime, (state, { payload: { _id, time } }) => {
        return {
            ...state,
            [_id]: {
                ...state[_id],
                lastVisitTime: time
            }
        };
    }),

    handle(editBoard, (state, { payload: { _id, name, description } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            name,
            description
        }
    })),

    handle(setDistractionList, (state, { payload: { _id, distractionList } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            distractionList
        }
    })),

    handle(setCollapsed, (state, { payload: { _id, collapsed } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            collapsed
        }
    }))
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
        await kanbanActions.setChosenBoardId(undefined)(dispatch);
        await db.remove({ _id });
    },
    deleteList: (_id: string, listId: string) => async (dispatch: Dispatch) => {
        dispatch(deleteList(_id, listId));
        await listActions.deleteList(listId)(dispatch);
        await db.update({ _id }, { $pull: { lists: listId } });
    },

    addBoard: (_id: string, name: string, description: string = '') => async (
        dispatch: Dispatch
    ) => {
        const lists = [];
        for (const name of ['TODO', 'In Progress', 'Done']) {
            const listId = shortid.generate();
            await listActions.addList(listId, name)(dispatch);
            lists.push(listId);
        }
        dispatch(addBoard(_id, name, description, lists, lists[1], lists[2]));

        const cardId = shortid.generate();
        await cardActions.addCard(cardId, lists[0], lang.welcome, lang.demoCardContent)(dispatch);
        await db.insert({
            ...defaultBoard,
            _id,
            description,
            name,
            lists,
            lastVisitTime: new Date().getTime(),
            focusedList: lists[1],
            doneList: lists[2]
        } as KanbanBoard);
    },

    setLastVisitTime: (_id: string, time: number) => async (dispatch: Dispatch) => {
        dispatch(setLastVisitTime(_id, time));
        await db.update({ _id }, { $set: { lastVisitTime: time } });
    },

    moveCard: (fromListId: string, toListId: string, fromIndex: number, toIndex: number) => async (
        dispatch: Dispatch
    ) => {
        await listActions.moveCard(fromListId, toListId, fromIndex, toIndex)(dispatch);
    },

    onTimerFinished: (
        _id: string,
        sessionId: string,
        timeSpent: number,
        cardIds: string[]
    ) => async (dispatch: Dispatch) => {
        dispatch(onTimerFinished(_id, sessionId, timeSpent));
        dispatch(historyActions.setExpiringKey(_id));
        await db.update(
            { _id },
            { $push: { relatedSessions: sessionId }, $inc: { spentHours: timeSpent } }
        );
        for (const cardId of cardIds) {
            await cardActions.onTimerFinished(cardId, sessionId, timeSpent)(dispatch);
        }

        await actions.setLastVisitTime(_id, new Date().getTime())(dispatch);
    },

    editBoard: (_id: string, name: string, description: string) => async (dispatch: Dispatch) => {
        dispatch(editBoard(_id, name, description));
        await db.update({ _id }, { $set: { name, description } });
    },

    setPin: (_id: string, pin: boolean) => async (dispatch: Dispatch) => {
        dispatch(setPin(_id, pin));
        await db.update({ _id }, { $set: { pin } });
    },

    setDistractionList: (_id: string, distractionList?: DistractingRow[]) => async (
        dispatch: Dispatch
    ) => {
        dispatch(setDistractionList(_id, distractionList));
        await db.update({ _id }, { $set: { distractionList } });
    },

    setCollapsed: (_id: string, collapsed: boolean) => async (dispatch: Dispatch) => {
        dispatch(setCollapsed(_id, collapsed));
        await db.update({ _id }, { $set: { collapsed } });
    }
};

export type BoardActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
