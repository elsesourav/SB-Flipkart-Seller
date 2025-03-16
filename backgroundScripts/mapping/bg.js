let approvalBrands = {};

runtimeOnMessage(
   "c_b_get_mapping_product_data",
   async (data, sender, sendResponse) => {
      const { productName, startingPage, sellerListing = {}, endingPage, fkCsrfToken, sellerId } =
         data;
      optionsTabId = sender.tab.id;

      try {
         const verifiedProducts = [];
         approvalBrands = {};

         for (let i = startingPage, j = 0; i <= endingPage; i++, j++) {
            const products = [];
            const productData = await fetchFlipkartSearchData(productName, i);
            if (productData) {
               products.push(...productData);
            }

            // Process products in batches
            for (let I = 0; I < products.length; I += BATCH_SIZE) {
               const batchResults = await processBatchForVerification(products, I, sellerListing);

               if (batchResults?.isError) {
                  sendResponse({ isError: true, error: "Too many requests" });
                  return;
               }
               verifiedProducts.push(...batchResults);
            }
            sendUpdateLoadingPercentage(
               Math.round((j / (endingPage - startingPage + 1)) * 100)
            );
         }

         const modifiedProducts = await modifyVerifiedProducts(
            verifiedProducts,
            sellerId
         );

         // console.log(modifiedProducts);
         // Send final filtered response
         // console.table(modifiedProducts);

         sendResponse(modifiedProducts);
      } catch (error) {
         console.log("Error during product verification:", error);
         sendResponse([]);
      }
   }
);

runtimeOnMessage(
   "c_b_get_all_listing_seller_data",
   async (data, sender, sendResponse) => {
      const { fkCsrfToken } = data;
      optionsTabId = sender.tab.id;
      try {
         sellerListingData = await getAllListingSellerData(fkCsrfToken);
         sendResponse(sellerListingData);
      } catch (error) {
         console.log("Error during product verification:", error);
         sendResponse([]);
      }
   }
);





async function fetchListings(order) {
   const url = "https://seller.flipkart.com/napi/listing/listingsDataForStates";
   
   const body = JSON.stringify({
      column: { 
         sort: {
            column_name: "title", 
            sort_by: order // ASC | DESC
         },
         pagination: {
            batch_no: 0, 
            batch_size: 100,
         },
      },
      search_filters: { internal_state: "ACTIVE" },
      search_text: "",
   });

   const headers = {
       "Content-Type": "application/json",
       "accept": "*/*",
       "fk-csrf-token": "AqDcGAC7-uO2eMpQCyiDrQbeu1rVYoqIP7lY",
       "origin": "https://seller.flipkart.com",
       "referer": "https://seller.flipkart.com/index.html",
       "sec-fetch-site": "same-origin"
   };
   
   try {
       const response = await fetch(url, {
           method: "POST",
           headers: headers,
           body: body,
           credentials: "include", // Ensures cookies are sent with the request
       });
       
       if (!response.ok) {
           throw new Error(`HTTP error! Status: ${response.status}`);
       }
       
       const data = await response.json();
       console.log("Response Data:", data);
       return data;
   } catch (error) {
       console.error("Fetch error:", error);
   }
}

// (async () => {
//    let listingData = {};
//    // ASC | DESC
//    const data1 = await fetchListings("ASC");
//    const data2 = await fetchListings("DESC");
//    const { listing_data_response: d1 } = data1;
//    const { listing_data_response: d2 } = data2;

//    d1.forEach((info) => {
//       listingData[info.product_id] = { ...info };
//    });
//    d2.forEach((info) => {
//       listingData[info.product_id] = { ...info };
//    });
//    console.log(listingData);
//    console.log(Object.keys(listingData).length);
// })();









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
            sendUpdateLoadingPercentage(Math.round((i++ / PCLength) * 100), "green");
            if (PCLength > i) await wait(2000);
         }

         // console.log(PRODUCTS_CHUNK);
         console.log(allResults);

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