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

let optionsTabId;
function sendUpdateLoadingPercentage(percentage, color = "white") {
   if (!optionsTabId) return;
   tabSendMessage(optionsTabId, "b_c_update_loading_percentage", {
      percentage,
      color,
   });
}

runtimeOnMessage(
   "c_b_get_mapping_product_data",
   async (data, sender, sendResponse) => {
      const { productName, startingPage, endingPage, fkCsrfToken, sellerId } =
         data;

      optionsTabId = sender.tab.id;

      try {
         // Fetch all products first
         const verifiedProducts = [];
         // const MAX_PAGE_IN_ONE_TIME = 6;

         let sellerListingData = {};

         if (endingPage - startingPage > 6) {
            sellerListingData = await getAllListingSellerData(fkCsrfToken);
         }

         for (let i = startingPage, j = 0; i <= endingPage; i++, j++) {
            const products = [];
            const productData = await fetchFlipkartSearchData(productName, i);
            if (productData) {
               products.push(...productData);
            }

            // Process products in batches
            for (let i = 0; i < products.length; i += BATCH_SIZE) {
               const batchResults = await processBatchForVerification(
                  products,
                  fkCsrfToken,
                  i,
                  sellerListingData?.data || {}
               );
               if (batchResults?.isError) {
                  sendResponse({ isError: true, error: "Too many requests" });
                  return;
               }
               verifiedProducts.push(...batchResults);
            }
            sendUpdateLoadingPercentage(
               Math.round((i / (endingPage - startingPage + 1)) * 100)
            );
         }

         const modifiedProducts = await modifyVerifiedProducts(
            verifiedProducts,
            sellerId
         );

         // console.log(modifiedProducts);
         // Send final filtered response
         sendResponse(modifiedProducts);
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
         const { SELLER_ID, FK_CSRF_TOKEN, PRODUCTS_CHUNK } =
            getMixDataToNewMappingData(DATA);
         const allResults = [];
         const PCLength = PRODUCTS_CHUNK.length;

         let i = 1;
         for (const PRODUCTS of PRODUCTS_CHUNK) {
            const batchData = {
               SELLER_ID,
               FK_CSRF_TOKEN,
               PRODUCTS,
            };

            const batchResult = await createProductMappingBulk(batchData);
            allResults.push(...batchResult);
            sendUpdateLoadingPercentage(Math.round((i / PCLength) * 100), "green");
            if (PCLength > ++i) await wait(2000);
         }

         // console.log(PRODUCTS_CHUNK);
         // console.log(allResults);

         sendResponse(allResults);
      } catch (error) {
         console.log("Error in product mapping:", error);
         sendResponse({
            status: "error",
            message: "Failed to map products",
            error: error.message,
         });
      }
   }
);

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