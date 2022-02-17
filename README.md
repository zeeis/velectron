# Velectron Publish Guide

## 1. 修改 `version.js` 中的版本号

``` javascript
module.exports = '11.5.0'
```

## 2. 打包 `dist.zip`

将打包好的各版本 `dist.zip` 放到 `dist` 下, 更名为 `electron-VERSION-PLATFORM-ARCH.zip`, 如 `electron-v11.5.0-win32-x64.zip`

## 3. Checksum

运行

``` sh
node checksum
```

生成 `dist/SHASUMS256.txt`

## 4. Release

在 `GitHub Release` 中将 `dist` 文件夹下的所有文件作为附件上传, `tag` 和 `Release title` 与前面的 `VERSION` 一致, 如 `v11.5.0`

## 5. Publish

**NOTE:** 需要配置 `GitHub Package`, 参考 [这篇教程](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

``` sh
npm publish
```

## 6. 在项目里更新依赖

``` sh
npm i -S @zeeis/velectron
```

## `electron.d.ts`

类型定义文件需要使用 `@electron/typescript-definitions` 生成

参考 [Github 链接](https://github.com/electron/typescript-definitions)
