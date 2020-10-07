```tsx
import { MiniLogger } from './MiniLogger';
import React from 'react';

let timer;

const Demo = () => {
    const [timePercentage, setTimePercentage] = React.useState(['25', 0]);
    const [isRunning, setIsRunning] = React.useState(false);
    const [isFocusing, setIsFocusing] = React.useState(true);
    return (
        <MiniLogger
            clear={() => {
                clearInterval(timer);
                setIsRunning(false);
                setTimePercentage(['5', 0]);
            }}
            done={() => {
                clearInterval(timer);
                setTimePercentage(['5', 0]);
                setIsRunning(false);
            }}
            switch={() => {
                setIsFocusing((v) => !v);
                if (timePercentage[0] === '25') {
                    setTimePercentage(['5', 0]);
                } else {
                    setTimePercentage(['25', 0]);
                }
                setIsRunning(false);
            }}
            play={() => {
                setIsRunning(true);
                clearInterval(timer);
                timer = setInterval(() => {
                    setTimePercentage((timePercentage) => {
                        const time = parseInt(timePercentage[0]) - 1;
                        const percentage = (25 - time) / 25;
                        setTimePercentage([time.toString(), percentage]);
                    });
                }, 1000);
            }}
            pause={() => {
                clearInterval(timer);
                setIsRunning(false);
            }}
            time={timePercentage && timePercentage[0]}
            percentage={timePercentage && timePercentage[1]}
            isRunning={isRunning}
            isFocusing={isFocusing}
            task="完成 MiniLogger 功能"
            style={{ width: 300 }}
        />
    );
};

<Demo />;
```
