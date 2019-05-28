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

const DEP_BUNDLES = ['bundle2.js', 'bundle3.js'];

const MODES = {
  'combine': {},
  'split1': {
    splits: ['bundle3.js'],
  },
  'split2': {
    splits: DEP_BUNDLES,
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
    'Last-Modified': stat.mtime.toUTCString(),
    'Cache-Control': 'public, max-age=600',
    'Content-Type': 'application/javascript',
  };
  if (reqPath == '/bundle1.js' && query) {
    const [modeName, linking] = query.split('-');
    if (MODES[modeName]) {
      let fileString = file.toString('utf-8');
      const mode = MODES[modeName];
      const splits = mode.splits || [];

      // Replace "splits" in the binary.
      fileString = replace(fileString,
          'var splits = []; /* __REPLACE__ */',
          'var splits = ' + JSON.stringify(splits) + ';');

      // Inline non-split code.
      const inlines = [];
      DEP_BUNDLES.forEach(bundle => {
        if (splits.indexOf(bundle) != -1) {
          return;
        }
        const bundleFile = fs.readFileSync(PUBLIC_PATH + '/' + bundle);
        const bundleString = bundleFile.toString('utf-8');
        inlines.push(`
// Inlude ${bundle}.
next(function() {
  ${bundleString}
});`);
      });
      fileString = replace(fileString,
          '/* __INLINES__ */',
          inlines.join('\n') || '/* NO INCLUDES */');

      // Add links.
      if ((linking || 'link') == 'link') {
        splits.forEach(split => {
          link(res, `/${split}`, 'preload', reqPath, headers);
        });
      }

      // Complete.
      file = fileString;
    }
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


// Performs string replacement w/o string parameters.
function replace(str, substr, newStr) {
  var index = str.indexOf(substr);
  if (index == -1) {
    return str;
  }
  return str.substring(0, index)
      + newStr
      + str.substring(index + substr.length);
}
