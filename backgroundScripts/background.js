importScripts("./../utils.js", "./bgUtils.js");
console.log("background loaded");

runtimeOnMessage("c_b_update_mapping", (values, _, sendResponse) => {
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


function getProductData(url) {
   return new Promise(async (resolve) => {
      try {
         const res = await fetch(url);
         const text = await res.text();
         const price1 = text.match(/<div class="Nx9bqj CxhGGd">.*?₹([\d,]+)/s);
         const price2 = text.match(/<div class="yRaY8j A6\+E6v">.*?([\d,]+)/s);

         const sellingMRP = price1 ? price1[1].replace(/,/g, '') : null;
         const MRP = price2 ? price2[1].replace(/,/g, '') : null;

         console.log(sellingMRP, MRP);
         resolve({
            sellingMRP,
            MRP
         });

      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}

function getImagesFromLocalStorage() {
   return new Promise(async (resolve) => {
      const images = [];
      for (let i = 0; i < 8; i++) {
         const image = await chromeStorageGetLocal(`storage-image-${i}`);
         if (image) {
            images.push(image);
         }
      }
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

runtimeOnMessage("c_b_listing_data_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageListingKey, (val) => {
      getImagesFromLocalStorage().then((images) => {
         sendResponse({
            ...val,
            images
         });
      });
   });
});

runtimeOnMessage("c_b_order_data_request", async (__, _, sendResponse) => {
   chromeStorageGetLocal(storageOrdersKey, async (val) => {
      const productsJson = chrome.runtime.getURL("./../assets/unique/products.json");
      try {
         const response = await fetch(productsJson);
         const products = await response.json();
         sendResponse({
            ...val,
            products
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