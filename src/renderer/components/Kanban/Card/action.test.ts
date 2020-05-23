import { actions, cardReducer, CardsState } from './action';
import { existsSync, mkdir, unlink } from 'fs';
import { promisify } from 'util';
import { dbBaseDir, dbPaths } from '../../../../config';
import shortid from 'shortid';
import { AsyncDB } from '../../../../utils/dbHelper';
import dbs, { refreshDbs } from '../../../dbs';
import { Dispatch } from 'redux';
import { boardReducer } from '../Board/action';
import { Card } from '../type';

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
        expectExcept(
            dispatch.mock.calls[0][0].payload,
            {
                _id,
                title: 'abc',
                content: '',
            },
            ['createdTime']
        );

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
                _id,
            },
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
                title: 'newName',
            },
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
                spentTime: 0.33,
            },
        });

        const card: Card = await db.findOne({ _id });
        expect(card).not.toBeFalsy();
        expect(card.sessionIds).toStrictEqual(['session', 'session1', 'session2']);
        expect(card.spentTimeInHour.actual).toBeCloseTo(0.99);
        expect(card.spentTimeInHour.estimated).toBe(0);
    });

    function expectExcept(actual: any, expected: any, except: string[]) {
        for (const param of except) {
            expected[param] = undefined;
            actual[param] = undefined;
        }

        expect(actual).toEqual(expected);
    }

    it('fetch cards from local db', async () => {
        const _d = jest.fn();
        const dispatch = jest.fn();
        await actions.addCard('a', 'a', 'abc', '')(_d);
        await actions.addCard('b', 'b', 'abc', '')(_d);
        await actions.addCard('c', 'c', 'abc', '')(_d);
        await actions.fetchCards()(dispatch);
        expect(dispatch.mock.calls[0][0].type).toBe('[Card]SET_CARDS');
        expectExcept(
            dispatch.mock.calls[0][0].payload.a,
            {
                _id: 'a',
                title: 'abc',
                content: '',
                sessionIds: [],
                spentTimeInHour: {
                    estimated: 0,
                    actual: 0,
                },
            },
            ['createdTime']
        );
        expectExcept(
            dispatch.mock.calls[0][0].payload.b,
            {
                _id: 'b',
                title: 'abc',
                content: '',
                sessionIds: [],
                spentTimeInHour: {
                    estimated: 0,
                    actual: 0,
                },
            },
            ['createdTime']
        );
        expectExcept(
            dispatch.mock.calls[0][0].payload.c,
            {
                _id: 'c',
                title: 'abc',
                content: '',
                sessionIds: [],
                spentTimeInHour: {
                    estimated: 0,
                    actual: 0,
                },
            },
            ['createdTime']
        );
    });

    it('should update', async () => {
        const _id = shortid.generate();
        let state: CardsState = {};
        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            try {
                state = cardReducer(state, action);
            } catch (e) {}
        };

        await actions.addCard(_id, 'list', '0')(dispatch);
        expect(state[_id].title).toBe('0');
        await actions.setActualTime(_id, 101)(dispatch);
        await actions.setEstimatedTime(_id, 110)(dispatch);
        await actions.setContent(_id, '8888')(dispatch);
        await actions.renameCard(_id, 'title')(dispatch);
        expect(state[_id].title).toBe('title');
        expect(state[_id].content).toBe('8888');
        expect(state[_id].spentTimeInHour.actual).toBe(101);
        expect(state[_id].spentTimeInHour.estimated).toBe(110);
        await actions.addActualTime(_id, 90)(dispatch);
        expect(state[_id].spentTimeInHour.actual).toBe(191);
        await actions.deleteCard(_id, 'list')(dispatch);
        expect(state[_id]).toBeUndefined();
    });
});
