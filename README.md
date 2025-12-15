# Player Widget

A reusable player profile header component for baseball team websites, built with React and Tailwind CSS.

## Features

- Clean, modern design matching Figma specifications
- Scalable player data management via JSON
- Customizable images (player photos, header backgrounds, logos)
- Responsive design
- Easy integration with SquareSpace via Netlify

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add player data to `src/data/players.json`

3. Add images to:
   - `public/players/` - Player photos
   - `public/headers/` - Header background images
   - `public/logos/` - Team/school logos

4. Build for production:
```bash
npm run build
```

## Deployment

This project is configured for:
- **GitHub** - Source code repository
- **Netlify** - Hosting and deployment
- **SquareSpace** - Integration via code block

## Usage

### Adding Players

See `src/data/README.md` for detailed instructions on adding and managing players.

### URL Structure

Access a player's page using:
```
?player=player-id
```

Example:
```
?player=sean-evans
```

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Project Structure

```
├── src/
│   ├── data/
│   │   ├── players.json    # Player data
│   │   └── README.md       # Data management guide
│   ├── Player/
│   │   └── PlayerPage.jsx  # Main component
│   └── index.css           # Styles and design system
├── public/
│   ├── players/            # Player photos
│   ├── headers/            # Header backgrounds
│   └── logos/              # Team logos
└── dist/                   # Build output
```

## Customization

All player information is managed through `src/data/players.json`. The component automatically reads from this file based on the `player` URL parameter.

For styling changes, see `src/index.css` which contains the Figma design system.
