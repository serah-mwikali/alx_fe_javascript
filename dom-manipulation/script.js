// Main application object
const QuoteGenerator = {
  // Initial quotes database
  quotes: [],
  
  // Available categories
  categories: ["Motivation", "Life", "Inspiration", "Perseverance", "Happiness", "Wisdom", "Love", "Courage"],
  
  // Current filter
  currentFilter: "All Categories",
  
  // Statistics
  stats: {
    quotesShown: 0,
    totalQuotes: 0,
    totalCategories: 0,
    sessionStartTime: new Date().toLocaleTimeString()
  },
  
  // Session data
  sessionData: {
    lastViewedQuote: null,
    lastViewedCategory: null,
    viewCount: 0
  },
  
  // DOM Elements
  elements: {},
  
  // Initialize the application
  init: function() {
    this.cacheDOM();
    this.loadFromStorage();
    this.bindEvents();
    this.updateStats();
    this.populateCategories();
    this.renderCategoryFilters();
    this.showRandomQuote();
    this.renderRecentQuotes();
    this.updateSessionInfo();
  },
  
  // Cache DOM elements
  cacheDOM: function() {
    this.elements = {
      quoteDisplay: document.getElementById('quoteDisplay'),
      newQuoteBtn: document.getElementById('newQuote'),
      randomCategoryBtn: document.getElementById('randomCategory'),
      allCategoriesBtn: document.getElementById('allCategories'),
      categoryFilter: document.getElementById('categoryFilter'),
      newQuoteText: document.getElementById('newQuoteText'),
      newQuoteAuthor: document.getElementById('newQuoteAuthor'),
      newQuoteCategory: document.getElementById('newQuoteCategory'),
      addQuoteBtn: document.getElementById('addQuoteBtn'),
      newCategoryBtn: document.getElementById('newCategoryBtn'),
      newCategoryForm: document.getElementById('newCategoryForm'),
      newCategoryName: document.getElementById('newCategoryName'),
      saveCategoryBtn: document.getElementById('saveCategoryBtn'),
      cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
      totalQuotes: document.getElementById('totalQuotes'),
      totalCategories: document.getElementById('totalCategories'),
      quotesShown: document.getElementById('quotesShown'),
      recentQuotes: document.getElementById('recentQuotes'),
      exportBtn: document.getElementById('exportBtn'),
      importBtn: document.getElementById('importBtn'),
      importFile: document.getElementById('importFile'),
      clearStorageBtn: document.getElementById('clearStorageBtn'),
      storageAlert: document.getElementById('storageAlert'),
      sessionInfo: document.getElementById('sessionInfo'),
      sessionData: document.getElementById('sessionData')
    };
  },
  
  // Bind event listeners
  bindEvents: function() {
    // Quote display events
    this.elements.newQuoteBtn.addEventListener('click', () => this.showRandomQuote());
    this.elements.randomCategoryBtn.addEventListener('click', () => this.showRandomCategory());
    this.elements.allCategoriesBtn.addEventListener('click', () => this.showAllCategories());
    
    // Quote addition events
    this.elements.addQuoteBtn.addEventListener('click', () => this.addQuote());
    
    // Category management events
    this.elements.newCategoryBtn.addEventListener('click', () => this.showCategoryForm());
    this.elements.saveCategoryBtn.addEventListener('click', () => this.saveCategory());
    this.elements.cancelCategoryBtn.addEventListener('click', () => this.hideCategoryForm());
    
    // Storage events
    this.elements.exportBtn.addEventListener('click', () => this.exportToJSON());
    this.elements.importFile.addEventListener('change', (e) => this.importFromJSON(e));
    this.elements.clearStorageBtn.addEventListener('click', () => this.clearAllData());
  },
  
  // ====================
  // WEB STORAGE METHODS
  // ====================
  
  // Save quotes to Local Storage
  saveToLocalStorage: function() {
    try {
      const data = {
        quotes: this.quotes,
        categories: this.categories,
        stats: this.stats
      };
      localStorage.setItem('quoteGeneratorData', JSON.stringify(data));
      console.log('Data saved to Local Storage');
    } catch (error) {
      console.error('Error saving to Local Storage:', error);
      this.showStorageAlert('Error saving data to Local Storage', 'error');
    }
  },
  
  // Load quotes from Local Storage
  loadFromLocalStorage: function() {
    try {
      const savedData = localStorage.getItem('quoteGeneratorData');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.quotes = data.quotes || [];
        this.categories = data.categories || ["Motivation", "Life", "Inspiration"];
        this.stats = data.stats || { quotesShown: 0, totalQuotes: 0, totalCategories: 0 };
        console.log('Data loaded from Local Storage');
        return true;
      }
    } catch (error) {
      console.error('Error loading from Local Storage:', error);
      this.showStorageAlert('Error loading data from Local Storage', 'error');
    }
    return false;
  },
  
  // Save session data to Session Storage
  saveToSessionStorage: function() {
    try {
      sessionStorage.setItem('quoteGeneratorSession', JSON.stringify(this.sessionData));
    } catch (error) {
      console.error('Error saving to Session Storage:', error);
    }
  },
  
  // Load session data from Session Storage
  loadFromSessionStorage: function() {
    try {
      const savedSession = sessionStorage.getItem('quoteGeneratorSession');
      if (savedSession) {
        this.sessionData = JSON.parse(savedSession);
        return true;
      }
    } catch (error) {
      console.error('Error loading from Session Storage:', error);
    }
    return false;
  },
  
  // Load all data from storage
  loadFromStorage: function() {
    const hasLocalData = this.loadFromLocalStorage();
    const hasSessionData = this.loadFromSessionStorage();
    
    // If no local data, load default quotes
    if (!hasLocalData || this.quotes.length === 0) {
      this.loadDefaultQuotes();
    }
    
    // Initialize session data if none exists
    if (!hasSessionData) {
      this.sessionData = {
        lastViewedQuote: null,
        lastViewedCategory: null,
        viewCount: 0,
        sessionStartTime: new Date().toLocaleTimeString()
      };
    }
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
    
    this.stats.totalQuotes = this.quotes.length;
    this.stats.totalCategories = this.categories.length;
    this.saveToLocalStorage();
  },
  
  // Update session info
  updateSessionInfo: function() {
    this.sessionData.viewCount++;
    this.saveToSessionStorage();
    
    let sessionText = `Quotes viewed this session: ${this.sessionData.viewCount}`;
    if (this.sessionData.lastViewedQuote) {
      sessionText += ` | Last quote: "${this.sessionData.lastViewedQuote.text.substring(0, 30)}..."`;
    }
    if (this.sessionData.lastViewedCategory) {
      sessionText += ` | Last category: ${this.sessionData.lastViewedCategory}`;
    }
    
    this.elements.sessionData.textContent = sessionText;
  },
  
  // ====================
  // JSON IMPORT/EXPORT
  // ====================
  
  // Export quotes to JSON file
  exportToJSON: function() {
    try {
      const data = {
        quotes: this.quotes,
        categories: this.categories,
        exportDate: new Date().toISOString(),
        totalQuotes: this.quotes.length,
        totalCategories: this.categories.length
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
      
      this.showStorageAlert('Quotes exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting quotes:', error);
      this.showStorageAlert('Error exporting quotes', 'error');
    }
  },
  
  // Import quotes from JSON file
  importFromJSON: function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate imported data
        if (!importedData.quotes || !Array.isArray(importedData.quotes)) {
          throw new Error('Invalid JSON format: missing quotes array');
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
          
          // Add new categories if present
          if (importedData.categories && Array.isArray(importedData.categories)) {
            importedData.categories.forEach(category => {
              if (!this.categories.includes(category)) {
                this.categories.push(category);
              }
            });
          }
          
          // Save to storage
          this.saveToLocalStorage();
          this.updateStats();
          this.populateCategories();
          this.renderCategoryFilters();
          this.renderRecentQuotes();
          
          this.showStorageAlert(`Successfully imported ${newQuotes.length} new quotes!`, 'success');
          
          // Reset file input
          event.target.value = '';
        } else {
          this.showStorageAlert('No new quotes found in the import file', 'error');
        }
      } catch (error) {
        console.error('Error importing quotes:', error);
        this.showStorageAlert(`Import failed: ${error.message}`, 'error');
      }
    };
    
    fileReader.onerror = () => {
      this.showStorageAlert('Error reading the file', 'error');
    };
    
    fileReader.readAsText(file);
  },
  
  // Clear all data
  clearAllData: function() {
    if (confirm('Are you sure you want to clear ALL data? This will remove all quotes and reset to defaults.')) {
      try {
        // Clear localStorage
        localStorage.removeItem('quoteGeneratorData');
        
        // Clear sessionStorage
        sessionStorage.removeItem('quoteGeneratorSession');
        
        // Reset to defaults
        this.loadDefaultQuotes();
        this.sessionData = {
          lastViewedQuote: null,
          lastViewedCategory: null,
          viewCount: 0,
          sessionStartTime: new Date().toLocaleTimeString()
        };
        
        // Update UI
        this.updateStats();
        this.populateCategories();
        this.renderCategoryFilters();
        this.renderRecentQuotes();
        this.updateSessionInfo();
        
        this.showStorageAlert('All data has been cleared. Default quotes loaded.', 'success');
        this.showRandomQuote();
      } catch (error) {
        console.error('Error clearing data:', error);
        this.showStorageAlert('Error clearing data', 'error');
      }
    }
  },
  
  // Show storage alert
  showStorageAlert: function(message, type = 'info') {
    this.elements.storageAlert.innerHTML = `
      <div class="alert alert-${type}">
        ${message}
      </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.elements.storageAlert.innerHTML = '';
    }, 5000);
  },
  
  // ====================
  // EXISTING FUNCTIONALITY (Updated)
  // ====================
  
  // Function to display a random quote
  showRandomQuote: function() {
    // Filter quotes if a category is selected
    let filteredQuotes = this.quotes;
    if (this.currentFilter !== "All Categories" && this.currentFilter !== "Random Category") {
      filteredQuotes = this.quotes.filter(quote => quote.category === this.currentFilter);
    }
    
    // Check if we have quotes to show
    if (filteredQuotes.length === 0) {
      this.displayQuote(
        "No quotes found in this category. Add some quotes or select a different category.",
        "System",
        "Info"
      );
      return;
    }
    
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    // Display the quote
    this.displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
    
    // Update session data
    this.sessionData.lastViewedQuote = randomQuote;
    this.sessionData.lastViewedCategory = randomQuote.category;
    this.saveToSessionStorage();
    this.updateSessionInfo();
    
    // Update stats
    this.stats.quotesShown++;
    this.updateStats();
  },
  
  // Display a quote in the DOM
  displayQuote: function(text, author, category) {
    // Clear the current quote display
    this.elements.quoteDisplay.innerHTML = '';
    
    // Create quote elements
    const quoteText = document.createElement('p');
    quoteText.className = 'quote-text';
    quoteText.textContent = `"${text}"`;
    
    const quoteAuthor = document.createElement('p');
    quoteAuthor.className = 'quote-author';
    quoteAuthor.textContent = `- ${author}`;
    
    const quoteCategory = document.createElement('span');
    quoteCategory.className = 'quote-category';
    quoteCategory.textContent = category;
    
    // Add elements to the display
    this.elements.quoteDisplay.appendChild(quoteText);
    this.elements.quoteDisplay.appendChild(quoteAuthor);
    this.elements.quoteDisplay.appendChild(quoteCategory);
  },
  
  // Show quotes from a random category
  showRandomCategory: function() {
    // Get a random category
    const randomIndex = Math.floor(Math.random() * this.categories.length);
    this.currentFilter = this.categories[randomIndex];
    
    // Update active button
    this.updateActiveCategoryButton(this.currentFilter);
    
    // Show a quote from that category
    this.showRandomQuote();
  },
  
  // Show quotes from all categories
  showAllCategories: function() {
    this.currentFilter = "All Categories";
    this.updateActiveCategoryButton("All Categories");
    this.showRandomQuote();
  },
  
  // Filter quotes by a specific category
  filterByCategory: function(category) {
    this.currentFilter = category;
    this.updateActiveCategoryButton(category);
    this.showRandomQuote();
  },
  
  // Update the active category button
  updateActiveCategoryButton: function(activeCategory) {
    // Remove active class from all category buttons
    const allButtons = document.querySelectorAll('.category-btn');
    allButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to the corresponding button
    if (activeCategory === "All Categories") {
      this.elements.allCategoriesBtn.classList.add('active');
    } else {
      // Find the button for this category
      const categoryButtons = document.querySelectorAll('.category-filter-btn');
      categoryButtons.forEach(btn => {
        if (btn.textContent === activeCategory) {
          btn.classList.add('active');
        }
      });
    }
  },
  
  // Render category filter buttons
  renderCategoryFilters: function() {
    // Clear existing buttons
    this.elements.categoryFilter.innerHTML = '';
    
    // Create a button for each category
    this.categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'category-btn category-filter-btn';
      button.textContent = category;
      
      // Add event listener
      button.addEventListener('click', () => this.filterByCategory(category));
      
      // Add to DOM
      this.elements.categoryFilter.appendChild(button);
    });
  },
  
  // Populate category select dropdown
  populateCategories: function() {
    // Clear existing options
    this.elements.newQuoteCategory.innerHTML = '';
    
    // Add an option for each category
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      this.elements.newQuoteCategory.appendChild(option);
    });
  },
  
  // Function to add a new quote
  addQuote: function() {
    // Get form values
    const text = this.elements.newQuoteText.value.trim();
    const author = this.elements.newQuoteAuthor.value.trim();
    const category = this.elements.newQuoteCategory.value;
    
    // Validate inputs
    if (!text || !author || !category) {
      this.showStorageAlert('Please fill in all fields', 'error');
      return;
    }
    
    // Check for duplicate quote
    const isDuplicate = this.quotes.some(quote => 
      quote.text === text && quote.author === author
    );
    
    if (isDuplicate) {
      this.showStorageAlert('This quote already exists in the collection', 'error');
      return;
    }
    
    // Create new quote object
    const newQuote = {
      text,
      author,
      category
    };
    
    // Add to quotes array
    this.quotes.push(newQuote);
    
    // Add category if it's new
    if (!this.categories.includes(category)) {
      this.categories.push(category);
      this.populateCategories();
      this.renderCategoryFilters();
    }
    
    // Clear the form
    this.elements.newQuoteText.value = '';
    this.elements.newQuoteAuthor.value = '';
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    // Update stats
    this.stats.totalQuotes = this.quotes.length;
    this.stats.totalCategories = this.categories.length;
    this.updateStats();
    
    // Render recent quotes
    this.renderRecentQuotes();
    
    // Show success message
    this.showStorageAlert('Quote added successfully!', 'success');
    
    // If we're currently filtered to this category, update the display
    if (this.currentFilter === category || this.currentFilter === "All Categories") {
      setTimeout(() => this.showRandomQuote(), 1500);
    }
  },
  
  // Show the form to add a new category
  showCategoryForm: function() {
    this.elements.newCategoryForm.classList.remove('hidden');
    this.elements.newCategoryName.focus();
  },
  
  // Hide the category form
  hideCategoryForm: function() {
    this.elements.newCategoryForm.classList.add('hidden');
    this.elements.newCategoryName.value = '';
  },
  
  // Save a new category
  saveCategory: function() {
    const categoryName = this.elements.newCategoryName.value.trim();
    
    // Validate input
    if (!categoryName) {
      this.showStorageAlert('Please enter a category name', 'error');
      return;
    }
    
    // Check if category already exists
    if (this.categories.includes(categoryName)) {
      this.showStorageAlert('This category already exists', 'error');
      return;
    }
    
    // Add the new category
    this.categories.push(categoryName);
    
    // Update the category filter buttons
    this.renderCategoryFilters();
    
    // Update the category dropdown
    this.populateCategories();
    
    // Set the new category as selected in the dropdown
    this.elements.newQuoteCategory.value = categoryName;
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    // Hide the form
    this.hideCategoryForm();
    
    //