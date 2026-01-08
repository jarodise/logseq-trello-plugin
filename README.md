# Logseq Trello Plugin (logseq-trello-plugin)

A seamless integration between Logseq and Trello that allows you to import Trello cards as Logseq pages and keep them in sync.

## Features

This plugin provides seamless integration between Logseq and Trello, allowing you to:

- Create Trello cards directly from Logseq blocks or pages
- Import Trello cards as Logseq pages with full content and formatting
- Track relationships between Logseq pages and Trello cards via automatic URL linking
- Preserve all card content including descriptions, comments, and metadata
- Support Unicode characters (including Chinese, Japanese, etc.)
- Smart version control to prevent conflicts:
  * Tracks changes on both Trello and Logseq sides
  * Only updates content when necessary
  * Preserves local edits when they're more recent
- Intelligent duplicate handling:
  * Prevents creating duplicate cards
  * Updates existing cards instead of creating new ones
  * Maintains consistent links between platforms
- Import content in clean, block-based format for easy editing
- Allows the ability to convert a Logseq block into a task after the Trello card has been created
  * Handles both the TODO/DOING and LATER/NOW constructs
  * Does not convert a page to a task when creating a Trello card from a Logseq page

## Getting Started

### 1. Installation
1. Open Logseq Settings > Plugins
2. Search for "logseq-trello-plugin"
3. Click Install

### 2. Trello Authorization
1. Go to Plugin Settings > logseq-trello-plugin
2. Click "Click to Authorize with Trello"
3. Complete the authorization in the popup window
4. Copy the generated token and paste it in "Trello Token" field

### 3. Set Default List
1. Use `/Trello Get Lists` to view your boards and lists
2. Copy your preferred List ID
3. Paste it in plugin settings under "Default List ID"

### 4. Set Default Card Position
1. Go to Plugin Settings > logseq-trello-plugin
2. Set the default position for newly created Trello cards
  - Valid values are `top`, `bottom` (default) or an absolute numeric position

### 5. Use short or long URL
1. Go to Plugin Settings > logseq-trello-plugin
2. Setup to use either the short or long URL when adding the URL link to the block/page after creating a Trello card

### 6. Convert block to task
1. Go to Plugin Settings > logseq-trello-plugin
2. Set to convert the block to a task after creating a Trello card from a block
  - Note: the action of creating a Trello card from a page does **not** convert the page to a task

### 7. Available Commands
- `/Send Block to Trello`: Creates a new card from your current block
- `/Send Page to Trello`: Creates a new card from your current page (can trigger anywhere within the page)
- `/Trello Get Lists`: Shows all your Trello boards and lists
- `/Trello Pull Cards`: Imports all cards from your default list

### 8. Working with Cards
1. **Creating Cards**:
   - Select a block or page you want to send to Trello
   - Use `/Send Block to Trello` or `/Send Page to Trello`
   - The card's URL will be automatically added to your page

2. **Importing Cards**:
   - Position your cursor where you want the cards
   - Use `/Trello Pull Cards`
   - Each card becomes a Logseq page with:
     * Card description as blocks
     * Comments with timestamps
     * Card metadata (labels, due dates, etc.)

3. **Updating Content**:
   - The plugin tracks changes on both sides
   - New Trello content will be imported on next pull
   - Local changes are preserved when they're more recent

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

MIT
