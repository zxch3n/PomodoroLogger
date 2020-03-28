import { getWeightsFromPomodoros } from '../../utils/tokenizer';
import { PomodoroRecord } from '../monitor/type';
import { Card } from '../components/Kanban/type';
const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: { payload, code } }) => {
    try {
        const { records, cards } = payload as {
            records: PomodoroRecord[];
            cards: Card[];
        };
        const weights = getWeightsFromPomodoros(records, cards);
        ctx.postMessage({
            code,
            type: 'tokenize',
            payload: weights,
        });
    } catch (e) {
        console.error(e);
        ctx.postMessage({
            type: 'error',
            payload: JSON.stringify(e),
        });
    }
});
