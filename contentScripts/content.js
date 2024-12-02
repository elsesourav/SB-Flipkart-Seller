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

setTimeout(() => {
   // console.clear()
}, 3000);

async function setup_listing() {
   let openInputBtn, copyInputBtn;
   CE(
      { id: "__fwl__", class: "__fw__" },
      (openInputBtn = CE({ class: "__btn__" }, "Fill Inputs")),
      (copyInputBtn = CE({ class: "__btn__ __1__" }, "Copy Inputs"))
   ).parent(document.body);

   openInputBtn.addEventListener("click", async () => {
      const editButtons = I('#sub-app-container .hTTPSU[data-testid="button"]');
 
      // fill Images
      const val = await getListingData();
      let { images } = val;
      
      if (images.length > 4) {
         images = images
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
      }

      if (images.length >= 0) {
         editButtons[0].click();
         await wait(500);

         for (let i = 0; i < 4; i++) {
            await wait(200);
            I(`#thumbnail_${i} > div`)[0].click();

            if (images[i]) {
               const fileInput = I("#upload-image")[0];
               if (fileInput) putImageIntoInputFile(fileInput, images[i].file);
               await waitForUploadingImage();
               await wait(200);
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
      }

      // ------- Price, Stock and Shipping Information

      // editButtons[1].click();
      // await wait(500);

      // setIfNotValue(I("#sku_id"), val?.seller_SKU_ID || "n_a_m_e");

      // setIfNotValue(I("#listing_status"), val?.listing_status || false);

      // setIfNotValue(I("#mrp"), val?.mrp || 499);

      // setIfNotValue(
      //    I("#flipkart_selling_price"),
      //    val?.your_selling_price || 499
      // );

      // setIfNotValue(
      //    I("#minimum_order_quantity"),
      //    val?.minimum_order_quantity || 1
      // );

      // setIfNotValue(I("#service_profile"), "NON_FBF");

      // setIfNotValue(I("#procurement_type"), val?.procurement_type || 1);

      // setIfNotValue(I("#shipping_days"), val?.shipping_days || 1);

      // setIfNotValue(I("#stock_size"), val?.stock_size || 1);

      // setIfNotValue(I("#shipping_provider"), "FLIPKART");

      // setIfNotValue(
      //    I("#local_shipping_fee_from_buyer"),
      //    val?.local_shipping_fee_from_buyer || 1
      // );

      // setIfNotValue(
      //    I("#zonal_shipping_fee_from_buyer"),
      //    val?.zonal_shipping_fee_from_buyer || 1
      // );

      // setIfNotValue(
      //    I("#national_shipping_fee_from_buyer"),
      //    val?.national_shipping_fee_from_buyer || 1
      // );

      // setIfNotValue(I("#length"), val?.length_p0 || 1);

      // setIfNotValue(I("#breadth"), val?.breadth_p0 || 1);

      // setIfNotValue(I("#height"), val?.height_p0 || 1);

      // setIfNotValue(I("#weight"), val?.weight_p0 || 1);

      // setIfNotValue(I("#hsn"), val?.hsn || 1);

      // setIfNotValue(I("#tax_code"), "GST_5");

      // setIfNotValue(I("#country_of_origin"), "IN");

      // setIfNotValue(I("#manufacturer_details"), val?.manufacturer_details || 1);

      // setIfNotValue(I("#packer_details"), val?.packer_details || 1);

      // setIfNotValue(I("#earliest_mfg_date"), val?.earliest_mfg_date || 1);

      // setIfNotValue(I("#shelf_life"), val?.shelf_life || 1);

      // setIfNotValue(I("[name='shelf_life_0_qualifier']"), "MONTHS");

      // await wait(500);
      // saveButtonClick();
      // await waitingForSaved();
      // await wait(500);

      // // ------- Product Description
      // editButtons[2].click();
      // await wait(500);

      // setIfNotValue(I("#model_name"), val?.model_id || 1);

      // setupMultipleValues("common_name", val?.common_name || "");

      // setIfNotValue(I("#quantity"), val?.quantity || 1);

      // setIfNotValue(I("[name='quantity_0_qualifier']"), val?.quantity_in || "");

      // setupMultipleValuesBYIndex("suitable_for", val?.suitable_for || "");

      // setIfNotValue(I("#organic"), val?.organic || 1);

      // setupMultipleValues("sales_package", val?.sales_package || "");

      // setupMultipleValuesBYIndex("type_of_seed", val?.seed_type || "");

      // await wait(500);
      // saveButtonClick();
      // await waitingForSaved();
      // await wait(500);

      // // ------- Additional Description (Optional)
      // editButtons[3].click();
      // await wait(500);

      // setIfNotValue(I("#flowering_plant"), val?.flowering_plant || 1);

      // setIfNotValue(I("#description"), val?.description || 1);

      // setupMultipleValues("keywords", val?.search_keywords || "");

      // setupMultipleValues("key_features", val?.key_features || "");

      // setIfNotValue(I("#video_url"), val?.video_URL || 1);

      // setIfNotValue(I("#family"), val?.family || 1);

      // setupMultipleValues("uses", val?.uses || "");

      // setupMultipleValues(
      //    "soil_nutrient_requirements",
      //    val?.soil_nutrient_requirements || ""
      // );

      // setIfNotValue(I("#sowing_method"), val?.sowing_method || 1);

      // setupMultipleValuesBYIndex("season", val?.season || "");

      // setIfNotValue(I("#pack_of"), val?.pack_of || 1);

      // setIfNotValue(I("#max_shelf_life"), val?.max_shelf_life || 1);

      // setupMultipleValues("ean", val?.EAN_UPC || "");

      // setIfNotValue(I("#soil_type"), val?.soil_type || 1);

      // setIfNotValue(I("#sunlight"), val?.sunlight || 1);

      // setIfNotValue(I("#watering"), val?.watering || 1);

      // setIfNotValue(I("#germination_time"), val?.germination_time || 1);

      // setupMultipleValues("care_instructions", val?.care_instructions || "");

      // setupMultipleValues("other_features", val?.other_features || "");

      // await wait(500);
      // saveButtonClick();
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
   });

   openInputBtn.addEventListener("click", openInputButtonAction);
   copyInputBtn.addEventListener("click", copyInputButtonAction);

   document.querySelector(".hTTPSU")?.addEventListener("click", () => {
      openInputBtn.removeEventListener("click", openInputButtonAction);
      copyInputBtn.removeEventListener("click", copyInputButtonAction);
   });
}

function setup_orders_print() {
   let openInputBtn, closeBtn, printBtn, downloadBtn;
   const sku_ids = document.querySelectorAll(".krECZe .hXpCNJ");
   if (sku_ids.length <= 0) return;

   const TABLE = document.createElement("div");
   TABLE.setAttribute("id", "_orders_table");
   document.body.appendChild(TABLE);
   setStyle(true);

   CE(
      { id: "__fwo__", class: "__fw__" },
      (openInputBtn = CE({ class: "__btn__" }, "Orders")),
      (printBtn = CE({ class: "__btn__" }, "Print")),
      (downloadBtn = CE({ class: "__btn__" }, "Download")), 
      (closeBtn = CE({ class: "__btn__ __1__" }, "Close"))
   ).parent(document.body);

   closeBtn.style.display = "none";
   printBtn.style.display = "none";
   downloadBtn.style.display = "none";
   TABLE.style.display = "none";

   function printTable() {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
         <html>
            <head>
               <title>Orders Table</title>
               <style>
                  * {
                     margin: 0;
                     padding: 0;
                     box-sizing: border-box;
                     font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                     font-size: 12px;
                  }
                  ._-table {
                     position: relative;
                     width: 400px;
                     background: #fff;
                     flex-direction: column;
                     color: #000
                  }
                  ._-row {
                     position: relative;
                     width: 100%;
                     padding: 4px;
                     display: grid;
                     place-items: center;
                     grid-template-columns: repeat(3, 1fr);
                     border-bottom: 1px double #000;
                  }

                  ._-cell {
                     width: 100%;
                     position: relative;
                     padding: 8px;
                     border-right: 1px solid #ddd;
                     border-left: 1px solid #ddd;
                  }

                  ._-header {
                     width: 100%;
                     border-radius: 10px;
                     border: 1px dashed #000;
                     font-weight: bold;
                  }

                  ._-seed-type {
                     font-weight: bold;
                     background-color: #f8f8f8;
                  }
                  @media print {
                     @page { margin: 0.5cm; }
                  }
               </style>
            </head>
            <body>
               ${TABLE.outerHTML}
            </body>
         </html>
      `);
      printWindow.document.close();
      printWindow.print();
   }

   async function downloadAsImage() {
      const canvas = await html2canvas(TABLE.querySelector("._-table"));
      const link = document.createElement("a");
      const date = new Date().toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'});
      link.download = `Orders ${date}.png`;
      link.href = canvas.toDataURL();
      link.click();
   }

   async function showOrders() {
      const sku_ids = document.querySelectorAll(".krECZe .hXpCNJ");
      const unit = document.querySelectorAll(".hCSXUa .hXpCNJ");
      const DATA = await getOrderData();
      const { WordInBengali, NumberInBengali, editor, typeInBengali } = DATA;
      const { calculateWeight, nameInBengali } = editor;

      let NAMES = {};
      for (const [key, value] of Object.entries(nameInBengali)) {
         NAMES[key.toUpperCase()] = WordInBengali ? value : key;
      }

      let TYPES = {};
      for (const [key, value] of Object.entries(typeInBengali)) {
         TYPES[key.toUpperCase()] = WordInBengali ? value : key;
      }

      // if (WordInBengali) TABLE.style.fontSize = "18px";
      // else 
      TABLE.style.fontSize = "15px";

      const SKU = [...sku_ids].map(el => el.innerText);
      const UNIT = [...unit].map(el => parseInt(el.innerText));
      const sku_data = SKU.map(el => el.split("__"));

      const PRODUCTS = {};
      sku_data.forEach((_sku_, i) => {
         if (DATA.products[SKU[i]]) {
            const temp = DATA.products[SKU[i]];
            const { NAME, TYPE, QUANTITY } = temp;

            const weight = calculateWeight[NAME.toUpperCase()] || null;

            const name = NAMES[NAME.toUpperCase()] || NAME.toUpperCase();
            const type = TYPES[TYPE === "per packet" ? "P" : TYPE.toUpperCase()] || TYPE.toUpperCase();
            const num = NumberInBengali ? toBengaliNumber(QUANTITY) : QUANTITY;

            let gram = "";

            if (type === "PIECE" && weight) {
               const [_p_, _g_] = extractNumbers(weight);
               const result = num * _g_ / _p_;
               const formattedResult = Number.isInteger(result) ? result : result.toFixed(3);
               gram = `, ${formattedResult} ${TYPES["G"]}`;
            }

            !PRODUCTS[name] && (PRODUCTS[name] = {});
            const quantityKey = `${num} ${type}${gram}`;
            PRODUCTS[name][quantityKey] = (PRODUCTS[name][quantityKey] || 0) + UNIT[i];
         } else if (_sku_.length >= 3) {
            const [name, quantity, type] = _sku_;
            
            const weight = calculateWeight[name.toUpperCase()] || null;
            
            const NAME = NAMES[name.toUpperCase()] || name.toUpperCase();
            const TYPE = TYPES[type === "PIECE" ? "P" : type] || type;
            const NUM = NumberInBengali ? toBengaliNumber(quantity) : quantity;

            
            let gram = "";
            
            if (type === "PIECE" && weight) {
               const [_p_, _g_] = extractNumbers(weight);
               const result = quantity * _g_ / _p_;
               const formattedResult = Number.isInteger(result) ? result : result.toFixed(2);
               gram = `, ${formattedResult} ${TYPES["G"]}`;
            }

            !PRODUCTS[NAME] && (PRODUCTS[NAME] = {});
            const quantityKey = `${NUM} ${TYPE}${gram}`;
            PRODUCTS[NAME][quantityKey] = (PRODUCTS[NAME][quantityKey] || 0) + UNIT[i];

         } else {
            console.log("SKU NOT FOUND", SKU[i]);
         }
      });

      const tableRows = Object.entries(PRODUCTS).map(([name, quantities]) => {
         const header = `<div class="_-cell _-header">${name}</div>`;
         
         const cells = Object.entries(quantities).map(([quantity, type]) => {
            const TYPE = WordInBengali ? `${type} ${TYPES["TIMES"]}` : `(${type})`;
            return `<div class="_-cell">${quantity} => ${TYPE}</div>`;
         }).join('');

         return `<div class="_-row">${header}${cells}</div>`;
      }).join('');

      TABLE.innerHTML = `<div class="_-table">${tableRows}</div>`;
   }

   openInputBtn.addEventListener("click", async () => {
      closeBtn.style.display = "block";
      printBtn.style.display = "block";
      downloadBtn.style.display = "block";
      openInputBtn.style.display = "none";
      TABLE.style.display = "flex";
      showOrders();
   });

   closeBtn.addEventListener("click", () => {
      closeBtn.style.display = "none";
      printBtn.style.display = "none";
      downloadBtn.style.display = "none";
      openInputBtn.style.display = "block";
      TABLE.style.display = "none";
   });

   printBtn.addEventListener("click", printTable);
   downloadBtn.addEventListener("click", downloadAsImage);
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

         setIfNotValue(I("#listing_status"), DATA?.LISTING_STATUS || false);
         setIfNotValue(I("#mrp"), MRP);

         const PROFIT = Number(DATA?.PROFIT || 15);

         const DELIVERY_CHARGE_MIN = Math.min(
            Number(DATA?.DELIVERY_LOCAL || 35),
            Number(DATA?.DELIVERY_NATIONAL || 55),
            Number(DATA?.DELIVERY_ZONAL || 35)
         );

         const FLIPKART_COST = Number(DATA?.FLIPKART_COST || 102);

         const IS_DELIVERY_INCLUDED = DATA?.IS_INCLUDED || false;

         let PRODUCT_COST;
         if (isPer) {
            PRODUCT_COST = (Number(DATA?.UNIT_OF_COST || 200) / Number(DATA?.UNIT || 1)) * Number(quantity);
         } else {
            PRODUCT_COST = (Number(DATA?.UNIT_OF_COST || 200) / (Number(DATA?.UNIT_WEIGHT || 1) * 1000)) * (Number(quantity) / (value === "KG" ? 1000 : 1));
         }

         // calculate selling price
         let mrp = Math.round(FLIPKART_COST + PROFIT + PRODUCT_COST);

         if (IS_DELIVERY_INCLUDED) {
            mrp -= DELIVERY_CHARGE_MIN;
         }

         setIfNotValue(I("#flipkart_selling_price"), mrp, true);
         setIfNotValue(
            I("#minimum_order_quantity"),
            DATA?.MINIMUM_ORDER_QUANTITY || 1
         );
         setIfNotValue(I("#service_profile"), "NON_FBF");
         setIfNotValue(I("#procurement_type"), DATA?.PROCUREMENT_TYPE || 1);
         setIfNotValue(I("#shipping_days"), DATA?.SHIPPING_DAYS || 1);
         setIfNotValue(I("#stock_size"), DATA?.STOCK_SIZE || 1);
         setIfNotValue(I("#shipping_provider"), "FLIPKART");

         let LOCAL_FEES = 0, NATIONAL_FEES = 0, ZONAL_FEES = 0;

         if (IS_DELIVERY_INCLUDED) {
            LOCAL_FEES = Math.round(Number(DATA?.DELIVERY_LOCAL || 35));
            NATIONAL_FEES = Math.round(Number(DATA?.DELIVERY_NATIONAL || 55));
            ZONAL_FEES = Math.round(Number(DATA?.DELIVERY_ZONAL || 35));
         } else {
            LOCAL_FEES = Math.round(Number(DATA?.DELIVERY_LOCAL || 35) - DELIVERY_CHARGE_MIN);
            NATIONAL_FEES = Math.round(Number(DATA?.DELIVERY_NATIONAL || 55) - DELIVERY_CHARGE_MIN);
            ZONAL_FEES = Math.round(Number(DATA?.DELIVERY_ZONAL || 35) - DELIVERY_CHARGE_MIN);
         }


         setIfNotValue(I("#local_shipping_fee_from_buyer"), LOCAL_FEES, true);
         setIfNotValue(I("#zonal_shipping_fee_from_buyer"), ZONAL_FEES, true);
         setIfNotValue(I("#national_shipping_fee_from_buyer"), NATIONAL_FEES, true);

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
         setIfNotValue(I("#hsn"), DATA?.HSN || 1209);
         setIfNotValue(I("#tax_code"), "GST_5");
         setIfNotValue(I("#country_of_origin"), "IN");
         setIfNotValue(I("#manufacturer_details"), DATA?.MANUFACTURER_DETAILS || "Made by our House");
         setIfNotValue(I("#packer_details"), DATA?.PACKER_DETAILS || "Packed by our House");
         setIfNotValue(I("#earliest_mfg_date"), DATA?.EARLIEST_MFG_DATE || "2024-10-30");
         setIfNotValue(I("#shelf_life"), DATA?.SHELF_LIFE || 12);
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
      (openInputBtn = CE({ class: "__btn__" }, "OPEN URLS")),
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
      setup_listing();
   }

   if (ifMatchSingleOrderLocation()) {
      setStyle();
      setup_orders_print();
   }


   if (ifFlipkartSearchLocation()) {
      setStyle();
      setup_flipkart_product_url();
   }

};


addEventListener("mousedown", async (_) => {
   await wait(500);
   // console.clear();

   if (ifMatchSingleListingLocation()) {
      const fwl = I("#__fwl__")[0];
      const isFWL = fwl instanceof Node;

      if (ifHaveSaveButton() && !isFWL) {
         setStyle();
         setup_listing();
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

   if (ifMatchSingleOrderLocation()) {
      const fwo = I("#__fwo__")[0];
      const isFWO = fwo instanceof Node;

      if (!isFWO) {
         setStyle();
         setup_orders_print();
      } else if (isFWO) {
         fwo.style.display = "flex";
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
