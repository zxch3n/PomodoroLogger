import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, Card, Col, Progress, Row, Statistic } from 'antd';
import { ipcRenderer } from 'electron';
import { RootState } from '../../reducers';
import { HistoryActionCreatorTypes } from '../History/action';

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
    useEffect(() => {
        ipcRenderer.on('setTrainProgress', (progress: number) => {
            setProgress(progress);
            if (progress >= 100) {
                setIsTraining(true);
            }
        });
        ipcRenderer.on('setTrainAcc', setAcc);
    }, []);
    const onTrain = async () => {
        console.log(`Training ${props.history.records.length} samples`);
        if (isTraining) {
            return;
        }

        setIsTraining(true);
        ipcRenderer.send('startTrain');
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
