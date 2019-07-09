import { combineReducers } from 'redux';

import { reducer as timerReducer, TimerState} from '../components/Timer/action';
import { todoReducer, TodoState } from '../components/TODO/action';
import { projectReducer, ProjectState } from '../components/Project/action';

export interface RootState {
    timer: TimerState;
    todo: TodoState;
    project: ProjectState;
}

export const rootReducer = combineReducers<RootState | undefined>({
    timer: timerReducer,
    todo: todoReducer,
    project: projectReducer
});
