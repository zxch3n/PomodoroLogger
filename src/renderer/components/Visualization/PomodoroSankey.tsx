import * as React from 'react';
import ReactEcharts from 'echarts-for-react';
import { PomodoroRecord } from '../../monitor/type';
import { EfficiencyAnalyser } from '../../../efficiency/efficiency';
import { ColorEncoder } from './ColorEncoder';
import { cloneDeep } from 'lodash';

interface Props {
    record: PomodoroRecord;
    efficiencyAnalyser: EfficiencyAnalyser;
    showSwitch: boolean;
    width?: number;
}

const breakWord = (key: string, breaker: string = '\n', maxLength: number = 40): string => {
    if (key.length > maxLength) {
        return (
            key.slice(0, maxLength) + breaker + breakWord(key.slice(maxLength), breaker, maxLength)
        );
    }

    return key;
};

const getLinkAndNode = (
    record: PomodoroRecord,
    efficiencyAnalyser: EfficiencyAnalyser,
    showSwitch: boolean = false
) => {
    // tslint:disable-next-line:no-parameter-reassignment
    record = cloneDeep(record);
    const getStayTimeSum = (index: number) => {
        let ans = 0;
        for (let i = 0; i < record.stayTimeInSecond!.length; i += 1) {
            if (record.switchActivities![i] === index) {
                ans += record.stayTimeInSecond![i];
            }
        }

        return ans;
    };

    const indexToTitleApp: [string, string, string][] = [];
    const nodes = [];
    const links = [];

    nodes.push({
        name: 'Focused',
        itemStyle: {
            color: '#34cb23',
            borderColor: '#34cb23'
        },
        label: {
            fontWeight: 700
        }
    });
    nodes.push({
        name: 'Distracted',
        itemStyle: {
            color: '#55409c',
            borderColor: '#55409c'
        },
        label: {
            fontWeight: 700
        }
    });
    const colorEncoder = new ColorEncoder();
    for (const app in record.apps) {
        const _app = record.apps[app];
        const color = colorEncoder.getAColor();
        let appKey = app[0].toUpperCase() + app.slice(1);
        while (nodes.find(v => v.name === appKey)) {
            appKey += '[App]';
        }
        nodes.push({
            name: appKey,
            label: {
                fontWeight: 700
            },
            itemStyle: {
                color,
                borderColor: color
            }
        });
        for (const title in _app.titleSpentTime) {
            const new_title = title.replace(/-,-/g, '.');
            let key = breakWord(new_title, '\n', 24);
            if (key.length > 48) {
                key = key.slice(0, 45) + '...';
            }
            if (!_app.titleSpentTime.hasOwnProperty(title)) {
                continue;
            }

            const _title = _app.titleSpentTime[title];
            while (nodes.find(v => v.name === key)) {
                key += '.';
            }
            const value = getStayTimeSum(_title.index);
            indexToTitleApp[_title.index] = [title, app, key];
            nodes.push({
                name: key,
                label: {
                    fontSize: 12
                },
                tooltip: {
                    formatter: (params: any) => {
                        // tslint:disable-next-line:prefer-const
                        let { source, target, value: dataValue, name } = params.data;
                        if (name) {
                            return `${breakWord(new_title, '<br/>')}: ${value}`;
                        }

                        if (source === key) {
                            source = new_title;
                        } else if (target === key) {
                            target = new_title;
                        }

                        return breakWord(`${source} --- ${target}: ${dataValue}`, '<br/>');
                    }
                }
            });
            links.push({
                value,
                source: appKey,
                target: key
            });

            if (!showSwitch) {
                if (efficiencyAnalyser.getIsDistracting(app, title)) {
                    links.push({
                        target: 'Distracted',
                        source: key,
                        value: getStayTimeSum(_title.index)
                    });
                } else {
                    links.push({
                        target: 'Focused',
                        source: key,
                        value: getStayTimeSum(_title.index)
                    });
                }
            }
        }
    }

    if (showSwitch) {
        for (let i = 0; i < record.switchActivities!.length; i += 1) {
            const index = record.switchActivities![i];
            const [title, app, titleKey] = indexToTitleApp[index];
            const name = `[Activity]${i}`;
            nodes.push({
                name,
                label: {
                    show: false
                }
            });
            links.push({
                source: titleKey,
                target: name,
                value: record.stayTimeInSecond![i]
            });
            if (efficiencyAnalyser.getIsDistracting(app, title)) {
                links.push({
                    target: 'Distracted',
                    source: name,
                    value: record.stayTimeInSecond![i]
                });
            } else {
                links.push({
                    target: 'Focused',
                    source: name,
                    value: record.stayTimeInSecond![i]
                });
            }
        }
    }

    return {
        nodes,
        links
    };
};

const getOption = (props: Props) => {
    const data = getLinkAndNode(props.record, props.efficiencyAnalyser, props.showSwitch);
    return {
        title: {
            text: 'Sankey Diagram'
        },
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
        },
        series: [
            {
                type: 'sankey',
                data: data.nodes,
                links: data.links,
                focusNodeAdjacency: true,
                levels: [
                    {
                        depth: 0,
                        lineStyle: {
                            color: 'source',
                            opacity: 0.6
                        }
                    },
                    {
                        depth: 1,
                        itemStyle: {
                            color: '#b48ee3',
                            borderColor: '#b48ee3'
                        },
                        lineStyle: {
                            color: 'target',
                            opacity: 0.6
                        }
                    },
                    {
                        depth: 2,
                        itemStyle: {
                            color: '#abe38f',
                            borderColor: '#abe38f'
                        },
                        lineStyle: {
                            color: 'target',
                            opacity: 0.6
                        }
                    },
                    {
                        depth: 3,
                        lineStyle: {
                            color: 'target',
                            opacity: 0.6
                        }
                    }
                ],
                label: {
                    normal: {
                        textStyle: {
                            color: 'rgba(0,0,0,0.7)',
                            fontFamily: 'Arial',
                            fontSize: 14
                        }
                    }
                },
                lineStyle: {
                    normal: {
                        color: 'target',
                        curveness: 0.5
                    }
                },
                itemStyle: {
                    normal: {
                        color: '#1f77b4',
                        borderColor: '#1f77b4'
                    }
                }
            }
        ]
    };
};

export const PomodoroSankey = (props: Props) => {
    const [option, setOption] = React.useState(getOption(props));
    const { width = '100%' } = props;
    React.useEffect(() => {
        setOption(getOption(props));
    }, [props.record]);
    return (
        <ReactEcharts
            option={option}
            style={{
                width,
                height: '10000px',
                minHeight: '300px'
            }}
        />
    );
};
