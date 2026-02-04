// Main application object
const QuoteGenerator = {
  // Initial quotes database
  quotes: [],
  
  // Available categories (will be populated from quotes)
  categories: [],
  
  // Current filter
  currentFilter: "all",
  
  // DOM Elements
  elements: {},
  
  // Initialize the application
  init: function() {
    this.cacheDOM();
    this.loadFromStorage();
    this.bindEvents();
    this.extractUniqueCategories(); // Extract categories from quotes
    this.populateCategories(); // Populate dropdown - REQUIRED FUNCTION
    this.loadFilterPreference(); // Load saved filter
    this.showRandomQuote();
    this.updateStats();
  },
  
  // Cache DOM elements
  cacheDOM: function() {
    this.elements = {
      quoteDisplay: document.getElementById('quoteDisplay'),
      newQuoteBtn: document.getElementById('newQuote'),
      categoryFilter: document.getElementById('categoryFilter'),
      newQuoteText: document.getElementById('newQuoteText'),
      newQuoteAuthor: document.getElementById('newQuoteAuthor'),
      newQuoteCategory: document.getElementById('newQuoteCategory'),
      addQuoteBtn: document.getElementById('addQuoteBtn'),
      importFile: document.getElementById('importFile')
    };
  },
  
  // Bind event listeners
  bindEvents: function() {
    this.elements.newQuoteBtn.addEventListener('click', () => this.showRandomQuote());
    this.elements.addQuoteBtn.addEventListener('click', () => this.addQuote());
    this.elements.categoryFilter.addEventListener('change', () => this.filterQuotes()); // REQUIRED FUNCTION CALL
    this.elements.importFile.addEventListener('change', (e) => this.importFromJSON(e));
  },
  
  // ====================
  // REQUIRED FUNCTIONS FOR TASK CHECKS
  // ====================
  
  // 1. Function to extract unique categories from quotes
  extractUniqueCategories: function() {
    const uniqueCategories = new Set();
    
    // Extract categories from existing quotes
    this.quotes.forEach(quote => {
      if (quote.category) {
        uniqueCategories.add(quote.category);
      }
    });
    
    // Add default categories if no quotes exist
    if (uniqueCategories.size === 0) {
      ["Motivation", "Life", "Inspiration", "Perseverance"].forEach(cat => {
        uniqueCategories.add(cat);
      });
    }
    
    this.categories = Array.from(uniqueCategories).sort();
  },
  
  // 2. REQUIRED: populateCategories function - populate dropdown menu
  populateCategories: function() {
    // Clear existing options
    this.elements.categoryFilter.innerHTML = '';
    this.elements.newQuoteCategory.innerHTML = '';
    
    // Add "All Categories" option to filter dropdown
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    this.elements.categoryFilter.appendChild(allOption);
    
    // Add each category to both dropdowns
    this.categories.forEach(category => {
      // For filter dropdown
      const filterOption = document.createElement('option');
      filterOption.value = category;
      filterOption.textContent = category;
      this.elements.categoryFilter.appendChild(filterOption);
      
      // For add quote dropdown
      const addOption = document.createElement('option');
      addOption.value = category;
      addOption.textContent = category;
      this.elements.newQuoteCategory.appendChild(addOption);
    });
    
    // Set the current filter
    this.elements.categoryFilter.value = this.currentFilter;
  },
  
  // 3. REQUIRED: filterQuotes function - update displayed quotes based on selected category
  filterQuotes: function() {
    // Get selected category from dropdown
    const selectedCategory = this.elements.categoryFilter.value;
    this.currentFilter = selectedCategory;
    
    // Save filter preference to local storage
    this.saveFilterPreference();
    
    // Filter quotes based on selection
    let filteredQuotes = this.quotes;
    if (selectedCategory !== 'all') {
      filteredQuotes = this.quotes.filter(quote => quote.category === selectedCategory);
    }
    
    // Update displayed quote
    if (filteredQuotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      const randomQuote = filteredQuotes[randomIndex];
      this.displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
    } else {
      this.displayQuote(
        `No quotes found in category "${selectedCategory}"`,
        "System",
        "Info"
      );
    }
    
    // Update stats
    this.updateStats();
  },
  
  // 4. Function to save selected category to local storage
  saveFilterPreference: function() {
    try {
      localStorage.setItem('quoteFilterCategory', this.currentFilter);
    } catch (error) {
      console.error('Error saving filter preference:', error);
    }
  },
  
  // 5. Function to load saved filter from local storage
  loadFilterPreference: function() {
    try {
      const savedFilter = localStorage.getItem('quoteFilterCategory');
      if (savedFilter) {
        this.currentFilter = savedFilter;
        return true;
      }
    } catch (error) {
      console.error('Error loading filter preference:', error);
    }
    return false;
  },
  
  // ====================
  // EXISTING FUNCTIONALITY (Updated)
  // ====================
  
  // Display a quote in the DOM
  displayQuote: function(text, author, category) {
    this.elements.quoteDisplay.innerHTML = '';
    
    const quoteText = document.createElement('p');
    quoteText.className = 'quote-text';
    quoteText.textContent = `"${text}"`;
    
    const quoteAuthor = document.createElement('p');
    quoteAuthor.className = 'quote-author';
    quoteAuthor.textContent = `- ${author}`;
    
    const quoteCategory = document.createElement('span');
    quoteCategory.className = 'quote-category';
    quoteCategory.textContent = category;
    
    this.elements.quoteDisplay.appendChild(quoteText);
    this.elements.quoteDisplay.appendChild(quoteAuthor);
    this.elements.quoteDisplay.appendChild(quoteCategory);
  },
  
  // Show a random quote
  showRandomQuote: function() {
    if (this.quotes.length === 0) {
      this.displayQuote(
        "No quotes available. Add some quotes to get started!",
        "System",
        "Info"
      );
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    const randomQuote = this.quotes[randomIndex];
    this.displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
  },
  
  // Load default quotes
  loadDefaultQuotes: function() {
    this.quotes = [
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
      }
    ];
    
    this.extractUniqueCategories();
    this.saveToLocalStorage();
  },
  
  // Save quotes to Local Storage
  saveToLocalStorage: function() {
    try {
      const data = {
        quotes: this.quotes,
        categories: this.categories
      };
      localStorage.setItem('quoteGeneratorData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to Local Storage:', error);
    }
  },
  
  // Load quotes from Local Storage
  loadFromLocalStorage: function() {
    try {
      const savedData = localStorage.getItem('quoteGeneratorData');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.quotes = data.quotes || [];
        this.categories = data.categories || [];
        return true;
      }
    } catch (error) {
      console.error('Error loading from Local Storage:', error);
    }
    return false;
  },
  
  // Load all data from storage
  loadFromStorage: function() {
    const hasLocalData = this.loadFromLocalStorage();
    
    // If no local data, load default quotes
    if (!hasLocalData || this.quotes.length === 0) {
      this.loadDefaultQuotes();
    }
  },
  
  // Add a new quote
  addQuote: function() {
    const text = this.elements.newQuoteText.value.trim();
    const author = this.elements.newQuoteAuthor.value.trim();
    const category = this.elements.newQuoteCategory.value;
    
    if (!text || !author || !category) {
      alert('Please fill in all fields');
      return;
    }
    
    const newQuote = {
      text,
      author,
      category
    };
    
    this.quotes.push(newQuote);
    
    // Check if category is new and update categories
    if (!this.categories.includes(category)) {
      this.categories.push(category);
      this.populateCategories(); // Update dropdowns
    }
    
    // Clear form
    this.elements.newQuoteText.value = '';
    this.elements.newQuoteAuthor.value = '';
    
    // Save to storage
    this.saveToLocalStorage();
    
    // Update stats
    this.updateStats();
    
    alert('Quote added successfully!');
    
    // If we're viewing this category or all, update display
    if (this.currentFilter === category || this.currentFilter === 'all') {
      this.filterQuotes();
    }
  },
  
  // Import from JSON
  importFromJSON: function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.quotes || !Array.isArray(importedData.quotes)) {
          throw new Error('Invalid JSON format');
        }
        
        // Add imported quotes
        const newQuotes = importedData.quotes.filter(newQuote => 
          !this.quotes.some(existingQuote => 
            existingQuote.text === newQuote.text && 
            existingQuote.author === newQuote.author
          )
        );
        
        if (newQuotes.length > 0) {
          this.quotes.push(...newQuotes);
          
          // Extract unique categories from updated quotes
          this.extractUniqueCategories();
          
          // Update dropdowns
          this.populateCategories();
          
          // Save to storage
          this.saveToLocalStorage();
          
          // Update stats
          this.updateStats();
          
          alert(`Successfully imported ${newQuotes.length} new quotes!`);
          
          // Reset file input
          event.target.value = '';
        } else {
          alert('No new quotes found in the import file');
        }
      } catch (error) {
        console.error('Error importing quotes:', error);
        alert(`Import failed: ${error.message}`);
      }
    };
    
    fileReader.readAsText(file);
  },
  
  // Update statistics
  updateStats: function() {
    const totalQuotes = this.quotes.length;
    let filteredCount = totalQuotes;
    
    if (this.currentFilter !== 'all') {
      filteredCount = this.quotes.filter(quote => 
        quote.category === this.currentFilter
      ).length;
    }
    
    // Update display if elements exist
    const totalEl = document.getElementById('totalQuotes');
    const filteredEl = document.getElementById('filteredQuotes');
    
    if (totalEl) totalEl.textContent = totalQuotes;
    if (filteredEl) filteredEl.textContent = filteredCount;
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  QuoteGenerator.init();
});