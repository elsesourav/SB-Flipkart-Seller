async function openInputButtonAction() {
   try {
      const url = document.querySelector(".productTitle a")?.href;
      const { MRP } = await getProductData(url);
      const DATA = await getMappingData();

      let [LOCAL_FEES, NATIONAL_FEES, ZONAL_FEES] = getDeliveryCharges(DATA);
      const DELIVERY_CHARGE_MIN = Math.min(ZONAL_FEES, NATIONAL_FEES, LOCAL_FEES);
      const uniqueId = getUniqueId();

      console.log("-----------------------------------------------------------------");
      console.log("DATA", DATA);

      let [quantity, value] = I(".productInfo")[0].innerText.toUpperCase().split(" ");
      value = value === "PER" ? "PIECE" : value;
      quantity = N(quantity);

      const sku_id = `${DATA?.SKU_NAME?.toUpperCase()}__${quantity}__${value}__${uniqueId}`;


      const PROFIT = N(DATA?.PROFIT || 15);
      const PACKING_COST = N(DATA?.PACKING_COST || 6);

      const FLIPKART_COST = N(DATA?.FLIPKART_COST || 102);
      const PRODUCT_COST = getProductCost(DATA, quantity, value);

      const UNIT_TO_PIECE = getUnitToPiece(DATA, value, quantity);
      const INCREMENT_AMOUNT = N(DATA?.INCREMENT_UNIT || 0) === 0 ? 0 : parseInt(UNIT_TO_PIECE / N(DATA?.INCREMENT_UNIT || 100));

      let sellingPrice = Math.round(FLIPKART_COST + PROFIT + PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT);

      console.log(`FLIPKART_COST: ${FLIPKART_COST}, PROFIT: ${PROFIT}, PACKING_COST: ${PACKING_COST}, PRODUCT_COST: ${PRODUCT_COST}, INCREMENT_AMOUNT: ${INCREMENT_AMOUNT}`);
      console.log("sellingPrice: " + sellingPrice);

      if (DATA?.IS_INCLUDED) {
         sellingPrice -= DELIVERY_CHARGE_MIN;
      } else {
         LOCAL_FEES -= DELIVERY_CHARGE_MIN;
         NATIONAL_FEES -= DELIVERY_CHARGE_MIN;
         ZONAL_FEES -= DELIVERY_CHARGE_MIN;
      }

      console.log("sellingPrice: " + sellingPrice);

      // calculate 90% percentage of actual price
      const PERCENTAGE_90 = Math.ceil(MRP * 0.1);
      console.log("PERCENTAGE_90: " + PERCENTAGE_90);

      let deltaPrice = PERCENTAGE_90 - sellingPrice;
      console.log("deltaPrice: " + deltaPrice);

      if (sellingPrice < PERCENTAGE_90) {
         sellingPrice = PERCENTAGE_90;
         LOCAL_FEES = Math.max(LOCAL_FEES - deltaPrice, 0);
         NATIONAL_FEES = Math.max(NATIONAL_FEES - deltaPrice, 0);
         ZONAL_FEES = Math.max(ZONAL_FEES - deltaPrice, 0);
      }

      console.log("LOCAL_FEES: " + LOCAL_FEES);
      console.log("NATIONAL_FEES: " + NATIONAL_FEES);
      console.log("ZONAL_FEES: " + ZONAL_FEES);


      console.log("=================================================================");

      const TOTAL_WEIGHT = getTotalWeight(DATA, quantity, value);

      setInput(I("#sku_id"), sku_id);
      setInput(I("#listing_status"), DATA?.LISTING_STATUS || false);
      setInput(I("#mrp"), MRP);

      setInput(I("#flipkart_selling_price"), sellingPrice, true);
      setInput(I("#minimum_order_quantity"), DATA?.MINIMUM_ORDER_QUANTITY || 1);
      setInput(I("#service_profile"), "NON_FBF");
      setInput(I("#procurement_type"), DATA?.PROCUREMENT_TYPE || 1);
      setInput(I("#shipping_days"), DATA?.SHIPPING_DAYS || 1);
      setInput(I("#stock_size"), DATA?.STOCK_SIZE || 1);
      setInput(I("#shipping_provider"), "FLIPKART");


      setInput(I("#local_shipping_fee_from_buyer"), LOCAL_FEES);
      setInput(I("#zonal_shipping_fee_from_buyer"), ZONAL_FEES);
      setInput(I("#national_shipping_fee_from_buyer"), NATIONAL_FEES);

      setInput(I("[name='length_p0']"), DATA?.PACKAGING_LENGTH || 20);
      setInput(I("[name='breadth_p0']"), DATA?.PACKAGING_BREADTH || 16);
      setInput(I("[name='height_p0']"), DATA?.PACKAGING_HEIGHT || 3);

      setInput(I("[name='weight_p0']"), TOTAL_WEIGHT);
      setInput(I("#hsn"), DATA?.HSN || 1209);
      setInput(I("#tax_code"), "GST_5");
      setInput(I("#country_of_origin"), "IN");
      setInput(I("#manufacturer_details"), DATA?.MANUFACTURER_DETAILS || "Made by our House");
      setInput(I("#packer_details"), DATA?.PACKER_DETAILS || "Packed by our House");
      setInput(I("#earliest_mfg_date"), DATA?.EARLIEST_MFG_DATE || "2024-10-30");
      setInput(I("#shelf_life"), DATA?.SHELF_LIFE || 12);
      setInput(I("[name='shelf_life_0_qualifier']"), "MONTHS");
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