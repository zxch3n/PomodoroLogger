import 'antd/es/dropdown/style/css';
import Menu from 'antd/es/menu';
import 'antd/es/menu/style/css';
import { debounce } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
interface Props {
    element?: HTMLElement;
    autoComplete: (s?: string) => string[];
    select: (s?: string) => void;
}

export const AutoComplete = ({ element, autoComplete, select }: Props) => {
    const [options, setOptions] = useState<string[]>([]);
    const [position, setPosition] = useState({ x: -1000, y: -1000 });
    const [index, setIndex] = useState<number>(-1);
    const selfRef = useRef<HTMLDivElement>(null);
    const set = useMemo(() => {
        const fn = () => {
            if (
                !element ||
                !element.textContent ||
                element.textContent.length === 0 ||
                !element.parentElement
            ) {
                select();
                return;
            }

            setOptions(autoComplete(element?.textContent || undefined));
        };
        fn();
        return debounce(fn, 100);
    }, [autoComplete, select, element]);

    useEffect(set, [element?.textContent, autoComplete]);

    const items = React.useMemo(
        () =>
            element &&
            options.map((x, i) => (
                <Menu.Item className="ant-dropdown-menu-item" key={x}>
                    {x}
                </Menu.Item>
            )),
        [options, !!element]
    );

    const indexRef = React.useRef(0);
    indexRef.current = index;

    const control = React.useMemo(() => {
        return {
            inc: () => setIndex((index) => Math.min(index + 1, options.length - 1)),
            dec: () => setIndex((index) => Math.max(index - 1, -1)),
            sel: () => indexRef.current >= 0 && select(options[indexRef.current]),
            cancel: () => select(),
        };
    }, [options]);

    const controlRef = React.useRef(control);
    controlRef.current = control;

    useEffect(() => {
        if (
            !element ||
            !element.parentElement ||
            !element.textContent ||
            element.textContent.length === 0
        ) {
            setPosition({ x: -1000, y: -1000 });
            return;
        }

        const rect = element.getBoundingClientRect();
        setPosition({ x: rect.x, y: rect.y + rect.height + 10 });
        const obs = new MutationObserver(set);
        obs.observe(element.parentElement, {
            attributes: false,
            attributeOldValue: false,
            characterData: true,
            subtree: true,
            childList: true,
        });

        const click = (event: MouseEvent) => {
            if (selfRef.current?.contains(event.target as HTMLElement)) {
                return;
            }

            controlRef.current.cancel();
        };

        const keydown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown' || event.keyCode === 40) {
                event.preventDefault();
                controlRef.current.inc();
            } else if (event.key === 'ArrowUp' || event.keyCode === 38) {
                event.preventDefault();
                controlRef.current.dec();
            } else if (event.key === 'Enter' || event.keyCode === 13) {
                event.preventDefault();
                controlRef.current.sel();
            } else if (event.key === 'Escape' || event.keyCode === 27) {
                event.preventDefault();
                controlRef.current.cancel();
            }
        };

        document.addEventListener('keydown', keydown);
        document.addEventListener('click', click);
        return () => {
            obs.disconnect();
            document.removeEventListener('keydown', keydown);
            document.removeEventListener('click', click);
        };
    }, [element]);

    const onSelect = React.useCallback(
        ({ key }: { key: string }) => {
            select(key);
        },
        [select]
    );

    if (!element) {
        return null;
    }

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                transform: `translate(${position.x}px, ${position.y}px)`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
            ref={selfRef}
        >
            <Menu
                className="ant-dropdown-menu ant-dropdown-menu-light ant-dropdown-menu-root ant-dropdown-menu-vertical"
                style={{
                    position: 'relative',
                    top: 0,
                    left: 0,
                }}
                onSelect={onSelect}
                selectedKeys={index < 0 ? undefined : [options[index]]}
            >
                {items}
            </Menu>
        </div>,

        document.body
    );
};
