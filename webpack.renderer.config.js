const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { build } = require('./package');
const baseConfig = require('./webpack.base.config');
const fixNedbForElectronRenderer = {
    apply(resolver) {
        resolver
        // Plug in after the description file (package.json) has been
        // identified for the import, which makes sure we're not getting
        // mixed up with a different package.
            .getHook('beforeDescribed-relative')
            .tapAsync(
                'FixNedbForElectronRenderer',
                (request, resolveContext, callback) => {
                    // When a require/import matches the target files, we
                    // short-circuit the Webpack resolution process by calling the
                    // callback with the finalized request object -- meaning that
                    // the `path` is pointing at the file that should be imported.
                    const isNedbImport = request.descriptionFileData['name'] === 'nedb';

                    if (isNedbImport && /storage(\.js)?/.test(request.path)) {
                        const newRequest = Object.assign({}, request, {
                            path: resolver.join(
                                request.descriptionFileRoot,
                                'lib/storage.js'
                            )
                        });
                        callback(null, newRequest);
                    } else if (
                        isNedbImport &&
                        /customUtils(\.js)?/.test(request.path)
                    ) {
                        const newRequest = Object.assign({}, request, {
                            path: resolver.join(
                                request.descriptionFileRoot,
                                'lib/customUtils.js'
                            )
                        });
                        callback(null, newRequest);
                    } else {
                        // Calling `callback` with no parameters proceeds with the
                        // normal resolution process.
                        return callback();
                    }
                }
            );
    }
};


module.exports = merge.smart(baseConfig, {
    target: 'electron-renderer',
    entry: {
        app: ['./src/renderer/app.tsx']
    },
    output: {
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    babelrc: false,
                    presets: [
                       [
                           '@babel/preset-env',
                            { 
                               targets: { browsers: 'last 2 versions ' },
                               modules: false
                            }
                        ],
                        '@babel/preset-typescript',
                        '@babel/preset-react'
                    ],
                    plugins: [
                        '@babel/plugin-transform-runtime',
                        [
                            '@babel/plugin-proposal-class-properties',
                            { loose: true }
                        ]
                    ]
                }
            },
            {
                test: /\.scss$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'babel-loader'
                    },
                    {
                        loader: '@svgr/webpack',
                        options: {
                            babel: true,
                            icon: true
                        }
                    }
                ]
            },
            {
                test: /\.(gif|png|jpe?g)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            },
            {
                test: /\.(dat|mp3)$/,
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
            reportFiles: ['src/renderer/**/*']
        }),
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({ title: build.productName }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
    ],
    resolve: {
        plugins: [
            // This plugin allow us to use nedb of node.js version directly
            // in renderer process (and the web index)
            // See https://stackoverflow.com/questions/55389659/persist-nedb-to-disk-in-electron-renderer-process-webpack-electron-nedb-configu
            fixNedbForElectronRenderer
        ]
    }
});
