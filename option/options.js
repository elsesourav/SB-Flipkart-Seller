// const selectedCount = document.getElementById("selectedCount");

// const confirmCheck = document.getElementById("confirmationInput");

// Confirmation window elements
const startMappingFinalStep = document.getElementById("startFinalMapping");

// Success window elements
const successWindow = document.querySelector(".success-window");
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

rating.addEventListener("input", filterProducts);
matchNames.addEventListener(
   "input",
   debounce(filterProducts, () => 1000)
);


searchSubmit.addEventListener("click", searchSubmitAction);
searchProduct.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      searchSubmitAction();
   }
});

// Select all products
selectAllProducts.addEventListener("click", () => {
   const checkboxes = document.querySelectorAll(".select-product");
   const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

   checkboxes.forEach((checkbox) => {
      checkbox.checked = !allChecked;
   });

   selectAllProducts.classList.toggle("active", !allChecked);
   selectNameMatchProducts.classList.remove("active");
   updateSelectedCount();
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
   updateSelectedCount();
});

// Event listeners for preview window
// closePreview.addEventListener("click", hidePreviewWindow);
// cancelPreview.addEventListener("click", hidePreviewWindow);

// Start mapping process
startMapping.addEventListener("click", async () => {
   const selectedProducts = document.querySelectorAll(
      ".select-product:checked"
   );
   if (selectedProducts.length === 0) {
      alert("Please select at least one product to map");
      return;
   }

   // Get selected products data
   SELECTED_PRODUCTS_DATA = Array.from(selectedProducts).map((checkbox) => {
      const card = checkbox.closest(".card");
      return SAVED_PRODUCTS.find((p) => p.id === card.id);
   });

   // Show preview window with selected products
   createPreviewContent(SELECTED_PRODUCTS_DATA);
   showPreviewWindow();
});

// Update confirmation button state based on checkbox
confirmCheck.addEventListener("change", () => {
   startMappingBtn.disabled = !confirmCheck.checked;
});

// Preview window event listeners
closePreview.addEventListener("click", hidePreviewWindow);
cancelPreview.addEventListener("click", hidePreviewWindow);

// Update preview confirmation click handler
startMappingBtn.addEventListener("click", async () => {
   EXTENSION_MAPPING_DATA = await getMappingData();
   
   hidePreviewWindow();
   showConfirmationWindow();
});

// Close preview window when clicking outside
previewWindow.addEventListener("click", (e) => {
   if (e.target === previewWindow) {
      hidePreviewWindow();
   }
});

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
