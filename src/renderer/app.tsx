import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AppContainer } from 'react-hot-loader';

import Application from './components/Application';
import store from './store';

import { ipcRenderer } from 'electron';
import { IpcEventName } from '../main/ipc/type';

const dict: { [event: string]: Function } = {};
for (const name of Object.values(IpcEventName)) {
    dict[name] = (...args: any) => ipcRenderer.invoke(name, ...args);
}

console.log(dict);
(window as any).api = dict;

// Create main element
const mainElement = document.getElementById('root');
const splashElement = document.getElementById('logo-container');
// const splashScreen = document.getElementById('logo-container');
// document.body.removeChild(splashScreen!);
// @ts-ignore
window['__react-beautiful-dnd-disable-dev-warnings'] = true;

// Render components
const render = (Component: any) => {
    ReactDOM.render(
        <AppContainer>
            <Provider store={store}>
                <Component />
            </Provider>
        </AppContainer>,
        mainElement
    );

    setTimeout(() => {
        splashElement!.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(splashElement!);
        }, 1000);
    }, 2000);
};

render(Application);
