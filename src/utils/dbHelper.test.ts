import { AsyncDB } from './dbHelper';
import { dbBaseDir } from '../config';
import * as path from 'path';
import { generateRandomName } from '../renderer/utils';
import { loadDB } from '../renderer/monitor/sessionManager';

describe('AsyncDB', () => {
    it('should update, insert, find, findOne', async () => {
        const db = new AsyncDB(await loadDB(path.join(dbBaseDir, generateRandomName())));
        expect(await db.find({})).toStrictEqual([]);
        await db.insert({ _id: 'zizi' });
        expect(await db.find({})).toStrictEqual([{ _id: 'zizi' }]);
        await db.update({ _id: 'zizi' }, { $set: { lala: 12 } });
        expect(await db.find({})).toStrictEqual([{ _id: 'zizi', lala: 12 }]);
        expect(await db.findOne({})).toStrictEqual({ _id: 'zizi', lala: 12 });
        await db.insert({ _id: '11' });
        await db.remove({ _id: 'zizi' });
        expect(await db.find({})).toStrictEqual([{ _id: '11' }]);
    });

    it('should count', async () => {
        const db = new AsyncDB(await loadDB(path.join(dbBaseDir, generateRandomName())));
        await db.insert({ _id: 'zizi' });
        await db.insert({ _id: '11' });
        expect(await db.count({})).toBe(2);
    });
});
