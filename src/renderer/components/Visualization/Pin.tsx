import * as React from 'react';
import PinSvg from '../../../res/pin.svg';
import { Icon } from 'antd';
import styled from 'styled-components';

const RoundedContainer = styled.button``;

const Container = styled.div`
    display: inline-block;
`;

interface Props {
    isPin: boolean;
    isHover?: boolean;
    isRounded?: boolean;
    onClick?: () => void;
    style?: any;
}

export const Pin: React.FC<Props> = (props: Props) => {
    const [isHover, setIsHover] = React.useState(false);
    const { isRounded = false } = props;
    let color = '#555';
    if (isHover) {
        if (props.isPin) color = '#ee3500';
        if (!props.isPin) color = '#666';
    } else {
        if (props.isPin) color = 'rgb(141, 84, 61)';
        if (!props.isPin) color = '#444';
    }

    const onClick = (e: any) => {
        if (props.onClick) {
            props.onClick();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }
    };

    const C = isRounded ? RoundedContainer : Container;

    return (
        <C
            className={
                isRounded
                    ? 'ant-btn ant-btn-default ant-btn-circle ant-btn-sm ant-btn-icon-only'
                    : ''
            }
            style={{ ...props.style, color }}
            onMouseEnter={React.useCallback(() => setIsHover(true), [])}
            onMouseLeave={React.useCallback(() => setIsHover(false), [])}
            onClick={onClick}
        >
            <Icon
                component={PinSvg}
                style={{
                    transform: `rotate(${(props.isPin ? 0 : 45) + (isHover ? 8 : 0)}deg)`,
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    opacity: isRounded || props.isPin || isHover || props.isHover ? 1 : 0
                }}
            />
        </C>
    );
};
