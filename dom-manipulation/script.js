// Global variables
let quotes = [];
let categories = [];
let currentFilter = "all";

// Server simulation variables
let serverQuotes = [];
let syncInterval = null;
let syncIntervalTime = 30000; // 30 seconds default
let isSyncing = false;
let conflictData = null;
let syncHistory = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadFromStorage();
  loadFilterPreference();
  populateCategories();
  showRandomQuote();
  initializeSync();
  
  // Set up event listeners
  document.getElementById('newQuote')?.addEventListener('click', showRandomQuote);
  document.getElementById('addQuoteBtn')?.addEventListener('click', addQuote);
  document.getElementById('exportBtn')?.addEventListener('click', exportToJson);
  document.getElementById('manualSync')?.addEventListener('click', manualSync);
  document.getElementById('viewChanges')?.addEventListener('click', showConflictModal);
  document.getElementById('closeModal')?.addEventListener('click', hideConflictModal);
  document.getElementById('resolveConflict')?.addEventListener('click', resolveConflict);
  document.getElementById('skipConflict')?.addEventListener('click', hideConflictModal);
  document.getElementById('autoSync')?.addEventListener('change', toggleAutoSync);
  document.getElementById('syncInterval')?.addEventListener('change', updateSyncInterval);
});

// ====================
// SERVER SYNC FUNCTIONS
// ====================

// Initialize sync functionality
function initializeSync() {
  // Load sync settings
  loadSyncSettings();
  
  // Initial server fetch
  fetchFromServer();
  
  // Start auto sync if enabled
  if (document.getElementById('autoSync')?.checked) {
    startAutoSync();
  }
  
  // Update sync status
  updateSyncStatus('ready');
}

// Fetch data from mock server (JSONPlaceholder)
async function fetchFromServer() {
  if (isSyncing) return;
  
  isSyncing = true;
  updateSyncStatus('syncing');
  
  try {
    // Using JSONPlaceholder posts as mock server data
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const posts = await response.json();
    
    // Convert posts to our quote format
    serverQuotes = posts.map(post => ({
      id: post.id,
      text: post.title,
      author: `User ${post.userId}`,
      category: getRandomCategory(),
      source: 'server',
      timestamp: new Date().toISOString()
    }));
    
    // Add to sync history
    addToSyncHistory('success', `Fetched ${serverQuotes.length} quotes from server`);
    
    // Compare with local data
    compareDataWithServer();
    
    updateSyncStatus('synced');
  } catch (error) {
    console.error('Error fetching from server:', error);
    addToSyncHistory('error', `Failed to sync: ${error.message}`);
    updateSyncStatus('error');
    showNotification('Failed to connect to server', 'error');
  } finally {
    isSyncing = false;
  }
}

// Simulate posting data to server (for demonstration)
async function postToServer() {
  try {
    // Simulate server delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would POST data here
    // For simulation, we'll just log
    console.log('Data posted to server:', quotes.length, 'quotes');
    
    addToSyncHistory('success', 'Data synced to server');
    return true;
  } catch (error) {
    console.error('Error posting to server:', error);
    addToSyncHistory('error', 'Failed to post to server');
    return false;
  }
}

// Compare local data with server data
function compareDataWithServer() {
  if (serverQuotes.length === 0) return;
  
  // Find conflicts (quotes with same ID but different content)
  const conflicts = [];
  const newServerQuotes = [];
  
  serverQuotes.forEach(serverQuote => {
    const localMatch = quotes.find(q => q.id === serverQuote.id);
    
    if (localMatch) {
      // Check if content differs
      if (localMatch.text !== serverQuote.text || 
          localMatch.author !== serverQuote.author ||
          localMatch.category !== serverQuote.category) {
        conflicts.push({
          local: localMatch,
          server: serverQuote
        });
      }
    } else {
      // New quote from server
      newServerQuotes.push(serverQuote);
    }
  });
  
  // Find local quotes not on server
  const localOnlyQuotes = quotes.filter(localQuote => 
    !serverQuotes.find(serverQuote => serverQuote.id === localQuote.id)
  );
  
  // Prepare conflict data
  conflictData = {
    conflicts: conflicts,
    newServerQuotes: newServerQuotes,
    localOnlyQuotes: localOnlyQuotes,
    timestamp: new Date().toISOString()
  };
  
  // Show conflict modal if there are conflicts
  if (conflicts.length > 0 || newServerQuotes.length > 0) {
    showConflictModal();
  } else if (localOnlyQuotes.length > 0) {
    // We have local changes to push to server
    showNotification('Local changes detected. Click "Sync Now" to upload.', 'warning');
  }
}

// Show conflict resolution modal
function showConflictModal() {
  if (!conflictData) return;
  
  const modal = document.getElementById('conflictModal');
  const message = document.getElementById('conflictMessage');
  const localCount = document.getElementById('localCount');
  const serverCount = document.getElementById('serverCount');
  const conflictCount = document.getElementById('conflictCount');
  
  // Update counts
  localCount.textContent = quotes.length;
  serverCount.textContent = serverQuotes.length;
  conflictCount.textContent = conflictData.conflicts.length;
  
  // Update message
  let msg = 'Data differences detected: ';
  if (conflictData.conflicts.length > 0) {
    msg += `${conflictData.conflicts.length} conflicting quotes, `;
  }
  if (conflictData.newServerQuotes.length > 0) {
    msg += `${conflictData.newServerQuotes.length} new quotes from server, `;
  }
  if (conflictData.localOnlyQuotes.length > 0) {
    msg += `${conflictData.localOnlyQuotes.length} local-only quotes.`;
  }
  
  message.textContent = msg;
  
  // Show modal
  modal.classList.remove('hidden');
}

// Hide conflict modal
function hideConflictModal() {
  document.getElementById('conflictModal').classList.add('hidden');
}

// Resolve conflict based on user selection
function resolveConflict() {
  const resolution = document.querySelector('input[name="conflictResolution"]:checked').value;
  
  switch (resolution) {
    case 'server':
      // Use server data (takes precedence)
      applyServerData();
      break;
      
    case 'local':
      // Keep local data
      keepLocalData();
      break;
      
    case 'merge':
      // Merge data
      mergeData();
      break;
  }
  
  hideConflictModal();
  saveToStorage();
  populateCategories();
  showRandomQuote();
  showNotification('Conflict resolved successfully', 'success');
}

// Apply server data (server takes precedence)
function applyServerData() {
  // Start with server quotes
  quotes = [...serverQuotes];
  
  // Add local-only quotes (ones not in server)
  conflictData.localOnlyQuotes.forEach(quote => {
    if (!quotes.find(q => q.id === quote.id)) {
      quotes.push(quote);
    }
  });
  
  addToSyncHistory('success', 'Applied server data (server precedence)');
}

// Keep local data
function keepLocalData() {
  // Keep all local quotes
  // Server quotes are ignored
  
  addToSyncHistory('success', 'Kept local data');
}

// Merge data from both sources
function mergeData() {
  // Start with local quotes
  const merged = [...quotes];
  
  // Add new server quotes
  conflictData.newServerQuotes.forEach(serverQuote => {
    if (!merged.find(q => q.id === serverQuote.id)) {
      merged.push(serverQuote);
    }
  });
  
  // For conflicts, keep server version
  conflictData.conflicts.forEach(conflict => {
    const index = merged.findIndex(q => q.id === conflict.local.id);
    if (index !== -1) {
      merged[index] = conflict.server;
    }
  });
  
  quotes = merged;
  
  addToSyncHistory('success', 'Merged server and local data');
}

// Manual sync trigger
function manualSync() {
  if (isSyncing) {
    showNotification('Sync already in progress', 'warning');
    return;
  }
  
  fetchFromServer();
  showNotification('Manual sync started', 'success');
}

// Start auto sync interval
function startAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(() => {
    fetchFromServer();
  }, syncIntervalTime);
  
  addToSyncHistory('success', `Auto sync started (${syncIntervalTime/1000}s interval)`);
  updateSyncStatus('syncing');
}

// Stop auto sync
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    addToSyncHistory('success', 'Auto sync stopped');
    updateSyncStatus('ready');
  }
}

// Toggle auto sync
function toggleAutoSync() {
  const autoSync = document.getElementById('autoSync');
  
  if (autoSync.checked) {
    startAutoSync();
  } else {
    stopAutoSync();
  }
}

// Update sync interval
function updateSyncInterval() {
  const intervalSelect = document.getElementById('syncInterval');
  syncIntervalTime = parseInt(intervalSelect.value) * 1000;
  
  // Restart sync if active
  if (syncInterval) {
    startAutoSync();
  }
}

// Update sync status display
function updateSyncStatus(status) {
  const syncDot = document.querySelector('.sync-dot');
  const syncMessage = document.getElementById('syncMessage');
  
  syncDot.className = 'sync-dot';
  
  switch (status) {
    case 'syncing':
      syncDot.classList.add('syncing');
      syncMessage.textContent = 'Syncing with server...';
      break;
      
    case 'synced':
      syncDot.classList.add('synced');
      syncMessage.textContent = `Synced ${new Date().toLocaleTimeString()}`;
      break;
      
    case 'error':
      syncMessage.textContent = 'Sync failed. Click "Sync Now" to retry.';
      break;
      
    case 'ready':
      syncMessage.textContent = 'Ready to sync';
      break;
  }
}

// Add entry to sync history
function addToSyncHistory(status, message) {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    status: status,
    message: message
  };
  
  syncHistory.unshift(entry); // Add to beginning
  
  // Keep only last 10 entries
  if (syncHistory.length > 10) {
    syncHistory.pop();
  }
  
  updateSyncHistoryDisplay();
}

// Update sync history display
function updateSyncHistoryDisplay() {
  const historyList = document.getElementById('syncHistory');
  if (!historyList) return;
  
  historyList.innerHTML = '';
  
  syncHistory.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    item.innerHTML = `
      <span class="history-time">${entry.timestamp}</span>
      <span class="history-status ${entry.status}">${entry.message}</span>
    `;
    
    historyList.appendChild(item);
  });
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;">×</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Load sync settings from local storage
function loadSyncSettings() {
  try {
    const settings = localStorage.getItem('syncSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      
      const autoSync = document.getElementById('autoSync');
      const syncInterval = document.getElementById('syncInterval');
      
      if (autoSync && parsed.autoSync !== undefined) {
        autoSync.checked = parsed.autoSync;
      }
      
      if (syncInterval && parsed.interval) {
        syncInterval.value = parsed.interval;
        syncIntervalTime = parseInt(parsed.interval) * 1000;
      }
    }
  } catch (error) {
    console.error('Error loading sync settings:', error);
  }
}

// Save sync settings to local storage
function saveSyncSettings() {
  try {
    const autoSync = document.getElementById('autoSync')?.checked || false;
    const interval = document.getElementById('syncInterval')?.value || '30';
    
    const settings = {
      autoSync: autoSync,
      interval: interval
    };
    
    localStorage.setItem('syncSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving sync settings:', error);
  }
}

// ====================
// EXISTING FUNCTIONS (Updated)
// ====================

// Function to get random category for server data
function getRandomCategory() {
  const categories = ['Motivation', 'Life', 'Inspiration', 'Perseverance', 'Wisdom', 'Love', 'Courage'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Update addQuote to include timestamp and source
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
    id: Date.now(), // Generate unique ID
    text,
    author,
    category,
    source: 'local',
    timestamp: new Date().toISOString()
  };
  
  quotes.push(newQuote);
  
  // Check if category is new
  if (!categories.includes(category)) {
    categories.push(category);
    populateCategories();
  }
  
  // Clear form
  newQuoteText.value = '';
  newQuoteAuthor.value = '';
  
  // Save to storage
  saveToStorage();
  
  // Show success
  showNotification('Quote added locally. Will sync with server.', 'success');
  
  // Update display
  if (currentFilter === category || currentFilter === 'all') {
    showRandomQuote();
  }
  
  // Schedule sync if auto sync is enabled
  if (document.getElementById('autoSync')?.checked) {
    setTimeout(() => postToServer(), 2000);
  }
}

// Update saveToStorage to include sync data
function saveToStorage() {
  try {
    const data = {
      quotes: quotes,
      categories: categories,
      syncHistory: syncHistory,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('quoteGeneratorData', JSON.stringify(data));
    
    // Also save sync settings
    saveSyncSettings();
    
    console.log('Data saved to storage');
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

// Update loadFromStorage to load sync data
function loadFromStorage() {
  try {
    const savedData = localStorage.getItem('quoteGeneratorData');
    if (savedData) {
      const data = JSON.parse(savedData);
      quotes = data.quotes || [];
      categories = data.categories || [];
      syncHistory = data.syncHistory || [];
      
      // If no quotes, load defaults
      if (quotes.length === 0) {
        loadDefaultQuotes();
      }
      
      return true;
    } else {
      // First time user, load defaults
      loadDefaultQuotes();
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
    loadDefaultQuotes();
  }
  return false;
}

// Update loadDefaultQuotes to include IDs
function loadDefaultQuotes() {
  const defaultQuotes = [
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
    },
    {
      id: 3,
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "Inspiration",
      source: "default",
      timestamp: new Date().toISOString()
    },
    {
      id: 4,
      text: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle",
      category: "Perseverance",
      source: "default",
      timestamp: new Date().toISOString()
    }
  ];
  
  quotes = defaultQuotes;
  extractUniqueCategories();
  saveToStorage();
}

// ====================
// EXISTING CORE FUNCTIONS (Keep as is)
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
  const quoteDisplay = document.getElementById('quoteDisplay');
  if (!quoteDisplay) return;
  
  quoteDisplay.innerHTML = `
    <p class="quote-text">"${text}"</p>
    <p class="quote-author">- ${author}</p>
    <span class="quote-category">${category}</span>
  `;
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

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(event) {
    try {