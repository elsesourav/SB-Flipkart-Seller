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
   return new Promise(async (resolve) => {
      const queryOptions = { active: true, lastFocusedWindow: true };
      const [tab] = await chrome.tabs.query(queryOptions);
      resolve(tab);
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
}

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

const getNeededAgent = (pc_limit, mobile_limit) => {
   return pc_limit === false && mobile_limit > 0
      ? userAgent.mobile
      : userAgent.pc;
};

const updateStorageDefaultSwitch = (name, is) => {
   return new Promise((resolve) => {
      chromeStorageGet(storageKey, async (values) => {
         const { localSaved } = values;
         localSaved[name] = is;
         await chromeStorageSet(storageKey, values);
         resolve();
      });
   });
};
