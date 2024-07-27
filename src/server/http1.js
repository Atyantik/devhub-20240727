import { createServer } from 'node:https';
import { createReadStream } from 'node:fs';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import mime from 'mime-types';
import zlib from 'node:zlib';

const brotliOptions = {
  chunkSize: 32 * 1024,
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 10,
  },
};

const httpsPort = 8080;
const httpsHost = 'localhost';

// SSL options
const options = {
  key: readFileSync(resolve('ssl', 'server-key.pem')),
  cert: readFileSync(resolve('ssl', 'server-cert.pem'))
};
const html = readFileSync(resolve('src', 'index.html'), { encoding: 'utf-8' });

const httpsServer = createServer(options, async (req, res) => {
  const filePath = resolve(req.url.substring(1));
  if (req.url === '/') {
    console.log('Request Headers', req.rawHeaders);
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.write(html);
    res.end();
    return;
  }
  try {
    const mimeType = mime.lookup(extname(filePath)) || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Encoding': 'br'
    });

    const readStream = createReadStream(filePath);
    const brotliStream = zlib.createBrotliCompress(brotliOptions);
    readStream.pipe(brotliStream).pipe(res);
  } catch (error) {
    console.log(error);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('File not found');
    res.end();
  }
});

httpsServer.listen(httpsPort, httpsHost, () => {
  console.log(`HTTPS server listening on: https://${httpsHost}:${httpsPort}`);
});
