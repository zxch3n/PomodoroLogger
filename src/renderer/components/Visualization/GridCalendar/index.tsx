import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    position: relative;
`;

type Data = {
    [timestamp: number]: {
        count: number;
    };
};

interface GridData {
    month: number;
    day: number;
    week: number;
    count: number;
    date: number;
    year: number;
}

interface Props {
    data: Data;
    width?: number;
    till?: string | number;
    shownWeeks?: number;
}

function getLastDayTimestamp(date: Date | string | number) {
    const d = new Date(date);
    const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} 23:59:59`;
    return new Date(dateStr).getTime() + 1000;
}

function getGridData(data: Data, till: number, shownGrids: number): GridData[] {
    const firstDayTimestamp = till - shownGrids * 3600 * 1000 * 24;
    let grids = Array(shownGrids).fill(0);
    for (const key in data) {
        const index = Math.floor((parseInt(key, 10) - firstDayTimestamp) / 3600 / 24 / 1000);
        grids[index] += data[key].count;
    }

    grids = grids.map((v, index) => {
        const date = new Date(firstDayTimestamp + index * 3600 * 1000 * 24);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            date: date.getDate(),
            week: Math.floor(index / 7),
            day: date.getDay(),
            count: v
        };
    });
    return grids;
}

export const GridCalendar: React.FC<Props> = (props: Props) => {
    const [chosenIndex, setChosenIndex] = React.useState<undefined | number>(undefined);
    const { till = new Date(), width = 800, data, shownWeeks = 53 } = props;
    const tillTimestamp = getLastDayTimestamp(till);
    const day = (new Date(till).getDay() + 1) % 7;
    const shownGrids = (day === 0 ? 7 : day) + (shownWeeks - 1) * 7;
    const grids = getGridData(data, tillTimestamp, shownGrids);
    const maxCountInADay = Math.max(...grids.map(v => v.count));

    const gridMargin = Math.floor((width / shownWeeks) * 0.1 + 2);
    const gridWidth = Math.floor(width / shownWeeks) - gridMargin;
    const gridHeight = gridWidth;
    const height = (gridWidth + gridMargin) * 7 + gridMargin;
    const SvgContainer = styled.div`
        padding: 0;
        margin: 0;
        position: relative;
    `;
    const Tooltip = chosenIndex ? (
        <div
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                position: 'absolute',
                left: (gridMargin + gridWidth) * grids[chosenIndex].week,
                top: (gridMargin + gridWidth) * (grids[chosenIndex].day + 1.8),
                padding: '16px 8px',
                borderRadius: 8
            }}
        >
            <span style={{ fontWeight: 700 }}>
                <b>{`${grids[chosenIndex].count} pomodoros `}</b>
            </span>
            <span style={{ fontWeight: 300, fontSize: '0.7em', marginLeft: 8 }}>
                {`${grids[chosenIndex].year}-${grids[chosenIndex].month}-${grids[chosenIndex].date}`}
            </span>
        </div>
    ) : (
        undefined
    );
    return (
        <Container>
            <ul>
                {/*TODO*/}
                <li>Jan</li>
                <li>...</li>
            </ul>

            <ul>
                <li>Sun</li>
                <li>Mon</li>
                <li>Tue</li>
                <li>Wed</li>
                <li>Thur</li>
                <li>Fri</li>
                <li>Sat</li>
            </ul>

            <SvgContainer>
                <svg width={width} height={height}>
                    {grids.map((v, index) => {
                        const onEnter = () => setChosenIndex(index);
                        const onLeave = () =>
                            setChosenIndex(oldIndex => {
                                if (oldIndex === index) {
                                    return undefined;
                                }

                                return oldIndex;
                            });
                        return (
                            <rect
                                width={gridWidth}
                                height={gridHeight}
                                x={v.week * (gridWidth + gridMargin)}
                                y={v.day * (gridWidth + gridMargin)}
                                fill={'black'}
                                key={index}
                                onMouseOver={onEnter}
                                onMouseOut={onLeave}
                            />
                        );
                    })}
                </svg>
                {Tooltip}
            </SvgContainer>
        </Container>
    );
};
