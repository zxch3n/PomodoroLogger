import { Story } from './type';

export const timerStories: Story[] = [
    {
        name: 'start-timer',
        useMask: true,
        pointerTargetSelector: '#start-timer-button',
        hint: 'Click start button to start timer',
        hasConfirm: false
    },
    {
        name: 'pause-timer',
        useMask: true,
        pointerTargetSelector: '#start-timer-button',
        hasConfirm: false,
        hint: 'Click again to pause'
    },
    {
        name: 'clear-timer',
        useMask: true,
        pointerTargetSelector: '#clear-timer-button',
        hasConfirm: false,
        hint: 'You can reset the timer here'
    },
    {
        name: 'more-in-timer',
        useMask: true,
        pointerTargetSelector: '#more-timer-button',
        hasConfirm: false,
        hint: 'Click this button to see visualizations charts'
    }
];

export const kanbanStories: Story[] = [
    {
        name: 'kanban',
        useMask: true,
        pointerTargetSelector: '.ant-tabs-nav div:nth-child(2)',
        pointerDirection: Math.PI / 2,
        hint: "Let's switch to kanban board",
        hasConfirm: false
    }
];

export const allStories: Story[] = timerStories.concat(kanbanStories);
