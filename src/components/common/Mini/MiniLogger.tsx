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

    div.task {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

interface Props {
    play: () => void;
    pause: () => void;
    getTime: () => [string, number];
    isRunning: boolean;
    isFocusing: boolean;
    task: string;
    style?: React.CSSProperties;
}

interface State {
    time: string;
    percentage: number;
}

export class MiniLogger extends React.Component<Props, State> {
    private _interval: number | undefined;

    constructor(props: Props) {
        super(props);
        this.state = {
            time: '',
            percentage: 0,
        };
    }

    componentDidMount() {
        this._interval = window.setInterval(() => {
            const [time, percentage] = this.props.getTime();
            this.setState({ time, percentage });
        }, 500);
    }

    componentDidCatch() {
        window.clearInterval(this._interval);
    }

    componentWillUnmount() {
        window.clearInterval(this._interval);
    }

    render() {
        const { time, percentage } = this.state;
        const { style, isRunning, play, pause } = this.props;
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
                                    y2="14"
                                    x1="50"
                                    x2="50"
                                    style={{
                                        stroke:
                                            i / 18 < percentage
                                                ? 'rgb(200, 200, 200)'
                                                : 'rgb(99,99,99)',
                                        strokeWidth: 6,
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
                    <Button icon="pause" onClick={play} />
                ) : (
                    <Button icon="caret-right" onClick={pause} />
                )}
                <Button icon="check" />
                <div className="task" style={{ margin: 4 }}>
                    {this.props.task}
                </div>
            </StyledLogger>
        );
    }
}
