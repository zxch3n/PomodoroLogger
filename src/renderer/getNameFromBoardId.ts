import { KanbanBoard } from './components/Kanban/type';

export async function getNameFromBoardId(_id: string) {
    const { workers } = await import('./workers');
    const worker = workers.dbWorkers.kanbanDB;
    const board: KanbanBoard = await worker.findOne({ _id });
    return board.name;
}
