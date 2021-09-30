/**
 * @description
 * A downloader for github releases in private repository.
 * It overwrites the origin downloader of electron. (see install.js)
 * This may be removed after the @zeeis/velectron becomes public.
 */
const axios = require('axios');
const fs = require('fs');

const download = async (url, dist, options) => {
  if (!options.token || !options.apiUrl) {
    throw new Error('Expect token and apiUrl');
  }
  const headers = {
    Authorization: `token ${options.token}`,
  };
  return axios({
    method: 'get',
    url: options.apiUrl,
    responseType: 'json',
    headers,
  }).then((res) => {
    const assets = (res.data.map(v => v.assets)).flat();
    for (const asset of assets) {
      if (asset.browser_download_url === url) {
        console.log(asset.url);
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