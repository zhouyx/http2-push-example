
const puppeteer = require('puppeteer');
const path = require('path');


async function testRun(browser, url, name, options = {}) {

  // console.log('before pages');
  // const pages = await browser.pages();
  // console.log('pages: ', pages);
  // return;

  console.log('before newPage');
  const page = await browser.newPage();
  console.log('after newPage');
  await page.setCacheEnabled(false);
  console.log('after disable cache');

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

  console.log('before goto url');
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
  });
  console.log('after goto url');
  page.evaluate(() => window.performance.mark('puppeteer-0'));

  if (options.screenshots) {
    await page.screenshot({path: path.join(options.output, `${name}-screenshot-start.png`)});
  }

  console.log('sleep');
  await sleep(2000);
  console.log('get metrics');
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
  /*
    1. Run `adb devices` to confirm device is found.
    2. Run `adb forward tcp:9222 localabstract:chrome_devtools_remote`
    3.


    ????
    adb root
    adb shell cat /proc/net/unix | grep chrome_devtools_remote
   */

  const options = {};
  // const browser = await puppeteer.launch();
  console.log('connect');
  const browser = await puppeteer.connect({
    // browserWSEndpoint: 'ws://localhost:9222/devtools/page/4397',
    browserWSEndpoint: 'ws://localhost:9222/devtools/browser',
    ignoreHTTPSErrors: true,
    pipe: true,
  });
  console.log('connected');

  console.log('run test');
  await testRun(browser, 'https://www.google.com', 'vsync', options);
  console.log('test ran');

  await browser.close();
})();
