import { createActionCreator, createReducer } from 'deox';
import { flatten, cloneDeep, find } from 'lodash';
import dbs from '../../dbs';
import { Dispatch } from 'redux';
import { ProjectItem } from '../Project/action';
import { promisify } from 'util';
import { removeTodoItem as projectStateRemoveTodo,
    addTodoItem as projectStateAddTodo } from '../Project/action';


export interface TodoItem {
    _id: string,
    title: string;
    project: string;
    content?: string;
    expiryDate?: string;
    datetime: string;
    isFinished: boolean;
    isFocused: boolean;
}

export function createTodoItem(
    title: string, _id?: string, project: string = 'Default',
    content?: string, expiryDate?: string): TodoItem {
    const now = new Date().toString();
    const id: string = _id ? _id : `${title} ${now}`;
    return {
        title, project, content, expiryDate, _id: id, isFocused: false, isFinished: false,
        datetime: now
    };
}


export interface TodoState {
    todoList: TodoItem[];
}


const defaultState: TodoState = {
    todoList: []
};


export const addItem = createActionCreator('[Project]ADD_ITEM', resolve =>
    (_id: string, title: string, datetime: string, project: string = 'Default', content?: string, expiryDate?: string) => (
        resolve({ _id, title, datetime, project, content, expiryDate })
    )
);

export const removeItem = createActionCreator('[Project]REMOVE_ITEM', resolve =>
    (_id: string) => resolve({ _id })
);

export const setProject = createActionCreator('[Project]SET_PROJECT', resolve =>
    (_id: string, project: string) => resolve({ _id, project })
);

export const setTitle = createActionCreator('[Project]SET_TITLE', resolve => (
    (_id: string, title: string) => resolve({ _id, title })
));

export const setContent = createActionCreator('[Project]SET_CONTENT', resolve => (
    (_id: string, content: string) => resolve({ _id, content })
));

export const setFinished = createActionCreator('[Project]SET_FINISHED', resolve => (
    (_id: string, isFinished: boolean) => resolve({ _id, isFinished })
));

export const setFocus = createActionCreator('[Project]SET_FOCUSED', resolve => (
    (_id: string, isFocused: boolean) => resolve({ _id, isFocused })
));

export const fetchAll = createActionCreator('[Project]FETCH_ALL', resolve => (
    (todoList: TodoItem[]) => resolve(todoList)
));


const update = promisify(dbs.projectDB.update.bind(dbs.projectDB));
export const actions = {
    setFocus,
    fetchAll: () => (dispatch: Dispatch) => {
        // @ts-ignore
        dbs.projectDB.find({}, { name: 1, todoList: 1 }, (err, items: ProjectItem[]) => {
            const defaultItem: Partial<TodoItem> = {
                isFocused: false
            };

            const newTodoList: TodoItem[] = flatten(items.map(item => {
                return Object.values(item.todoList);
            })).map((item: TodoItem) => {
                return { ...defaultItem, ...item };
            });

            return dispatch(fetchAll(newTodoList));
        });
    },
    removeItem: (project: string, _id: string) => (dispatch: Dispatch) => {
        dbs.projectDB.update(
            { [`todoList.${_id}`]: { $exists: true } },
            { $unset: { [`todoList.${_id}`]: true } },
            {returnUpdatedDocs: true},
            (err: Error, num, doc: ProjectItem) => {
                if (err) throw err;
                dispatch(removeItem(_id));
                dispatch(projectStateRemoveTodo(doc.name, _id));
            });
    },
    setFinished:
        (_id: string, isFinished: boolean) => (dispatch: Dispatch) => {
            dbs.projectDB.update(
                { [`todoList.${_id}`]: { $exists: true } },
                { $set: { [`todoList.${_id}.isFinished`]: isFinished } },
                {},
                (err) => {
                    if (err) {
                        throw err;
                    }

                    dispatch(setFinished(_id, isFinished));
                });
        },
    setTitle:
        (_id: string, title: string) => (dispatch: Dispatch) => {
            dbs.projectDB.update(
                { [`todoList.${_id}`]: { $exists: true } },
                { $set: { [`todoList.${_id}.title`]: title } },
                {},
                (err) => {
                    if (err) {
                        throw err;
                    }

                    dispatch(setTitle(_id, title));
                });
        },
    setProject:
        (_id: string, project: string) => async (dispatch: Dispatch) => {
            const doc = await new Promise(resolve => {
                dbs.projectDB.update(
                    { [`todoList.${_id}`]: { $exists: true } },
                    { $set: { [`todoList.${_id}.project`]: project } },
                    { returnUpdatedDocs: true },
                    (err, num, doc: ProjectItem) => {
                        resolve(doc.todoList[_id]);
                    }
                );
            });
            await update(
                { [`todoList.${_id}`]: { $exists: true } },
                { $unset: { [`todoList.${_id}`]: true } },
                {}
            );
            await update(
                { name: project },
                { $set: { [`todoList.${_id}`]: doc } },
                {}
            );
            dispatch(setProject(_id, project));
        },
    setContent:
        (_id: string, content: string) => async (dispatch: Dispatch) => {
            await update(
                { [`todoList.${_id}`]: { $exists: true } },
                { $set: { [`todoList.${_id}.content`]: content } },
                { returnUpdatedDocs: true }
            );

            dispatch(setContent(_id, content));
        },
    addItem:
        (title: string, project: string = 'Default', content?: string, expiryDate?: string) =>
            async (dispatch: Dispatch) => {
                const datetime = new Date().toString();
                const data = createTodoItem(title, undefined, project, content, expiryDate);
                await update(
                    { name: project },
                    { $set: { [`todoList.${data._id}`]: data } },
                    { upsert: true }
                );
                dispatch(addItem(data._id, title, datetime, project, content, expiryDate));
            }
};

export type ActionCreatorTypes = { [key in keyof typeof actions]: typeof actions[key] };


// ==================================
//
//            Reducer
//
// ==================================


function combinedHandler(
    state: TodoState,
    { payload }: any) {

    const newState: TodoState = cloneDeep(state);
    const { _id } = payload;
    delete payload._id;
    const findFunc = (item: TodoItem) => item._id === _id;
    const obj: undefined | TodoItem = find(newState.todoList, findFunc);
    if (!obj) {
        throw Error();
    }

    for (const param in payload) {
        if (param in obj) {
            // @ts-ignore
            obj[param] = payload[param];
        }
    }

    // Project update db
    return newState as TodoState;
}


export const todoReducer = createReducer<TodoState, any>(defaultState, handle => [
    handle(addItem, (state: TodoState, { payload: { _id, title, datetime, project, content, expiryDate } }) => {
        const newState = cloneDeep(state);
        const data = {
            _id,
            title,
            project,
            content,
            expiryDate,
            datetime,
            isFinished: false,
            isFocused: false
        };
        newState.todoList.push(data);
        return newState;
    }),

    handle(removeItem, (state: TodoState, { payload: { _id } }) => {
        // Project: rm in db;
        const index = state.todoList.findIndex((v) => v._id === _id);
        const newState = cloneDeep(state);
        newState.todoList.splice(index, 1);
        return newState;
    }),

    handle(setContent, combinedHandler),
    handle(setFinished, combinedHandler),
    handle(setProject, combinedHandler),
    handle(setTitle, combinedHandler),
    handle(setFocus, combinedHandler),

    handle(fetchAll, (state: TodoState, { payload }) => {
        return { ...state, todoList: payload };
    })
]);

