// Global variables
let quotes = [];
let categories = [];
let currentFilter = "all";
let serverQuotes = [];
let autoSyncInterval = null;
let conflictData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initApp();
});

function initApp() {
  loadFromStorage();
  loadFilterPreference();
  populateCategories();
  showRandomQuote();
  
  // Set up event listeners
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('addQuoteBtn').addEventListener('click', addQuote);
  document.getElementById('syncBtn').addEventListener('click', syncQuotes);
  document.getElementById('autoSyncCheckbox').addEventListener('change', toggleAutoSync);
  
  // Initial sync after 2 seconds
  setTimeout(() => syncQuotes(), 2000);
}

// ====================
// REQUIRED FUNCTIONS - MUST EXACTLY MATCH CHECK NAMES
// ====================

// 1. REQUIRED: fetchQuotesFromServer - fetch data from mock API
async function fetchQuotesFromServer() {
  try {
    // Using JSONPlaceholder as mock API
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
    const posts = await response.json();
    
    // Convert to our quote format
    serverQuotes = posts.map(post => ({
      id: post.id,
      text: post.title,
      author: `User ${post.userId}`,
      category: getRandomCategory(),
      source: 'server',
      timestamp: new Date().toISOString()
    }));
    
    return serverQuotes;
  } catch (error) {
    console.error('Error fetching from server:', error);
    showNotification('Failed to fetch from server', 'error');
    return [];
  }
}

// 2. REQUIRED: postQuotesToServer - post data to mock API
async function postQuotesToServer() {
  try {
    // Find local quotes that haven't been synced
    const localQuotesToSync = quotes.filter(quote => quote.source === 'local');
    
    if (localQuotesToSync.length === 0) {
      console.log('No local changes to sync');
      return true;
    }
    
    // Simulate posting to server
    // In a real app, this would be a POST request
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Quote Sync Data',
        body: `Syncing ${localQuotesToSync.length} quotes from local storage`,
        userId: 1,
        quotes: localQuotesToSync
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
    const result = await response.json();
    console.log('Posted to server:', result);
    
    // Mark local quotes as synced
    quotes.forEach(quote => {
      if (quote.source === 'local') {
        quote.source = 'synced';
      }
    });
    
    saveToStorage();
    return true;
  } catch (error) {
    console.error('Error posting to server:', error);
    showNotification('Failed to post to server', 'error');
    return false;
  }
}

// 3. REQUIRED: syncQuotes - main sync function that checks for updates
async function syncQuotes() {
  console.log('Starting sync...');
  showNotification('Starting sync with server...', 'warning');
  updateSyncStatus('syncing', 'Syncing with server...');
  
  try {
    // Step 1: Fetch from server
    const serverData = await fetchQuotesFromServer();
    
    if (serverData.length === 0) {
      showNotification('No data received from server', 'warning');
      updateSyncStatus('error', 'No server data');
      return;
    }
    
    // Step 2: Check for conflicts and update local storage
    const conflicts = checkForConflicts(serverData);
    
    if (conflicts.length > 0) {
      // Show conflict resolution UI
      showConflictUI(conflicts, serverData);
    } else {
      // No conflicts, merge server data
      mergeServerData(serverData);
      showNotification(`Synced ${serverData.length} quotes from server`, 'success');
    }
    
    // Step 3: Post local changes to server
    await postQuotesToServer();
    
    updateSyncStatus('synced', `Last sync: ${new Date().toLocaleTimeString()}`);
    showNotification('Sync completed successfully', 'success');
    
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('error', 'Sync failed');
    showNotification('Sync failed', 'error');
  }
}

// Check for conflicts between local and server data
function checkForConflicts(serverData) {
  const conflicts = [];
  
  serverData.forEach(serverQuote => {
    const localMatch = quotes.find(q => q.id === serverQuote.id);
    
    if (localMatch) {
      // Check if content differs (conflict)
      if (localMatch.text !== serverQuote.text || 
          localMatch.author !== serverQuote.author ||
          localMatch.category !== serverQuote.category) {
        conflicts.push({
          local: localMatch,
          server: serverQuote
        });
      }
    }
  });
  
  return conflicts;
}

// Merge server data into local storage
function mergeServerData(serverData) {
  let addedCount = 0;
  let updatedCount = 0;
  
  serverData.forEach(serverQuote => {
    const existingIndex = quotes.findIndex(q => q.id === serverQuote.id);
    
    if (existingIndex === -1) {
      // New quote from server
      quotes.push(serverQuote);
      addedCount++;
    } else {
      // Update existing quote with server data
      quotes[existingIndex] = serverQuote;
      updatedCount++;
    }
  });
  
  // Update categories
  extractUniqueCategories();
  populateCategories();
  
  // Save to local storage
  saveToStorage();
  
  console.log(`Merged: ${addedCount} added, ${updatedCount} updated`);
}

// Show conflict resolution UI
function showConflictUI(conflicts, serverData) {
  conflictData = {
    conflicts: conflicts,
    serverData: serverData,
    timestamp: new Date().toISOString()
  };
  
  const conflictMessage = `Found ${conflicts.length} conflict(s) between local and server data.`;
  document.getElementById('conflictMessage').textContent = conflictMessage;
  document.getElementById('conflictResolver').style.display = 'block';
  
  showNotification(conflictMessage, 'warning');
}

// Hide conflict UI
function hideConflictUI() {
  document.getElementById('conflictResolver').style.display = 'none';
}

// Resolve conflict based on user choice
function resolveConflict(strategy) {
  if (!conflictData) return;
  
  switch (strategy) {
    case 'server':
      // Use server data
      applyServerResolution();
      showNotification('Applied server data (server precedence)', 'success');
      break;
      
    case 'local':
      // Keep local data
      applyLocalResolution();
      showNotification('Kept local data', 'success');
      break;
      
    case 'merge':
      // Merge both
      applyMergeResolution();
      showNotification('Merged server and local data', 'success');
      break;
  }
  
  hideConflictUI();
  saveToStorage();
  populateCategories();
  showRandomQuote();
}

// Apply server precedence resolution
function applyServerResolution() {
  conflictData.conflicts.forEach(conflict => {
    const index = quotes.findIndex(q => q.id === conflict.local.id);
    if (index !== -1) {
      quotes[index] = conflict.server;
    }
  });
  
  // Add any new server quotes
  conflictData.serverData.forEach(serverQuote => {
    if (!quotes.find(q => q.id === serverQuote.id)) {
      quotes.push(serverQuote);
    }
  });
}

// Apply local precedence resolution
function applyLocalResolution() {
  // Keep local quotes as they are
  // Only add completely new server quotes
  conflictData.serverData.forEach(serverQuote => {
    if (!quotes.find(q => q.id === serverQuote.id)) {
      quotes.push(serverQuote);
    }
  });
}

// Apply merge resolution
function applyMergeResolution() {
  // For conflicts, prefer server version
  conflictData.conflicts.forEach(conflict => {
    const index = quotes.findIndex(q => q.id === conflict.local.id);
    if (index !== -1) {
      // Keep server text if different
      if (quotes[index].text !== conflict.server.text) {
        quotes[index].text = conflict.server.text;
      }
    }
  });
  
  // Add any new server quotes
  conflictData.serverData.forEach(serverQuote => {
    if (!quotes.find(q => q.id === serverQuote.id)) {
      quotes.push(serverQuote);
    }
  });
}

// Toggle auto sync
function toggleAutoSync() {
  const checkbox = document.getElementById('autoSyncCheckbox');
  const button = document.getElementById('toggleSync');
  
  if (checkbox.checked) {
    // Start auto sync every 30 seconds
    autoSyncInterval = setInterval(syncQuotes, 30000);
    button.textContent = 'Disable Auto Sync';
    showNotification('Auto sync enabled (every 30 seconds)', 'success');
    
    // Do an initial sync
    setTimeout(() => syncQuotes(), 1000);
  } else {
    // Stop auto sync
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
      autoSyncInterval = null;
    }
    button.textContent = 'Enable Auto Sync';
    showNotification('Auto sync disabled', 'warning');
  }
}

// Update sync status display
function updateSyncStatus(status, message) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  
  // Reset dot color
  dot.style.background = '#6c757d';
  
  switch (status) {
    case 'syncing':
      dot.style.background = '#ffa502';
      dot.style.animation = 'pulse 1s infinite';
      break;
    case 'synced':
      dot.style.background = '#28a745';
      dot.style.animation = 'none';
      break;
    case 'error':
      dot.style.background = '#dc3545';
      dot.style.animation = 'none';
      break;
  }
  
  text.textContent = message;
}

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById('notification');
  
  // Set message and style
  notification.textContent = message;
  notification.style.display = 'block';
  notification.style.borderLeft = '4px solid ';
  
  switch (type) {
    case 'success':
      notification.style.borderLeftColor = '#28a745';
      notification.style.background = '#d4edda';
      break;
    case 'warning':
      notification.style.borderLeftColor = '#ffc107';
      notification.style.background = '#fff3cd';
      break;
    case 'error':
      notification.style.borderLeftColor = '#dc3545';
      notification.style.background = '#f8d7da';
      break;
    default:
      notification.style.borderLeftColor = '#17a2b8';
      notification.style.background = '#d1ecf1';
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

// Helper function for random category
function getRandomCategory() {
  const categories = ['Motivation', 'Life', 'Inspiration', 'Perseverance', 'Wisdom', 'Love', 'Courage'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// ====================
// EXISTING FUNCTIONS (Keep as is)
// ====================

function populateCategories() {
  extractUniqueCategories();
  
  const categoryFilter = document.getElementById('categoryFilter');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  
  if (!categoryFilter || !newQuoteCategory) return;
  
  categoryFilter.innerHTML = '';
  newQuoteCategory.innerHTML = '';
  
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Categories';
  categoryFilter.appendChild(allOption);
  
  categories.forEach(category => {
    const filterOption = document.createElement('option');
    filterOption.value = category;
    filterOption.textContent = category;
    categoryFilter.appendChild(filterOption);
    
    const addOption = document.createElement('option');
    addOption.value = category;
    addOption.textContent = category;
    newQuoteCategory.appendChild(addOption);
  });
  
  categoryFilter.value = currentFilter;
}

function extractUniqueCategories() {
  const uniqueCategories = new Set();
  
  quotes.forEach(quote => {
    if (quote.category && quote.category.trim() !== '') {
      uniqueCategories.add(quote.category);
    }
  });
  
  if (uniqueCategories.size === 0) {
    ["Motivation", "Life", "Inspiration", "Perseverance"].forEach(cat => uniqueCategories.add(cat));
  }
  
  categories = Array.from(uniqueCategories).sort();
}

function filterQuote() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
  
  const selectedCategory = categoryFilter.value;
  currentFilter = selectedCategory;
  saveFilterPreference();
  
  let filteredQuotes = quotes;
  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }
  
  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
  } else {
    displayQuote(
      `No quotes found in category "${selectedCategory}"`,
      "System",
      "Info"
    );
  }
}

function saveFilterPreference() {
  try {
    localStorage.setItem('quoteFilterCategory', currentFilter);
  } catch (error) {
    console.error('Error saving filter preference:', error);
  }
}

function loadFilterPreference() {
  try {
    const savedFilter = localStorage.getItem('quoteFilterCategory');
    if (savedFilter) {
      currentFilter = savedFilter;
      return true;
    }
  } catch (error) {
    console.error('Error loading filter preference:', error);
  }
  return false;
}

function displayQuote(text, author, category) {
  document.getElementById('quoteText').textContent = `"${text}"`;
  document.getElementById('quoteAuthor').textContent = `- ${author}`;
  document.getElementById('quoteCategory').textContent = category;
}

function showRandomQuote() {
  if (quotes.length === 0) {
    loadDefaultQuotes();
  }
  
  if (currentFilter !== 'all') {
    filterQuote();
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
}

function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteAuthor = document.getElementById('newQuoteAuthor');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  
  if (!newQuoteText || !newQuoteAuthor || !newQuoteCategory) return;
  
  const text = newQuoteText.value.trim();
  const author = newQuoteAuthor.value.trim();
  const category = newQuoteCategory.value.trim();
  
  if (!text || !author || !category) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  const newQuote = {
    id: Date.now(),
    text,
    author,
    category,
    source: 'local',
    timestamp: new Date().toISOString()
  };
  
  quotes.push(newQuote);
  
  if (!categories.includes(category)) {
    categories.push(category);
    populateCategories();
  }
  
  newQuoteText.value = '';
  newQuoteAuthor.value = '';
  
  saveToStorage();
  showNotification('Quote added locally', 'success');
  
  if (currentFilter === category || currentFilter === 'all') {
    showRandomQuote();
  }
}

function loadFromStorage() {
  try {
    const savedData = localStorage.getItem('quoteGeneratorData');
    if (savedData) {
      const data = JSON.parse(savedData);
      quotes = data.quotes || [];
      categories = data.categories || [];
      
      if (quotes.length === 0) {
        loadDefaultQuotes();
      }
      return true;
    } else {
      loadDefaultQuotes();
    }
  } catch (error) {
    loadDefaultQuotes();
  }
  return false;
}

function saveToStorage() {
  try {
    const data = {
      quotes: quotes,
      categories: categories,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('quoteGeneratorData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

function loadDefaultQuotes() {
  quotes = [
    {
      id: 1,
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "Motivation",
      source: "default",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      text: "Life is what happens to you while you're busy making other plans.",
      author: "John Lennon",
      category: "Life",
      source: "default",
      timestamp: new Date().toISOString()
    }
  ];
  
  extractUniqueCategories();
  saveToStorage();
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      
      if (!Array.isArray(importedQuotes)) {
        throw new Error('Invalid JSON format');
      }
      
      const newQuotes = importedQuotes.filter(newQuote => 
        !quotes.some(existingQuote => 
          existingQuote.text === newQuote.text && 
          existingQuote.author === newQuote.author
        )
      );
      
      if (newQuotes.length > 0) {
        quotes.push(...newQuotes);
        extractUniqueCategories();
        populateCategories();
        saveToStorage();
        showNotification(`Imported ${newQuotes.length} quotes`, 'success');
        event.target.value = '';
      } else {
        showNotification('No new quotes found', 'warning');
      }
    } catch (error) {
      showNotification(`Import failed: ${error.message}`, 'error');
    }
  };
  
  fileReader.readAsText(file);
}

function exportToJson() {
  try {
    const data = {
      quotes: quotes,
      categories: categories,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${quotes.length} quotes`, 'success');
  } catch (error) {
    showNotification('Error exporting quotes', 'error');
  }
}