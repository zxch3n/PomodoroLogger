import { autoUpdater } from 'electron-updater';
import { GithubOptions } from 'builder-util-runtime';
import { readFileSync } from 'fs';

export class AutoUpdater {
    constructor(logger: any) {
        this.init(logger);
    }

    init(sendStatusToWindow: any) {
        autoUpdater.on('checking-for-update', () => {
            sendStatusToWindow('Checking for update...');
        });
        autoUpdater.on('update-available', info => {
            sendStatusToWindow('Update available.');
            console.log(info);
        });
        autoUpdater.on('update-not-available', info => {
            sendStatusToWindow('Update not available.');
        });
        autoUpdater.on('error', err => {
            sendStatusToWindow('Error in auto-updater. ' + err);
        });
        autoUpdater.on('download-progress', progressObj => {
            let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message =
                log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
            sendStatusToWindow(log_message);
        });
        autoUpdater.on('update-downloaded', info => {
            sendStatusToWindow('Update downloaded');
            console.log(info);
        });
    }

    start() {
        const data = {
            provider: 'github',
            owner: 'zxch3n',
            repo: 'PomodoroLogger'
        } as GithubOptions;
        autoUpdater.setFeedURL(data);
        autoUpdater.autoDownload = false;
        autoUpdater.checkForUpdates();
    }
}
