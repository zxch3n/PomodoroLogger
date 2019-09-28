import { nativeImage, app, Tray, BrowserWindow, Notification, Menu } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as db from './db';
import logo from '../res/icon_sm.png';
import { build } from '../../package.json';

// Fix setTimeout not reliable problem
// See https://github.com/electron/electron/issues/7079#issuecomment-325706135
app.commandLine.appendSwitch('disable-background-timer-throttling');

const mGlobal: typeof global & {
    sharedDB?: typeof db.DBs;
    tray?: Tray;
    setMenuItems?: any;
    learner?: any;
} = global;
mGlobal.sharedDB = db.DBs;
if (process.platform === 'win32') {
    app.setAppUserModelId('com.electron.time-logger');
}

let win: BrowserWindow | undefined;
const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    // const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const forceDownload = true;
    console.log('forcedownload', forceDownload);
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
    console.log('react', installer[extensions[0]]);
    console.log('redux', installer[extensions[1]]);
    return Promise.all(
        extensions.map(name => installer.default(installer[name], forceDownload))
    ).catch(console.log);
};

const createWindow = async () => {
    win = new BrowserWindow({
        width: 1080,
        height: 800,
        frame: true,
        icon: nativeImage.createFromPath(path.join(__dirname, logo)),
        title: 'Pomodoro Logger',
        webPreferences: {
            nodeIntegrationInWorker: true,
            nodeIntegration: true
        }
    });

    console.log('create window');
    if (process.env.NODE_ENV !== 'production') {
        await installExtensions();
    }
    console.log('installed extensions');

    if (process.env.NODE_ENV === 'production') {
        win.removeMenu();
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('Dev from localhost');
        win.loadURL(`http://localhost:2003`);
    } else {
        console.log('Prod or test from file');
        win.loadURL(
            url.format({
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file:',
                slashes: true
            })
        );
    }

    console.log('loaded url');
    win.on('close', (event: Event) => {
        if (win) {
            win.hide();
            event.preventDefault();
        }
    });
};

app.on('ready', async () => {
    const img = nativeImage.createFromPath(path.join(__dirname, logo));
    img.resize({ width: 16, height: 16 });
    mGlobal.tray = new Tray(img);
    const menuItems = [
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                app.quit();
            }
        }
    ];
    // @ts-ignore
    const contextMenu = Menu.buildFromTemplate(menuItems);
    mGlobal.tray.setToolTip('Pomodoro Logger');
    mGlobal.tray.setContextMenu(contextMenu);

    mGlobal.tray.on('double-click', async () => {
        if (!win) {
            await createWindow();
        } else {
            win.show();
        }
    });

    await createWindow();
});

function setMenuItems(items: { label: string; type: string; click: any }[]) {
    if (!mGlobal.tray) {
        return;
    }

    const menuItems = items.concat([
        {
            label: 'Open',
            type: 'normal',
            click: () => {
                if (win) {
                    win.show();
                }
            }
        },
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                win = undefined;
                app.exit();
            }
        }
    ]);

    // @ts-ignore
    const contextMenu = Menu.buildFromTemplate(menuItems);
    mGlobal.tray.setContextMenu(contextMenu);
}

mGlobal.setMenuItems = setMenuItems;
app.on('window-all-closed', () => {
    app.exit();
});

app.on('activate', () => {
    if (!win) {
        app.setName(build.productName);
        createWindow();
    } else {
        win.show();
    }
});
