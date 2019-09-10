import { createActionCreator, createReducer } from 'deox';

export interface KanbanState {
    chosenBoardId?: string;
    editCard: {
        isEditing: boolean;
        _id?: string;
        listId: string;
    };
    searchReg?: string;
    configuringBoardId?: string;
}

const defaultState: KanbanState = {
    editCard: {
        isEditing: false,
        listId: ''
    }
};


const setConfiguringBoardId = createActionCreator(
    '[KANBAN]CONFIGURING_BOARD_ID',
    resolve => (_id?: string) => resolve({ _id })
);

const setChosenBoardId = createActionCreator(
    '[KANBAN]SET_CHOSEN_BOARD_ID',
    resolve => (_id?: string) => resolve({ _id })
);

const setEditCard = createActionCreator(
    '[KANBAN]EDIT_CARD',
    resolve => (isEditing: boolean, listId: string, _id?: string) =>
        resolve({ isEditing, _id, listId })
);

const setSearchReg = createActionCreator('[KANBAN]SET_SEARCH_REG', resolve => (reg?: string) =>
    resolve({ reg })
);

export const actions = {
    setChosenBoardId,
    setEditCard,
    setSearchReg,
    setConfiguringBoardId
};

export type KanbanActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<KanbanState, any>(defaultState, handle => [
    handle(setChosenBoardId, (state, { payload: { _id } }) => {
        return {
            ...state,
            chosenBoardId: _id,
            searchReg: undefined
        };
    }),
    handle(setEditCard, (state, { payload: { _id, isEditing, listId } }) => {
        return {
            ...state,
            editCard: {
                _id,
                isEditing,
                listId
            }
        };
    }),
    handle(setSearchReg, (state, { payload: { reg } }) => ({
        ...state,
        searchReg: reg
    })),
    handle(setConfiguringBoardId, (state, {payload: {_id}})=>({
        ...state,
        configuringBoardId: _id
    }))
]);
