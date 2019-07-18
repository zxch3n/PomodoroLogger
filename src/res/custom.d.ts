declare module '*.svg' {
    import { FunctionComponent } from 'react';
    const _: FunctionComponent<any>;
    export = _;
}

declare module '*.png' {
    const content: string;
    export default content;
}
