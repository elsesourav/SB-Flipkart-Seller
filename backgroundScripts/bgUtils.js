let optionsTabId;

function sendLoadingProgress(percentage, total) {
   if (!optionsTabId) return;
   tabSendMessage(optionsTabId, "b_c_loading_progress", { percentage, total });
}
function sendUpdateLoadingPercentage(percentage, color = "white") {
   if (!optionsTabId) return;
   tabSendMessage(optionsTabId, "b_c_update_loading_percentage", {
      percentage,
      color,
   });
}

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
      chromeStorageGetLocal(KEYS.STORAGE_LISTING, async (val) => {
         if (!val) val = {};
         val.QUANTITY = quantity;
         val.COUNT = count;
         val.THUMBNAIL_INDEX = thumbnailIndex;
         chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);

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
         KEYS.STORAGE_LISTING
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
   return parseInt(parseInt(Date.now().toString().slice(7)) + i)
      .toString(36)
      .toUpperCase();
}

function subTitleToQuantityAndType(subtitle) {
   const [q, t] = subtitle?.toUpperCase()?.split(" ");
   const quantity = N(q);
   const type = t === "PER" ? "PIECE" : t;
   return { quantity, type };
}

// function getOptimizedPrice(MIN_PRICE, MRP, COST, MIN_PROFIT, MAX_PROFIT, fixedCost = 71) {
//    const price90 = MRP * 0.1;
//    let targetPrice = Math.max(MIN_PRICE - 1, price90);
//    targetPrice = Math.min(targetPrice, MRP - 1);

//    // Calculate profit for the target price
//    const profit = getProfitUsingBankSettlement({
//       price: targetPrice,
//       cost: COST,
//       fixedCost
//    });

//    // If profit is within acceptable range, return target price
//    if (profit >= MIN_PROFIT && profit <= MAX_PROFIT) {
//       return targetPrice;
//    }

//    // Handle cases where profit is outside acceptable range
//    if (profit < MIN_PROFIT) {
//       const adjustedPrice = calculatePriceFromProfit({
//          desiredProfit: COST + MIN_PROFIT,
//          fixedCost
//       });
//       return Math.max(adjustedPrice, price90);
//    }

//    // When profit exceeds MAX_PROFIT
//    return calculatePriceFromProfit({
//       desiredProfit: COST + MAX_PROFIT,
//       fixedCost
//    });
// }
