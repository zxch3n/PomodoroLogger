import AppIcon from '../../../res/icon.png';
import { remote } from 'electron';
const { nativeImage } = remote;

async function makeIcon(leftTime?: string): Promise<string> {
    const canvas = document.createElement('canvas');
    let size = 200;
    const isMac = process.platform === 'darwin';
    if (isMac) {
        size = 18;
    }

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('cannot get context2d');
    }

    const img = document.createElement('img');
    return new Promise<string>((resolve, reject) => {
        img.addEventListener('error', e => {
            console.error(e);
            reject(e);
        });
        img.addEventListener('load', e => {
            if (leftTime !== undefined) {
                ctx.fillStyle = isMac ? 'rgb(0, 0, 0)' : 'rgb(255,255,255)';
                ctx.font = `${(size / 4) * 3}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText(leftTime, size / 2, size / 2);
            } else {
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, size, size);
            }

            resolve(canvas.toDataURL('image/png'));
        });
        img.src = AppIcon;
    });
}

export async function setTrayImageWithMadeIcon(leftTime?: string) {
    const src = await makeIcon(leftTime);
    const tray = remote.getGlobal('tray');
    const img = nativeImage.createFromDataURL(src);
    tray.setImage(img);
}
