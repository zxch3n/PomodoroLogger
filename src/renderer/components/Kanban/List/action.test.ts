import { actions, List, listReducer, ListsState } from './action';
import shortid from 'shortid';
import { AsyncDB } from '../../../../utils/dbHelper';
import dbs from '../../../dbs';
import { generateRandomName } from '../../../utils';
import { existsSync, mkdir, unlink } from 'fs';
import { dbBaseDir, dbPaths } from '../../../../config';
import { promisify } from 'util';
import { Dispatch } from 'redux';

jest.setTimeout(10000);
beforeEach(async () => {
    if (existsSync(dbPaths.listsDBPath)) {
        await promisify(unlink)(dbPaths.listsDBPath).catch(() => {});
    }

    if (!existsSync(dbBaseDir)) {
        await promisify(mkdir)(dbBaseDir).catch(() => {});
    }
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
    it('move item 0', async () => {
        let state: ListsState = {};

        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            console.log('before', state);
            try {
                state = listReducer(state, action);
            } catch (e) {
                console.warn(e);
            }
            console.log(action);
            console.log('after', state);
        };

        const [_id0, _id1] = await moveCardSetup(dispatch);
        await actions.moveCard(_id0, _id0, 0, 2)(dispatch);
        expect(state[_id0].cards).toStrictEqual(['1', '2', '0']);
        expect(state[_id1].cards).toStrictEqual(['10', '11', '12']);
    });

    it('move item 1', async () => {
        let state: ListsState = {};

        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            console.log('before', state);
            try {
                state = listReducer(state, action);
            } catch (e) {
                console.warn(e);
            }
            console.log(action);
            console.log('after', state);
        };

        const [_id0, _id1] = await moveCardSetup(dispatch);
        await actions.moveCard(_id0, _id1, 0, 2)(dispatch);
        expect(state[_id0].cards).toStrictEqual(['1', '2']);
        expect(state[_id1].cards).toStrictEqual(['10', '11', '0', '12']);
    });
});
