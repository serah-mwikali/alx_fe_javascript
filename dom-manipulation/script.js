// Global variables
let quotes = [];
let categories = [];
let currentFilter = "all";
let serverQuotes = [];
let autoSyncInterval = null;
let conflictData = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadFromStorage();
  loadFilterPreference();
  populateCategories();
  showRandomQuote();
  
  // Set up event listeners
  document.getElementById('newQuote')?.addEventListener('click', showRandomQuote);
  document.getElementById('addQuoteBtn')?.addEventListener('click', addQuote);
  document.getElementById('exportBtn')?.addEventListener('click', exportToJson);
  document.getElementById('syncBtn')?.addEventListener('click', syncQuotes);
  document.getElementById('autoSyncCheckbox')?.addEventListener('change', toggleAutoSync);
  
  // Initial sync check
  setTimeout(() => syncQuotes(), 2000);
});

// ====================
// REQUIRED FUNCTIONS FOR TASK 3 CHECKS
// ====================

// 1. REQUIRED: fetchQuotesFromServer - fetching data from server using mock API
async function fetchQuotesFromServer() {
  showNotification('Fetching data from server...', 'warning');
  updateSyncStatus('syncing', 'Fetching from server...');
  
  try {
    // Using JSONPlaceholder as mock API
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
    
    showNotification(`Fetched ${serverQuotes.length} quotes from server`, 'success');
    updateSyncStatus('synced', `Server data fetched (${new Date().toLocaleTimeString()})`);
    
    return serverQuotes;
  } catch (error) {
    console.error('Error fetching from server:', error);
    showNotification('Failed to fetch from server', 'error');
    updateSyncStatus('error', 'Failed to fetch');
    return [];
  }
}

// 2. REQUIRED: postQuotesToServer - posting data to server using mock API
async function postQuotesToServer() {
  showNotification('Posting data to server...', 'warning');
  updateSyncStatus('syncing', 'Posting to server...');
  
  try {
    // In a real app, this would be a POST request
    // For simulation, we'll use a mock API
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Quote Sync',
        body: `Syncing ${quotes.length} quotes`,
        userId: 1
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    showNotification('Data posted to server successfully', 'success');
    updateSyncStatus('synced', `Data posted (${new Date().toLocaleTimeString()})`);
    
    return result;
  } catch (error) {
    console.error('Error posting to server:', error);
    showNotification('Failed to post to server', 'error');
    updateSyncStatus('error', 'Failed to post');
    return null;
  }
}

// 3. REQUIRED: syncQuotes - periodically checking for new quotes and updating local storage
async function syncQuotes() {
  // Step 1: Fetch data from server
  const serverData = await fetchQuotesFromServer();
  if (serverData.length === 0) return;
  
  // Step 2: Compare with local data and handle conflicts
  compareAndHandleConflicts(serverData);
  
  // Step 3: Post local changes to server (if any)
  if (hasLocalChanges()) {
    await postQuotesToServer();
  }
}

// Compare server data with local data and handle conflicts
function compareAndHandleConflicts(serverData) {
  const conflicts = [];
  const newServerQuotes = [];
  
  // Check each server quote
  serverData.forEach(serverQuote => {
    const localMatch = quotes.find(q => q.id === serverQuote.id);
    
    if (localMatch) {
      // Check for differences
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
    !serverData.find(serverQuote => serverQuote.id === localQuote.id)
  );
  
  // Store conflict data
  conflictData = {
    conflicts: conflicts,
    newServerQuotes: newServerQuotes,
    localOnlyQuotes: localOnlyQuotes,
    timestamp: new Date().toISOString()
  };
  
  // If conflicts exist, show conflict resolver
  if (conflicts.length > 0) {
    showConflictResolver(conflicts.length, newServerQuotes.length);
  } else if (newServerQuotes.length > 0) {
    // No conflicts, just new server quotes - merge them
    mergeServerQuotes(newServerQuotes);
  }
}

// Check if there are local changes to sync
function hasLocalChanges() {
  return quotes.some(quote => quote.source === 'local');
}

// Merge new server quotes into local storage
function mergeServerQuotes(newQuotes) {
  newQuotes.forEach(serverQuote => {
    if (!quotes.find(q => q.id === serverQuote.id)) {
      quotes.push(serverQuote);
    }
  });
  
  // Update categories
  extractUniqueCategories();
  populateCategories();
  
  // Save to storage
  saveToStorage();
  
  showNotification(`Added ${newQuotes.length} new quotes from server`, 'success');
}

// Show conflict resolver UI
function showConflictResolver(conflictCount, newQuoteCount) {
  const resolver = document.getElementById('conflictResolver');
  const message = document.getElementById('conflictMessage');
  
  let msg = `Found ${conflictCount} conflicting quote(s)`;
  if (newQuoteCount > 0) {
    msg += ` and ${newQuoteCount} new quote(s) from server`;
  }
  msg += '. How would you like to resolve?';
  
  message.textContent = msg;
  resolver.classList.add('show');
}

// Hide conflict resolver
function hideConflictResolver() {
  document.getElementById('conflictResolver').classList.remove('show');
}

// Resolve conflict based on user choice
function resolveConflict(strategy) {
  if (!conflictData) return;
  
  switch (strategy) {
    case 'server':
      // Server takes precedence
      applyServerPrecedence();
      showNotification('Applied server data (server precedence)', 'success');
      break;
      
    case 'local':
      // Keep local data
      keepLocalData();
      showNotification('Kept local data', 'success');
      break;
      
    case 'merge':
      // Merge both
      mergeData();
      showNotification('Merged server and local data', 'success');
      break;
  }
  
  hideConflictResolver();
  saveToStorage();
  populateCategories();
  showRandomQuote();
}

// Apply server precedence strategy
function applyServerPrecedence() {
  // Start with server quotes
  let merged = [...conflictData.newServerQuotes];
  
  // Add non-conflicting local quotes
  conflictData.localOnlyQuotes.forEach(localQuote => {
    if (!merged.find(q => q.id === localQuote.id)) {
      merged.push(localQuote);
    }
  });
  
  // For conflicts, use server version
  conflictData.conflicts.forEach(conflict => {
    const existingIndex = merged.findIndex(q => q.id === conflict.local.id);
    if (existingIndex !== -1) {
      merged[existingIndex] = conflict.server;
    } else {
      merged.push(conflict.server);
    }
  });
  
  quotes = merged;
}

// Keep local data strategy
function keepLocalData() {
  // Local quotes remain unchanged
  // Server quotes that don't conflict are added
  conflictData.newServerQuotes.forEach(serverQuote => {
    if (!quotes.find(q => q.id === serverQuote.id)) {
      quotes.push(serverQuote);
    }
  });
}

// Merge data strategy
function mergeData() {
  // Add new server quotes
  conflictData.newServerQuotes.forEach(serverQuote => {
    if (!quotes.find(q => q.id === serverQuote.id)) {
      quotes.push(serverQuote);
    }
  });
  
  // For conflicts, use server version
  conflictData.conflicts.forEach(conflict => {
    const index = quotes.findIndex(q => q.id === conflict.local.id);
    if (index !== -1) {
      quotes[index] = conflict.server;
    }
  });
}

// Toggle auto sync
function toggleAutoSync() {
  const checkbox = document.getElementById('autoSyncCheckbox');
  const button = document.getElementById('toggleSync');
  
  if (checkbox.checked) {
    // Start auto sync
    autoSyncInterval = setInterval(syncQuotes, 30000); // Every 30 seconds
    button.textContent = 'Disable Auto Sync';
    showNotification('Auto sync enabled (every 30 seconds)', 'success');
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
  
  dot.className = 'status-dot';
  
  switch (status) {
    case 'syncing':
      dot.classList.add('syncing');
      break;
    case 'synced':
      dot.classList.add('synced');
      break;
    case 'error':
      dot.classList.add('error');
      break;
  }
  
  text.textContent = message;
}

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById('notification');
  
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

// Helper function for random category
function getRandomCategory() {
  const categories = ['Motivation', 'Life', 'Inspiration', 'Perseverance', 'Wisdom', 'Love', 'Courage'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// ====================
// EXISTING FUNCTIONS (Updated)
// ====================

// Update addQuote to include source
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
  
  showNotification('Quote added locally', 'success');
  
  if (currentFilter === category || currentFilter === 'all') {
    showRandomQuote();
  }
}

// Update saveToStorage
function saveToStorage() {
  try {
    const data = {
      quotes: quotes,
      categories: categories,
      lastSynced: new Date().toISOString()
    };
    localStorage.setItem('quoteGeneratorData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

// Update loadFromStorage
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
    console.error('Error loading from storage:', error);
    loadDefaultQuotes();
  }
  return false;
}

// Update loadDefaultQuotes
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
    },
    {
      id: 3,
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "Inspiration",
      source: "default",
      timestamp: new Date().toISOString()
    }
  ];
  
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
      console.error('Error importing quotes:', error);
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
    console.error('Error exporting quotes:', error);
    showNotification('Error exporting quotes', 'error');
  }
}