const webpack = require('webpack');
const merge = require('webpack-merge');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const baseConfig = require('./webpack.base.config');

module.exports = merge.smart(baseConfig, {
    target: 'electron-main',
    entry: {
        main: './src/main/main.ts',
        preload: './src/main/preload.ts',
        worker: './src/main/worker/worker.ts',
    },
    module: {
        rules: [
            {
                test: [/\.jsx?$/, /\.tsx?$/],
                exclude: /node_modules/,
                loader: 'ts-loader',
            },
            {
                test: /\.(gif|png|jpe?g)$/,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            disable: true,
                        },
                    },
                ],
            },
            {
                test: /\.dat$/,
                use: 'file-loader',
            },
            {
                test: /\.worker\.js$/,
                use: { loader: 'index-loader' },
            },
        ],
    },
    watch: true,
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            reportFiles: ['src/main/**/*'],
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
    ],
    externals: {
        'active-win': 'commonjs2 active-win',
    },
});
