/**
 * Sample run options:
 *
 * ```
 * node puppeteer/test1.js https://preloadtest.com/test.html --runs=50 --output=exports/test6
 * ```
 */

const puppeteer = require('puppeteer');
const fs = require('fs')
const path = require('path');
const toCsv = require('./to_csv');


const OPTIONS = {
  'help': {type: 'boolean', desc: 'Command line options'},
  'runs': {type: 'int', desc: 'Number of tests to run in each use case'},
  'cpu': {type: 'int', desc: 'Throttling rate as a slowdown factor (1 is no throttle, 2 is 2x slowdown, etc).'},
  'trace': {type: 'boolean', desc: 'Output tracing log'},
  'screenshots': {type: 'boolean', desc: 'Output screenshots'},
  'output': {type: 'string', desc: 'Output directory'},
};


async function testRun(browser, url, name, options = {}) {

  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  if (options.cpu) {
    const client = await page.target().createCDPSession();
    /*
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 200, // ms
        downloadThroughput: 780 * 1024 / 8, // 780 kb/s
        uploadThroughput: 330 * 1024 / 8, // 330 kb/s
      });
    */
    // See https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
    await client.send('Emulation.setCPUThrottlingRate', {rate: options.cpu});
    // await page.evaluate(() => window.navigator.hardwareConcurrency);
  }

  if (options.trace) {
    await page.tracing.start({path: path.join(options.output, `${name}-trace.json`)});
  }

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
  });
  page.evaluate(() => window.performance.mark('puppeteer-0'));

  if (options.screenshots) {
    await page.screenshot({path: path.join(options.output, `${name}-screenshot-start.png`)});
  }

  await page.evaluate(() => window.mainBundlePromise);

  // Probe input latency.
  for (let i = 0; i < 8; i++) {
    page.evaluate(() => window.startInput());
    await page.click('body');
    await sleep(250);
  }

  const metrics = {
    'NAME': name,
    'URL': url,
    'OPTIONS': Object.assign({}, options, {
      // Exlcude some options.
      'runs': undefined,
      'output': undefined,
      'trace': undefined,
      'screenshots': undefined,
    }),
  };
  // setInterval(async function() {
  //   const debug = await page.evaluate(() => window.debug());
  //   console.log('debug: ', debug);
  // }, 5000);
  const pageMetrics = await page.evaluate(() => window.getMetricsPromise());
  Object.assign(metrics, pageMetrics);
  // console.log('METRICS: ', await page.metrics());

  if (options.trace) {
    await page.tracing.stop();
  }

  if (options.screenshots) {
    await page.screenshot({path: path.join(options.output, `${name}-screenshot-end.png`)});
  }

  await page.close();

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
  fs.mkdirSync(options.output, {recursive: true});

  // const usecases = ['combine', 'split1', 'split2', 'split1-nolink', 'split2-nolink'];
  const usecases = ['split1'];
  const metricsArrayMap = {};
  for (let j = 0; j < usecases.length; j++) {
    const usecase = usecases[j];
    metricsArrayMap[usecase] = [];
    fs.mkdirSync(path.join(options.output, usecase));
  }
  fs.mkdirSync(path.join(options.output, 'all'));

  const browser = await puppeteer.launch();

  if (options.runs > 1) {
    for (let j = 0; j < usecases.length; j++) {
      const usecase = usecases[j];
      await testRun(browser, url, `${usecase}-0`, options);
    }
  }
  for (let i = 1; i <= options.runs; i++) {
    for (let j = 0; j < usecases.length; j++) {
      const usecase = usecases[j];
      const name = `${usecase}-${i}`;
      console.log('Run ', name);
      const metrics = await testRun(browser, `${url}?${usecase}`, name, options);
      const json = JSON.stringify(metrics, null, 2);
      fs.writeFileSync(path.join(options.output, usecase, `${i}.json`), json);
      metricsArrayMap[usecase].push(metrics);
    }
  }

  await browser.close();

  for (let j = 0; j < usecases.length; j++) {
    const usecase = usecases[j];
    const metricsArray = metricsArrayMap[usecase];
    const json = JSON.stringify(metricsArray, null, 2);
    fs.writeFileSync(path.join(options.output, usecase, `ALL.json`), json);
    toCsv(path.join(options.output, usecase, `ALL.json`),
        path.join(options.output, usecase, `ALL.csv`));
    fs.copyFileSync(path.join(options.output, usecase, `ALL.csv`),
        path.join(options.output, 'all', `${usecase}.csv`));
  }
})();
