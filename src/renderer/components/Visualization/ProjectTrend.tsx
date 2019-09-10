import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
// @ts-ignore
import Trend from 'react-trend';
import { DBWorker } from '../../workers/DBWorker';
import { PomodoroRecord } from '../../monitor/type';
import { workers } from '../../workers';

const Container = styled.div``;

interface Props {
    width?: number;
    height?: number;
    data: number[];
}

export const ProjectTrend: React.FC<Props> = (props: Props) => {
    return (
        <Container>
            {props.data.length > 0 ? (
                <Trend
                    width={props.width}
                    height={props.height}
                    smooth={true}
                    data={props.data}
                    gradient={['#00c6ff', '#F0F', '#FF0']}
                    radius={10.1}
                    strokeWidth={1.5}
                    strokeLinecap={'butt'}
                    maxData={16}
                />
            ) : (
                undefined
            )}
        </Container>
    );
};

interface InputProps extends Partial<Props> {
    boardId: string;
}

export function countRecordNum(records: PomodoroRecord[], spanInDay: number = 30): number[] {
    const data: number[] = Array(spanInDay).fill(0);
    const now = new Date().getTime();
    for (const record of records) {
        const dayCountTillToday = (now - record.startTime) / 1000 / 3600 / 24;
        if (dayCountTillToday >= spanInDay) {
            continue;
        }

        const countIndex = Math.floor(spanInDay - dayCountTillToday);
        data[countIndex] += 1;
    }

    return data;
}

export const IdTrend: React.FC<InputProps> = (props: InputProps) => {
    const [data, setData] = useState([0, 0, 0, 0, 0]);
    const { boardId, ...restProps } = props;
    useEffect(() => {
        const worker = workers.dbWorkers.sessionDB;
        worker.find({ boardId: props.boardId }, {}).then((values: PomodoroRecord[]) => {
            const counter = countRecordNum(values);
            counter[counter.length - 1] += 0.001;
            setData(counter);
        });
    }, [props.boardId]);

    return <ProjectTrend data={data} {...restProps} />;
};
