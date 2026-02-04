// Main application object
const QuoteGenerator = {
  // Initial quotes database
  quotes: [],
  
  // Available categories
  categories: ["Motivation", "Life", "Inspiration", "Perseverance", "Happiness", "Wisdom", "Love", "Courage"],
  
  // Current filter
  currentFilter: "all",
  sortBy: "random",
  
  // Statistics
  stats: {
    quotesShown: 0,
    totalQuotes: 0,
    totalCategories: 0,
    sessionStartTime: new Date().toLocaleTimeString(),
    filteredQuotes: 0
  },
  
  // Session data
  sessionData: {
    lastViewedQuote: null,
    lastViewedCategory: null,
    viewCount: 0,
    lastFilter: "all"
  },
  
  // DOM Elements
  elements: {},
  
  // Initialize the application
  init: function() {
    this.cacheDOM();
    this.loadFromStorage();
    this.bindEvents();
    this.updateStats();
    this.populateCategories(); // For dropdown
    this.renderCategoryBadges(); // For badge buttons
    this.applyFilter(); // Apply saved filter
    this.showRandomQuote();
    this.renderRecentQuotes();
    this.updateSessionInfo();
    this.updateFilteredCount();
  },
  
  // Cache DOM elements
  cacheDOM: function() {
    this.elements = {
      quoteDisplay: document.getElementById('quoteDisplay'),
      newQuoteBtn: document.getElementById('newQuote'),
      randomCategoryBtn: document.getElementById('randomCategory'),
      allCategoriesBtn: document.getElementById('allCategories'),
      categoryFilter: document.getElementById('categoryFilter'),
      sortBy: document.getElementById('sortBy'),
      applyFilter: document.getElementById('applyFilter'),
      resetFilter: document.getElementById('resetFilter'),
      categoryButtons: document.getElementById('categoryButtons'),
      filteredCount: document.getElementById('filteredCount'),
      filteredQuotes: document.getElementById('filteredQuotes'),
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
    
    // Filter events
    this.elements.applyFilter.addEventListener('click', () => this.applyFilter());
    this.elements.resetFilter.addEventListener('click', () => this.resetFilter());
    this.elements.sortBy.addEventListener('change', () => this.applyFilter());
    
    // Storage events
    this.elements.exportBtn.addEventListener('click', () => this.exportToJSON());
    this.elements.importFile.addEventListener('change', (e) => this.importFromJSON(e));
    this.elements.clearStorageBtn.addEventListener('click', () => this.clearAllData());
  },
  
  // ====================
  // FILTERING SYSTEM
  // ====================
  
  // Populate categories dropdown (as required by task)
  populateCategories: function() {
    // Clear existing options
    this.elements.categoryFilter.innerHTML = '';
    this.elements.newQuoteCategory.innerHTML = '';
    
    // Add "All Categories" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    this.elements.categoryFilter.appendChild(allOption);
    
    // Add an option for each category
    this.categories.forEach(category => {
      // For filter dropdown
      const filterOption = document.createElement('option');
      filterOption.value = category;
      filterOption.textContent = category;
      this.elements.categoryFilter.appendChild(filterOption);
      
      // For quote addition dropdown
      const addOption = document.createElement('option');
      addOption.value = category;
      addOption.textContent = category;
      this.elements.newQuoteCategory.appendChild(addOption);
    });
    
    // Set current filter from saved preference
    this.elements.categoryFilter.value = this.currentFilter;
    this.elements.sortBy.value = this.sortBy;
  },
  
  // Render category badges (buttons)
  renderCategoryBadges: function() {
    // Clear existing badges
    this.elements.categoryButtons.innerHTML = '';
    
    // Add "All" badge
    const allBadge = document.createElement('span');
    allBadge.className = `category-badge ${this.currentFilter === 'all' ? 'active' : ''}`;
    allBadge.textContent = 'All Categories';
    allBadge.addEventListener('click', () => {
      this.currentFilter = 'all';
      this.applyFilter();
      this.saveFilterPreference();
    });
    this.elements.categoryButtons.appendChild(allBadge);
    
    // Create a badge for each category with count
    this.categories.forEach(category => {
      const count = this.getQuoteCountByCategory(category);
      const badge = document.createElement('span');
      badge.className = `category-badge ${this.currentFilter === category ? 'active' : ''}`;
      badge.innerHTML = `
        ${category}
        <span class="category-count">${count}</span>
      `;
      badge.addEventListener('click', () => {
        this.currentFilter = category;
        this.applyFilter();
        this.saveFilterPreference();
      });
      this.elements.categoryButtons.appendChild(badge);
    });
  },
  
  // Get count of quotes by category
  getQuoteCountByCategory: function(category) {
    return this.quotes.filter(quote => quote.category === category).length;
  },
  
  // Apply filter based on selected category and sort
  applyFilter: function() {
    // Get filter values
    this.currentFilter = this.elements.categoryFilter.value;
    this.sortBy = this.elements.sortBy.value;
    
    // Save filter preference
    this.saveFilterPreference();
    
    // Update UI
    this.updateFilteredCount();
    this.renderCategoryBadges();
    
    // Update session data
    if (this.currentFilter !== 'all') {
      this.sessionData.lastViewedCategory = this.currentFilter;
      this.saveToSessionStorage();
      this.updateSessionInfo();
    }
    
    // Show a quote based on filter
    this.showFilteredQuote();
  },
  
  // Show a filtered quote
  showFilteredQuote: function() {
    let filteredQuotes = this.quotes;
    
    // Apply category filter
    if (this.currentFilter !== 'all') {
      filteredQuotes = this.quotes.filter(quote => quote.category === this.currentFilter);
    }
    
    // Apply sorting
    filteredQuotes = this.sortQuotes(filteredQuotes, this.sortBy);
    
    // Update filtered count
    this.stats.filteredQuotes = filteredQuotes.length;
    this.updateStats();
    
    // Check if we have quotes to show
    if (filteredQuotes.length === 0) {
      this.displayQuote(
        `No quotes found ${this.currentFilter !== 'all' ? `in category "${this.currentFilter}"` : ''}. Add some quotes!`,
        "System",
        "Info"
      );
      return;
    }
    
    // Get a random quote from filtered list
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    
    // Display the quote
    this.displayQuote(randomQuote.text, randomQuote.author, randomQuote.category);
    
    // Update session data
    this.sessionData.lastViewedQuote = randomQuote;
    this.sessionData.viewCount++;
    this.saveToSessionStorage();
    this.updateSessionInfo();
    
    // Update stats
    this.stats.quotesShown++;
    this.updateStats();
  },
  
  // Sort quotes based on selected criteria
  sortQuotes: function(quotes, sortBy) {
    const sortedQuotes = [...quotes];
    
    switch (sortBy) {
      case 'newest':
        // Assuming newer quotes are at the end of array
        return sortedQuotes.reverse();
        
      case 'oldest':
        // Assuming older quotes are at the beginning
        return sortedQuotes;
        
      case 'author':
        return sortedQuotes.sort((a, b) => a.author.localeCompare(b.author));
        
      case 'random':
        return this.shuffleArray(sortedQuotes);
        
      default:
        return sortedQuotes;
    }
  },
  
  // Shuffle array for random sorting
  shuffleArray: function(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  // Reset filter to show all categories
  resetFilter: function() {
    this.currentFilter = 'all';
    this.sortBy = 'random';
    this.elements.categoryFilter.value = 'all';
    this.elements.sortBy.value = 'random';
    this.applyFilter();
  },
  
  // Update filtered count display
  updateFilteredCount: function() {
    let count = this.quotes.length;
    let text = `Showing all ${count} quotes`;
    
    if (this.currentFilter !== 'all') {
      count = this.getQuoteCountByCategory(this.currentFilter);
      text = `Showing ${count} quotes in category: "${this.currentFilter}"`;
    }
    
    if (this.sortBy !== 'random') {
      text += ` | Sorted by: ${this.sortBy}`;
    }
    
    this.elements.filteredCount.textContent = text;
  },
  
  // Save filter preference to local storage
  saveFilterPreference: function() {
    try {
      const filterPref = {
        category: this.currentFilter,
        sortBy: this.sortBy,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('quoteFilterPreference', JSON.stringify(filterPref));
    } catch (error) {
      console.error('Error saving filter preference:', error);
    }
  },
  
  // Load filter preference from local storage
  loadFilterPreference: function() {
    try {
      const savedPref = localStorage.getItem('quoteFilterPreference');
      if (savedPref) {
        const pref = JSON.parse(savedPref);
        this.currentFilter = pref.category || 'all';
        this.sortBy = pref.sortBy || 'random';
        return true;
      }
    } catch (error) {
      console.error('Error loading filter preference:', error);
    }
    return false;
  },
  
  // ====================
  // EXISTING METHODS (Updated)
  // ====================
  
  // Load all data from storage (updated to include filter preferences)
  loadFromStorage: function() {
    const hasLocalData = this.loadFromLocalStorage();
    const hasSessionData = this.loadFromSessionStorage();
    this.loadFilterPreference(); // Load filter preferences
    
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
        lastFilter: this.currentFilter,
        sessionStartTime: new Date().toLocaleTimeString()
      };
    }
  },
  
  // Show quotes from a random category
  showRandomCategory: function() {
    // Get a random category
    const randomIndex = Math.floor(Math.random() * this.categories.length);
    this.currentFilter = this.categories[randomIndex];
    this.elements.categoryFilter.value = this.currentFilter;
    this.applyFilter();
  },
  
  // Show quotes from all categories
  showAllCategories: function() {
    this.currentFilter = "all";
    this.elements.categoryFilter.value = "all";
    this.applyFilter();
  },
  
  // Function to add a new quote (updated to refresh filters)
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
      category,
      addedDate: new Date().toISOString()
    };
    
    // Add to quotes array
    this.quotes.push(newQuote);
    
    // Add category if it's new
    if (!this.categories.includes(category)) {
      this.categories.push(category);
      this.populateCategories(); // Refresh dropdowns
      this.renderCategoryBadges(); // Refresh badges
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
    this.updateFilteredCount();
    
    // Render recent quotes
    this.renderRecentQuotes();
    
    // Show success message
    this.showStorageAlert('Quote added successfully!', 'success');
    
    // Update the display if we're viewing this category or all
    if (this.currentFilter === category || this.currentFilter === 'all') {
      setTimeout(() => this.showFilteredQuote(), 1000);
    }
  },
  
  // Show random quote (updated to use filtered view)
  showRandomQuote: function() {
    this.showFilteredQuote();
  },
  
  // Save a new category (updated to refresh filters)
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
    
    // Update UI
    this.populateCategories(); // Refresh dropdowns
    this.renderCategoryBadges(); // Refresh badges
    
    // Set the new category as selected in the dropdown
    this.elements.newQuoteCategory.value = categoryName;
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    // Update stats
    this.stats.totalCategories = this.categories.length;
    this.updateStats();
    
    // Hide the form
    this.hideCategoryForm();
    
    // Show success message
    this.showStorageAlert(`Category "${categoryName}" has been added successfully!`, 'success');
  },
  
  // ====================
  // EXISTING WEB STORAGE & JSON METHODS
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
    } catch (error) {
      console.error('