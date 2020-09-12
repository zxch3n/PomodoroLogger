import { cloneDeep } from 'lodash';
import { KanbanBoardState } from '../../renderer/components/Kanban/Board/action';
import { CardsState } from '../../renderer/components/Kanban/Card/action';
import {
    Card,
    KanbanBoard,
    List,
    ListsState,
    MoveInfo,
} from '../../renderer/components/Kanban/type';
import { PomodoroRecord } from '../../renderer/monitor/type';

export interface SourceData {
    records: PomodoroRecord[];
    cards: CardsState;
    lists: ListsState;
    boards: KanbanBoardState;
    move: MoveInfo[];
}

export class DataMerger {
    private recordMap: { [id: string]: PomodoroRecord | undefined } = {};
    private seenCards: Set<string> = new Set();
    private cardLastMove: { [cardId: string]: MoveInfo } = {};
    private maybeBelongTo: { [cardId: string]: string[] } = {};
    constructor(
        private warn: (s: string) => void = (s) => {
            console.warn(s);
        }
    ) {}
    merge(a: SourceData, b: SourceData): SourceData {
        const ans = cloneDeep(a);
        this.mergeRecords(ans, b.records);
        this.setRecordMap(ans);
        this.mergeCards(ans, b.cards);
        this.mergeMove(ans, b.move);
        this.mergeLists(ans, b.lists);
        this.mergeBoards(ans, b.boards);
        // TODO: should I reset dangling lists? (we can use a stash area for them)
        this.resetDanglingCard(ans);
        this.setBoardInfo(ans);
        this.clear();
        return ans;
    }

    private resetDanglingCard(ans: SourceData) {
        const danglingCards = new Set(Object.keys(ans.cards));
        for (const list of Object.values(ans.lists)) {
            for (const cardId of list.cards) {
                danglingCards.delete(cardId);
            }
        }

        for (const card of danglingCards) {
            if (this.maybeBelongTo[card]?.length) {
                ans.lists[this.maybeBelongTo[card][0]].cards.push(card);
            } else {
                this.warn(`Card ${card} will be removed`);
            }
        }

        // TODO: store removed card somewhere
    }

    private mergeMove(ans: SourceData, move: MoveInfo[]) {
        const timeSet = new Set();
        for (const row of ans.move) {
            timeSet.add(row.time);
        }

        for (const row of move) {
            if (!timeSet.has(row.time)) {
                ans.move.push(row);
            }
        }

        ans.move.sort((a, b) => a.time - b.time);
        this.validateMove(ans);
    }

    private validateMove(ans: SourceData) {
        const rm = new Set();
        for (const row of ans.move) {
            const last = this.cardLastMove[row.cardId];
            if (!last) {
                this.cardLastMove[row.cardId] = row;
            } else {
                if (last.toListId === row.fromListId) {
                    this.cardLastMove[row.cardId] = row;
                } else {
                    rm.add(row);
                }
            }
        }

        let rmNum = 0;
        for (let i = 0; i < ans.move.length; i += 1) {
            if (rm.has(ans.move[i])) {
                rmNum += 1;
            } else {
                ans.move[i - rmNum] = ans.move[i];
            }
        }

        ans.move.splice(ans.move.length - rmNum, rmNum);
    }

    private mergeBoards(ans: SourceData, boards: KanbanBoardState) {
        for (const boardId in boards) {
            const aBoard = ans.boards[boardId];
            const bBoard = boards[boardId];
            if (!aBoard) {
                ans.boards[boardId] = bBoard;
            } else {
                ans.boards[boardId] = this.mergeBoard(aBoard, bBoard);
            }
        }
    }

    private mergeBoard(aBoard: KanbanBoard, bBoard: KanbanBoard): KanbanBoard {
        if ((bBoard.lastVisitTime ?? 0) > (aBoard.lastVisitTime ?? 0)) {
            aBoard.name = bBoard.name;
            aBoard.lastVisitTime = bBoard.lastVisitTime;
            aBoard.description = bBoard.description;
            if (aBoard.collapsed || bBoard.collapsed) {
                aBoard.collapsed = bBoard.collapsed;
            }
            if (aBoard.pin || bBoard.pin) {
                aBoard.pin = bBoard.pin;
            }
            aBoard.doneList = bBoard.doneList;
            aBoard.focusedList = bBoard.focusedList;
        }

        const mergedLists = bBoard.lists.reduce((set, cur) => set.add(cur), new Set(aBoard.lists));
        aBoard.lists = Array.from(mergedLists);
        return aBoard;
    }

    private setBoardInfo(ans: SourceData) {
        for (const boardId in ans.boards) {
            const board = ans.boards[boardId];
            board.relatedSessions = [];
            board.spentHours = 0;
            const sess = new Set<string>();
            travelCards(boardId, ans, (card) => {
                for (const cardSess of card.sessionIds) {
                    sess.add(cardSess);
                }

                board.spentHours += card.spentTimeInHour.actual;
            });

            board.relatedSessions = Array.from(sess);
        }
    }

    private setRecordMap(ans: SourceData) {
        this.recordMap = {};
        for (const record of ans.records) {
            this.recordMap[record._id] = record;
        }
    }

    private mergeRecords(ans: SourceData, records: PomodoroRecord[]) {
        const seen = ans.records.reduce((set, cur) => {
            set.add(cur._id);
            return set;
        }, new Set());

        for (const record of records) {
            if (seen.has(record._id)) {
                continue;
            }

            ans.records.push(record);
        }

        ans.records.sort((a, b) => a.startTime - b.startTime);
    }

    private mergeCards(ans: SourceData, cards: CardsState) {
        for (const cardId in cards) {
            const aCard = ans.cards[cardId];
            const bCard = cards[cardId];
            if (!aCard) {
                ans.cards[cardId] = bCard;
            } else {
                ans.cards[cardId] = this.mergeCard(aCard, bCard);
            }
        }
    }

    private mergeCard(ans: Card, b: Card) {
        if (ans._id !== b._id) {
            throw new Error('Merge Card: a and b must have the same id');
        }

        if (b.spentTimeInHour.actual > ans.spentTimeInHour.actual) {
            ans.content = b.content;
            ans.title = b.title;
        }

        const sessions = new Set(ans.sessionIds);
        for (const sess of b.sessionIds) {
            if (!sessions.has(sess)) {
                sessions.add(sess);
                ans.spentTimeInHour.actual += this.recordMap[sess]?.spentTimeInHour ?? 0;
            }
        }

        ans.sessionIds = Array.from(sessions);
        return ans;
    }

    private mergeLists(ans: SourceData, lists: ListsState) {
        for (const listId in lists) {
            const bList = lists[listId];
            const aList = ans.lists[listId];
            if (!aList) {
                ans.lists[listId] = this.cloneList(bList);
            } else {
                ans.lists[listId] = this.mergeList(aList, bList);
            }
        }
    }

    private cloneList(list: List) {
        list = cloneDeep(list);
        const cards: string[] = [];
        for (const id of list.cards) {
            if (this.cardLastMove[id]?.toListId === list._id) {
                cards.push(id);
            } else {
                this.setCardPossibleList(id, list);
            }
        }

        list.cards = cards;
        return list;
    }

    private mergeList(ans: List, b: List): List {
        const aSet = new Set(ans.cards);
        const bSet = new Set(b.cards);
        const cards: string[] = [];
        ans.title = b.title;
        for (const id of aSet) {
            if (bSet.has(id)) {
                cards.push(id);
            } else {
                if (this.cardLastMove[id]?.toListId === ans._id) {
                    cards.push(id);
                } else {
                    this.setCardPossibleList(id, ans);
                }
            }
        }

        for (const id of bSet) {
            if (!aSet.has(id)) {
                if (this.cardLastMove[id]?.toListId === ans._id) {
                    cards.push(id);
                } else {
                    this.setCardPossibleList(id, ans);
                }
            }
        }

        ans.cards = cards;
        cards.forEach((x) => {
            this.seenCards.add(x);
        });
        return ans;
    }

    private setCardPossibleList(id: string, ans: List) {
        if (!this.maybeBelongTo[id]) {
            this.maybeBelongTo[id] = [];
        }

        this.maybeBelongTo[id].push(ans._id);
    }

    private clear() {
        this.recordMap = {};
        this.seenCards.clear();
        this.cardLastMove = {};
    }
}

export function travelCards(boardId: string, data: SourceData, callback: (card: Card) => void) {
    const board = data.boards[boardId];
    for (const listId of board.lists) {
        const list = data.lists[listId];
        for (const cardId of list.cards) {
            const card = data.cards[cardId];
            callback(card);
        }
    }
}
