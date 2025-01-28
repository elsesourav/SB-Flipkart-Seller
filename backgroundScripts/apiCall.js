/* --------------------------------------------------
               Fetches form Firebase 
-------------------------------------------------- */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

async function createUser(username, password) {
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
         resolve({ message: "User created successfully", status: "Success" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "Error" });
      }
   });
}

async function exportFile(username, fileType, filename, data, password) {
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
               status: "Error",
            });
         }

         const { yy, mm, dd, hh, ss, ms } = DATE();

         const fileRef = dbRef.child(
            `${fileType}/${filename}-${dd}-${mm}-${yy}--${hh}:${ss}:${ms}`
         );
         await fileRef.set({
            id: Date.now().toString(36).toUpperCase(),
            filename,
            data,
            date: `${dd}-${mm}-${yy} | ${hh}:${ss}`,
         });
         resolve({ message: "File exported successfully", status: "Success" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

async function importFile(username, fileType, filename) {
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

async function deleteFile(username, fileType, filename, password) {
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

         const fileRef = dbRef.child(`${fileType}/${filename}`);
         await fileRef.remove();
         resolve({ message: "File deleted successfully", status: "Success" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

async function getFiles(username, fileType, search = "") {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}/${fileType}`);
         const query = dbRef
            .orderByChild("filename")
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
         const filteredFiles = Object.entries(files);

         resolve({
            message: "Files fetched successfully",
            status: "ok",
            data: filteredFiles,
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

function searchProduct(sku, sellerId) {
   return new Promise(async (resolve) => {
      const url = `https://seller.flipkart.com/napi/listing/searchProduct?fsnSearch=${sku}&sellerId=${sellerId}`;
      const response = await fetch(url);
      resolve(response.json());
   });
}

function checkApprovalStatus(vertical, brand, sellerId) {
   return new Promise(async (resolve) => {
      const url = `https://seller.flipkart.com/napi/regulation/approvalStatus?vertical=${vertical}&brand=${brand}&sellerId=${sellerId}`;
      const response = await fetch(url);
      const result = await response.json();
      resolve(result.approvalStatus === "APPROVED");
   });
}

function processBatchForVerification(products, sellerId, startIdx) {
   return new Promise(async (resolve) => {
      const batch = products.slice(startIdx, startIdx + BATCH_SIZE);

      if (batch.length === 0) {
         resolve([]);
         return;
      }

      try {
         const batchPromises = batch.map(async (product) => {
            try {
               const result = await verifyProduct(product.id, sellerId);
               if (result.is) {
                  return {
                     ...product,
                     imageUrl: result.imageUrl,
                  };
               }
               return null;
            } catch (error) {
               console.log(`Error verifying product ${product.id}:`, error);
               return null;
            }
         });

         const results = await Promise.all(batchPromises);
         const validResults = results.filter((result) => result !== null);
         resolve(validResults);
      } catch (error) {
         console.error("Error processing batch:", error);
         resolve([]);
      }
   });
}

function GET_FK_CSRF_TOKEN() {
   return new Promise(async (resolve) => {
      try {
         const res = await fetch(URLS.flipkartSellerIndexPage);
         const text = await res?.text();
         const regex = /id="seller_session_unique_token" value="([^"]+)"/;
         const match = text?.match(regex)?.[1];
         const token = match === "undefined" ? null : match;
         resolve(token);
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

function processBatchForMapping(products, startIdx) {
   return new Promise(async (resolve) => {
      const batch = products.slice(startIdx, startIdx + BATCH_SIZE);

      if (batch.length === 0) {
         resolve([]);
         return;
      }

      try {
         const batchPromises = batch.map(async (product) => {
            try {
               const result = await createProductMapping(product);
               if (result.is) return product;
               return null;
            } catch (error) {
               console.log(`Error mapping product ${product.ID}:`, error);
               return null;
            }
         });

         const results = await Promise.all(batchPromises);
         console.log(results);

         resolve(results);
      } catch (error) {
         console.error("Error processing mapping batch:", error);
         resolve([]);
      }
   });
}

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
            flipkart_selling_price: [{ value: SELLING_PRICE, qualifier: "INR" }],
            hsn: [{ value: HSN, qualifier: "" }],
            listing_status: [{ value: LISTING_STATUS, qualifier: "" }],
            local_shipping_fee_from_buyer: [
               { value: DELIVERY_LOCAL, qualifier: "INR" },
            ],
            luxury_cess: [{ qualifier: "Percentage" }],
            manufacturer_details: [{ value: MANUFACTURER_DETAILS, qualifier: "" }],
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
            resolve({ status: "error", is: false });
            return;
         }

         const data = await response.json();
         resolve({ status: "ok", is: true, bulkResponse: data?.result?.bulkResponse });
      } catch (error) {
         console.log("Error mapping product:", error);
         resolve({ status: "error", is: false });
      }
   });
}


function createProductMapping(DATA) {
   return new Promise(async (resolve) => {
      const {
         ID,
         SELLER_ID,
         FK_CSRF_TOKEN,
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
      } = DATA;

      const HEADER = {
         accept: "*/*",
         "content-type": "application/json",
         "fk-csrf-token": FK_CSRF_TOKEN,
      };

      const PRODUCT_DATA = {
         sku_id: [{ value: SKU, qualifier: "" }],
         country_of_origin: [{ value: "IN", qualifier: "" }],
         earliest_mfg_date: [{ value: EARLIEST_MFG_DATE, qualifier: "" }],
         flipkart_selling_price: [{ value: SELLING_PRICE, qualifier: "INR" }],
         hsn: [{ value: HSN, qualifier: "" }],
         listing_status: [{ value: LISTING_STATUS, qualifier: "" }],
         local_shipping_fee_from_buyer: [
            { value: DELIVERY_LOCAL, qualifier: "INR" },
         ],
         luxury_cess: [{ qualifier: "Percentage" }],
         manufacturer_details: [{ value: MANUFACTURER_DETAILS, qualifier: "" }],
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

      const REQUEST_BODY = {
         sellerId: SELLER_ID,
         bulkRequests: [
            {
               attributeValues: PRODUCT_DATA,
               context: { ignore_warnings: true },
               packages: [PACKAGE_DATA],
               productId: ID,
               skuId: SKU,
            },
         ],
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
            resolve({ status: "error", is: false, id: ID });
            return;
         }

         const data = await response.json();

         resolve({ status: "ok", is: true, id: ID, data });
      } catch (error) {
         console.log("Error mapping product:", error);
         resolve({ status: "error", is: false, id: ID });
      }
   });
}

