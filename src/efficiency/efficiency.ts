export const EFFICIENCY_INC_RATE = 1 / 90;
export function getEfficiency(isDistractionArr: boolean[], stayTimeArr: number[]) {
    compressArray(isDistractionArr, stayTimeArr);
    const totalTime = stayTimeArr.reduce((a, b) => a + b, 0);
    let focusedTime = stayTimeArr.reduce(
        (l, cur, index) => l + (isDistractionArr[index] ? 0 : cur),
        0
    );

    let prevEfficiency = 0;
    for (let i = 1; i < stayTimeArr.length; i += 1) {
        if (isDistractionArr[i]) {
            continue;
        }

        const lossFactor = 1 - Math.sqrt(Math.min(stayTimeArr[i - 1] / 30, 1)) * 0.5 - 0.5;
        const startEfficiency = prevEfficiency * lossFactor;
        const recoverTime = (1 - startEfficiency) / EFFICIENCY_INC_RATE;
        if (stayTimeArr[i] > recoverTime) {
            focusedTime -= (recoverTime / 2) * (1 - startEfficiency);
            prevEfficiency = 1.0;
        } else {
            const finalEfficiency = startEfficiency + EFFICIENCY_INC_RATE * stayTimeArr[i];
            focusedTime -= (stayTimeArr[i] * (1 - startEfficiency + 1 - finalEfficiency)) / 2;
            prevEfficiency = finalEfficiency;
        }
    }

    return focusedTime / totalTime;
}

export function compressArray(isDistractionArr: boolean[], stayTimeArr: number[]) {
    let rmNum = 0;
    for (let i = 0; i < isDistractionArr.length - 1; ) {
        let index = 1;
        while (
            i + index < isDistractionArr.length &&
            isDistractionArr[i] === isDistractionArr[i + index]
        ) {
            stayTimeArr[i] += stayTimeArr[i + index];
            index += 1;
        }

        isDistractionArr[i - rmNum] = isDistractionArr[i];
        stayTimeArr[i - rmNum] = stayTimeArr[i];
        rmNum += index - 1;
        i += index;
    }

    isDistractionArr.splice(isDistractionArr.length - rmNum, rmNum);
    stayTimeArr.splice(stayTimeArr.length - rmNum, rmNum);
}
