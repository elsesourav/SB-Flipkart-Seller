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
function sendUpdateLoadingPercentage(percentage) {
   if (!optionsTabId) return;
   tabSendMessage(optionsTabId, "b_c_update_loading_percentage", {
      percentage,
   });
}

runtimeOnMessage(
   "c_b_get_mapping_possible_product_data",
   async (data, sender, sendResponse) => {
      const { productName, startingPage, endingPage, sellerId, fkCsrfToken } =
         data;

      optionsTabId = sender.tab.id;

      try {
         // Fetch all products first
         const verifiedProducts = [];
         const MAX_PAGE_IN_ONE_TIME = 6;
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
                  sellerId,
                  fkCsrfToken,
                  i
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
            // if ((j + 1) % MAX_PAGE_IN_ONE_TIME === 0 && i !== endingPage)
            //    await wait(40000);
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

         // Process data in batches of BATCH_SIZE eg:(25)
         for (let i = 0; i < newMappingData.PRODUCTS.length; i += BATCH_SIZE) {
            const batchData = {
               ...newMappingData,
               PRODUCTS: newMappingData.PRODUCTS.slice(i, i + BATCH_SIZE),
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
      { data, fileType, filename, username, password },
      __,
      sendResponse
   ) => {
      const result = await exportFile(
         username,
         fileType,
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

function fetchListingSellerData(i, fkCsrfToken, state = "ACTIVE") {
   return new Promise(async (resolve) => {
      const body = JSON.stringify({
         search_text: "",
         search_filters: {
            internal_state: state,
         },
         column: {
            pagination: {
               batch_no: i,
               batch_size: 100,
            },
            sort: {
               column_name: "demand_weight",
               sort_by: "DESC",
            },
         },
      });
      const headers = {
         Accept: "*/*",
         "Accept-Encoding": "gzip, deflate, br, zstd",
         "Accept-Language": "en-US,en;q=0.9,bn;q=0.8,hi;q=0.7",
         Connection: "keep-alive",
         "Content-Type": "application/json",
         "fk-csrf-token": fkCsrfToken,
      };

      try {
         const response = await fetch(URLS.listingsDataForStates, {
            method: "POST",
            headers,
            body,
         });
   
         const { count, listing_data_response } = await response.json();
   
         if (!count) {
            resolve({ count: 0, data: [] });
         } else {
            resolve({ count, data: listing_data_response });
         }
      } catch (error) {
         console.log(error);
         resolve({ count: 0, data: [] });
      }
   });
}

function getListingSellerData(fkCsrfToken, state = "ACTIVE") {
   return new Promise(async (resolve) => {
      const listingData = {};
      console.time();
      const firstData = await fetchListingSellerData(0, fkCsrfToken, state);
      const { count, data } = firstData;
      
      const len = Math.floor(count / 100);
      console.log(count, len);

      // Process first batch
      data.map(({ product_id, imageUrl, internal_state, sku_id }) => {
         listingData[product_id] = {
            imageUrl,
            internal_state,
            sku_id,
         };
      });

      // Create array of promises for remaining batches
      const promises = Array.from({ length: len }, (_, i) =>
         fetchListingSellerData(i + 1, fkCsrfToken, state)
      );

      // Execute all promises in parallel
      const results = await Promise.all(promises);

      // Process all results
      results.forEach(({ data }, i) => {
         console.log(i);
         console.log(data);
         
         data.map(({ product_id, imageUrl, internal_state, sku_id }) => {
            listingData[product_id] = {
               imageUrl,
               internal_state,
               sku_id,
            };
         });
      });

      console.timeEnd();
      console.log(listingData);
      resolve({ count, data: listingData });
   });
}

function getAllListingSellerData(fkCsrfToken) {
   return new Promise(async (resolve) => {
      const activeData = await fetchListingSellerData(0, fkCsrfToken, "ACTIVE");
      const inactiveData = await fetchListingSellerData(0, fkCsrfToken, "INACTIVE");
      const archivedData = await fetchListingSellerData(0, fkCsrfToken, "ARCHIVED");
      console.table({ ...activeData, ...inactiveData, ...archivedData });
      
      resolve({ ...activeData, ...inactiveData, ...archivedData });
   });
}

// getAllListingSellerData("sgsvRI3P-19Xu76vVO3YtNQd-LE2Ak5-4Z9A");

// function fetchProductSellerDetails(productId, fkCsrfToken) {
//    const url = "https://seller.flipkart.com/napi/listing/listingsDataForStates";

//    // Define the request payload

//    // Define the headers

//    console.log("starting test");
//    console.time();

//    for (let i = 0; i < 97; i++) {
//       // Make the fetch request
//       fetch(url, {
//          method: "POST",
//          headers: headers,
//          body: JSON.stringify(data),
//       })
//          .then((response) => {
//             if (!response.ok) {
//                throw new Error("Network response was not ok");
//             }
//             return response.json();
//          })
//          .then((data) => {
//             console.log("Success:", data);
//             if (i === 96) {
//                console.log("ending test");
//                console.timeEnd();
//             }
//          })
//          .catch((error) => {
//             console.error("Error:", error);
//          });
//    }
// }

// fetchProductSellerDetails();

// fetch("https://2.rome.api.flipkart.com/api/3/page/dynamic/product-sellers", {
//    method: "POST",
//    headers: {
//       "X-User-Agent":
//          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop",
//    },
//    body: JSON.stringify({ requestContext: { productId: "PAEGGREHZTG9CNTQ" } }),
// })
//    .then((response) => response.json())
//    .then((DATA) => {
//       const { data } = DATA?.RESPONSE?.data?.product_seller_detail_1;

//       const nData = data.map((e) => e.value);
//       const newData = nData.map((e) => {
//          // seller info
//          const { id, name } = e?.sellerInfo?.value;

//          // price info
//          const { FKFP, MRP } = e?.npsListing?.pnp_lite_listing_info?.priceInfo?.pricePoints;

//          // shipping fees
//          const {
//             local_shipping_fee,
//             national_shipping_fee,
//             zonal_shipping_fee,
//          } = e?.npsListing?.shipping_fees;

//          const is_fAssured = e?.npsListing?.listing_tier === "FASSURED";

//          return {
//             id,
//             name,
//             is_fAssured,
//             final_price: FKFP?.value,
//             mrp: MRP?.value,
//             local_shipping_fee: local_shipping_fee?.amount,
//             zonal_shipping_fee: zonal_shipping_fee?.amount,
//             national_shipping_fee: national_shipping_fee?.amount,
//          };
//       });

//       const sortedData = newData.sort((a, b) => (a.final_price + a.local_shipping_fee) - (b.final_price + b.local_shipping_fee));

//       console.table(sortedData);
//    })
//    .catch((error) => console.error("Fetch Error:", error));

// Define the URL
