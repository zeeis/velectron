/**
 * @description
 * A downloader for github releases in private repository.
 * It overwrites the origin downloader of electron. (see install.js)
 * This may be removed after the @zeeis/velectron becomes public.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * TODO:
 * Currently needs a PAT(Personal Access Token) to
 * download assets since the repo is private.
 * These codes may be removed in the future.
 */
let token = '';
if (process.env.GITHUB_PAT) token = process.env.GITHUB_PAT;
else {
  (() => {
    const home = process.env.HOME ||
                (process.env.HOMEDRIVE ? process.env.HOMEDRIVE + process.env.HOMEPATH : undefined);
    if (!home) {
      // console.error(`Cannot determine platform home directory. Pleaase set $GITHUB_PAT env`);
      return;
    }
    const npmrc = fs.readFileSync(path.resolve(home, '.npmrc')).toString();
    const matched = /\/\/npm.pkg.github.com\/:_authToken=(.*)/.exec(npmrc);
    if (matched[1]) token = matched[1];
    if (!token || !token.length) {
      // console.warn('Cannot find your PAT, ensure you have setted $GITHUB_PAT or write it to ~/.npmrc. Otherwise you may not able to download.');
      return;
    }
  })();
}
const apiUrl = 'https://api.github.com/repos/zeeis/velectron/releases';

const version = require('./version');
const download = async (url, dist, options) => {
  // electron-packager does not pass `options` to downloader
  // since velectron version is not matched to electron
  // we should replace `version` to correct one
  if (!options) {
    url = url.replace(/v\d+\.\d+\.\d+/g, 'v' + version);
  }
  // if (!token || !apiUrl) {
  //   throw new Error('Expect token and apiUrl');
  // }
  // Skip authorize if token is not set.
  // This will break installation if the velectron repo is private.
  if (!token) {
    console.log('No GITHUB_PAT was found. Assume the repo is public.')
  }
  const headers = token.length ? {
    Authorization: `token ${token}`,
  } : {};
  return axios({
    method: 'get',
    url: apiUrl,
    responseType: 'json',
    headers,
  }).then((res) => {
    const assets = (res.data.map(v => v.assets)).flat();
    for (const asset of assets) {
      if (asset.browser_download_url === url) {
        return axios({
          method: 'get',
          url: asset.url,
          responseType: 'stream',
          headers: Object.assign({}, headers, {
            Accept: 'application/octet-stream'
          }),
        }).then(({ data }) => new Promise(resolve => {
          data.pipe(fs.createWriteStream(dist));
          data.on('end', resolve);
        }));
      }
    }
    throw new Error(`${url} NOT FOUND`);
  });
};

module.exports = {
  download,
}