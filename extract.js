const fs = require('fs');
const cheerio = require('cheerio');

function analyzeHTMLFiles() {
  const profiles = [];

  for (let i = 1; i <= 10; i++) {
    const html = fs.readFileSync(`page${i}.html`, 'utf8');
    const $ = cheerio.load(html);

    $('.reusable-search__result-container').each((index, element) => {
      const profile = {};

      // Extract profile URL
      const profileUrl = $(element).find('.app-aware-link').attr('href');
      profile.url = profileUrl ? profileUrl.split('?')[0] : '';

      // Extract profile name
      const name = $(element).find('.entity-result__title-text a span[aria-hidden="true"]').text().trim();
      profile.name = name;

      // Extract profile headline
      const headline = $(element).find('.entity-result__primary-subtitle').text().trim();
      profile.headline = headline;

      // Extract profile location
      const location = $(element).find('.entity-result__secondary-subtitle').text().trim();
      profile.location = location;

      // Extract profile image URL
      const imageUrl = $(element).find('.presence-entity__image').attr('src');
      profile.imageUrl = imageUrl || '';

      // Extract profile connection degree
      const connectionDegree = $(element).find('.entity-result__badge-text span[aria-hidden="true"]').text().trim();
      profile.connectionDegree = connectionDegree;

      profiles.push(profile);
    });
  }

  // Save profiles to a JSON file
  fs.writeFileSync('profiles.json', JSON.stringify(profiles, null, 2), 'utf8');
  console.log('Profiles extracted and saved to profiles.json');
}

// Run the function to analyze the HTML files
analyzeHTMLFiles();
