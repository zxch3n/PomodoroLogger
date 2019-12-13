const merge = require('webpack-merge');
const Visualizer = require('webpack-visualizer-plugin');
const baseConfig = require('./webpack.renderer.config');
const fs = require('fs');

if (!fs.existsSync('./webpack-visualization')) {
    fs.mkdirSync('./webpack-visualization')
}

module.exports = merge.smart(baseConfig, {
    mode: 'production',
    plugins: [
        new Visualizer({
            filename: "./webpack-visualization/renderer.html"
        })
    ]
});
