export const thinScrollBar = `
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: rgba(0, 0, 0, 0);
    }
    ::-webkit-scrollbar-track {
        width: 4px;
        background-color: rgba(0, 0, 0, 0);
    }
    ::-webkit-scrollbar-thumb {
        width: 4px;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
`;

export const fatScrollBar = `
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        background-color: #f5f5f5;
    }
    ::-webkit-scrollbar-thumb {
        border-radius: 8px;
        background-color: rgba(50, 50, 50, 0.3);
    }
    ::-webkit-scrollbar-track {
        border-radius: 8px;
        background-color: rgba(200, 200, 200, 0);
    }
`;

export const tabMaxHeight = ` 
    max-height: calc(100vh - 45px);
`;
