import * as React from 'react';

interface Props {
    children: React.ReactElement;
    isVisible: boolean;
    timeout: number;
}

export const DestroyOnTimeoutWrapper: React.FC<Props> = React.memo((props: Props) => {
    const [hide, setHide] = React.useState(false);
    React.useEffect(() => {
        let timeout: undefined | number;
        if (!props.isVisible) {
            timeout = window.setTimeout(() => {
                setHide(true);
            }, props.timeout);
        }

        if (props.isVisible) {
            setHide(false);
        }

        return () => {
            timeout && clearTimeout(timeout);
        };
    }, [props.isVisible]);

    if (hide) {
        return <></>;
    }

    return <>{props.children}</>;
});
