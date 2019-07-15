import React from 'react';

interface Row {
    name: string;
    value: number;
}

interface Props {
    rows: Row[];
    unit: string;
    size: number;
}

export const UsagePieChart: React.FunctionComponent<Props> = function(props: Props) {
    // TODO: implement this
    // need random color gen
    return (
        <div>
            <ul>
                {props.rows.map(row => (
                    <li key={row.name}>
                        <span className={'pie-chart-row-name'}>{row.name}</span>:
                        <span className="pie-chart-row-value">{row.value.toFixed(1)}</span>{' '}
                        {props.unit}
                    </li>
                ))}
            </ul>
        </div>
    );
};
