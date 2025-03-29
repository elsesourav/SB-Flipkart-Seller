async function modifyVerifiedProducts(products, userId) {
   const MD = await chromeStorageGetLocal(KEYS.STORAGE_MAPPING);

   console.log(MD);
   const PACKING_COST = N(MD?.PACKING_COST || 3);
   const FIXED_COST = N(MD?.FIXED_COST || 71);

   return products
      .map((product) => {
         const { sellers, subTitle } = product;
         if (!subTitle) return { PROFIT: 0 };

         const { quantity, type } = subTitleToQuantityAndType(subTitle);
         const MRP = sellers?.[0]?.mrp;

         const PRODUCT_COST = getProductCost(MD, quantity, type);
         const UNIT_TO_PIECE = getUnitToPiece(MD, quantity, type);
         const INCREMENT_AMOUNT = getIncrementAmount(MD, UNIT_TO_PIECE);
         const COST = PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT; // TOTAL COST

         const result = getOptimizedPrice(
            sellers,
            userId,
            MRP,
            COST,
            MIN_PROFIT,
            MAX_PROFIT,
            DN,
            FIXED_COST
         );
         if (!result) return { PROFIT: 0 };

         const { price, signal, profit, nationalFee } = result;
         // const NATIONAL_FEE = Math.round(nationalFee) || 0;
         const NATIONAL_FEE = 22;
         // const AVG_SRCELEMENT_AMOUNT = (COST + profit) * 0.44 + (COST + profit - MIN_PROFIT) * 0.56;
         return {
            ...product,
            PRICE: Math.round(price) || 0,
            QUANTITY: quantity,
            CATEGORY: type,
            SRCELEMENT_AMOUNT: COST + profit,
            SIGNAL: signal,
            PROFIT: Math.round(profit) || 0,
            NATIONAL_FEE,
         };
      })
      .filter((product) => product.PROFIT > 0);
}

async function modifyNewProducts(products, userId) {
   const MD = await chromeStorageGetLocal(KEYS.STORAGE_MAPPING);
   products = products.filter((product) => !product.alreadySelling);

   const PACKING_COST = N(MD?.PACKING_COST || 3);
   const FIXED_COST = N(MD?.FIXED_COST || 71);

   return products
      .map((product) => {
         const { sellers, subTitle } = product;
         if (!subTitle) return { PROFIT: 0 };

         const { quantity, type } = subTitleToQuantityAndType(subTitle);
         const MRP = sellers?.[0]?.mrp;

         const PRODUCT_COST = getProductCost(MD, quantity, type);
         const UNIT_TO_PIECE = getUnitToPiece(MD, quantity, type);
         const INCREMENT_AMOUNT = getIncrementAmount(MD, UNIT_TO_PIECE);
         const COST = PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT; // TOTAL COST

         const result = getOptimizePriceForNewProduct(
            sellers,
            userId,
            MRP,
            COST,
            FIXED_COST,
            MD
         );

         if (!result) return { PROFIT: 0 };
         const { price, signal, profit, nationalProfit, nationalFee } = result;

         return {
            ...product,
            PRICE: Math.round(price) || 0,
            QUANTITY: quantity,
            CATEGORY: type,
            SIGNAL: signal,
            PROFIT: Math.round(profit) || 0,
            NATIONAL_PROFIT: nationalProfit,
            NATIONAL_FEE: nationalFee,
         };
      })
      .filter((product) => product.PROFIT > 0);
}

function getOptimizePriceForNewProduct(sellers, uid, mrp, cost, fCost, MD) {
   try {
      const MIN_LZ = N(MD?.MIN_PROFIT_LZ || 10);
      const MAX_LZ = N(MD?.MAX_PROFIT_LZ || 25);
      const MIN_N = N(MD?.MIN_PROFIT_N || 7);
      const MAX_N = N(MD?.MAX_PROFIT_N || 20);

      let r = getLowPriceValues(sellers, uid, 0, mrp, cost, MIN_LZ, fCost);

      const { lowPrice, price90 } = r;

      // Calculate initial profit and get optimized values
      r = calculateOptimizedValues(lowPrice, cost, MIN_LZ, MAX_LZ, fCost);

      let { price, profit, signal } = r;

      // Adjust price based on MRP constraints update r object
      adjustPriceLimits(r, price90, mrp, cost, fCost);

      // Calculate national delivery fee
      const nationalProfit = map(MIN_LZ, MAX_LZ, MIN_N, MAX_N, profit);
      const nationalFee = 22 - (profit - nationalProfit);

      return {
         price,
         profit,
         nationalProfit,
         signal,
         nationalFee,
      };
   } catch (error) {
      console.log(error);
      return null;
   }
}

function getOptimizedPrice(
   sellers,
   userId,
   alreadySelling,
   MRP,
   COST,
   MIN_PROFIT,
   MAX_PROFIT,
   national_fee,
   fixedCost = 71
) {
   try {
      // Initialize base values
      // const { initialPrice, price90 } = getInitialPriceValues(
      //    sellers,
      //    userId,
      //    alreadySelling,
      //    MRP,
      //    COST,
      //    MAX_PROFIT,
      //    fixedCost
      // );

      // Calculate initial profit and get optimized values
      let { price, profit, signal } = calculateOptimizedValues(
         initialPrice,
         COST,
         MIN_PROFIT,
         MAX_PROFIT,
         fixedCost
      );

      // Adjust price based on MRP constraints
      const adjustedValues = adjustPriceForMRPConstraints(
         price,
         profit,
         signal,
         price90,
         MRP,
         COST,
         fixedCost
      );
      price = adjustedValues.price;
      profit = adjustedValues.profit;
      signal = adjustedValues.signal;

      // Calculate national delivery fee
      const nationalDelivery = Math.max(
         national_fee - (profit - MIN_PROFIT),
         0
      );

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

function getLowPriceValues(sellers, uId, sell, mrp, cost, profit, fCost) {
   const totalPrice = sellers?.[0]?.totalPrice || 0;
   const sellerId = sellers?.[0]?.sellerId || "";
   const price90 = mrp * 0.1;

   if (!sell && sellerId != uId) {
      return {
         lowPrice: totalPrice - 1,
         price90,
      };
   }

   const secondSeller = sellers?.[1];
   if (secondSeller) {
      return { lowPrice: secondSeller.totalPrice - 1, price90 };
   }

   return {
      lowPrice: calculatePriceFromProfit({
         desiredProfit: cost + profit,
         fCost,
      }),
      price90,
   };
}

function calculateOptimizedValues(
   price,
   COST,
   MIN_PROFIT,
   MAX_PROFIT,
   fixedCost
) {
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

function adjustPriceLimits(O, price90, MRP, COST, fixedCost) {
   if (O.price < price90) {
      O.price = price90;
      O.signal = "orange";
      O.profit = getProfitUsingBankSettlement({
         price: O.price,
         cost: COST,
         fixedCost,
      });
   } else if (O.price > MRP) {
      O.price = MRP;
      signal = "red";
      profit = getProfitUsingBankSettlement({
         price: O.price,
         cost: COST,
         fixedCost,
      });
   }

   return O;
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
      const {
         id,
         mrp,
         subTitle,
         sku_id,
         ssp,
         alreadySelling,
         internal_state,
         PRICE,
         NATIONAL_FEE,
      } = product;
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
         };
      }

      function pushMultiRequestData(price, i) {
         if (!multiRequestSameProductData[i])
            multiRequestSameProductData[i] = [];
         multiRequestSameProductData[i].push(getObjByPrice(price));
      }

      let percent_5 = Math.floor((ssp * 5) / 100);
      let result;

      // console.log(alreadySelling, PRICE, ssp + percent_5, ssp < PRICE - percent_5);

      if (alreadySelling && ssp < PRICE - percent_5) {
         let tempPrice = ssp;
         let i = -1;

         while (tempPrice < PRICE - percent_5) {
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
      PRODUCTS_CHUNK: splitIntoChunks(
         newData,
         multiRequestSameProductData,
         CHUNK_SIZE
      ),
   };
}

function getMixDataForNewMapping(DATA) {
   const { products, fkCsrfToken, mappingData: MD, sellerId } = DATA;
   const CHUNK_SIZE = 25;

   const SKU_NAME = MD?.PRODUCT_NAME.toUpperCase();
   const LISTING_STATUS_G = MD?.LISTING_STATUS || "ACTIVE";
   const PROCUREMENT_TYPE = MD?.PROCUREMENT_TYPE || "EXPRESS";
   const SHIPPING_DAYS = MD?.SHIPPING_DAYS || 1;
   const STOCK_SIZE = MD?.STOCK_SIZE || 1000;
   const HSN = MD?.HSN || "1209";
   const MINIMUM_ORDER_QUANTITY = MD?.MINIMUM_ORDER_QUANTITY || 1;
   const MANUFACTURER_DETAILS = MD?.MANUFACTURER_DETAILS || "Purav Enterprise";
   const PACKER_DETAILS = MD?.PACKER_DETAILS || "Purav Enterprise";
   const EARLIEST_MFG_DATE = dateToMilliseconds(
      MD?.EARLIEST_MFG_DATE || "2025-03-03"
   );
   const SHELF_LIFE = getSecondsForMonths(N(MD?.SHELF_LIFE || 22)); // in months
   const PACKAGING_LENGTH = MD?.PACKAGING_LENGTH || 21;
   const PACKAGING_BREADTH = MD?.PACKAGING_BREADTH || 17;
   const PACKAGING_HEIGHT = MD?.PACKAGING_HEIGHT || 3;

   // if new price is higher then old price 5% then store multiple request data
   const multiRequestSameProductData = [];

   let newData = products.map((product, i) => {
      const { id, mrp, subTitle, PRICE, NATIONAL_FEE, SRCELEMENT_AMOUNT } =
         product;
      // console.table(id, sku_id, mrp, subTitle, ssp);

      const { sku, quantity, type } = getSkuIDWithData(SKU_NAME, subTitle, i);
      const TOTAL_WEIGHT = getTotalWeight(MD, quantity, type);
      const SKU = sku;
      const LISTING_STATUS = LISTING_STATUS_G;

      // console.log(
      //    `alreadySelling: ${alreadySelling}, sku_id: ${sku_id}, sku: ${sku}, id: "${id}"`
      // );

      return {
         ID: id,
         SKU,
         SELLING_PRICE: PRICE,
         SRCELEMENT_AMOUNT,
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
      };
   });

   // console.log(multiRequestSameProductData);
   // console.log(newData);

   return {
      SELLER_ID: sellerId,
      FK_CSRF_TOKEN: fkCsrfToken,
      PRODUCTS_CHUNK: splitIntoChunks(
         newData,
         multiRequestSameProductData,
         CHUNK_SIZE
      ),
   };
}

function splitIntoChunks(arr, multiUpdateDataChunk, chunkSize) {
   const result = [];
   for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize));
   }
   multiUpdateDataChunk.forEach((chunk) => {
      result.push(chunk);
   });
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

function newImgPath(url, ratio = 400, quality = 60) {
   return url
      ?.replace("{@width}", ratio)
      ?.replace("{@height}", ratio)
      ?.replace("{@quality}", quality);
}
