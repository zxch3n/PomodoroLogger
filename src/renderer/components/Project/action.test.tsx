import {
    actions,
    addItem,
    addTodoItem,
    fetchAll,
    ProjectItem,
    projectReducer,
    ProjectState,
    removeItem,
    setName,
    addAppSpentTime
} from './action';
import dbs from '../../dbs';
import { createTodoItem } from '../TODO/action';
import { addProjectToDB, generateRandomName } from '../../utils';
import { existsSync, mkdir, unlink } from 'fs';
import { dbBaseDir, projectDBPath } from '../../../config';
import { promisify } from 'util';

beforeEach(async () => {
    if (existsSync(projectDBPath)) {
        await promisify(unlink)(projectDBPath);
    }

    if (!existsSync(dbBaseDir)) {
        await promisify(mkdir)(dbBaseDir);
    }
});

describe('Project reducer', () => {
    it('has a default state', () => {
        const state = projectReducer(undefined, { type: '' });
        expect(state).toHaveProperty('projectList');
    });

    it("'s addItem works", () => {
        const state: ProjectState = projectReducer(undefined, addItem('me', 'myProject'));
        expect(state.projectList).toHaveProperty('myProject');
        expect(state.projectList.myProject.name).toBe('myProject');
    });

    it("'s removeItem works", () => {
        let state: ProjectState = projectReducer(undefined, addItem('me', 'myProject'));
        expect(state.projectList).toHaveProperty('myProject');
        expect(state.projectList.myProject.name).toBe('myProject');
        state = projectReducer(state, removeItem('myProject'));
        expect(state.projectList).not.toHaveProperty('myProject');
    });

    it("'s addTodoItem works", () => {
        const state: ProjectState = projectReducer(
            defaultProjectState,
            addTodoItem('project0', createTodoItem('do homework'))
        );
        expect(Object.keys(state.projectList.project0.todoList).length).toBe(1);
        expect(Object.values(state.projectList.project0.todoList)[0].title).toBe('do homework');
    });

    it("'s setName works", () => {
        const state: ProjectState = projectReducer(
            defaultProjectState,
            setName('project0', 'newProject')
        );

        expect(state.projectList).not.toHaveProperty('project0');
        expect(state.projectList).toHaveProperty('newProject');
    });

    it("'s addAppSpentTime works", () => {
        const state: ProjectState = projectReducer(
            defaultProjectState,
            addAppSpentTime('project1', 'Chrome', 100)
        );

        expect(state.projectList.project1.applicationSpentTime.Chrome.spentHours).toBe(130);
    });

    it("'s fetchAll works", () => {
        const newProjectMap: ProjectItem[] = [
            {
                _id: 'projectElu0',
                name: 'projectElu0',
                todoList: {},
                spentHours: 0,
                applicationSpentTime: {}
            },
            {
                _id: 'projectElu1',
                name: 'projectElu1',
                todoList: {},
                spentHours: 1,
                applicationSpentTime: {}
            },
            {
                _id: 'projectElu2',
                name: 'projectElu2',
                todoList: {},
                spentHours: 2,
                applicationSpentTime: {}
            }
        ];
        const state: ProjectState = projectReducer(defaultProjectState, fetchAll(newProjectMap));

        for (let i = 0; i < 3; i += 1) {
            const name = `projectElu${i}`;
            expect(state.projectList).toHaveProperty(name);
            expect(state.projectList[name].spentHours).toBe(i);
        }
    });
});

describe('Project thunk actionCreator', () => {
    it('can fetchAll', async () => {
        const nameList: string[] = [];
        for (let i = 0; i < 3; i += 1) {
            const name = generateRandomName();
            nameList.push(name);
            await addProjectToDB(name);
        }

        const thunk = actions.fetchAll();
        await new Promise(resolve => {
            const dispatch = jest.fn(({ payload: x }: { payload: ProjectItem[] }) => {
                expect(x.length).toBeGreaterThan(2);
                const filteredX = x.filter(item => nameList.includes(item.name));
                expect(filteredX.length).toEqual(3);
                expect(filteredX.length).toEqual(3);
                resolve();
                return x;
            });

            // @ts-ignore
            thunk(dispatch);
        });
    });

    it('can removeItem', async () => {
        const name = generateRandomName();
        await addProjectToDB(name);
        const thunk = actions.removeItem(name);
        await new Promise(resolve => {
            const dispatch = jest.fn(x => {
                expect(x.payload.name).toEqual(name);
                resolve();
                return x;
            });

            thunk(dispatch);
        });

        const item: ProjectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name
        })) as ProjectItem;
        expect(item).toBeNull();
    });

    it('can setTodoProject name', async () => {
        const name = generateRandomName();
        await addProjectToDB(name);
        const newName = generateRandomName();
        const thunk = actions.setName(name, newName);
        await new Promise(resolve => {
            const dispatch = jest.fn(x => {
                expect(x.payload).toHaveProperty('name');
                expect(x.payload).toHaveProperty('newName');
                expect(x.payload.name).toBe(name);
                expect(x.payload.newName).toBe(newName);
                resolve();
                return x;
            });

            thunk(dispatch);
        });

        // @ts-ignore
        const newNameCount = await promisify(dbs.projectDB.count.bind(dbs.projectDB))({
            name: newName
        });
        expect(newNameCount).toEqual(1);
        // @ts-ignore
        const oldNameCount = await promisify(dbs.projectDB.count.bind(dbs.projectDB))({ name });
        expect(oldNameCount).toEqual(0);
    });

    it('can addItem to DB', async () => {
        const name = generateRandomName();
        const thunk = actions.addItem(name);
        await new Promise(resolve => {
            const dispatch = jest.fn(x => {
                expect(x.payload).toHaveProperty('name');
                expect(x.payload.name).toBe(name);
                resolve();
                return x;
            });
            thunk(dispatch);
        });

        const item: ProjectItem = await new Promise((resolve, reject) => {
            dbs.projectDB.findOne({ name }, (err, item: ProjectItem) => {
                if (err) reject(err);
                resolve(item as ProjectItem);
            });
        });

        expect(item.name).toBe(name);
        expect(item.spentHours).toBe(0);
        expect(item.applicationSpentTime).toStrictEqual({});
        expect(item.todoList).toStrictEqual({});
    });

    it('can addTodoItem', async () => {
        const name = generateRandomName();
        await addProjectToDB(name);
        const todoTitle = generateRandomName();
        const thunk = actions.addTodoItem(name, todoTitle);
        let _id = '';
        await new Promise(resolve => {
            const dispatch = jest.fn(x => {
                expect(x.payload.name).toEqual(name);
                expect(x.payload.todoItem.title).toEqual(todoTitle);
                _id = x.payload.todoItem._id;
                resolve();
                return x;
            });

            thunk(dispatch);
        });

        const item: ProjectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name
        })) as ProjectItem;
        expect(Object.keys(item.todoList).length).toEqual(1);
        expect(Object.values(item.todoList)[0].title).toEqual(todoTitle);
        expect(item.todoList).toHaveProperty(_id);
        expect(item.todoList[_id].title).toEqual(todoTitle);
    });

    it('can removeTodoItem', async () => {
        const name = generateRandomName();
        await addProjectToDB(name);
        const todoTitle = generateRandomName();
        const createThunk = actions.addTodoItem(name, todoTitle);
        let _id = '';
        await new Promise(resolve => {
            createThunk(x => {
                _id = x.payload.todoItem._id;
                resolve();
                return x;
            });
        });

        const thunk = actions.removeTodoItem(name, _id);
        await new Promise(resolve => {
            const dispatch = jest.fn(x => {
                expect(x.payload.name).toEqual(name);
                expect(x.payload._id).toEqual(_id);
                resolve();
                return x;
            });

            thunk(dispatch);
        });

        const findOne = dbs.projectDB.findOne.bind(dbs.projectDB);
        const item: ProjectItem = (await promisify(findOne)({ name })) as ProjectItem;
        expect(item.todoList).not.toHaveProperty(_id);
    });

    it('can addAppSpentTime', async () => {
        const name = generateRandomName();
        await addProjectToDB(name);
        const thunk = actions.addAppSpentTime(name, 'Chrome', 100);
        await new Promise(resolve => {
            const dispatch = jest.fn(x => {
                expect(x.payload.name).toEqual(name);
                expect(x.payload.appName).toEqual('Chrome');
                expect(x.payload.spentHours).toEqual(100);
                resolve();
                return x;
            });

            thunk(dispatch);
        });

        const item: ProjectItem = (await promisify(dbs.projectDB.findOne.bind(dbs.projectDB))({
            name
        })) as ProjectItem;
        expect(item.applicationSpentTime).toHaveProperty('Chrome');
        expect(item.applicationSpentTime.Chrome.spentHours).toEqual(100);
    });
});

const defaultProjectState: ProjectState = {
    projectList: {
        project0: {
            _id: 'project0',
            name: 'project0',
            todoList: {},
            spentHours: 30,
            applicationSpentTime: {
                Chrome: {
                    title: 'Chrome',
                    spentHours: 30,
                    subAppSpentTime: [],
                    keywords: ['Browser']
                }
            }
        },

        project1: {
            _id: 'project1',
            name: 'project1',
            todoList: {
                'Learn deep learning': createTodoItem('Learn deep learning')
            },
            spentHours: 10,
            applicationSpentTime: {
                Chrome: {
                    title: 'Chrome',
                    spentHours: 30,
                    subAppSpentTime: [],
                    keywords: ['Browser']
                }
            }
        }
    }
};
