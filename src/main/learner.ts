import { PomodoroRecord } from '../renderer/monitor';
import * as tf from '@tensorflow/tfjs';
import * as use from '../use';

type Titles = { [title: string]: number };
interface TitleProjectPair {
    titles: { [title: string]: number };
    project?: string;
}

let embModel: use.UniversalSentenceEncoder | undefined;
export function getTitlesProjectPairs(records: PomodoroRecord[]): TitleProjectPair[] {
    return records.map(v => {
        const titles: { [title: string]: number } = {};
        for (const app in v.apps) {
            const ts = v.apps[app].titleSpentTime;
            for (const title in ts) {
                if (!(title in titles)) {
                    titles[title] = 0;
                }

                titles[title] += ts[title].normalizedWeight || ts[title].occurrence || 1;
            }
        }

        return {
            titles,
            project: v.projectId
        };
    });
}

function preprocessSentence(s: string) {
    return s.replace(/[\.,\/\\\(\)!\?]/g, ' ');
}

async function embed(titles: Titles[]) {
    // TODO: filter stopwords
    const sentences = titles.map(title =>
        Object.keys(title)
            .map(v => {
                return preprocessSentence(v);
            })
            .join('. ')
    );

    if (embModel === undefined) {
        embModel = await use.load();
    }

    return await embModel.embed(sentences);
}

export async function embeddingTitles(
    _pairs: TitleProjectPair[]
): Promise<[tf.Tensor2D, string[]]> {
    const pairs = _pairs.filter(v => v.project !== undefined);
    const titles = pairs.map(v => v.titles);
    const embeddings = await embed(titles);
    return [embeddings, pairs.map(v => v.project as string)];
}

function oneHotEncode(
    projects: string[]
): [{ [project: string]: number }, { [index: number]: string }] {
    let index = 0;
    const ans: { [proejct: string]: number } = {};
    const invertEncode = [];
    const projectSet = new Set(projects);
    for (const project of projectSet) {
        if (!(project in ans)) {
            ans[project] = index;
            invertEncode[index] = project;
            index += 1;
        }
    }

    return [ans, invertEncode];
}

export async function trainTitlesProjectPair(
    pairs: TitleProjectPair[],
    { batchSize = 32, epochs = 20 }: { batchSize?: number; epochs?: number } = {}
) {
    const [embeddings, projects] = await embeddingTitles(pairs);
    const [projectEncoding, invertEncode] = oneHotEncode(projects);
    const outputSize = Object.values(projectEncoding).length;
    console.log(outputSize);
    const model = await createModel(embeddings.shape[1], outputSize, 1, 100);
    const projectsTensors = tf.tensor1d(projects.map(p => projectEncoding[p]));
    await trainModel({
        model,
        batchSize,
        epochs,
        input: embeddings,
        labels: projectsTensors,
        shuffle: true
    });
    return {
        model,
        projectEncoding,
        invertEncode
    };
}

export async function predict(
    model: tf.LayersModel,
    titles: Titles | Titles[],
    invertEncode: { [i: number]: string }
): Promise<string[] | string> {
    if (!(titles instanceof Array)) {
        return (await predict(model, [titles], invertEncode))[0];
    }

    const embeddings = await embed(titles);
    let pred = model.predict(embeddings);
    if (!(pred instanceof Array)) {
        pred = [pred];
    }

    const argmax = await Promise.all(pred.map(v => v.argMax().array()));
    // @ts-ignore
    return argmax.map((p: number) => invertEncode[p]);
}

async function createModel(
    inputSize: number,
    outputSize: number,
    hiddenLayer: number,
    hiddenSize: number
): Promise<tf.Sequential> {
    const model = tf.sequential();
    model.add(
        tf.layers.dense({
            inputShape: [inputSize],
            units: hiddenSize * hiddenLayer ? hiddenSize : outputSize,
            useBias: true,
            name: 'hidden_0'
        })
    );
    for (let i = 1; i < hiddenLayer; i += 1) {
        model.add(
            tf.layers.dense({
                inputShape: [hiddenSize],
                units: hiddenSize,
                useBias: true,
                name: `hidden_${i}`
            })
        );
    }
    model.add(
        tf.layers.dense({
            inputShape: [hiddenSize],
            units: outputSize,
            useBias: true,
            name: `hidden_${hiddenLayer}`
        })
    );
    model.compile({
        optimizer: tf.train.adam(),
        loss: tf.losses.softmaxCrossEntropy,
        metrics: ['accuracy']
    });
    return model;
}

export async function trainModel({
    model,
    input,
    labels,
    batchSize = 32,
    epochs = 20,
    shuffle = true
}: {
    model: tf.Sequential;
    input: tf.Tensor;
    labels: tf.Tensor;
    batchSize: number;
    epochs: number;
    shuffle: boolean;
}) {
    return await model.fit(input, labels, {
        batchSize,
        epochs,
        shuffle,
        callbacks: [
            {
                onBatchBegin: (batch: any, logs: any) => {
                    console.log(batch, logs);
                }
            }
        ]
    });
}
