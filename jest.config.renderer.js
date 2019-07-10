const common = {
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "json",
        "node"
    ],
    "moduleNameMapper": {
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/mocks/fileMock.js",
        "\\.(s?css|sass)$": "<rootDir>/mocks/styleMock.js"
    }
};

module.exports = {
    ...common,
    runner: '@jest-runner/electron',
    testEnvironment: '@jest-runner/electron/environment',
    testMatch: ['**/*.(spec|test).renderer.[jt]s?(x)']
};
