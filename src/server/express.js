import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';

const app = express();
app.use((req,_,next) => {
  let rawBody = '';

  req.on('data', (chunk) => {
    rawBody += chunk;
  });

  req.on('end', () => {
    console.log(req.rawHeaders);
    console.log(rawBody);
  });
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multer().any());

app.use((req, res) => {
  return res.json({
    method: req.method,
    path: req.url,
    headers: req.headers,
    data: req.body,
  })
});

app.listen(8082, '0.0.0.0', () => {
  console.log('Express Server started on http://localhost:8082');
});