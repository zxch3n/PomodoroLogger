import { existsSync, mkdirSync, writeFile } from 'fs';
import path from 'path';
import { dbBkBaseDir } from '../../config';
import type { SourceData } from '../../shared/dataMerger/dataMerger';
import { AsyncDB } from '../../utils/dbHelper';
import { DBs } from '../db';
import { readAllData } from './read';
import { promisify } from 'util';

export async function writeAllFile(data: SourceData) {
    // should use latest data
    await generateBackup();
    const DB = {
        sessionDB: new AsyncDB(DBs.sessionDB),
        kanbanDB: new AsyncDB(DBs.kanbanDB),
        cardsDB: new AsyncDB(DBs.cardsDB),
        listsDB: new AsyncDB(DBs.listsDB),
        moveDB: new AsyncDB(DBs.moveDB),
    };

    await deleteAll(DB);
    await insertData(DB, data);
}

async function insertData(
    DB: {
        sessionDB: AsyncDB;
        kanbanDB: AsyncDB;
        cardsDB: AsyncDB;
        listsDB: AsyncDB;
        moveDB: AsyncDB;
    },
    data: SourceData
) {
    const promises = [
        DB.cardsDB.insert(Object.values(data.cards)),
        DB.listsDB.insert(Object.values(data.lists)),
        DB.kanbanDB.insert(Object.values(data.boards)),
        DB.moveDB.insert(data.move),
        DB.sessionDB.insert(data.records),
    ];

    await Promise.all(promises);
}

async function deleteAll(DB: {
    sessionDB: AsyncDB;
    kanbanDB: AsyncDB;
    cardsDB: AsyncDB;
    listsDB: AsyncDB;
    moveDB: AsyncDB;
}) {
    const promises = [
        DB.cardsDB.remove({}, { multi: true }),
        DB.listsDB.remove({}, { multi: true }),
        DB.kanbanDB.remove({}, { multi: true }),
        DB.moveDB.remove({}, { multi: true }),
        DB.sessionDB.remove({}, { multi: true }),
    ];

    await Promise.all(promises);
}

export async function generateBackup() {
    if (!existsSync(dbBkBaseDir)) {
        mkdirSync(dbBkBaseDir, { recursive: true });
    }

    const backup = await readAllData();
    await promisify(writeFile)(
        path.join(dbBkBaseDir, 'pomodoro-logger-data-backup.json'),
        JSON.stringify(backup),
        {
            encoding: 'utf-8',
        }
    );
}
