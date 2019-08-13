const merge = require('webpack-merge');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const baseConfig = require('./webpack.base.config');

module.exports = merge.smart(baseConfig, {
    target: 'electron-main',
    entry: {
        main: './src/main/main.ts'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
            {
                test: /\.(gif|png|jpe?g)$/,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            disable: true
                        }
                    }
                ]
            },
            {
                test: /\.dat$/,
                use: 'file-loader'
            },
            {
                test: /\.worker\.js$/,
                use: { loader: 'index-loader' }
            }
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            reportFiles: ['src/main/**/*']
        })
    ],
    externals: [nodeExternals()],
});
