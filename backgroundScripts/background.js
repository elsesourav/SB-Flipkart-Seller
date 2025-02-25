importScripts(
   "./firebase/app.js",
   "./firebase/database.js",
   "./firebase/config.js",
   "./firebase/apiCall.js",

   "./../utils.js",
   "./bgUtils.js",
   "./apiCall.js",

   "./mapping/bg.js",
   "./mapping/apiCall.js",
   "./mapping/control.js"
);

const BATCH_SIZE = 8; // Number of concurrent requests

console.log("background loaded");

runtimeOnMessage("c_b_update_mapping", (values, _, sendResponse) => {
   console.log(values);
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(KEYS.STORAGE_MAPPING, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(KEYS.STORAGE_MAPPING, val);
   });
});

runtimeOnMessage("c_b_mapping_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(KEYS.STORAGE_MAPPING, (val) => {
      sendResponse(val);
   });
});

runtimeOnMessage("c_b_get_seller_info", async (__, _, sendResponse) => {
   const info = await GET_SELLER_INFO();
   sendResponse(info);
});


runtimeOnMessage("c_b_get_product_data", async (data, _, sendResponse) => {
   sendResponse(await getProductData(data.url));
});

runtimeOnMessage("c_b_listing_data_update", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);
   });
});

runtimeOnMessage("c_b_listing_data_update", (__, _, sendResponse) => {
   chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      val.QUANTITY = val?.START_COUNT || 0;
      val.COUNT = 0;
      chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);
      sendResponse({ status: "ok" });
   });
});

runtimeOnMessage("c_b_listing_data_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      getImageFilesFromLocalStorage().then((images) => {
         sendResponse({
            ...val,
            images,
         });
      });
   });
});

runtimeOnMessage("c_b_order_data_request", async (__, _, sendResponse) => {
   chromeStorageGetLocal(KEYS.STORAGE_ORDERS, async (val) => {
      const purav = chrome.runtime.getURL("./../assets/changes/sku.purav.json");
      const sbarui = chrome.runtime.getURL(
         "./../assets/changes/sku.sbarui.json"
      );
      try {
         const puravResponse = await fetch(purav);
         const sbaruiResponse = await fetch(sbarui);
         const puravSKUs = await puravResponse.json();
         const sbaruiSKUs = await sbaruiResponse.json();

         sendResponse({
            ...val,
            changesSKU: {
               ...puravSKUs,
               ...sbaruiSKUs,
            },
         });
      } catch (error) {
         console.log("Error loading products.json:", error);
         sendResponse(val);
      }
   });
});

runtimeOnMessage("c_b_order_data_update", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(KEYS.STORAGE_ORDERS, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(KEYS.STORAGE_ORDERS, val);
   });
});

let PROCESS_QUEUE = [];
let listing_run = false;
let currentTabId = null;

runtimeOnMessage("c_b_create_listing_complete", async (_, __, sendResponse) => {
   chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      const { TIME_DELAY } = val;
      setTimeout(() => {
         if (PROCESS_QUEUE.length > 0) {
            const action = PROCESS_QUEUE.pop();
            action();
         }
      }, N(TIME_DELAY));
   });
   sendResponse({ status: "ok" });
});

runtimeOnMessage("p_b_start_listing", async (_, __, sendResponse) => {
   chromeStorageGetLocal(KEYS.STORAGE_LISTING, async (val) => {
      listing_run = true;
      currentTabId = (await getCurrentTab()).id;

      if (PROCESS_QUEUE.length > 0) {
         sendResponse({ status: "ok" });
         const action = PROCESS_QUEUE.pop();
         action();
      } else {
         PROCESS_QUEUE = [];

         val.COUNT = 0;
         chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);

         const { START_COUNT, END_COUNT, STAPES_BY } = val;

         const TOTAL = Math.abs(N(END_COUNT) - N(START_COUNT)) / N(STAPES_BY);
         const REPEAT_COUNT =
            (await chromeStorageGetLocal(`storage-images-small-0`))?.files
               ?.length || 0;

         const F = N(END_COUNT) - N(START_COUNT) > 0 ? 1 : -1;

         for (let i = 0; i <= TOTAL; i++) {
            for (let j = 0; j < N(REPEAT_COUNT); j++) {
               const COUNT = i * N(REPEAT_COUNT) + j;
               const QUANTITY = N(START_COUNT) + i * N(STAPES_BY) * F;
               PROCESS_QUEUE.unshift(() =>
                  __create_new_listing__(QUANTITY, COUNT, j)
               );
            }
         }
         sendResponse({ status: "ok" });

         if (PROCESS_QUEUE.length > 0) {
            const action = PROCESS_QUEUE.pop();
            action();
         }
      }
   });
   sendResponse({ status: "error" });
});

runtimeOnMessage("p_b_pause_listing", async (_, __, sendResponse) => {
   listing_run = false;
   sendResponse({ status: "ok" });
});

runtimeOnMessage("p_b_stop_listing", async (_, __, sendResponse) => {
   PROCESS_QUEUE = [];
   listing_run = false;
   sendResponse({ status: "ok" });
});

runtimeOnMessage(
   "p_b_verify_user",
   async ({ username, password }, __, sendResponse) => {
      const result = await verifyUser(username, password);
      sendResponse(result);
   }
);

runtimeOnMessage(
   "p_b_create_user",
   async ({ username, password }, __, sendResponse) => {
      const result = await createUser(username, password);
      sendResponse(result);
   }
);

runtimeOnMessage(
   "p_b_export_file",
   async (
      { data, fileType, filename, isUpdate, name, username, password },
      __,
      sendResponse
   ) => {
      const result = await exportFile(
         username,
         fileType,
         filename,
         data,
         password,
         isUpdate,
         name
      );
      sendResponse(result);
   }
);

runtimeOnMessage(
   "p_b_search_file",
   async ({ username, fileType, search }, __, sendResponse) => {
      const result = await getFiles(username, fileType, search);
      sendResponse(result);
   }
);

runtimeOnMessage(
   "p_b_delete_file",
   async ({ username, fileType, filename, password }, __, sendResponse) => {
      const result = await deleteFile(username, fileType, filename, password);
      sendResponse(result);
   }
);
