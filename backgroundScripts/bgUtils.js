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
