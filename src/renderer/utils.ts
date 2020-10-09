import { Dispatch } from 'redux';
import { MapDispatchToPropsParam } from 'react-redux';

let creatorMap = new WeakMap();
let cachedDispatch: Dispatch | undefined;
export const genMapDispatchToProp = <T>(actions: { [key: string]: any }) => {
    return (dispatch: Dispatch) => {
        const dict: any = {};
        if (dispatch !== cachedDispatch) {
            creatorMap = new WeakMap();
            cachedDispatch = dispatch;
        }

        for (const name in actions) {
            const actionCreator = actions[name];
            if (creatorMap.has(actionCreator)) {
                dict[name] = creatorMap.get(actionCreator);
            } else {
                dict[name] = (...args: any) => dispatch(actionCreator(...args));
                creatorMap.set(actionCreator, dict[name]);
            }
        }

        return dict as T;
    };
};

export function memorizeDispatchToProps<Props, T extends { [name: string]: Function }>(
    funcMap: (dispatch: Dispatch, props: Props) => T,
    cacheMap: (props: Props) => { [name in keyof T]: any[] }
): MapDispatchToPropsParam<T, Props> {
    const cacheKeys: { [name in keyof T]?: any[] } = {};
    const cachedFunctions: Partial<T> = {};
    return (dispatch: Dispatch, props: Props) => {
        const newCacheMap = cacheMap(props);
        let newFunctions: T | undefined;
        for (const name in newCacheMap) {
            if (!cacheKeys[name] || newCacheMap[name].some((x, i) => x !== cacheKeys[name]![i])) {
                cacheKeys[name] = newCacheMap[name];
                if (!newFunctions) {
                    newFunctions = funcMap(dispatch, props);
                }

                cachedFunctions[name] = newFunctions[name];
            }
        }

        return { ...cachedFunctions } as T;
    };
}

export function getMemorizedFunc<T extends Function>() {
    let lastFunc: T | undefined;
    let lastKeys: any[] | undefined;
    return (func: T, cacheKeys: any[]) => {
        if (lastKeys == null || lastKeys.some((x, i) => x !== cacheKeys[i])) {
            lastKeys = cacheKeys;
            lastFunc = func;
        }

        return lastFunc as T;
    };
}

export const generateRandomName = () => {
    const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const output = [];
    for (let i = 0; i < 20; i += 1) {
        const index = Math.floor(Math.random() * alpha.length);
        output.push(alpha[index]);
    }

    return output.join('') as string;
};

export function getBetterAppName(appName: string) {
    const name = appName.replace(/\.exe$/g, '');
    return name[0].toUpperCase() + name.slice(1);
}

export function to2digits(num: number) {
    if (num < 10) {
        return `0${Math.floor(num)}`;
    }

    return Math.floor(num).toString();
}

export function formatTime(timeInHour: number) {
    if (timeInHour >= 1e6) {
        return `${(timeInHour / 1e6).toFixed(2)}mh`;
    }

    if (timeInHour >= 1e5) {
        return `${(timeInHour / 1000).toFixed(0)}kh`;
    }

    if (timeInHour >= 10000) {
        return `${(timeInHour / 1000).toFixed(1)}kh`;
    }

    if (timeInHour >= 1000) {
        return `${(timeInHour / 1000).toFixed(2)}kh`;
    }

    if (timeInHour >= 100) {
        return `${timeInHour.toFixed(1)}h`;
    }
    const hour = Math.floor(timeInHour);
    const minute = Math.floor((timeInHour - hour) * 60 + 0.5);
    return `${to2digits(hour)}h ${to2digits(minute)}m`;
}

export function formatTimeWithoutZero(timeInHour: number) {
    const hour = Math.floor(timeInHour);
    const minute = Math.floor((timeInHour - hour) * 60 + 0.5);
    return `${hour}h ${minute}m`;
}

export function parseTime(formattedTime: string) {
    const matchedH = formattedTime.match(/(\d+)h/);
    const matchedM = formattedTime.match(/(\d+)m/);
    if (matchedH == null || matchedM == null) {
        throw new Error();
    }
    const hour = parseInt(matchedH.entries().next().value[1], 10);
    const minute = parseInt(matchedM.entries().next().value[1], 10);
    return hour + minute / 60;
}

export function isShallowEqual(v: { [key: string]: any }, o: { [key: string]: any }) {
    for (const key in v) {
        if (!(key in o) || v[key] !== o[key]) {
            return false;
        }
    }

    for (const key in o) {
        if (!(key in v) || v[key] !== o[key]) {
            return false;
        }
    }

    return true;
}

export type EqualKey = string | { [key: string]: EqualKey[] };
export function isShallowEqualByKeys(
    v: { [key: string]: any },
    o: { [key: string]: any },
    keys: EqualKey[]
) {
    const stack = keys.concat();
    while (stack.length) {
        const top = stack.pop();
        if (typeof top === 'string') {
            if (!equal(v, o, top)) {
                return false;
            }
        } else {
            for (const key in top) {
                for (const value of top[key]) {
                    if (typeof value === 'string') {
                        stack.push(key + '.' + value);
                    } else {
                        Object.keys(value).forEach((k) => {
                            value[key + '.' + k] = value[k];
                            delete value[k];
                        });
                        stack.push(value);
                    }
                }
            }
        }
    }

    return true;
}

function equal(a: any, b: any, equalKey: string) {
    const keys = equalKey.split('.');
    for (const key of keys) {
        const hasNum = (key in a ? 1 : 0) + (key in b ? 1 : 0);
        if (hasNum === 0) {
            return true;
        }

        if (hasNum !== 2) {
            return false;
        }

        if (a[key] !== b[key]) {
            return false;
        }

        a = a[key];
        b = b[key];
    }

    return a === b;
}

export function mergeRefs<T = any>(
    refs: (React.MutableRefObject<T> | React.LegacyRef<T>)[]
): React.Ref<T> {
    return (value) => {
        refs.forEach((ref) => {
            if (typeof ref === 'function') {
                ref(value);
            } else if (ref != null) {
                (ref as React.MutableRefObject<T | null>).current = value;
            }
        });
    };
}

export function matchParent(
    node: HTMLElement | undefined | null,
    selector: string
): HTMLElement | undefined {
    while (node) {
        if (node.matches(selector)) {
            return node;
        }

        node = node.parentElement;
    }

    return;
}
