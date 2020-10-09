import { Button } from 'antd';
import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { PomodoroRecord } from '../../../renderer/monitor/type';

const fadeIn = keyframes`
    0% {
        opacity: 1;
        transform: scale(1.1);
    }

    20% {
        opacity: 0.2;
        transform: scale(1);
    }

    100% {
        opacity: 0.2;
    }
`;

const emphasize = keyframes`
    0% {
        transform: scale(1);
    }

    70% {
        transform: scale(1);
    }

    75% {
        transform: scale(1.1) rotate(-15deg);
    }

    80% {
        transform: scale(1.05) rotate(15deg);
    }

    85% {
        transform: scale(1.1) rotate(-15deg);
    }

    90% {
        transform: scale(1.05) rotate(15deg);
    }

    95% {
        transform: scale(1.1);
    }
`;

interface LineProps {
    anime: boolean;
}

const Line = styled.line<LineProps>`
    ${({ anime }) =>
        anime
            ? css`
                  animation: ${fadeIn} 800ms linear infinite;
              `
            : ''}
`;

const StateDiv = styled.div<LineProps>`
    ${({ anime }) =>
        anime
            ? css`
                  animation: ${emphasize} 1600ms linear infinite;
              `
            : ''}

    font-weight: 700;
    margin: 0 2px 0 4px;
    color: #555;
    flex-shrink: 0;
    text-align: right;
`;

const StyledLogger = styled.div`
    height: 42px;
    padding: 0 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;

    * {
        user-select: none;
    }

    & > svg {
        flex-shrink: 0;
        flex-grow: 0;
        margin: 0 4px;
        filter: grayscale(0.5);
    }

    button {
        margin: 0 4px;
        flex-shrink: 0;
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
    confirm: () => void;
    confirmAndStartNextSession: () => void;
    extendCurrentSession: (minute: number) => void;
    time: string;
    percentage: number;
    isRunning: boolean;
    isFocusing: boolean;
    isConfirming: boolean;
    task: string;
    style?: React.CSSProperties;
    stagedPomodoro?: PomodoroRecord;
}

export class MiniLogger extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    clear = () => {
        this.setState({ percentage: 0 });
        this.props.clear();
    };

    extend5Minutes = () => {
        this.props.extendCurrentSession(5);
    };

    extend10Minutes = () => {
        this.props.extendCurrentSession(10);
    };

    private getButtonRow(): React.ReactNode {
        const {
            style,
            isRunning,
            play,
            pause,
            time,
            percentage,
            isFocusing,
            isConfirming,
            confirmAndStartNextSession,
        } = this.props;
        return isConfirming ? (
            <>
                <Button
                    icon="caret-right"
                    onClick={confirmAndStartNextSession}
                    title={'Start Next Session'}
                />
                <Button icon="check" title="Done" onClick={this.props.confirm} />
                {isFocusing && (
                    <>
                        <Button
                            onClick={this.extend5Minutes}
                            style={{ padding: '0 8px' }}
                            title={'Extend 5 minutes'}
                        >
                            +5
                        </Button>
                        <Button
                            onClick={this.extend10Minutes}
                            style={{ padding: '0 8px' }}
                            title={'Extend 10 minutes'}
                        >
                            +10
                        </Button>
                    </>
                )}
            </>
        ) : (
            <>
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
            </>
        );
    }

    render() {
        const { style, time, percentage, isFocusing, isConfirming } = this.props;
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
                                <Line
                                    anime={isConfirming}
                                    y1="0"
                                    y2="12"
                                    x1="50"
                                    x2="50"
                                    style={{
                                        stroke: isConfirming
                                            ? 'rgb(99, 99, 99)'
                                            : i / 18 < percentage
                                            ? 'rgb(200, 200, 200)'
                                            : 'rgb(99,99,99)',
                                        strokeWidth: 12,
                                        animationDelay: i * (800 / 18) + 'ms',
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
                        {isConfirming ? (isFocusing ? '🍅' : '') : time}
                    </text>
                </svg>
                {this.getButtonRow()}
                <div className="task" style={{ margin: 4 }} title={this.props.task}>
                    {this.props.task}
                </div>
                <StateDiv
                    anime={isConfirming}
                    onClick={() => (this.props.isConfirming ? this.props.confirm() : undefined)}
                >
                    {isConfirming ? 'Done!' : isFocusing ? 'Working' : 'Break'}
                </StateDiv>
            </StyledLogger>
        );
    }
}
