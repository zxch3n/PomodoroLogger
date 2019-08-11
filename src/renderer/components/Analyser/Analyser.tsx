import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, Card, Col, Progress, Row, Statistic, message } from 'antd';
import { RootState } from '../../reducers';
import { HistoryActionCreatorTypes } from '../History/action';
import Worker from 'worker-loader!./train.worker';

const Container = styled.div`
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    padding: 2em;
`;

interface Props extends RootState, HistoryActionCreatorTypes {}
export const Analyser: React.FC<Props> = (props: Props) => {
    const [acc, setAcc] = useState<undefined | number>(undefined);
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const worker = new Worker();
    useEffect(() => {
        worker.onmessage = ({ data: { type, payload } }) => {
            if (type === 'setProgress') {
                setProgress(payload);
                if (payload >= 100) {
                    setIsTraining(false);
                }
            } else if (type === 'setAcc') {
                setAcc(payload);
            } else if (type === 'log') {
                console.log(payload);
            } else if (type === 'error') {
                message.error(payload);
            }
        };
    }, []);
    const onTrain = async () => {
        console.log(`Training ${props.history.records.length} samples`);
        if (isTraining) {
            return;
        }

        setIsTraining(true);
        setProgress(0);
        worker.postMessage('startTraining');
    };

    return (
        <Container>
            <Row gutter={16} style={{ marginBottom: 10 }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Accuracy"
                            value={acc === undefined ? 'Unknown' : acc}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>
            <Button onClick={onTrain} loading={isTraining}>
                Train
            </Button>
            <Progress percent={progress} size="small" />
        </Container>
    );
};
