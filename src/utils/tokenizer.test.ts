import { Tokenizer } from './tokenizer';

const tokenizer = new Tokenizer();

function expectTokenizer(input: string, output: string[]) {
    expect(tokenizer.tokenize(input)).toStrictEqual(output);
}

describe('Tokenizer', () => {
    it('tokenizes path', () => {
        expectTokenizer('zxch3n/react-trend: Simple, elegant spark lines - Google Chrome', [
            'zxch3n',
            'react-trend',
            'Simple',
            'elegant',
            'spark',
            'lines',
            'Google',
            'Chrome'
        ]);

        expectTokenizer('C:\\CODE\\js\\pomodoro-logger', ['C', 'CODE', 'js', 'pomodoro-logger']);

        expectTokenizer('/home/dat/project/pomodoro-logger', [
            'home',
            'dat',
            'project',
            'pomodoro-logger'
        ]);

        expectTokenizer('/home/.bin/.vscode', ['home', 'bin', 'vscode']);
    });

    it('hard case', () => {
        expectTokenizer('Issues · aaabbb/bbbaaa - Google Chrome', [
            'Issues',
            'aaabbb',
            'bbbaaa',
            'Google',
            'Chrome'
        ]);

        expectTokenizer('time-logger [C:\\a\\b\\c-d] - ...\\.circleci\\config.yml - WebStorm', [
            'time-logger',
            'C',
            'a',
            'b',
            'c-d',
            'circleci',
            'configyml'
        ]);
    });

    it("doesn't ignore suffix", () => {
        expectTokenizer('Editing vis/README.md at master · abcd/pppp - Google Chrome', [
            'Editing',
            'vis',
            'README.md',
            'at',
            'master',
            'abcd',
            'pppp',
            'Google',
            'Chrome'
        ]);

        expectTokenizer('App.exe a.jpg b.test.js c.test.jpg End.', [
            'App.exe',
            'a.jpg',
            'b.test.js',
            'c.test.jpg',
            'End'
        ]);
    });

    it('tokenize number', () => {
        expectTokenizer('Untitled-1 @ 8.33% (Layer 8, RGB/8) *', [
            'Untitled-1',
            '8.33',
            'Layer',
            '8',
            'RGB',
            '8'
        ]);
    });
});
