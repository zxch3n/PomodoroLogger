import { nativeImage, app, Tray, BrowserWindow, Notification, Menu } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as db from './db';
import logo from '../res/TimeLogger.png';

const mGlobal: typeof global & {
    sharedDB?: typeof db;
    tray?: Tray;
    setMenuItems?: any;
} = global;
mGlobal.sharedDB = db;
let win: BrowserWindow | undefined;
console.log(process.platform);
if (process.platform === 'win32') {
    app.setAppUserModelId('com.electron.time-logger');
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
    return Promise.all(
        extensions.map(name => installer.default(installer[name], forceDownload))
    ).catch(console.log);
};

const createWindow = async () => {
    if (process.env.NODE_ENV !== 'production') {
        await installExtensions();
    }

    win = new BrowserWindow({
        width: 1080,
        height: 800,
        frame: true,
        icon: nativeImage.createFromPath(path.join(__dirname, logo))
    });

    if (process.env.NODE_ENV === 'development') {
        console.log('dev url');
        process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';
        win.loadURL(`http://localhost:2003`);
    } else {
        console.log('file');
        win.loadURL(
            url.format({
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file:',
                slashes: true
            })
        );
    }

    if (process.env.NODE_ENV !== 'production') {
        // Open DevTools, see https://github.com/electron/electron/issues/12438 for why we wait for dom-ready
        win.webContents.once('dom-ready', () => {
            win!.webContents.openDevTools();
        });
    }

    win.on('close', (event: Event) => {
        if (win) {
            win.hide();
            event.preventDefault();
            const notification = new Notification({
                title: 'TimeLogger is not closed',
                body: 'You can close or open TimeLogger in tray.'
            });
            notification.on('click', () => {
                if (win) {
                    win.show();
                }
            });
            notification.show();
        }
    });
};

app.on('ready', async () => {
    const img = nativeImage.createFromPath(path.join(__dirname, logo));
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
    mGlobal.tray.setToolTip('Time Logger');
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

function setMenuItems(items: [{ label: string; type: string; click: any }][]) {
    if (!mGlobal.tray) {
        return;
    }

    const menuItems = items.concat([
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
    if (!win) {
        db.settingDB.persistence.compactDatafile();
        db.projectDB.persistence.compactDatafile();
        db.sessionDB.persistence.compactDatafile();
        app.exit();
    }
});

app.on('activate', () => {
    if (!win) {
        createWindow();
    }
});
