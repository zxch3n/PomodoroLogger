import { nativeImage, Tray, BrowserWindow, Menu, ipcMain, MenuItem, app } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as db from './db';
import logo from '../res/icon_sm.png';
import fs from 'fs';
import { dbBaseDir } from '../config';
import { build } from '../../package.json';
import { AutoUpdater } from './AutoUpdater';
import { initialize } from './ipc/ipc';
import { IpcEventName } from './ipc/type';
import * as remoteMain from '@electron/remote/main';
import { initActiveWin } from './activeWin';
remoteMain.initialize();

const { refreshDbs, loadDBs } = db;
export let win: BrowserWindow | undefined;

export const gotTheLock = process.env.NODE_ENV !== 'production' || app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });
}

const mGlobal: typeof global & {
    sharedDB?: typeof db.DBs;
    utils?: {
        refreshDbs: typeof refreshDbs;
        loadDBs: typeof loadDBs;
    };
    tray?: Tray;
    setMenuItems?: any;
    learner?: any;
} = global;
mGlobal.sharedDB = db.DBs;
mGlobal.utils = {
    refreshDbs,
    loadDBs,
};
if (process.platform === 'win32') {
    app.setAppUserModelId('com.electron.time-logger');
}

const createWindow = async () => {
    win = new BrowserWindow({
        width: 1080,
        height: 800,
        minWidth: 380,
        minHeight: 63,
        frame: true,
        icon: nativeImage.createFromPath(path.join(__dirname, logo)),
        title: 'Pomodoro Logger',
        webPreferences: {
            nodeIntegrationInWorker: true,
            nodeIntegration: true,
            contextIsolation: false,
            // preload: path.join(__dirname, 'preload.js'),
        },
    });

    remoteMain.enable(win.webContents);
    win.removeMenu();
    if (process.env.NODE_ENV === 'production') {
        win.removeMenu();
    }

    if (process.env.NODE_ENV === 'development') {
        win.loadURL(`http://localhost:2003`);
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadURL(
            url.format({
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file:',
                slashes: true,
            })
        );
    }

    const handleRedirect = (e: any, url: string) => {
        if (url !== win?.webContents.getURL()) {
            e.preventDefault();
            require('electron').shell.openExternal(url);
        }
    };

    win.webContents.on('will-navigate', handleRedirect);
    win.webContents.on('new-window', handleRedirect);

    win.on('close', (event: Event) => {
        if (win) {
            win.hide();
            event.preventDefault();
        }
    });

    ipcMain.addListener(IpcEventName.Quit, () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('receive quit-app');
            return;
        }

        win = undefined;
        app.exit();
    });

    ipcMain.addListener(IpcEventName.Restart, restart);

    ipcMain.addListener(IpcEventName.SetTray, (event: any, src: string) => {
        const pngBuffer = nativeImage.createFromDataURL(src).toPNG();
        const imgFile = path.join(dbBaseDir, 'tray@2x.png');
        fs.writeFile(imgFile, pngBuffer, {}, () => {
            mGlobal.tray?.setImage(imgFile);
        });
    });

    if (process.platform === 'darwin') {
        let forceQuit = false;
        app.on('before-quit', () => {
            forceQuit = true;
        });

        win.on('close', (event) => {
            if (!forceQuit) {
                event.preventDefault();
                return;
            }

            win = undefined;
            app.exit();
        });
    }

    setTimeout(initActiveWin, 2000);
};
app.on('ready', async () => {
    if (!gotTheLock) {
        return;
    }

    const img = nativeImage.createFromPath(path.join(__dirname, logo));
    img.resize({ width: 16, height: 16 });
    mGlobal.tray = new Tray(img);
    const menuItems = [
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                app.quit();
            },
        },
    ];

    // @ts-ignore
    const contextMenu = Menu.buildFromTemplate(menuItems);
    mGlobal.tray.setToolTip('Pomodoro Logger');
    if (process.platform === 'darwin') {
        mGlobal.tray.on('click', async () => {
            if (!win) {
                await createWindow();
            } else {
                win.show();
            }
        });
    } else {
        mGlobal.tray.setContextMenu(contextMenu);
        mGlobal.tray.on('double-click', async () => {
            if (!win) {
                await createWindow();
            } else {
                win.show();
            }
        });
    }

    await createWindow();

    db.DBs.settingDB.findOne({ name: 'setting' }, (err, settings) => {
        if (err) {
            console.error(err);
            return;
        }

        if (settings != null && 'autoUpdate' in settings && !settings.autoUpdate) {
            return;
        }

        update();
    });
});

export function restart(): void {
    if (process.env.NODE_ENV === 'development') {
        console.log('receive restart-app');
        return;
    }

    win = undefined;
    app.relaunch();
    app.exit();
}

function update() {
    const autoUpdater = new AutoUpdater((type: string, info: any) => {
        if (win) {
            win.webContents.send(type, info);
        }

        if (type === 'download-progress') {
            const { percent } = info;
            if (win) {
                win.setProgressBar(percent / 100);
            }
        }

        if (type === 'update-downloaded' || type === 'error') {
            if (win) {
                win.setProgressBar(-1);
            }
        }
    });

    ipcMain.on(IpcEventName.DownloadUpdate, () => {
        autoUpdater.download();
    });

    autoUpdater.checkUpdate();
}
function setMenuItems(items: { label: string; type: string; click: any }[]) {
    if (!mGlobal.tray) {
        return;
    }

    const menuItems = items.concat([
        new MenuItem({
            type: 'separator',
        }),
        {
            label: 'Open',
            type: 'normal',
            click: () => {
                if (win) {
                    win.show();
                }
            },
        },
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                win = undefined;
                app.exit();
            },
        },
    ]);
    // @ts-ignore
    const contextMenu = Menu.buildFromTemplate(menuItems);
    mGlobal.tray.setContextMenu(contextMenu);
}
mGlobal.setMenuItems = setMenuItems;
app.on('window-all-closed', () => {
    win = undefined;
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
initialize();
