import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import 'antd/dist/antd.css';
import Timer from './Timer';
import TODO from './TODO';
import styled from 'styled-components';

const Main = styled.div`
    padding: 10px;
`;

const Application = () => (
    <Main>
        <Timer />
    </Main>
);

export default hot(Application);
