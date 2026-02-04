// Global variables
let quotes = [];
let categories = [];
let currentFilter = "all";

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
  
  // Set filter dropdown to saved value
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.value = currentFilter;
  }
});

// ====================
// REQUIRED FUNCTIONS FOR TASK CHECKS
// ====================

// 1. Function to extract unique categories and populate dropdown
function populateCategories() {
  // Extract unique categories from quotes
  extractUniqueCategories();
  
  const categoryFilter = document.getElementById('categoryFilter');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  
  if (!categoryFilter || !newQuoteCategory) {
    console.error('Required elements not found');
    return;
  }
  
  // Clear existing options
  categoryFilter.innerHTML = '';
  newQuoteCategory.innerHTML = '';
  
  // Add "All Categories" option to filter dropdown
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Categories';
  categoryFilter.appendChild(allOption);
  
  // Add each category to both dropdowns
  categories.forEach(category => {
    // For filter dropdown
    const filterOption = document.createElement('option');
    filterOption.value = category;
    filterOption.textContent = category;
    categoryFilter.appendChild(filterOption);
    
    // For add quote dropdown
    const addOption = document.createElement('option');
    addOption.value = category;
    addOption.textContent = category;
    newQuoteCategory.appendChild(addOption);
  });
  
  // Set current filter
  categoryFilter.value = currentFilter;
}

// 2. Function to extract unique categories from quotes array
function extractUniqueCategories() {
  const uniqueCategories = new Set();
  
  // Add categories from existing quotes
  quotes.forEach(quote => {
    if (quote.category && quote.category.trim() !== '') {
      uniqueCategories.add(quote.category);
    }
  });
  
  // If no quotes yet, add default categories
  if (uniqueCategories.size === 0) {
    const defaultCategories = ["Motivation", "Life", "Inspiration", "Perseverance", "Wisdom", "Love", "Courage"];
    defaultCategories.forEach(cat => uniqueCategories.add(cat));
  }
  
  categories = Array.from(uniqueCategories).sort();
}

// 3. REQUIRED: filterQuote function (singular as per task requirements)
function filterQuote() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
  
  // Get selected category
  const selectedCategory = categoryFilter.value;
  currentFilter = selectedCategory;
  
  // Save filter preference to local storage
  saveFilterPreference();
  
  // Filter quotes based on selection
  let filteredQuotes = quotes;
  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }
  
  // Display a random quote from filtered list
  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
  } else {
    displayQuote(
      `No quotes found in category "${selectedCategory}". Try another category or add new quotes.`,
      "System",
      "Info"
    );
  }
}

// 4. Function to save selected category to local storage
function saveFilterPreference() {
  try {
    localStorage.setItem('quoteFilterCategory', currentFilter);
    console.log('Filter preference saved:', currentFilter);
  } catch (error) {
    console.error('Error saving filter preference:', error);
  }
}

// 5. Function to restore last selected category when page loads
function loadFilterPreference() {
  try {
    const savedFilter = localStorage.getItem('quoteFilterCategory');
    if (savedFilter) {
      currentFilter = savedFilter;
      console.log('Filter preference loaded:', currentFilter);
      return true;
    }
  } catch (error) {
    console.error('Error loading filter preference:', error);
  }
  return false;
}

// ====================
// CORE FUNCTIONALITY
// ====================

// Display a quote
function displayQuote(text, author, category) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  if (!quoteDisplay) return;
  
  quoteDisplay.innerHTML = `
    <p class="quote-text">"${text}"</p>
    <p class="quote-author">- ${author}</p>
    <span class="quote-category">${category}</span>
  `;
}

// Show random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    loadDefaultQuotes();
  }
  
  // Use filtered view if a category is selected
  if (currentFilter !== 'all') {
    filterQuote();
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
}

// Add a new quote
function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteAuthor = document.getElementById('newQuoteAuthor');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  
  if (!newQuoteText || !newQuoteAuthor || !newQuoteCategory) return;
  
  const text = newQuoteText.value.trim();
  const author = newQuoteAuthor.value.trim();
  const category = newQuoteCategory.value.trim();
  
  if (!text || !author || !category) {
    alert('Please fill in all fields');
    return;
  }
  
  const newQuote = {
    text,
    author,
    category
  };
  
  quotes.push(newQuote);
  
  // Check if category is new
  if (!categories.includes(category)) {
    categories.push(category);
    populateCategories(); // Update dropdowns
  }
  
  // Clear form
  newQuoteText.value = '';
  newQuoteAuthor.value = '';
  
  // Save to storage
  saveToStorage();
  
  // Show success message
  alert('Quote added successfully!');
  
  // Update display if viewing this category or all
  if (currentFilter === category || currentFilter === 'all') {
    showRandomQuote();
  }
}

// ====================
// WEB STORAGE FUNCTIONS
// ====================

// Load data from local storage
function loadFromStorage() {
  try {
    const savedData = localStorage.getItem('quoteGeneratorData');
    if (savedData) {
      const data = JSON.parse(savedData);
      quotes = data.quotes || [];
      categories = data.categories || [];
      
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

// Save data to local storage
function saveToStorage() {
  try {
    const data = {
      quotes: quotes,
      categories: categories,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('quoteGeneratorData', JSON.stringify(data));
    console.log('Data saved to storage');
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

// Load default quotes
function loadDefaultQuotes() {
  quotes = [
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "Motivation"
    },
    {
      text: "Life is what happens to you while you're busy making other plans.",
      author: "John Lennon",
      category: "Life"
    },
    {
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "Inspiration"
    },
    {
      text: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle",
      category: "Perseverance"
    },
    {
      text: "Whoever is happy will make others happy too.",
      author: "Anne Frank",
      category: "Happiness"
    },
    {
      text: "You must be the change you wish to see in the world.",
      author: "Mahatma Gandhi",
      category: "Wisdom"
    },
    {
      text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.",
      author: "Mother Teresa",
      category: "Love"
    },
    {
      text: "The only thing we have to fear is fear itself.",
      author: "Franklin D. Roosevelt",
      category: "Courage"
    }
  ];
  
  extractUniqueCategories();
  saveToStorage();
}

// ====================
// JSON IMPORT/EXPORT FUNCTIONS
// ====================

// REQUIRED: Import from JSON file
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      
      if (!Array.isArray(importedQuotes)) {
        throw new Error('Invalid JSON format: expected an array of quotes');
      }
      
      // Add imported quotes
      const newQuotes = importedQuotes.filter(newQuote => 
        !quotes.some(existingQuote => 
          existingQuote.text === newQuote.text && 
          existingQuote.author === newQuote.author
        )
      );
      
      if (newQuotes.length > 0) {
        quotes.push(...newQuotes);
        
        // Update categories
        extractUniqueCategories();
        
        // Update dropdowns
        populateCategories();
        
        // Save to storage
        saveToStorage();
        
        alert(`${newQuotes.length} quotes imported successfully!`);
        
        // Reset file input
        event.target.value = '';
        
        // Update display
        showRandomQuote();
      } else {
        alert('No new quotes found in the import file.');
      }
    } catch (error) {
      console.error('Error importing quotes:', error);
      alert(`Import failed: ${error.message}`);
    }
  };
  
  fileReader.readAsText(file);
}

// Export quotes to JSON file
function exportToJson() {
  try {
    const data = {
      quotes: quotes,
      categories: categories,
      exportDate: new Date().toISOString(),
      totalQuotes: quotes.length,
      totalCategories: categories.length
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Exported ${quotes.length} quotes to JSON file!`);
  } catch (error) {
    console.error('Error exporting quotes:', error);
    alert('Error exporting quotes. Please try again.');
  }
}

// ====================
// HELPER FUNCTIONS
// ====================

// Update statistics display
function updateStats() {
  const totalEl = document.getElementById('totalQuotes');
  const filteredEl = document.getElementById('filteredQuotes');
  
  if (totalEl) totalEl.textContent = quotes.length;
  
  if (filteredEl) {
    let filteredCount = quotes.length;
    if (currentFilter !== 'all') {
      filteredCount = quotes.filter(quote => quote.category === currentFilter).length;
    }
    filteredEl.textContent = filteredCount;
  }
}

// Clear all data (for testing)
function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This will reset to default quotes.')) {
    localStorage.removeItem('quoteGeneratorData');
    localStorage.removeItem('quoteFilterCategory');
    loadDefaultQuotes();
    populateCategories();
    showRandomQuote();
    alert('All data cleared. Default quotes loaded.');
  }
}