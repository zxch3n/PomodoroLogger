import { combineReducers } from 'redux';
import { boardReducer, KanbanBoardMap } from './action';
import { listReducer, ListMap } from './List/action';
import { cardReducer, CardMap } from './Card/action';

export const reducer = combineReducers({
    boards: boardReducer,
    lists: listReducer,
    cards: cardReducer
});

export interface KanbanState {
    boards: KanbanBoardMap;
    lists: ListMap;
    cards: CardMap;
}
