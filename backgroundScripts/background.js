importScripts("./../utils.js", "./bgUtils.js");
importScripts(
   "./firebaseApp.js",
   "./firebaseDatabase.js",
   "./firebaseConfig.js"
);

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

runtimeOnMessage(
   "c_b_filter_mapping_possible_skus",
   async (vals, _, sendResponse) => {
      console.log(vals);
      sendResponse({ status: "ok" });
      // chrome extension option page send message
      chrome.runtime.sendMessage(
         { type: "b_c_filter_mapping_possible_skus", vals },
         (response) => {
            console.log(response);
         }
      );
   }
);

// function passToContentScriptGetPossibleMapping(tabId, skus) {
//    tabSendMessage(tabId, "b_c_get_possible_mapping", { skus }, async (response) => {
//       console.log(response);
//    });
// }

async function passToContentScriptGoMappingPage(skus) {
   const hiddenTabId = await createTabAndWaitForLoad(
      `${URLS.addMapping}#`,
      true
   );

   tabSendMessage(
      hiddenTabId,
      "b_c_go_mapping_page_using_sku",
      { skus },
      async (response) => {
         console.log(response);
      }
   );
}

// async function filterMappingInNewTab(productsSku) {
//    // create a new tab with hidden mode
//    return new Promise(async (resolve) => {
//       try {
//          const hiddenTab = await createNewHiddenTab(`${URLS.addMapping}#`);

//          passToContentScriptGoMappingPage(hiddenTab, productsSku);
//          console.log(productsSku);
//          resolve(true);

//          // for (const i in productsSku) {
//          //    const sku = productsSku[i];
//          //    console.log(sku);

//          //    // resolve(hiddenTab);
//          // }

//          resolve(hiddenTab);
//       } catch (error) {
//          console.log(error);
//          resolve(null);
//       }
//    });
// }

console.log("background loaded");

runtimeOnMessage(
   "c_b_filter_mapping_possible_sku",
   async ({ skus }, _, sendResponse) => {
      // console.log(values);
      passToContentScriptGoMappingPage(skus);
      sendResponse({ status: "ok" });
   }
);

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
            .map((slot) => slot?.widget?.data?.products)
            .filter((x) => x)
            .flat()
            .map((product) => {
               const { id, titles, rating, pricing } = product?.productInfo?.value;
               const { mrp, finalPrice } = pricing;

               return { id, titles, rating, mrp, finalPrice };
            });

         resolve(products);
      } else {
         console.log(`Error: ${response.status}`);
         resolve(null);
      }
   });
};

// fetchFlipkartSearchData("lotus seeds");


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

function verifyProduct(productName, sellerId) {
   return new Promise(async (resolve) => {
      try {
         
         const res = await fetch(url);
         const text = await res.text();
         
         resolve({ });
      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}

runtimeOnMessage("c_b_get_mapping_possible_product_data", async (data, _, sendResponse) => {
   const { productName, startingPage, endingPage, sellerId } = data;

   const products = [];
   for (let i = startingPage; i <= endingPage; i++) {
      const productData = await fetchFlipkartSearchData(productName, i);
      if (productData) {
         products.push(...productData);
      }
   }
   sendResponse(products);
});


function getImageFilesFromLocalStorage() {
   return new Promise(async (resolve) => {
      const { THUMBNAIL_INDEX } = await chromeStorageGetLocal(
         storageListingKey
      );
      const DATA = await chromeStorageGetLocal(`storage-images-0`);
      const firstImg = DATA?.files[THUMBNAIL_INDEX];
      const images = [];
      if (firstImg) images.push(firstImg);

      for (let i = 1; i < 4; i++) {
         const DATA = await chromeStorageGetLocal(`storage-images-${i}`);
         const img = selectRandomImage(DATA?.files || []);
         if (img) images.push(img);
      }

      // 


      resolve(images);
   });
}

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
