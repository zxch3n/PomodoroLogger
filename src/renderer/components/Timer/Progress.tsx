import * as PropTypes from 'prop-types';
import * as React from 'react';
import classNames from 'classnames';
import { ConfigConsumer, ConfigConsumerProps } from 'antd/lib/config-provider';
import { tuple } from 'antd/lib/_util/type';
import Circle from 'antd/lib/progress/Circle';

const ProgressTypes = tuple('line', 'circle', 'dashboard');
export type ProgressType = (typeof ProgressTypes)[number];
const ProgressStatuses = tuple('normal', 'exception', 'active', 'success');
export type ProgressSize = 'default' | 'small';
export type StringGradients = { [percentage: string]: string };
type FromToGradients = { from: string; to: string };
export type ProgressGradient = { direction?: string } & (StringGradients | FromToGradients);
export interface ProgressProps {
    prefixCls?: string;
    className?: string;
    type?: ProgressType;
    percent?: number;
    successPercent?: number;
    format?: (percent?: number, successPercent?: number) => React.ReactNode;
    status?: (typeof ProgressStatuses)[number];
    showInfo?: boolean;
    strokeWidth?: number;
    strokeLinecap?: 'butt' | 'square' | 'round';
    strokeColor?: string | ProgressGradient;
    trailColor?: string;
    width?: number;
    style?: React.CSSProperties;
    gapDegree?: number;
    gapPosition?: 'top' | 'bottom' | 'left' | 'right';
    size?: ProgressSize;
    children?: any;
}

export default class Progress extends React.Component<ProgressProps> {
    static defaultProps = {
        type: 'line',
        percent: 0,
        showInfo: true,
        trailColor: '#f3f3f3',
        size: 'default',
        gapDegree: 0,
        strokeLinecap: 'round'
    };

    static propTypes = {
        status: PropTypes.oneOf(ProgressStatuses),
        type: PropTypes.oneOf(ProgressTypes),
        showInfo: PropTypes.bool,
        percent: PropTypes.number,
        width: PropTypes.number,
        strokeWidth: PropTypes.number,
        strokeLinecap: PropTypes.oneOf(['round', 'square']),
        strokeColor: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        trailColor: PropTypes.string,
        format: PropTypes.func,
        gapDegree: PropTypes.number
    };

    getPercentNumber() {
        const { successPercent, percent = 0 } = this.props;
        return parseInt(
            successPercent !== undefined ? successPercent.toString() : percent.toString(),
            10
        );
    }

    getProgressStatus() {
        const { status } = this.props;
        if (ProgressStatuses.indexOf(status!) < 0 && this.getPercentNumber() >= 100) {
            return 'success';
        }
        return status || 'normal';
    }

    renderProgress = ({ getPrefixCls }: ConfigConsumerProps) => {
        const props = this.props;
        const {
            prefixCls: customizePrefixCls,
            className,
            percent = 0,
            status,
            format,
            trailColor,
            size,
            successPercent,
            type,
            strokeWidth,
            width,
            showInfo,
            gapDegree = 0,
            gapPosition,
            strokeColor,
            strokeLinecap = 'round',
            children,
            ...restProps
        } = props;
        const prefixCls = getPrefixCls('progress', customizePrefixCls);
        const progressStatus = this.getProgressStatus();
        const progress = (
            <Circle {...this.props} prefixCls={prefixCls} progressStatus={progressStatus}>
                <span className={`${prefixCls}-text`}>{children}</span>
            </Circle>
        );

        const classString = classNames(
            prefixCls,
            {
                [`${prefixCls}-${(type === 'dashboard' && 'circle') || type}`]: true,
                [`${prefixCls}-status-${progressStatus}`]: true,
                [`${prefixCls}-show-info`]: showInfo,
                [`${prefixCls}-${size}`]: size
            },
            className
        );

        return (
            <div {...restProps} className={classString}>
                {progress}
            </div>
        );
    };

    render() {
        return <ConfigConsumer>{this.renderProgress}</ConfigConsumer>;
    }
}
