import { request } from "./util.js";

// Common headers
const COMMON_HEADERS = [
  'Host: localhost:8080',
  'User-Agent: AT-Tutorial/1.0',
  'Accept: text/html',
  'Accept-Language: en-US,en;q=0.5',
  'Accept-Encoding: gzip, deflate',
  'Connection: keep-alive',
  'Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
  'Cookie: sessionId=abc123; userId=789',
  'Referer: https://localhost:8080/',
  'Cache-Control: no-cache',
  'Pragma: no-cache',
  'Upgrade-Insecure-Requests: 1',
  'DNT: 1',
  'Origin: https://localhost:8080'
];

const GET = [
  'GET / HTTP/1.1',
  ...COMMON_HEADERS,
  '',
  ''
].join('\r\n');

const POST = [
  'POST / HTTP/1.1',
  'Host: localhost:8080',
  'User-Agent: AT-Tutorial/1.0',
  'Content-Type: application/x-www-form-urlencoded',
  'Content-Length: 23',
  '',
  'key1=value1&key2=value2',
].join('\r\n');

// POST multipart/form-data
const boundary = '--------------------------359139921685966133171100';
const postContent = [
  `--${boundary}\r\n`,
  'Content-Disposition: form-data; name="key1"\r\n\r\n',
  'value1\r\n',
  `--${boundary}\r\n`,
  'Content-Disposition: form-data; name="key2"\r\n\r\n',
  'value2\r\n',
  `--${boundary}--`,
].join('');
const POST_MULTIPART_FORM = [
  'POST / HTTP/1.1',
  'Host: localhost:8080',
  'User-Agent: AT-Tutorial/1.0',
  `Content-Type: multipart/form-data; boundary=${boundary}`,
  `Content-Length: ${Buffer.byteLength(postContent)}`,
  '',
  postContent,
].join('\r\n');

// POST application/json
const POST_JSON = [
  'POST / HTTP/1.1',
  'Host: localhost:8080',
  'User-Agent: AT-Tutorial/1.0',
  'Content-Type: application/json',
  'Content-Length: 33',
  '',
  '{"key1":"value1","key2":"value2"}'
].join('\r\n');


// DELETE Request
const DELETE = [
  'DELETE / HTTP/1.1',
  ...COMMON_HEADERS,
  '',
  ''
].join('\r\n');

// HEAD Request
const HEAD = [
  'HEAD / HTTP/1.1',
  ...COMMON_HEADERS,
  '',
  ''
].join('\r\n');

// OPTIONS Request
const OPTIONS = [
  'OPTIONS / HTTP/1.1',
  ...COMMON_HEADERS,
  '',
  ''
].join('\r\n');

await request('http://localhost:8082', OPTIONS);
