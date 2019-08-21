export class Tokenizer {
    private rules: [string, RegExp][] = [
        ['appWithSuffix', /^\w[\.\w-]*/],
        ['word', /^\w[\w-]*/],
        ['number', /^\d\d*\.?\d*/]
    ];

    private unwantedSymbol = /[%&\(\)（）,\{\}=+\!@#\$\^\*;:'"<>|\\\/]/;

    public tokenize(s: string): string[] {
        const ans = [];
        const ss = s.split(this.unwantedSymbol);
        console.log(ss);
        for (let str of ss) {
            while (str.length) {
                let found = false;
                for (const [_, reg] of this.rules) {
                    const match = str.match(reg);
                    if (match != null) {
                        const matched = match.toString();
                        ans.push(matched);
                        str = str.slice(matched.length);
                        found = true;
                    }
                }

                if (!found) {
                    str = str.slice(1);
                }
            }
        }

        return ans;
    }
}
