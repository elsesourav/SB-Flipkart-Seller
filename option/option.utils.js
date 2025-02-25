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

function getMappingPossibleProductData(data, sellerId) {
   return new Promise((resolve) => {
      runtimeSendMessage(
         "c_b_get_mapping_product_data",
         { ...data, sellerId },
         (r) => resolve(r)
      );
   });
}

runtimeOnMessage(
   "b_c_update_loading_percentage",
   async ({ percentage, color }, _, sendResponse) => {
      sendResponse({ status: "ok" });
      updateLoadingProgress(percentage, color);
   }
);

function createMappingSendRequest() {
   return new Promise((resolve) => {
      runtimeSendMessage(
         "c_b_create_all_selected_product_mapping",
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

function updateSelectedCount() {
   const len = I(".select-product:checked")?.length || 0;
   showNumberOfProductsSelected.textContent = len;
   startMapping.classList.toggle("active", len > 0);
}

showNewMappingProducts.addEventListener("change", (e) => {
   if (e.target.classList.contains("select-product")) {
      updateSelectedCount();
   }
});
showOldMappingProducts.addEventListener("change", (e) => {
   if (e.target.classList.contains("select-product")) {
      updateSelectedCount();
   }
});

showMyProducts.addEventListener("change", (e) => {
   createProductCard();
});

function updateSuccessStats(total, oldSuccess, newSuccess, failed) {
   totalProducts.textContent = total;
   updateProducts.textContent = oldSuccess;
   newProducts.textContent = newSuccess;
   failedProducts.textContent = Math.max(failed, 0);
}

async function searchSubmitAction() {
   const productName = searchProduct.value;
   if (!productName) return;

   const startingPage = N(startPage.value) || 1;
   const endingPage = N(endPage.value) || 1;

   const min = Math.min(startingPage, endingPage);
   const max = Math.max(startingPage, endingPage);

   if (!(await verifyUserMustLogin())) return;
   showLoading();

   const data = {
      productName,
      startingPage: min,
      endingPage: max,
      sellerId: SELLER_ID,
      fkCsrfToken: FK_CSRF_TOKEN,
   };

   try {
      PRODUCTS = await getMappingPossibleProductData(data, SELLER_ID);

      console.table(PRODUCTS);

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
   return ps
      .map((p) => {
         const { imageUrl, id, rating, title, subTitle, mrp, finalPrice, alreadySelling, PRICE, PROFIT, SIGNAL, NATIONAL_FEE, internal_state } = p;

         const classRating = !rating?.count ? "hidden" : "";
         const { highlightedTitle, isFind } = highlightMatches(title, searchNames);

         const getListingStatus = () => {
            if (alreadySelling && internal_state === "ACTIVE") {
               return "listed";
            }
            if (
               internal_state === "INACTIVE" ||
               internal_state === "ARCHIVED"
            ) {
               return "listed hidden";
            }
            return "";
         };

         let className = getListingStatus();
         className += isFind ? " glow" : "";

         const classQuantity = subTitle.split(" ")?.[1] !== "per" ? " color" : "";

         if (!finalPrice || !mrp) return "";
         return `
         <div class="card product ${className}" id="${id}">
            <input type="checkbox" class="select-product" data-product-id="${id}">
            <div class="show-img">
               <img src="${imageUrl}" alt="product-image-${id}">
            </div>
            <div class="rating ${classRating}">${rating?.average}</div>
            <div class="name">${highlightedTitle}</div>
            <div class="quantity-signal">
               <div class="quantity${classQuantity}">${subTitle}</div>
               <div class="signal" style="--s-color: ${SIGNAL};"></div>
            </div>
            <div class="prices">
               <div class="list current">
                  <div class="rs selling-price">${finalPrice}</div>
                  <div class="rs original-price">${mrp}</div>
               </div>
               <div class="list new">
                  <div class="rs price-new">${PRICE}</div>
                  <div class="rs profit">${PROFIT}</div>
                  <div class="rs national-fee">${NATIONAL_FEE}</div>
               </div>
            </div>
         </div>`;
      })
      .join("");
}

function createProductCard() {
   const searchNames = matchNames.value
      ? matchNames.value
           .toLowerCase()
           .split("-")
           .map((n) => n.trim())
      : [];

   showNewMappingProducts.innerHTML = getHTMLProductCards(
      PRODUCTS.filter((p) => !p.alreadySelling),
      searchNames
   );

   if (showMyProducts.checked) {
      showOldMappingProducts.innerHTML = getHTMLProductCards(
         PRODUCTS.filter((p) => p.alreadySelling),
         searchNames
      );
   } else {
      showOldMappingProducts.innerHTML = "";
   }
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
   const ratingValue = rating.value;
   if (ratingValue === "0") {
      // PRODUCTS = [...SAVED_PRODUCTS];
      return;
   }

   // Start with current filtered products
   PRODUCTS = PRODUCTS.sort(
      (a, b) => b?.rating?.average - a?.rating?.average
   ).filter((x) => x?.rating?.count <= 0 || x?.rating?.average >= ratingValue);
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

   const {
      SKU_NAME,
      MIN_PROFIT,
      MAX_PROFIT,
      FIXED_COST,
      PACKING_COST,
      DELIVERY_NATIONAL,
      MANUFACTURER_DETAILS,
   } = EXTENSION_MAPPING_DATA;

   productName.innerHTML = SKU_NAME;
   productProfit.innerHTML = `${MIN_PROFIT} <-> ${MAX_PROFIT}`;
   productFixedCost.innerHTML = FIXED_COST;
   productPackingCost.innerHTML = PACKING_COST;
   productNationalDelivery.innerHTML = DELIVERY_NATIONAL;
   productManufacturer.innerHTML = MANUFACTURER_DETAILS;
   confirmationInputValue.innerHTML = SKU_NAME.toUpperCase().trim();

   confirmationInput.focus();
}

function hideConfirmationWindow() {
   confirmationWindow.classList.remove("show");
   confirmationInput.value = "";
   confirmationError.textContent = "";
}

function getOldAndNewProductSize(DATA) {
   DATA = DATA?.filter((p) => p?.status !== "failure");
   let oldSize = 0;
   let newSize = 0;

   const failureData = DATA.filter((p) => p?.status === "failure");

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
   const response = await createMappingSendRequest();
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
            id, title, subTitle, finalPrice, mrp,
            alreadySelling,
            PRICE,
            PROFIT,
            SIGNAL,
            NATIONAL_FEE,
            internal_state,
         } = p;

         const getListingStatus = () => {
            if (alreadySelling && internal_state === "ACTIVE") {
               return "listed";
            }
            if (
               internal_state === "INACTIVE" ||
               internal_state === "ARCHIVED"
            ) {
               return "listed hidden";
            }
            return "";
         };

         const className = getListingStatus();
         const { highlightedTitle } = highlightMatches(title);
         const classQuantity = subTitle.split(" ")?.[1] !== "per" ? " color" : "";

         if (!finalPrice || !mrp) return "";

         return `
         <div class="card preview-product ${className}" data-product-id="${id}">
            <div class="show-img"><img src="${imageUrl}" alt="image-${title}"></div>
            <div class="name bright">${highlightedTitle}</div>
            <div class="quantity-signal">
               <div class="quantity${classQuantity}">${subTitle}</div>
               <div class="signal" style="--s-color: ${SIGNAL};"></div>
            </div>
            <div class="prices">
               <div class="list current">
                  <div class="rs selling-price">${finalPrice}</div>
                  <div class="rs original-price">${mrp}</div>
               </div>
               <div class="list new">
                  <div class="rs price-new">${PRICE}</div>
                  <div class="rs profit">${PROFIT}</div>
                  <div class="rs national-fee">${NATIONAL_FEE}</div>
               </div>
            </div>
            <div class="remove-product-btn">
                  <i class="sbi-bin"></i>
               </div>
         </div> 
      `;
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
