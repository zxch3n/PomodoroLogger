import React, { FC, useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { debounce } from 'lodash';
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
    box-shadow: 2px 2px 4px 1px rgba(0, 0, 0, 0.2);
    border: 1px solid #dfdfdf;
    background-color: white;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 4px;

    &:focus-within {
        outline: -webkit-focus-ring-color auto 1px;
    }

    & > .divider {
        border-right: 1px solid rgba(50, 50, 50, 0.2);
        height: 1.4rem;
        margin: 0 0.2rem;
    }

    & > input {
        border: none;
        background-color: none;
        padding: 3px;
        margin: 1px;

        :focus {
            outline: none;
        }
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
    const [searchingText, setSearchingText] = useState('');
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
                ref.current?.blur();
            }
        },
        [props.setIsSearching]
    );

    const debouncedSetReg = React.useMemo(() => debounce(props.setReg, 100), [props.setReg]);
    const onChange = React.useCallback(
        (event: any) => {
            const v = event.target.value;
            debouncedSetReg(v);
            setSearchingText(v);
        },
        [props.setReg]
    );

    useEffect(() => {
        if (!props.reg) {
            setSearchingText('');
        }
    }, [!!props.reg]);

    return (
        <Bar style={{ display: props.isSearching ? undefined : 'none' }}>
            <input
                // @ts-ignore
                ref={ref}
                placeholder="Search by RegExp"
                onKeyDown={onKeyDown}
                onChange={onChange}
                value={searchingText}
            />

            <div className="divider" />

            <Icon onClick={quit} type={'close'} className="quit" />
        </Bar>
    );
};

export const SearchBar = connect(
    (state: RootState) => ({
        reg: state.kanban.kanban.searchReg,
        isSearching: state.kanban.kanban.isSearching,
    }),
    (dispatch: Dispatch) => ({
        setReg: (reg?: string) => {
            dispatch(actions.setSearchReg(reg));
        },
        setIsSearching: (isSearch: boolean) => dispatch(actions.setIsSearching(isSearch)),
    })
)(_SearchBar);
