importScripts(
   "./firebaseApp.js",
   "./firebaseDatabase.js",
   "./firebaseConfig.js"
);
importScripts("./../utils.js", "./bgUtils.js", "./apiCall.js");
const BATCH_SIZE = 8; // Number of concurrent requests

console.log("background loaded");

runtimeOnMessage("c_b_update_mapping", (values, _, sendResponse) => {
   console.log(values);
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

runtimeOnMessage("c_b_get_fk_csrf_token", async (__, _, sendResponse) => {
   const token = await GET_FK_CSRF_TOKEN();
   sendResponse({ token });
});

runtimeOnMessage(
   "c_b_get_mapping_possible_product_data",
   async (data, _, sendResponse) => {
      const { productName, startingPage, endingPage, sellerId } = data;

      try {
         // Fetch all products first
         const products = [];
         for (let i = startingPage; i <= endingPage; i++) {
            const productData = await fetchFlipkartSearchData(productName, i);
            if (productData) {
               products.push(...productData);
            }
         }

         // Process products in batches
         const verifiedProducts = [];
         for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const batchResults = await processBatchForVerification(products, sellerId, i);
            if (batchResults?.isError) {
               sendResponse({ isError: true, error: "Too many requests" });
               return;
            }
            verifiedProducts.push(...batchResults);
         }
         

         // Send final filtered response
         sendResponse(verifiedProducts);
      } catch (error) {
         console.log("Error during product verification:", error);
         sendResponse([]);
      }
   }
);

runtimeOnMessage(
   "c_b_create_all_selected_product_mapping",
   async (DATA, _, sendResponse) => {
      try {
         const newMappingData = getMixDataToNewMappingData(DATA);
         const BATCH_SIZE = 25;
         const allResults = [];
         
         // Process data in batches of 25
         for (let i = 0; i < newMappingData.PRODUCTS.length; i += BATCH_SIZE) {
            const batchData = {
               ...newMappingData,
               PRODUCTS: newMappingData.PRODUCTS.slice(i, i + BATCH_SIZE)
            };
            
            const batchResult = await createProductMappingBulk(batchData);
            allResults.push(...batchResult);
         }
         // Send final results
         sendResponse(allResults);

      } catch (error) {
         console.log("Error in product mapping:", error);
         sendResponse({ 
            status: "error",
            message: "Failed to map products",
            error: error.message
         });
      }
   }
);



runtimeOnMessage("c_b_get_product_data", async (data, _, sendResponse) => {
   sendResponse(await getProductData(data.url));
});

runtimeOnMessage("c_b_listing_data_update", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(storageListingKey, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(storageListingKey, val);
   });
});

runtimeOnMessage("c_b_listing_data_update", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageListingKey, (val) => {
      val.QUANTITY = val?.START_COUNT || 0;
      val.COUNT = 0;
      chromeStorageSetLocal(storageListingKey, val);
      sendResponse({ status: "ok" });
   });
});

runtimeOnMessage("c_b_listing_data_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageListingKey, (val) => {
      getImageFilesFromLocalStorage().then((images) => {
         sendResponse({
            ...val,
            images,
         });
      });
   });
});

runtimeOnMessage("c_b_order_data_request", async (__, _, sendResponse) => {
   chromeStorageGetLocal(storageOrdersKey, async (val) => {
      const productsJson = chrome.runtime.getURL(
         "./../assets/unique/products.json"
      );
      try {
         const response = await fetch(productsJson);
         const products = await response.json();
         sendResponse({
            ...val,
            products,
         });
      } catch (error) {
         console.log("Error loading products.json:", error);
         sendResponse(val);
      }
   });
});

runtimeOnMessage("c_b_order_data_update", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(storageOrdersKey, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(storageOrdersKey, val);
   });
});

let PROCESS_QUEUE = [];
let listing_run = false;
let currentTabId = null;

runtimeOnMessage("c_b_create_listing_complete", async (_, __, sendResponse) => {
   chromeStorageGetLocal(storageListingKey, (val) => {
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
   chromeStorageGetLocal(storageListingKey, async (val) => {
      listing_run = true;
      currentTabId = (await getCurrentTab()).id;

      if (PROCESS_QUEUE.length > 0) {
         sendResponse({ status: "ok" });
         const action = PROCESS_QUEUE.pop();
         action();
      } else {
         PROCESS_QUEUE = [];

         val.COUNT = 0;
         chromeStorageSetLocal(storageListingKey, val);

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
      { data, typeType, filename, username, password },
      __,
      sendResponse
   ) => {
      const result = await exportFile(
         username,
         typeType,
         filename,
         data,
         password
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
