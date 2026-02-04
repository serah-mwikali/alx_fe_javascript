const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "Success is not final.", category: "Motivation" },
  { id: 2, text: "Talk is cheap. Show me the code.", category: "Programming" }
];

// ---------- STORAGE ----------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------- UI ----------
function updateStatus(message) {
  document.getElementById("syncStatus").textContent = message;
}

// ---------- CATEGORIES ----------
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const saved = localStorage.getItem("selectedCategory");
  if (saved) categoryFilter.value = saved;
}

// ---------- FILTER ----------
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selected);

  const display = document.getElementById("quoteDisplay");
  display.innerHTML = "";

  const filtered =
    selected === "all" ? quotes : quotes.filter(q => q.category === selected);

  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" (${q.category})`;
    display.appendChild(p);
  });
}

// ---------- RANDOM ----------
function showRandomQuote() {
  const display = document.getElementById("quoteDisplay");
  display.innerHTML = "";

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const p = document.createElement("p");
  p.textContent = `"${quote.text}" (${quote.category})`;
  display.appendChild(p);

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// ---------- ADD QUOTE ----------
function createAddQuoteForm() {
  const div = document.createElement("div");

  const text = document.createElement("input");
  text.id = "newQuoteText";
  text.placeholder = "Enter a new quote";

  const cat = document.createElement("input");
  cat.id = "newQuoteCategory";
  cat.placeholder = "Enter quote category";

  const btn = document.createElement("button");
  btn.textContent = "Add Quote";
  btn.addEventListener("click", addQuote);

  div.append(text, cat, btn);
  document.body.appendChild(div);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value;
  const category = document.getElementById("newQuoteCategory").value;

  if (!text || !category) return alert("Fill all fields");

  quotes.push({
    id: Date.now(),
    text,
    category
  });

  saveQuotes();
  populateCategories();
  filterQuotes();
}

// ---------- SERVER SYNC ----------
async function fetchServerQuotes() {
  const response = await fetch(SERVER_URL);
  const data = await response.json();

  // Simulated server quotes
  const serverQuotes = data.slice(0, 5).map(post => ({
    id: post.id,
    text: post.title,
    category: "Server"
  }));

  resolveConflicts(serverQuotes);
}

function resolveConflicts(serverQuotes) {
  const localIds = quotes.map(q => q.id);
  let updated = false;

  serverQuotes.forEach(sq => {
    if (!localIds.includes(sq.id)) {
      quotes.push(sq);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    updateStatus("⚠ Data updated from server (server wins)");
  }
}

// Periodic sync
setInterval(fetchServerQuotes, 15000);

// ---------- EXPORT ----------
document.getElementById("exportQuotes").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- IMPORT ----------
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    const imported = JSON.parse(e.target.result);
    quotes.push(...imported);
    saveQuotes();
    populateCategories();
    filterQuotes();
    alert("Quotes imported successfully!");
  };
  reader.readAsText(event.target.files[0]);
}

// ---------- EVENTS ----------
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// ---------- INIT ----------
createAddQuoteForm();
populateCategories();
filterQuotes();
fetchServerQuotes();

