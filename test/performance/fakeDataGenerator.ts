import { generateRandomName } from '../../src/renderer/utils';
import { ProjectItem } from '../../src/renderer/components/Project/action';
import { TodoItem } from '../../src/renderer/components/TODO/action';
import { promisify } from 'util';
import { join } from 'path';
import nedb from 'nedb';
import { ApplicationSpentTime, PomodoroRecord } from '../../src/renderer/monitor/type';
import { loadDBSync } from '../../src/renderer/monitor/sessionManager';

// TODO: Refactor this and record upper bound changes
const projectNum = 10;
const todoNum = 100;
const recordNum = 10000;
const appNum = 20;
const current = new Date().getTime();

function randomChoose(arg: any[]) {
    return arg[Math.floor(Math.random() * arg.length)];
}

function createTodoItem(
    title: string,
    _id?: string,
    project: string = 'Default',
    content?: string,
    expiryDate?: string
): TodoItem {
    const now = new Date().toString();
    const id: string = _id ? _id : `${title} ${now}`;
    return {
        title,
        project,
        content,
        expiryDate,
        _id: id,
        isFocused: false,
        isFinished: false,
        datetime: new Date(current - Math.random() * 24 * 1000 * 3600 * 365 * 3).toString()
    };
}

function createProjectItem() {
    const name = generateRandomName();
    const todoList: { [id: string]: TodoItem } = {};
    for (let i = 0; i < todoNum; i += 1) {
        const item = createTodoItem(generateRandomName(), undefined, name, generateRandomName());
        todoList[item._id] = item;
    }

    return {
        name,
        todoList,
        spentHours: 0,
        applicationSpentTime: {}
    } as ProjectItem;
}

export function generate() {
    const appNames = Array(appNum)
        .fill(undefined)
        .map(() => {
            return generateRandomName();
        });

    const projects = Array(projectNum)
        .fill(undefined)
        .map(() => createProjectItem());

    const records: PomodoroRecord[] = [];
    function genApps(spentHours: number): { [appName: string]: ApplicationSpentTime } {
        const ans: { [appName: string]: ApplicationSpentTime } = {};
        let sum = 0;
        for (let i = 0; i < (appNum - 3) * Math.random() + 3; i += 1) {
            const s = Math.random();
            sum += s;
            const appName = randomChoose(appNames);
            const app: ApplicationSpentTime = {
                appName,
                spentTimeInHour: s,
                titleSpentTime: {
                    // TODO
                },
                screenStaticDuration: Math.random(),
                switchTimes: Math.floor(Math.random() * 40)
            };

            ans[appName] = app;
        }

        for (const a in ans) {
            ans[a].spentTimeInHour = (ans[a].spentTimeInHour / sum) * spentHours;
        }

        return ans;
    }

    function addRandomRecord() {
        const chosenProject = projects[Math.floor(Math.random() * projects.length)];
        const apps = genApps(0.5);
        const record: PomodoroRecord = {
            apps,
            startTime: current - Math.random() * 24 * 3600 * 1000 * 365 * 3,
            projectId: chosenProject._id,
            switchTimes: Math.floor(Math.random() * 300),
            spentTimeInHour: 0.5
        };

        chosenProject.spentHours += 0.5;
        for (const appName in apps) {
            if (chosenProject.applicationSpentTime[appName] === undefined) {
                chosenProject.applicationSpentTime[appName] = {
                    keywords: [],
                    spentHours: 0,
                    subAppSpentTime: [],
                    title: appName
                };
            }

            chosenProject.applicationSpentTime[appName].spentHours += apps[appName].spentTimeInHour;
        }

        return record;
    }

    for (let i = 0; i < recordNum; i += 1) {
        records.push(addRandomRecord());
    }

    return { projects, records };
}

export async function generateAndSave(dirPath: string) {
    const { projects, records } = generate();
    const projectDB = loadDBSync(join(dirPath, 'project.nedb'));
    const sessionDB = loadDBSync(join(dirPath, 'session.nedb'));
    await Promise.all([
        promisify(projectDB.insert.bind(projectDB))(projects),
        promisify(sessionDB.insert.bind(sessionDB))(records)
    ]);
}
