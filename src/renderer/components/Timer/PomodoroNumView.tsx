import * as React from 'react';
import { Col, Row } from 'antd';

interface Props {
    num: number;
    color?: string;
    showNum?: boolean;
    animation?: boolean;
}

interface State {
    transform: { x: number; y: number }[];
}

export class PomodoroNumView extends React.Component<Props> {
    state: State = { transform: [] };
    iFrame: number = 0;
    update = () => {
        if (this.props.num < 2 || !this.props.animation) {
            return;
        }

        this.iFrame += 1;
        const newTransform = Array(this.props.num)
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

    render() {
        const { color = 'red', showNum = true, num, animation = false } = this.props;
        const { transform } = this.state;
        const dots = Array.from(Array(num).keys()).map((v, index) => (
            <svg
                key={v}
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
                <circle r={50} cx={50} cy={50} color={color}>
                    <title>{`Completed ${num} pomodoros today`}</title>
                </circle>
            </svg>
        ));
        if (showNum) {
            return (
                <Row style={{ padding: 12 }}>
                    <Col span={4} style={{ lineHeight: '1em' }}>
                        <h4>{num}</h4>
                    </Col>
                    <Col span={20} style={{ color: 'red' }}>
                        {dots}
                    </Col>
                </Row>
            );
        }

        return <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>{dots}</div>;
    }
}
