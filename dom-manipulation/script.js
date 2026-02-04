// Main application object
const QuoteGenerator = {
  // Initial quotes database
  quotes: [
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
  ],
  
  // Available categories
  categories: ["Motivation", "Life", "Inspiration", "Perseverance", "Happiness", "Wisdom", "Love", "Courage"],
  
  // Current filter
  currentFilter: "All Categories",
  
  // Statistics
  stats: {
    quotesShown: 0,
    totalQuotes: 0,
    totalCategories: 0
  },
  
  // DOM Elements
  elements: {},
  
  // Initialize the application
  init: function() {
    this.cacheDOM();
    this.bindEvents();
    this.updateStats();
    this.populateCategories();
    this.renderCategoryFilters();
    this.showRandomQuote();
    this.renderRecentQuotes();
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
      recentQuotes: document.getElementById('recentQuotes')
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
  },
  
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
      alert('Please fill in all fields');
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
    
    // Clear the form
    this.elements.newQuoteText.value = '';
    this.elements.newQuoteAuthor.value = '';
    
    // Update stats
    this.stats.totalQuotes = this.quotes.length;
    this.updateStats();
    
    // Render recent quotes
    this.renderRecentQuotes();
    
    // Show success message
    this.displayQuote(
      "Your quote has been added successfully!",
      "System",
      "Success"
    );
    
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
      alert('Please enter a category name');
      return;
    }
    
    // Check if category already exists
    if (this.categories.includes(categoryName)) {
      alert('This category already exists');
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
    
    // Hide the form
    this.hideCategoryForm();
    
    // Update stats
    this.stats.totalCategories = this.categories.length;
    this.updateStats();
    
    // Show confirmation
    alert(`Category "${categoryName}" has been added successfully!`);
  },
  
  // Render recent quotes in the list
  renderRecentQuotes: function() {
    // Clear the list
    this.elements.recentQuotes.innerHTML = '';
    
    // Get the last 5 quotes (or all if less than 5)
    const recentQuotes = this.quotes.slice(-5).reverse();
    
    // Create a list item for each quote
    recentQuotes.forEach((quote, index) => {
      const quoteItem = document.createElement('div');
      quoteItem.className = 'quote-item';
      
      const quoteText = document.createElement('div');
      quoteText.className = 'quote-item-text';
      quoteText.textContent = `"${quote.text}"`;
      
      const quoteMeta = document.createElement('div');
      quoteMeta.className = 'quote-item-meta';
      quoteMeta.innerHTML = `
        <span>${quote.author}</span>
        <span>${quote.category}</span>
      `;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteQuote(this.quotes.length - 1 - index);
      });
      
      quoteItem.appendChild(quoteText);
      quoteItem.appendChild(quoteMeta);
      quoteItem.appendChild(deleteBtn);
      
      this.elements.recentQuotes.appendChild(quoteItem);
    });
    
    // If no quotes exist
    if (this.quotes.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'quote-item';
      emptyMessage.textContent = 'No quotes yet. Add your first quote above!';
      this.elements.recentQuotes.appendChild(emptyMessage);
    }
  },
  
  // Delete a quote
  deleteQuote: function(index) {
    if (confirm('Are you sure you want to delete this quote?')) {
      // Remove the quote from the array
      this.quotes.splice(index, 1);
      
      // Update stats
      this.stats.totalQuotes = this.quotes.length;
      this.updateStats();
      
      // Re-render recent quotes
      this.renderRecentQuotes();
      
      // Show a message
      this.displayQuote(
        "Quote deleted successfully.",
        "System",
        "Info"
      );
    }
  },
  
  // Update statistics display
  updateStats: function() {
    this.elements.totalQuotes.textContent = this.quotes.length;
    this.elements.totalCategories.textContent = this.categories.length;
    this.elements.quotesShown.textContent = this.stats.quotesShown;
  }
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  QuoteGenerator.init();
});