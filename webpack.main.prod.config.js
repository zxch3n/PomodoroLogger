const merge = require('webpack-merge');
const Visualizer = require('webpack-visualizer-plugin');
const webpack = require('webpack');
const baseConfig = require('./webpack.main.config');
const fs = require('fs');

if (!fs.existsSync('./webpack-visualization')) {
    fs.mkdirSync('./webpack-visualization')
}

// disable source-map in production build
baseConfig.devtool = undefined;
module.exports = merge.smart(baseConfig, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        }),
        new Visualizer({
            filename: "./webpack-visualization/main.html"
        })
    ],
});
