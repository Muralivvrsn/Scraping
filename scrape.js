const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeLinkedIn(url, sessionCookie) {
  let options = new chrome.Options();
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addArguments('--disable-infobars');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  options.addArguments('--start-maximized');

  // Set a random user agent
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
  ];
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  options.addArguments(`--user-agent=${userAgent}`);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('https://www.linkedin.com'); // Navigate to LinkedIn first to set the session cookie

    // Set the session cookie
    await driver.manage().addCookie({
      name: 'li_at',
      value: sessionCookie,
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    // Refresh the page to apply the cookie
    await driver.navigate().refresh();

    // Check if the login was successful
    await driver.wait(until.elementLocated(By.css('.global-nav__me')), 10000);

    let pageNum = 1;

    async function scrapePage() {
      // Ensure the page is fully loaded
      await driver.wait(until.elementLocated(By.css('.search-results-container')), 10000);

      // Wait for the page to fully load
      await driver.sleep(5000);

      // Scroll down very slowly to the bottom
      await driver.executeScript(async () => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100; // Distance to scroll in pixels
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 500); // Interval time in ms
        });
      });

      // Wait for a random time between 5s to 10s
      await driver.sleep(5000 + Math.floor(Math.random() * 5000));

      // Scrape the required HTML content
      const data = await driver.findElement(By.css('.search-results-container')).getAttribute('outerHTML');

      if (data) {
        // Save the data to a file
        fs.writeFileSync(`page${pageNum}.html`, data);
        console.log(`Saved data from page ${pageNum}`);
        pageNum++;
      }

      // Scroll down very slowly to the bottom again
      await driver.executeScript(async () => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100; // Distance to scroll in pixels
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= document.body.scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 500); // Interval time in ms
        });
      });

      // Wait for a random time between 10s to 15s
      await driver.sleep(10000 + Math.floor(Math.random() * 5000));

      // Ensure pagination buttons are loaded
      await driver.wait(until.elementLocated(By.css('button[data-test-pagination-page-btn], button[aria-label="Next"]')), 10000);

      // Randomly decide to click on a page number or the "Next" button
      const paginationButtons = await driver.findElements(By.css('button[data-test-pagination-page-btn]'));
      const nextButton = await driver.findElements(By.css('button[aria-label="Next"]'));
      const clickPageNumber = Math.random() > 0.5 && paginationButtons.length > 0;

      if (clickPageNumber) {
        const pageNumberButton = paginationButtons[Math.floor(Math.random() * paginationButtons.length)];
        await pageNumberButton.click();
      } else if (nextButton.length > 0) {
        await nextButton[0].click();
      } else {
        console.log('No more pages to visit');
        return;
      }

      // Recursively scrape the next page
      await scrapePage();
    }

    // Navigate to the LinkedIn search URL
    await driver.get(url);

    await scrapePage();

  } finally {
    await driver.quit();
  }
}

const linkedInUrl = 'https://www.linkedin.com/search/results/people/'; // Replace with the actual LinkedIn search URL
const sessionCookie = 'AQEDAU92r2EB37miAAABj_KjqLAAAAGQFrAssFYAdbJk3HVFetKC6Z2ar-hMS_TxDFaAHmYRlLqQ26nYQkEXakqeAqR0_bEru9wVQCBwN3rFRU1SfwlYmrdP0EyTf2vtNKfMyqqY_KqE3Sx_ll_IaZ6I'; // Replace with your actual li_at cookie value

scrapeLinkedIn(linkedInUrl, sessionCookie).catch(console.error);
