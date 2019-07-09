import { Dispatch } from 'redux';
import { actions } from './components/Project/action';

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


export const generateRandomName = () => {
    const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const output = [];
    for (let i = 0; i < 20; i++){
        const index = Math.floor(Math.random() * alpha.length);
        output.push(alpha[index]);
    }

    return output.join('') as string;
};


export async function addProjectToDB(name: string){
    await executeThunkAction(actions.addItem(name));
}

export async function executeThunkAction(action: (dispatch: Dispatch)=>void) {
    await new Promise(resolve=>{
        action(x=>{resolve(); return x;})
    })
}


