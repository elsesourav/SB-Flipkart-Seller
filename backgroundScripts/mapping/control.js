async function modifyVerifiedProducts(products, userId) {
   const MD = await chromeStorageGetLocal(KEYS.STORAGE_MAPPING);
   const MAX_PROFIT = N(MD?.MAX_PROFIT || 25);
   const MIN_PROFIT = N(MD?.MIN_PROFIT || 10);
   const PACKING_COST = N(MD?.PACKING_COST || 3);
   const FIXED_COST = N(MD?.FIXED_COST || 71);

   let DN = N(MD?.DELIVERY_NATIONAL || 19);

   return products.map((product) => {
      const { sellers, subTitle, alreadySelling } = product;
      if(!subTitle) return { PROFIT: 0 };
      
      const { quantity, type } = subTitleToQuantityAndType(subTitle);
      const MRP = sellers?.[0]?.mrp;

      const PRODUCT_COST = getProductCost(MD, quantity, type);
      const UNIT_TO_PIECE = getUnitToPiece(MD, quantity, type);
      const INCREMENT_AMOUNT = getIncrementAmount(MD, UNIT_TO_PIECE);
      const COST = PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT; // SRCELEMENT AMOUNT

      const result = getOptimizedPrice(sellers, userId, alreadySelling, MRP, COST, MIN_PROFIT, MAX_PROFIT, DN, FIXED_COST);
      if (!result) return { PROFIT: 0 };

      const { price, signal, profit, nationalFee } = result;
      return {
         ...product,
         PRICE: Math.round(price) || 0,
         QUANTITY: quantity,
         CATEGORY: type,
         SIGNAL: signal,
         PROFIT: Math.round(profit) || 0,
         NATIONAL_FEE: Math.round(nationalFee) || 0,
      };
   }).filter((product) => product.PROFIT > 0);
}

function getOptimizedPrice(sellers, userId, alreadySelling, MRP, COST, MIN_PROFIT, MAX_PROFIT, national_fee, fixedCost = 71) {
   try {
      // Initialize base values
      const { initialPrice, price90 } = getInitialPriceValues(sellers, userId, alreadySelling, MRP, COST, MAX_PROFIT, fixedCost);
      
      // Calculate initial profit and get optimized values
      let { price, profit, signal } = calculateOptimizedValues(initialPrice, COST, MIN_PROFIT, MAX_PROFIT, fixedCost);
      
      // Adjust price based on MRP constraints
      const adjustedValues = adjustPriceForMRPConstraints(price, profit, signal, price90, MRP, COST, fixedCost);
      price = adjustedValues.price;
      profit = adjustedValues.profit;
      signal = adjustedValues.signal;

      // Calculate national delivery fee
      const nationalDelivery = Math.max(national_fee - (profit - MIN_PROFIT), 0);

      return {
         price,
         profit,
         signal,
         nationalFee: nationalDelivery,
      };
   } catch (error) {
      console.log(error);
      return null;
   }
}

function getInitialPriceValues(sellers, userId, alreadySelling, MRP, COST, MAX_PROFIT, fixedCost) {
   const totalPrice = sellers?.[0]?.totalPrice || 0;
   const sellerId = sellers?.[0]?.sellerId || "";
   const price90 = MRP * 0.1;

   let initialPrice;
   if (alreadySelling && sellerId === userId) {
      const secondSeller = sellers?.[1];
      initialPrice = secondSeller
         ? secondSeller.totalPrice - 1
         : calculatePriceFromProfit({
              desiredProfit: COST + MAX_PROFIT,
              fixedCost,
           });
   } else {
      initialPrice = totalPrice - 1;
   }

   return { initialPrice, price90 };
}

function calculateOptimizedValues(price, COST, MIN_PROFIT, MAX_PROFIT, fixedCost) {
   let profit = getProfitUsingBankSettlement({ price, cost: COST, fixedCost });
   let signal;

   if (profit > 0 && profit < MIN_PROFIT) {
      signal = "#4B3C00";
      profit = MIN_PROFIT;
      price = calculatePriceFromProfit({
         desiredProfit: COST + MIN_PROFIT,
         fixedCost,
      });
   } else if (profit <= 0) {
      signal = "#4A0000";
      profit = MIN_PROFIT;
      price = calculatePriceFromProfit({
         desiredProfit: COST + MIN_PROFIT,
         fixedCost,
      });
   } else if (profit > MAX_PROFIT) {
      signal = "#003925";
      profit = MAX_PROFIT;
      price = calculatePriceFromProfit({
         desiredProfit: COST + MAX_PROFIT,
         fixedCost,
      });
   } else {
      signal = "#1D3B1E";
   }

   return { price, profit, signal };
}

function adjustPriceForMRPConstraints(price, profit, signal, price90, MRP, COST, fixedCost) {
   if (price < price90) {
      price = price90;
      signal = "orange";
      profit = getProfitUsingBankSettlement({
         price,
         cost: COST,
         fixedCost,
      });
   } else if (price > MRP) {
      price = MRP;
      signal = "red";
      profit = getProfitUsingBankSettlement({
         price,
         cost: COST,
         fixedCost,
      });
   }

   return { price, profit, signal };
}

function getMixDataToNewMappingData(DATA) {
   const { products, fkCsrfToken, mappingData: MD, sellerId } = DATA;
   const CHUNK_SIZE = 25;

   const SKU_NAME = MD?.SKU_NAME;
   const LISTING_STATUS_G = MD?.LISTING_STATUS || "ACTIVE";
   const PROCUREMENT_TYPE = MD?.PROCUREMENT_TYPE || "EXPRESS";
   const SHIPPING_DAYS = MD?.SHIPPING_DAYS || 1;
   const STOCK_SIZE = MD?.STOCK_SIZE || 1000;
   const HSN = MD?.HSN || "1209";
   const MINIMUM_ORDER_QUANTITY = MD?.MINIMUM_ORDER_QUANTITY || 1;
   const MANUFACTURER_DETAILS = MD?.MANUFACTURER_DETAILS || "PuravEnterprise";
   const PACKER_DETAILS = MD?.PACKER_DETAILS || "PuravEnterprise";
   const EARLIEST_MFG_DATE = dateToMilliseconds(
      MD?.EARLIEST_MFG_DATE || "2025-01-01"
   );
   const SHELF_LIFE = getSecondsForMonths(N(MD?.SHELF_LIFE || 22)); // in months
   const PACKAGING_LENGTH = MD?.PACKAGING_LENGTH || 21;
   const PACKAGING_BREADTH = MD?.PACKAGING_BREADTH || 17;
   const PACKAGING_HEIGHT = MD?.PACKAGING_HEIGHT || 3;

   // if new price is higher then old price 5% then store multiple request data
   const multiRequestSameProductData = [];

   let newData = products.map((product, i) => {
      const { id, mrp, subTitle, sku_id, ssp, alreadySelling, internal_state, PRICE, NATIONAL_FEE } = product;
      // console.table(id, sku_id, mrp, subTitle, ssp);

      const { sku, quantity, type } = getSkuIDWithData(SKU_NAME, subTitle, i);
      const TOTAL_WEIGHT = getTotalWeight(MD, quantity, type);
      const SKU = alreadySelling ? sku_id : sku;
      const LISTING_STATUS = alreadySelling ? internal_state : LISTING_STATUS_G;

      // console.log(
      //    `alreadySelling: ${alreadySelling}, sku_id: ${sku_id}, sku: ${sku}, id: "${id}"`
      // );

      function getObjByPrice(price = PRICE) {
         return {
            ID: id,
            SKU,
            SELLING_PRICE: price,
            MRP: mrp,
            LISTING_STATUS,
            PROCUREMENT_TYPE,
            SHIPPING_DAYS,
            STOCK_SIZE,
            HSN,
            MINIMUM_ORDER_QUANTITY,
            DELIVERY_LOCAL: 0,
            DELIVERY_NATIONAL: NATIONAL_FEE,
            DELIVERY_ZONAL: 0,
            EARLIEST_MFG_DATE,
            SHELF_LIFE,
            MANUFACTURER_DETAILS,
            PACKER_DETAILS,

            TOTAL_WEIGHT,
            PACKAGING_LENGTH,
            PACKAGING_BREADTH,
            PACKAGING_HEIGHT,
         }
      }

      function pushMultiRequestData(price, i) {
         if (!multiRequestSameProductData[i]) multiRequestSameProductData[i] = [];
         multiRequestSameProductData[i].push(getObjByPrice(price));
      }

      let percent_5 = Math.floor((ssp * 5) / 100);
      let result;

      // console.log(alreadySelling, PRICE, ssp + percent_5, ssp < PRICE - percent_5);
      
      if (alreadySelling && ssp < PRICE - percent_5) {
         let tempPrice = ssp;
         let i = -1;

         while(tempPrice < PRICE - percent_5) {
            tempPrice += percent_5;
            if (i === -1) result = getObjByPrice(tempPrice);
            else pushMultiRequestData(tempPrice, i);
            percent_5 = Math.floor((tempPrice * 5) / 100);
            i++;
         }
         pushMultiRequestData(tempPrice, i);
      } else {
         result = getObjByPrice();
      }

      return result;
   });

   // console.log(multiRequestSameProductData);
   // console.log(newData);

   return {
      SELLER_ID: sellerId,
      FK_CSRF_TOKEN: fkCsrfToken,
      PRODUCTS_CHUNK: splitIntoChunks(newData, multiRequestSameProductData, CHUNK_SIZE)
   };
}

function splitIntoChunks(arr, multiUpdateDataChunk, chunkSize) {
   const result = [];
   for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize));
   }
   multiUpdateDataChunk.forEach((chunk) => {
      result.push(chunk)
   })
   return result;
}


function getTotalWeight(data, quantity, value) {
   return (
      N(data?.PACKET_WEIGHT || 1) +
      (value === "PIECE"
         ? (N(data?.UNIT_WEIGHT || 1) / N(data?.UNIT || 1)) * N(quantity)
         : N(quantity) / (value === "G" ? 1000 : 1))
   ).toFixed(3);
}


function calculateBankSettlement({
   price,
   fixedCost = 71,
   shippingCharge = 0,
   isNational = false,
   isRound = true,
}) {
   const PRICE = price + shippingCharge;
   const TAX = 0.18; // 18% tax
   const MP_TAX = PRICE <= 300 ? 0.14 : PRICE <= 500 ? 0.16 : 0.18;
   const SHIPPING_CHARGES = isNational ? 16 : 0;

   const MP_FEES = {
      commission: PRICE * MP_TAX,
      fixedCost,
      shippingFee: SHIPPING_CHARGES,
   };

   const TAXES = {
      commission: MP_FEES.commission * TAX,
      fixedCost: MP_FEES.fixedCost * TAX,
      shippingFee: MP_FEES.shippingFee * TAX,
   };

   const TCS_TDS = PRICE * 0.0055;

   const TOTAL =
      MP_FEES.commission +
      MP_FEES.fixedCost +
      MP_FEES.shippingFee +
      TAXES.commission +
      TAXES.fixedCost +
      TAXES.shippingFee +
      TCS_TDS;

   const BANK_SETTLEMENT = PRICE - TOTAL;

   return isRound ? Math.round(BANK_SETTLEMENT) : BANK_SETTLEMENT;
}

function getProfitUsingBankSettlement({
   price,
   cost = 0,
   fixedCost = 71,
   shippingCharge = 0,
   isNational = false,
   isRound = true,
}) {
   const result =
      calculateBankSettlement({
         price,
         fixedCost,
         shippingCharge,
         isNational,
         isRound: false,
      }) - cost;

   return isRound ? Math.round(result) : result;
}

function calculatePriceFromProfit({
   desiredProfit,
   fixedCost = 71,
   shippingCharge = 0,
   isNational = false,
   isRound = true,
}) {
   const TAX = 0.18; // 18% tax
   const SHIPPING_CHARGES = isNational ? 16 : 0;

   // Calculate MP_TAX based on PRICE (initial guess)
   function getMPTax(price) {
      const PRICE = price + shippingCharge;
      return PRICE <= 300 ? 0.14 : PRICE <= 500 ? 0.16 : 0.18;
   }

   // Calculate A, B, and C
   const MP_TAX = getMPTax(desiredProfit); // Initial guess for MP_TAX
   const A = MP_TAX + TAX * MP_TAX + 0.0055;
   const B = fixedCost * (1 + TAX);
   const C = SHIPPING_CHARGES * (1 + TAX);

   // Calculate PRICE
   const PRICE = (desiredProfit + B + C) / (1 - A);

   // Adjust for shippingCharge
   const price = PRICE - shippingCharge;

   return isRound ? Math.round(price) : price;
}

function newImgPath(url, ratio = 400, quality = 60) {
   return url
   ?.replace("{@width}", ratio)
   ?.replace("{@height}", ratio)
   ?.replace("{@quality}", quality);
}