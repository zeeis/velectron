const { createHash } = require('crypto');
const fs = require('fs');

fs.readdir('./dist', (err, files) => {
  const sums = [];
  Promise.all(files.map(async file => new Promise(res =>{
    if (file.endsWith('.zip')) {
      const sha = createHash('sha256');
      const stream = fs.createReadStream(`./dist/${file}`);
      stream.on('data', d => sha.update(d));
      stream.on('end', () => {
        sums.push(`${sha.digest('hex')} *${file}`);
        res();
      });
    } else res();
  }))).then(() => {
    fs.writeFileSync('./dist/SHASUMS256.txt', sums.join('\n'));
  });
});
