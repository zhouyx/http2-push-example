
const puppeteer = require('puppeteer');


async function testRun(browser, url, name, options = {}) {

  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  if (options.trace) {
    await page.tracing.start({path: `exports/${name}-trace.json`});
  }

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
  });
  page.evaluate(() => window.performance.mark('puppeteer-0'));

  if (options.screenshot) {
    await page.screenshot({path: `exports/${name}-screenshot-start.png`});
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

  if (options.screenshot) {
    await page.screenshot({path: `exports/${name}-screenshot-end.png`});
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

  const browser = await puppeteer.launch();

  const options = {};
  // const options = {trace: true};

  const metricsArray = [];

  // await testRun(browser, url, 'PRERUN', options);
  metricsArray.push(await testRun(browser, url, 'RUN1', options));
  // metricsArray.push(await testRun(browser, url, 'RUN2', options));

  await browser.close();

  console.log(JSON.stringify(metricsArray, null, 2));
})();
