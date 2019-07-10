import {
    actions,
    addItem,
    removeItem,
    setContent,
    setFinished,
    setFocus,
    setProject,
    setTitle,
    TodoItem,
    todoReducer,
    TodoState
} from './action';
import dbs from '../../dbs';
import { cloneDeep } from 'lodash';
import { existsSync, unlink } from 'fs';
import { projectDBPath } from '../../../config';
import { promisify } from 'util';
import { ProjectItem } from '../Project/action';
import { addProjectToDB, executeThunkAction, generateRandomName } from '../../utils';

describe('TODO reducer', () => {
    it('starts with empty state', () => {
        const state = todoReducer(undefined, { type: '' });
        expect(state).toHaveProperty('todoList');
        expect(state.todoList).toEqual([]);
    });

    it('adds item on addItem action', () => {
        const now = new Date().toString();
        let state = todoReducer(undefined, addItem('0', '0', now));
        state = todoReducer(state, addItem('1', '1', now));
        state = todoReducer(state, addItem('2', '2', now));
        state = todoReducer(state, addItem('3', '3', now));
        state = todoReducer(state, addItem('4', '4', now));
        expect(state.todoList.length).toEqual(5);
        expect(state.todoList[0].title).toEqual('0');
        expect(state.todoList[4].title).toEqual('4');
    });

    it('wont change input state', () => {
        const input = cloneDeep(defaultState);
        todoReducer(defaultState, addItem('0', '0', ''));
        todoReducer(defaultState, removeItem('0'));
        todoReducer(defaultState, setTitle('0', '123'));
        expect(input).toEqual(defaultState);
    });

    it('setFocus', () => {
        const state: TodoState = todoReducer(defaultState, setFocus('0', true));
        expect(state.todoList[0].isFocused).toBeTruthy();
    });
});

describe('Combiner Handler', () => {
    it('can set title', () => {
        const state: TodoState = todoReducer(defaultState, setTitle('0', '123'));
        expect(state.todoList[0].title).toEqual('123');
    });

    it('can set finished', () => {
        const state: TodoState = todoReducer(defaultState, setFinished('0', true));
        expect(state.todoList[0].isFinished).toBeTruthy();
    });

    it('can set content', () => {
        const state: TodoState = todoReducer(defaultState, setContent('1', 'new content'));
        expect(state.todoList[1].content).toEqual('new content');
    });

    it('can set project', () => {
        const state: TodoState = todoReducer(defaultState, setProject('2', 'new project'));
        expect(state.todoList[2].project).toEqual('new project');
    });
});

describe('TODO thunk action creator', () => {
    beforeEach(async () => {
        if (existsSync(projectDBPath)) {
            await promisify(unlink)(projectDBPath);
        }
    });

    it('can dispatch correctly', async () => {
        const thunkFunc = actions.addItem('111');
        let dispatch;
        await new Promise(resolve => {
            dispatch = jest.fn(x => {
                resolve();
                return x;
            });
            thunkFunc(dispatch);
        });

        // @ts-ignore
        const x = dispatch.mock.calls[0][0];
        expect(x).toHaveProperty('payload');
        expect(x).toHaveProperty('type');
        expect(x.payload).toHaveProperty('_id');
        expect(x.payload).toHaveProperty('title');
        expect(x.payload.title).toEqual('111');
    });

    it('can dispatch removeItem', async () => {
        const projectName = generateRandomName();
        const todoTitle = generateRandomName();
        await addProjectToDB(projectName);
        await executeThunkAction(actions.addItem(todoTitle, projectName));
        const projectItem: ProjectItem = await new Promise(resolve => {
            dbs.projectDB.findOne({ name: projectName }, (err, item) =>
                resolve(item as ProjectItem)
            );
        });
        const _id = Object.keys(projectItem.todoList)[0];
        const thunkFunc = actions.removeItem(projectName, _id);
        let dispatch;
        await new Promise(resolve => {
            dispatch = jest.fn(x => {
                resolve();
                return x;
            });

            thunkFunc(dispatch);
        });

        // @ts-ignore
        const x = dispatch.mock.calls[0][0];
        expect(x.type).toEqual('[TODO]REMOVE_ITEM');
        expect(x.payload._id).toEqual(_id);
        let state = cloneDeep(defaultState);
        state.todoList[0]._id = _id;
        state = todoReducer(state, x);
        expect(state.todoList.length).toEqual(2);
        expect(state.todoList[0]._id).not.toEqual(_id);
        expect(state.todoList[1]._id).not.toEqual(_id);
    });

    it('can add & remove db item', async () => {
        const title = 'can add & remove db item';
        const addFunc = actions.addItem(title, title);
        await new Promise(resolve => {
            addFunc(x => {
                resolve();
                return x;
            });
        });
        const _id: string = await new Promise((resolve, reject) => {
            dbs.projectDB.findOne({ name: title }, (err, item: ProjectItem) => {
                if (err) {
                    reject(err);
                }
                expect(item).toBeTruthy();
                const _id = Object.keys(item.todoList)[0];
                resolve(_id);
            });
        });

        const rmFunc = actions.removeItem(title, _id);
        await new Promise(resolve => {
            rmFunc(x => {
                resolve();
                return x;
            });
        });

        await new Promise((resolve, reject) => {
            dbs.projectDB.findOne({ name: title }, (err, item: ProjectItem) => {
                if (err) reject(err);
                expect(item.todoList).not.toHaveProperty(title);
                resolve();
            });
        });
    });

    it('can fetch all from db', async done => {
        const title = 'can fetch all from db';
        for (let i = 0; i < 5; i += 1) {
            const addFunc = actions.addItem(title + i.toString());
            await new Promise(resolve => {
                addFunc(x => {
                    resolve();
                    return x;
                });
            });
        }

        const fetchAllFunc = actions.fetchAll();
        const dispatch = jest.fn(({ payload }) => {
            const filteredX = payload.filter((v: TodoItem) => v.title.startsWith(title));
            expect(filteredX.length).toBe(5);
            done();
            return payload;
        });

        fetchAllFunc(dispatch);
    });

    it("'s setProject works", async () => {
        const title = generateRandomName();
        const project = generateRandomName();
        const newProject = generateRandomName();
        await addProjectToDB(newProject);
        await addProjectToDB(project);
        await executeThunkAction(actions.addItem(title, project));
        let projectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name: project
        })) as ProjectItem;
        const _id = Object.keys(projectItem.todoList)[0];
        await executeThunkAction(actions.setProject(_id, newProject));
        projectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name: project
        })) as ProjectItem;
        expect(Object.keys(projectItem.todoList).length).toEqual(0);
        const newProjectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name: newProject
        })) as ProjectItem;
        expect(Object.keys(newProjectItem.todoList).length).toEqual(1);
        expect(Object.keys(newProjectItem.todoList)[0]).toEqual(_id);
        expect(newProjectItem.todoList[_id].title).toEqual(title);
    });

    it("'s setFinished works", async () => {
        // TODO:
    });

    it("'s setTitle works", async () => {
        // TODO:
    });

    it("'s setContent works", async () => {
        const content = generateRandomName();
        const title = generateRandomName();
        const project = generateRandomName();
        await addProjectToDB(project);
        await executeThunkAction(actions.addItem(title, project));
        let projectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name: project
        })) as ProjectItem;
        const _id = Object.keys(projectItem.todoList)[0];

        await executeThunkAction(actions.setContent(_id, content));
        projectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name: project
        })) as ProjectItem;
        expect(Object.values(projectItem.todoList)[0].content).toEqual(content);
    });
});

const defaultState: TodoState = {
    todoList: [
        {
            _id: '0',
            title: '0',
            project: '0',
            content: '0',
            expiryDate: 'Sun Jul 07 2019 18:23:07 GMT+0800 (中国标准时间)',
            datetime: 'Sun Jul 07 2019 18:23:07 GMT+0800 (中国标准时间)',
            isFinished: false,
            isFocused: false
        },
        {
            _id: '1',
            title: '1',
            project: '1',
            content: '1',
            expiryDate: 'Sun Jul 07 2019 18:23:07 GMT+0800 (中国标准时间)',
            datetime: 'Sun Jul 07 2019 18:23:07 GMT+0800 (中国标准时间)',
            isFinished: false,
            isFocused: false
        },
        {
            _id: '2',
            title: '2',
            project: '2',
            content: '2',
            expiryDate: 'Sun Jul 07 2019 18:23:07 GMT+0800 (中国标准时间)',
            datetime: 'Sun Jul 07 2019 18:23:07 GMT+0800 (中国标准时间)',
            isFinished: false,
            isFocused: true
        }
    ]
};
