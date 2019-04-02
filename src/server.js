'use strict'

const express = require('express');
const app = express();
const fs = require('fs')
const path = require('path');
// eslint-disable-next-line

const PORT = process.env.PORT || 8000
const PUBLIC_PATH = path.join(__dirname, '../public')

app.listen(PORT, () => console.log(`Testing app listening on port ${PORT}!`))

const METADATA = {
  '/bundle1.js': {
    preload: [
      {path: '/bundle2.js'},
      {path: '/bundle3.js'},
    ],
    prefetch: [
      {path: '/bundle4.js'},
    ],
  },
};

app.get('*.js/', (req, res) => {
  onRequest(req, res);
});

app.use(express.static(PUBLIC_PATH))


// Link file.
function link(res, path, rel, forPath, headers) {
  console.log('link:' + 'rel: ', path, 'for: ', forPath);
  if (!headers['Link']) {
    headers['Link'] = [];
  }
  headers['Link'].push(`<${path}>; rel=${rel}; as=script; nopush`);
}


// Request handler.
function onRequest(req, res) {
  const [reqPath, query] = req.url.split('?');
  const filePath = reqPath == '/' ? '/index.html' : reqPath;
  console.log('onRequest: ', req.url, reqPath, query || '',
      req.headers['cache-control']);

  const file = fs.readFileSync(PUBLIC_PATH + filePath);
  const stat = fs.statSync(PUBLIC_PATH + filePath)

  // File not found
  if (!file || !stat) {
    console.log('404 ', reqPath);
    res.statusCode = 404;
    res.end();
    return;
  }

  // Push or link if needed.
  const headers = {
    'content-length': stat.size,
    'last-modified': stat.mtime.toUTCString(),
    'Cache-Control': 'public, max-age=600',
    'Content-Type': 'application/javascript',
  };
  // if (reqPath.endsWith('.js')) {
  //   //res.setHeader('Cache-Control', 'public, max-age=600');
  //   //headers['Cache-Control'] = 'public, max-age=600';
  // }
  const metadata = METADATA[reqPath];
  if (metadata && metadata.preload) {
    if (query == 'link') {
      metadata.preload.forEach(r => {
        link(res, r.path, 'preload', reqPath, headers);
      });
    }
  }
  if (metadata && metadata.prefetch) {
    metadata.prefetch.forEach(r => {
      link(res, r.path, 'prefetch', reqPath, headers);
    });
  }

  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    res.setHeader(keys[i], headers[keys[i]]);
  }

  res.end(file);
}
