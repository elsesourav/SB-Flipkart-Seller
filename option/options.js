const matchNames = document.getElementById("matchNames");
const searchProduct = document.getElementById("searchProduct");
const rating = document.getElementById("rating");
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");
const sellerId = document.getElementById("sellerId");
const submitButton = document.getElementById("submit");

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const iframe = document.getElementById("showPreview");
const iframeDoc = iframe?.contentDocument || iframe.contentWindow.document;
const iframeBody = iframeDoc.body;

function getProductData(url) {
   return new Promise(async (resolve) => {
      try {
         const res = await fetch(url);
         const text = await res.text();
         resolve(text);
      } catch (error) {
         console.log(error);
         resolve(null);
      }
   });
}

function getBase64ImageData(img) {
   canvas.width = img.width;
   canvas.height = img.height;
   context.drawImage(img, 0, 0);
   return canvas.toDataURL("image/jpeg");
}

async function areAllImagesLoaded(images) {
   return Promise.all(
      Array.from(images).map((img) => {
         return new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
               // Image is already loaded
               resolve(true);
            } else {
               // Wait for the image to load or fail
               img.addEventListener("load", () => resolve(true), {
                  once: true,
               });
               img.addEventListener("error", () => resolve(false), {
                  once: true,
               });
            }
         });
      })
   ).then(() => true); // Resolve true when all promises are resolved
}

async function getFlipkartSearchData(name, pageNo) {
   const info = {};
   const productName = name?.trim()?.split(" ").join("+");
   const url = `${URLS.flipkartSearch}${productName}&page=${pageNo}`;
   const productData = await getProductData(url);
   iframeDoc.documentElement.innerHTML = productData;

   const products = Array.from(
      iframeDoc.documentElement.querySelectorAll(
         `.cPHDOP:not([style="display: none !important;"]) ._75nlfW > div`
      )
   );

   await areAllImagesLoaded(
      products.map((product) => product.querySelector("a.VJA3rP ._4WELSP img"))
   );

   products.forEach((product) => {
      const name = product.querySelector(".wjcEIp")?.textContent;
      const id = product.getAttribute("data-id");
      const image = product.querySelector("a.VJA3rP ._4WELSP img");
      const base64 = getBase64ImageData(image);
      const unit = product.querySelector(".NqpwHC")?.textContent;
      const rating = product.querySelector(".XQDdHH")?.textContent || 0;
      const sellingPrice = product
         .querySelector(".Nx9bqj")
         ?.textContent?.trim();
      const originalPrice = product
         .querySelector(".yRaY8j")
         ?.textContent?.trim();
      info[id] = { name, base64, unit, rating, sellingPrice, originalPrice };
   });

   return info;
}

submitButton.addEventListener("click", async () => {
   const productName = searchProduct.value;
   if (!productName) return;

   const startingPage = startPage.value?.trim() || 1;
   const endingPage = endPage.value?.trim() || 1;
   const sid = sellerId.value?.trim() || 1;

   const data = {
      productName,
      startingPage,
      endingPage,
      sellerId: sid,
   };

   const filterSkus = await getMappingPossibleProductData(data);
   console.log(filterSkus);
});

function getMappingPossibleProductData(data) {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_mapping_possible_product_data", data, (r) => {
         resolve(r);
      });
   });
}
