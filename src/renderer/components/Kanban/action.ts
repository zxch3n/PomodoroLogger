import { createActionCreator, createReducer } from 'deox';

export interface KanbanState {
    chosenBoardId?: string;
}

const defaultState: KanbanState = {};

const setChosenBoardId = createActionCreator(
    '[BOARD]SET_CHOSEN_BOARD_ID',
    resolve => (_id: string) => resolve({ _id })
);

export const actions = {
    setChosenBoardId
};

export type KanbanActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<KanbanState, any>(defaultState, handle => [
    handle(setChosenBoardId, (state, { payload: { _id } }) => {
        return {
            ...state,
            chosenBoardId: _id
        };
    })
]);
