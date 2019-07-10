import { remote, screen } from 'electron';

const currentWindow = remote.getCurrentWindow();
const getCurrentScreen = () => {
    const { x, y } = currentWindow.getBounds();
    return screen.getAllDisplays().filter(d => d.bounds.x === x && d.bounds.y === y)[0];
};

const isCursorInCurrentWindow = () => {
    const { x, y } = screen.getCursorScreenPoint();
    const { x: winX, y: winY, width, height } = currentWindow.getBounds();
    return x >= winX && x <= winX + width && y >= winY && y <= winY + height;
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

    console.log('define error');
    const handleError = (e: Error) => {
        console.error(e);
        callback(e);
    };

    if (require('os').platform() === 'win32') {
        console.log('win32');
        require('electron').desktopCapturer.getSources(
            {
                types: ['screen'],
                thumbnailSize: { width: 1, height: 1 }
            },
            (e: any, sources: any) => {
                console.log('get sources');
                const selectSource = sources.filter(
                    (source: any) => source.display_id + '' === curScreen.id + ''
                )[0];
                console.log(selectSource);
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
        console.log('no win32');
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
    timeout: number = 200,
    maxSize: number = 10
): Promise<HTMLCanvasElement> {
    return await new Promise((resolve, reject) => {
        getScreenCallback(maxSize, (err, canvas) => {
            if (err) reject(err);
            else resolve(canvas);
        });

        setTimeout(reject, timeout);
    });
}
