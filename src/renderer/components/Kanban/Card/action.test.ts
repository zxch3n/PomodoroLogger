import { actions, Card } from './action';
import { existsSync, mkdir, unlink } from 'fs';
import { promisify } from 'util';
import { dbBaseDir, dbPaths } from '../../../../config';
import shortid from 'shortid';
import { AsyncDB } from '../../../../utils/dbHelper';
import dbs, { refreshDbs } from '../../../dbs';

const db = new AsyncDB(dbs.cardsDB);

describe("Cards' actions", () => {
    beforeEach(async () => {
        if (existsSync(dbPaths.cardsDB)) {
            await promisify(unlink)(dbPaths.cardsDB).catch(() => {});
        }

        if (!existsSync(dbBaseDir)) {
            await promisify(mkdir)(dbBaseDir).catch(() => {});
        }

        refreshDbs();
    });

    it('add card', async () => {
        const _id = shortid.generate();
        const dispatch = jest.fn();
        await actions.addCard(_id, '', 'abc')(dispatch);
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[Card]ADD',
            payload: {
                _id,
                title: 'abc',
                content: ''
            }
        });

        const card = await db.findOne({ _id });
        expect(card).not.toBeFalsy();
        expect(card.title).toBe('abc');
    });

    it('remove card', async () => {
        const _id = shortid.generate();
        const dispatch = jest.fn();
        await actions.addCard(_id, '', 'abc', '')(dispatch);
        await actions.deleteCard(_id, '')(dispatch);
        expect(dispatch.mock.calls[3][0]).toStrictEqual({
            type: '[Card]DELETE_CARD',
            payload: {
                _id
            }
        });

        const card = await db.findOne({ _id });
        expect(card).toBeFalsy();
    });

    it('rename card', async () => {
        const _id = shortid.generate();
        const _d = jest.fn();
        const dispatch = jest.fn();
        await actions.addCard(_id, '', 'abc', '')(_d);
        await actions.renameCard(_id, 'newName')(dispatch);
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[Card]RENAME',
            payload: {
                _id,
                title: 'newName'
            }
        });

        const card = await db.findOne({ _id });
        expect(card).not.toBeFalsy();
        expect(card.title).toBe('newName');
    });

    it('updates on timer finished', async () => {
        const _id = shortid.generate();
        const _d = jest.fn();
        const dispatch = jest.fn();
        await actions.addCard(_id, '', 'abc', '')(_d);
        await actions.onTimerFinished(_id, 'session', 0.33)(dispatch);
        await actions.onTimerFinished(_id, 'session1', 0.33)(dispatch);
        await actions.onTimerFinished(_id, 'session2', 0.33)(dispatch);
        expect(dispatch.mock.calls[0][0]).toStrictEqual({
            type: '[Card]ADD_SESSION',
            payload: {
                _id,
                sessionId: 'session',
                spentTime: 0.33
            }
        });

        const card: Card = await db.findOne({ _id });
        expect(card).not.toBeFalsy();
        expect(card.sessionIds).toStrictEqual(['session', 'session1', 'session2']);
        expect(card.spentTimeInHour.actual).toBeCloseTo(0.99);
        expect(card.spentTimeInHour.estimated).toBe(0);
    });

    it('fetch cards from local db', async () => {
        const _d = jest.fn();
        const dispatch = jest.fn();
        await actions.addCard('a', 'a', 'abc', '')(_d);
        await actions.addCard('b', 'b', 'abc', '')(_d);
        await actions.addCard('c', 'c', 'abc', '')(_d);
        await actions.fetchCards()(dispatch);
        expect(dispatch.mock.calls[0][0].type).toBe('[Card]SET_CARDS');
        expect(dispatch.mock.calls[0][0].payload.a).toEqual({
            _id: 'a',
            title: 'abc',
            content: '',
            sessionIds: [],
            spentTimeInHour: {
                estimated: 0,
                actual: 0
            }
        });
        expect(dispatch.mock.calls[0][0].payload.b).toEqual({
            _id: 'b',
            title: 'abc',
            content: '',
            sessionIds: [],
            spentTimeInHour: {
                estimated: 0,
                actual: 0
            }
        });
        expect(dispatch.mock.calls[0][0].payload.c).toEqual({
            _id: 'c',
            title: 'abc',
            content: '',
            sessionIds: [],
            spentTimeInHour: {
                estimated: 0,
                actual: 0
            }
        });
    });
});
