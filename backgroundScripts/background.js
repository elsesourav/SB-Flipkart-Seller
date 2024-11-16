importScripts("./../utils.js", "./bgUtils.js");

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


function getProductData(url) {
   return new Promise(async (resolve) => {
      try {
         const res = await fetch(url);
         const text = await res.text();
         const price1 = text.match(/<div class="Nx9bqj CxhGGd">.*?₹(\d+)/s);
         const price2 = text.match(/<div class="yRaY8j A6\+E6v">.*?(\d+)/s);
         resolve({
            sellingMRP: price1 ? price1[1] : null,
            MRP: price2 ? price2[1] : null
         });

      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}
// getProductData("http://www.flipkart.com/product/p/itme?pid=PAEH5MFHZYMKTAJK");
// getProductData("https://www.flipkart.com/search?q=lotus+seed&otracker=search&otracker2=&page=3");

runtimeOnMessage("c_b_get_product_data", async (data, _, sendResponse) => {
   sendResponse(await getProductData(data.url));
});

runtimeOnMessage("c_b_update_single_listing", (values, _, sendResponse) => {
   sendResponse({ status: "ok" });
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      for (const key in val) {
         if (values[key]) {
            val[key] = values[key];
         }
      }
      chromeStorageSetLocal(storageSingleListKey, val);
   });
});
runtimeOnMessage("c_b_single_listing_request", (__, _, sendResponse) => {
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      sendResponse(val);
   });
});
