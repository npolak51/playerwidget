const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = '/Users/NPolak/Desktop/Tahoma Data.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Parse header
const header = lines[0].split(',');
const nameIndex = 0;
const heightIndex = 1;
const weightIndex = 2;
const teamIndex = 3;
const mealIndex = 4;
const twitterIndex = 5;
const instagramIndex = 6;

// Helper function to generate player ID from name
function generatePlayerId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to clean social media handle
function cleanSocialHandle(handle) {
  if (!handle) return '';
  const cleaned = handle.trim().replace(/^@/, '');
  const lower = cleaned.toLowerCase();
  if (lower === 'n/a' || lower === 'no' || lower === 'none' || lower === 'dont have one' || lower === '') {
    return '';
  }
  return cleaned;
}

// Helper function to clean height
function cleanHeight(height) {
  if (!height) return '';
  // Replace various formats
  return height
    .replace(/"/g, "'")
    .replace(/,/g, "'")
    .replace(/ft/g, "'")
    .replace(/\s+/g, '')
    .trim();
}

// Parse players
const players = {};
const seenNames = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim() || line.startsWith(',')) continue;
  
  // Parse CSV line (handling quoted fields)
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());
  
  const name = fields[nameIndex]?.trim();
  if (!name || seenNames.has(name.toLowerCase())) continue;
  seenNames.add(name.toLowerCase());
  
  const playerId = generatePlayerId(name);
  const height = cleanHeight(fields[heightIndex]);
  const weight = fields[weightIndex]?.trim() || '';
  const heightWeight = height && weight ? `${height}/${weight} lbs` : '';
  
  players[playerId] = {
    name: name,
    number: '', // To be filled manually
    positions: '', // To be filled manually
    playerImg: `/players/${playerId}.jpg`,
    headerImg: `/headers/${playerId}-header.jpg`,
    logoImg: '',
    school: '',
    class: '', // To be filled manually
    heightWeight: heightWeight,
    batThrow: '', // To be filled manually
    favoriteTeam: fields[teamIndex]?.trim() || '',
    postGameMeal: fields[mealIndex]?.trim() || '',
    twitter: cleanSocialHandle(fields[twitterIndex]),
    instagram: cleanSocialHandle(fields[instagramIndex])
  };
}

// Create JSON structure
const output = {
  players: players
};

// Write to players.json
const outputPath = path.join(__dirname, 'src/data/players.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ Converted ${Object.keys(players).length} players to JSON`);
console.log(`📝 Output written to: ${outputPath}`);
console.log('\n⚠️  Note: You will need to manually fill in:');
console.log('   - number (jersey number)');
console.log('   - positions');
console.log('   - class');
console.log('   - batThrow');
console.log('   - school (if applicable)');
console.log('   - logoImg (if applicable)');


