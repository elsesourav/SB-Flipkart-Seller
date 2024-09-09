importScripts("./../utils.js", "./bgUtils.js");

runtimeOnMessage("c_b_update_mapping", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(storageMappingKey, (val) => { 
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(storageMappingKey, val);
   });
});
runtimeOnMessage("c_b_mapping_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageMappingKey, (val) => {
      sendResponse(val);
   });
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
