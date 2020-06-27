import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
// @ts-ignore
import Trend from 'react-trend';
import { DBWorker } from '../../workers/DBWorker';
import { PomodoroRecord } from '../../monitor/type';
import { workers } from '../../workers';

const Container = styled.div`
    position: relative;
    transition: background-color 1s;
    background-color: rgba(255, 255, 223, 0);
    :hover {
        background-color: rgba(23, 43, 223, 0.1);
        h1 {
            opacity: 1;
        }
    }

    h1 {
        color: #0074e9;
        opacity: 0;
        transition: opacity 0.5s;
        text-align: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
`;

const NoHover = styled.div``;

interface Props {
    width?: number;
    height?: number;
    data: number[];
    hoverEffect?: boolean;
}

export const ProjectTrend: React.FC<Props> = (props: Props) => {
    const { hoverEffect = false } = props;
    const ref = useRef();
    const C = hoverEffect ? Container : NoHover;
    return (
        // @ts-ignore
        <C ref={ref}>
            {props.data.length > 0 ? (
                <>
                    {hoverEffect ? <h1>TREND</h1> : undefined}
                    <Trend
                        width={props.width}
                        height={props.height}
                        smooth={true}
                        data={props.data}
                        gradient={['#00c6ff', '#F0F', '#FF0']}
                        radius={10.1}
                        strokeWidth={1.5}
                        strokeLinecap={'butt'}
                        maxDada={16}
                    />
                </>
            ) : undefined}
        </C>
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
