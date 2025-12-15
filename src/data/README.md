# Player Data Management

This directory contains the player data for all team members.

## File Structure

- `players.json` - Contains all player information in a single JSON file

## How to Add a New Player

1. Open `players.json`
2. Add a new entry in the `players` object with a unique player ID (e.g., `"john-doe"`)
3. Fill in all the required fields (see example below)

### Player ID Format
- Use lowercase
- Use hyphens instead of spaces
- Example: `"sean-evans"`, `"john-doe"`, `"michael-smith"`

### Example Player Entry

```json
{
  "players": {
    "player-id": {
      "name": "Full Name",
      "number": "Jersey Number",
      "positions": "Position, Position, Position",
      "playerImg": "/players/player-id.jpg",
      "headerImg": "/headers/player-id-header.jpg",
      "logoImg": "/logos/team-logo.svg",
      "school": "School Name",
      "class": "Freshman | Sophomore | Junior | Senior",
      "heightWeight": "6'0\"/180 lbs",
      "batThrow": "L/R | R/R | L/L | R/L",
      "favoriteTeam": "Team Name",
      "postGameMeal": "Meal Preference",
      "twitter": "twitterhandle",
      "instagram": "instagramhandle"
    }
  }
}
```

## Image Management

### Player Photos
- Location: `public/players/`
- Naming: `player-id.jpg` (e.g., `sean-evans.jpg`)
- Recommended: 400x500px portrait orientation

### Header Background Images
- Location: `public/headers/`
- Naming: `player-id-header.jpg` (e.g., `sean-evans-header.jpg`)
- Recommended: 1200x300px landscape orientation
- Note: A blue gradient overlay will be applied automatically

### Logos
- Location: `public/logos/`
- Naming: `team-name-logo.svg` or `.png`
- Recommended: Square format (200x200px), SVG preferred

## URL Usage

Once a player is added to the JSON file, you can access their page using:

```
?player=player-id
```

Example:
```
?player=sean-evans
```

## Updating Player Information

Simply edit the `players.json` file and update the relevant fields. After pushing to GitHub and deploying to Netlify, the changes will be live.

## Notes

- All fields are optional except they will always display (empty if not provided)
- Social media handles should be without the @ symbol
- Image paths should start with `/` to reference files in the `public/` directory
- Player IDs should be unique and URL-friendly


