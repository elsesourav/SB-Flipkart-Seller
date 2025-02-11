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

function getMappingPossibleProductData(data) {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_mapping_possible_product_data", data, (r) => {
         resolve(r);
      });
   });
}

runtimeOnMessage("b_c_update_loading_percentage", async ({ percentage }, _, sendResponse) => {
   sendResponse({ status: "ok" });
   updateLoadingProgress(percentage);
});

function createMappingSendRequest() {
   return new Promise((resolve) => {
      runtimeSendMessage(
         "c_b_create_all_selected_product_mapping",
         {
            products: SELECTED_PRODUCTS_DATA,
            fkCsrfToken: FK_CSRF_TOKEN,
            mappingData: EXTENSION_MAPPING_DATA,
            sellerId: SELLER_ID,
         },
         (response) => {
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

function updateLoadingProgress(percent) {
   percent = Math.min(100, Math.max(0, percent)); // Ensure percent is between 0 and 100
   lineProgress.style.width = `${percent}%`;
   progressText.textContent = `${Math.round(percent)}%`;
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
   failedProducts.textContent = failed;
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
      PRODUCTS = await getMappingPossibleProductData(data);
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
         const {
            finalPrice,
            id,
            imageUrl,
            mrp,
            rating,
            titles,
            alreadySelling,
         } = p;
         const classRating = rating.count <= 0 ? "hidden" : "";

         const { highlightedTitle, isFind } = highlightMatches(
            titles.title,
            searchNames
         );
         let className = alreadySelling ? "listed " : " ";
         className += isFind ? "glow" : "";
         const classQuantity =
            titles.subtitle.split(" ")?.[1] !== "per" ? " color" : "";

         return `
         <div class="card product ${className}" id="${id}">
            <input type="checkbox" class="select-product" data-product-id="${id}">
            <div class="show-img">
               <img src="${imageUrl}" alt="product-image-${id}">
            </div>
            <div class="rating ${classRating}">${rating.average}</div>
            <div class="name">${highlightedTitle}</div>
            <div class="quantity${classQuantity}">${titles.subtitle}</div>
            <div class="prices">
               <div class="selling-price">${finalPrice.value}</div>
               <div class="original-price">${mrp.value}</div>
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
      const titleA = a.titles?.newTitle?.toLowerCase();
      const titleB = b.titles?.newTitle?.toLowerCase();

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
      PROFIT,
      FIXED_COST,
      PACKING_COST,
      DELIVERY_NATIONAL,
      MANUFACTURER_DETAILS,
   } = EXTENSION_MAPPING_DATA;

   productName.innerHTML = SKU_NAME;
   productProfit.innerHTML = PROFIT;
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

   DATA.forEach((p) => {
      if (
         SELECTED_PRODUCTS_DATA.filter((e) => e.id === p.productID)?.[0]
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
         const { finalPrice, id, imageUrl, mrp, titles, alreadySelling } = p;
         const className = alreadySelling ? "listed" : "";
         const { highlightedTitle } = highlightMatches(titles.title);
         const classQuantity =
            titles.subtitle.split(" ")?.[1] !== "per" ? " color" : "";

         return `
         <div class="card preview-product ${className}" data-product-id="${id}">
            <div class="show-img"><img src="${imageUrl}" alt="image-${titles.title}"></div>
            <div class="name bright">${highlightedTitle}</div>
            <div class="quantity${classQuantity}">${titles.subtitle}</div>
            <div class="prices">
               <div class="selling-price">${finalPrice.value}</div>
               <div class="original-price">${mrp.value}</div>
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
