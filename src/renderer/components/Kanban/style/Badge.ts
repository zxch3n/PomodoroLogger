import styled from 'styled-components';

export const BadgeHolder = styled.div`
    min-height: 20px;
    line-height: 12px;

    &.collapsed {
        transform-origin: 0 50%;
        transform: scale(0.93, 0.93);
        min-height: 0;

        & > .pomodoro-dot {
            transform-origin: 50% 50%;
            transform: scale(0.9, 0.9);
        }

        & > svg:first-child:not(.pomodoro-dot) {
            margin-left: 0 !important;
        }
    }
`;
