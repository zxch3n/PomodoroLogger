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
