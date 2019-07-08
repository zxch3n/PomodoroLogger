import { Dispatch } from 'redux';

export const genMapDispatchToProp = <T>(actions: {[key: string]: any})=>(dispatch: Dispatch) => {
    const dict: Partial<T> = {};
    for (const name in actions) {
        // @ts-ignore
        const actionCreator = actions[name];
        // @ts-ignore
        dict[name] = (...args: any)=>dispatch(actionCreator(...args));
    }

    return dict as T;
};
