import React from 'react';

export interface Props {
    type: string;
    color?: string;
    value: string;
    title?: string;
}

export const Badge = (props: Props) => {
    const { color="#32d31f", type, value, title } = props;
    const textSize = Math.floor(props.type.length * 6.5 + 10);
    const timeSize = Math.floor(value.length * 6.5 + 10);
    const idA = `${type.length},${value.length}a`;
    const idB = `${type.length},${value.length}b`;
    return (
        <svg width={textSize + timeSize} height="20" style={{ margin: '1px 4px 1px 4px' }} >
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
