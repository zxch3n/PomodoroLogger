'use strict';
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    node: {
        __dirname: false,
        __filename: false
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        modules: [path.join(__dirname, 'node_modules')]
    },
    devtool: 'source-map',
    externals: [nodeExternals()],
    plugins: [ ]
};
