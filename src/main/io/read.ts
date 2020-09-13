import nedb from 'nedb';
import type { SourceData } from '../../shared/dataMerger/dataMerger';
import { DBs, loadDBs } from '../db';
import { AsyncDB } from '../../utils/dbHelper';
import type { CardsState } from '../../renderer/components/Kanban/Card/action';
import type { ListsState, MoveInfo } from '../../renderer/components/Kanban/type';
import type { KanbanBoardState } from '../../renderer/components/Kanban/Board/action';
import type { PomodoroRecord } from '../../renderer/monitor/type';

export async function readAllData(): Promise<SourceData> {
    await loadDBs();
    const cards: CardsState = await readKanban(DBs.cardsDB);
    const lists: ListsState = await readKanban(DBs.listsDB);
    const boards: KanbanBoardState = await readKanban(DBs.kanbanDB);
    const move: MoveInfo[] = await new AsyncDB(DBs.moveDB).find();
    const records: PomodoroRecord[] = await new AsyncDB(DBs.sessionDB).find();
    return {
        boards,
        cards,
        lists,
        move,
        records,
    };
}

async function readKanban(db: nedb) {
    const cards = await new AsyncDB(db).find();
    const cardMap: { [id: string]: any } = {};
    for (const card of cards) {
        cardMap[card._id] = card;
    }

    return cardMap;
}
