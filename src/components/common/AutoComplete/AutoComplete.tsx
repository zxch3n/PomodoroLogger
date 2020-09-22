import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Menu from 'antd/es/menu';
import 'antd/es/dropdown/style/css';
interface Props {
    element?: HTMLElement;
    autoComplete: (s?: string) => string[];
    select: (s: string) => void;
}

export const AutoComplete = ({ element, autoComplete, select }: Props) => {
    const [options, setOptions] = useState<string[]>([]);
    const [position, setPosition] = useState({ x: -1000, y: -1000 });
    const set = () => {
        setOptions(autoComplete(element?.textContent || undefined));
    };

    useEffect(set, [element?.textContent, autoComplete]);
    useEffect(() => {
        if (!element) {
            setPosition({ x: -1000, y: -1000 });
            return;
        }

        const rect = element.getBoundingClientRect();
        setPosition({ x: rect.x, y: rect.y + rect.height + 10 });
        element.addEventListener('input', set);
        element.addEventListener('compositionend', set);
        () => {
            element.removeEventListener('input', set);
            element.removeEventListener('compositionend', set);
        };
    }, [element]);

    const items = React.useMemo(
        () =>
            element &&
            options.map((x, i) => (
                <Menu.Item
                    className="ant-dropdown-menu-item"
                    key={i}
                    onClick={() => {
                        select(x);
                    }}
                >
                    {x}
                </Menu.Item>
            )),
        [options, element]
    );
    if (!element) {
        return null;
    }

    return createPortal(
        <Menu
            className="ant-dropdown-menu ant-dropdown-menu-light ant-dropdown-menu-root ant-dropdown-menu-vertical"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                transform: `translate(${position.x}px, ${position.y}px)`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
        >
            {items}
        </Menu>,
        document.body
    );
};
