import { PomodoroRecord, TitleSpentTimeDict } from '../renderer/monitor/type';
import { DistractingRow } from '../renderer/components/Timer/action';

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

export class EfficiencyAnalyser {
    appRegs: (RegExp | undefined)[] = [];
    titleRegs: (RegExp | undefined)[] = [];
    bk: DistractingRow[] = [];
    constructor(appTitleRegs: DistractingRow[]) {
        this.init(appTitleRegs);
    }

    init(appTitleRegs: DistractingRow[]) {
        this.appRegs = appTitleRegs.map(v => (v.app ? new RegExp(v.app, 'i') : undefined));
        this.titleRegs = appTitleRegs.map(v => (v.title ? new RegExp(v.title, 'i') : undefined));
        this.bk = appTitleRegs;
    }

    isSame(other: DistractingRow[]) {
        if (this.bk.length !== other.length) {
            return false;
        }

        for (let i = 0; i < this.bk.length; i += 1) {
            if (this.bk[i].app !== other[i].app || this.bk[i].title !== other[i].title) {
                return false;
            }
        }

        return true;
    }

    update(other: DistractingRow[]) {
        if (this.isSame(other)) {
            return;
        }

        this.init(other);
    }

    private getTitleDistractingPos = (titles: TitleSpentTimeDict, reg: RegExp) => {
        let totalTimes = 0;
        for (const title in titles) {
            if (!titles.hasOwnProperty(title)) {
                continue;
            }

            if (!reg.exec(title)) {
                continue;
            }

            totalTimes += titles[title].occurrence;
        }

        return totalTimes;
    };

    analyse = (record: PomodoroRecord) => {
        const appDistractingOcc = [];
        for (const app in record.apps) {
            const curIndex = record.apps[app].index;
            const totalOccurrence = record.switchActivities!.reduce(
                (l, index) => l + (index === curIndex ? 1 : 0),
                0
            );
            let distractingOccurrence = 0;
            for (let i = 0; i < this.appRegs.length; i += 1) {
                if (this.appRegs[i] && this.appRegs[i]!.exec(app)) {
                    if (this.titleRegs[i]) {
                        const v = this.getTitleDistractingPos(
                            record.apps[app].titleSpentTime,
                            this.titleRegs[i]!
                        );
                        distractingOccurrence = Math.max(distractingOccurrence, v);
                    } else {
                        distractingOccurrence = totalOccurrence;
                    }
                } else if (this.titleRegs[i]) {
                    const v = this.getTitleDistractingPos(
                        record.apps[app].titleSpentTime,
                        this.titleRegs[i]!
                    );
                    distractingOccurrence = Math.max(distractingOccurrence, v);
                }
            }

            appDistractingOcc[record.apps[app].index] = distractingOccurrence;
        }

        const isDistracting = record.switchActivities!.map((v, i) => false);
        const index = record.switchActivities!.map((v, i) => i);
        for (let i = 0; i < index.length; i += 1) {
            const b = Math.floor(Math.random() * index.length);
            [index[i], index[b]] = [index[b], index[i]];
        }

        for (const i of index) {
            if (appDistractingOcc[i]) {
                isDistracting[i] = true;
                appDistractingOcc[i] -= 1;
            }
        }

        return getEfficiency(isDistracting, record.stayTimeInSecond!);
    };
}
