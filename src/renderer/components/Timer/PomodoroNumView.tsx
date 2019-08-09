import * as React from 'react';
import { Col, Row } from 'antd';

interface Props {
    num: number;
    color?: string;
    showNum?: boolean;
}

export const PomodoroNumView: React.FC<Props> = (props: Props) => {
    const { color = 'red', showNum = true } = props;
    const dots = Array.from(Array(props.num).keys()).map(v => (
        <svg
            key={v}
            width="1em"
            height="1em"
            fill="currentColor"
            focusable="false"
            viewBox="0 0 100 100"
            style={{ margin: '0.1em' }}
        >
            <circle r={50} cx={50} cy={50} color={color}>
                <title>{`Completed ${props.num} pomodoros today`}</title>
            </circle>
        </svg>
    ));
    if (showNum) {
        return (
            <Row style={{ padding: 12 }}>
                <Col span={4} style={{ lineHeight: '1em' }}>
                    <h4>{props.num}</h4>
                </Col>
                <Col span={20} style={{ color: 'red' }}>
                    {dots}
                </Col>
            </Row>
        );
    }

    return <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>{dots}</div>;
};
