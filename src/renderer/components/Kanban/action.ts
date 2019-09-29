import { createActionCreator, createReducer } from 'deox';
import { actions as boardActions } from './Board/action';
import { Dispatch } from 'redux';

export type SortType = 'recent' | 'alpha' | 'due' | 'spent' | 'remaining';
export interface KanbanState {
    sortedBy: SortType;
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
    sortedBy: 'recent',
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

const setSortedBy = createActionCreator('[KANBAN]SET_SORTED_BY', resolve => (sortedBy: SortType) =>
    resolve({ sortedBy })
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
    setEditCard,
    setSortedBy,
    setSearchReg,
    setConfiguringBoardId,
    setChosenBoardId: (_id: string | undefined) => async (dispatch: Dispatch) => {
        dispatch(setChosenBoardId(_id));
        if (_id) {
            await boardActions.setLastVisitTime(_id, new Date().getTime())(dispatch);
        }
    }
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
    handle(setSortedBy, (state, { payload: { sortedBy } }) => ({
        ...state,
        sortedBy
    })),
    handle(setSearchReg, (state, { payload: { reg } }) => ({
        ...state,
        searchReg: reg
    })),
    handle(setConfiguringBoardId, (state, { payload: { _id } }) => ({
        ...state,
        configuringBoardId: _id
    }))
]);
