import React, { FC, useEffect, useRef, useState } from 'react';
import PointerIcon from '../../../res/pointer-left.svg';
import styled, { keyframes, css } from 'styled-components';
import { getElementAbsoluteOffsetBySelector } from './utils';

const animation = keyframes`
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(1rem);
  }
  100% {
    transform: translateX(0);
  }
`;

const Animation = styled.div`
    animation: ${animation} 1s infinite;
`;

const Normal = styled.div``;
export interface PointerProps {
    direction?: number; // radian
    show?: boolean;
    animate?: boolean;
    targetSelector: string;
}

export const Pointer: FC<PointerProps> = (props: PointerProps) => {
    const { direction = 0, show = true, animate = true, targetSelector } = props;
    const [xy, setXy] = useState([0, 0]);
    const [wh, setWh] = useState([0, 0]);
    const ref = useRef<SVGElement>();
    const updatePosition = () => {
        try {
            const [x, y, w, h] = getElementAbsoluteOffsetBySelector(targetSelector);
            setWh([w, h]);
            setXy([x + w / 2, y + h / 2]);
        } catch (e) {
            console.error('cannot find', targetSelector);
            setXy([-1000, -1000]);
        }
    };

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('resize', updatePosition);
        };
    }, [targetSelector]);

    const Wrapper = animate ? Animation : Normal;
    return (
        <div
            // @ts-ignore
            ref={ref}
            style={{
                position: 'fixed',
                left: xy[0],
                top: xy[1],
                display: show ? undefined : 'none',
                zIndex: 2003,
                transform: `rotate(${direction}rad)`,
                transition: 'transform 0.3s'
            }}
        >
            <Wrapper>
                <PointerIcon
                    style={{
                        fontSize: 48,
                        fill: 'white',
                        transform: `translate(16px, ${Math.cos(direction * 2) * -16}px)`,
                        transition: 'transform 0.3s'
                    }}
                />
            </Wrapper>
        </div>
    );
};
