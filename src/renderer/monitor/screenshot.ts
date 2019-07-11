import { remote, screen } from 'electron';

const currentWindow = remote.getCurrentWindow();
const getCurrentScreen = () => {
    const { x, y } = currentWindow.getBounds();
    return screen.getAllDisplays().filter(d => {
        return (
            x <= d.bounds.x + d.bounds.width &&
            x >= d.bounds.x &&
            y <= d.bounds.y + d.bounds.height &&
            y >= d.bounds.y
        );
    })[0];
};

const curScreen = getCurrentScreen();
function getScreenCallback(
    maxSize: number,
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
                                chromeMediaSourceId: selectSource.id + '',
                                minWidth: 3,
                                minHeight: 3,
                                maxWidth: maxSize,
                                maxHeight: maxSize
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
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: `screen:${curScreen.id}`,
                        minWidth: 3,
                        minHeight: 3,
                        maxWidth: maxSize,
                        maxHeight: maxSize
                    }
                }
            },
            (event: any) => {
                handleStream(event);
            },
            handleError
        );
    }
}

export async function getScreen(
    timeout: number = 500,
    maxSize: number = 10
): Promise<HTMLCanvasElement> {
    return await new Promise((resolve, reject) => {
        let finished = false;
        getScreenCallback(maxSize, (err, canvas) => {
            if (err) {
                reject(err);
            } else if (!finished) {
                finished = true;
                resolve(canvas);
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
