import { app } from 'electron';
import fs from 'fs';
import { dbPaths } from '../config';
import './worker/fork';

let useHardwareAcceleration = false;
try {
    const settings = fs.readFileSync(dbPaths.settingDB, { encoding: 'utf-8' });
    console.log({ settings });
    if (settings) {
        const json = JSON.parse(
            settings
                .split('\n')
                .filter((x) => !!x)
                .slice(-1)[0]
        );
        console.log(json);
        useHardwareAcceleration = json.useHardwareAcceleration;
    }
} catch (e) {}
if (!useHardwareAcceleration) {
    if (process.platform !== 'darwin') {
        app.commandLine.appendSwitch('disable-gpu');
        app.commandLine.appendSwitch('disable-software-rasterizer');
    }
    app.disableHardwareAcceleration();
}

// Fix setTimeout not reliable problem
// See https://github.com/electron/electron/issues/7079#issuecomment-325706135
app.commandLine.appendSwitch('disable-background-timer-throttling');
import('./init');
