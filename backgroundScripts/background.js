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

runtimeOnMessage("c_b_image_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      sendResponse(val);
   });
});
runtimeOnMessage("c_b", (__, _, sendResponse) => {
   chromeStorageGet(storageKey, (val) => {
      sendResponse(val);
   });
});
