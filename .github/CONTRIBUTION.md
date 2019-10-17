# How to contribute 🌟

I'm really happy you're reading this.😄 Thanks for taking the time to contribute!👍

- Pomodoro Logger's roadmap is shown on the [issue page](https://github.com/zxch3n/PomodoroLogger/issues)
- If you find a bug or want a new feature, [create an issue](https://github.com/zxch3n/PomodoroLogger/issues)
- If you want to work on an issue, comment on it to let me know

# Development

This project is built by [Electron](https://electronjs.org). 

You only need to install the latest version of node.js and node-gyp to build this project.

Issue the following commands to make sure you are ready to go,

```
yarn
yarn build
yarn test
```

Start development 💻

```
yarn start-dev
```

---

If you are in China, there may be a connection problem when setting things up. 

Before running `yarn`, issue 

```
ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"
```

Alternatively, you can add the following lines to `.npmrc` and `.yarnrc` files.

```bash
# ~/.npmrc
registry=https://registry.npm.taobao.org
electron_mirror=https://npm.taobao.org/mirrors/electron/
```

and

```bash
# ~/.yarnrc
registry "https://registry.npm.taobao.org"
electron_mirror "https://npm.taobao.org/mirrors/electron/"
```


## Coding Conventions

- Don't use independent CSS file, use [styled-component](https://www.styled-components.com) instead
- Follow the linter