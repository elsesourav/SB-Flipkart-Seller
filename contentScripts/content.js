let = tempVal = {};

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
   let openInputBtn, copyInputBtn;
   CE(
      { id: "__fwl__", class: "__fw__" },
      (openInputBtn = CE({ class: "__btn__" }, "Fill Inputs")),
      (copyInputBtn = CE({ class: "__btn__ __1__" }, "Copy Inputs"))
   ).parent(document.body);

   openInputBtn.addEventListener("click", async () => {
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

      setIfNotValue(I("#sku_id"), val?.seller_SKU_ID || "n_a_m_e");

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

   copyInputBtn.addEventListener("click", async () => {
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

async function setup_mapping() {
   let openInputBtn, copyInputBtn;

   CE(
      { id: "__fwm__", class: "__fw__" },
      (openInputBtn = CE({ class: "__btn__" }, "Fill Inputs")),
      (copyInputBtn = CE({ class: "__btn__ __1__" }, "Copy Inputs"))
   ).parent(document.body);

   async function openInputButtonAction() {
      try {
         const url = document.querySelector(".productTitle a")?.href;
         console.log(url);
         const { sellingMRP, MRP } = await getProductData(url);
         const DATA = await getMappingData();

         console.log("DATA", DATA);

         const dt = Number(Date.now().toString().slice(0, -3));
         const now = dt.toString(36).toUpperCase();
         // const original = parseInt(now, 36) * 1000;
         let [quantity, value] = I(".productInfo")[0].innerText.split(" ");
         value = value.toUpperCase();
         const isPer = value == "PER";
         value = isPer ? "PIECE" : value;
         const sku_id = `${DATA?.SKU_NAME?.toUpperCase()}__${quantity}__${value}__${now}`;
         setIfNotValue(I("#sku_id"), sku_id);

         setIfNotValue(I("#listing_status"), DATA?.listing_status || false);
         setIfNotValue(I("#mrp"), MRP);

         const MP_FEES_MIN = Math.min(
            Number(DATA?.MP_FEES_LOCAL || 86),
            Number(DATA?.MP_FEES_NATIONAL || 102),
            Number(DATA?.MP_FEES_ZONAL || 86)
         );

         const OF_COST_MIN = Math.min(
            Number(DATA?.TAXES_LOCAL || 16),
            Number(DATA?.TAXES_NATIONAL || 19),
            Number(DATA?.TAXES_ZONAL || 16)
         );

         const PROFIT = Number(DATA?.PROFIT || 15);

         let PRODUCT_COST;
         if (isPer) {
            PRODUCT_COST = (Number(DATA?.UNIT_OF_COST || 200) / Number(DATA?.UNIT || 1)) * Number(quantity);
         } else {
            PRODUCT_COST = (Number(DATA?.WEIGHT_OF_COST || 200) / (Number(DATA?.WEIGHT || 1) * 1000)) * (Number(quantity) / (value === "KG" ? 1000 : 1));
         }

         // calculate selling price
         const mrp = Math.round(MP_FEES_MIN + OF_COST_MIN + PROFIT + PRODUCT_COST);

         setIfNotValue(I("#flipkart_selling_price"), mrp, true);
         setIfNotValue(
            I("#minimum_order_quantity"),
            DATA?.minimum_order_quantity || 1
         );
         setIfNotValue(I("#service_profile"), "NON_FBF");
         setIfNotValue(I("#procurement_type"), DATA?.procurement_type || 1);
         setIfNotValue(I("#shipping_days"), DATA?.shipping_days || 1);
         setIfNotValue(I("#stock_size"), DATA?.stock_size || 1);
         setIfNotValue(I("#shipping_provider"), "FLIPKART");

         const totalMinFees = MP_FEES_MIN + OF_COST_MIN;
         const LOCAL_FEES = Math.round((Number(DATA?.MP_FEES_LOCAL || 86) + Number(DATA?.TAXES_LOCAL || 16)) - totalMinFees);
         const NATIONAL_FEES = Math.round((Number(DATA?.MP_FEES_NATIONAL || 102) + Number(DATA?.TAXES_NATIONAL || 19)) - totalMinFees);
         const ZONAL_FEES = Math.round((Number(DATA?.MP_FEES_ZONAL || 86) + Number(DATA?.TAXES_ZONAL || 16)) - totalMinFees);

         setIfNotValue(I("#local_shipping_fee_from_buyer"), LOCAL_FEES);
         setIfNotValue(I("#zonal_shipping_fee_from_buyer"), ZONAL_FEES);
         setIfNotValue(I("#national_shipping_fee_from_buyer"), NATIONAL_FEES);
         setIfNotValue(I("[name='length_p0']"), DATA?.PACKAGING_LENGTH || 20);
         setIfNotValue(I("[name='breadth_p0']"), DATA?.PACKAGING_BREADTH || 17);
         setIfNotValue(I("[name='height_p0']"), DATA?.PACKAGING_HEIGHT || 3);

         let productWeight = Number(DATA?.PACKET_WEIGHT || 1);
         if (isPer) {
            productWeight += (Number(DATA?.UNIT_WEIGHT || 1) / Number(DATA?.UNIT || 1)) * Number(quantity);
         } else {
            productWeight += (Number(quantity) / (value === "G" ? 1000 : 1));
         }

         setIfNotValue(I("[name='weight_p0']"), Number(productWeight.toFixed(2)));
         setIfNotValue(I("#hsn"), DATA?.hsn || 1209);
         setIfNotValue(I("#tax_code"), "GST_5");
         setIfNotValue(I("#country_of_origin"), "IN");
         setIfNotValue(I("#manufacturer_details"), DATA?.manufacturer_details || "Made by our House");
         setIfNotValue(I("#packer_details"), DATA?.packer_details || "Packed by our House");
         setIfNotValue(I("#earliest_mfg_date"), DATA?.earliest_mfg_date || "2024-10-30");
         setIfNotValue(I("#shelf_life"), DATA?.shelf_life || 12);
         setIfNotValue(I("[name='shelf_life_0_qualifier']"), "MONTHS");
      } catch (error) {
         alert(error);
      }
   }

   async function copyInputButtonAction() {
      tempVal = {};

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
      setInObject(I("[name='length_p0']"), "length_p0");
      setInObject(I("[name='breadth_p0']"), "breadth_p0");
      setInObject(I("[name='height_p0']"), "height_p0");
      setInObject(I("[name='weight_p0']"), "weight_p0");
      setInObject(I("#hsn"), "hsn");
      setInObject(I("#manufacturer_details"), "manufacturer_details");
      setInObject(I("#packer_details"), "packer_details");
      setInObject(I("#earliest_mfg_date"), "earliest_mfg_date");
      setInObject(I("#shelf_life"), "shelf_life");

      updateMappingValues(tempVal);
   }

   openInputBtn.addEventListener("click", openInputButtonAction);
   copyInputBtn.addEventListener("click", copyInputButtonAction);

   document.querySelector(".hTTPSU")?.addEventListener("click", () => {
      openInputBtn.removeEventListener("click", openInputButtonAction);
      copyInputBtn.removeEventListener("click", copyInputButtonAction);
   });
}

function setup_flipkart_product_url() {
   let openInputBtn, closeBtn, main;
   CE(
      { id: "__fws__", class: "__fw__" },
      (openInputBtn = CE({ class: "__btn__" }, "OPEN URL")),
      (closeBtn = CE({ class: "__btn__ __1__" }, "CLOSE"))
   ).parent(document.body);

   closeBtn.style.display = "none";

   main = document.createElement("div");
   main.setAttribute("id", "__flipkartFW__");

   openInputBtn.addEventListener("click", () => {
      closeBtn.style.display = "block";
      openInputBtn.style.display = "none";

      const set = new Set(
         [...document.querySelectorAll("a[target='_blank']")].map(
            (a) => a.parentNode
         )
      );

      const itemWidth = 100 / 3 - (10 * 2) / 3;

      set.forEach((el) => {
         const link = el.querySelector('a[target="_blank"]');
         if (link) {
            el.style.cssText = `
            flex: 0 0 ${itemWidth}%;
            margin: 5px;
            box-sizing: border-box;
            cursor: pointer;
         `;
            el.addEventListener("click", (evt) => {
               evt.stopPropagation();
               evt.preventDefault();
               navigator.clipboard
                  .writeText(link.href)
                  .then(() =>
                     console.log("Link copied to clipboard:", link.href)
                  )
                  .catch((err) => console.error("Failed to copy link:", err));
            });
            main.appendChild(el);
         }
      });
      document.body.appendChild(main);
      main.style.display = "flex";
   });

   closeBtn.addEventListener("click", () => {
      closeBtn.style.display = "none";
      openInputBtn.style.display = "block";
      main.style.display = "none";
      main.innerHTML = "";
   });
}
let startSelling;

onload = async () => {
   if (ifMatchSingleListingLocation() && ifHaveSaveButton()) {
      setStyle();
      setup_single_listing();
   }

   if (ifFlipkartSearchLocation()) {
      setStyle();
      setup_flipkart_product_url();
   }

};

// document.body.addEventListener("click", async () => {
//    if (!startSelling) {
//       startSelling = document.querySelector(`.primaryActionBar .startSelling`);
//       console.log(startSelling);
//       startSelling?.addEventListener("click", async () => {
//          console.log("startSelling");
   
         
   
//          _sellingMRP = sellingMRP;
//          _MRP = MRP;

//       });
//    }
// });


addEventListener("mousedown", async (_) => {
   await wait(500);
   // console.clear();

   if (ifMatchSingleListingLocation()) {
      const fwl = I("#__fwl__")[0];
      const isFWL = fwl instanceof Node;

      if (ifHaveSaveButton() && !isFWL) {
         setStyle();
         setup_single_listing();
      } else if (ifHaveSaveButton() && isFWL) {
         fwl.style.display = "flex";
      } else if (fwl) {
         fwl.style.display = "none";
      }

      const fwm = I("#__fwm__")[0];
      const isFWM = fwm instanceof Node;

      if (ifHaveFloatingDialog() && !isFWM) {
         setStyle();
         setup_mapping();
      } else if (ifHaveFloatingDialog() && isFWM) {
         fwm.style.display = "flex";
      } else if (fwm) {
         fwm.style.display = "none";
      }
   }

   const fw = I("#__fws__")[0];
   const is = fw instanceof Node;

   if (ifFlipkartSearchLocation()) {
      if (!is) {
         setStyle();
         setup_flipkart_product_url();
      } else if (is) {
         fw.style.display = "flex";
      }
   } else if (is) {
      fw.style.display = "none";
   }
});