import { createActionCreator, createReducer } from 'deox';

export interface HistoryState {
    chosenProjectId?: string;
}

export const defaultState: HistoryState = {};

const setChosenProjectId = createActionCreator(
    '[History]setChosenProjectId',
    resolve => (project?: string) => resolve(project)
);

export const actions = {
    setChosenProjectId
};

export type HistoryActionCreatorTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<HistoryState, any>(defaultState, handle => [
    handle(setChosenProjectId, (state: HistoryState, { payload }) => ({
        ...state,
        chosenProjectId: payload
    }))
]);
