/* -------------------------------------------------- 
               Fetches form Firebase 
-------------------------------------------------- */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function verifyUser(username, password) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({
               message: "User not found",
               status: "NO_USER",
            });
         }
         const { password: dbPassword } = snapshot.val();

         if (dbPassword !== password) {
            return resolve({
               message: "Invalid password",
               status: "INVALID_PASSWORD",
            });
         }

         resolve({ message: "User Successfully Logged In", status: "SUCCESS" });
      } catch (error) {
         return resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function createUser(username, password) {
   return new Promise(async (resolve) => {
      try {
         // first check if user exists
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (snapshot.exists()) {
            return resolve({
               message: "User already exists",
               status: "User Exists",
            });
         }

         await dbRef.set({
            id: `ES-${Date.now().toString(36).toUpperCase()}`,
            username,
            password,
         });
         resolve({ message: "User created successfully", status: "SUCCESS" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "Error" });
      }
   });
}

function exportFile(username, fileType, filename, data, password, isUpdate, name) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({ message: "User not found", status: "NO_USER" });
         }

         const userData = snapshot.val();
         if (userData.password !== password) {
            return resolve({
               message: "Incorrect password",
               status: "INCORRECT_PASSWORD",
            });
         }

         const { yy, mm, dd, hh, ss, ms } = DATE();
         const refName = isUpdate ? name : `${filename}-${dd}-${mm}-${yy}--${hh}:${ss}:${ms}`;
         const fileRef = dbRef.child(`${fileType.toLowerCase()}/${refName}`);
         
         if (isUpdate) {
            await fileRef.update({
               data,
               date: `${dd}-${mm}-${yy} | ${hh}:${ss}`,
            });
            return resolve({ message: "File updated successfully", status: "SUCCESS" });
         }

         await fileRef.set({
            id: Date.now().toString(36).toUpperCase(),
            filename,
            filenameLower: filename.toLowerCase(),
            fileType,
            data,
            date: `${dd}-${mm}-${yy} | ${hh}:${ss}`,
         });
         resolve({ message: "File exported successfully", status: "SUCCESS" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function importFile(username, fileType, filename) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}/${fileType}/${filename}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({ message: "File not found", status: "NO_FILE" });
         }

         const data = snapshot.val();
         resolve({ message: "File imported successfully", status: "ok", data });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function deleteFile(username, fileType, filename, password) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({ message: "User not found", status: "NO USER" });
         }

         const userData = snapshot.val();
         if (userData.password !== password) {
            return resolve({
               message: "Incorrect password please check and try again",
               status: "INCORRECT PASSWORD",
            });
         }

         const fileRef = dbRef.child(`${fileType}/${filename}`);
         await fileRef.remove();
         resolve({ message: "File deleted successfully", status: "SUCCESS" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function getFiles(username, fileType, search = "") {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}/${fileType}`);
         const query = dbRef
            .orderByChild("filenameLower")
            .startAt(search)
            .endAt(search + "\uf8ff");

         const snapshot = await query.once("value");
         if (!snapshot.exists()) {
            return resolve({
               message: "User not found",
               status: "NO_USER",
               data: [],
            });
         }

         const files = snapshot.val() || {};
         const filesArray = Object.entries(files);

         resolve({
            message: "Files fetched successfully",
            status: "ok",
            data: filesArray,
         });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR", data: [] });
      }
   });
}

/* --------------------------------------------------
               Fetches form flipkart
-------------------------------------------------- */
function getProductData(url) {
   return new Promise(async (resolve) => {
      try {
         const res = await fetch(url);
         const text = await res.text();
         let price1 = text.match(/<div class="Nx9bqj CxhGGd">.*?₹([\d,]+)/s);
         let price2 = text.match(/<div class="yRaY8j A6\+E6v">.*?([\d,]+)/s);

         if (!price2) {
            price1 = text.match(
               /<div class="css-175oi2r r-18u37iz r-1wtj0ep r-1awozwy">.*?>₹([\d,]+)</s
            );
            price2 = text.match(
               /<div class="css-175oi2r r-18u37iz r-1wtj0ep r-1awozwy">.*?>([\d,]+)</s
            );
         }

         const sellingMRP = price1 ? price1[1].replace(/,/g, "") : null;
         const MRP = price2 ? price2[1].replace(/,/g, "") : null;

         resolve({
            sellingMRP,
            MRP,
         });
      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}

function searchProduct(productId, sellerId) {
   return new Promise(async (resolve) => {
      const url = `https://seller.flipkart.com/napi/listing/searchProduct?fsnSearch=${productId}&sellerId=${sellerId}`;
      const response = await fetch(url);
      resolve(response.json());
   });
}

function checkApprovalStatus(vertical, brand) {
   return new Promise(async (resolve) => {
      try {
         const url = `https://seller.flipkart.com/napi/regulation/approvalStatus?vertical=${vertical}&brand=${brand}`;
         const response = await fetch(url);
         const result = await response.json();
         resolve({
            isError: false,
            is: result.approvalStatus === "APPROVED",
         });
      } catch (error) {
         resolve({ isError: true, is: null });
      }
   });
}

function getProductIdToSKUId(fkCsrfToken, productId) {
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

         const data = await response.json();

         if (data?.count > 0) {
            const { listing_data_response } = data;
            const { sku_id, imageUrl, internal_state } =
               listing_data_response?.[0];
            return resolve({
               isError: false,
               is: true,
               sku_id,
               imageUrl,
               internal_state,
            });
         }

         resolve({ isError: false, is: false });
      } catch (error) {
         resolve({ isError: true, is: false });
      }
   });
}

function getOrganizeListing(data, fkCsrfToken, productId) {
   return new Promise(async (resolve) => {
      const listingDataLength = Object.keys(data).length;

      const { is, sku_id, imageUrl, internal_state } =
         listingDataLength > 0
            ? data?.[productId] || {}
            : await getProductIdToSKUId(fkCsrfToken, productId);

      resolve({ isError: false, is, sku_id, imageUrl, internal_state });
   });
}

function verifyProductUsingUserData(product, fkCsrfToken, listingData) {
   return new Promise(async (resolve) => {
      try {
         // Search for product details
         const { is, sku_id, imageUrl, internal_state } =
            await getOrganizeListing(listingData, fkCsrfToken, product.id);

         if (is) {
            const data = await getMinSellerPrice(product.id);

            if (!data) {
               resolve({ isError: false, is: false, sku_id: null, internal_state: null, alreadySelling: false, imageUrl, error: "Server error" });
               return;
            }

            resolve({
               isError: false,
               alreadySelling: true,
               error: null,
               is: true,
               internal_state,
               sku_id,
               imageUrl,
               sellersInfo: data,
            });
         } else {
            const { brand, vertical, media } = product;

            // Construct image URL
            const imageWidth = 600;
            const imageHeight = 600;
            const imageQuality = 70;
            const imageUrl = media.images?.[0]?.url
               ?.replace("{@width}", imageWidth)
               ?.replace("{@height}", imageHeight)
               ?.replace("{@quality}", imageQuality);

            const result = await checkApprovalStatus(vertical, brand);

            if (result?.isError) {
               resolve({ isError: false, is: false, sku_id: null, internal_state: null, alreadySelling: false, imageUrl, error: "Server error" });
               return;
            }

            if (result.is) {
               const data = await getMinSellerPrice(product.id);

               if (!data) {
                  resolve({ isError: false, is: false, sku_id: null, internal_state: null, alreadySelling: false, imageUrl, error: "Server error" });
                  return;
               }

               resolve({
                  isError: false,
                  is: true,
                  sku_id: null,
                  internal_state: null,
                  alreadySelling: false,
                  imageUrl,
                  error: null,
                  sellersInfo: data,
               });
            } else {
               resolve({ isError: false, is: false, sku_id: null, internal_state: null, alreadySelling: false, imageUrl, error: "Not approved" });
            }
         }
      } catch (error) {
         resolve({ isError: true, is: false, sku_id: null, internal_state: null, alreadySelling: false, imageUrl, error: error.message });
         console.log("Error verifying product:", error);
      }
   });
}

function processBatchForVerification(
   products,
   fkCsrfToken,
   startIdx,
   sellerListingData
) {
   return new Promise(async (resolve) => {
      const batch = products.slice(startIdx, startIdx + BATCH_SIZE);

      if (batch.length === 0) {
         resolve([]);
         return;
      }

      try {
         const batchPromises = batch.map(async (product) => {
            try {
               const result = await verifyProductUsingUserData(
                  product,
                  fkCsrfToken,
                  sellerListingData
               );

               if (result?.isError) {
                  throw new Error("Too many requests");
               }

               if (result?.is) {
                  const { alreadySelling, imageUrl, sku_id, internal_state, sellersInfo } =
                     result;
                  return {
                     ...product,
                     alreadySelling,
                     imageUrl,
                     sku_id,
                     internal_state,
                     sellersInfo,
                  };
               }
               return null;
            } catch (error) {
               if (error.message === "Too many requests") {
                  throw error; // Propagate rate limit error up
               }
               console.log(`Error verifying product ${product.id}:`, error);
               return null;
            }
         });

         try {
            const results = await Promise.all(batchPromises);
            const validResults = results.filter((result) => result !== null);
            resolve(validResults);
         } catch (error) {
            if (error.message === "Too many requests") {
               resolve({ isError: true, error: "Too many requests" });
            } else {
               resolve([]);
            }
         }
      } catch (error) {
         console.error("Error processing batch:", error);
         resolve([]);
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

         // [[10,20,32],[5,6,3]] convert to [10,20,32,5,6,3]
         const products = slots
            ?.map((slot) => slot?.widget?.data?.products)
            ?.filter((x) => x)
            ?.flat()
            ?.map((product) => {
               const {
                  id,
                  titles,
                  rating,
                  pricing,
                  vertical,
                  productBrand: brand,
                  media,
               } = product?.productInfo?.value;

               if (pricing) {
                  const { mrp, finalPrice } = pricing;
                  return {
                     id,
                     titles,
                     rating,
                     mrp,
                     media,
                     finalPrice,
                     vertical,
                     brand,
                  };
               } else {
                  return {
                     id,
                     titles,
                     rating,
                     mrp: 0,
                     finalPrice: 0,
                     vertical,
                     media,
                     brand,
                  };
               }
            });

         resolve(products);
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
         const {
            ID,
            SKU,
            SELLING_PRICE,
            MRP,
            LISTING_STATUS,
            PROCUREMENT_TYPE,
            SHIPPING_DAYS,
            STOCK_SIZE,
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
            flipkart_selling_price: [
               { value: SELLING_PRICE, qualifier: "INR" },
            ],
            hsn: [{ value: HSN, qualifier: "" }],
            listing_status: [{ value: LISTING_STATUS, qualifier: "" }],
            local_shipping_fee_from_buyer: [
               { value: DELIVERY_LOCAL, qualifier: "INR" },
            ],
            luxury_cess: [{ qualifier: "Percentage" }],
            manufacturer_details: [
               { value: MANUFACTURER_DETAILS, qualifier: "" },
            ],
            minimum_order_quantity: [
               { value: MINIMUM_ORDER_QUANTITY, qualifier: "" },
            ],
            mrp: [{ value: MRP, qualifier: "INR" }],
            national_shipping_fee_from_buyer: [
               { value: DELIVERY_NATIONAL, qualifier: "INR" },
            ],
            packer_details: [{ value: PACKER_DETAILS, qualifier: "" }],
            procurement_type: [{ value: PROCUREMENT_TYPE, qualifier: "" }],
            service_profile: [{ value: "NON_FBF", qualifier: "" }],
            shelf_life: [{ value: SHELF_LIFE, qualifier: "Months" }],
            shipping_days: [{ value: SHIPPING_DAYS, qualifier: "HR" }],
            shipping_provider: [{ value: "FLIPKART", qualifier: "" }],
            stock_size: [{ value: STOCK_SIZE, qualifier: "" }],
            tax_code: [{ value: "GST_5", qualifier: "" }],
            zonal_shipping_fee_from_buyer: [
               { value: DELIVERY_ZONAL, qualifier: "INR" },
            ],
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
      sendUpdateLoadingPercentage((1 / len) * 100, "yellow"); // After first batch

      // Process first batch
      data.map(({ product_id, imageUrl, internal_state, sku_id }) => {
         listingData[product_id] = {
            imageUrl,
            internal_state,
            sku_id,
            is: true,
         };
      });

      // Create array of promises for remaining batches
      const promises = Array.from({ length: len }, (_, i) =>
         fetchListingSellerData(i + 1, fkCsrfToken, state)
      );

      // Execute all promises in parallel and track progress
      let completedBatches = 0;
      const results = await Promise.all(
         promises.map(async (promise, i) => {
            const result = await promise;
            completedBatches++;
            // Calculate percentage from 10 to 95 based on completed batches
            const percentage = Math.round(((i + 1) / len) * 100);
            sendUpdateLoadingPercentage(percentage, "yellow");
            return result;
         })
      );

      // Process all results
      results.forEach(({ data }) => {
         data.map(({ product_id, imageUrl, internal_state, sku_id }) => {
            listingData[product_id] = {
               imageUrl,
               internal_state,
               sku_id,
               is: true,
            };
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

      resolve({ count: c1 + c2 + c3, data: { ...d1, ...d2, ...d3 } });
   });
}

function getMinSellerPrice(productId) {
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
         const { vertical, productBrand, subTitle, title } =
            productSummary?.value;

         const newData = data.map(({ value }) => {
            // seller info
            const id = value?.sellerInfo?.value?.id;
            const name = value?.sellerInfo?.value?.name;

            // price info
            const FKFP = value?.npsListing?.pnp_lite_listing_info?.priceInfo?.pricePoints?.FKFP || 9999;
            const MRP = value?.npsListing?.pnp_lite_listing_info?.priceInfo?.pricePoints?.MRP || 99999;

            // shipping fees
            const local_shipping_fee = value?.npsListing?.shipping_fees?.local_shipping_fee || 0;
            const zonal_shipping_fee = value?.npsListing?.shipping_fees?.zonal_shipping_fee || 0;
            const national_shipping_fee = value?.npsListing?.shipping_fees?.national_shipping_fee || 19;

            const isFAssured = value?.npsListing?.listing_tier === "FASSURED";

            return {
               productId,
               sellerId: id,
               sellerName: name,
               isFAssured,
               finalPrice: FKFP?.value,
               totalPrice: (FKFP?.value || 0) + Math.min(local_shipping_fee?.amount, national_shipping_fee?.amount, zonal_shipping_fee?.amount),
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
            sellers,
            brand: productBrand,
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

// getMinSellerPrice("PAEGGREHZTG9CNTQ");
