import * as electron from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { screenshotDir } from '../../config';
import { generateRandomName } from '../utils';

const remote = electron.remote;

const getCurrentScreen = () => {
    try {
        const screen = electron.screen || remote.screen;
        const currentWindow = remote.getCurrentWindow();
        const { x, y } = currentWindow.getBounds();
        return screen.getAllDisplays().filter(d => {
            return (
                x <= d.bounds.x + d.bounds.width &&
                x >= d.bounds.x &&
                y <= d.bounds.y + d.bounds.height &&
                y >= d.bounds.y
            );
        })[0];
    } catch (e) {
        if (process.env.NODE_ENV === 'test') {
            // Test env may not have electron
            console.warn(e);
            return { id: undefined };
        }

        throw e;
    }
};

const curScreen = getCurrentScreen();
function getScreenCallback(
    maxSize: number | undefined,
    callback: (err?: Error, canvas?: HTMLCanvasElement) => void
) {
    const handleStream = (stream: MediaStream) => {
        const video = document.createElement('video');
        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
        // Event connected to stream

        let loaded = false;
        video.onloadedmetadata = () => {
            if (loaded) {
                return;
            }

            video.pause();
            loaded = true;
            // Set video ORIGINAL height (screenshot)
            video.style.height = video.videoHeight + 'px'; // videoHeight
            video.style.width = video.videoWidth + 'px'; // videoWidth

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Cannot acquire context 2d');
            }
            // Draw video on canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            callback(undefined, canvas);
            // Remove hidden video tag
            video.remove();
            try {
                stream.getTracks()[0].stop();
            } catch (e) {
                // nothing
            }
        };

        video.srcObject = stream;
        video.play();
        document.body.appendChild(video);
    };

    const handleError = (e: Error) => {
        console.error(e);
        callback(e);
    };

    if (require('os').platform() === 'win32') {
        require('electron').desktopCapturer.getSources(
            {
                types: ['screen'],
                thumbnailSize: { width: 1, height: 1 }
            },
            (e: any, sources: any) => {
                const selectSource = sources.filter(
                    (source: any) => source.display_id + '' === curScreen.id + ''
                )[0];
                navigator.getUserMedia(
                    {
                        audio: false,
                        video: {
                            // @ts-ignore
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: selectSource.id + ''
                                // minWidth: 3,
                                // minHeight: 3,
                                // maxWidth: maxSize,
                                // maxHeight: maxSize
                            }
                        }
                    },
                    (e: MediaStream) => {
                        handleStream(e);
                    },
                    handleError
                );
            }
        );
    } else {
        navigator.getUserMedia(
            {
                audio: false,
                video: {
                    // @ts-ignore
                    mandatory: {
                        chromeMediaSource: 'screen',
                        maxWidth: 1920,
                        maxHeight: 1080
                    }
                }
            },
            (event: any) => {
                handleStream(event);
            },
            (err: Error) => {
                console.trace(err);
                handleError(err);
            }
        );
    }
}

export async function getScreen(
    timeout: number = 500,
    maxSize: number | undefined = 1024
): Promise<string> {
    return await new Promise((resolve, reject) => {
        let finished = false;
        getScreenCallback(maxSize, (err, canvas) => {
            if (err) {
                reject(err);
            } else if (!finished) {
                finished = true;
                if (!canvas) {
                    reject('Screenshot error');
                    return;
                }

                const filePath = path.join(screenshotDir, new Date().getTime() + '.jpg');
                // Get the DataUrl from the Canvas
                const url = canvas.toDataURL('image/jpg', 0.1);
                // remove Base64 stuff from the Image
                const base64Data = url.replace(/^data:image\/png;base64,/, '');
                fs.writeFile(filePath, base64Data, 'base64', err => {
                    if (err) {
                        console.log(err);
                    }
                });
                resolve(filePath);
            }
        });

        setTimeout(() => {
            if (!finished) {
                finished = true;
                console.log('timeout... reject screen shot');
                reject();
            }
        }, timeout);
    });
}
