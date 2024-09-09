let isOpenPanel = false;

function getValues() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b", (r) => {
         resolve(r);
      });
   });
}

function getSingleListingData() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_image_request", (r) => {
         resolve(r);
      });
   });
}

function saveButtonClick() {
   const buttons = [...document.querySelectorAll(`[data-testid="button"]`)];
   const [btn] = buttons.filter((e) => e.innerText.trim() == "Save");
   btn.setAttribute("id", "__save_button__");
   btn.click();
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

window.onload = async () => {
   const currentUrl = window.location.href;
   if (
      currentUrl.includes(URL.singleListing) ||
      currentUrl.includes(URL.singleAddListing)
   ) {
      const openBtn = document.createElement("div");
      openBtn.setAttribute(
         "style",
         `
         position: fixed;
         bottom: 10px;
         right: 10px;
         cursor: pointer;
         background-color: #007bff;
         font-size: 25px;
         color: #fff;
         font-weight: bold;
         padding: 8px 20px;
         border-radius: 5px;
         box-shadow: 0 3px 4px #000;
         transition: background-color 0.3s;
         z-index: 100;
      `
      );
      openBtn.innerText = "Fill Inputs";
      document.body.appendChild(openBtn);

      openBtn.addEventListener("click", async () => {
         const editButtons = I(
            '#sub-app-container .hTTPSU[data-testid="button"]'
         );
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
                  if (fileInput)
                     putImageIntoInputFile(fileInput, images[i].url);
                  await waitForUploadingImage();
                  await wait(200);
               }
            }

            await wait(300);
            saveButtonClick();
            await waitingForSaved();
            await wait(300);
         }

         // ------- Price, Stock and Shipping Information

         editButtons[1].click();
         await wait(500);

         setIfNotValue(I("#sku_id")[0], val?.seller_SKU_ID || "SBarui");

         setIfNotValue(I("#listing_status")[0], val?.listing_status || false);

         setIfNotValue(I("#mrp")[0], val?.mrp || 499);

         setIfNotValue(
            I("#flipkart_selling_price")[0],
            val?.your_selling_price || 499
         );

         setIfNotValue(
            I("#minimum_order_quantity")[0],
            val?.minimum_order_quantity || 1
         );

         setIfNotValue(I("#service_profile")[0], "NON_FBF");

         setIfNotValue(I("#procurement_type")[0], val?.procurement_type || 1);

         setIfNotValue(I("#shipping_days")[0], val?.shipping_days || 1);

         setIfNotValue(I("#stock_size")[0], val?.stock_size || 1);

         setIfNotValue(I("#shipping_provider")[0], "FLIPKART");

         setIfNotValue(
            I("#local_shipping_fee_from_buyer")[0],
            val?.local_shipping_fee_from_buyer || 1
         );

         setIfNotValue(
            I("#zonal_shipping_fee_from_buyer")[0],
            val?.zonal_shipping_fee_from_buyer || 1
         );

         setIfNotValue(
            I("#national_shipping_fee_from_buyer")[0],
            val?.national_shipping_fee_from_buyer || 1
         );

         setIfNotValue(I("#length")[0], val?.length_p0 || 1);

         setIfNotValue(I("#breadth")[0], val?.breadth_p0 || 1);

         setIfNotValue(I("#height")[0], val?.height_p0 || 1);

         setIfNotValue(I("#weight")[0], val?.weight_p0 || 1);

         setIfNotValue(I("#hsn")[0], val?.hsn || 1);

         setIfNotValue(I("#tax_code")[0], "GST_5");

         setIfNotValue(I("#country_of_origin")[0], "IN");

         setIfNotValue(
            I("#manufacturer_details")[0],
            val?.manufacturer_details || 1
         );

         setIfNotValue(I("#packer_details")[0], val?.packer_details || 1);

         setIfNotValue(I("#earliest_mfg_date")[0], val?.earliest_mfg_date || 1);

         setIfNotValue(I("#shelf_life")[0], val?.shelf_life || 1);

         setIfNotValue(I("[name='shelf_life_0_qualifier']")[0], "MONTHS");

         await wait(500);
         saveButtonClick();
         await waitingForSaved();
         await wait(300);

         // ------- Product Description
         editButtons[2].click();
         await wait(500);

         setIfNotValue(I("#model_name")[0], val?.model_id || 1);

         setupMultipleValues("common_name", val?.common_name || "");

         setIfNotValue(I("#quantity")[0], val?.quantity || 1);

         setIfNotValue(
            I("[name='quantity_0_qualifier']")[0],
            val?.quantity_in || ""
         );

         setupMultipleValuesBYIndex("suitable_for", val?.suitable_for || "");

         setIfNotValue(I("#organic")[0], val?.organic || 1);

         setupMultipleValues("sales_package", val?.sales_package || "");

         setupMultipleValuesBYIndex("type_of_seed", val?.seed_type || "");

         await wait(500);
         saveButtonClick();
         await waitingForSaved();
         await wait(300);

         // ------- Additional Description (Optional)
         editButtons[3].click();
         await wait(500);

         setIfNotValue(I("#flowering_plant")[0], val?.flowering_plant || 1);

         setIfNotValue(I("#description")[0], val?.description || 1);

         setupMultipleValues("keywords", val?.search_keywords || "");

         setupMultipleValues("key_features", val?.key_features || "");

         setIfNotValue(I("#video_url")[0], val?.video_URL || 1);

         setIfNotValue(I("#family")[0], val?.family || 1);

         setupMultipleValues("uses", val?.uses || "");

         setupMultipleValues(
            "soil_nutrient_requirements",
            val?.soil_nutrient_requirements || ""
         );

         setIfNotValue(I("#sowing_method")[0], val?.sowing_method || 1);

         setupMultipleValuesBYIndex("season", val?.season || "");

         setIfNotValue(I("#pack_of")[0], val?.pack_of || 1);

         setIfNotValue(I("#max_shelf_life")[0], val?.max_shelf_life || 1);

         setupMultipleValues("ean", val?.EAN_UPC || "");

         setIfNotValue(I("#soil_type")[0], val?.soil_type || 1);

         setIfNotValue(I("#sunlight")[0], val?.sunlight || 1);

         setIfNotValue(I("#watering")[0], val?.watering || 1);

         setIfNotValue(I("#germination_time")[0], val?.germination_time || 1);

         setupMultipleValues("care_instructions", val?.care_instructions || "");

         setupMultipleValues("other_features", val?.other_features || "");

         await wait(500);
         saveButtonClick();
      });
   }
};

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
      const parent = I(`#${idName}`)[0].parentNode.parentNode.parentNode.parentNode;

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

function setValue(element, value) {
   element[0].value = value;
   const event = new Event("change", { bubbles: true });
   element[0].dispatchEvent(event);
}

function setIfNotValue(element, value) {
   if (!element) return;

   const val = element?.value?.trim();
   if (!val || val == "Select One") {
      element.value = value;
      const event = new Event("change", { bubbles: true });
      element.dispatchEvent(event);
   }
}

async function onlySetup() {
   await wait(100);
   values = await getValues();
   await wait(100);

   setValue(I("#listing_status"), values.listing_status);
   setValue(I("#minimum_order_quantity"), values.minimum_order_quantity);
   setValue(I("#service_profile"), values.service_profile);
   setValue(I("#procurement_type"), values.procurement_type);
   setValue(I("#shipping_days"), values.shipping_days);
   setValue(I("#stock_size"), values.stock_size);

   setValue(I("#shipping_provider"), values.shipping_provider);
   setValue(
      I("#local_shipping_fee_from_buyer"),
      values.local_shipping_fee_from_buyer
   );
   setValue(
      I("#zonal_shipping_fee_from_buyer"),
      values.zonal_shipping_fee_from_buyer
   );
   setValue(
      I("#national_shipping_fee_from_buyer"),
      values.national_shipping_fee_from_buyer
   );

   setValue(I(`input[name="length_p0"]`), values.length_p0);
   setValue(I(`input[name="breadth_p0"]`), values.breadth_p0);
   setValue(I(`input[name="height_p0"]`), values.height_p0);
   setValue(I(`input[name="weight_p0"]`), values.weight_p0);

   setValue(I(`#hsn`), values.hsn);
   setValue(I("#tax_code"), values.tax_code);
   setValue(I(`#country_of_origin`), values.country_of_origin);
   setValue(I(`#manufacturer_details`), values.manufacturer_details);
   setValue(I(`#packer_details`), values.packer_details);

   if (I(`#importer_details`)[0])
      setValue(I(`#importer_details`), values.importer_details);
   setValue(I(`#earliest_mfg_date`), values.earliest_mfg_date);
   setValue(I(`#shelf_life`), values.shelf_life);
}

document.body.click(() => {
   setTimeout(() => {
      const RMP = I(".ReactModalPortal")[0];
      if (RMP && RMP.innerHTML.length > 0 && !isOpenPanel) {
         isOpenPanel = true;

         onlySetup();
      } else if (RMP) {
         isOpenPanel = false;
      }
   }, 500);
});
