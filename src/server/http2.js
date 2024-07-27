import { createSecureServer } from 'node:http2';
import { createReadStream } from 'node:fs';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import mime from 'mime-types';
import zlib from 'node:zlib';

const http2Port = 8081;
const http2Host = '0.0.0.0';

const brotliOptions = {
  chunkSize: 32 * 1024,
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 10,
  },
};


// SSL options
const options = {
  key: readFileSync(resolve('ssl', 'server-key.pem')),
  cert: readFileSync(resolve('ssl', 'server-cert.pem')),
};
const html = readFileSync(resolve('src', 'index.html'), { encoding: 'utf-8' });

// Create the HTTP/2 server with TLS
const http2Server = createSecureServer(options, async (req, res) => {
  const filePath = resolve(req.url.substring(1));
  if (req.url === '/') {
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

http2Server.listen(http2Port, http2Host, () => {
  console.log(`HTTP/2 server listening on: https://${http2Host}:${http2Port}`);
});
