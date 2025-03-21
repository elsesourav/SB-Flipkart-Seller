let SELLER_LISTING_DATA = {};
let SAVED_PRODUCTS = [];
let PRODUCTS = [];
let SELECTED_PRODUCTS = [];

let SELECTED_PRODUCTS_DATA = [];
let EXTENSION_MAPPING_DATA = null;
let FK_CSRF_TOKEN = null;
let SELLER_ID = null;
let ALL_BRAND_NAMES = {};
let BRAND_NAME_TAGS = ["default", "select", "select-only", "select-not"];


(async () => {
   SELLER_LISTING_DATA = getDataFromLocalStorage(KEYS.STORAGE_SELLER_LISTING);

   if (SELLER_LISTING_DATA) {
      const { count } = SELLER_LISTING_DATA;
      updateCompleteProgress(100, count);
   } else {
      updateCompleteProgress(100, 0);
   }

   
   if (!FK_CSRF_TOKEN) {
      const data = await getFkCsrfToken();
      if (data) {
         FK_CSRF_TOKEN = data.csrfToken;
         SELLER_ID = data.sellerId;
      }
   }
})();

// rating.addEventListener(
//    "change",
//    debounce(filterProducts, () => 1000)
// );

selectRating.addEventListener("selectionchange", debounce(filterProducts, () => 1000));
matchNames.addEventListener("input", debounce(filterProducts, () => 1000));
searchSubmit.addEventListener("click", searchSubmitAction);
searchProduct.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      searchSubmitAction();
   }
});

function removeSelectAll() {
   selectAllProducts.classList.remove("active");
   selectNameMatchProducts.classList.remove("active");
}

function selectProducts(element, parent = document) {
   const checkboxes = parent.querySelectorAll(".select-product");
   const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

   checkboxes.forEach((checkbox) => {
      checkbox.checked = !allChecked;
   });

   removeSelectAll();
   element.classList.toggle("active", !allChecked);
   updateSelectedCount();
}

// Select all products
selectAllProducts.addEventListener("click", () => {
   selectProducts(selectAllProducts);
});

// Select all unmapped products
// selectAllUnMappedProducts.addEventListener("click", () => {
//    selectProducts(selectAllUnMappedProducts, showNewMappingProducts);
// })

// Select all mapped products
// selectAllMappedProducts.addEventListener("click", () => {
//    selectProducts(selectAllMappedProducts, showOldMappingProducts);
// })

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

   removeSelectAll();
   selectNameMatchProducts.classList.toggle("active", !allMatchingSelected);
   updateSelectedCount();
});

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
   startFinalMapping.disabled = value !== EXTENSION_MAPPING_DATA?.SKU_NAME;

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
startFinalMapping.addEventListener("click", async () => {
   showLoading();
   hideConfirmationWindow();
   createAllSelectedProductMapping();
});

// Map more button click handler
mapMoreBtn.addEventListener("click", () => {
   hideSuccessWindow();
   window.location.reload();
});
closeSuccess.addEventListener("click", () => {
   hideSuccessWindow();
});

// Handle Enter key in confirmation input
confirmationInput.addEventListener("keyup", (e) => {
   if (e.key === "Enter" && !startFinalMapping.disabled) {
      startFinalMapping.click();
   }
});

function toggleSection(header, cardsSection) {
   header.classList.toggle("collapsed");
   cardsSection.classList.toggle("collapsed");
}

// newMappingHeader.addEventListener("click", () =>
//    toggleSection(newMappingHeader, showNewMappingProducts)
// );
// oldMappingHeader.addEventListener("click", () =>
//    toggleSection(oldMappingHeader, showOldMappingProducts)
// );



refreshButton.addEventListener("click", async () => {
   const data = await getAllListingSellerData(FK_CSRF_TOKEN);
   if (data) {
      setDataFromLocalStorage(KEYS.STORAGE_SELLER_LISTING, data)
   }
})

function setupBrandNames() {
   brandNameContainer.innerHTML = "";
   loadBrandNames();

   for (const name in ALL_BRAND_NAMES) {
      const type = ALL_BRAND_NAMES[name].type;
      const brandElement = document.createElement("div");
      const p = document.createElement("p");
      const deleteBtn = document.createElement("i");

      brandElement.classList.add("brand-tag", BRAND_NAME_TAGS[type]);
      p.textContent = name;
      deleteBtn.classList.add("sbi-delete");

      brandElement.append(p, deleteBtn);
      brandNameContainer.append(brandElement);

      brandElement.addEventListener("click", () => {
         const type = (ALL_BRAND_NAMES[name].type + 1) % 4;
         ALL_BRAND_NAMES[name].type = type;
         saveBrandNames();
         brandElement.classList = [];
         brandElement.classList.add("brand-tag", BRAND_NAME_TAGS[type]);
      });

      deleteBtn.addEventListener("click", (e) => {
         e.stopPropagation();
         delete ALL_BRAND_NAMES[name];
         saveBrandNames();
         setupBrandNames();
      });
   }
}
setupBrandNames();

addBrandName.addEventListener("click", () => {
   const brandName = brandNameInput.value.toUpperCase();
   console.log(brandName);
   
   if(brandName == "" || brandName.length <= 2) {
      alert("Please enter a valid brand name");
      return;
   }

   for (const name in ALL_BRAND_NAMES) {
      if(name == brandName) {
         alert("Brand name already exists");
         return;
      }
   }

   ALL_BRAND_NAMES[brandName] = { type: 0 }
   saveBrandNames();
   setupBrandNames();
});

function saveBrandNames() {
   setDataFromLocalStorage(KEYS.STORAGE_BRAND_NAME, ALL_BRAND_NAMES)
}

function loadBrandNames() {
   ALL_BRAND_NAMES = getDataFromLocalStorage(KEYS.STORAGE_BRAND_NAME) || {};
}




