import * as React from 'react';
// @ts-ignore
import WordCloud2 from 'wordcloud';

interface Props {
    weights: [string, number][];
}

export const WordCloud: React.FC<Props> = (props: Props & { [other: string]: any }) => {
    const canvas = React.useRef();
    const { weights, ...restProps } = props;
    React.useEffect(() => {
        WordCloud2(canvas.current, { list: weights });
    }, [weights]);

    // @ts-ignore
    return <canvas ref={canvas} {...restProps} />;
};
