import { combineReducers } from 'redux';

import { reducer as timerReducer, TimerState} from '../components/Timer/action';
import { todoReducer, TodoState } from '../components/TODO/action';

export interface RootState {
    timer: TimerState;
    todo: TodoState;
}

export const rootReducer = combineReducers<RootState | undefined>({
    timer: timerReducer,
    todo: todoReducer
});
