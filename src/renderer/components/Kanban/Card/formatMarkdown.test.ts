import { parseTag } from './formatMarkdown';

describe('Markdown tag', () => {
    const style = 'style="background:hsl(35, 100%, 55%); color=hsl(207, 95%, 8%);"';
    it('hello #world', () => {
        expect(parseTag(`hello #world`)).toEqual(
            `hello <span class="pl-tag" ${style}>#world</span>&nbsp;`
        );
        expect(parseTag(`hello #world `)).toEqual(
            `hello <span class="pl-tag" ${style}>#world</span>&nbsp;`
        );
    });
});
