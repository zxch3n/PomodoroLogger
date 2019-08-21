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
    const canvas = React.useRef<HTMLCanvasElement>();
    const { weights, ...restProps } = props;
    React.useEffect(() => {
        if (canvas.current === undefined) {
            return;
        }

        const width = canvas.current.clientWidth;
        WordCloud2(canvas.current, {
            list: weights,
            gridSize: Math.round((8 * width) / 800),
            weightFactor: (size: number) => {
                return (Math.pow(size, 1.1) * width) / 800;
            },
            fontFamily: 'Times, serif',
            color: (word: string, weight: number) => {
                return weight >= 38 ? '#f02222' : '#c09292';
            },
            rotateRatio: 0.5,
            rotationSteps: 2,
            backgroundColor: '#ffe0e0'
        });
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

    const weights = tokenWeights.getNameValuePairs({ topK: 100 });
    const max = weights.reduce((prev, cur) => Math.max(prev, cur.value), 0);
    const min = weights.reduce((prev, cur) => Math.min(prev, cur.value), 0);
    const ans = weights.map(v => [v.name, ((v.value - min) / (max - min)) * 30 + 12]);

    console.log(ans);
    return ans;
};
