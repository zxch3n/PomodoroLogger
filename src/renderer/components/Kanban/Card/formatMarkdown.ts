import marked from 'marked';

export interface MarkdownContext {
    stringColorMap?: (name: string) => { background: string; color: string };
    registerTag?: (name: string) => void;
}

const defaultContext = {
    stringColorMap: () => ({
        background: '#dddddd',
        color: '#222',
    }),
};

export function parseTag(
    html: string,
    {
        stringColorMap = defaultContext.stringColorMap,
        registerTag,
    }: MarkdownContext = defaultContext
) {
    return html.replace(/(#[^\s\\<>]+)(\s|$|<)/gi, (_, p1, p2) => {
        const { background, color } = stringColorMap(p1);
        registerTag && registerTag(p1);
        return `<span class="pl-tag" style="background:${background}; color:${color}; --hover-background: ${
            background + 'aa'
        }">${p1}</span>${p2}`;
    });
}

const formatMarkdown = (markdown: string, context: MarkdownContext = defaultContext) => {
    let i = 0;
    const html = marked(markdown, { gfm: true, breaks: true })
        .replace(/<a/g, '<a target="_blank"')
        .replace(/\[(\s|x)\]/g, (match) => {
            let newString;
            if (match === '[ ]') {
                newString = `<input id=${i} onclick="return false" type="checkbox">`;
            } else {
                newString = `<input id=${i} checked onclick="return false" type="checkbox">`;
            }
            i += 1;
            return newString;
        });

    return parseTag(html, context);
};

export default formatMarkdown;
