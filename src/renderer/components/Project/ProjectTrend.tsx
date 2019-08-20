import React from 'react';
import styled from 'styled-components';
// @ts-ignore
import Trend from 'react-trend';

const Container = styled.div``;

interface Props {
    width?: number;
    data: number[];
}

export const ProjectTrend: React.FC<Props> = (props: Props) => {
    return (
        <Container style={{ width: props.width }}>
            <Trend
                smooth={true}
                autoDraw={true}
                autoDrawDuration={3000}
                autoDrawEasing="ease-out"
                data={props.data}
                gradient={['#00c6ff', '#F0F', '#FF0']}
                radius={10.1}
                strokeWidth={1.5}
                strokeLinecap={'butt'}
                maxData={16}
            />
        </Container>
    );
};
