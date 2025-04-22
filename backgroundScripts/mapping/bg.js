let approvalBrands = {};

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

runtimeOnMessage(
   "c_b_get_new_mapping_product_data",
   async (data, sender, sendResponse) => {
      const { productName, brands, startingPage, endingPage, sellerId, batchSize, server } = data;
      optionsTabId = sender.tab.id;
      BATCH_SIZE = batchSize;
      setURLSUsingServer(server);

      try {
         const verifiedProducts = [];
         approvalBrands = {};
         const { selectOnly, selectNot } = brands;
         const pageUri = getSearchUri(selectOnly, productName);

         // search flipkart page one by one
         for (let i = startingPage, j = 1; i <= endingPage; i++, j++) {
            const products = [];
            const productData = await fetchFlipkartSearchData(pageUri, selectNot, i);
            if (productData) {
               products.push(...productData);
            }

            // Process products in batches
            for (let I = 0; I < products.length; I += BATCH_LEN) {
               const result = await processBatchForVerificationNew(products, I);
               if (result?.isError) {
                  sendResponse({ isError: true, error: "Too many requests" });
                  return;
               }
               verifiedProducts.push(...result);
            }

            sendUpdateLoadingPercentage(
               Math.round((j / (endingPage - startingPage + 1)) * 100)
            );
         }

         const modifiedProducts = await modifyNewProductsData(
            verifiedProducts,
            sellerId
         );

         // console.log("Modified Products:", modifiedProducts);

         sendResponse(modifiedProducts);
      } catch (error) {
         console.log("Error during product verification:", error);
         sendResponse([]);
      }
   }
);

runtimeOnMessage(
   "c_b_get_old_mapping_product_data",
   async (data, sender, sendResponse) => {
      let { productName, brands, sellerListing, sellerId, batchSize, server } = data;
      optionsTabId = sender.tab.id;
      BATCH_SIZE = batchSize;
      setURLSUsingServer(server);

      try {
         const verifiedProducts = [];

         let products = Object.values(sellerListing);
         products = filterProductsByNameSkuAndSelect(products, productName, brands);

         // Process products in batches
         const productLen = products.length;
         for (let I = 0; I < productLen; I += BATCH_LEN) {
            const result = await processBatchForVerificationOld(products, I);

            if (result?.isError) {
               sendResponse({ isError: true, error: "Too many requests" });
               return;
            }
            verifiedProducts.push(...result);

            sendUpdateLoadingPercentage(
               Math.round(((I + BATCH_LEN) / productLen) * 100)
            );
         }

         const modifiedProducts = await modifyOldProductsData(
            verifiedProducts,
            sellerId
         );

         // console.log("Modified Products:", modifiedProducts);

         sendResponse(modifiedProducts);
      } catch (error) {
         console.log("Error during product verification:", error);
         sendResponse([]);
      }
   }
);

runtimeOnMessage(
   "c_b_create_new_product_mapping",
   async (DATA, _, sendResponse) => {
      try {
         const { SELLER_ID, FK_CSRF_TOKEN, PRODUCTS_CHUNK } =
            getMixDataForNewMapping(DATA);

         console.log(PRODUCTS_CHUNK);

         const allResults = [];
         const PCLength = PRODUCTS_CHUNK.length;

         let i = 1;
         for (const PRODUCTS of PRODUCTS_CHUNK) {
            const batchData = {
               SELLER_ID,
               FK_CSRF_TOKEN,
               PRODUCTS,
            };

            const batchResult = await createNewProductMappingBulk(batchData);
            console.log(batchResult);

            allResults.push(...batchResult);
            sendUpdateLoadingPercentage(
               Math.round((i++ / PCLength) * 100),
               "green"
            );
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

runtimeOnMessage(
   "c_b_update_old_product_mapping",
   async (DATA, _, sendResponse) => {
      try {
         const { SELLER_ID, FK_CSRF_TOKEN, PRODUCTS_CHUNK } =
            await getMixDataForOldMapping(DATA);

         // console.log(SELLER_ID, FK_CSRF_TOKEN, PRODUCTS_CHUNK);

         const allResults = [];
         const PCLength = PRODUCTS_CHUNK.length;

         let i = 1;
         for (const PRODUCTS of PRODUCTS_CHUNK) {
            const batchData = {
               SELLER_ID,
               FK_CSRF_TOKEN,
               PRODUCTS,
            };

            const batchResult = await updateOldProductMappingBulk(batchData);
            allResults.push(...batchResult);
            sendUpdateLoadingPercentage(
               Math.round((i++ / PCLength) * 100),
               "green"
            );
            if (PCLength > i) await wait(2000);
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
