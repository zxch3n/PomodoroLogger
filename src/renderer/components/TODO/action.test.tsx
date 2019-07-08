import {
    TodoState, setFocus, todoReducer, setTitle,
    setFinished, setContent, removeItem, TodoItem,
    addItem, setProject, actions
} from './action';
import {cloneDeep} from 'lodash';
import {existsSync, unlink} from 'fs';
import {todoDBPath} from '../../../config';
import {promisify} from 'util';
import dbs from '../../dbs';


beforeAll(async ()=>{
    if (existsSync(todoDBPath)) {
        await promisify(unlink)(todoDBPath);
    }
});

describe("TODO reducer", ()=>{
    it ('starts with empty state', ()=>{
        const state = todoReducer(undefined, {type: ''});
        expect(state).toHaveProperty('todoList');
        expect(state.todoList).toEqual([]);
    });

    it ('adds item on addItem action', ()=>{
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

    it ('wont change input state', ()=>{
        const input = cloneDeep(defaultState);
        todoReducer(defaultState, addItem('0', '0', ''));
        todoReducer(defaultState, removeItem('0'));
        todoReducer(defaultState, setTitle('0', '123'));
        expect(input).toEqual(defaultState);
    });

    it ('setFocus', ()=>{
        const state: TodoState = todoReducer(defaultState, setFocus('0', true));
        expect(state.todoList[0].isFocused).toBeTruthy();
    });
});


describe("Combiner Handler", ()=>{
    it ('can set title', ()=>{
        const state: TodoState = todoReducer(defaultState, setTitle('0', '123'));
        expect(state.todoList[0].title).toEqual('123');
    });

    it ('can set finished', ()=>{
        const state: TodoState = todoReducer(defaultState, setFinished('0', true));
        expect(state.todoList[0].isFinished).toBeTruthy();
    });

    it ('can set content', ()=>{
        const state: TodoState = todoReducer(defaultState, setContent('1', 'new content') );
        expect(state.todoList[1].content).toEqual('new content');
    });

    it ('can set project', ()=>{
        const state: TodoState = todoReducer(defaultState, setProject('2', 'new project'));
        expect(state.todoList[2].project).toEqual('new project');
    })
});


describe("Thunk actions", ()=>{
    it ('can dispatch correctly', done=>{
        const thunkFunc = actions.addItem('111');
        const dispatch = jest.fn(x=>{
            expect(x).toHaveProperty('payload');
            expect(x).toHaveProperty('type');
            expect(x.payload).toHaveProperty('_id');
            expect(x.payload).toHaveProperty('title');
            expect(x.payload.title).toEqual('111');
            done();
            return x;
        });
        thunkFunc(dispatch);
    });

    it ('can remove item', done=>{
        const thunkFunc = actions.removeItem('0');
        const dispatch = jest.fn(x=>{
            expect(x.type).toEqual('[Project]REMOVE_ITEM');
            expect(x.payload._id).toEqual('0');
            const state = todoReducer(defaultState, x);
            expect(state.todoList.length).toEqual(2);
            expect(state.todoList[0]._id).not.toEqual(0);
            expect(state.todoList[1]._id).not.toEqual(0);
            done();
            return x;
        });

        thunkFunc(dispatch);
    });

    it ('can add & remove db item', async ()=>{
        const title = 'can add & remove db item';
        const addFunc = actions.addItem(title);
        await new Promise(resolve=>{
            addFunc((x)=>{resolve(); return x;});
        });
        const _id: string = await new Promise((resolve, reject) => {
            dbs.todoDB.findOne({title}, (err, item: TodoItem)=>{
                if (err) {reject(err);}
                expect(item).toBeTruthy();
                const _id = item._id;
                resolve(_id);
            });
        });

        const rmFunc = actions.removeItem(_id);
        await new Promise(resolve=>{
            rmFunc(x=>{resolve(); return x;});
        });

        await new Promise((resolve, reject)=>{
            dbs.todoDB.findOne({title}, (err, item?: TodoItem)=>{
                if (err) reject(err);
                expect(item).toBeFalsy();
                resolve();
            });
        });
    });

    it ('can fetch all from db', async done=>{
        const title = 'can fetch all from db';
        for (let i = 0; i < 5; i += 1){
            const addFunc = actions.addItem(title + i.toString());
            await new Promise(resolve=>{
                addFunc((x)=>{resolve(); return x;});
            });
        }

        const fetchAllFunc = actions.fetchAll();
        const dispatch = jest.fn(({payload}) => {
            const filteredX = payload.filter((v: TodoItem)=>v.title.startsWith(title));
            expect(filteredX.length).toBe(5);
            done();
            return payload;
        });

        fetchAllFunc(dispatch);
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
        },
    ],
};

