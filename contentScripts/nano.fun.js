async function getProductData(url) {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_get_product_data", { url }, (r) => {
         resolve(r);
      });
   });
}

function getMappingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_mapping_request", (r) => {
         resolve(r);
      });
   });
}
function updateMappingValues(values) {
   runtimeSendMessage("c_b_update_mapping", values, (r) => {
      console.log("Copy Successfully");
   });
}
function updateListingValues(values) {
   runtimeSendMessage("c_b_listing_data_update", values, (r) => {
      console.log("Copy Successfully");
   });
}

function getListingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_listing_data_request", (r) => {
         resolve(r);
      });
   });
}
function updateListingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_listing_data_update", (r) => {
         resolve(r);
      });
   });
}

function getOrderData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_order_data_request", (r) => {
         resolve(r);
      });
   });
}

function ifMatchSingleListingLocation() {
   const l = window.location.href;
   return l.includes(URLS.singleListing) || l.includes(URLS.singleAddListing);
}

function ifMatchSingleOrderLocation() {
   return window.location.href.includes(URLS.singleOrder);
}

function ifFlipkartSearchLocation() {
   return window.location.href.includes(URLS.flipkartSearch);
}

function ifHaveSaveButton() {
   const [isSaveBtn] = [
      ...document.querySelectorAll(`[data-testid="button"]`),
   ].filter((e) => e.innerText == "Save & Go Back");

   return isSaveBtn;
}

function ifHaveFloatingDialog() {
   return document.querySelector(
      `.ReactModalPortal > div > div[role="dialog"]`
   );
}

function saveButtonClick() {
   const buttons = [...document.querySelectorAll(`[data-testid="button"]`)];
   const [btn] = buttons.filter((e) => e.innerText.trim() == "Save");
   btn?.setAttribute("id", "__save_button__");
   btn?.click();
}

function closeButtonClick() {
   document
      .querySelectorAll(`a ~ button[data-testid="button"]`)[0]
      .parentNode.querySelector("a")
      ?.click();
}



// --------------- Set Value if Not Value ---------------
function setInput(element, value, forcefully = true) {
   const el = element[0];
   if (!el || value === "") return;

   const currentValue = el.value?.trim();
   const isEmpty = !currentValue || currentValue === "Select One";

   if (isEmpty || forcefully) {
      el.value = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
   }
}

// --------------- Set Multiple Values ---------------
function setupMultipleValues(idName, _string) {
   const values = _string.split("_");

   if (document.querySelectorAll(`#${idName}`).length === 1) {
      values.forEach(async (str, i) => {
         const elements = document.querySelectorAll(`#${idName}`);
         if (elements.length > 0) {
            const len = elements.length;

            elements[len - 1].value = str;
            const event = new Event("change", { bubbles: true });
            elements[len - 1]?.dispatchEvent(event);

            if (i < values.length - 1) {
               const buttons = [...elements].map((e) =>
                  e.parentNode.parentNode.parentNode.querySelector("button")
               );

               buttons[buttons.length - 1].click();
            }
         }
         await wait(30);
      });
   }
}

function setupMultipleKeywords(idName, _string) {
   const values = selectUniqueElements(_string.split("_"), 2);
   if (document.querySelectorAll(`#${idName}`).length === 1) {
      values.forEach(async (str, i) => {
         const elements = document.querySelectorAll(`#${idName}`);
         if (elements.length > 0) {
            const len = elements.length;

            elements[len - 1].value = str;
            const event = new Event("change", { bubbles: true });
            elements[len - 1]?.dispatchEvent(event);

            if (i < values.length - 1) {
               const buttons = [...elements].map((e) =>
                  e.parentNode.parentNode.parentNode.querySelector("button")
               );

               buttons[buttons.length - 1].click();
            }
         }
         await wait(30);
      });
   }
}

// --------------- Set Multiple Values By Index ---------------
function setupMultipleValuesBYIndex(idName, _string) {
   const intValues = _string.split("_").map((e) => parseInt(e));

   if (document.querySelectorAll(`#${idName}`).length === 1) {
      const parent = I(`#${idName}`)[0].parentNode.parentNode.parentNode
         .parentNode;

      intValues.forEach(async (n, i) => {
         const elements = I(`#${idName}`, parent);
         const len = elements.length;

         if (len > 0) {
            elements[len - 1].selectedIndex = n;
            const event = new Event("change", { bubbles: true });
            elements[len - 1].dispatchEvent(event);

            if (i < intValues.length - 1) {
               const buttons = I("button", parent);
               const [btn] = [...buttons].filter((e) => e.innerText === "+");
               btn?.click();
            }
         }
         await wait(30);
      });
   }
}


// --------------- Set Value in Object ---------------
function setInObject(element, proName) {
   tempVal[proName] = element[0]?.value;
}

// --------------- Set Multiple Values in Object ---------------
function multipleValueSetInObj(idName, proName) {
   const elements = document.querySelectorAll(`#${idName}`);
   tempVal[proName] = [...elements].map((e) => e.value).join("_");
}

// --------------- Set Multiple Values in Object By Index ---------------
function multipleValueSetInObjByIndex(idName, proName) {
   const elements = document.querySelectorAll(`#${idName}`);
   tempVal[proName] = [...elements].map((e) => e.selectedIndex).join("_");
}

function getBengaliQuantity(text, data, isBengaliNumber = false) {
   const [a, b] = text.split(" ");
   let num = parseInt(a);
   if (isBengaliNumber) num = toBengaliNumber(num);

   return [num, data.typeInBengali[b.toLowerCase()]];
}

function getBengaliUnit(num, data) {
   return [toBengaliNumber(num), data.typeInBengali.times];
}

function extractNumbers(input) {
   const regex = /(\d+(\.\d+)?)([a-zA-Z]+)/g;
   const numbers = [];

   let match;
   while (match = regex.exec(input)) {
      let value = parseFloat(match[1]);
      const unit = match[3].toUpperCase();

      if (unit === "KG") {
         value *= 1000;
      }

      numbers.push({ value, unit });
   }

   numbers.sort((a, b) => {
      if (a.unit === "P" && b.unit !== "P") return -1;
      if (a.unit !== "P" && b.unit === "P") return 1;
      return a.value - b.value;
   });

   return numbers.map(item => item.value);
}

function getDeliveryCharges(data) {
   return [N(data?.DELIVERY_LOCAL || 39), N(data?.DELIVERY_NATIONAL || 59), N(data?.DELIVERY_ZONAL || 39)];
}

function getUniqueId() {
   // const original = "1733" + parseInt(getUniqueId, 36) + "000";
   return parseInt(Date.now().toString().slice(4, -3)).toString(36).toUpperCase();
}

function getProductCost(data, quantity, value) {
   return value === "PIECE" ?
      (N(data?.UNIT_OF_COST || 200) / N(data?.UNIT || 1)) * N(quantity) :
      (N(data?.UNIT_OF_COST || 200) / N(data?.UNIT_WEIGHT || 1)) * (N(quantity) / (value === "KG" ? 1 : 1000));
}

function getTotalWeight(data, quantity, value) {
   console.log(data, quantity, value);
   
   return (N(data?.PACKET_WEIGHT || 1) +
      (value === "PIECE" ? (N(data?.UNIT_WEIGHT || 1) / N(data?.UNIT || 1)) * N(quantity) :
         (N(quantity) / (value === "G" ? 1000 : 1)))).toFixed(3);
}

function getUnitToPiece(data, value, quantity) {
   if (value == "PIECE") {
      return quantity;
   } else {
      const W = N(data?.UNIT || 1) / (N(data?.UNIT_WEIGHT || 1) * 1000);
      return W * quantity * (value === "KG" ? 1000 : 1);
   }
}


/* --------------- Copy Listing Inputs --------------- */

function selectRandomImages(images, fixedCount = 3) {
   if (images.length > 4) {
      images = selectUniqueElements(images, fixedCount);
   }
   return images;
}

function putImagesIntoListing(images, editButtons) {
   return new Promise(async (resolve) => {
      if (images.length >= 0) {
         editButtons[0].click();
         await wait(500);

         for (let i = 0; i < 4; i++) {
            await wait(500);
            I(`#thumbnail_${i} > div`)[0].click();

            if (images[i]) {
               const fileInput = I("#upload-image")[0];
               if (fileInput) putImageIntoInputFile(fileInput, images[i].file);
               await waitForUploadingImage();
               await wait(500);
            } else {
               await wait(50);
               I(".jDWxNA .iuIlzu i")[0]?.click();
               await wait(100);
               I(".jDWxNA .ewbxDW")[1]?.click();
            }
         }

         await wait(300);
         saveButtonClick();
         await waitingForSaved();
         await wait(500);
         resolve(true);
      }
      resolve(false);
   });
}

function selectUniqueElements(arr, fixedCount = 2) {
   if (arr.length <= 4) return arr;

   const fixedElements = arr.slice(0, fixedCount);
   const remainingElements = arr.slice(fixedCount);
   const shuffled = [...remainingElements].sort(() => Math.random() - 0.5);
   const selected = shuffled.slice(0, 4 - fixedCount);
   return [...fixedElements, ...selected];
}