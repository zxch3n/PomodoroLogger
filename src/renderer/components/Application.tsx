import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import "antd/dist/antd.css"

import Timer from './Timer';
import TODO from './TODO';

const Application = () => (
    <div>
        <Timer/>
        <TODO/>
    </div>
        
);

export default hot(Application);
