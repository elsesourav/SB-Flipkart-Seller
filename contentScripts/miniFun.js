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
   runtimeSendMessage("c_b_update_single_listing", values, (r) => {
      console.log("Copy Successfully");
   });
}

function getSingleListingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_single_listing_request", (r) => {
         resolve(r);
      });
   });
}

function ifMatchSingleListingLocation() {
   const l = window.location.href;
   return l.includes(URL.singleListing) || l.includes(URL.singleAddListing);
}

function ifFlipkartSearchLocation() {
   return window.location.href.includes(URL.flipkartSearch);
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
function setIfNotValue(element, value, forcefully = false) {
   const el = element[0];
   if (!el) return;

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