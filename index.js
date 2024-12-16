/**
 * Trello Integration Plugin
 */

// Our Trello API Key
const TRELLO_API_KEY = "9537467993aefd6dca9ee7788179c298";

// Settings for the plugin
const settings = [
  {
    key: "trelloToken",
    type: "string",
    title: "Trello Token",
    description: `Get your token here: <a href="https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=LogSeq%20Trello%20Plugin&key=${TRELLO_API_KEY}" target="_blank">Click to Authorize with Trello</a>`,
    default: ""
  },
  {
    key: "defaultListId",
    type: "string",
    title: "Default List ID",
    description: "Use /Trello Get Lists to find your list ID, then paste it here",
    default: ""
  },
  {
    key: "defaultCardPos",
    type: "string",
    title: "Default Card Position",
    description: "The default position in Trello list for new cards.  Specify either top, bottom or an absolute numeric position",
    default: "bottom" // defaulting to bottom doesn't change existing behaviour
  },
  {
    key: "shortUrl",
    type: "boolean",
    title: "Use short or long Trello card URL",
    description: "Use the short URL in block/page content after creating a Trello card",
    default: false // defaulting to false doesn't change existing behaviour
  }
];

async function fetchTrelloLists(token) {
  try {
    // First get boards
    const boardsResponse = await fetch(
      `https://api.trello.com/1/members/me/boards?token=${token}&key=${TRELLO_API_KEY}`
    );
    
    if (!boardsResponse.ok) {
      throw new Error('Failed to fetch boards');
    }

    const boards = await boardsResponse.json();

    // Get lists for each board
    const allBoards = [];
    for (const board of boards) {
      const listsResponse = await fetch(
        `https://api.trello.com/1/boards/${board.id}/lists?token=${token}&key=${TRELLO_API_KEY}`
      );
      
      if (!listsResponse.ok) {
        continue; // Skip this board but continue with others
      }

      const lists = await listsResponse.json();
      if (lists && Array.isArray(lists)) {
        allBoards.push({
          name: board.name,
          lists: lists.map(list => ({
            id: list.id,
            name: list.name
          }))
        });
      }
    }

    return allBoards;
  } catch (error) {
    console.error('Error in fetchTrelloLists:', error);
    throw error;
  }
}

async function checkExistingCard(token, listId, name) {
  const cards = await fetchTrelloCards(token, listId);
  return cards.find(card => card.name === name);
}

async function createTrelloCard(token, listId, name, cardPosition, desc = '') {
  // First check if card already exists
  const existingCard = await checkExistingCard(token, listId, name);
  if (existingCard) {
    // If card exists, update it instead
    const response = await fetch(
      `https://api.trello.com/1/cards/${existingCard.id}?token=${token}&key=${TRELLO_API_KEY}`, 
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          desc: desc || existingCard.desc // Keep old description if no new one provided
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update existing card');
    }

    return await response.json();
  }

  // If no existing card, create new one
  const response = await fetch(
    `https://api.trello.com/1/cards?token=${token}&key=${TRELLO_API_KEY}`, 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        idList: listId,
        desc: desc,
        pos: cardPosition
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create card');
  }

  return await response.json();
}

async function fetchTrelloCards(token, listId) {
  const response = await fetch(
    `https://api.trello.com/1/lists/${listId}/cards?token=${token}&key=${TRELLO_API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }

  return await response.json();
}

async function fetchCardComments(token, cardId) {
  const response = await fetch(
    `https://api.trello.com/1/cards/${cardId}/actions?filter=commentCard&token=${token}&key=${TRELLO_API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch card comments');
  }

  return await response.json();
}

async function getPageLastUpdated(pageName) {
  try {
    const blocks = await logseq.Editor.getPageBlocksTree(pageName);
    if (!blocks || blocks.length === 0) return null;

    // Check for last-updated property in the first block
    const properties = blocks[0].properties;
    if (properties && properties['last-updated']) {
      return new Date(properties['last-updated']);
    }
    return null;
  } catch (error) {
    console.error('Error getting page last updated:', error);
    return null;
  }
}

async function createPageContent(card, token, startingBlockUuid) {
  let currentBlockUuid = startingBlockUuid;

  // Set last-updated property
  await logseq.Editor.upsertBlockProperty(
    startingBlockUuid,
    'last-updated',
    card.dateLastActivity
  );

  // Add description paragraphs if exists
  if (card.desc) {
    const paragraphs = card.desc.split('\n\n').filter(p => p.trim());
    for (const paragraph of paragraphs) {
      currentBlockUuid = (await logseq.Editor.insertBlock(
        currentBlockUuid,
        paragraph.trim(),
        { sibling: true }
      )).uuid;
    }
  }

  // Add comments if any
  try {
    const comments = await fetchCardComments(token, card.id);
    if (comments && comments.length > 0) {
      // Add comments heading
      currentBlockUuid = (await logseq.Editor.insertBlock(
        currentBlockUuid,
        '## Comments',
        { sibling: true }
      )).uuid;

      // Add each comment as a separate block
      for (const comment of comments) {
        currentBlockUuid = (await logseq.Editor.insertBlock(
          currentBlockUuid,
          `${comment.data.text} (${new Date(comment.date).toLocaleString('zh-CN')})`,
          { sibling: true }
        )).uuid;
      }
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
  }

  return currentBlockUuid;
}

async function createNewPage(card, pageName, token) {
  try {
    // First create the page with just the name
    const page = await logseq.Editor.createPage(pageName);
    if (!page) throw new Error('Failed to create page');

    // Get the first block of the page
    const blocks = await logseq.Editor.getPageBlocksTree(pageName);
    if (!blocks || blocks.length === 0) throw new Error('No blocks found in page');
    
    await createPageContent(card, token, blocks[0].uuid);
    return { name: pageName, isNew: true };
  } catch (error) {
    console.error(`Error creating new page for card "${card.name}":`, error);
    throw error;
  }
}

async function updateExistingPage(card, pageName, token) {
  try {
    // Get the page and check last update time
    const pageLastUpdated = await getPageLastUpdated(pageName);
    const cardLastUpdated = new Date(card.dateLastActivity);

    // If page is newer than card, skip update
    if (pageLastUpdated && pageLastUpdated >= cardLastUpdated) {
      console.log(`Skipping update for ${pageName} as local version is newer`);
      return { name: pageName, isNew: false, wasUpdated: false };
    }

    // Get the page and its blocks
    const page = await logseq.Editor.getPage(pageName);
    if (!page) throw new Error('Page not found');

    const blocks = await logseq.Editor.getPageBlocksTree(pageName);
    if (!blocks || blocks.length === 0) throw new Error('No blocks found in page');

    // Clear all content by removing all blocks except the first one
    for (let i = 1; i < blocks.length; i++) {
      await logseq.Editor.removeBlock(blocks[i].uuid);
    }

    // Clear the first block's content
    await logseq.Editor.updateBlock(blocks[0].uuid, '');

    // Recreate the content
    await createPageContent(card, token, blocks[0].uuid);
    return { name: pageName, isNew: false, wasUpdated: true };
  } catch (error) {
    console.error(`Error updating page for card "${card.name}":`, error);
    throw error;
  }
}

async function createPageFromCard(card, token) {
  // Create a safe page name (preserve Chinese characters and other Unicode, only remove truly problematic characters)
  const pageName = card.name
    .replace(/[\[\]#^{}\\<>*?/|"]/g, '') // Remove only characters that are problematic for file systems and LogSeq
    .trim();
  
  try {
    // Check if page exists and handle update
    const existingPage = await logseq.Editor.getPage(pageName);
    if (existingPage) {
      return await updateExistingPage(card, pageName, token);
    }

    // Create new page
    return await createNewPage(card, pageName, token);
  } catch (error) {
    console.error(`Error handling page for card "${card.name}":`, error);
    throw error;
  }
}

function main() {
  // Register plugin settings
  logseq.useSettingsSchema(settings);

  console.log('Trello plugin loaded');
  logseq.App.showMsg('Trello Plugin loaded successfully!');

  // Register slash command for creating cards from blocks
  logseq.Editor.registerSlashCommand('Send Block to Trello', async () => {
    // Get the current block's content
    const block = await logseq.Editor.getCurrentBlock();
    if (!block) {
      logseq.App.showMsg('No block selected!', 'warning');
      return;
    }

    // Get settings
    const token = logseq.settings?.trelloToken;
    const listId = logseq.settings?.defaultListId;
    const cardPosition = logseq.settings?.defaultCardPos;

    if (!token) {
      logseq.App.showMsg('Please configure your Trello token in plugin settings!', 'warning');
      return;
    }

    if (!listId) {
      logseq.App.showMsg('Please use /Trello Get Lists to find and configure your List ID!', 'warning');
      return;
    }

    try {
      const card = await createTrelloCard(token, listId, block.content, cardPosition);
      logseq.App.showMsg('Trello card created successfully!');
      let url = card.url; // default to long

      if(logseq.settings?.shortUrl) {
        url = card.shortUrl;
      }

      // Add the card URL as a property to the block
      await logseq.Editor.updateBlock(
        block.uuid,
        `${block.content}\ntrello-card:: ${url}`
      );

    } catch (error) {
      console.error('Error:', error);
      logseq.App.showMsg('Error creating Trello card! Check console for details.', 'error');
    }
  });

  // Register slash command for creating cards from pages
  logseq.Editor.registerSlashCommand('Send Page to Trello', async () => {
    // Get settings
    const token = logseq.settings?.trelloToken;
    const listId = logseq.settings?.defaultListId;
    const cardPosition = logseq.settings?.defaultCardPos;

    if (!token) {
      logseq.App.showMsg('Please configure your Trello token in plugin settings!', 'warning');
      return;
    }

    if (!listId) {
      logseq.App.showMsg('Please use /Trello Get Lists to find and configure your List ID!', 'warning');
      return;
    }

    try {
      // Get current page
      const page = await logseq.Editor.getCurrentPage();
      if (!page) {
        logseq.App.showMsg('No page found!', 'warning');
        return;
      }

      // Get page blocks for description
      const blocks = await logseq.Editor.getPageBlocksTree(page.name);
      const description = blocks
        .map(block => block.content)
        .join('\n');

      // Create card with page title and content
      const card = await createTrelloCard(token, listId, page.name, cardPosition, description);
      logseq.App.showMsg('Trello card created from page successfully!');
      let url = card.url; // default to long

      if(logseq.settings?.shortUrl) {
        url = card.shortUrl;
      }

      // Add the card URL as a page property
      await logseq.Editor.upsertBlockProperty(
        page.uuid,
        'trello-card',
        url
      );

    } catch (error) {
      console.error('Error:', error);
      logseq.App.showMsg('Error creating Trello card from page! Check console for details.', 'error');
    }
  });

  // Register slash command for pulling cards from Trello
  logseq.Editor.registerSlashCommand('Trello Pull Cards', async () => {
    // Get settings
    const token = logseq.settings?.trelloToken;
    const listId = logseq.settings?.defaultListId;

    if (!token) {
      logseq.App.showMsg('Please configure your Trello token in plugin settings!', 'warning');
      return;
    }

    if (!listId) {
      logseq.App.showMsg('Please use /Trello Get Lists to find and configure your List ID!', 'warning');
      return;
    }

    try {
      // Get the current block where command was executed
      const currentBlock = await logseq.Editor.getCurrentBlock();
      if (!currentBlock) {
        logseq.App.showMsg('Please place your cursor in a block first!', 'warning');
        return;
      }

      logseq.App.showMsg('Fetching cards from Trello...', 'info');

      // Fetch cards from the default list
      const cards = await fetchTrelloCards(token, listId);
      
      if (cards.length === 0) {
        logseq.App.showMsg('No cards found in the selected list.', 'warning');
        return;
      }

      // Create pages for each card and add references
      let createdPages = [];
      
      // First create all pages
      for (const card of cards) {
        try {
          const result = await createPageFromCard(card, token);
          createdPages.push(result.name);
          // Insert each reference as a new block
          await logseq.Editor.insertBlock(
            currentBlock.uuid,
            `[[${result.name}]] #trello`,
            { sibling: true }
          );
        } catch (error) {
          console.error(`Failed to create page for card "${card.name}":`, error);
          // Continue with other cards even if one fails
        }
      }

      // Remove the original block if it's empty
      const currentBlockContent = await logseq.Editor.getBlock(currentBlock.uuid);
      if (!currentBlockContent.content.trim()) {
        await logseq.Editor.removeBlock(currentBlock.uuid);
      }

      // Show success message
      const message = `Successfully imported ${createdPages.length} cards!`;
      logseq.App.showMsg(message, 'success');

    } catch (error) {
      console.error('Error pulling cards:', error);
      logseq.App.showMsg('Error pulling cards from Trello! Check console for details.', 'error');
    }
  });

  // Add a command to get list IDs
  logseq.Editor.registerSlashCommand('Trello Get Lists', async () => {
    const token = logseq.settings?.trelloToken;

    if (!token) {
      logseq.App.showMsg('Please configure your Trello token in plugin settings first!', 'warning');
      return;
    }

    try {
      // Show loading message
      logseq.App.showMsg('Loading Trello boards and lists...', 'info');

      // Get the current block
      const block = await logseq.Editor.getCurrentBlock();
      if (!block) {
        throw new Error('No block selected');
      }

      // Fetch all boards and lists
      const boards = await fetchTrelloLists(token);

      // Format the output
      let output = '**Your Trello Lists:**\n';
      boards.forEach(board => {
        output += `\n**📋 ${board.name}**\n`;
        board.lists.forEach(list => {
          output += `- ${list.name} (ID: \`${list.id}\`)\n`;
        });
      });
      
      output += '\nCopy the ID of the list you want to use and paste it in the plugin settings.';

      // Insert the formatted text into the current block
      await logseq.Editor.updateBlock(block.uuid, output);
      logseq.App.showMsg('Lists have been inserted into the current block!', 'success');

    } catch (error) {
      console.error('Error:', error);
      logseq.App.showMsg('Error getting lists! Check console for details.', 'error');
    }
  });
}

// bootstrap
logseq.ready(main).catch(console.error)
