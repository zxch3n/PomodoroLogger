import { createActionCreator, createReducer } from 'deox';
import { Dispatch } from 'redux';
import { AsyncDB } from '../../../../utils/dbHelper';
import dbs from '../../../dbs';
import { actions as cardAction } from '../Card/action';

type CardId = string;
const db = new AsyncDB(dbs.listsDB);

export interface List {
    _id: string;
    title: string;
    cards: CardId[]; // lists id in order
}

export type ListMap = { [_id: string]: List };

const addList = createActionCreator('[List]ADD', resolve => (_id: string, title: string) =>
    resolve({ _id, title })
);

const setLists = createActionCreator('[List]SET_Lists', resolve => (lists: ListMap) =>
    resolve(lists)
);

const moveCard = createActionCreator(
    '[List]MOVE_CARD',
    resolve => (fromListId: string, toListId: string, fromIndex: number, toIndex: number) =>
        resolve({ fromListId, toListId, fromIndex, toIndex })
);

const renameList = createActionCreator('[List]RENAME', resolve => (_id, title) =>
    resolve({ _id, title })
);

const addCard = createActionCreator('[List]ADD_CARD', resolve => (_id, cardId) =>
    resolve({ _id, cardId })
);

const deleteList = createActionCreator('[List]DEL_LIST', resolve => _id => resolve({ _id }));

const deleteCard = createActionCreator('[List]DEL_CARD', resolve => (_id, cardId) =>
    resolve({ _id, cardId })
);

export const listReducer = createReducer<ListMap, any>({}, handle => [
    handle(addList, (state, { payload: { _id, title } }) => ({
        ...state,
        [_id]: {
            _id,
            title,
            cards: []
        }
    })),

    handle(setLists, (state, { payload }) => payload),
    handle(moveCard, (state, { payload: { fromListId, toListId, fromIndex, toIndex } }) => {
        const newState = { ...state };
        const [del] = newState[fromListId].cards.splice(fromIndex, 1);
        newState[toListId].cards.splice(toIndex, 0, del);
        return newState;
    }),

    handle(renameList, (state, { payload: { _id, title } }) => {
        return {
            ...state,
            [_id]: {
                ...state[_id],
                title
            }
        };
    }),

    handle(addCard, (state, { payload: { _id, cardId } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            lists: [...state[_id].cards, cardId]
        }
    })),

    handle(deleteList, (state, { payload: { _id } }) => {
        const { [_id]: del, ...rest } = state;
        return rest;
    }),

    handle(deleteCard, (state, { payload: { _id, cardId } }) => {
        const newState = { ...state };
        newState[_id].cards = newState[_id].cards.filter(v => v !== cardId);
        return newState;
    })
]);

export const actions = {
    fetchLists: () => async (dispatch: Dispatch) => {
        const all: List[] = await db.find({}, {});
        const listMap: ListMap = {};
        for (const list of all) {
            listMap[list._id] = list;
        }

        dispatch(setLists(listMap));
    },

    moveCard: (fromListId: string, toListId: string, fromIndex: number, toIndex: number) => async (
        dispatch: Dispatch
    ) => {
        const from: List = await db.findOne({ _id: fromListId });
        const dest: List = await db.findOne({ _id: toListId });
        const [rm] = from.cards.splice(fromIndex, 1);
        dest.cards.splice(toIndex, 0, rm);
        await db.update({ _id: fromListId }, { $set: { cards: from.cards } }, {});
        await db.update({ _id: toListId }, { $set: { cards: dest.cards } }, {});
        dispatch(moveCard(fromListId, toListId, fromIndex, toIndex));
    },
    renameList: (_id: string, title: string) => async (dispatch: Dispatch) => {
        dispatch(renameList(_id, title));
        await db.update({ _id }, { $set: { title } });
    },
    addCard: (_id: string, cardId: string) => async (dispatch: Dispatch) => {
        dispatch(addCard(_id, cardId));
        await db.update({ _id }, { $push: { cards: cardId } }, {});
    },
    deleteList: (_id: string) => async (dispatch: Dispatch) => {
        dispatch(deleteList(_id));
        await db.remove({ _id });
    },
    deleteCard: (_id: string, cardId: string) => async (dispatch: Dispatch) => {
        dispatch(deleteCard(_id, cardId));
        actions.deleteCard(_id, cardId)(dispatch);
        await db.update({ _id }, { $pull: { cards: cardId } }, {});
    },
    addList: (_id: string, title: string) => async (dispatch: Dispatch) => {
        dispatch(addList(_id, title));
        await db.insert({
            _id,
            title,
            cards: []
        });
    }
};
