import { createActionCreator, createReducer } from 'deox';

export interface KanbanState {
    chosenBoardId?: string;
    editCard: {
        isEditing: boolean;
        _id?: string;
        listId: string;
    };
}

const defaultState: KanbanState = {
    editCard: {
        isEditing: false,
        listId: ''
    }
};

const setChosenBoardId = createActionCreator(
    '[BOARD]SET_CHOSEN_BOARD_ID',
    resolve => (_id?: string) => resolve({ _id })
);

const setEditCard = createActionCreator(
    '[BOARD]EDIT_CARD',
    resolve => (isEditing: boolean, listId: string, _id?: string) =>
        resolve({ isEditing, _id, listId })
);

export const actions = {
    setChosenBoardId,
    setEditCard
};

export type KanbanActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<KanbanState, any>(defaultState, handle => [
    handle(setChosenBoardId, (state, { payload: { _id } }) => {
        return {
            ...state,
            chosenBoardId: _id
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
    })
]);
