function getMappingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_mapping_request", (r) => {
         resolve(r);
      });
   });
}

function getFkCsrfToken() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_seller_info", (r) => {
         resolve(r);
      });
   });
}

function getMappingPossibleProductData(data, listingType, sellerId) {
   return new Promise((resolve) => {
      if (listingType === "new") {
         runtimeSendMessage(
            "c_b_get_new_mapping_product_data",
            { ...data, sellerId },
            (r) => resolve(r)
         );
      } else {
         if (data.productName.length < 3) resolve([]);

         runtimeSendMessage(
            "c_b_get_old_mapping_product_data",
            { ...data, sellerId },
            (r) => resolve(r)
         );
      }
   });
}

async function getAllListingSellerData(fkCsrfToken) {
   if (!(await verifyUserMustLogin())) return;
   return new Promise((resolve) => {
      runtimeSendMessage(
         "c_b_get_all_listing_seller_data",
         { fkCsrfToken },
         (r) => resolve(r)
      );
   });
}

runtimeOnMessage(
   "b_c_loading_progress",
   async ({ percentage, total }, _, sendResponse) => {
      sendResponse({ status: "ok" });
      updateCompleteProgress(percentage, total);
   }
);

runtimeOnMessage(
   "b_c_update_loading_percentage",
   async ({ percentage, color }, _, sendResponse) => {
      sendResponse({ status: "ok" });
      updateLoadingProgress(percentage, color);
   }
);

function createMappingSendRequest(listingType) {
   return new Promise((resolve) => {
      if (listingType == "new") {
         runtimeSendMessage(
            "c_b_create_new_product_mapping",
            {
               products: SELECTED_PRODUCTS_DATA.reverse(),
               fkCsrfToken: FK_CSRF_TOKEN,
               mappingData: EXTENSION_MAPPING_DATA,
               sellerId: SELLER_ID,
            },
            (response = []) => {
               resolve(response);
            }
         );
      } else {
         runtimeSendMessage(
            "c_b_update_old_product_mapping",
            {
               products: SELECTED_PRODUCTS_DATA.reverse(),
               fkCsrfToken: FK_CSRF_TOKEN,
               mappingData: EXTENSION_MAPPING_DATA,
               sellerId: SELLER_ID,
            },
            (response = []) => {
               resolve(response);
            }
         );
      }
   });
}

function showLoading() {
   loadingWindow.classList.add("show");
   resetLoadingProgress();
}

async function hideLoading() {
   await wait(300);
   loadingWindow.classList.remove("show");
   resetLoadingProgress();
}

function updateLoadingProgress(percent, color) {
   percent = Math.min(100, Math.max(0, percent)); // Ensure percent is between 0 and 100
   lineProgress.style.width = `${percent}%`;
   progressText.textContent = `${Math.round(percent)}%`;
   lineProgress.style.backgroundColor = color;
}

function resetLoadingProgress() {
   updateLoadingProgress(0);
}

function showPreviewWindow() {
   previewWindow.classList.add("show");
}

function hidePreviewWindow() {
   previewWindow.classList.remove("show");
   confirmCheck.checked = false;
   startMappingBtn.disabled = true;
}

function showSuccessWindow() {
   successWindow.classList.add("show");
}

function hideSuccessWindow() {
   successWindow.classList.remove("show");
}

function updateCompleteProgress(percent, total) {
   percent = Math.min(100, Math.max(0, percent));
   progressFill.style.width = `${percent}%`;
   const formattedTotal = (Number(total) || 0).toLocaleString();
   progressStatusText.textContent = `Seller Listing Loaded ${formattedTotal}`;
}

function updateSelectedCount() {
   const len = I(".select-product:checked")?.length || 0;
   showNumberOfProductsSelected.textContent = len;
   showSelectedAndReady.classList.toggle("active", len > 0);
}

function updateSuccessStats(total, oldSuccess, newSuccess, failed) {
   totalProducts.textContent = total;
   updateProducts.textContent = oldSuccess;
   newProducts.textContent = newSuccess;
   failedProducts.textContent = Math.max(failed, 0);
}

async function searchSubmitAction() {
   const productName = searchProduct.value;
   if (!productName) return;

   const start = selectPages.selectedstart || 1;
   const end = selectPages.selectedend || 1;

   if (!(await verifyUserMustLogin())) return;
   showLoading();

   const listingData = getDataFromLocalStorage(KEYS.STORAGE_SELLER_LISTING);
   const { listingType } = getDataFromLocalStorage(
      KEYS.STORAGE_OPTION_SETTINGS
   );

   console.log(listingData);
   console.log(listingType);  

   const brandsObj = await getDataFromLocalStorage(KEYS.STORAGE_BRAND_NAME);
   let brands = {
      default: [],
      selectOnly: [],
      selectNot: [],
   };

   for (const key in brandsObj) {
      const { type } = brandsObj[key];
      const tab = BRAND_NAME_TAGS[type];
      brands[tab].push(key.toUpperCase());
   }

   const data = {
      productName,
      startingPage: start,
      endingPage: end,
      brands,
      sellerListing: listingData.data || {},
      fkCsrfToken: FK_CSRF_TOKEN,
   };

   try {
      PRODUCTS = await getMappingPossibleProductData(
         data,
         listingType,
         SELLER_ID
      );

      // console.log(PRODUCTS);

      PRODUCTS = PRODUCTS.sort((a, b) => {
         const priority = { G: 1, PIECE: 2 };
         const categoryOrder =
            (priority[a.CATEGORY] || 3) - (priority[b.CATEGORY] || 3);
         if (categoryOrder === 0) return b.QUANTITY - a.QUANTITY;
         return categoryOrder;
      });

      if (PRODUCTS?.isError) {
         PRODUCTS = [];
         alert("Too many requests");
         return;
      }
      SAVED_PRODUCTS = [...PRODUCTS];
      filterProducts();
   } catch (error) {
      console.log("Error:", error);
   } finally {
      hideLoading();
   }
}

function getHTMLProductCards(ps, searchNames = []) {
   const result = ps
      .map((p) => {
         const {
            imageUrl,
            id,
            rating,
            title,
            CATEGORY,
            QUANTITY,
            mrp,
            finalPrice,
            alreadySelling,
            PRICE,
            PROFIT,
            SIGNAL,
            NATIONAL_PROFIT,
            internal_state,
         } = p;

         const classRating = !rating?.count ? "hidden" : "";
         const { highlightedTitle, isFind } = highlightMatches(
            title,
            searchNames
         );

         const getListingStatus = () => {
            if (alreadySelling && internal_state === "ACTIVE") {
               return "listed";
            }
            if (
               internal_state === "READY_FOR_ACTIVATION" ||
               internal_state === "INACTIVATED_BY_FLIPKART" ||
               internal_state === "INACTIVE" ||
               internal_state === "ARCHIVED"
            ) {
               return "listed hidden";
            }
            return "";
         };

         let className = getListingStatus();
         className += isFind ? " glow" : "";

         const category = CATEGORY?.[0]?.toUpperCase() || "N";

         if (!finalPrice || !mrp) return "";
         return `
         <div class="card product ${className}" id="${id}" style="--c-bg: ${SIGNAL};">
            <input type="checkbox" class="select-product" data-product-id="${id}">
            <i class="sbi-asterisk icon"></i>
            <div class="show-img">
               <img src="${imageUrl}" alt="product-image-${id}">
               <div class="rating ${classRating}">${rating?.average}</div>
               <div class="quantity">${QUANTITY} ${category}</div>
            </div>
            <div class="name">${highlightedTitle}</div>
            <div class="prices">
               <div class="list current">
                  <div class="rs selling-price">${finalPrice}</div>
                  <div class="rs original-price">${mrp}</div>
               </div>
               <div class="list new">
                  <div class="rs price-new">${PRICE}</div>
                  <div class="rs profit">${PROFIT}</div>
                  <div class="rs national-fee">${NATIONAL_PROFIT}</div>
               </div>
            </div>
         </div>`;
      })
      .join("");
   return result;
}

function createProductCard() {
   let searchNames = matchNames?.value?.toLowerCase();

   if (searchNames) {
      const { tag, content } = splitStringByTag(searchNames);
      searchNames = content.split("-").map((n) => n.trim());
   } else {
      searchNames = [];
   }

   // old | new
   const type = I(`input[name="listing-type"]:checked`).value;
   // console.log(PRODUCTS);

   const $PRODUCTS = PRODUCTS.filter((p) =>
      type === "new" ? !p.alreadySelling : p.alreadySelling
   );
   displayChards.innerHTML = getHTMLProductCards($PRODUCTS, searchNames);

   $PRODUCTS.forEach(({ id }) => {
      const checkbox = II(`#${id} > input`, displayChards);
      checkbox.addEventListener("click", () => {
         updateSelectedCount();
      });
   });
}

function highlightMatches(title, searchNames = []) {
   let highlightedTitle = title;
   let isFind = false;

   // First highlight numbers
   const numberRegex = /\d+/g;
   highlightedTitle = highlightedTitle.replace(numberRegex, "<p>$&</p>");

   // Then highlight search terms and set isFind
   if (!searchNames.length) return { highlightedTitle, isFind };

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
   const ratingStart = (selectRating.selectedstart || 1) / 2;
   const ratingEnd = (selectRating.selectedend || 1) / 2;

   const min = Math.min(ratingStart, ratingEnd);
   // const max = Math.max(ratingStart, ratingEnd);
   if (min <= 0.5) return;

   PRODUCTS = PRODUCTS.map((p) => {
      p.r = p?.rating?.average || min;
      return p;
   });
   PRODUCTS = PRODUCTS.filter((p) => p.r >= min).sort((a, b) => b.r - a.r);
}

function splitStringByTag(str) {
   const match = str.match(/(#active|#inactive|#error)\s*(.*)/);
   if (match) {
      return { tag: match[1], content: match[2] };
   }
   return { tag: null, content: str.toLowerCase() };
}

function filterByNames() {
   let searchNames = matchNames?.value?.toLowerCase();
   // if (!searchNames) {
   //    PRODUCTS = [...SAVED_PRODUCTS];
   //    return;
   // }
   const { tag, content } = splitStringByTag(searchNames);
   const names = content.split("-").map((n) => n.trim());

   if (tag) {
      if (tag === "#active") {
         PRODUCTS = PRODUCTS.filter(
            (p) => p.internal_state.toLowerCase() == "active"
         );
      } else if (tag === "#inactive") {
         PRODUCTS = PRODUCTS.filter(
            (p) => p.internal_state.toLowerCase() != "active"
         );
      } else if (tag === "#error") {
         PRODUCTS = PRODUCTS.filter((p) => p?.isError);
      }
   }

   // Sort products: matching names first, non-matching last
   PRODUCTS.sort((a, b) => {
      const titleA = a?.newTitle?.toLowerCase();
      const titleB = b?.newTitle?.toLowerCase();

      // Check if titles match any of the search names
      const matchesA = names.some((name) => titleA?.includes(name));
      const matchesB = names.some((name) => titleB?.includes(name));

      if (matchesA && !matchesB) return -1; // A matches, B doesn't -> A comes first
      if (!matchesA && matchesB) return 1; // B matches, A doesn't -> B comes first
      return 0; // Both match or both don't match -> keep original order
   });
}

function filterProducts() {
   PRODUCTS = [...SAVED_PRODUCTS];

   // Apply filters in sequence
   filterByRating();
   filterByNames();
   createProductCard();
}

async function verifyUserMustLogin() {
   if (!FK_CSRF_TOKEN) {
      const data = await getFkCsrfToken();
      if (data) {
         FK_CSRF_TOKEN = data.csrfToken;
         SELLER_ID = data.sellerId;
      } else {
         alert("You don't login to Flipkart Seller Page, please login first");
         return false;
      }
   }
   return true;
}

function showConfirmationWindow() {
   confirmationWindow.classList.add("show");
   confirmationInput.value = "";
   confirmationError.textContent = "";
   startFinalMapping.disabled = true;

   // console.log(EXTENSION_MAPPING_DATA);

   const {
      PRODUCT_NAME,
      MIN_PROFIT_LZ,
      MAX_PROFIT_LZ,
      MIN_PROFIT_N,
      MAX_PROFIT_N,
      FIXED_COST,
      PACKING_COST,
      MANUFACTURER_DETAILS,
   } = EXTENSION_MAPPING_DATA;

   const NAME = PRODUCT_NAME.toUpperCase().trim();
   const NATIONAL_FEE = `${22 - (MAX_PROFIT_LZ - MAX_PROFIT_N)} <-> ${
      22 - (MIN_PROFIT_LZ - MIN_PROFIT_N)
   }`;
   const PROFIT = `${MIN_PROFIT_LZ}, ${MIN_PROFIT_N} <-> ${MAX_PROFIT_LZ}, ${MAX_PROFIT_N}`;

   productName.innerHTML = NAME;
   productProfit.innerHTML = PROFIT;
   productFixedCost.innerHTML = FIXED_COST;
   productPackingCost.innerHTML = PACKING_COST;
   productNationalDelivery.innerHTML = NATIONAL_FEE;
   productManufacturer.innerHTML = MANUFACTURER_DETAILS;
   confirmationInputValue.innerHTML = NAME;

   confirmationInput.focus();
}

function hideConfirmationWindow() {
   confirmationWindow.classList.remove("show");
   confirmationInput.value = "";
   confirmationError.textContent = "";
}

// need to remove or update
function getOldAndNewProductSize(DATA) {
   const map = new Map();
   for (let i = DATA.length - 1; i >= 0; i--) {
      map.set(DATA[i].productID, DATA[i]);
   }

   DATA = Array.from(map.values());

   DATA.forEach((p) => {
      if (p?.status === "failure") {
         const index = SAVED_PRODUCTS.findIndex((e) => e.id === p.productID);
         const product = index !== -1 ? SAVED_PRODUCTS[index] : null;

         if (product) {
            SAVED_PRODUCTS[index].isError = true;
         }
      }
   });

   const failureData = DATA.filter((p) => p?.status === "failure");
   DATA = DATA?.filter((p) => p?.status !== "failure");

   let oldSize = 0;
   let newSize = 0;

   console.table(failureData);

   DATA.forEach((p) => {
      if (
         SELECTED_PRODUCTS_DATA.filter((e) => e?.id === p.productID)?.[0]
            ?.alreadySelling
      ) {
         oldSize++;
      } else {
         newSize++;
      }
   });
   return { oldSize, newSize };
}

async function createAllSelectedProductMapping() {
   showLoading();
   const { listingType } = getDataFromLocalStorage(
      KEYS.STORAGE_OPTION_SETTINGS
   );
   const response = await createMappingSendRequest(listingType);
   hideLoading();

   const total = SELECTED_PRODUCTS_DATA.length;
   const { oldSize, newSize } = getOldAndNewProductSize(response);

   const failed = total - (oldSize + newSize);
   updateSuccessStats(total, oldSize, newSize, failed);
   showSuccessWindow();
}

function getHTMLPreviewProductCards(ps) {
   return ps
      .map((p) => {
         const {
            imageUrl,
            id,
            title,
            CATEGORY,
            QUANTITY,
            finalPrice,
            mrp,
            alreadySelling,
            PRICE,
            PROFIT,
            SIGNAL,
            NATIONAL_PROFIT,
            internal_state,
         } = p;

         const getListingStatus = () => {
            if (alreadySelling && internal_state === "ACTIVE") {
               return "listed";
            }
            if (
               internal_state === "READY_FOR_ACTIVATION" ||
               internal_state === "INACTIVATED_BY_FLIPKART" ||
               internal_state === "INACTIVE" ||
               internal_state === "ARCHIVED"
            ) {
               return "listed hidden";
            }
            return "";
         };

         const className = getListingStatus();
         const { highlightedTitle } = highlightMatches(title);

         const category = CATEGORY?.[0]?.toUpperCase() || "N";

         if (!finalPrice || !mrp) return "";
         return `
         <div class="card preview-product ${className}" data-product-id="${id}" id="${id}" style="--c-bg: ${SIGNAL};">
            <i class="sbi-asterisk icon"></i>
            <div class="show-img">
               <img src="${imageUrl}" alt="product-image-${id}">
               <div class="quantity">${QUANTITY} ${category}</div>
            </div>
            <div class="name bright">${highlightedTitle}</div>
            <div class="prices">
               <div class="list current">
                  <div class="rs selling-price">${finalPrice}</div>
                  <div class="rs original-price">${mrp}</div>
               </div>
               <div class="list new">
                  <div class="rs price-new">${PRICE}</div>
                  <div class="rs profit">${PROFIT}</div>
                  <div class="rs national-fee">${NATIONAL_PROFIT}</div>
               </div>
            </div>
            <div class="remove-product-btn">
               <i class="sbi-bin"></i>
            </div>
         </div>`;
      })
      .join("");
}

function createPreviewContent(products) {
   const cards = getHTMLPreviewProductCards(products);
   previewProducts.innerHTML = cards;
   previewBody.scrollTop = 0;
   const removeBtns = document.querySelectorAll(".remove-product-btn");

   removeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
         btn.parentElement.classList.add("hide");
         removeProductFromSelection(btn.parentElement.dataset.productId);
      });
   });
}

function removeProductFromSelection(pid) {
   SELECTED_PRODUCTS_DATA = SELECTED_PRODUCTS_DATA.filter((p) => p.id !== pid);
   updateSelectedCount();

   // If no products left, close preview window
   if (SELECTED_PRODUCTS_DATA.length === 0) {
      hidePreviewWindow();
   }
}
