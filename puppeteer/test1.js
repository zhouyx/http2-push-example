
const puppeteer = require('puppeteer');


async function testRun(browser, name, options = {}) {

  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  if (options.trace) {
    await page.tracing.start({path: `${name}-trace.json`});
  }

  await page.goto('http://localhost:8000/examples/multi-closure.html', {
    waitUntil: 'domcontentloaded',
  });

  if (options.screenshot) {
    await page.screenshot({path: `${name}-screenshot-start.png`});
  }

  await page.click('body');

  const metrics = await page.evaluate(() => window.getMetricsPromise());
  metrics['NAME'] = name;

  if (options.trace) {
    await page.tracing.stop();
  }

  if (options.screenshot) {
    await page.screenshot({path: `${name}-screenshot-end.png`});
  }

  await page.close();

  return metrics;
}


(async () => {
  const browser = await puppeteer.launch();

  const options = {};

  const metricsArray = [];

  metricsArray.push(await testRun(browser, 'RUN1', options));
  metricsArray.push(await testRun(browser, 'RUN2', options));

  await browser.close();

  console.log('METRICS: ', JSON.stringify(metricsArray, null, 2));
})();
