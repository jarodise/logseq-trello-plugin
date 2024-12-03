# Logseq Trello Plugin (logseq-trello-plugin)

A seamless integration between Logseq and Trello that allows you to import Trello cards as Logseq pages and keep them in sync.

## Features

### 🔄 Bi-directional Sync
- Import Trello cards as Logseq pages
- Smart version control to prevent accidental overwrites
- Preserves your local edits when they're newer than Trello changes
- Intelligent duplicate handling on both Logseq and Trello sides

### 📝 Content Management
- Clean, block-based formatting of card content
- Preserves Unicode characters (including Chinese)
- Imports both card descriptions and comments
- Each paragraph and comment in separate blocks for easy editing

### 🛠️ Commands
- `/Send Block to Trello`: Create a Trello card from current block
- `/Send Page to Trello`: Create a Trello card from current page （you can trigger it anywhere on within the page you want to send）
- `/Trello Get Lists`: Discover your Trello boards and lists
- `/Trello Pull Cards`: Import all cards from the preset Default list

## Installation

1. Open Logseq
2. Go to Settings > Plugins
3. Search for "logseq-trello-plugin"
4. Click Install

## Configuration

1. Connect to Trello:
   - Open Logseq Settings
   - Go to Plugin Settings > logseq-trello-plugin
   - Click "Click to Authorize with Trello"
   - Authorize the plugin in the popup window
   - The token will be automatically generated
   - Copy the token and paste in the blank space below "Trello Token"

For simplicity purpose, currently you can only interact with ONE list from your Trello board, 
to set the default list, follow the steps below: 

2. Set Default List:

   - Use `/Trello Get Lists` command to view your boards and lists
   - Copy your preferred List ID
   - Paste it in the plugin settings under "Default List ID"

## Usage

### Creating Trello Cards
1. Write your content in Logseq
2. Use `/Send Block to Trello` to create a card from current block
3. Or use `/Send Page to Trello` to create a card from entire page
4. The Trello card URL will be added as a property

### Importing Cards
1. Place your cursor where you want to import cards
2. Type `/Trello Pull Cards`
3. Cards will be imported as separate pages with:
   - Card description (in blocks)
   - Comments section (if comments exist)
   - Each comment with timestamp

### Finding List IDs
1. Type `/Trello Get Lists`
2. View your boards and lists
3. Copy the desired List ID to plugin settings

## Smart Features

### Version Control
- Tracks last update time of both Trello cards and Logseq pages
- Only updates pages when Trello content is newer
- Preserves your local edits when they're more recent
- Prevents accidental overwrites

### Duplicate Handling
- Checks for existing cards before creating new ones
- Updates existing cards instead of creating duplicates
- Maintains consistent links between Logseq and Trello
- Preserves card history and comments

## Support

If you encounter any issues or have suggestions:
- Open an issue on GitHub
- Include steps to reproduce the problem
- Attach relevant error messages

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - feel free to use this plugin in your projects!

---

Made with ❤️ for the Logseq community
