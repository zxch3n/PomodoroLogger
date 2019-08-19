import AppIcon from '../../../res/icon.png';
import { remote } from 'electron';
const { nativeImage } = remote;

async function makeIcon(leftTime?: string): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
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
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.font = '96px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText(leftTime, 64, 64);
            } else {
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 128, 128);
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
