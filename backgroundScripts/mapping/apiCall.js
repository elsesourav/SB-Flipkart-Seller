function checkApprovalStatus(vertical, productBrand) {
   return new Promise(async (resolve) => {
      try {
         if (approvalBrands[productBrand]) {
            resolve({ isError: false, isNotNeed: approvalBrands[productBrand].isNotNeed });
            return;
         } 
         const response = await fetch(`${URLS.brandApproval}vertical=${vertical}&brand=${productBrand}`);
         const result = await response.json();

         // console.log(result);
         const isNotNeed = result.approvalStatus === "APPROVED";
         approvalBrands[productBrand] = isNotNeed;
         resolve({ isError: false, isNotNeed });
      } catch (error) {
         resolve({ isError: true, isNotNeed: null });
      }
   });
}

function getProductIdToInfo(fkCsrfToken, productId) {
   return new Promise(async (resolve) => {
      try {
         const response = await fetch(URLS.listingsDataForStates, {
            method: "POST",
            headers: {
               Accept: "application/json",
               "Content-Type": "application/json",
               "fk-csrf-token": fkCsrfToken,
            },
            body: JSON.stringify({
               search_text: productId,
            }),
         });
         const r = await response.json();

         if (r?.count > 0) {
            const { internal_state, sku_id, ssp } = r.listing_data_response?.[0];
            resolve({ alreadySelling: true, internal_state, sku_id, ssp });
         }
         resolve(null);
      } catch (error) {
         resolve({ isError: true });
      }
   });
}

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

      const firstData = await fetchListingSellerData(0, fkCsrfToken, state);
      const { count, data } = firstData;

      const len = Math.floor(count / 100);
      sendUpdateLoadingPercentage((1 / len) * 100, "yellow");

      data.map((info) => {
         const pid = info.product_id;
         listingData[pid] = { alreadySelling: true, ...info };
      });

      const promises = Array.from({ length: len }, (_, i) =>
         fetchListingSellerData(i + 1, fkCsrfToken, state)
      );

      let completedBatches = 0;
      const results = await Promise.all(
         promises.map(async (promise, i) => {
            const result = await promise;
            completedBatches++;
            const percentage = Math.round(((i + 1) / len) * 100);
            sendUpdateLoadingPercentage(percentage, "yellow");
            return result;
         })
      );

      results.forEach(({ data }) => {
         data.map((info) => {
            const pid = info.product_id;
            listingData[pid] = { alreadySelling: true, ...info };
         });
      });

      sendUpdateLoadingPercentage(0, "yellow");
      resolve({ count, data: listingData });
   });
}

function getAllListingSellerData(fkCsrfToken) {
   return new Promise(async (resolve) => {
      const { count: c1, data: d1 } = await getListingSellerData(
         fkCsrfToken,
         "ACTIVE"
      );
      const { count: c2, data: d2 } = await getListingSellerData(
         fkCsrfToken,
         "INACTIVE"
      );
      const { count: c3, data: d3 } = await getListingSellerData(
         fkCsrfToken,
         "ARCHIVED"
      );

      const products = { ...d1, ...d2, ...d3 };
      const newProducts = Object.fromEntries(
         Object.entries(products).map(([key, obj]) => {
            const { internal_state, sku_id, ssp } = obj
             const p = { internal_state, sku_id, ssp, alreadySelling: true };
           return [key, p]
         })
      );

      resolve({ count: c1 + c2 + c3, data: newProducts });
   });
}

function getMyListingInfo(data, fkCsrfToken, pId) {
   return new Promise(async (resolve) => {
      const is = Object.keys(data).length > 0;
      const DATA = is ? data[pId] : await getProductIdToInfo(fkCsrfToken, pId);
      resolve(DATA);
   });
}

function getProductSellers(pid) {
   return new Promise(async (resolve) => {
      const data = await getProductAllSellerInfo(pid);
      if (!data) resolve({ is: false, error: "Server error" });
      resolve({ ... data });
   });
}


function verifyProductUsingUserData(product, fct, sellerProducts) {
   return new Promise(async (resolve) => {
      try {
         // Search for product details
         const { productBrand, vertical, media, id } = product;
         const myListingData = await getMyListingInfo(sellerProducts, fct, id);
         const imageUrl = newImgPath(media.images?.[0]?.url)

         if (myListingData?.alreadySelling) {
            const data = await getProductSellers(id);
            resolve({ ...data, is: true, imageUrl, ...myListingData });
         } else {

            const status = await checkApprovalStatus(vertical, productBrand);
            if (status?.isError) resolve({ is: false, error: "Server error" });

            if (status.isNotNeed) {
               const data = await getProductSellers(id);
               resolve({ ...data, imageUrl, is: true, alreadySelling: false });
            } else {
               resolve({
                  is: false,
                  error: "Not approved",
               });
            }
         }
      } catch (error) {
         resolve({ isError: true, is: false, error: error.message });
         console.log("Error verifying product:", error);
      }
   });
}

function processBatchForVerification(products, fct, startIdx, sellerProducts) {
   return new Promise(async (resolve) => {
      const batch = products.slice(startIdx, startIdx + BATCH_SIZE);
      if (batch.length === 0) {
         resolve([]);
         return;
      }

      const processProduct = async (product) => {
         try {
            const result = await verifyProductUsingUserData(product, fct, sellerProducts);
            // console.log(result);
            
            if (result?.isError) {
               throw new Error("Too many requests");
            }
            return result?.is ? result : null;
         } catch (error) {
            if (error.message === "Too many requests") {
               throw error;
            }
            console.log(`Error verifying product ${product.id}:`, error);
            return null;
         }     
      };

      try {
         const batchPromises = batch.map(processProduct);
         const results = await Promise.all(batchPromises);
         const validResults = results.filter(result => result !== null);
         resolve(validResults);
      } catch (error) {
         if (error.message === "Too many requests") {
            resolve({ isError: true, error: "Too many requests" });
         } else {
            console.error("Error processing batch:", error);
            resolve([]);
         }
      }
   });
}

function GET_SELLER_INFO() {
   return new Promise(async (resolve) => {
      try {
         const res = await fetch(URLS.flipkartFeaturesForSeller);
         const json = await res?.json();
         const info = {
            sellerId: json?.sellerId,
            userId: json?.userId,
            csrfToken: json?.csrfToken,
         };
         resolve(info);
      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}

const fetchFlipkartSearchData = async (productName, pageNumber = 1) => {
   return new Promise(async (resolve) => {
      const response = await fetch(URLS.flipkartSearchUrl, {
         method: "POST",
         headers: FLIPKART_SEARCH_HEADER,
         body: JSON.stringify({
            pageContext: {
               fetchSeoData: true,
               paginatedFetch: false,
               pageNumber: pageNumber,
            },
            pageUri: `/search?q=${productName.split(" ").join("%20")}`,
            requestContext: {
               type: "BROWSE_PAGE",
            },
         }),
      });

      if (response.ok) {
         const data = await response.json();
         const { slots } = data?.RESPONSE;

         // Extract and transform product data [[10,20,32],[5,6,3]] => [10,20,32,5,6,3]
         const products = slots?.reduce((acc, slot) => {
            const slotProducts = slot?.widget?.data?.products || [];
            
            const validProducts = slotProducts
               .map(product => {
                  const productInfo = product?.productInfo?.value;
                  if (!productInfo?.pricing) return null;
                  
                  const { mrp, finalPrice } = productInfo.pricing;
                  return { mrp, finalPrice, ...productInfo };
               })
               .filter(Boolean);

            return [...acc, ...validProducts];
         }, []);

         resolve(products || []);
      } else {
         console.log(`Error: ${response.status}`);
         resolve(null);
      }
   });
};

function createProductMappingBulk(DATA) {
   return new Promise(async (resolve) => {
      const { SELLER_ID, FK_CSRF_TOKEN, PRODUCTS } = DATA;

      const BULK_REQUESTS = PRODUCTS.map((product) => {
         console.log(product);

         const {
            ID,
            SKU,
            MRP,
            LISTING_STATUS,
            PROCUREMENT_TYPE,
            SHIPPING_DAYS,
            STOCK_SIZE,
            SELLING_PRICE,
            SRCELEMENT_AMOUNT,
            HSN,
            MINIMUM_ORDER_QUANTITY,
            DELIVERY_LOCAL,
            DELIVERY_NATIONAL,
            DELIVERY_ZONAL,
            EARLIEST_MFG_DATE,
            SHELF_LIFE,
            MANUFACTURER_DETAILS,
            PACKER_DETAILS,
            TOTAL_WEIGHT,
            PACKAGING_LENGTH,
            PACKAGING_BREADTH,
            PACKAGING_HEIGHT,
         } = product;

         const PRODUCT_DATA = {
            sku_id: [{ value: SKU, qualifier: "" }],
            country_of_origin: [{ value: "IN", qualifier: "" }],
            earliest_mfg_date: [{ value: EARLIEST_MFG_DATE, qualifier: "" }],
            flipkart_selling_price: [{ value: SELLING_PRICE, qualifier: "INR" }],
            // esp: [{value: SRCELEMENT_AMOUNT, qualifier: "INR"}],
            hsn: [{ value: HSN, qualifier: "" }],
            listing_status: [{ value: LISTING_STATUS, qualifier: "" }],
            local_shipping_fee_from_buyer: [{ value: DELIVERY_LOCAL, qualifier: "INR" }],
            luxury_cess: [{ qualifier: "Percentage" }],
            manufacturer_details: [{ value: MANUFACTURER_DETAILS, qualifier: "" }],
            minimum_order_quantity: [{ value: MINIMUM_ORDER_QUANTITY, qualifier: "" }],
            mrp: [{ value: MRP, qualifier: "INR" }],
            national_shipping_fee_from_buyer: [{ value: DELIVERY_NATIONAL, qualifier: "INR" }],
            packer_details: [{ value: PACKER_DETAILS, qualifier: "" }],
            procurement_type: [{ value: PROCUREMENT_TYPE, qualifier: "" }],
            service_profile: [{ value: "NON_FBF", qualifier: "" }],
            shelf_life: [{ value: SHELF_LIFE, qualifier: "Months" }],
            shipping_days: [{ value: SHIPPING_DAYS, qualifier: "HR" }],
            shipping_provider: [{ value: "FLIPKART", qualifier: "" }],
            stock_size: [{ value: STOCK_SIZE, qualifier: "" }],
            tax_code: [{ value: "GST_5", qualifier: "" }],
            zonal_shipping_fee_from_buyer: [{ value: DELIVERY_ZONAL, qualifier: "INR" }],
         };

         const PACKAGE_DATA = {
            id: { value: "packages-0" },
            length: { value: PACKAGING_LENGTH, qualifier: "CM" },
            breadth: { value: PACKAGING_BREADTH, qualifier: "CM" },
            height: { value: PACKAGING_HEIGHT, qualifier: "CM" },
            weight: { value: TOTAL_WEIGHT, qualifier: "KG" },
            sku_id: { value: SKU, qualifier: "" },
         };

         return {
            attributeValues: PRODUCT_DATA,
            context: { ignore_warnings: true },
            packages: [PACKAGE_DATA],
            productId: ID,
            skuId: SKU,
         };
      });

      const HEADER = {
         accept: "*/*",
         "content-type": "application/json",
         "fk-csrf-token": FK_CSRF_TOKEN,
      };

      const REQUEST_BODY = {
         sellerId: SELLER_ID,
         bulkRequests: BULK_REQUESTS,
      };

      const REQUEST_OPTIONS = {
         method: "POST",
         headers: HEADER,
         body: JSON.stringify(REQUEST_BODY),
         credentials: "include",
      };

      try {
         const response = await fetch(URLS.flipkartAPIMapping, REQUEST_OPTIONS);
         if (!response.ok) {
            console.log("Mapping failed:", await response.text());
            resolve([]);
            return;
         }

         const data = await response.json();

         resolve(data?.result?.bulkResponse);
      } catch (error) {
         console.log("Error mapping product:", error);
         resolve([]);
      }
   });
}

function getProductAllSellerInfo(productId) {
   return new Promise(async (resolve) => {
      if (!productId) return resolve(null);
      const header = {
         "X-User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop",
      };

      try {
         const body = JSON.stringify({ requestContext: { productId } });
         const response = await fetch(URLS.productSellers, {
            method: "POST",
            headers: header,
            body,
         });
         const { RESPONSE } = await response.json();

         const data = RESPONSE?.data?.product_seller_detail_1?.data;
         const [productSummary] = RESPONSE?.data?.product_summary_1?.data;
         const { vertical, productBrand, subTitle, title, rating, pricing } = productSummary?.value;

         const newData = data.map(({ value }) => {
            // seller info
            const id = value?.sellerInfo?.value?.id;
            const name = value?.sellerInfo?.value?.name;

            // price info
            const FKFP =
               value?.npsListing?.pnp_lite_listing_info?.priceInfo?.pricePoints
                  ?.FKFP || 9999;
            const MRP =
               value?.npsListing?.pnp_lite_listing_info?.priceInfo?.pricePoints
                  ?.MRP || 99999;

            // shipping fees
            const local_shipping_fee =
               value?.npsListing?.shipping_fees?.local_shipping_fee || 0;
            const zonal_shipping_fee =
               value?.npsListing?.shipping_fees?.zonal_shipping_fee || 0;
            const national_shipping_fee =
               value?.npsListing?.shipping_fees?.national_shipping_fee || 19;

            const isFAssured = value?.npsListing?.listing_tier === "FASSURED";

            return {
               productId,
               sellerId: id,
               sellerName: name,
               isFAssured,
               finalPrice: FKFP?.value,
               totalPrice:
                  (FKFP?.value || 0) +
                  Math.min(
                     local_shipping_fee?.amount,
                     national_shipping_fee?.amount,
                     zonal_shipping_fee?.amount
                  ),
               mrp: MRP?.value,
               localFee: local_shipping_fee?.amount,
               zonalFee: zonal_shipping_fee?.amount,
               nationalFee: national_shipping_fee?.amount,
            };
         });

         const sellers = newData.sort(
            (a, b) => a.finalPrice + a.localFee - (b.finalPrice + b.localFee)
         );

         resolve({
            id: productId,
            sellers,
            rating,
            mrp: pricing?.mrp || 0,
            finalPrice: pricing?.finalPrice?.value || 0,
            productBrand: productBrand,
            subTitle,
            title,
            vertical,
            newTitle: title.substring(productBrand.length + 1),
         });
      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}
