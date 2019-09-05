import { combineReducers } from 'redux';
import { actions as boardActions, boardReducer, KanbanBoardState } from './Board/action';
import { actions as listActions, ListsState, listReducer } from './List/action';
import { actions as cardActions, cardReducer, CardsState } from './Card/action';
import { actions as overallActions, KanbanState, reducer as kanbanReducer } from './action';

export const reducer = combineReducers({
    boards: boardReducer,
    lists: listReducer,
    cards: cardReducer,
    kanban: kanbanReducer
});

export interface KanbanState {
    boards: KanbanBoardState;
    lists: ListsState;
    cards: CardsState;
    kanban: KanbanState;
}

export const kanbanActions = {
    boardActions,
    listActions,
    cardActions,
    overallActions
};

export type KanbanActionTypes = { [key in keyof typeof kanbanActions]: typeof kanbanActions[key] };
