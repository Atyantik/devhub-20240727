import net from 'node:net';
import tls from 'node:tls';
import { URL } from 'node:url';
import { promisify } from 'node:util';

function sendHttpRequest(urlString, request, callback) {
  const url = new URL(urlString);
  const isHttps = url.protocol === 'https:';
  const port = url.port || (isHttps ? 443 : 80);
  const host = url.hostname;

  const sendResponse = (response) => {
    console.log('--------- RESPONSE START ---------');
    console.log(response);
    console.log('---------- RESPONSE END ----------\n\n');
    callback(null, response);
  };

  const options = {
    host,
    port,
    rejectUnauthorized: false // Ignore self-signed certificate validation for HTTPS
  };

  const client = isHttps ? tls.connect(options, onConnect) : net.createConnection(options, onConnect);

  let responseData = '';
  let headers = '';
  let body = '';
  let contentLength = null;
  let headersReceived = false;

  function onConnect() {
    console.log('--------- REQUEST START ---------');
    console.log(request);
    console.log('---------- REQUEST END ----------\n\n');
    client.write(request);
  }

  client.on('data', (data) => {
    responseData += data.toString();

    if (!headersReceived) {
      const headerEndIndex = responseData.indexOf('\r\n\r\n');
      if (headerEndIndex !== -1) {
        headers = responseData.slice(0, headerEndIndex);
        body = responseData.slice(headerEndIndex + 4);
        headersReceived = true;

        // Extract Content-Length
        const match = headers.match(/Content-Length: (\d+)/i);
        if (match) {
          contentLength = parseInt(match[1], 10);
        }
        if (contentLength === null) {
          // If Content-Length is not present, assume response is complete
          sendResponse(responseData);
          client.end();
        }
      }
    } else {
      body += data.toString();
    }

    if (headersReceived && contentLength !== null && body.length >= contentLength) {
      // Full response body received
      sendResponse(responseData);
      client.end();
    }
  });

  client.on('end', () => {
    if (!headersReceived || (contentLength !== null && body.length < contentLength)) {
      sendResponse(responseData); // Provide partial response if connection is closed prematurely
    }
  });

  client.on('error', (err) => {
    console.error('Connection error:', err);
    callback(err);
  });
}

export const request = promisify(sendHttpRequest);
