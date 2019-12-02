import * as React from 'react';
import { Col, Row } from 'antd';
import { PomodoroRecord } from '../../monitor/type';
import styled, { keyframes } from 'styled-components';
import { generateRandomName, to2digits } from '../../utils';
import shortid from 'shortid';

const SvgDot = styled.svg`
    transition: transform 0.1s cubic-bezier(0.17, 0.67, 0.96, 0.59);
    :hover {
        transform: scale(1.2);
    }
`;

const Div = styled.div`
    transition: transform 0.1s cubic-bezier(0.17, 0.67, 0.96, 0.59);
    transform: scale(0.9);
    :hover {
        transform: scale(1);
    }
`;

const scale = keyframes`
  0% {
    transform: scale(1.1);
    opacity: 1;
  }
  
  30% {
    transform: scale(1.4);
    opacity: 0.7;
  }
  
  40% {
    transform: scale(1.6);
    opacity: 0.4;
  }
  
  50% {
    transform: scale(1.4);
    opacity: 0.7;
  }
  
  60% {
    transform: scale(1.6);
    opacity: 0.4;
  }
  
  65% {
    transform: scale(1.4);
    opacity: 0.7;
  }
  
  100% {
    transform: scale(1.1);
    opacity: 1;
  }

`;

const AnimeSvgDot = styled(SvgDot)`
    animation: ${scale} 1s linear infinite;
`;

interface Props {
    pomodoros: PomodoroRecord[];
    color?: string;
    showNum?: boolean;
    animation?: boolean;
    newPomodoro?: PomodoroRecord;
}

interface State {
    transform: { x: number; y: number }[];
}

function getTime(date: number) {
    const d = new Date(date);
    return `${to2digits(d.getHours())}:${to2digits(d.getMinutes())}`;
}

export class PomodoroNumView extends React.Component<Props> {
    state: State = { transform: [] };
    iFrame: number = 0;
    key: string;

    constructor(props: Props) {
        super(props);
        this.key = shortid.generate();
    }

    update = () => {
        if (this.props.pomodoros.length < 2 || !this.props.animation) {
            return;
        }

        this.iFrame += 1;
        const newTransform = Array(this.props.pomodoros.length)
            .fill(0)
            .map(() => ({ x: 0, y: 0 }));
        switch (this.iFrame % 4) {
            case 0:
                newTransform[0].x = -15;
                newTransform[0].y = -4;
                break;
            case 1:
                break;
            case 2:
                newTransform[newTransform.length - 1].x = 15;
                newTransform[newTransform.length - 1].y = -4;
                break;
            case 3:
                break;
        }

        this.setState({ transform: newTransform });
    };

    componentDidMount() {
        setInterval(this.update, 500);
    }

    createDot = (v: PomodoroRecord, index: number, isNew: boolean = false) => {
        const { color = 'red', animation = false } = this.props;
        const { transform } = this.state;
        const Svg = isNew ? AnimeSvgDot : SvgDot;
        return (
            <Svg
                key={v._id}
                width="1em"
                height="1em"
                fill="currentColor"
                focusable="false"
                viewBox="0 0 100 100"
                style={{
                    margin: '0.1em',
                    transition: 'transform 0.2s',
                    transitionTimingFunction: 'ease',
                    transform:
                        animation && transform[index]
                            ? `translate(${transform[index].x}px, ${transform[index].y}px)`
                            : undefined
                }}
            >
                <defs>
                    <circle
                        r={v.efficiency != null ? (1 - v.efficiency) * 48 : 0}
                        cx={50}
                        cy={50}
                        id={`dmusk${this.key + v._id}`}
                    />
                </defs>
                <mask id={`musk${this.key + v._id}`}>
                    <rect id="bg" x="0" y="0" width="100%" height="100%" fill="white" />
                    <use xlinkHref={`#dmusk${this.key + v._id}`} fill="Black" />
                </mask>
                <circle r={50} cx={50} cy={50} color={color} mask={`url(#musk${this.key + v._id})`}>
                    <title>
                        {(isNew ? '[New]' : getTime(v.startTime)) +
                            (v.efficiency != null
                                ? ` Efficiency: ${Math.round(v.efficiency * 100)}%`
                                : '')}
                    </title>
                </circle>
            </Svg>
        );
    };

    render() {
        const { showNum = true, pomodoros, newPomodoro } = this.props;
        const dots = pomodoros.map((v, index) => this.createDot(v, index));
        if (newPomodoro != null) {
            dots.push(this.createDot(newPomodoro, dots.length, true));
        }

        if (showNum) {
            return (
                <Row style={{ padding: 12 }}>
                    <Col span={4} style={{ lineHeight: '1em' }}>
                        <h4>{pomodoros.length}</h4>
                    </Col>
                    <Col span={20} style={{ color: 'red' }}>
                        {dots}
                    </Col>
                </Row>
            );
        }

        return (
            <Div
                style={{ padding: 12, display: 'flex', justifyContent: 'center' }}
                title={`Completed ${pomodoros.length} pomodoros today`}
            >
                {dots}
            </Div>
        );
    }
}
