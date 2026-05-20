/**
 * Selenium test: deleting a task removes it from the visible list.
 */
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

describe('Delete task UI flow', () => {
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

  test('clicking delete removes the task from the list', async () => {
    const title = 'Task to delete ' + Date.now();

    await driver.get(APP_URL);

    // Add the task we plan to delete
    const input = await driver.wait(until.elementLocated(By.id('task-input')), 10000);
    await input.clear();
    await input.sendKeys(title);
    await driver.findElement(By.id('add-btn')).click();

    // Wait for our li to appear, grab a reference to its delete button
    const targetButton = await driver.wait(async () => {
      const items = await driver.findElements(By.css('#task-list li'));
      for (const li of items) {
        const text = await li.findElement(By.css('.title')).getText();
        if (text === title) {
          return li.findElement(By.css('.delete-btn'));
        }
      }
      return null;
    }, 10000, `Could not find newly created task "${title}"`);

    await targetButton.click();

    // Wait until that title is no longer in the list
    await driver.wait(async () => {
      const titles = await Promise.all(
        (await driver.findElements(By.css('#task-list li .title'))).map(el => el.getText())
      );
      return !titles.includes(title);
    }, 10000, `Task "${title}" was not removed from the list`);

    const titlesAfter = await Promise.all(
      (await driver.findElements(By.css('#task-list li .title'))).map(el => el.getText())
    );
    expect(titlesAfter).not.toContain(title);
  }, 30000);
});
