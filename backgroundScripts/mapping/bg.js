let approvalBrands = {};

runtimeOnMessage(
   "c_b_get_mapping_product_data",
   async (data, sender, sendResponse) => {
      const { productName, startingPage, endingPage, fkCsrfToken, sellerId } =
         data;
      optionsTabId = sender.tab.id;

      try {
         const verifiedProducts = [];
         let sellerListingData = {};
         approvalBrands = {};

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
            for (let index = 0; index < products.length; index += BATCH_SIZE) {
               const batchResults = await processBatchForVerification(
                  products,
                  fkCsrfToken,
                  index,
                  sellerListingData?.data || {}
               );
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