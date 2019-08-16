const merge = require('webpack-merge');
const webpack = require('webpack');

const baseConfig = require('./webpack.main.config');

module.exports = merge.smart(baseConfig, {
    mode: 'production',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        }),
    ]
});
