import { createActionCreator, createReducer } from 'deox';
import { cloneDeep } from 'lodash';
import { Dispatch } from 'redux';
import { createTodoItem, TodoItem } from '../TODO/action';
import dbs from '../../dbs';
import { PomodoroRecord } from '../../monitor';

export interface SubAppSpentTime {
    title: string;
    spentHours: number;
}

export interface ApplicationSpentTime {
    title: string;
    spentHours: number;
    subAppSpentTime: SubAppSpentTime[];
    keywords: string[];
}

export interface ProjectItem {
    _id: string;
    name: string;
    todoList: { [todoTitle: string]: TodoItem };
    spentHours: number;
    applicationSpentTime: { [appName: string]: ApplicationSpentTime };
}

export function createProjectItem(name: string) {
    return {
        name,
        todoList: {},
        spentHours: 0,
        applicationSpentTime: {}
    } as ProjectItem;
}

const defaultProjectItem: Pick<
    ProjectItem,
    'name' | 'todoList' | 'spentHours' | 'applicationSpentTime'
> = {
    name: '',
    todoList: {},
    spentHours: 0,
    applicationSpentTime: {}
};

type ProjectMap = { [name: string]: ProjectItem };

export interface ProjectState {
    projectList: ProjectMap;
}

const defaultState: ProjectState = {
    projectList: {}
};

export const addItem = createActionCreator(
    '[Project]ADD_ITEM',
    resolve => (_id: string, name: string) => resolve({ _id, name })
);

export const removeItem = createActionCreator('[Project]REMOVE_ITEM', resolve => (name: string) =>
    resolve({ name })
);

export const addTodoItem = createActionCreator(
    '[Project]ADD_TODO_ITEM',
    resolve => (name: string, todoItem: TodoItem) => resolve({ name, todoItem })
);

export const setTodoFinished = createActionCreator(
    '[Project]SET_TODO_FINISHED',
    resolve => (name: string, _id: string, isFinished: boolean) =>
        resolve({ name, _id, isFinished })
);

export const removeTodoItem = createActionCreator(
    '[Project]REMOVE_TODO_ITEM',
    resolve => (name: string, _id: string) => resolve({ name, _id })
);

export const setName = createActionCreator(
    '[Project]SET_NAME',
    resolve => (name: string, newName: string) => resolve({ name, newName })
);

export const addAppSpentTime = createActionCreator(
    '[Project]UPDATE_APP_SPENT_TIME',
    resolve => (name: string, appName: string, spentHours: number) =>
        resolve({ name, appName, spentHours })
);

export const fetchAll = createActionCreator(
    '[Project]FETCH_ALL',
    resolve => (projects: ProjectItem[]) => resolve(projects)
);

export const updateOnTimerFinished = createActionCreator(
    '[Project]UPDATE_ON_TIMER_FINISHED',
    resolve => (name: string, pomodoroRecord: PomodoroRecord) => resolve({ name, pomodoroRecord })
);

export const actions = {
    fetchAll: () => (dispatch: Dispatch) => {
        dbs.projectDB.find({}, {}, (err, items) => {
            const newProjectList: ProjectItem[] = items as ProjectItem[];
            return dispatch(fetchAll(newProjectList));
        });
    },
    removeItem: (name: string) => (dispatch: Dispatch) => {
        dbs.projectDB.remove({ name }, err => {
            if (err) {
                console.error(err);
                throw err;
            }

            dispatch(removeItem(name));
        });
    },
    setName: (name: string, newName: string) => (dispatch: Dispatch) => {
        dbs.projectDB.update({ name }, { $set: { name: newName } }, {}, err => {
            if (err) {
                throw err;
            }

            dispatch(setName(name, newName));
        });
    },
    addItem: (name: string) => (dispatch: Dispatch) => {
        // @ts-ignore
        const data: ProjectItem = { ...defaultProjectItem, name };
        dbs.projectDB.insert(data, (err, newDoc: typeof data & { name: string }) => {
            if (err) {
                throw err;
            }

            dispatch(addItem(newDoc._id, newDoc.name));
        });
    },

    addTodoItem: (name: string, title: string) => (dispatch: Dispatch) => {
        const todoItem: TodoItem = createTodoItem(title, undefined, name);
        dbs.projectDB.update(
            { name },
            { $set: { [`todoList.${todoItem._id}`]: todoItem } },
            { returnUpdatedDocs: true },
            (err, doc) => {
                if (err) throw err;
                dispatch(addTodoItem(name, todoItem));
            }
        );
    },

    setTodoFinished: (name: string, _id: string, isFinished: boolean) => (dispatch: Dispatch) => {
        dbs.projectDB.update(
            { name },
            { $set: { [`todoList.${_id}.isFinished`]: isFinished } },
            { returnUpdatedDocs: true },
            (err, doc) => {
                if (err) throw err;
                dispatch(setTodoFinished(name, _id, isFinished));
            }
        );
    },

    removeTodoItem: (name: string, _id: string) => (dispatch: Dispatch) => {
        dbs.projectDB.update({ name }, { $unset: { [`todoList.${_id}`]: true } }, {}, err => {
            if (err) throw err;
            dispatch(removeTodoItem(name, _id));
        });
    },

    addAppSpentTime: (name: string, appName: string, spentHours: number) => (
        dispatch: Dispatch
    ) => {
        dbs.projectDB.update(
            { name },
            {
                $inc: {
                    spentHours,
                    [`applicationSpentTime.${appName}.spentHours`]: spentHours
                }
            },
            { upsert: true },
            err => {
                if (err) throw err;
                dispatch(addAppSpentTime(name, appName, spentHours));
            }
        );
    },

    updateOnTimerFinished: (name: string, pomodoroRecord: PomodoroRecord) => (
        dispatch: Dispatch
    ) => {
        dispatch(updateOnTimerFinished(name, pomodoroRecord));
        for (const appName in pomodoroRecord.apps) {
            const app = pomodoroRecord.apps[appName];
            actions.addAppSpentTime(name, appName, app.spentTimeInHour)(dispatch);
        }
    }
};

export type ProjectActionTypes = { [key in keyof typeof actions]: typeof actions[key] };

// ==================================
//
//            Reducer
//
// ==================================

export const projectReducer = createReducer<ProjectState, any>(defaultState, handle => [
    handle(addItem, (state: ProjectState, { payload: { _id, name } }) => {
        const newState = cloneDeep(state);
        const data = {
            ...defaultProjectItem,
            _id,
            name
        };
        newState.projectList[name] = data;
        return newState;
    }),

    handle(setName, (state: ProjectState, { payload: { name, newName } }) => {
        const newState = cloneDeep(state);
        newState.projectList[newName] = newState.projectList[name];
        newState.projectList[newName].name = newName;
        delete newState.projectList[name];
        return newState;
    }),

    handle(removeItem, (state: ProjectState, { payload: { name } }) => {
        const newState = cloneDeep(state);
        delete newState.projectList[name];
        return newState;
    }),

    handle(fetchAll, (state: ProjectState, { payload }) => {
        const projects: ProjectItem[] = payload;
        const newProjectMap: ProjectMap = {};
        for (const project of projects) {
            newProjectMap[project.name] = project;
        }

        return { ...state, projectList: newProjectMap };
    }),

    handle(addTodoItem, (state: ProjectState, { payload: { name, todoItem } }) => {
        const newState = cloneDeep(state);
        const todoId = todoItem._id;
        newState.projectList[name].todoList[todoId] = todoItem;
        return newState;
    }),

    handle(removeTodoItem, (state: ProjectState, { payload: { name, _id } }) => {
        const newState = cloneDeep(state);
        delete newState.projectList[name].todoList[_id];
        return newState;
    }),

    handle(addAppSpentTime, (state: ProjectState, { payload: { name, appName, spentHours } }) => {
        const newState = cloneDeep(state);
        const project = newState.projectList[name];
        project.spentHours += spentHours;
        if (!(appName in project.applicationSpentTime)) {
            project.applicationSpentTime[appName] = {
                spentHours: 0,
                keywords: [],
                subAppSpentTime: [],
                title: appName
            };
        }
        project.applicationSpentTime[appName].spentHours += spentHours;
        return newState;
    }),

    handle(setTodoFinished, (state: ProjectState, { payload: { name, _id, isFinished } }) => {
        const newState = cloneDeep(state);
        newState.projectList[name].todoList[_id].isFinished = isFinished;
        return newState;
    })
]);
