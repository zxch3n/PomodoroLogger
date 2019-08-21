import * as React from 'react';
// @ts-ignore
import WordCloud2 from 'wordcloud';
import { PomodoroRecord } from '../../monitor/type';
import { Counter } from '../../../utils/Counter';
import { Tokenizer } from '../../../utils/tokenizer';

interface Props {
    weights: [string, number][];
}

type MProps = Props & { [other: string]: any };
export const WordCloud: React.FC<MProps> = (props: MProps) => {
    const canvas = React.useRef();
    const { weights, ...restProps } = props;
    React.useEffect(() => {
        WordCloud2(canvas.current, { list: weights });
    }, [weights]);

    // @ts-ignore
    return <canvas ref={canvas} {...restProps} />;
};

export const getWeightsFromPomodoros = (records: PomodoroRecord[]) => {
    const tokenWeights = new Counter();
    const tokenizer = new Tokenizer();
    for (const record of records) {
        for (const app in record.apps) {
            const appRecord = record.apps[app];
            for (const title in appRecord.titleSpentTime) {
                const weight = appRecord.titleSpentTime[title].normalizedWeight;
                const tokens = tokenizer.tokenize(title);
                for (const token of tokens) {
                    tokenWeights.add(token, weight);
                }
            }
        }
    }

    const weights = tokenWeights.list;
    const max = weights.reduce((prev, cur) => Math.max(prev, cur[1]), 0);
    const min = weights.reduce((prev, cur) => Math.min(prev, cur[1]), 0);
    weights.map(v => (v[1] = (v[1] / max) * 50));
    return weights;
};
