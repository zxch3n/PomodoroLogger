import { createActionCreator, createReducer } from 'deox';
import { Dispatch } from 'redux';
import { actions as cardAction } from '../Card/action';
import { actions as boardActions } from '../Board/action';
import shortid from 'shortid';
import { workers } from '../../../workers';
import { List, ListsState } from '../type';

const db = workers.dbWorkers.listsDB;
const moveDB = workers.dbWorkers.moveDB;

const addList = createActionCreator('[List]ADD', (resolve) => (_id: string, title: string) =>
    resolve({ _id, title })
);

const setLists = createActionCreator('[List]SET_Lists', (resolve) => (lists: ListsState) =>
    resolve(lists)
);

const moveCard = createActionCreator(
    '[List]MOVE_CARD',
    (resolve) => (
        fromListId: string,
        toListId: string,
        fromIndex: number,
        toIndex: number,
        done: () => void
    ) => resolve({ fromListId, toListId, fromIndex, toIndex, done })
);

const renameList = createActionCreator('[List]RENAME', (resolve) => (_id, title) =>
    resolve({ _id, title })
);

const addCard = createActionCreator('[List]ADD_CARD', (resolve) => (_id, cardId) =>
    resolve({ _id, cardId })
);

const deleteList = createActionCreator('[List]DEL_LIST', (resolve) => (_id) => resolve({ _id }));

const deleteCard = createActionCreator('[List]DEL_CARD', (resolve) => (_id, cardId) =>
    resolve({ _id, cardId })
);

const setVisibleCards = createActionCreator(
    '[List]SET_VISIBLE_CARDS',
    (resolve) => (listId: string, cards?: string[]) => resolve({ listId, cards })
);

export const listReducer = createReducer<ListsState, any>({}, (handle) => [
    handle(addList, (state, { payload: { _id, title } }) => ({
        ...state,
        [_id]: {
            _id,
            title,
            cards: [],
        },
    })),

    handle(setLists, (state, { payload }) => payload),
    handle(moveCard, (state, { payload: { fromListId, toListId, fromIndex, toIndex, done } }) => {
        const newState = { ...state };
        const fromList = newState[fromListId];
        const fromCards = Array.from(fromList.cards);
        if (fromList.visibleCards) {
            // user is actually moving one of the visible cards
            fromIndex = fromCards.indexOf(fromList.visibleCards[fromIndex]);
            if (fromListId === toListId) {
                if (toIndex < fromList.visibleCards.length) {
                    toIndex = fromCards.indexOf(fromList.visibleCards[toIndex]);
                } else {
                    const lastVisible = fromList.visibleCards[fromList.visibleCards.length - 1];
                    const lastVisibleIndex = fromCards.indexOf(lastVisible);
                    toIndex = lastVisibleIndex + 1;
                }
            }
        }

        (async () => {
            // I hate to write effect in reducer. But I did not find a clean way to get the correct fromIndex
            const from: List = await db.findOne({ _id: fromListId });
            const fromCards = from.cards;
            const [rm] = fromCards.splice(fromIndex, 1);
            if (fromListId === toListId) {
                fromCards.splice(toIndex, 0, rm);
                await db.update({ _id: fromListId }, { $set: { cards: fromCards } }, {});
                return;
            }

            const dest: List = await db.findOne({ _id: toListId });
            const destCards = dest.cards;
            destCards.splice(toIndex, 0, rm);
            await db.update({ _id: fromListId }, { $set: { cards: fromCards } }, {});
            await db.update({ _id: toListId }, { $set: { cards: destCards } }, {});
            await moveDB.insert({ fromListId, toListId, cardId: rm, time: new Date().getTime() });
        })().then(done);

        if (fromListId === toListId) {
            const [del] = fromCards.splice(fromIndex, 1);
            fromCards.splice(toIndex, 0, del);
            newState[fromListId].cards = fromCards;
            return newState;
        }

        const toCards = Array.from(newState[toListId].cards);
        const [del] = fromCards.splice(fromIndex, 1);
        toCards.splice(toIndex, 0, del);
        newState[fromListId].cards = fromCards;
        newState[toListId].cards = toCards;
        return newState;
    }),

    handle(renameList, (state, { payload: { _id, title } }) => {
        return {
            ...state,
            [_id]: {
                ...state[_id],
                title,
            },
        };
    }),

    handle(addCard, (state, { payload: { _id, cardId } }) => ({
        ...state,
        [_id]: {
            ...state[_id],
            cards: [...state[_id].cards, cardId],
        },
    })),

    handle(deleteList, (state, { payload: { _id } }) => {
        const { [_id]: del, ...rest } = state;
        return rest;
    }),

    handle(deleteCard, (state, { payload: { _id, cardId } }) => {
        const newState = { ...state };
        newState[_id].cards = newState[_id].cards.filter((v) => v !== cardId);
        return newState;
    }),

    handle(setVisibleCards, (state, { payload: { listId, cards } }) => ({
        ...state,
        [listId]: {
            ...state[listId],
            visibleCards: cards,
        },
    })),
]);

export const actions = {
    setVisibleCards: (listId: string, cards?: string[]) => (dispatch: Dispatch) => {
        dispatch(setVisibleCards(listId, cards));
    },
    fetchLists: () => async (dispatch: Dispatch) => {
        const all: List[] = await db.find({}, {});
        const listMap: ListsState = {};
        for (const list of all) {
            listMap[list._id] = list;
        }

        dispatch(setLists(listMap));
    },

    moveCard: (fromListId: string, toListId: string, fromIndex: number, toIndex: number) => async (
        dispatch: Dispatch
    ) => {
        await new Promise((r) => {
            dispatch(moveCard(fromListId, toListId, fromIndex, toIndex, r));
        });
    },
    renameList: (_id: string, title: string) => async (dispatch: Dispatch) => {
        dispatch(renameList(_id, title));
        await db.update({ _id }, { $set: { title } });
    },
    addCard: (_id: string, cardTitle: string, cardContent?: string) => async (
        dispatch: Dispatch
    ) => {
        const cardId = shortid.generate();
        dispatch(addCard(_id, cardId));
        await cardAction.addCard(cardId, _id, cardTitle, cardContent)(dispatch);
    },
    addCardById: (_id: string, cardId: string) => async (dispatch: Dispatch) => {
        dispatch(addCard(_id, cardId));
        await db.update({ _id }, { $push: { cards: cardId } }, {});
    },
    deleteList: (_id: string, boardId?: string) => async (dispatch: Dispatch) => {
        if (boardId !== undefined) {
            await boardActions.deleteList(boardId, _id)(dispatch);
            return;
        }

        dispatch(deleteList(_id));
        await db.remove({ _id });
    },
    deleteCard: (_id: string, cardId: string) => async (dispatch: Dispatch) => {
        dispatch(deleteCard(_id, cardId));
        await db.update({ _id }, { $pull: { cards: cardId } }, {});
    },
    addList: (_id: string, title: string) => async (dispatch: Dispatch) => {
        dispatch(addList(_id, title));
        await db.insert({
            _id,
            title,
            cards: [],
        });
    },
};

export type ListActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
