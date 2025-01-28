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

function getMappingPossibleProductData(data) {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_mapping_possible_product_data", data, (r) => {
         resolve(r);
      });
   });
}

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
}

function hideLoading() {
   loadingWindow.classList.remove("show");
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

showPossibleMappingProducts.addEventListener("change", (e) => {
   if (e.target.classList.contains("select-product")) {
      updateSelectedCount();
   }
});

function updateSuccessStats(total, success, failed) {
   totalProductsEl.textContent = total;
   successProductsEl.textContent = success;
   failedProductsEl.textContent = failed;
}

async function searchSubmitAction() {
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
      console.log("Error:", error);
   } finally {
      hideLoading();
   }
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
   showPossibleMappingProducts.innerHTML = htmlStr;
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
   PRODUCTS = [...SAVED_PRODUCTS];

   // Apply filters in sequence
   filterByRating();
   filterByNames();
   createProductCard();
}

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

function showConfirmationWindow() {
   confirmationWindow.classList.add("show");
   confirmationInput.value = "";
   confirmationError.textContent = "";
   startMappingFinalStep.disabled = true;

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

async function createAllSelectedProductMapping() {
   showLoading();
   const response = await createMappingSendRequest();
   hideLoading();

   const total = SELECTED_PRODUCTS_DATA.length;
   const success = response?.bulkResponse?.length || 0;
   const failed = total - success;
   updateSuccessStats(total, success, failed);
   showSuccessWindow();
}

function createPreviewContent(products) {
   const cards = products
      .map((product) => {
         return `
            <div class="card preview-product" data-product-id="${product.id}">
               <div class="show-img"><img src="${product.imageUrl}" alt="image-${product.titles.title}"></div>
               <div class="name bright">${product.titles.title}</div>
               <div class="quantity">${product.titles.subtitle}</div>
               <div class="prices">
                  <div class="selling-price">${product.finalPrice.value}</div>
                  <div class="original-price">${product.mrp.value}</div>
               </div>
               <div class="remove-product-btn">
                  <i class="sbi-bin"></i>
               </div>
            </div> 
         `;
      })
      .join("");
   previewProducts.innerHTML = cards;
   previewBody.scrollTop = 0;
   const removeBtns = document.querySelectorAll(".remove-product-btn");

   removeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
         btn.parentElement.classList.add("hide");
      });
   });
}

function removeProductFromSelection(productId) {
   // Remove from SELECTED_PRODUCTS_DATA
   SELECTED_PRODUCTS_DATA = SELECTED_PRODUCTS_DATA.filter(
      (product) => product.id !== productId
   );

   // Uncheck the corresponding checkbox in the main list
   // const checkbox = document.querySelector(
   //    `.preview-product[data-product-id="${productId}"]`
   // );
   // checkbox?.classList?.add("hide");

   // Update selected count
   updateSelectedCount();

   // If no products left, close preview window
   if (SELECTED_PRODUCTS_DATA.length === 0) {
      hidePreviewWindow();
   }
}
