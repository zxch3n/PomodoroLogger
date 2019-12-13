import React from 'react';
import { formatTime } from '../../../utils';
import shortid from 'shortid';
import styled from 'styled-components';
import { throttle } from 'lodash';

const AnimeSvg = styled.svg`
    transition: transform 0.25s;
    user-select: none;
    cursor: pointer;
    font-weight: 600;
    :hover {
        transform: scale(1.06);
    }
    .clip-path {
        transition: all 0.65s;
    }
    .label {
        font-weight: 700;
    }
`;

export interface Props {
    type: string;
    color?: string;
    value: string;
    title?: string;
}

export const Badge = (props: Props) => {
    const { color = '#32d31f', type, value, title } = props;
    const textSize = Math.floor(props.type.length * 6.5 + 10);
    const timeSize = Math.floor(value.length * 6.5 + 10);
    const idA = `${type.length},${value.length}a`;
    const idB = `${type.length},${value.length}b`;
    return (
        <svg width={textSize + timeSize} height="20" style={{ margin: '1px 4px 1px 4px' }}>
            <title>{title}</title>
            <linearGradient id={idB} x2="0" y2="100%">
                <stop offset="0" stopColor="#bbb" stopOpacity=".1" />
                <stop offset="1" stopOpacity=".1" />
            </linearGradient>
            <clipPath id={idA}>
                <rect width={textSize + timeSize} height="20" rx="3" fill="#fff" />
            </clipPath>
            <g clipPath={`url(#${idA})`}>
                <path fill="#555" d={`M0 0h${textSize}v20H0z`} />
                <path fill={color} d={`M${textSize} 0h${timeSize}v20H${textSize}z`} />
                <path fill={`url(#${idB})`} d={`M0 0h${textSize + timeSize}v20H0z`} />
            </g>
            <g
                fill="#fff"
                textAnchor="middle"
                fontFamily="DejaVu Sans,Verdana,Geneva,sans-serif"
                fontSize="110"
            >
                {/* tslint:disable-next-line:max-line-length */}
                <text
                    x={(textSize / 2) * 10}
                    y="150"
                    fill="#010101"
                    fillOpacity=".3"
                    transform="scale(.1)"
                    textLength={textSize * 10 - 100}
                >
                    {type}
                </text>
                <text
                    x={(textSize / 2) * 10}
                    y="140"
                    transform="scale(.1)"
                    textLength={textSize * 10 - 100}
                >
                    {type}
                </text>
                {/* tslint:disable-next-line:max-line-length */}
                <text
                    x={10 * textSize + timeSize * 5}
                    y="150"
                    fill="#010101"
                    fillOpacity=".3"
                    transform="scale(.1)"
                    textLength={timeSize * 10 - 100}
                >
                    {value}
                </text>
                <text
                    x={textSize * 10 + timeSize * 5}
                    y="140"
                    transform="scale(.1)"
                    textLength={timeSize * 10 - 100}
                >
                    {value}
                </text>
            </g>
        </svg>
    );
};

interface TimeBadgeProps {
    spentTime?: number;
    leftTime?: number;
}

export const TimeBadge = React.memo((props: TimeBadgeProps) => {
    const [clipState, setClipState] = React.useState('default');
    const id = React.useMemo(shortid.generate, []);
    const id1 = id + '1';
    let { spentTime = 0, leftTime = 0 } = props;
    if (leftTime < 0) {
        leftTime = 0;
    }
    if (spentTime < 0) {
        spentTime = 0;
    }

    const sSpentTime = formatTime(spentTime);
    const sEstimatedTime = formatTime(leftTime);
    const sum = spentTime + leftTime;
    const totalWidth = 168;
    const spentWidth = sum ? ((totalWidth - 100) / sum) * spentTime + 50 : 90;
    const estimatedWidth = totalWidth - spentWidth;
    const onHoverSpent = throttle(() => setClipState('spent'), 800);
    const onLeave = throttle(() => setClipState('default'), 800);
    const onHoverLeft = throttle(() => setClipState('left'), 800);
    let state = clipState;
    if (estimatedWidth < 53) {
        state = 'spent';
    } else if (spentWidth < 53) {
        state = 'left';
    }

    let transform = `translate(0 0)`;
    switch (state) {
        case 'spent':
            transform = `translate(${totalWidth} 0)`;
            break;
        case 'left':
            transform = `translate(${-totalWidth} 0)`;
            break;
    }

    return (
        <AnimeSvg
            width={totalWidth}
            height="20"
            style={{ margin: '0 0 2px 6px', fontSize: 12 }}
            onMouseLeave={onLeave}
        >
            <defs>
                <clipPath id={id}>
                    <path
                        className={'clip-path'}
                        d={`M ${spentWidth} -10 L ${spentWidth} 30 L ${totalWidth *
                            2} 30 L ${totalWidth * 2} -10 Z`}
                        fill={'white'}
                        transform={transform}
                    />
                </clipPath>
                <clipPath id={id1}>
                    <path
                        className={'clip-path'}
                        d={`M -${totalWidth} -10 H ${spentWidth} V 40 L ${-totalWidth} 30 Z`}
                        fill={'white'}
                        transform={transform}
                    />
                </clipPath>
            </defs>

            <g onMouseOver={onHoverSpent} clipPath={`url(#${id1})`}>
                <rect height={20} width={totalWidth - 50} x={50} rx={3} fill={'#b37e5b'} />
                <text
                    x={4}
                    y={10}
                    textLength={sSpentTime.length * 6.2}
                    textAnchor={'start'}
                    alignmentBaseline={'central'}
                    fill={'black'}
                >
                    {sSpentTime}
                </text>

                <text
                    className={'label'}
                    x={totalWidth - 4}
                    y={10}
                    textLength={38}
                    textAnchor={'end'}
                    alignmentBaseline={'central'}
                    fill={'white'}
                >
                    SPENT
                </text>
            </g>

            <g clipPath={`url(#${id})`} onMouseOver={onHoverLeft}>
                <rect height={20} width={totalWidth - 50} x={0} rx={3} fill={'#ddd'} />
                <text
                    className={'label'}
                    x={4}
                    y={10}
                    textLength={30}
                    textAnchor={'start'}
                    alignmentBaseline={'central'}
                    fill={'white'}
                >
                    LEFT
                </text>
                <text
                    x={spentWidth + estimatedWidth - 4}
                    y={10}
                    textLength={sEstimatedTime.length * 6.2}
                    textAnchor={'end'}
                    alignmentBaseline={'central'}
                    fill={'black'}
                >
                    {sEstimatedTime}
                </text>
            </g>
        </AnimeSvg>
    );
});
