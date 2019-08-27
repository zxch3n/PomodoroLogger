import React from 'react';

export interface Props {
    type: 'spent-time' | 'estimated-time';
    value: number | string;
}

export const Badger = (props: Props) => {
    return <svg />;
};
