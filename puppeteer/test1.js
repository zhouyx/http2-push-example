
const puppeteer = require('puppeteer');
const fs = require('fs')
const toCsv = require('./to_csv');

//test

const OPTIONS = {
  'help': {type: 'boolean'},
  'runs': {type: 'int'},
  'trace': {type: 'boolean'},
  'screenshots': {type: 'boolean'},
  'output': {type: 'string'},
};


async function testRun(browser, url, name, options = {}) {

  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  if (options.trace) {
    await page.tracing.start({path: `${options.output}${name}-trace.json`});
  }

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
  });
  page.evaluate(() => window.performance.mark('puppeteer-0'));

  if (options.screenshots) {
    await page.screenshot({path: `${options.output}${name}-screenshot-start.png`});
  }

  // Probe input latency.
  for (let i = 0; i < 8; i++) {
    page.evaluate(() => window.startInput());
    await page.click('body');
    await sleep(250);
  }

  const metrics = await page.evaluate(() => window.getMetricsPromise());
  metrics['NAME'] = name;

  if (options.trace) {
    await page.tracing.stop();
  }

  if (options.screenshots) {
    await page.screenshot({path: `${options.output}${name}-screenshot-end.png`});
  }

  await page.close();

  const json = JSON.stringify(metrics, null, 2);
  fs.writeFileSync(`${options.output}${name}-metrics.json`, json);
  return metrics;
}


async function sleep(interval) {
  return new Promise(resolve => {
    setTimeout(resolve, interval);
  })
}


(async () => {
  const args = process.argv.slice(2);
  const url = args[0];

  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const optionArg = args[i].substring(2);
      let [optionName, optionValue] = optionArg.split('=');
      const option = OPTIONS[optionName];
      if (!option) {
        options.error = `unknown option "${optionName}"`;
        break;
      }
      switch (option.type) {
        case 'boolean':
          optionValue = (optionValue == null || optionValue == 'true');
          break;
        case 'int':
          optionValue = parseInt(optionValue, 10);
          break;
        case 'number':
          optionValue = parseFloat(optionValue);
          break;
      }
      options[optionName] = optionValue;
    }
  }

  if (!url || options.help || options.error) {
    if (options.error) {
      console.error('ERROR: ' + options.error);
    }
    console.error('node test1.js <url> --option=value');
    console.error('Options:');
    for (const k in OPTIONS) {
      const option = OPTIONS[k];
      console.error(`--${k}(${option.type}): ${option.desc}`);
    }
    return;
  }

  if (!options.runs) {
    options.runs = 1;
  }
  if (!options.output) {
    options.output = 'exports/'
  }

  const browser = await puppeteer.launch();

  const metricsArray = [];

  if (options.runs <= 1) {
    metricsArray.push(await testRun(browser, url, 'RUN', options));
  } else {
    await testRun(browser, url, 'PRERUN', options);
    for (let i = 1; i <= options.runs; i++) {
      metricsArray.push(await testRun(browser, url, 'RUN' + i, options));
    }
  }

  await browser.close();

  const json = JSON.stringify(metricsArray, null, 2);
  fs.writeFileSync(`${options.output}metrics.json`, json);
  toCsv(`${options.output}metrics.json`);
})();
