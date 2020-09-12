import { SourceData } from '../../dataMerger';

export const data: SourceData = {
    boards: {
        a: {
            _id: 'a',
            description: 'new a',
            doneList: 'done',
            focusedList: 'focused',
            lists: ['done', 'focused'],
            name: 'new a',
            relatedSessions: [],
            spentHours: 0,
            pin: true,
            lastVisitTime: 9999,
        },
        b: {
            _id: 'b',
            description: 'b',
            doneList: 'doneB',
            focusedList: 'focusedB',
            lists: ['doneB', 'focusedB'],
            name: 'b',
            relatedSessions: [],
            spentHours: 0,
        },
    },
    cards: {
        card_a: {
            _id: 'card_a',
            content: 'new card a',
            sessionIds: ['sess0', 'sess1', 'sess2'],
            spentTimeInHour: {
                actual: 30,
                estimated: 100,
            },
            title: 'card',
        },
        card_b: {
            _id: 'card_b',
            content: 'cardB',
            sessionIds: [],
            spentTimeInHour: {
                actual: 0,
                estimated: 100,
            },
            title: 'card_b',
        },
        card_rm: {
            _id: 'card_rm',
            content: 'card_rm',
            sessionIds: [],
            spentTimeInHour: {
                actual: 0,
                estimated: 0,
            },
            title: 'card_rm',
        },
    },
    lists: {
        done: {
            _id: 'done',
            cards: [],
            title: 'done',
        },
        focused: {
            _id: 'focused',
            cards: [],
            title: 'focused',
        },
        todo: {
            _id: 'todo',
            cards: ['card_a'],
            title: 'focused',
        },
        doneB: {
            _id: 'doneB',
            cards: [],
            title: 'doneB',
        },
        focusedB: {
            _id: 'focusedB',
            cards: ['card_b'],
            title: 'focusedB',
        },
    },
    move: [
        {
            cardId: 'card_a',
            fromListId: 'done',
            toListId: 'focused',
            time: 1,
        },
        {
            cardId: 'card_a',
            fromListId: 'done',
            toListId: 'todo',
            time: 2,
        },
        {
            cardId: 'card_b',
            fromListId: 'doneB',
            toListId: 'focusedB',
            time: 3,
        },
    ],
    records: [
        {
            _id: 'sess0',
            apps: {},
            spentTimeInHour: 10,
            startTime: 123000,
            switchTimes: 100,
        },
        {
            _id: 'sess1',
            apps: {},
            spentTimeInHour: 10,
            startTime: 125000,
            switchTimes: 100,
        },
        {
            _id: 'sess2',
            apps: {},
            spentTimeInHour: 10,
            startTime: 124000,
            switchTimes: 100,
        },
    ],
};
