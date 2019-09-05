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

export function to2digits(num: number) {
    if (num < 10) {
        return `0${num}`;
    }

    return num;
}

export function formatTime(timeInHour: number) {
    const hour = Math.floor(timeInHour);
    const minute = Math.floor((timeInHour - hour) * 60 + 0.5);
    return `${to2digits(hour)}h ${to2digits(minute)}m`;
}

export function parseTime(formattedTime: string) {
    const matchedH = formattedTime.match(/(\d+)h/);
    const matchedM = formattedTime.match(/(\d+)m/);
    if (matchedH == null || matchedM == null) {
        throw new Error();
    }
    const hour = parseInt(matchedH.entries().next().value[1], 10);
    const minute = parseInt(matchedH.entries().next().value[1], 10);
    return hour + minute / 60;
}
