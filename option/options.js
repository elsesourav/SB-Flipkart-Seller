const matchNames = document.getElementById("matchNames");
const searchProduct = document.getElementById("searchProduct");
const rating = document.getElementById("rating");
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");
const sellerId = document.getElementById("sellerId");
const submitButton = document.getElementById("submit");
// const selectedCount = document.getElementById("selectedCount");
const mappingProducts = document.getElementById("showPossibleMappingProducts");
const loadingWindow = document.getElementById("loadingWindow");
const showNumberOfProductsSelected = document.getElementById(
   "showNumberOfProductsSelected"
);
const selectAllProducts = document.getElementById("selectAllProducts");
const selectNameMatchProducts = document.getElementById(
   "selectNameMatchProducts"
);
const startMapping = document.getElementById("startMapping");
const previewWindow = document.getElementById("previewWindow");
const previewBody = document.getElementById("previewBody");
const closePreview = document.getElementById("closePreview");
const cancelPreview = document.getElementById("cancelPreview");
const confirmPreview = document.getElementById("confirmPreview");
// const confirmCheck = document.getElementById("confirmationInput");
const previewProducts = document.getElementById("previewProducts");

// Confirmation window elements
const startMappingFinalStep = document.getElementById("startFinalMapping");
const confirmationWindow = document.getElementById("confirmationWindow");
const confirmationInput = document.getElementById("confirmationInput");
const confirmationError = document.getElementById("confirmationError");
const closeConfirmation = document.getElementById("closeConfirmation");
const cancelConfirmation = document.getElementById("cancelConfirmation");

// Success window elements
const successWindow = document.querySelector(".success-window");
const mapMoreBtn = document.getElementById("mapMoreBtn");
const totalProductsEl = document.getElementById("totalProducts");
const successProductsEl = document.getElementById("successProducts");
const failedProductsEl = document.getElementById("failedProducts");

let SAVED_PRODUCTS = [];
let PRODUCTS = [];
let SELECTED_PRODUCTS = [];

let SELECTED_PRODUCTS_DATA = [];
let EXTENSION_MAPPING_DATA = null;
let FK_CSRF_TOKEN = null;
let SELLER_ID = null;

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
      const { highlightedTitle, isFind } = highlightMatches(
         titles.title,
         searchNames
      );

      htmlStr += `
      <div class="card product ${isFind ? "glow" : ""}" id="${id}">
         <input type="checkbox" name="" class="select-product" data-product-id="${id}">
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
      // PRODUCTS = [...SAVED_PRODUCTS];
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
   filterByRating();
   filterByNames();

   createProductCard();
}

rating.addEventListener("input", filterProducts);
matchNames.addEventListener(
   "input",
   debounce(filterProducts, () => 1000)
);

async function verifyUserMustLogin() {
   if (!FK_CSRF_TOKEN) {
      const { token } = await getFkCsrfToken();
      FK_CSRF_TOKEN = token;
   }

   if (!FK_CSRF_TOKEN) {
      alert("You don't login to Flipkart Seller Page, please login first");
      return false;
   }
   return true;
}

submitButton.addEventListener("click", async () => {
   const productName = searchProduct.value;
   if (!productName) return;

   const startingPage = startPage.value || 1;
   const endingPage = endPage.value || 1;
   SELLER_ID = sellerId.value;

   const data = {
      productName,
      startingPage,
      endingPage,
      sellerId: SELLER_ID,
   };

   if (!(await verifyUserMustLogin())) return;

   showLoading();

   try {
      PRODUCTS = await getMappingPossibleProductData(data);
      SAVED_PRODUCTS = [...PRODUCTS];
      filterProducts();
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

// // Handle card selection
// mappingProducts.addEventListener("change", (e) => {
//    if (e.target.classList.contains("select-product")) {
//       const card = e.target.closest(".card");
//       if (card) {
//          card.classList.toggle("selected", e.target.checked);
//          updateSelectedCount();
//       }
//    }
// });

// // Update selected count display
// function updateSelectedCount() {
//    const selectedCards = document.querySelectorAll(
//       ".card .select-product:checked"
//    );
//    const count = selectedCards.length;

//    selectedCount.textContent = `${count} card${
//       count !== 1 ? "s" : ""
//    } selected`;
//    selectedCount.classList.toggle("show", count > 0);
// }

// Selection features
// function updateSelectedCount() {
//    const selectedProducts = document.querySelectorAll(
//       ".select-product:checked"
//    );
//    showNumberOfProductsSelected.textContent = selectedProducts.length;

//    // Update start mapping button state
//    const startMappingBtn = document.getElementById("startMapping");
//    if (selectedProducts.length > 0) {
//       startMappingBtn.classList.add("active");
//    } else {
//       startMappingBtn.classList.remove("active");
//    }
// }

// // Add event listeners to all checkboxes
// mappingProducts.addEventListener("change", (e) => {
//    if (e.target.classList.contains("select-product")) {
//       updateSelectedCount();
//    }
// });

// Select all products
selectAllProducts.addEventListener("click", () => {
   const checkboxes = document.querySelectorAll(".select-product");
   const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

   checkboxes.forEach((checkbox) => {
      checkbox.checked = !allChecked;
   });

   selectAllProducts.classList.toggle("active", !allChecked);
   selectNameMatchProducts.classList.remove("active");
   // updateSelectedCount();
});

// Select products with matching names
selectNameMatchProducts.addEventListener("click", () => {
   const cards = document.querySelectorAll(".card.product");
   const allMatchingSelected = Array.from(cards)
      .filter((card) => card.classList.contains("glow"))
      .every((card) => card.querySelector(".select-product").checked);

   cards.forEach((card) => {
      if (card.classList.contains("glow")) {
         card.querySelector(".select-product").checked = !allMatchingSelected;
      }
   });

   selectNameMatchProducts.classList.toggle("active", !allMatchingSelected);
   selectAllProducts.classList.remove("active");
   // updateSelectedCount();
});

function showPreviewWindow() {
   previewWindow.classList.add("show");
   updatePreviewProducts();
}

function hidePreviewWindow() {
   previewWindow.classList.remove("show");
}

function updatePreviewProducts() {
   // Clear existing products
   previewProducts.innerHTML = "";

   // Add each selected product
   SELECTED_PRODUCTS_DATA.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "preview-product";
      productElement.dataset.productId = product.id;

      productElement.innerHTML = `
         <div class="product-info">
            <img src="${product.imageUrl}" alt="Product Image" class="product-image">
            <div class="product-details">
               <h3 class="product-title">${product.titles.title}</h3>
               <p class="product-id">ID: ${product.id}</p>
            </div>
         </div>
         <button class="remove-product-btn" data-product-id="${product.id}">
            <i class="icon-trash-2"></i>
         </button>
      `;

      previewProducts.appendChild(productElement);
   });

   // Add event listeners to remove buttons
   const removeButtons = previewProducts.querySelectorAll(
      ".remove-product-btn"
   );
   removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
         const productId = e.currentTarget.dataset.productId;
         removeProductFromSelection(productId);
      });
   });
}

function removeProductFromSelection(productId) {
   // Remove from SELECTED_PRODUCTS_DATA
   SELECTED_PRODUCTS_DATA = SELECTED_PRODUCTS_DATA.filter(
      (product) => product.id !== productId
   );

   // Uncheck the corresponding checkbox in the main list
   const checkbox = document.querySelector(
      `.select-product[data-product-id="${productId}"]`
   );
   if (checkbox) {
      checkbox.checked = false;
   }

   // Update preview window
   updatePreviewProducts();

   // Update selected count
   // updateSelectedCount();

   // If no products left, close preview window
   if (SELECTED_PRODUCTS_DATA.length === 0) {
      hidePreviewWindow();
   }
}

// Event listeners for preview window
closePreview.addEventListener("click", hidePreviewWindow);
cancelPreview.addEventListener("click", hidePreviewWindow);

// Start mapping process
startMapping.addEventListener("click", async () => {
   const selectedProducts = document.querySelectorAll(
      ".select-product:checked"
   );
   if (selectedProducts.length === 0) {
      alert("Please select at least one product to map");
      return;
   }

   // scroll to top 0 default
   previewBody.scrollTo({ top: 0, behavior: "smooth" });

   // Get selected products data
   SELECTED_PRODUCTS_DATA = Array.from(selectedProducts).map((checkbox) => {
      const card = checkbox.closest(".card");
      return SAVED_PRODUCTS.find((p) => p.id === card.id);
   });

   // Show preview window with selected products
   createPreviewContent(SELECTED_PRODUCTS_DATA);
   showPreviewWindow();
});

function createPreviewContent(products) {
   const cards = products
      .map((product) => {
         return `
            <div class="preview-card">
               <img src="${product.imageUrl}" alt="product-image-${product.id}">
               <div class="title">${product.titles.title}</div>
               <div class="price">₹${product.finalPrice.value}</div>
            </div>
         `;
      })
      .join("");

   const confirmSection = document.getElementById("previewConfirmSection");
   previewBody.innerHTML = cards;
   previewBody.appendChild(confirmSection);
}

// Update confirmation button state based on checkbox
// confirmCheck.addEventListener("change", () => {
//    confirmPreview.disabled = !confirmCheck.checked;
// });

function resetPreviewWindow() {
   // confirmCheck.checked = false;
   confirmPreview.disabled = true;
   hidePreviewWindow();
}

// Preview window event listeners
closePreview.addEventListener("click", resetPreviewWindow);
cancelPreview.addEventListener("click", resetPreviewWindow);

// Update preview confirmation click handler
confirmPreview.addEventListener("click", async () => {
   EXTENSION_MAPPING_DATA = await getMappingData();
   hidePreviewWindow();
   showConfirmationWindow();
});

function getMappingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_mapping_request", (r) => {
         resolve(r);
      });
   });
}

function getFkCsrfToken() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_fk_csrf_token", (r) => {
         resolve(r);
      });
   });
}

// Close preview window when clicking outside
previewWindow.addEventListener("click", (e) => {
   if (e.target === previewWindow) {
      resetPreviewWindow();
   }
});

function showConfirmationWindow() {
   confirmationWindow.classList.add("show");
   confirmationInput.value = "";
   confirmationError.textContent = "";
   startMappingFinalStep.disabled = true;

   productName.innerHTML = EXTENSION_MAPPING_DATA?.SKU_NAME;
   productProfit.innerHTML = EXTENSION_MAPPING_DATA?.PROFIT;
   productFixedCost.innerHTML = EXTENSION_MAPPING_DATA?.FIXED_COST;
   productPackingCost.innerHTML = EXTENSION_MAPPING_DATA?.PACKING_COST;
   productNationalDelivery.innerHTML =
      EXTENSION_MAPPING_DATA?.DELIVERY_NATIONAL;
   productManufacturer.innerHTML = EXTENSION_MAPPING_DATA?.MANUFACTURER_DETAILS;
   confirmationInputValue.innerHTML =
      EXTENSION_MAPPING_DATA?.SKU_NAME.toUpperCase().trim();

   confirmationInput.focus();
}

function hideConfirmationWindow() {
   confirmationWindow.classList.remove("show");
   confirmationInput.value = "";
   confirmationError.textContent = "";
}

// Handle confirmation input
confirmationInput.addEventListener("input", () => {
   const value = confirmationInput.value.trim();
   startMappingFinalStep.disabled = value !== EXTENSION_MAPPING_DATA?.SKU_NAME;

   if (value && value !== EXTENSION_MAPPING_DATA?.SKU_NAME) {
      confirmationError.textContent = `Please type "${EXTENSION_MAPPING_DATA?.SKU_NAME}" exactly`;
   } else {
      confirmationError.textContent = "";
   }
});

// Confirmation window event listeners
closeConfirmation.addEventListener("click", hideConfirmationWindow);
cancelConfirmation.addEventListener("click", hideConfirmationWindow);

confirmationWindow.addEventListener("click", (e) => {
   if (e.target === confirmationWindow) {
      hideConfirmationWindow();
   }
});

// Start final mapping process
startMappingFinalStep.addEventListener("click", async () => {
   showLoading();
   hideConfirmationWindow();
   hideLoading();

   createAllSelectedProductMapping();
});

function createAllSelectedProductMapping() {
   showLoading();
   runtimeSendMessage(
      "c_b_create_all_selected_product_mapping",
      {
         products: SELECTED_PRODUCTS_DATA,
         fkCsrfToken: FK_CSRF_TOKEN,
         mappingData: EXTENSION_MAPPING_DATA,
         sellerId: SELLER_ID,
      },
      (response) => {
         hideLoading();

         // Calculate stats
         const total = SELECTED_PRODUCTS_DATA.length;
         const success = response?.bulkResponse?.length || 0;
         const failed = total - success;

         // Update and show success window
         updateSuccessStats(total, success, failed);
         showSuccessWindow();
      }
   );
}

// Show/hide success window
function showSuccessWindow() {
   successWindow.classList.add("show");
}

function hideSuccessWindow() {
   successWindow.classList.remove("show");
}

// Update success window stats
function updateSuccessStats(total, success, failed) {
   totalProductsEl.textContent = total;
   successProductsEl.textContent = success;
   failedProductsEl.textContent = failed;
}

// Map more button click handler
mapMoreBtn.addEventListener("click", () => {
   hideSuccessWindow();
   window.location.reload();
});

// Handle Enter key in confirmation input
confirmationInput.addEventListener("keyup", (e) => {
   if (e.key === "Enter" && !startMappingFinalStep.disabled) {
      startMappingFinalStep.click();
   }
});
