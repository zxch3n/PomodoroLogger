import React, { FC, useEffect, useRef, useState } from 'react';
import PointerIcon from '../../../res/pointer-left.svg';
import styled, {keyframes} from 'styled-components';
import { getElementAbsoluteOffsetById } from './utils';

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

const AnimationG = styled.g`
  animation: ${animation} 1s infinite;
`;

const NormalG = styled.g``;


export interface PointerProps {
    direction?: number; // radian
    show?: boolean;
    animate?: boolean;
    targetDomId: string;
}


export const Pointer: FC<PointerProps> = (props: PointerProps) => {
    const {direction=0, show=true, animate=true, targetDomId} = props;
    const [xy, setXy] = useState([0, 0]);
    const [wh, setWh] = useState([0, 0]);
    const ref = useRef<SVGElement>();
    const updatePosition = () => {
        const [x, y, w, h] = getElementAbsoluteOffsetById(targetDomId);
        setWh([w, h]);
        setXy([x + w/2, y + h/2]);
    };

    useEffect(()=>{
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return ()=>{
            window.removeEventListener('resize', updatePosition);
        }
    }, []);

    const Wrapper = animate? AnimationG : NormalG;
    return (
        <svg
            // @ts-ignore
            ref={ref}
            style={{
                position: 'fixed',
                left: xy[0],
                top: xy[1],
                display: show? undefined : 'none'
            }}
            transform={`rotate(${direction}rad) translate(${wh[0] + wh[1]} 0)`}
        >
            <Wrapper>
                <PointerIcon/>
            </Wrapper>
        </svg>
    )
};
