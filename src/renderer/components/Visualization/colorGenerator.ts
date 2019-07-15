const base = '0123456789ABCDEF';
function genColor(): [number, number, number] {
    const ans: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
        ans[i] = Math.floor(Math.random() * 256);
    }

    return ans;
}

function convertToRawColorForm(color: string): [number, number, number] {
    if (color[0] !== '#') {
        throw new Error();
    }

    const r = base.indexOf(color[1]) * 16 + base.indexOf(color[2]);
    const g = base.indexOf(color[3]) * 16 + base.indexOf(color[4]);
    const b = base.indexOf(color[5]) * 16 + base.indexOf(color[6]);
    return [r, g, b];
}

function convertToStringColor(color: [number, number, number]) {
    return `#${[
        base[Math.floor(color[0] / 16)],
        base[Math.floor(color[0] % 16)],
        base[Math.floor(color[1] / 16)],
        base[Math.floor(color[1] % 16)],
        base[Math.floor(color[2] / 16)],
        base[Math.floor(color[2] % 16)]
    ].join('')}`;
}

export function generateRandomColor({ colors = [], minDistance = 40, n_retry = 10 }) {
    if (colors.length === 0) {
        return convertToStringColor(genColor());
    }

    const rawColors = colors.map(convertToRawColorForm);
    let newColor = genColor();
    let maxDistance = 100000;
    let maxDistColor = newColor;
    function calcDistance() {
        let minSum = 1000000;
        for (const c of rawColors) {
            const v =
                Math.abs(c[0] - newColor[0]) +
                Math.abs(c[1] - newColor[1]) +
                Math.abs(c[2] - newColor[2]);
            if (v < minSum) {
                minSum = v;
            }
        }

        return minSum;
    }

    for (let i = 0; i < n_retry; i += 1) {
        const dist = calcDistance();
        if (dist < minDistance) {
            return newColor;
        }

        if (dist > maxDistance) {
            maxDistance = dist;
            maxDistColor = newColor;
        }

        newColor = genColor();
    }

    return maxDistColor;
}
