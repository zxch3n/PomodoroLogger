import { getWeightsFromPomodoros } from '../../utils/tokenizer';
import { PomodoroRecord } from '../monitor/type';
const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: { payload, code } }) => {
    try {
        const records = payload as PomodoroRecord[];
        const weights = getWeightsFromPomodoros(records);
        ctx.postMessage({
            code,
            type: 'tokenize',
            payload: weights
        });
    } catch (e) {
        console.error(e);
        ctx.postMessage({
            type: 'error',
            payload: JSON.stringify(e)
        });
    }
});
