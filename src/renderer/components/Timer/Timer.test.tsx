import React from 'react';
import Timer, { Props as TimerProps } from './Timer';
import renderer from 'react-test-renderer';
import { cloneDeep } from 'lodash';

jest.setTimeout(10000);
const defaultProps: TimerProps = {
    startTimer: () => 0,
    stopTimer: () => {},
    clearTimer: () => {},
    timerFinished: () => {},
    continueTimer: () => {},
    setFocusDuration: (d: number) => {},
    setRestDuration: (d: number) => {},

    todo: {
        todoList: []
    },
    timer: {
        isFocusing: false,
        targetTime: undefined,
        isRunning: true,
        project: undefined,
        restDuration: 30,
        focusDuration: 30
    },
    addItem: title => async dispatch => undefined,
    fetchAll: () => dispatch => dispatch,
    setContent: _id => async dispatch => undefined,
    setProject: _id => async dispatch => undefined,
    removeItem: project => dispatch => dispatch,
    project: {
        projectList: {}
    },
    setFinished: _id => dispatch => undefined,
    // @ts-ignore
    setFocus: _id => {},
    setTitle: _id => dispatch => undefined
};

describe('Timer component', () => {
    it('shows left time', async () => {
        // @ts-ignore
        const props: TimerProps = cloneDeep(defaultProps);
        props.timer.targetTime = new Date().getTime() + 30.5 * 1000;
        props.timer.isFocusing = true;
        props.timer.isRunning = true;
        const component = renderer.create(<Timer {...props} />);
        const leftTime = component.root.findByProps({ id: 'left-time-text' }).children[0];
        expect(leftTime).toEqual('00:30');
    });

    it('shows left time correctly when left > 1min', async () => {
        // @ts-ignore
        const props: TimerProps = cloneDeep(defaultProps);
        props.timer.targetTime = new Date().getTime() + 180.5 * 1000;
        props.timer.isFocusing = true;
        props.timer.isRunning = true;
        const component = renderer.create(<Timer {...props} />);
        const leftTime = component.root.findByProps({ id: 'left-time-text' }).children[0];
        expect(leftTime).toEqual('03:00');
    });

    it('will update left time as time goes by', async () => {
        // @ts-ignore
        const props: TimerProps = cloneDeep(defaultProps);
        props.timer.targetTime = new Date().getTime() + 180.5 * 1000;
        props.timer.isFocusing = true;
        props.timer.isRunning = true;
        const component = renderer.create(<Timer {...props} />);
        const leftTime = component.root.findByProps({ id: 'left-time-text' }).children[0];
        expect(leftTime).toEqual('03:00');
        await new Promise(resolve => {
            setTimeout(() => {
                const leftTime = component.root.findByProps({ id: 'left-time-text' }).children[0];
                expect(leftTime).toEqual('02:59');

                setTimeout(() => {
                    const leftTime = component.root.findByProps({ id: 'left-time-text' })
                        .children[0];
                    expect(leftTime).toEqual('02:58');
                    resolve();
                }, 1200);
            }, 1200);
        });
    });
});
