import * as React from 'react';
import { PomodoroRecord } from '../../monitor/type';
import { getTimeSpentDataFromRecords, TimeSpentData } from '../History/op';
import { Loading } from '../utils/Loading';
import { DualPieChart, Props } from '../../../components/Visualization/DualPieChart';

interface PomodoroPieChartProps extends Partial<Props> {
    pomodoros: PomodoroRecord[];
}

export const PomodoroDualPieChart: React.FC<PomodoroPieChartProps> = (
    props: PomodoroPieChartProps
) => {
    const { pomodoros, ...restProps } = props;
    const [timeSpent, setTimeSpent] = React.useState<TimeSpentData>({
        projectData: [],
        appData: [],
    });
    const [isLoading, setIsLoading] = React.useState(true);
    React.useEffect(() => {
        getTimeSpentDataFromRecords(pomodoros).then((v) => {
            setTimeSpent(v);
            setIsLoading(false);
        });
    }, [pomodoros]);

    return isLoading ? (
        <Loading size={'large'} height={400} />
    ) : (
        <DualPieChart {...timeSpent} {...restProps} />
    );
};
