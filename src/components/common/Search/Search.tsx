import { Icon } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { SearchPanel } from './SearchPanel';

export interface SearchProps {
    searchStr?: string;
    tags?: () => string[];
    searchHistory?: () => string[];
    setSearchStr(str: string): void;
}

interface StyledProps {
    isSearching: boolean;
    showPanel: boolean;
}

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const StyledSearch = styled.div<StyledProps>`
    font-size: 0.9rem;
    background-color: white;
    margin: 0 4px;
    box-sizing: border-box;
    padding: 5px;
    height: 32px;
    border-radius: 16px;
    transition: width 200ms, padding 200ms;
    border: 1px solid #dadada;
    outline: none;
    color: #555;
    z-index: 5;

    ${({ isSearching }) =>
        isSearching
            ? `
        width: 250px; 
        padding: 5px 12px;
        `
            : `width: 32px; 
        cursor: pointer;
        input, .close { display: none;}
    `}

    ${({ showPanel, isSearching }) => (isSearching && showPanel ? `height: auto;` : ``)}

    header {
        display: flex;
        flex-direction: row;
        align-items: center;

        i {
            font-size: 20px;
            width: 20px;
            height: 20px;
            outline: none;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .close {
            box-sizing: border-box;
            padding: 4px;
            cursor: pointer;
            border-radius: 10px;
            z-index: 6;
            transition: background-color 300ms, opacity 200ms;
            animation: ${fadeIn} 300ms ease;

            &:hover {
                background-color: #d5d5d5;
            }
        }

        input {
            width: 140px;
            background: transparent;
            flex-grow: 1;
            border: none;
            outline: none;
            margin: 0 6px;
            padding: 0;
            line-height: 20px;
            height: 20px;
        }
    }

    :focus {
        border: 1px solid #aaaaaa;
    }
    :hover {
        border: 1px solid #aba9a6;
    }
`;

export const Search = ({ setSearchStr, searchHistory, searchStr, tags }: SearchProps) => {
    const [isSearching, setIsSearching] = useState(false);
    const [text, setText] = useState('');
    const [showPanel, setShowPanel] = useState(false);
    const textRef = useRef<string>('');
    const selfRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const onClick = useCallback(() => {
        if (!isSearching) {
            setIsSearching(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 200);
        }
    }, [isSearching]);

    useEffect(() => {
        if (searchStr == null || searchStr === textRef.current) {
            return;
        }

        setText(searchStr);
        textRef.current = searchStr;
        setIsSearching(true);
    }, [searchStr]);

    const clear = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setIsSearching(false);
        setShowPanel(false);
        setText('');
        textRef.current = '';
        setSearchStr('');
    }, []);

    const search = useCallback((value: string) => {
        setText(value);
        textRef.current = value;
        setSearchStr(value);
    }, []);

    const onChange = useCallback(
        (v: React.ChangeEvent<HTMLInputElement>) => {
            const value = v.target.value;
            search(value);
        },
        [setSearchStr]
    );

    const onKeydown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            setText('');
            textRef.current = '';
            setSearchStr('');
            setIsSearching(false);
            setShowPanel(false);
        } else if (event.key === 'Enter' || event.keyCode === 13) {
            inputRef.current?.blur();
        }
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!selfRef.current) {
                return;
            }

            if (selfRef.current.contains(e.target as Element)) {
                return;
            }

            if (!textRef.current) {
                setIsSearching(false);
            }

            setShowPanel(false);
        };

        const onKeydown = (e: KeyboardEvent) => {
            if ((e.key === 'f' || e.keyCode === 70) && e.ctrlKey) {
                e.preventDefault();
                setIsSearching(true);
                inputRef.current?.focus();
            }
        };

        window.addEventListener('mousedown', handler);
        window.addEventListener('keydown', onKeydown);
        return () => {
            window.removeEventListener('mousedown', handler);
            window.removeEventListener('keyboard', onKeydown as any);
        };
    }, []);

    const togglePanel = useCallback(() => {
        setShowPanel((v) => !v);
    }, []);

    return (
        <StyledSearch
            onKeyDown={onKeydown}
            isSearching={isSearching}
            showPanel={showPanel}
            onClick={onClick}
            ref={selfRef}
        >
            <header>
                <Icon type="search" style={{ padding: 1 }} />
                <input ref={inputRef} onChange={onChange} value={text} />
                <Icon
                    type={'down'}
                    style={{
                        transform: showPanel ? 'rotate(180deg)' : '',
                        transition: 'transform 120ms',
                    }}
                    className="close"
                    onClick={togglePanel}
                />
                <Icon type="close" className="close" onClick={clear} />
            </header>
            {showPanel && isSearching && (
                <SearchPanel
                    tags={tags && tags()}
                    history={searchHistory && searchHistory()}
                    search={search}
                />
            )}
        </StyledSearch>
    );
};
