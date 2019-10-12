import { createActionCreator, createReducer } from 'deox';

export interface HistoryState {
    chosenProjectId?: string;
    expiringKey: string;
}

export const defaultState: HistoryState = {
    expiringKey: ''
};

const setChosenProjectId = createActionCreator(
    '[History]setChosenProjectId',
    resolve => (project?: string) => resolve(project)
);

const setExpiringKey = createActionCreator(
    '[History]setExpiringKey',
    resolve => (expiringKey: string) => resolve({ expiringKey })
);

export const actions = {
    setChosenProjectId,
    setExpiringKey
};

export type HistoryActionCreatorTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<HistoryState, any>(defaultState, handle => [
    handle(setChosenProjectId, (state: HistoryState, { payload }) => ({
        ...state,
        chosenProjectId: payload
    })),

    handle(setExpiringKey, (state, { payload: { expiringKey } }) => ({
        ...state,
        expiringKey
    }))
]);
