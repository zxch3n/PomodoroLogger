import styled from 'styled-components';
import * as React from 'react';

const Svg = styled.svg`
    user-select: none;
    transition: transform 0.2s;
    :hover {
        transform: scale(1.4);
    }
`;

interface Props {
    num: number;
}

function formatThousand(num: number) {
    if (num < 1000) {
        return Math.floor(num);
    }

    const thousand = Math.floor(num / 1000);
    const hundred = Math.floor(num / 100) % 10;
    if (hundred === 0) {
        return thousand + 'k';
    }

    return `${thousand}.${hundred}k`;
}

export const PomodoroDot: React.FC<Props> = props => {
    const num = formatThousand(props.num);
    return (
        <Svg
            width="20"
            height="20"
            style={{ margin: '1px 4px 1px 4px', cursor: 'pointer' }}
            viewBox={'0 0 28 28'}
        >
            <title>{`${props.num} Pomodoros`}</title>
            <circle cx={14} cy={14} r={14} fill={'#ca6129'} />
            <text
                x={14}
                y={13.5}
                textAnchor={'middle'}
                alignmentBaseline={'central'}
                fill="rgba(0, 0, 0, 0.2)"
            >
                {num}
            </text>
            <text
                x={14}
                y={12.5}
                textAnchor={'middle'}
                alignmentBaseline={'central'}
                fill={'white'}
            >
                {num}
            </text>
        </Svg>
    );
};
