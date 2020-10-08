import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const StyledLogger = styled.div`
    height: 42px;
    padding: 0 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid #ddd;
    border-radius: 4px;

    & > svg {
        flex-shrink: 0;
        flex-grow: 0;
        margin: 0 4px;
    }

    button {
        margin: 0 4px;
        flex-shrink: 0;
    }

    & > div.state {
        font-weight: 700;
        margin: 0 2px 0 4px;
        color: #555;
        flex-shrink: 0;
        text-align: right;
    }

    & > div.task {
        color: #777;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

interface Props {
    play: () => void;
    pause: () => void;
    done: () => void;
    clear: () => void;
    switch: () => void;
    expand: () => void;
    time: string;
    percentage: number;
    isRunning: boolean;
    isFocusing: boolean;
    task: string;
    style?: React.CSSProperties;
}

export class MiniLogger extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    clear = () => {
        this.setState({ percentage: 0 });
        this.props.clear();
    };

    render() {
        const { style, isRunning, play, pause, time, percentage, isFocusing } = this.props;
        return (
            <StyledLogger style={style}>
                <svg viewBox="0 0 100 100" width="28px" height="28px">
                    {Array(18)
                        .fill(0)
                        .map((_, i) => (
                            <g
                                key={i}
                                transform={`translate(50 50) rotate(${20 * i}) translate(-50 -50)`}
                            >
                                <line
                                    y1="0"
                                    y2="12"
                                    x1="50"
                                    x2="50"
                                    style={{
                                        stroke:
                                            i / 18 < percentage
                                                ? 'rgb(200, 200, 200)'
                                                : 'rgb(99,99,99)',
                                        strokeWidth: 12,
                                    }}
                                />
                            </g>
                        ))}
                    <text
                        x="50"
                        y="64"
                        textAnchor="middle"
                        fontSize="40"
                        style={{ fill: 'rgb(99,99,99)' }}
                    >
                        {time}
                    </text>
                </svg>
                {isRunning ? (
                    <Button icon="pause" onClick={pause} />
                ) : (
                    <Button icon="caret-right" onClick={play} />
                )}
                {percentage === 0 ? (
                    <Button icon="swap" title="Switch Mode" onClick={this.props.switch} />
                ) : (
                    <Button icon="check" title="Done" onClick={this.props.done} />
                )}
                <Button icon="close" title="Clear" onClick={this.clear} />
                <Button icon="fullscreen" title="Expand" onClick={this.props.expand} />
                <div className="task" style={{ margin: 4 }}>
                    {this.props.task}
                </div>
                <div className="state">{isFocusing ? 'Working' : 'Break'}</div>
            </StyledLogger>
        );
    }
}
