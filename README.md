# @dotlim/cli

> 微前端项目 CLI 工具，致力于前端工程化提效、提速！

## Install

```bash
$ npm install @dotlim/cli -g
```

## Usage

全局安装 `dotlim/cli` 脚手架工具后，我们具有以下能力：

### init

> 初始化业务插件

示例：

```bash
$ dotlim init test-app
```

## Development

由于这个脚手架我们是使用 typescript 开发的，并不能直接在 nodejs 中运行，需要将代码编译成 javascript，并且代码转化为 commonjs 模块化方案才能正常运行。因在设计上，我们把源代码放在 `/src` 目录，将编译后的文件输出到 `/lib` 目录，既满足开发需求，又满足生成环境需要。

发布本插件前，需要手动构建一次，保证 `/lib` 目录内的代码是最新代码。

## TODO

未来我们计划实现的功能：

- 插件自动/手动更新
- 本地用户保存插件配置，并提供后续修改/重置配置的指令
- 支持自动化修改已有插件的代码，做到重复性的工作工程化解决
