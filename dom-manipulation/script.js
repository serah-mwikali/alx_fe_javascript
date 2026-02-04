const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "Success is not final.", category: "Motivation" },
  { id: 2, text: "Talk is cheap. Show me the code.", category: "Programming" }
];

// ---------- STORAGE ----------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------- UI NOTIFICATION ----------
function updateSyncStatus(message) {
  document.getElementById("syncStatus").textContent = message;
}

// ---------- CATEGORIES ----------
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  select.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  const saved = localStorage.getItem("selectedCategory");
  if (saved) select.value = saved;
}

// ---------- FILTER ----------
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selected);

  const display = document.getElementById("quoteDisplay");
  display.innerHTML = "";

  const filtered =
    selected === "all"
      ? quotes
      : quotes.filter(q => q.category === selected);

  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}" (${q.category})`;
    display.appendChild(p);
  });
}

// ---------- SERVER FETCH ----------
async function fetchQuotesFromServer() {
  const response = await fetch(SERVER_URL);
  const data = await response.json();

  const serverQuotes = data.slice(0, 5).map(post => ({
    id: post.id,
    text: post.title,
    category: "Server"
  }));

  syncQuotes(serverQuotes);
}

// ---------- SYNC + CONFLICT RESOLUTION ----------
function syncQuotes(serverQuotes) {
  let updated = false;
  const localIds = quotes.map(q => q.id);

  serverQuotes.forEach(serverQuote => {
    if (!localIds.includes(serverQuote.id)) {
      quotes.push(serverQuote);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    updateSyncStatus("Data updated from server. Server version applied.");
  }
}

// ---------- POST TO SERVER ----------
async function postQuoteToServer(quote) {
  await fetch(SERVER_URL, {
    method: "POST",
    body: JSON.stringify(quote),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

// ---------- ADD QUOTE ----------
function createAddQuoteForm() {
  const div = document.createElement("div");

  const text = document.createElement("input");
  text.id = "newQuoteText";
  text.placeholder = "Enter a new quote";

  const category = document.createElement("input");
  category.id = "newQuoteCategory";
  category.placeholder = "Enter quote category";

  const btn = document.createElement("button");
  btn.textContent = "Add Quote";
  btn.onclick = addQuote;

  div.append(text, category, btn);
  document.body.appendChild(div);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value;
  const category = document.getElementById("newQuoteCategory").value;

  if (!text || !category) return alert("Fill all fields");

  const newQuote = {
    id: Date.now(),
    text,
    category
  };

  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  filterQuotes();
  postQuoteToServer(newQuote);
}

// ---------- EVENTS ----------
document.getElementById("newQuote").addEventListener("click", filterQuotes);

// ---------- PERIODIC SYNC ----------
setInterval(fetchQuotesFromServer, 15000);

// ---------- INIT ----------
createAddQuoteForm();
populateCategories();
filterQuotes();
fetchQuotesFromServer();

