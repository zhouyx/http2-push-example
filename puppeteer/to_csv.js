
const fs = require('fs')
const path = require('path');


const DEFAULT_SPEC = [
  {col: 'NAME'},

  // navigation.
  {col: 'navigation.name', after: '?'},
  {col: 'navigation.duration'},
  {col: 'navigation.domainLookup', val: data => {
    return pathExprDelta(data, 'navigation.domainLookup');
  }},
  {col: 'navigation.connectStart'},
  {col: 'navigation.requestStart'},
  {col: 'navigation.responseStart'},
  {col: 'navigation.responseEnd'},
  {col: 'navigation.response', val: data => {
    return pathExprDelta(data, 'navigation.responseEnd', 'navigation.domainLookupStart');
  }},
  {col: 'navigation.transferSize'},
  {col: 'navigation.encodedBodySize'},
  {col: 'navigation.domInteractive'},
  {col: 'navigation.domContentLoadedEventStart'},
  {col: 'navigation.domComplete'},

  // html markers
  {col: 'mark:html-0.startTime'},
  {col: 'mark:html-3.startTime'},
  {col: 'mark:html-Z.startTime'},

  // resource:bundle1-js
  {col: 'resource:bundle1-js.initiatorType'},
  {col: 'resource:bundle1-js.startTime'},
  {col: 'resource:bundle1-js.duration'},
  {col: 'resource:bundle1-js.domainLookup', val: data => {
    return pathExprDelta(data, 'resource:bundle1-js.domainLookup');
  }},
  {col: 'resource:bundle1-js.fetchStart'},
  {col: 'resource:bundle1-js.requestStart'},
  {col: 'resource:bundle1-js.responseStart'},
  {col: 'resource:bundle1-js.responseEnd'},
  {col: 'resource:bundle1-js.response', val: data => {
    return pathExprDelta(data, 'resource:bundle1-js.responseEnd', 'resource:bundle1-js.fetchStart');
  }},
  {col: 'resource:bundle1-js.transferSize'},
  {col: 'resource:bundle1-js.encodedBodySize'},

  // bundle-1 markers
  {col: 'mark:bundle1-0.startTime'},
  {col: 'mark:bundle1-ask-bundle2.startTime'},
  {col: 'mark:bundle1-ask-bundle3.startTime'},
  {col: 'mark:bundle1-Z.startTime'},
  {col: 'mark:bundle1-1.startTime'},
  {col: 'mark:bundle1-2.startTime'},
  {col: 'mark:bundle1-3.startTime'},
  {col: 'mark:bundle1-ZZ.startTime'},


  // resource:bundle2-js
  {col: 'resource:bundle2-js.initiatorType'},
  {col: 'resource:bundle2-js.startTime'},
  {col: 'resource:bundle2-js.duration'},
  {col: 'resource:bundle2-js.domainLookup', val: data => {
    return pathExprDelta(data, 'resource:bundle2-js.domainLookup');
  }},
  {col: 'resource:bundle2-js.fetchStart'},
  {col: 'resource:bundle2-js.requestStart'},
  {col: 'resource:bundle2-js.responseStart'},
  {col: 'resource:bundle2-js.responseEnd'},
  {col: 'resource:bundle2-js.response', val: data => {
    return pathExprDelta(data, 'resource:bundle2-js.responseEnd', 'resource:bundle2-js.fetchStart');
  }},
  {col: 'resource:bundle2-js.transferSize'},
  {col: 'resource:bundle2-js.encodedBodySize'},

  // bundle-2 markers
  {col: 'mark:bundle2-0.startTime'},
  {col: 'mark:bundle2-Z.startTime'},
  {col: 'mark:bundle2-1.startTime'},
  {col: 'mark:bundle2-2.startTime'},
  {col: 'mark:bundle2-3.startTime'},
  {col: 'mark:bundle2-ZZ.startTime'},


  // resource:bundle3-js
  {col: 'resource:bundle3-js.initiatorType'},
  {col: 'resource:bundle3-js.startTime'},
  {col: 'resource:bundle3-js.duration'},
  {col: 'resource:bundle3-js.domainLookup', val: data => {
    return pathExprDelta(data, 'resource:bundle3-js.domainLookup');
  }},
  {col: 'resource:bundle3-js.fetchStart'},
  {col: 'resource:bundle3-js.requestStart'},
  {col: 'resource:bundle3-js.responseStart'},
  {col: 'resource:bundle3-js.responseEnd'},
  {col: 'resource:bundle3-js.response', val: data => {
    return pathExprDelta(data, 'resource:bundle3-js.responseEnd', 'resource:bundle3-js.fetchStart');
  }},
  {col: 'resource:bundle3-js.transferSize'},
  {col: 'resource:bundle3-js.encodedBodySize'},

  // bundle-2 markers
  {col: 'mark:bundle3-0.startTime'},
  {col: 'mark:bundle3-Z.startTime'},
  {col: 'mark:bundle3-1.startTime'},
  {col: 'mark:bundle3-2.startTime'},
  {col: 'mark:bundle3-3.startTime'},
  {col: 'mark:bundle3-ZZ.startTime'},


  // General document markers:
  {col: 'mark:DOMContentLoaded.startTime'},
  {col: 'mark:onload.startTime'},
  {col: 'paint:first-paint.startTime'},
  {col: 'paint:first-contentful-paint.startTime'},
  {col: 'mark:FirstIdle.startTime'},
  {col: 'mark:FirstIdleAfterMainBundle.startTime'},
  {col: 'mark:puppeteer-0.startTime'},

  // Input.
  {col: 'measure:input-0.startTime'},
  {col: 'measure:input-0.duration'},
  {col: 'mark:input-0.startTime'},
  {col: 'measure:input-idle-0.duration'},
  {col: 'mark:input-idle-0.startTime'},

  {col: 'measure:input-1.startTime'},
  {col: 'measure:input-1.duration'},
  {col: 'mark:input-1.startTime'},
  {col: 'measure:input-idle-1.duration'},
  {col: 'mark:input-idle-1.startTime'},

  {col: 'measure:input-2.startTime'},
  {col: 'measure:input-2.duration'},
  {col: 'mark:input-2.startTime'},
  {col: 'measure:input-idle-2.duration'},
  {col: 'mark:input-idle-2.startTime'},

  {col: 'measure:input-3.startTime'},
  {col: 'measure:input-3.duration'},
  {col: 'mark:input-3.startTime'},
  {col: 'measure:input-idle-3.duration'},
  {col: 'mark:input-idle-3.startTime'},

  {col: 'measure:input-4.startTime'},
  {col: 'measure:input-4.duration'},
  {col: 'mark:input-4.startTime'},
  {col: 'measure:input-idle-4.duration'},
  {col: 'mark:input-idle-4.startTime'},

  // Long task and TTI.
  {col: 'mark:TTI.startTime'},
  {col: 'longTasks.count', val: data => {
    const longTasks = data['longTasks'];
    return longTasks.length;
  }},
  {col: 'longTasks.totalDuration', val: data => {
    const longTasks = data['longTasks'];
    return longTasks.reduce(
        (accumulator, item) => accumulator + item['duration'],
        0);
  }},
  {col: 'longTasks.names', val: data => {
    const longTasks = data['longTasks'];
    const res = [];
    longTasks.forEach(item => res.push(item['name']));
    return res.join(';');
  }},
];


function main(args, spec) {
  console.log('to_csv: ', args);

  const path = args[0];

  const json = JSON.parse(fs.readFileSync(path).toString('utf-8'));
  console.log(json);

  var output = toCsv(json, spec);
  fs.writeFileSync(path + '.csv', output);
  console.log();
  console.log();
  console.log();
  console.log();
  console.log(output);
}


function convertAll() {
  console.log('convertAll');

  const path = 'exports/test3/3g';
  const name = 'combine';
  const runs = 200;
  const outPath = path + '/all/' + name + '.csv';

  const allJson = [];
  for (let i = 1; i <= runs; i++) {
    const fileName = `${path}/${name}/${i}.json`;
    const json = JSON.parse(fs.readFileSync(fileName).toString('utf-8'));
    allJson.push(json);
  }

  const output = toCsv(allJson, DEFAULT_SPEC);
  fs.writeFileSync(outPath, output);
}


function toCsv(json, spec) {
  const _output = [];
  function line(vals) {
    _output.push(vals.map(v => {
      if (v) {
        const sv = String(v);
        if (sv.indexOf('"') != -1) {
          v = sv.replace(/\"/g, '');
        }
        if (sv.indexOf(',') != -1) {
          v = `"${v}"`;
        }
      }
      return v;
    }).join(','));
  }

  // Header.
  line(spec.map(c => c.col));

  // Body.
  for (let i = 0; i < json.length; i++) {
    const data = json[i];
    line(spec.map(c => {
      let val;
      const expr = c.val || c.col;
      if (typeof expr == 'string') {
        val = pathExpr(data, expr);
      } else if (typeof expr == 'function') {
        val = expr(data);
      } else {
        throw 'unknown expr type: ' + (typeof expr);
      }
      if (val != null) {
        if (c.after) {
          const sval = String(val);
          const index = sval.lastIndexOf(c.after);
          if (index != -1) {
            val = sval.substring(index + c.after.length);
          }
        }
      }
      return val;
    }));
  }

  return _output.join('\n');
}


function pathExpr(data, expr) {
  const parts = expr.split('.');
  let res = data;
  for (let i = 0; i < parts.length; i++) {
    res = res[parts[i]];
    if (res == null) {
      break;
    }
  }
  return res;
}


function pathExprDelta(data, endExpr, startExpr) {
  if (!startExpr) {
    startExpr = endExpr + 'Start';
    endExpr = endExpr + 'End';
  }
  return pathExpr(data, endExpr) - pathExpr(data, startExpr);
}


function toDefaultCsv(path, outPath) {
  const json = JSON.parse(fs.readFileSync(path).toString('utf-8'));
  const output = toCsv(json, DEFAULT_SPEC);
  fs.writeFileSync(outPath, output);
}


module.exports = toDefaultCsv;

// main(process.argv.slice(2), DEFAULT_SPEC);
// convertAll();
