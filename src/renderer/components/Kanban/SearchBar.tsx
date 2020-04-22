import React, { FC, useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { actions } from './action';
import { connect } from 'react-redux';
import { RootState } from '../../reducers';
import { Dispatch } from 'redux';
import styled from 'styled-components';
import { Icon } from 'antd';

const Bar = styled.div`
    position: fixed;
    top: 90px;
    right: 30px;
    z-index: 10000;
    box-shadow: 2px 2px 4px 4px rgba(40, 40, 40, 0.2);
    border: 1px solid #dfdfdf;
    border-radius: 4px;
    background-color: white;
    input {
        border-radius: 4px;
        border: none;
        background-color: none;
        padding: 8px;
        padding-right: 1.5rem;
    }

    .quit:hover {
        color: #7d7c8d;
    }
`;

interface Props {
    reg?: string;
    isSearching: boolean;
    setReg: (reg?: string) => void;
    setIsSearching: (isSearching: boolean) => void;
}

const _SearchBar: FC<Props> = (props: Props) => {
    const ref = useRef<HTMLInputElement>();
    useEffect(() => {
        window.addEventListener('keydown', (event) => {
            if (
                event.ctrlKey &&
                (event.key === 'f' || event.which === 70 || event.code === 'KeyF')
            ) {
                // Ctrl + F: Search
                props.setIsSearching(true);
                if (ref.current) {
                    ref.current.focus();
                }
            } else if (event.key === 'Escape' || event.which === 27 || event.code === 'Escape') {
                props.setIsSearching(false);
            }
        });
    }, []);

    const hide = () => {
        props.setIsSearching(false);
    };

    const quit = React.useCallback(() => {
        props.setReg(undefined);
        hide();
    }, [props.setIsSearching, props.setReg]);

    const onKeyDown = React.useCallback(
        (event: KeyboardEvent<any>) => {
            if (event.keyCode === 27) {
                quit();
            } else if (event.keyCode === 13) {
                hide();
            }
        },
        [props.setIsSearching]
    );

    const onChange = React.useCallback(
        (event: any) => {
            props.setReg(event.target.value);
        },
        [props.setReg]
    );

    return (
        <Bar style={{ display: props.isSearching ? undefined : 'none' }}>
            <input
                // @ts-ignore
                ref={ref}
                placeholder="Search by RegExp"
                onKeyDown={onKeyDown}
                onChange={onChange}
                value={props.reg}
            />
            <Icon
                onClick={quit}
                type={'close'}
                className="quit"
                style={{
                    top: '50%',
                    right: 6,
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    position: 'absolute',
                }}
            />
        </Bar>
    );
};

export const SearchBar = connect(
    (state: RootState) => ({
        reg: state.kanban.kanban.searchReg,
        isSearching: state.kanban.kanban.isSearching,
    }),
    (dispatch: Dispatch) => ({
        setReg: (reg?: string) => dispatch(actions.setSearchReg(reg)),
        setIsSearching: (isSearch: boolean) => dispatch(actions.setIsSearching(isSearch)),
    })
)(_SearchBar);
