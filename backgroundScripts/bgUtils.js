const createNewTab = (url) => {
   return new Promise((resolve) => {
      chrome.tabs.create({ url: url }, (tab) => resolve(tab.id));
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
   return new Promise(async (resolve) => {
      await chrome.tabs.update(tabId, { url: newUrl });
      resolve(true);
   });
};

const __create_new_listing__ = (quantity, count) => {
   if (listing_run) {
      chromeStorageGetLocal(storageListingKey, async (val) => {
         if (!val) val = {};
         val.QUANTITY = quantity;
         val.COUNT = count;
         chromeStorageSetLocal(storageListingKey, val);

         await updateTab(currentTabId, URLS.newListing);
         // console.log(quantity, count);
         
         tabSendMessage(currentTabId, "b_c_create_single_listing", (r) => {
            console.log(r);
         });
      });
   }
};
