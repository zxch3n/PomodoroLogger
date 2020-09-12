import { SourceData } from '../../dataMerger';

export const data: SourceData = {
    boards: {
        a: {
            _id: 'a',
            description: 'a',
            doneList: 'done',
            focusedList: 'focused',
            lists: ['done', 'focused'],
            name: 'a',
            relatedSessions: [],
            spentHours: 0,
        },
    },
    cards: {
        card_a: {
            _id: 'card_a',
            content: 'card',
            sessionIds: ['sess0', 'sess1'],
            spentTimeInHour: {
                actual: 20,
                estimated: 100,
            },
            title: 'card',
        },
        card_c: {
            _id: 'card_c',
            content: 'card',
            sessionIds: ['sess0'],
            spentTimeInHour: {
                actual: 10,
                estimated: 100,
            },
            title: 'card',
        },
    },
    lists: {
        done: {
            _id: 'done',
            cards: ['card_c'],
            title: 'done',
        },
        focused: {
            _id: 'focused',
            cards: ['card_a'],
            title: 'focused',
        },
    },
    move: [
        {
            cardId: 'card_a',
            fromListId: 'done',
            toListId: 'focused',
            time: 1,
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
    ],
};
