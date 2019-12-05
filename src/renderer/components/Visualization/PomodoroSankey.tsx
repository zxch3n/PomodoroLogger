import * as React from 'react';
import ReactEcharts from 'echarts-for-react';
import { actions } from '../Timer/action';
import { PomodoroRecord } from '../../monitor/type';
import { EfficiencyAnalyser } from '../../../efficiency/efficiency';
import { ColorEncoder } from './ColorEncoder';
import { cloneDeep } from 'lodash';
import { connect } from 'react-redux';
import { RootState } from '../../reducers';
import styled from 'styled-components';
import { fatScrollBar } from '../../style/scrollbar';
import ReactHotkeys from 'react-hot-keys';
import { formatTimeHMS, formatTimeYmdHms } from './Timeline';

const FullscreenStyled = styled.div`
    padding: 20px;
    position: fixed;
    z-index: 500;
    left: 0;
    top: 0;
    overflow: auto;
    background-color: rgba(255, 255, 255, 0.98);
    width: 100%;
    height: 100vh;
    ${fatScrollBar}
`;

const InnerContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Header = styled.div`
    margin-top: 20px;
    h1,
    h2,
    h3,
    h4,
    h5 {
        margin: 0;
        text-align: center;
    }

    h4 {
        color: #7f7f7f;
    }

    h5 {
        color: #7f7f7f;
        font-size: 10px;
    }
`;

interface Props {
    record?: PomodoroRecord;
    boardName?: string;
    efficiencyAnalyser: EfficiencyAnalyser;
    showSwitch: boolean;
    width?: number;
    cancel?: () => void;
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
                    show: value > 30,
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
    const data = getLinkAndNode(props.record!, props.efficiencyAnalyser, props.showSwitch);
    return {
        title: {
            text: ''
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
    if (props.record == null) {
        return <></>;
    }

    const [option, setOption] = React.useState(getOption(props));
    const { width = '100%' } = props;
    React.useEffect(() => {
        setOption(getOption(props));
    }, [props.record]);
    const onKeyDown = (keyname: string) => {
        switch (keyname) {
            case 'enter':
            case 'esc':
                if (props.cancel) {
                    props.cancel();
                }
                break;
        }
    };
    return (
        <FullscreenStyled onClick={props.cancel}>
            <ReactHotkeys keyName={'esc,enter'} onKeyDown={onKeyDown} />
            <InnerContainer>
                <Header>
                    <h1>Sankey Diagram</h1>
                    <h2>{props.boardName}</h2>
                    <h4>{formatTimeYmdHms(props.record!.startTime)}</h4>
                    <h5>(Click Anywhere to Exit)</h5>
                </Header>
                <ReactEcharts
                    option={option}
                    style={{
                        width,
                        height: 'calc(100vh - 40px)',
                        minHeight: '800px'
                    }}
                />
            </InnerContainer>
        </FullscreenStyled>
    );
};

export const ConnectedPomodoroSankey = connect(
    (state: RootState): Props => {
        const record = state.timer.chosenRecord;
        const board = record && record.boardId ? state.kanban.boards[record.boardId] : undefined;
        return {
            showSwitch: false,
            efficiencyAnalyser: new EfficiencyAnalyser(state.timer.distractingList),
            record: state.timer.chosenRecord,
            boardName: board ? board.name : undefined
        };
    },
    dispatch => ({
        cancel: () => dispatch(actions.setChosenRecord(undefined))
    })
)(PomodoroSankey);
