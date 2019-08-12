/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tfconv from '@tensorflow/tfjs-converter';
import * as tf from '@tensorflow/tfjs-core';
import { env } from '../config';
import {
    IOHandler,
    ModelArtifacts,
    WeightsManifestConfig,
    WeightsManifestEntry
} from '@tensorflow/tfjs-core/src/io/types';
import vocab from '../res/vocab.json';
import modelJson from '../res/model.json';
import weights from '../res/weights.dat';
import { join, dirname } from 'path';
import fs from 'fs';
import { Tokenizer } from './tokenizer';

const BASE_PATH =
    'https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/';

export async function load() {
    const use = new UniversalSentenceEncoder();
    await use.load();
    return use;
}

/**
 * Load the Tokenizer for use independently from the UniversalSentenceEncoder.
 *
 * @param pathToVocabulary (optional) Provide a path to the vocabulary file.
 */
export async function loadTokenizer(pathToVocabulary?: string) {
    const vocabulary = await loadVocabulary(pathToVocabulary);
    const tokenizer = new Tokenizer(vocabulary);
    return tokenizer;
}

/**
 * Load a vocabulary for the Tokenizer.
 *
 * @param pathToVocabulary Defaults to the path to the 8k vocabulary used by the
 * UniversalSentenceEncoder.
 */
async function loadVocabulary(
    pathToVocabulary = `${BASE_PATH}vocab.json`
): Promise<[string, number][]> {
    // @ts-ignore
    return vocab;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; i += 1) {
        view[i] = buf[i];
    }
    return ab;
}

async function loadWeights(
    weightsManifest: WeightsManifestConfig
): Promise<[WeightsManifestEntry[], ArrayBuffer]> {
    const [prefix, suffix] = [BASE_PATH, ''];
    const pathPrefix = prefix;

    const weightSpecs = [];
    for (const entry of weightsManifest) {
        weightSpecs.push(...entry.weights);
    }

    // FIXME: current worker's path solution can only run in dev env
    let weightsPath: string = '';
    if (process.env.NODE_ENV === 'test') {
        weightsPath = './src/res/weights.dat';
    } else if (process.env.NODE_ENV === 'development') {
        if (env.isWorker) {
            weightsPath = join('dist', weights);
        } else {
            weightsPath = join(__dirname, weights);
        }
    } else {
        if (env.appAsarDir) {
            weightsPath = join(env.appAsarDir, 'dist', weights);
        } else {
            throw new Error();
        }
    }

    if (env.isWorker) {
        // @ts-ignore
        self.postMessage({ payload: weightsPath, type: 'log' });
    }
    const data: Buffer = await new Promise((resolve, reject) => {
        fs.readFile(weightsPath, null, (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(data as Buffer);
        });
    });

    return [weightSpecs, toArrayBuffer(data)];
}

function wrapJsonAsIO(modelConfig: { modelTopology: any; weightsManifest: any }): IOHandler {
    return {
        load: async (): Promise<ModelArtifacts> => {
            const modelTopology = modelConfig.modelTopology;
            const weightsManifest = modelConfig.weightsManifest;
            const [weightSpecs, weightData] = await loadWeights(weightsManifest);
            return { modelTopology, weightSpecs, weightData } as ModelArtifacts;
        }
    };
}

export class UniversalSentenceEncoder {
    // @ts-ignore
    private model: tfconv.GraphModel;
    // @ts-ignore
    private tokenizer: Tokenizer;

    async loadModel() {
        return tfconv.loadGraphModel(wrapJsonAsIO(modelJson));
    }

    async load() {
        const [model, vocabulary] = await Promise.all([this.loadModel(), loadVocabulary()]);

        this.model = model;
        this.tokenizer = new Tokenizer(vocabulary);
    }

    /**
     *
     * Returns a 2D Tensor of shape [input.length, 512] that contains the
     * Universal Sentence NameEncoder embeddings for each input.
     *
     * @param inputs A string or an array of strings to embed.
     */
    async embed(inputs: string[] | string): Promise<tf.Tensor2D> {
        if (typeof inputs === 'string') {
            // tslint:disable-next-line:no-parameter-reassignment
            inputs = [inputs];
        }

        const encodings = inputs.map(d => this.tokenizer.encode(d));

        const indicesArr = encodings.map((arr, i) => arr.map((d, index) => [i, index]));

        // tslint:disable-next-line:prefer-array-literal
        let flattenedIndicesArr: Array<[number, number]> = [];
        for (let i = 0; i < indicesArr.length; i += 1) {
            flattenedIndicesArr =
                // tslint:disable-next-line:prefer-array-literal
                flattenedIndicesArr.concat(indicesArr[i] as Array<[number, number]>);
        }

        const indices = tf.tensor2d(flattenedIndicesArr, [flattenedIndicesArr.length, 2], 'int32');
        const values = tf.tensor1d(tf.util.flatten(encodings) as number[], 'int32');

        // @ts-ignore
        const embeddings = await this.model.executeAsync({ indices, values });
        indices.dispose();
        values.dispose();

        return embeddings as tf.Tensor2D;
    }
}

export { Tokenizer };
