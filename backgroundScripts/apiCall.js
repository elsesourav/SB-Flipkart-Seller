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

function exportFile(username, fileType, filename, data, password) {
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

         const fileRef = dbRef.child(
            `${fileType.toLowerCase()}/${filename}-${dd}-${mm}-${yy}--${hh}:${ss}:${ms}`
         );
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

         console.log(sellingMRP, MRP);
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

function checkApprovalStatus(vertical, brand, sellerId) {
   return new Promise(async (resolve) => {
      try {
         const url = `https://seller.flipkart.com/napi/regulation/approvalStatus?vertical=${vertical}&brand=${brand}&sellerId=${sellerId}`;
         const response = await fetch(url);
         const result = await response.json();
         resolve({
            isError: false,
            result: result.approvalStatus === "APPROVED",
         });
      } catch (error) {
         resolve({ isError: true, result: null });
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

function verifyProduct(productId, sellerId, fkCsrfToken) {
   return new Promise(async (resolve) => {
      try {
         // Search for product details

         const { is, sku_id, imageUrl, internal_state } =
            await getProductIdToSKUId(fkCsrfToken, productId);

         if (is) {
            resolve({
               isError: false,
               is: true,
               internal_state,
               sku_id,
               alreadySelling: true,
               imageUrl: imageUrl,
               error: null,
            });
         } else {
            const searchResult = await searchProduct(productId, sellerId);
            const productInfo = searchResult?.result?.productList?.[0];

            if (!productInfo) {
               resolve({
                  isError: false,
                  is: false,
                  error: "Product not found",
               });
               return;
            }

            const { detail, alreadySelling, vertical, imagePaths } =
               productInfo;
            const imageUrl = Object.values(imagePaths)?.[0];

            const result = await checkApprovalStatus(
               vertical,
               detail.Brand,
               sellerId
            );

            if (result?.isError) {
               resolve({ isError: true, is: false, error: "Server error" });
               return;
            }

            resolve({
               isError: false,
               is: result?.result,
               sku_id: null,
               internal_state: null,
               alreadySelling: alreadySelling,
               imageUrl: result?.result ? imageUrl : null,
               error: result?.result ? null : "Not approved",
            });
         }
      } catch (error) {
         resolve({ isError: false, error: error.message });
         console.log("Error verifying product:", error);
      }
   });
}

function processBatchForVerification(
   products,
   sellerId,
   fkCsrfToken,
   startIdx
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
               const result = await verifyProduct(
                  product.id,
                  sellerId,
                  fkCsrfToken
               );

               if (result?.isError) {
                  throw new Error("Too many requests");
               }

               if (result?.is) {
                  const { alreadySelling, imageUrl, sku_id, internal_state } =
                     result;
                  return {
                     ...product,
                     alreadySelling,
                     imageUrl,
                     sku_id,
                     internal_state,
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
         const json = await res.json();
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

// fetch("", {
//    method: "GET",
//    headers: {
//        "Accept": "application/json, text/javascript, */*; q=0.01",
//        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
//        "X-Requested-With": "XMLHttpRequest"
//    },
//    credentials: "include" // If authentication is required
// })
// .then(response => response.json()) // Convert response to JSON
// .then(data => console.log(data)) // Handle the response data
// .catch(error => console.error("Error fetching data:", error));

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
               const { id, titles, rating, pricing } =
                  product?.productInfo?.value;
               if (pricing) {
                  const { mrp, finalPrice } = pricing;
                  return { id, titles, rating, mrp, finalPrice };
               } else {
                  return { id, titles, rating, mrp: 0, finalPrice: 0 };
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
            ALREADY_LISTING,
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

         console.log(response);

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
