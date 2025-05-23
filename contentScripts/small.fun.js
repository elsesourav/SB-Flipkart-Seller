function fillMappingInputs(data = null) {
   return new Promise(async (resolve) => {
      try {
         let DATA, M_R_P, url;

         if (!data) {
            url = document.querySelector(".productTitle a")?.href;
            const { MRP } = await getProductData(url);
            M_R_P = MRP;
            DATA = await getMappingData();
         } else {
            DATA = data;
         }

         let [LOCAL_FEES, NATIONAL_FEES, ZONAL_FEES] = getDeliveryCharges(DATA);
         const DELIVERY_CHARGE_MIN = Math.min(
            ZONAL_FEES,
            NATIONAL_FEES,
            LOCAL_FEES
         );
         const uniqueId = getUniqueId();

         console.log(
            "-----------------------------------------------------------------"
         );
         console.log("DATA", DATA);

         let sku_id, quantity, value;
         if (!data) {
            const [q, v] = I(".productInfo")[0]
               .innerText.toUpperCase()
               .split(" ");
            value = v === "PER" ? "PIECE" : v;
            quantity = N(q);

            sku_id = `${DATA?.SKU_NAME?.toUpperCase()}__${quantity}__${value}__${uniqueId}`;
         } else {
            quantity = DATA?.QUANTITY;
            value =
               DATA?.QUANTITY_IN === "per packet"
                  ? "PIECE"
                  : DATA?.QUANTITY_IN.toUpperCase();
            sku_id = `${DATA?.SKU_NAME?.toUpperCase()}__${quantity}__${value}__${uniqueId}`;
         }

         const PROFIT = N(DATA?.PROFIT || 15);
         const PACKING_COST = N(DATA?.PACKING_COST || 6);

         const FIXED_COST = N(DATA?.FIXED_COST || 71);
         const PRODUCT_COST = getProductCost(DATA, quantity, value);

         const UNIT_TO_PIECE = getUnitToPiece(DATA, value, quantity);
         const INCREMENT_AMOUNT =
            N(DATA?.INCREMENT_UNIT || 0) === 0
               ? 0
               : parseInt(UNIT_TO_PIECE / N(DATA?.INCREMENT_UNIT || 100));

         let sellingPrice = calculateProductPriceFromProfit(
            FIXED_COST,
            PROFIT + PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT
         );

         // console.log(`FIXED_COST: ${FIXED_COST}, PROFIT: ${PROFIT}, PACKING_COST: ${PACKING_COST}, PRODUCT_COST: ${PRODUCT_COST}, INCREMENT_AMOUNT: ${INCREMENT_AMOUNT}`);
         // console.log("sellingPrice: " + sellingPrice);

         if (DATA?.IS_INCLUDED) {
            sellingPrice -= DELIVERY_CHARGE_MIN;
         } else {
            LOCAL_FEES -= DELIVERY_CHARGE_MIN;
            NATIONAL_FEES -= DELIVERY_CHARGE_MIN;
            ZONAL_FEES -= DELIVERY_CHARGE_MIN;
         }

         // console.log("sellingPrice: " + sellingPrice);

         if (!data) {
            // calculate 90% percentage of actual price
            const PERCENTAGE_90 = Math.ceil(M_R_P * 0.1);
            // console.log("PERCENTAGE_90: " + PERCENTAGE_90);

            let deltaPrice = PERCENTAGE_90 - sellingPrice;
            // console.log("deltaPrice: " + deltaPrice);

            if (sellingPrice < PERCENTAGE_90) {
               sellingPrice = PERCENTAGE_90;
               LOCAL_FEES = Math.max(LOCAL_FEES - deltaPrice, 0);
               NATIONAL_FEES = Math.max(NATIONAL_FEES - deltaPrice, 0);
               ZONAL_FEES = Math.max(ZONAL_FEES - deltaPrice, 0);
            }

            // console.log("LOCAL_FEES: " + LOCAL_FEES);
            // console.log("NATIONAL_FEES: " + NATIONAL_FEES);
            // console.log("ZONAL_FEES: " + ZONAL_FEES);
         }

         // console.log("=================================================================");
         const TOTAL_WEIGHT = getTotalWeight(DATA, quantity, value);

         if (data) {
            M_R_P = (sellingPrice * N(DATA?.MRP_MULTIPLY_PERCENT)) / 10;

            if (DATA?.IS_ATTRACTIVE_MRP) {
               M_R_P = reduceToNearestFifty(M_R_P);
            }
         }

         setInput(I("#sku_id"), sku_id);
         setInput(I("#listing_status"), DATA?.LISTING_STATUS || false);
         // console.log("M_R_P: " + M_R_P);

         setInput(I("#mrp"), M_R_P);

         setInput(I("#flipkart_selling_price"), sellingPrice, true);
         setInput(
            I("#minimum_order_quantity"),
            DATA?.MINIMUM_ORDER_QUANTITY || 1
         );
         setInput(I("#service_profile"), "NON_FBF");
         setInput(I("#procurement_type"), DATA?.PROCUREMENT_TYPE || 1);
         setInput(I("#shipping_days"), DATA?.SHIPPING_DAYS || 1);
         setInput(I("#stock_size"), DATA?.STOCK_SIZE || 1);
         setInput(I("#shipping_provider"), "FLIPKART");

         setInput(I("#local_shipping_fee_from_buyer"), LOCAL_FEES);
         setInput(I("#zonal_shipping_fee_from_buyer"), ZONAL_FEES);
         setInput(I("#national_shipping_fee_from_buyer"), NATIONAL_FEES);

         if (!data) {
            setInput(I("[name='length_p0']"), DATA?.PACKAGING_LENGTH || 20);
            setInput(I("[name='breadth_p0']"), DATA?.PACKAGING_BREADTH || 16);
            setInput(I("[name='height_p0']"), DATA?.PACKAGING_HEIGHT || 3);
            setInput(I("[name='weight_p0']"), TOTAL_WEIGHT);
         } else {
            setInput(
               I("[name='length_0_value']"),
               DATA?.PACKAGING_LENGTH || 20
            );
            setInput(
               I("[name='breadth_0_value']"),
               DATA?.PACKAGING_BREADTH || 16
            );
            setInput(I("[name='height_0_value']"), DATA?.PACKAGING_HEIGHT || 3);
            setInput(I("[name='weight_0_value']"), TOTAL_WEIGHT);
         }

         setInput(I("#hsn"), DATA?.HSN || 1209);
         setInput(I("#tax_code"), "GST_5");
         setInput(I("#country_of_origin"), "IN");
         setInput(
            I("#manufacturer_details"),
            DATA?.MANUFACTURER_DETAILS || "Made by our House"
         );
         setInput(
            I("#packer_details"),
            DATA?.PACKER_DETAILS || "Packed by our House"
         );
         setInput(
            I("#earliest_mfg_date"),
            DATA?.EARLIEST_MFG_DATE || "2024-10-30"
         );
         setInput(I("#shelf_life"), DATA?.SHELF_LIFE || 12);
         setInput(I("[name='shelf_life_0_qualifier']"), "MONTHS");
         resolve(uniqueId);
      } catch (error) {
         alert(error);
      }
      resolve(null);
   });
}

async function copyMappingInputs() {
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

function printTable() {
   const printWindow = window.open("", "_blank");
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
                  font-size: 18px;
               }
               ._-table-cover {
                  position: relative;
                  width: 800px;
                  max-height: 100%;
                  display: flex;
                  justify-content: center;
                  background: #dddddd;
                  border-radius: 10px;
                  box-shadow: 0 0 10px #000;
                  padding: 10px;
                  margin: 0 auto;
               }
               ._-table {
                  position: relative;
                  box-sizing: border-box;
                  width: 100%;
                  height: 100%;
                  margin: 5px;
                  display: grid;
                  grid-template-columns: 1fr;
                  gap: 10px;
                  color: #000
               }
               ._-row {
                  position: relative;
                  width: 100%;
                  padding: 6px;
                  border-bottom: 3px double #000;
                  border-radius: 8px;
                  background: #eeeeee;
               }
               ._-row:nth-child(4n + 1),
               ._-row:nth-child(4n) {
                  background: #ffffff;
               }
               ._-checkbox {
                  display: none;
               }
               ._-cell {
                  width: 100%;
                  position: relative;
                  padding: 8px;
                  opacity: 1;
               }
               ._-multi {
                  color: #ff7600;
               }
               ._-header {
                  width: 100%;
                  border-radius: 10px;
                  border: 1px dashed #000;
                  font-weight: bold;
                  background: #00f9ff8a;
                  text-shadow: 1px 1px 0 #fff;
               }
               ._-seed-type {
                  font-weight: bold;
                  background-color: #f8f8f8;
               }
               @media print {
                  @page { margin: 0.5cm; }
                  ._-table-cover {
                     box-shadow: none;
                  }
               }
            </style>
         </head>
         <body>
            ${TABLE.outerHTML.replace(/〉/g, " ]").replace(/〈/g, " [")}
         </body>
      </html>
   `);
   printWindow.document.close();
   printWindow.print();
}

async function downloadAsImage() {
   const canvas = await html2canvas(TABLE.querySelector("._-table"));
   const link = document.createElement("a");
   const date = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
   });
   link.download = `Orders ${date}.png`;
   link.href = canvas.toDataURL();
   link.click();
}

async function showOrders() {
   const sku_ids = document.querySelectorAll(".krECZe .hXpCNJ");
   const unit = document.querySelectorAll(".hCSXUa .hXpCNJ");
   const DATA = await getOrderData();

   const { products, replaceJson: REPLACE, settings, changesSKU } = DATA;
   const {
      WORD_IN_DIFFERENT_LANGUAGE: IS_WORD_LEN,
      NUMBER_IN_DIFFERENT_LANGUAGE: IS_NUM_LEN,
   } = settings;

   TABLE.style.fontSize = "18px";

   const SKU = [...sku_ids].map((ele) => ele.innerText);
   const UNIT = [...unit].map((ele) => parseInt(ele.innerText));

   const PRODUCTS_INFO = SKU.map((ele) => {
      const name = changesSKU[ele.replace(/ /g, "").toLowerCase()];
      const correctSku = name ? name.NEW_SKU_ID : ele;
      return correctSku.split("__");
   });

   const PRODUCTS = {};

   PRODUCTS_INFO.forEach((p_info, i) => {
      if (p_info.length >= 3) {
         let [nm, quantity, type] = p_info;
         const splitName = nm.split("-");

         // const isMy = splitName.length > 1;
         let name = splitName[splitName.length - 1].toLowerCase();

         let IN_GRAM = "";

         // calculate weight if type is PIECE
         if (type.toUpperCase() === "PIECE" && products[name]) {
            const { unit, weight } = products[name];

            const per = 1000 / (unit / weight);
            const inGram = quantity * per;
            let fixedResult = inGram.toFixed(2);
            if (IS_NUM_LEN) {
               fixedResult = numberChangeLen(REPLACE, fixedResult);
            }

            const G = IS_WORD_LEN ? REPLACE["g"] || "G" : "G";

            IN_GRAM = ` 〉〈 ${fixedResult} ${G}`;
         }

         if (IS_WORD_LEN) {
            name = REPLACE[name] || name;
            type = REPLACE[type.toLowerCase()] || type;
         }

         if (IS_NUM_LEN) {
            quantity = numberChangeLen(REPLACE, quantity);
         }

         !PRODUCTS[name] && (PRODUCTS[name] = {});
         const key = `${quantity} ${type}${IN_GRAM}`;
         PRODUCTS[name][key] = (PRODUCTS[name][key] || 0) + UNIT[i];
      } else {
         console.log("SKU NOT MATCHING THE FORMAT -> ", SKU[i]);
      }
   });

   const ARRAY_PRODUCTS = Object.entries(PRODUCTS);
   ARRAY_PRODUCTS.sort(
      (a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length
   );
   const OBJECT_ORDERS = Object.fromEntries(ARRAY_PRODUCTS);

   const tableRows = Object.entries(OBJECT_ORDERS)
      .map(([name, multi]) => {
         let TOTAL = Object.values(multi).reduce((a, b) => a + b, 0);
         TOTAL = TOTAL > 1 ? `(${TOTAL})` : "";

         if (IS_NUM_LEN) {
            TOTAL = numberChangeLen(REPLACE, TOTAL);
         }

         const NAME = name.toUpperCase();
         const header = `
            <input type="checkbox" class="_-checkbox" />
            <div class="_-cell _-header">${NAME}&nbsp;&nbsp;&nbsp;${TOTAL}</div>
         `;

         const cells = Object.entries(multi)
            .map(([quantity, multi]) => {
               let MULTI = IS_NUM_LEN
                  ? `${numberChangeLen(REPLACE, `${multi} x`)}`
                  : `${multi}x`;

               const isMulti =
                  multi > 1 ? ` -> <span class="_-multi">${MULTI}</span>` : "";
               return `<div class="_-cell">${quantity}${isMulti}</div>`;
            })
            .join("");

         return `<div class="_-row">${header}${cells}</div>`;
      })
      .join("");

   TABLE.innerHTML = `<div class="_-table-cover"><div class="_-table">${tableRows}</div></div>`;
}

function fillLintingInputs(DATA) {
   return new Promise(async (resolve) => {
      try {
         DATA = DATA ? DATA : await getListingData();
         const sales_package = `Pack of ${DATA?.QUANTITY}${
            DATA?.QUANTITY_IN == "g" ? " grams" : ""
         } seeds`;
         const inPackHave = DATA?.QUANTITY.toString();
         let { images } = DATA;

         const editButtons = I(
            '#sub-app-container .hTTPSU[data-testid="button"]'
         );

         await putImagesIntoListing(images, editButtons);

         // ------- Price, Stock and Shipping Information ---------

         editButtons[1].click();
         await wait(500);

         const uniqueId = await fillMappingInputs(DATA);

         saveButtonClick();
         await waitingForSaved();
         await wait(500);

         editButtons[2].click();
         await wait(500);
         // // ---------- Product Description ------------

         setInput(
            I("#model_name"),
            `${DATA?.MODEL_ID} ${uniqueId}` || uniqueId
         );

         const NAME = generateProductTitle(
            DATA?.NAME_ADJECTIVES || "",
            DATA?.NAME_TYPES || "",
            DATA?.NAME_FEATURES || ""
         );

         setupMultipleCommonName("common_name", NAME);

         setInput(I("#quantity"), DATA.QUANTITY || 1);

         setInput(I("[name='quantity_0_qualifier']"), DATA?.QUANTITY_IN || "");

         setupMultipleValuesBYIndex("suitable_for", DATA?.SUITABLE_FOR || "");

         setInput(I("#organic"), DATA?.ORGANIC || 1);

         setupMultipleValues("sales_package", sales_package);

         setupMultipleValuesBYIndex("type_of_seed", DATA?.SEED_TYPE || "");

         saveButtonClick();
         await waitingForSaved();
         await wait(500);
         editButtons[3].click();
         await wait(500);

         // // ------- Additional Description (Optional) --------

         setInput(I("#flowering_plant"), DATA?.FLOWERING_PLANT || "");

         setInput(I("#description"), DATA?.DESCRIPTION || "");

         setupMultipleKeywords(
            "keywords",
            DATA?.SEARCH_KEYWORDS || "",
            DATA?.FIXED_KEYWORD_FIRST || 0
         );

         setupMultipleValues("key_features", DATA?.KEY_FEATURES || "");

         setInput(I("#video_url"), DATA?.VIDEO_URL || "");

         setInput(I("#family"), DATA?.FAMILY || "");

         setInput(I("#scientific_name"), DATA?.SCIENTIFIC_NAME || "");

         setupMultipleValues("uses", DATA?.USES || "");

         setupMultipleValues(
            "soil_nutrient_requirements",
            DATA?.SOIL_NUTRIENT_REQUIREMENTS || ""
         );

         setInput(I("#sowing_method"), DATA?.SOWING_METHOD || "");

         setupMultipleValuesBYIndex("season", DATA?.SEASON || "");

         setInput(I("#pack_of"), inPackHave);

         setInput(I("#max_shelf_life"), DATA?.MAX_SHELF_LIFE || "");

         setupMultipleValues("ean", DATA?.EAN_UPC || "");

         setInput(I("#soil_type"), DATA?.SOIL_TYPE || "");

         setInput(I("#sunlight"), DATA?.SUNLIGHT || "");

         setInput(I("#watering"), DATA?.WATERING || "");

         setInput(I("#germination_time"), DATA?.GERMINATION_TIME || "");

         setupMultipleValues(
            "care_instructions",
            DATA?.CARE_INSTRUCTIONS || ""
         );

         setupMultipleValues("other_features", DATA?.OTHER_FEATURES || "");

         await wait(500);
         saveButtonClick();
         await waitingForSaved();
         await wait(500);
         resolve(true);
      } catch (error) {
         resolve(false);
         alert(error);
      }
   });
}

async function copyListingInputs() {
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
}

function setBrand(DATA) {
   return new Promise(async (resolve) => {
      await wait(500);
      const input = I(`[placeholder="Enter Brand Name"]`)[0];

      input.value = DATA?.BRAND_NAME || "SILBA";
      setInputLikeHuman(input);
      const ele1 = document.querySelector(
         `#sub-app-container [data-testid="button"]`
      );
      ele1.click();
      setInputLikeHuman(ele1);
      await wait(600);

      const ele2 = document.querySelectorAll(
         `#sub-app-container [data-testid="button"]`
      )[1];
      ele2.click();
      setInputLikeHuman(ele2);

      await wait(1000);
      resolve(true);
   });
}

function sendToQC() {
   return new Promise(async (resolve) => {
      document
         .querySelectorAll(`#sub-app-container button[data-testid="button"]`)[1]
         .click();
      await wait(500);
      console.log("sent to qc");

      resolve(true);
   });
}

function reduceToNearestFifty(number) {
   number = Number(number);
   if (50 <= number && number <= 200) {
      const remainder = number % 10;
      return number - remainder - 1;
   } else if (number > 200) {
      const remainder = number % 50;
      return number - remainder - 1;
   }
   return number;
}
