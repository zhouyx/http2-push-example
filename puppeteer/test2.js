
const puppeteer = require('puppeteer');
const path = require('path');


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

  await sleep(2000);
  console.log(name, 'metrics: ', await page.metrics());

  if (options.trace) {
    await page.tracing.stop();
  }

  if (options.screenshots) {
    await page.screenshot({path: path.join(options.output, `${name}-screenshot-end.png`)});
  }

  await page.close();
}


async function sleep(interval) {
  return new Promise(resolve => {
    setTimeout(resolve, interval);
  })
}


(async () => {
  const options = {};
  const browser = await puppeteer.launch();

  await testRun(browser, 'http://localhost:8000/test2.html?slow', 'slow', options);
  await testRun(browser, 'http://localhost:8000/test2.html?vsync', 'vsync', options);

  await browser.close();
})();
