importScripts("./../utils.js", "./bgUtils.js");

chromeStorageGet(storageKey, async (val) => {
   if (!val) {
      chromeStorageSet(storageKey, values);
   } else {
      values = val;
   }
});

chromeStorageGetLocal(storageSingleListKey, async (val) => {
   if (!val) {
      // chromeStorageSetLocal(storageSingleListKey, singleListValues);
   } else {
      singleListValues = val;
   }
});

runtimeOnMessage("c_b_update_single_listing", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(storageSingleListKey, val);
   });
});
runtimeOnMessage("c_b_single_listing_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      sendResponse(val);
   });
});
runtimeOnMessage("c_b_mapping_request", (__, _, sendResponse) => {
   chromeStorageGet(storageKey, (val) => {
      sendResponse(val);
   });
});
