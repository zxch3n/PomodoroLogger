import _activeWin from 'active-win';

let hasPermission = false;
export async function initActiveWin() {
    try {
        await _activeWin();
        hasPermission = true;
    } catch (e) {}

    console.log('Initialized with activeWin title permission?', hasPermission);
}

export async function activeWin() {
    return await _activeWin({ screenRecordingPermission: hasPermission });
}
