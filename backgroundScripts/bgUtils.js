const createNewTab = (url) => {
   return new Promise((resolve) => {
      chrome.tabs.create({ url: url }, (tab) => resolve(tab.id));
   });
};
const createNewHiddenTab = (url) => {
   return new Promise((resolve) => {
      chrome.tabs.create({ url: url, active: false }, (tab) => resolve(tab.id));
   });
};

const createTabAndWaitForLoad = (url, hidden = false) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.create({ url, active: !hidden }, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
         }

         const listener = (tabId, changeInfo) => {
            if (tabId === tab.id && changeInfo.status === "complete") {
               // Remove the listener once the tab has finished loading
               chrome.tabs.onUpdated.removeListener(listener);
               resolve(tab.id);
            }
         };

         chrome.tabs.onUpdated.addListener(listener);
      });
   });
};

const closeTab = (tabId) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabId, () => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
         } else {
            resolve();
         }
      });
   });
};

const getCurrentTab = () => {
   return new Promise((resolve) => {
      chrome.tabs.query({ active: true }, (tabs) => {
         resolve(tabs[0]);
      });
   });
};

const getTab = (tabId) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError.message);
         } else {
            resolve(tab);
         }
      });
   });
};

const getAllTabId = () => {
   return new Promise(async (resolve) => {
      const tabs = await chrome.tabs.query({});
      resolve(tabs.map((e) => e.id));
   });
};

const updateTab = (tabId, newUrl) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { url: newUrl }, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
         } else {
            resolve(tab);
         }
      });
   });
};

const updateAndReloadTab = (tabId, newUrl) => {
   return new Promise((resolve, reject) => {
      // Update the tab's URL
      chrome.tabs.update(tabId, { url: newUrl }, (updatedTab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError); // Handle any errors
            return;
         }

         // Listen for the page to finish loading
         const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
               // Remove listener once the tab is fully loaded
               chrome.tabs.onUpdated.removeListener(listener);

               // Reload the tab
               chrome.tabs.reload(tabId, () => {
                  if (chrome.runtime.lastError) {
                     reject(chrome.runtime.lastError); // Handle reload errors
                  } else {
                     resolve(updatedTab); // Successfully updated and reloaded
                  }
               });
            }
         };

         chrome.tabs.onUpdated.addListener(listener);
      });
   });
};

const __create_new_listing__ = (quantity, count, thumbnailIndex) => {
   if (listing_run) {
      chromeStorageGetLocal(storageListingKey, async (val) => {
         if (!val) val = {};
         val.QUANTITY = quantity;
         val.COUNT = count;
         val.THUMBNAIL_INDEX = thumbnailIndex;
         chromeStorageSetLocal(storageListingKey, val);

         await updateTab(currentTabId, URLS.newListing);
         tabSendMessage(currentTabId, "b_c_create_single_listing", (r) => {
            console.log(r);
         });
      });
   }
};

function getImageFilesFromLocalStorage() {
   return new Promise(async (resolve) => {
      const { THUMBNAIL_INDEX } = await chromeStorageGetLocal(
         storageListingKey
      );
      const DATA = await chromeStorageGetLocal(`storage-images-0`);
      const firstImg = DATA?.files[THUMBNAIL_INDEX];
      const images = [];
      if (firstImg) images.push(firstImg);

      for (let i = 1; i < 4; i++) {
         const DATA = await chromeStorageGetLocal(`storage-images-${i}`);
         const img = selectRandomImage(DATA?.files || []);
         if (img) images.push(img);
      }
      resolve(images);
   });
}

function verifyProduct(sku, sellerId) {
   return new Promise(async (resolve) => {
      try {
         // Search for product details
         const searchResult = await searchProduct(sku, sellerId);
         const productInfo = searchResult?.result?.productList?.[0];

         if (!productInfo) {
            resolve({ isError: false, is: false, error: "Product not found" });
         }

         const { detail, alreadySelling, vertical, imagePaths } = productInfo;
         const imageUrl = Object.values(imagePaths)?.[0];

         // If already selling, no need to check further
         if (alreadySelling) {
            resolve({ isError: false, error: "Already selling" });
         }

         // Check approval status
         const result = await checkApprovalStatus(
            vertical,
            detail.Brand,
            sellerId
         );
         
         if (result?.isError) {
            resolve({ isError: true });
         }

         resolve({
            isError: false,
            is: result?.result,
            imageUrl: result?.result ? imageUrl : null,
            error: result?.result ? null : "Not approved",
         });
      } catch (error) {
         resolve({ isError: false, error: error.message });
         console.log("Error verifying product:", error);
      }
   });
}

function getMixDataToNewMappingData(DATA) {
   const { products, fkCsrfToken, mappingData: MD, sellerId } = DATA;

   const SKU_NAME = MD?.SKU_NAME;
   const PROFIT = N(MD?.PROFIT || 15);
   const PACKING_COST = N(MD?.PACKING_COST || 3);
   const FIXED_COST = N(MD?.FIXED_COST || 72);
   const LISTING_STATUS = MD?.LISTING_STATUS || "ACTIVE";
   const PROCUREMENT_TYPE = MD?.PROCUREMENT_TYPE || "EXPRESS";
   const SHIPPING_DAYS = MD?.SHIPPING_DAYS || 1;
   const STOCK_SIZE = MD?.STOCK_SIZE || 1000;
   const HSN = MD?.HSN || "1209";
   const MINIMUM_ORDER_QUANTITY = MD?.MINIMUM_ORDER_QUANTITY || 1;
   const MANUFACTURER_DETAILS = MD?.MANUFACTURER_DETAILS || "PuravEnterprise";
   const PACKER_DETAILS = MD?.PACKER_DETAILS || "PuravEnterprise";
   const EARLIEST_MFG_DATE = dateToMilliseconds(
      MD?.EARLIEST_MFG_DATE || "2025-01-01"
   );
   const SHELF_LIFE = getSecondsForMonths(N(MD?.SHELF_LIFE || 22)); // in months
   const PACKAGING_LENGTH = MD?.PACKAGING_LENGTH || 21;
   const PACKAGING_BREADTH = MD?.PACKAGING_BREADTH || 17;
   const PACKAGING_HEIGHT = MD?.PACKAGING_HEIGHT || 3;

   let DL = N(MD?.DELIVERY_LOCAL || 0);
   let DN = N(MD?.DELIVERY_NATIONAL || 0);
   let DZ = N(MD?.DELIVERY_ZONAL || 19);
   const DELIVERY_CHARGE_MIN = Math.min(DL, DN, DZ);

   if (!MD?.IS_INCLUDED) {
      DL -= DELIVERY_CHARGE_MIN;
      DN -= DELIVERY_CHARGE_MIN;
      DZ -= DELIVERY_CHARGE_MIN;
   }

   const newData = products.map((product, i) => {
      const { id, mrp, titles: t } = product;
      const { sku, quantity, type } = getSkuIDWithData(SKU_NAME, t.subtitle, i);
      let _DL = DL;
      let _DN = DN;
      let _DZ = DZ;

      const TOTAL_WEIGHT = getTotalWeight(MD, quantity, type);
      const PRODUCT_COST = getProductCost(MD, quantity, type);
      const UNIT_TO_PIECE = getUnitToPiece(MD, quantity, type);
      const INCREMENT_AMOUNT = getIncrementAmount(MD, UNIT_TO_PIECE);
      const TOTAL = PROFIT + PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT; // SRCELEMENT AMOUNT
      let SELLING_PRICE = calculateProductPrice(FIXED_COST, TOTAL);

      if (MD?.IS_INCLUDED) SELLING_PRICE -= DELIVERY_CHARGE_MIN;
      const PERCENTAGE_90 = Math.ceil(mrp.value * 0.1);
      const DELTA_PRICE = PERCENTAGE_90 - SELLING_PRICE;

      if (SELLING_PRICE < PERCENTAGE_90) {
         SELLING_PRICE = PERCENTAGE_90;
         _DL = Math.max(_DL - DELTA_PRICE, 0);
         _DN = Math.max(_DN - DELTA_PRICE, 0);
         _DZ = Math.max(_DZ - DELTA_PRICE, 0);
      }

      return {
         ID: id,
         SKU: sku,
         SELLING_PRICE,
         MRP: mrp.value,
         LISTING_STATUS,
         PROCUREMENT_TYPE,
         SHIPPING_DAYS,
         STOCK_SIZE,
         HSN,
         MINIMUM_ORDER_QUANTITY,
         DELIVERY_LOCAL: _DL,
         DELIVERY_NATIONAL: _DN,
         DELIVERY_ZONAL: _DZ,
         EARLIEST_MFG_DATE,
         SHELF_LIFE,
         MANUFACTURER_DETAILS,
         PACKER_DETAILS,

         TOTAL_WEIGHT,
         PACKAGING_LENGTH,
         PACKAGING_BREADTH,
         PACKAGING_HEIGHT,
      };
   });

   return { SELLER_ID: sellerId, FK_CSRF_TOKEN: fkCsrfToken, PRODUCTS: newData };
}

function getTotalWeight(data, quantity, value) {
   return (
      N(data?.PACKET_WEIGHT || 1) +
      (value === "PIECE"
         ? (N(data?.UNIT_WEIGHT || 1) / N(data?.UNIT || 1)) * N(quantity)
         : N(quantity) / (value === "G" ? 1000 : 1))
   ).toFixed(3);
}

function calculateProductPrice(fixedCost, desiredProfit) {
   const commissionRate = [0.14, 0.16, 0.18];
   const isRound = true;
   const tax = 1.18; // 18% tax

   // Using mathematical formula to calculate price directly
   // P = (desiredProfit + (fixedCost * tax)) / (1 - (commissionRate * tax))
   let price;

   // Try with 14% commission rate first (for price <= 300)
   price = (desiredProfit + fixedCost * tax) / (1 - commissionRate[0] * tax);

   if (price > 300) {
      // Try with 16% commission rate (for price <= 500)
      price = (desiredProfit + fixedCost * tax) / (1 - commissionRate[1] * tax);

      if (price > 500) {
         // Use 18% commission rate
         price =
            (desiredProfit + fixedCost * tax) / (1 - commissionRate[2] * tax);
      }
   }

   const PP = Math.round(price * 100) / 100;
   return isRound ? Math.round(PP) : PP;
}

function getIncrementAmount(data, UNIT_TO_PIECE) {
   return N(data?.INCREMENT_UNIT || 0) === 0
      ? 0
      : parseInt(UNIT_TO_PIECE / N(data?.INCREMENT_UNIT || 100));
}

function getUnitToPiece(data, quantity, type) {
   if (type == "PIECE") {
      return quantity;
   } else {
      const W = N(data?.UNIT || 1) / (N(data?.UNIT_WEIGHT || 1) * 1000);
      return W * quantity * (type === "KG" ? 1000 : 1);
   }
}

function getProductCost(data, quantity, type) {
   return type === "PIECE"
      ? (N(data?.UNIT_OF_COST || 200) / N(data?.UNIT || 1)) * N(quantity)
      : (N(data?.UNIT_OF_COST || 200) / N(data?.UNIT_WEIGHT || 1)) *
           (N(quantity) / (type === "KG" ? 1 : 1000));
}

function getSkuIDWithData(name, subtitle, i) {
   const [q, t] = subtitle.toUpperCase().split(" ");
   const quantity = N(q);
   const type = t === "PER" ? "PIECE" : t;
   const unique = getIdByCurrentTime(i);
   const sku = `${name}__${quantity}__${type}__${unique}`;
   return { sku, quantity, type };
}

function getIdByCurrentTime(i = 0) {
   return parseInt(parseInt(Date.now().toString().slice(7)) + i).toString(36).toUpperCase();
}
