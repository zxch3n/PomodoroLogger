export class ColorEncoder {
    baseString = '0123456789abcdef';

    encodeNum(n: number): string {
        return this.baseString[Math.floor(n / 16)] + this.baseString[Math.floor(n % 16)];
    }

    encodeColor(r: number, g: number, b: number): string {
        return this.encodeNum(r) + this.encodeNum(g) + this.encodeNum(b);
    }

    decodeColor(rgb: string) {
        return [
            this.decodeNum(rgb.substring(0, 2)),
            this.decodeNum(rgb.substring(2, 4)),
            this.decodeNum(rgb.substring(4, 6))
        ];
    }

    decodeNum(n: string) {
        return this.baseString.indexOf(n[0]) * 16 + this.baseString.indexOf(n[1]);
    }

    randomColor() {
        return [
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)
        ];
    }

    getAColor() {
        let color = this.randomColor();
        let sum = color.reduce((l, v) => l + v, 0);
        while (sum < 60 || sum > 240 * 3) {
            color = this.randomColor();
            sum = color.reduce((l, v) => l + v, 0);
        }
        return '#' + this.encodeColor(color[0], color[1], color[2]);
    }
}

export class ColorScheme {
    private colorMap: { [name: string]: string } = {};
    private encoder = new ColorEncoder();
    constructor() {}

    get(name: string) {
        if (!this.colorMap.hasOwnProperty(name)) {
            this.colorMap[name] = this.encoder.getAColor();
        }

        return this.colorMap[name];
    }
}
