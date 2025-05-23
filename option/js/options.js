let SELLER_LISTING_DATA = {};
let SAVED_PRODUCTS = [];
let PRODUCTS = [];
let PRODUCTS_PAGES = [];
let SELECTED_PRODUCTS = [];

let SELECTED_PRODUCTS_DATA = [];
let EXTENSION_MAPPING_DATA = null;
let FK_CSRF_TOKEN = null;
let SELLER_ID = null;
let ALL_BRAND_NAMES = {};
let OPTIONS_SETTINGS = {};
let BRAND_NAME_TAGS = ["default", "selectOnly", "selectNot"];


// Pagination
const pagesElement = document.getElementById("_pages_");

let MAX_PAGE_RENDER = 100;
const MAX_PAGE_BUTTON = 5;
let currentPageIndex = 0;
let maxPagePossible = 0;
const PAGES = new Pages(
   MAX_PAGE_BUTTON,
   pagesElement,
   pageClickAction,
   pageClickAction
);
PAGES.update(maxPagePossible, currentPageIndex);

selectTotalDisplay.addEventListener("change", (e) => {
   MAX_PAGE_RENDER = +e.target.value;
   removeSelectAll();
   currentPageIndex = 0;
   filterAndCreateProductCards();
});

function pageClickAction(current) {
   if (current === currentPageIndex) return;
   currentPageIndex = current;
   setPagesAndCreateProductCards(current);
   removeSelectAll(); // remove all selected products
}

onload = async () => {
   SELLER_LISTING_DATA = await chromeStorageGetLocal(
      KEYS.STORAGE_SELLER_LISTING
   );

   if (SELLER_LISTING_DATA) {
      const { count } = SELLER_LISTING_DATA;
      updateCompleteProgress(100, count);
   } else {
      updateCompleteProgress(100, 0);
   }

   OPTIONS_SETTINGS = await chromeStorageGetLocal(KEYS.STORAGE_OPTION_SETTINGS);

   if (OPTIONS_SETTINGS) {
      const { listingType, ratingSelected, pageSelected } = OPTIONS_SETTINGS;

      I(`input[name="listing-type"][value="${listingType}"]`)[0].checked = true;
      selectRating.setAttribute("selectedstart", ratingSelected.start);
      selectRating.setAttribute("selectedend", ratingSelected.end);
      selectPages.setAttribute("selectedstart", pageSelected.start);
      selectPages.setAttribute("selectedend", pageSelected.end);
   }

   if (!FK_CSRF_TOKEN) {
      const data = await getFkCsrfToken();
      if (data) {
         FK_CSRF_TOKEN = data.csrfToken;
         SELLER_ID = data.sellerId;
      }
   }
};

// rating.addEventListener(
//    "change",
//    debounce(filterAndCreateProductCards, () => 1000)
// );

I(`input[name="listing-type"]`).on("change", saveOptionSettings);
selectRating.addEventListener(
   "selectionchange",
   debounce(__callBack__, () => 1000)
);
function __callBack__() {
   saveOptionSettings();
   filterAndCreateProductCards();
}
selectPages.addEventListener("selectionchange", () => {
   saveOptionSettings();
});

matchNames.addEventListener(
   "input",
   debounce(filterAndCreateProductCards, () => 1000)
);
searchSubmit.addEventListener("click", searchSubmitAction);
searchProduct.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      searchSubmitAction();
   }
});

function removeSelectAll() {
   selectAllProducts.classList.remove("active");
   selectNameMatchProducts.classList.remove("active");
   updateSelectedCount();
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
   const NAME = EXTENSION_MAPPING_DATA?.PRODUCT_NAME?.toUpperCase()?.trim();
   startFinalMapping.disabled = value !== NAME;

   if (value && value !== NAME) {
      confirmationError.textContent = `Please type "${NAME}" exactly`;
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
      chromeStorageSetLocal(KEYS.STORAGE_SELLER_LISTING, data);
   }
});

async function setupBrandNames() {
   brandNameContainer.innerHTML = "";
   await loadBrandNames();

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
         const type = (ALL_BRAND_NAMES[name].type + 1) % 3;
         ALL_BRAND_NAMES[name].type = type;
         saveBrandNames();
         brandElement.classList = [];
         brandElement.classList.add("brand-tag", BRAND_NAME_TAGS[type]);
      });

      deleteBtn.addEventListener("click", async (e) => {
         e.stopPropagation();
         delete ALL_BRAND_NAMES[name];
         saveBrandNames();
         await setupBrandNames();
      });
   }
}
setupBrandNames();

addBrandName.addEventListener("click", async () => {
   const brandName = brandNameInput.value.toUpperCase();
   console.log(brandName);

   if (brandName == "" || brandName.length <= 2) {
      alert("Please enter a valid brand name");
      return;
   }

   for (const name in ALL_BRAND_NAMES) {
      if (name == brandName) {
         alert("Brand name already exists");
         return;
      }
   }

   ALL_BRAND_NAMES[brandName] = { type: 0 };
   saveBrandNames();
   await setupBrandNames();
});

function saveBrandNames() {
   chromeStorageSetLocal(KEYS.STORAGE_BRAND_NAME, ALL_BRAND_NAMES);
}

function saveOptionSettings() {
   const listingType = I(`input[name="listing-type"]:checked`).value;
   OPTIONS_SETTINGS = {
      listingType,
      ratingSelected: {
         start: selectRating.selectedstart,
         end: selectRating.selectedend,
      },
      pageSelected: {
         start: selectPages.selectedstart,
         end: selectPages.selectedend,
      },
   };
   chromeStorageSetLocal(KEYS.STORAGE_OPTION_SETTINGS, OPTIONS_SETTINGS);
}

async function loadBrandNames() {
   ALL_BRAND_NAMES =
      (await chromeStorageGetLocal(KEYS.STORAGE_BRAND_NAME)) || {};
}
