import { PomodoroRecord, TitleSpentTimeDict } from '../renderer/monitor/type';
import { DistractingRow } from '../renderer/components/Timer/action';
import { cloneDeep } from 'lodash';

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
            return false;
        }

        this.init(other);
        return true;
    }

    getIsDistracting = (app: string, title: string) => {
        for (let i = 0; i < this.appRegs.length; i += 1) {
            const appReg = this.appRegs[i];
            const titleReg = this.titleRegs[i];
            if (appReg) {
                if (appReg.exec(app)) {
                    if (!titleReg || titleReg.exec(title)) {
                        return true;
                    }
                }
            } else if (titleReg) {
                if (titleReg.exec(title)) {
                    return true;
                }
            } else {
                throw new Error();
            }
        }

        return false;
    };

    analyse = (record: PomodoroRecord) => {
        // tslint:disable-next-line:no-parameter-reassignment
        record = cloneDeep(record);
        const isDistracting = record.switchActivities!.map(() => false);
        for (const app in record.apps) {
            const _app = record.apps[app];
            for (const title in _app.titleSpentTime) {
                if (!_app.titleSpentTime.hasOwnProperty(title)) {
                    continue;
                }

                const _title = _app.titleSpentTime[title];
                isDistracting[_title.index] = this.getIsDistracting(app, title);
            }
        }

        console.log(isDistracting, record.stayTimeInSecond);
        return getEfficiency(isDistracting, record.stayTimeInSecond!);
    };
}
