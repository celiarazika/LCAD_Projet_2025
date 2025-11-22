const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');

const root = path.join(__dirname, '..');
const inputPath = path.join(root, 'games.json');
const outputPath = path.join(root, 'games_meta.json');

console.log('Building games_meta.json from', inputPath);

if (!fs.existsSync(inputPath)) {
  console.error('Source file not found:', inputPath);
  process.exit(1);
}

const readStream = fs.createReadStream(inputPath, { encoding: 'utf8' }).pipe(JSONStream.parse('$*'));
const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });

writeStream.write('[\n');
let first = true;
let count = 0;

readStream.on('data', (data) => {
  try {
    const appId = data.key;
    const g = data.value;
    if (!g) return;

    const tags = Object.keys(g.tags || {});

    const obj = {
      appId: String(appId),
      title: g.name || '',
      positive: g.positive || 0,
      negative: g.negative || 0,
      reviewsTotal: (g.positive || 0) + (g.negative || 0),
      price: typeof g.price === 'number' ? g.price : null,
      releaseDate: g.release_date || null,
      tags: tags,
      genres: g.genres || [],
      categories: g.categories || [],
      description: g.short_description || '',
      headerImage: g.header_image || '',
      developers: g.developers || [],
      publishers: g.publishers || [],
      languages: g.supported_languages || [],
      metacriticScore: g.metacritic_score || null,
      recommendations: g.recommendations || null,
      estimatedOwners: g.estimated_owners || null,
      averagePlaytime: g.average_playtime_forever || 0
    };

    if (!first) writeStream.write(',\n');
    writeStream.write(JSON.stringify(obj));
    first = false;
    count++;
    if (count % 10000 === 0) console.log(`${count} items processed...`);
  } catch (err) {
    console.error('Error processing item:', err);
  }
});

readStream.on('end', () => {
  writeStream.write('\n]\n');
  writeStream.end();
  console.log(`Finished. ${count} items written to ${outputPath}`);
});

readStream.on('error', (err) => {
  console.error('Read error:', err);
  process.exit(1);
});

writeStream.on('error', (err) => {
  console.error('Write error:', err);
  process.exit(1);
});
