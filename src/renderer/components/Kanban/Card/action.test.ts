import { actions } from './action';
import { existsSync, mkdir, unlink } from 'fs';
import { promisify } from 'util';
import { dbBaseDir, dbPaths } from '../../../../config';
import shortid from 'shortid';
import { AsyncDB } from '../../../../utils/dbHelper';
import dbs from '../../../dbs';

const db = new AsyncDB(dbs.cardsDB);
beforeEach(async () => {
    if (existsSync(dbPaths.cardsDB)) {
        await promisify(unlink)(dbPaths.cardsDB).catch(() => {});
    }

    if (!existsSync(dbBaseDir)) {
        await promisify(mkdir)(dbBaseDir).catch(() => {});
    }
});

describe("Cards' actions", () => {
    it('add card', async () => {
        const _id = shortid.generate();
        const dispatch = jest.fn();
        await actions.addCard(_id, 'abc')(dispatch);
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
        await actions.addCard(_id, 'abc')(dispatch);
        await actions.deleteCard(_id)(dispatch);
        expect(dispatch.mock.calls[1][0]).toStrictEqual({
            type: '[Card]DELETE_CARD',
            payload: {
                _id
            }
        });

        const card = await db.findOne({ _id });
        expect(card).toBeFalsy();
    });
});
