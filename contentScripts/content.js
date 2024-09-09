let = tempVal = {};

function getMappingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_mapping_request", (r) => {
         resolve(r);
      });
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

function waitingForSaved() {
   return new Promise((resolve) => {
      async function loop() {
         if (!I("#__save_button__")[0]) {
            resolve();
         } else {
            await wait(30);
            loop();
         }
      }
      loop();
   });
}

function waitForUploadingImage() {
   return new Promise((resolve) => {
      async function loop() {
         if (!I("#upload-image")[0]) {
            resolve();
         } else {
            await wait(30);
            loop();
         }
      }
      loop();
   });
}

function setup_single_listing() {
   let openBtn, copyBtn;
   CE(
      { id: "__fwl__", style: style.fw },
      (openBtn = CE({ style: style.btn }, "Fill Inputs")),
      (copyBtn = CE({ style: style.btn + style.copyBtn }, "Copy Inputs"))
   ).parent(document.body);

   openBtn.addEventListener("click", async () => {
      const editButtons = I('#sub-app-container .hTTPSU[data-testid="button"]');

      // fill Images
      const val = await getSingleListingData();
      const images = [
         val.image_0,
         val.image_1,
         val.image_2,
         val.image_3,
      ].filter((e) => e?.url);

      if (images.length > 0) {
         editButtons[0].click();
         await wait(500);

         for (let i = 0; i < images.length; i++) {
            if (images[i]) {
               await wait(200);
               I(`#thumbnail_${i} > div`)[0].click();
               const fileInput = I("#upload-image")[0];
               if (fileInput) putImageIntoInputFile(fileInput, images[i].url);
               await waitForUploadingImage();
               await wait(200);
            }
         }

         await wait(300);
         saveButtonClick();
         await waitingForSaved();
         await wait(500);
      }

      // ------- Price, Stock and Shipping Information

      editButtons[1].click();
      await wait(500);

      setIfNotValue(I("#sku_id"), val?.seller_SKU_ID || "SBarui");

      setIfNotValue(I("#listing_status"), val?.listing_status || false);

      setIfNotValue(I("#mrp"), val?.mrp || 499);

      setIfNotValue(
         I("#flipkart_selling_price"),
         val?.your_selling_price || 499
      );

      setIfNotValue(
         I("#minimum_order_quantity"),
         val?.minimum_order_quantity || 1
      );

      setIfNotValue(I("#service_profile"), "NON_FBF");

      setIfNotValue(I("#procurement_type"), val?.procurement_type || 1);

      setIfNotValue(I("#shipping_days"), val?.shipping_days || 1);

      setIfNotValue(I("#stock_size"), val?.stock_size || 1);

      setIfNotValue(I("#shipping_provider"), "FLIPKART");

      setIfNotValue(
         I("#local_shipping_fee_from_buyer"),
         val?.local_shipping_fee_from_buyer || 1
      );

      setIfNotValue(
         I("#zonal_shipping_fee_from_buyer"),
         val?.zonal_shipping_fee_from_buyer || 1
      );

      setIfNotValue(
         I("#national_shipping_fee_from_buyer"),
         val?.national_shipping_fee_from_buyer || 1
      );

      setIfNotValue(I("#length"), val?.length_p0 || 1);

      setIfNotValue(I("#breadth"), val?.breadth_p0 || 1);

      setIfNotValue(I("#height"), val?.height_p0 || 1);

      setIfNotValue(I("#weight"), val?.weight_p0 || 1);

      setIfNotValue(I("#hsn"), val?.hsn || 1);

      setIfNotValue(I("#tax_code"), "GST_5");

      setIfNotValue(I("#country_of_origin"), "IN");

      setIfNotValue(I("#manufacturer_details"), val?.manufacturer_details || 1);

      setIfNotValue(I("#packer_details"), val?.packer_details || 1);

      setIfNotValue(I("#earliest_mfg_date"), val?.earliest_mfg_date || 1);

      setIfNotValue(I("#shelf_life"), val?.shelf_life || 1);

      setIfNotValue(I("[name='shelf_life_0_qualifier']"), "MONTHS");

      await wait(500);
      saveButtonClick();
      await waitingForSaved();
      await wait(500);

      // ------- Product Description
      editButtons[2].click();
      await wait(500);

      setIfNotValue(I("#model_name"), val?.model_id || 1);

      setupMultipleValues("common_name", val?.common_name || "");

      setIfNotValue(I("#quantity"), val?.quantity || 1);

      setIfNotValue(I("[name='quantity_0_qualifier']"), val?.quantity_in || "");

      setupMultipleValuesBYIndex("suitable_for", val?.suitable_for || "");

      setIfNotValue(I("#organic"), val?.organic || 1);

      setupMultipleValues("sales_package", val?.sales_package || "");

      setupMultipleValuesBYIndex("type_of_seed", val?.seed_type || "");

      await wait(500);
      saveButtonClick();
      await waitingForSaved();
      await wait(500);

      // ------- Additional Description (Optional)
      editButtons[3].click();
      await wait(500);

      setIfNotValue(I("#flowering_plant"), val?.flowering_plant || 1);

      setIfNotValue(I("#description"), val?.description || 1);

      setupMultipleValues("keywords", val?.search_keywords || "");

      setupMultipleValues("key_features", val?.key_features || "");

      setIfNotValue(I("#video_url"), val?.video_URL || 1);

      setIfNotValue(I("#family"), val?.family || 1);

      setupMultipleValues("uses", val?.uses || "");

      setupMultipleValues(
         "soil_nutrient_requirements",
         val?.soil_nutrient_requirements || ""
      );

      setIfNotValue(I("#sowing_method"), val?.sowing_method || 1);

      setupMultipleValuesBYIndex("season", val?.season || "");

      setIfNotValue(I("#pack_of"), val?.pack_of || 1);

      setIfNotValue(I("#max_shelf_life"), val?.max_shelf_life || 1);

      setupMultipleValues("ean", val?.EAN_UPC || "");

      setIfNotValue(I("#soil_type"), val?.soil_type || 1);

      setIfNotValue(I("#sunlight"), val?.sunlight || 1);

      setIfNotValue(I("#watering"), val?.watering || 1);

      setIfNotValue(I("#germination_time"), val?.germination_time || 1);

      setupMultipleValues("care_instructions", val?.care_instructions || "");

      setupMultipleValues("other_features", val?.other_features || "");

      await wait(500);
      saveButtonClick();
   });

   copyBtn.addEventListener("click", async () => {
      tempVal = {};

      const editButtons = I('#sub-app-container .hTTPSU[data-testid="button"]');

      editButtons[1].click();
      await wait(500);

      setInObject(I("#sku_id"), "seller_SKU_ID");
      setInObject(I("#listing_status"), "listing_status");
      setInObject(I("#mrp"), "mrp");
      setInObject(I("#flipkart_selling_price"), "your_selling_price");
      setInObject(I("#minimum_order_quantity"), "minimum_order_quantity");
      setInObject(I("#procurement_type"), "procurement_type");
      setInObject(I("#shipping_days"), "shipping_days");
      setInObject(I("#stock_size"), "stock_size");

      setInObject(
         I("#local_shipping_fee_from_buyer"),
         "local_shipping_fee_from_buyer"
      );
      setInObject(
         I("#zonal_shipping_fee_from_buyer"),
         "zonal_shipping_fee_from_buyer"
      );
      setInObject(
         I("#national_shipping_fee_from_buyer"),
         "national_shipping_fee_from_buyer"
      );

      setInObject(I("#length"), "length_p0");
      setInObject(I("#breadth"), "breadth_p0");
      setInObject(I("#height"), "height_p0");
      setInObject(I("#weight"), "weight_p0");
      setInObject(I("#hsn"), "hsn");
      setInObject(I("#manufacturer_details"), "manufacturer_details");
      setInObject(I("#packer_details"), "packer_details");
      setInObject(I("#earliest_mfg_date"), "earliest_mfg_date");
      setInObject(I("#shelf_life"), "shelf_life");

      closeButtonClick();
      await wait(200);

      // ------- Product Description
      editButtons[2].click();
      await wait(500);

      setInObject(I("#model_name"), "model_id");
      multipleValueSetInObj("common_name", "common_name");
      setInObject(I("#quantity"), "quantity");
      setInObject(I("[name='quantity_0_qualifier']"), "quantity_in");
      multipleValueSetInObjByIndex("suitable_for", "suitable_for");
      setInObject(I("#organic"), "organic");
      multipleValueSetInObj("sales_package", "sales_package");
      multipleValueSetInObjByIndex("type_of_seed", "seed_type");

      closeButtonClick();
      await wait(300);

      // ------- Additional Description (Optional)
      editButtons[3].click();
      await wait(500);

      setInObject(I("#flowering_plant"), "flowering_plant");
      setInObject(I("#description"), "description");
      multipleValueSetInObj("keywords", "search_keywords");
      multipleValueSetInObj("key_features", "key_features");
      setInObject(I("#video_url"), "video_URL");
      setInObject(I("#family"), "family");
      multipleValueSetInObj("uses", "uses");
      multipleValueSetInObj(
         "soil_nutrient_requirements",
         "soil_nutrient_requirements"
      );
      setInObject(I("#sowing_method"), "sowing_method");
      multipleValueSetInObjByIndex("season", "season");
      setInObject(I("#pack_of"), "pack_of");
      setInObject(I("#max_shelf_life"), "max_shelf_life");
      multipleValueSetInObj("ean", "EAN_UPC");
      setInObject(I("#soil_type"), "soil_type");
      setInObject(I("#sunlight"), "sunlight");
      setInObject(I("#watering"), "watering");
      setInObject(I("#germination_time"), "germination_time");
      multipleValueSetInObj("care_instructions", "care_instructions");
      multipleValueSetInObj("other_features", "other_features");

      await wait(200);
      closeButtonClick();

      updateListingValues(tempVal);
   });
}

function setup_mapping() {
   let openBtn, copyBtn;
   CE(
      { id: "__fwm__", style: style.fw },
      (openBtn = CE({ style: style.btn }, "Fill Inputs")),
      (copyBtn = CE({ style: style.btn + style.copyBtn }, "Copy Inputs"))
   ).parent(document.body);

   openBtn.addEventListener("click", async () => {
      values = await getMappingData();
      await wait(100);

      setIfNotValue(I("#listing_status"), values.listing_status);
      setIfNotValue(I("#minimum_order_quantity"), values.minimum_order_quantity);
      setIfNotValue(I("#service_profile"), values.service_profile);
      setIfNotValue(I("#procurement_type"), values.procurement_type);
      setIfNotValue(I("#shipping_days"), values.shipping_days);
      setIfNotValue(I("#stock_size"), values.stock_size);

      setIfNotValue(I("#shipping_provider"), values.shipping_provider);
      setIfNotValue(
         I("#local_shipping_fee_from_buyer"),
         values.local_shipping_fee_from_buyer
      );
      setIfNotValue(
         I("#zonal_shipping_fee_from_buyer"),
         values.zonal_shipping_fee_from_buyer
      );
      setIfNotValue(
         I("#national_shipping_fee_from_buyer"),
         values.national_shipping_fee_from_buyer
      );

      setIfNotValue(I(`input[name="length_p0"]`), values.length_p0);
      setIfNotValue(I(`input[name="breadth_p0"]`), values.breadth_p0);
      setIfNotValue(I(`input[name="height_p0"]`), values.height_p0);
      setIfNotValue(I(`input[name="weight_p0"]`), values.weight_p0);

      setIfNotValue(I(`#hsn`), values.hsn);
      setIfNotValue(I("#tax_code"), values.tax_code);
      setIfNotValue(I(`#country_of_origin`), values.country_of_origin);
      setIfNotValue(I(`#manufacturer_details`), values.manufacturer_details);
      setIfNotValue(I(`#packer_details`), values.packer_details);

      setIfNotValue(I(`#importer_details`), values.importer_details);
      setIfNotValue(I(`#earliest_mfg_date`), values.earliest_mfg_date);
      setIfNotValue(I(`#shelf_life`), values.shelf_life);
   });

   copyBtn.addEventListener("click", async () => {
      tempVal = {};

      setIfNotValue(I("#listing_status"), values.listing_status);
      setIfNotValue(I("#minimum_order_quantity"), values.minimum_order_quantity);
      setIfNotValue(I("#service_profile"), values.service_profile);
      setIfNotValue(I("#procurement_type"), values.procurement_type);
      setIfNotValue(I("#shipping_days"), values.shipping_days);
      setIfNotValue(I("#stock_size"), values.stock_size);

      setIfNotValue(I("#shipping_provider"), values.shipping_provider);
      setIfNotValue(
         I("#local_shipping_fee_from_buyer"),
         values.local_shipping_fee_from_buyer
      );
      setIfNotValue(
         I("#zonal_shipping_fee_from_buyer"),
         values.zonal_shipping_fee_from_buyer
      );
      setIfNotValue(
         I("#national_shipping_fee_from_buyer"),
         values.national_shipping_fee_from_buyer
      );

      setIfNotValue(I(`input[name="length_p0"]`), values.length_p0);
      setIfNotValue(I(`input[name="breadth_p0"]`), values.breadth_p0);
      setIfNotValue(I(`input[name="height_p0"]`), values.height_p0);
      setIfNotValue(I(`input[name="weight_p0"]`), values.weight_p0);

      setIfNotValue(I(`#hsn`), values.hsn);
      setIfNotValue(I("#tax_code"), values.tax_code);
      setIfNotValue(I(`#country_of_origin`), values.country_of_origin);
      setIfNotValue(I(`#manufacturer_details`), values.manufacturer_details);
      setIfNotValue(I(`#packer_details`), values.packer_details);

      setIfNotValue(I(`#importer_details`), values.importer_details);
      setIfNotValue(I(`#earliest_mfg_date`), values.earliest_mfg_date);
      setIfNotValue(I(`#shelf_life`), values.shelf_life);

      console.log(tempVal);
      
   });
}

window.onload = async () => {
   if (ifMatchSingleListingLocation() && ifHaveSaveButton()) {
      setup_single_listing();
   }
};

window.addEventListener("mousedown", async (_) => {
   await wait(1000);
   console.clear();

   if (ifMatchSingleListingLocation()) {
      const fwl = I("#__fwl__")[0];
      const isFWL = fwl instanceof Node;

      if (ifHaveSaveButton() && !isFWL) {
         setup_single_listing();
      } else if (ifHaveSaveButton() && isFWL) {
         fwl.style.display = "flex";
      } else if (fwl) {
         fwl.style.display = "none";
      }

      const fwm = I("#__fwm__")[0];
      const isFWM = fwm instanceof Node;

      if (ifHaveFloatingDialog() && !isFWM) {
         setup_mapping();
      } else if (ifHaveFloatingDialog() && isFWM) {
         fwm.style.display = "flex";
      } else if (fwm) {
         fwm.style.display = "none";
      }
   }
});

function setIfNotValue(element, value) {
   if (!element[0]) return;

   const val = element[0]?.value?.trim();
   if (!val || val == "Select One") {
      element[0].value = value;
      const event = new Event("change", { bubbles: true });
      element[0].dispatchEvent(event);
   }
}
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

function setInObject(element, proName) {
   tempVal[proName] = element[0]?.value;
}
function multipleValueSetInObj(idName, proName) {
   const elements = document.querySelectorAll(`#${idName}`);
   tempVal[proName] = [...elements].map((e) => e.value).join("_");
}
function multipleValueSetInObjByIndex(idName, proName) {
   const elements = document.querySelectorAll(`#${idName}`);
   tempVal[proName] = [...elements].map((e) => e.selectedIndex).join("_");
}

