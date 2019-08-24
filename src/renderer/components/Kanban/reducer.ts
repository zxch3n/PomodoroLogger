import { combineReducers } from 'redux';
import { boardReducer, KanbanBoardState } from './Board/action';
import { listReducer, ListsState } from './List/action';
import { cardReducer, CardsState } from './Card/action';
import { KanbanState, reducer as kanbanReducer } from './action';

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
