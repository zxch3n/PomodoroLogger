import { actions, List, listReducer, ListsState } from './action';
import shortid from 'shortid';
import { AsyncDB } from '../../../../utils/dbHelper';
import dbs, { refreshDbs } from '../../../dbs';
import { generateRandomName } from '../../../utils';
import { existsSync, mkdir, unlink, stat } from 'fs';
import { dbBaseDir, dbPaths } from '../../../../config';
import { promisify } from 'util';
import { Dispatch } from 'redux';

jest.setTimeout(10000);
let lock = false;
beforeEach(async () => {
    while (lock) {
        await new Promise(r => setTimeout(r, Math.random() * 1000));
    }

    lock = true;
    if (existsSync(dbPaths.listsDB)) {
        await promisify(unlink)(dbPaths.listsDB).catch(() => {});
    }

    if (!existsSync(dbBaseDir)) {
        await promisify(mkdir)(dbBaseDir).catch(() => {});
    }

    await refreshDbs();
});

afterEach(() => {
    lock = false;
});

const db = new AsyncDB(dbs.listsDB);
async function addList(_id: string, dispatch = jest.fn()) {
    await actions.addList(_id, _id)(dispatch);
    return dispatch;
}

async function addCard(_id: string, cardId: string, dispatch = jest.fn()) {
    await actions.addCardById(_id, cardId)(dispatch);
    return dispatch;
}

async function moveCardSetup(dispatch: any = undefined) {
    const _id0 = shortid.generate();
    const _id1 = shortid.generate();
    await addList(_id0, dispatch);
    await addList(_id1, dispatch);
    await addCard(_id0, '0', dispatch);
    await addCard(_id0, '1', dispatch);
    await addCard(_id0, '2', dispatch);

    await addCard(_id1, '10', dispatch);
    await addCard(_id1, '11', dispatch);
    await addCard(_id1, '12', dispatch);
    return [_id0, _id1];
}

describe('listActions', () => {
    it('add list', async () => {
        const _id = shortid.generate();
        const dis = await addList(_id);
        expect(dis.mock.calls[0][0]).toStrictEqual({
            type: '[List]ADD',
            payload: {
                _id,
                title: _id
            }
        });

        const docs: List[] = await db.find({}, {});
        expect(docs[0]._id).toBe(_id);
    });

    it('add card', async () => {
        const _id = generateRandomName();
        await addList(_id);
        const dispatch = await addCard(_id, 'cardId');
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[List]ADD_CARD',
            payload: {
                _id,
                cardId: 'cardId'
            }
        });

        const doc: List = await db.findOne({ _id });
        expect(doc.cards).toStrictEqual(['cardId']);
    });

    it('moveCard 0', async () => {
        const dispatch = jest.fn();
        const [_id0, _id1] = await moveCardSetup();
        await actions.moveCard(_id0, _id1, 0, 2)(dispatch);
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[List]MOVE_CARD',
            payload: {
                fromListId: _id0,
                toListId: _id1,
                fromIndex: 0,
                toIndex: 2
            }
        });

        const doc0: List = await db.findOne({ _id: _id0 });
        expect(doc0.cards).toStrictEqual(['1', '2']);
        const doc1: List = await db.findOne({ _id: _id1 });
        expect(doc1.cards).toStrictEqual(['10', '11', '0', '12']);
    });

    it('moveCard 1', async () => {
        const dispatch = jest.fn();
        const [_id0, _id1] = await moveCardSetup();
        await actions.moveCard(_id0, _id1, 0, 0)(dispatch);
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[List]MOVE_CARD',
            payload: {
                fromListId: _id0,
                toListId: _id1,
                fromIndex: 0,
                toIndex: 0
            }
        });

        const doc0: List = await db.findOne({ _id: _id0 });
        expect(doc0.cards).toStrictEqual(['1', '2']);
        const doc1: List = await db.findOne({ _id: _id1 });
        expect(doc1.cards).toStrictEqual(['0', '10', '11', '12']);
    });

    it('moveCard 2', async () => {
        const dispatch = jest.fn();
        const [_id0, _id1] = await moveCardSetup();
        await actions.moveCard(_id0, _id0, 0, 2)(dispatch);
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[List]MOVE_CARD',
            payload: {
                fromListId: _id0,
                toListId: _id0,
                fromIndex: 0,
                toIndex: 2
            }
        });

        const doc0: List = await db.findOne({ _id: _id0 });
        expect(doc0.cards).toStrictEqual(['1', '2', '0']);
        const doc1: List = await db.findOne({ _id: _id1 });
        expect(doc1.cards).toStrictEqual(['10', '11', '12']);
    });
});

describe('listReducer', () => {
    it('should move item', async () => {
        let state: ListsState = {};

        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            try {
                state = listReducer(state, action);
            } catch (e) {}
        };

        const [_id0, _id1] = await moveCardSetup(dispatch);
        await actions.moveCard(_id0, _id0, 0, 2)(dispatch);
        expect(state[_id0].cards).toStrictEqual(['1', '2', '0']);
        expect(state[_id1].cards).toStrictEqual(['10', '11', '12']);

        // test delete card
        const cardId = state[_id1].cards[0];
        await actions.deleteCard(_id1, cardId)(dispatch);
        expect(state[_id1].cards.every(v => v !== cardId)).toBeTruthy();

        // test delete list
        await actions.deleteList(_id0)(dispatch);
        expect(state[_id0]).toBeUndefined();

        // TODO
        // // test fetch & save
        // const oldState = Object.assign(state, {});
        // state = {};
        // await actions.fetchLists()(dispatch);
        // expect(state).toStrictEqual(oldState);
    });

    it('should update', async done => {
        let state: ListsState = {};

        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            if (action.type.startsWith('[Card]')) {
                if (action.payload.title === 'newcardid') {
                    done();
                    return;
                }
            }

            try {
                state = listReducer(state, action);
            } catch (e) {}
        };

        const [_id0, _id1] = await moveCardSetup(dispatch);
        await actions.moveCard(_id0, _id1, 0, 2)(dispatch);
        expect(state[_id0].cards).toStrictEqual(['1', '2']);
        expect(state[_id1].cards).toStrictEqual(['10', '11', '0', '12']);

        await actions.renameList(_id0, 'id011')(dispatch);
        expect(state[_id0].title).toBe('id011');
        await actions.addCard(_id0, 'newcardid')(dispatch);
    });
});
