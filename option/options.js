const matchNames = document.getElementById("matchNames");
const searchProduct = document.getElementById("searchProduct");
const rating = document.getElementById("rating");
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");
const sellerId = document.getElementById("sellerId");
const submitButton = document.getElementById("submit");
const selectedCount = document.getElementById("selectedCount");
const mappingProducts = document.getElementById("showPossibleMappingProducts");
const loadingWindow = document.getElementById("loadingWindow");

let SAVED_PRODUCTS = [];
let PRODUCTS = [];
let SELECTED_PRODUCTS = [];

function showLoading() {
   loadingWindow.classList.add("show");
}

function hideLoading() {
   loadingWindow.classList.remove("show");
}

function createProductCard() {
   let htmlStr = "";
   const searchNames = matchNames.value
      ? matchNames.value
           .toLowerCase()
           .split("-")
           .map((n) => n.trim())
      : [];

   for (const i in PRODUCTS) {
      const product = PRODUCTS[i];
      const { finalPrice, id, imageUrl, mrp, rating, titles } = product;

      // Highlight matching terms in the title
      const { highlightedTitle, isFind } = highlightMatches(titles.newTitle, searchNames);

      htmlStr += `
      <div class="card product ${isFind ? "glow" : ""}">
         <input type="checkbox" name="" class="select-product">
         <div class="show-img">
            <img src="${imageUrl}" alt="product-image-${i}">
         </div>
         <div class="rating ${rating.count <= 0 ? "hidden" : ""}">
            ${rating.average}
         </div>
         <div class="name">${highlightedTitle}</div>
         <div class="quantity">${titles.subtitle}</div>
         <div class="prices">
            <div class="selling-price">${finalPrice.value}</div>
            <div class="original-price">${mrp.value}</div>
         </div>
      </div>`;
   }
   mappingProducts.innerHTML = htmlStr;
}

function highlightMatches(title, searchNames) {
   let highlightedTitle = title;
   let isFind = false;

   // First highlight numbers
   const numberRegex = /\d+/g;
   highlightedTitle = highlightedTitle.replace(numberRegex, "<p>$&</p>");

   // Then highlight search terms and set isFind
   searchNames.forEach((name) => {
      if (name) {
         const regex = new RegExp(`(${name})`, "gi");
         if (regex.test(title.toLowerCase())) {
            isFind = true;
         }
         highlightedTitle = highlightedTitle.replace(regex, "<span>$1</span>");
      }
   });

   return { highlightedTitle, isFind };
}

function filterByRating() {
   const ratingValue = rating.value;
   if (ratingValue === "0") {
      PRODUCTS = [...SAVED_PRODUCTS];
      return;
   }

   // Start with current filtered products
   PRODUCTS = PRODUCTS.sort(
      (a, b) => b.rating.average - a.rating.average
   ).filter((x) => x.rating.count <= 0 || x.rating.average >= ratingValue);
}

function filterByNames() {
   const nameValue = matchNames.value;
   if (!nameValue) {
      PRODUCTS = [...SAVED_PRODUCTS];
      return;
   }

   const names = nameValue
      .toLowerCase()
      .split("-")
      .map((n) => n.trim());

   // Sort products: matching names first, non-matching last
   PRODUCTS.sort((a, b) => {
      const titleA = a.titles.newTitle.toLowerCase();
      const titleB = b.titles.newTitle.toLowerCase();

      // Check if titles match any of the search names
      const matchesA = names.some((name) => titleA.includes(name));
      const matchesB = names.some((name) => titleB.includes(name));

      if (matchesA && !matchesB) return -1; // A matches, B doesn't -> A comes first
      if (!matchesA && matchesB) return 1; // B matches, A doesn't -> B comes first
      return 0; // Both match or both don't match -> keep original order
   });
}

function filterProducts() {
   // Start with a fresh copy
   PRODUCTS = [...SAVED_PRODUCTS];

   // Apply filters in sequence
   filterByNames();
   // filterByRating();

   createProductCard();
}

rating.addEventListener("input", filterProducts);
matchNames.addEventListener(
   "input",
   debounce(filterProducts, () => 1000)
);

submitButton.addEventListener("click", async () => {
   const productName = searchProduct.value;
   if (!productName) return;

   const startingPage = startPage.value || 1;
   const endingPage = endPage.value || 1;
   const sid = sellerId.value;

   const data = {
      productName,
      startingPage,
      endingPage,
      sellerId: sid,
   };

   showLoading();

   try {
      PRODUCTS = await getMappingPossibleProductData(data);
      SAVED_PRODUCTS = [...PRODUCTS];
      createProductCard();
   } catch (error) {
      console.error("Error:", error);
   } finally {
      hideLoading();
   }
});

function getMappingPossibleProductData(data) {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_mapping_possible_product_data", data, (r) => {
         resolve(r);
      });
   });
}

// Handle card selection
mappingProducts.addEventListener("change", (e) => {
   if (e.target.classList.contains("select-product")) {
      const card = e.target.closest(".card");
      if (card) {
         card.classList.toggle("selected", e.target.checked);
         updateSelectedCount();
      }
   }
});

// Update selected count display
function updateSelectedCount() {
   const selectedCards = document.querySelectorAll(
      ".card .select-product:checked"
   );
   const count = selectedCards.length;

   selectedCount.textContent = `${count} card${
      count !== 1 ? "s" : ""
   } selected`;
   selectedCount.classList.toggle("show", count > 0);
}
