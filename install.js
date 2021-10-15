#!/usr/bin/env node

/**
 * This package is originally copied from https://www.npmjs.com/package/electron
 * and modified by Zeeis Team
 */

const version = require('./version');

const fs = require('fs');
const os = require('os');
const path = require('path');
const extract = require('extract-zip');

const { downloadArtifact } = require('@electron/get');
const downloader = require('./downloader');

if (process.env.ELECTRON_SKIP_BINARY_DOWNLOAD) {
  process.exit(0);
}

const platformPath = getPlatformPath();

if (isInstalled()) {
  process.exit(0);
}

/**
 * TODO:
 * Currently needs a PAT(Personal Access Token) to
 * download assets since the repo is private.
 * These codes may removed in the future.
 */
let token = '';
if (process.env.GITHUB_PAT) token = process.env.GITHUB_PAT;
else {
  const home = process.env.HOME ||
              (process.env.HOMEDRIVE ? process.env.HOMEDRIVE + process.env.HOMEPATH : undefined);
  if (!home) {
    console.error(`Cannot determine platform home directory. Pleaase set $GITHUB_PAT env`);
    process.exit(0);
  }
  const npmrc = fs.readFileSync(path.resolve(home, '.npmrc')).toString();
  const matched = /\/\/npm.pkg.github.com\/:_authToken=(.*)/.exec(npmrc);
  if (matched[1]) token = matched[1];
  if (!token || !token.length) {
    console.error('Cannot find your PAT, ensure you have setted $GITHUB_PAT or write it to ~/.npmrc');
    process.exit(0);
  }
}
// downloads if not cached
downloadArtifact({
  version,
  artifactName: 'electron',
  force: process.env.force_no_cache === 'true',
  cacheRoot: process.env.electron_config_cache,
  platform: process.env.npm_config_platform || process.platform,
  arch: process.env.npm_config_arch || process.arch,
  mirrorOptions: {
    mirror: 'https://github.com/zeeis/velectron/releases/download/'
  },
  downloadOptions: {
    token,
    apiUrl: 'https://api.github.com/repos/zeeis/velectron/releases',
  },
  downloader,
}).then(extractFile).catch(err => {
  console.error(err.stack);
  process.exit(1);
});

function isInstalled () {
  try {
    if (fs.readFileSync(path.join(__dirname, 'dist', 'version'), 'utf-8').replace(/^v/, '') !== version) {
      return false;
    }

    if (fs.readFileSync(path.join(__dirname, 'path.txt'), 'utf-8') !== platformPath) {
      return false;
    }
  } catch (ignored) {
    return false;
  }

  const electronPath = process.env.ELECTRON_OVERRIDE_DIST_PATH || path.join(__dirname, 'dist', platformPath);

  return fs.existsSync(electronPath);
}

// unzips and makes path.txt point at the correct executable
function extractFile (zipPath) {
  return new Promise((resolve, reject) => {
    extract(zipPath, { dir: path.join(__dirname, 'dist') }).then(err => {
      if (err) return reject(err);

      fs.writeFile(path.join(__dirname, 'path.txt'), platformPath, err => {
        if (err) return reject(err);

        resolve();
      });
    });
  });
}

function getPlatformPath () {
  const platform = process.env.npm_config_platform || os.platform();

  switch (platform) {
    case 'mas':
    case 'darwin':
      return 'Electron.app/Contents/MacOS/Electron';
    case 'freebsd':
    case 'openbsd':
    case 'linux':
      return 'electron';
    case 'win32':
      return 'electron.exe';
    default:
      throw new Error('Electron builds are not available on platform: ' + platform);
  }
}
