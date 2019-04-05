'use strict'

const express = require('express');
const app = express();
const fs = require('fs')
const path = require('path');
const shell = require('shelljs');
// eslint-disable-next-line

const PORT = process.env.PORT || 8000
const PUBLIC_PATH = path.join(__dirname, '../public')

app.listen(PORT, () => console.log(`Testing app listening on port ${PORT}!`))

const METADATA = {
  '/bundle1.js': {
    preload: [
      {path: '/bundle2.js'},
      // {path: '/bundle3.js'},
    ],
    prefetch: [
      // {path: '/bundle4.js'},
    ],
  },
};

app.get('*.js/', (req, res) => {
  onJsRequest(req, res);
});

app.get('/test.html', (req, res) => {
  onTestHtmlRequest(req, res);
});

app.use('/important/restart/deploy', (req, res) => {
  const output = shell.exec('git pull origin master').stdout;
  res.end(output);
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


// Request handler for JavaScript.
function onJsRequest(req, res) {
  const [reqPath, query] = req.url.split('?');
  const filePath = reqPath == '/' ? '/index.html' : reqPath;
  console.log('onJsRequest: ', req.url, reqPath, query || '',
      req.headers['cache-control']);

  let file = fs.readFileSync(PUBLIC_PATH + filePath);
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
    'last-modified': stat.mtime.toUTCString(),
    'Cache-Control': 'public, max-age=600',
    'Content-Type': 'application/javascript',
  };
  const metadata = METADATA[reqPath];
  if (query == 'combine') {
    console.log('COMBINE');
    let fileString = file.toString('utf-8');

    // Process includes.
    while (true) {
      // Format: /* __INCLUDE__ bundle2.js */
      const start = fileString.indexOf('/* __INCLUDE__');
      if (start == -1) {
        break;
      }
      const end = fileString.indexOf('*/', start + 1);
      const otherName =
          fileString.substring(start + '/* __INCLUDE__'.length, end).trim();
      const otherFile = fs.readFileSync(PUBLIC_PATH + '/' + otherName);
      fileString =
          fileString.substring(0, start) +
          '/* bundle ' + otherName + '*/\n' +
          otherFile.toString('utf-8') +
          fileString.substring(end + 2);
    }

    // Process excludes
    while (true) {
      // Format: /* __EXCLUDE__ */ and /* __END_EXCLUDE__ */
      const start = fileString.indexOf('/* __EXCLUDE__ */');
      if (start == -1) {
        break;
      }
      const end = fileString.indexOf('/* __END_EXCLUDE__ */', start + 1);
      fileString =
          fileString.substring(0, start) +
          '/* exlcuded */\n' +
          fileString.substring(end + '/* __END_EXCLUDE__ */'.length);
    }

    // Complete.
    file = fileString;
  } else {
    if (metadata && metadata.preload) {
      if (query == 'link') {
        metadata.preload.forEach(r => {
          link(res, r.path, 'preload', reqPath, headers);
        });
      }
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


// Request handler for JavaScript.
function onTestHtmlRequest(req, res) {
  const [reqPath, query] = req.url.split('?');
  const filePath = '/test.html';
  const host = req.headers['host'].toLowerCase();
  console.log('onTestHtmlRequest: ', host, req.url, reqPath, query || '',
      req.headers['cache-control']);

  let file = fs.readFileSync(PUBLIC_PATH + filePath);
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
    'last-modified': stat.mtime.toUTCString(),
    'Cache-Control': 'public, max-age=600',
    'Content-Type': 'text/html',
  };

  const mode = query || 'nopush';

  // Transform.
  let fileString = file.toString('utf-8');

  // __SCRIPT_BASE__
  const scriptBase =
      host.indexOf('localhost') != -1
      ? ''
      : host.indexOf('zhouyx.dev') != -1
      ? '//preloadtest.com'
      : '//zhouyx.dev';
  fileString = fileString.replace('__SCRIPT_BASE__', scriptBase);

  // __NAME__
  fileString = fileString.replace('__NAME__', mode.toUpperCase());

  // __MODE__
  fileString = fileString.replace('__MODE__', mode);

  // Complete.
  file = fileString;

  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    res.setHeader(keys[i], headers[keys[i]]);
  }

  res.end(file);
}
