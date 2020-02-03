import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AppContainer } from 'react-hot-loader';

import Application from './components/Application';
import store from './store';

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
