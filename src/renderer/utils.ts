import { Dispatch } from 'redux';
import { actions } from './components/Project/action';

export const genMapDispatchToProp = <T>(actions: { [key: string]: any }) => (
    dispatch: Dispatch
) => {
    const dict: Partial<T> = {};
    for (const name in actions) {
        // @ts-ignore
        const actionCreator = actions[name];
        // @ts-ignore
        dict[name] = (...args: any) => dispatch(actionCreator(...args));
    }

    return dict as T;
};

export const generateRandomName = () => {
    const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const output = [];
    for (let i = 0; i < 20; i += 1) {
        const index = Math.floor(Math.random() * alpha.length);
        output.push(alpha[index]);
    }

    return output.join('') as string;
};

export async function addProjectToDB(name: string) {
    await executeThunkAction(actions.addItem(name));
}

export async function executeThunkAction(action: (dispatch: Dispatch) => void) {
    await new Promise(resolve => {
        action(x => {
            resolve();
            return x;
        });
    });
}

export function getBetterAppName(appName: string) {
    const name = appName.replace(/\.exe$/g, '');
    return name[0].toUpperCase() + name.slice(1);
}

export class Counter {
    private _dict: { [key: string]: number } = {};
    add(key: string | number, num: number = 1) {
        if (!(key in this._dict)) {
            this._dict[key] = 0;
        }

        this._dict[key] += num;
    }

    get dict() {
        return this._dict;
    }

    getNameValuePairs({
        toFixed = undefined,
        topK = undefined
    }: { toFixed?: number; topK?: number } = {}): { name: string; value: number }[] {
        let ans = [];
        for (const key in this._dict) {
            let value = this._dict[key];
            if (toFixed !== undefined) {
                const pow = Math.pow(10, toFixed);
                value = Math.floor(value * pow + 0.5) / pow;
            }

            if (value > 0) {
                ans.push({ value, name: key });
            }
        }

        if (topK) {
            ans.sort((a, b) => a.value - b.value);
            ans = ans.slice(0, topK);
        }

        return ans;
    }
}
