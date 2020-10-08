import ReactEcharts from 'echarts-for-react';
import * as React from 'react';

export interface Props {
    width?: number;
    projectData: { name: string; value: number }[];
    appData: { name: string; value: number }[];
    onProjectClick?: (project: string) => void;
}

function getOption(props: Props) {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
            orient: 'vertical',
            // @ts-ignore
            x: 'left',
            data: props.appData.map((v) => v.name).concat(props.projectData.map((v) => v.name)),
        },
        series: [
            {
                name: 'Project Hours',
                type: 'pie',
                selectedMode: 'single',
                radius: [0, '30%'],

                label: {
                    normal: {
                        position: 'inner',
                    },
                },
                labelLine: {
                    normal: {
                        show: false,
                    },
                },
                data: props.projectData,
            },
            {
                name: 'Application Hours',
                type: 'pie',
                radius: ['40%', '55%'],
                label: {
                    normal: {
                        formatter: '{a|{a}}{abg|}\n{hr|}\n  {b|{b}：}{c}  {per|{d}%}  ',
                        backgroundColor: '#eee',
                        borderColor: '#aaa',
                        borderWidth: 1,
                        borderRadius: 4,
                        rich: {
                            a: {
                                color: '#999',
                                lineHeight: 22,
                                align: 'center',
                            },
                            hr: {
                                borderColor: '#aaa',
                                width: '100%',
                                borderWidth: 0.5,
                                height: 0,
                            },
                            b: {
                                fontSize: 16,
                                lineHeight: 33,
                            },
                            per: {
                                color: '#eee',
                                backgroundColor: '#334455',
                                padding: [2, 4],
                                borderRadius: 2,
                            },
                        },
                    },
                },
                data: props.appData,
            },
        ],
    };

    return option;
}

export const DualPieChart: React.FC<Props> = (props: Props) => {
    const [option, setOption] = React.useState(getOption(props));
    const { width = 800 } = props;
    React.useEffect(() => {
        setOption(getOption(props));
    }, [props.appData, props.projectData]);
    return <ReactEcharts option={option} lazyUpdate={true} style={{ width, height: 400 }} />;
};
