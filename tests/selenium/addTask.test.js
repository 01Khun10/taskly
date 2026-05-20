/**
 * Selenium test: adding a task through the UI persists it in the list.
 * APP_URL points at the deployed app (defaults to host machine on port 3000).
 */
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

describe('Add task UI flow', () => {
  let driver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  test('a typed task appears in the list after submission', async () => {
    const title = 'Selenium added task ' + Date.now();

    await driver.get(APP_URL);

    // Wait for the form input to be ready, type the title, submit
    const input = await driver.wait(until.elementLocated(By.id('task-input')), 10000);
    await input.clear();
    await input.sendKeys(title);
    await driver.findElement(By.id('add-btn')).click();

    // Wait until a list item containing our title is in the DOM
    await driver.wait(async () => {
      const items = await driver.findElements(By.css('#task-list li .title'));
      for (const item of items) {
        const text = await item.getText();
        if (text === title) return true;
      }
      return false;
    }, 10000, `Task "${title}" did not appear in the list`);

    // Sanity check: pull the visible list and confirm the title is present
    const titles = await Promise.all(
      (await driver.findElements(By.css('#task-list li .title'))).map(el => el.getText())
    );
    expect(titles).toContain(title);
  }, 30000);
});
