import * as React from 'react';
import styled from 'styled-components';
import echarts, { ECharts, EChartOption } from 'echarts';

const Container = styled.div`
    margin: 0 auto;
    display: flex;
    justify-content: center;
`;

interface Props {
    width?: number;
    projectData: [{ name: string; value: number }];
    appData: [{ name: string; value: number }];
}

export const DualPieChart: React.FC<any> = (props: Props) => {
    const { width = 800 } = props;
    const container = React.useRef<HTMLDivElement>();
    let chart: undefined | ECharts = undefined;
    React.useEffect(() => {
        if (container.current === undefined) {
            throw new Error();
        }

        chart = echarts.init(container.current);
        const option: EChartOption = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                x: 'left',
                data: props.appData.map(v => v.name).concat(props.projectData.map(v => v.name))
            },
            series: [
                {
                    name: 'Project Hours',
                    type: 'pie',
                    selectedMode: 'single',
                    radius: [0, '30%'],

                    label: {
                        normal: {
                            position: 'inner'
                        }
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    data: props.projectData
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
                                    align: 'center'
                                },
                                hr: {
                                    borderColor: '#aaa',
                                    width: '100%',
                                    borderWidth: 0.5,
                                    height: 0
                                },
                                b: {
                                    fontSize: 16,
                                    lineHeight: 33
                                },
                                per: {
                                    color: '#eee',
                                    backgroundColor: '#334455',
                                    padding: [2, 4],
                                    borderRadius: 2
                                }
                            }
                        }
                    },
                    data: props.appData
                }
            ]
        };
        chart.setOption(option);
    });

    return (
        <Container
            // @ts-ignore
            ref={container}
            style={{ width, height: (width - 80) * 0.8 }}
        />
    );
};
