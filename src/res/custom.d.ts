declare module '*.svg' {
    import { FunctionComponent } from 'react';
    const _: FunctionComponent<any>;
    export = _;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*/package.json' {
    export const build: { productName: string };
}

declare module '*.dat' {
    const path: string;
    export default path;
}

declare module 'worker-loader!*' {
    class WebpackWorker extends Worker {
        constructor();
    }

    export default WebpackWorker;
}

declare module '*.mp3' {
    const path: string;
    export default path;
}
