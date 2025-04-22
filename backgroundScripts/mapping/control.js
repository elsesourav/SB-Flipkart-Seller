async function modifyNewProductsData(products, userId) {
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

      let r = getLowPriceValues(sellers, uid, 0, mrp, cost, MAX_LZ, fCost);

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

async function modifyOldProductsData(products, userId) {
   const MD = await chromeStorageGetLocal(KEYS.STORAGE_MAPPING);
   products = products.filter((p) => p?.sellers && p.sellers.length > 0);

   const PACKING_COST = N(MD?.PACKING_COST || 3);
   const FIXED_COST = N(MD?.FIXED_COST || 71);
   /* 
   alreadySelling: true
   brand: "ActrovaX"
   esp: 37
   finalPrice: 150
   id: "PAEGUYZYFRUB6GGX"
   imageUrl: "https://img.fkcdn.com/image/xif0q/plant-seed/2/4/s/250-hybrid-cucumber-seed-250-seeds-actrovax-original-imaguyzyumwwsp6j.jpeg"
   internal_state: "ACTIVE"
   is: true
   mrp: 449
   name: "cucumber seed"
   newTitle: "Cucumber Seed"
   procurement_type: "EXPRESS"
   productBrand: "ActrovaX"
   rating: undefined
   sellers: (4) [{…}, {…}, {…}, {…}]
   sku_id: "CUCUMBER__250__PIECE__52CU"
   ssp: 150
   subTitle: "250 per packet"
   title: "ActrovaX Cucumber Seed"
   vertical: "plant_seed"
   */

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

         const result = getOptimizePriceForOldProduct(
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
            SRCELEMENT_AMOUNT: COST + Math.round(profit),
            NATIONAL_FEE: nationalFee,
         };
      })
      .filter((product) => product.PROFIT > 0);
}

function getOptimizePriceForOldProduct(sellers, uid, mrp, cost, fCost, MD) {
   try {
      const MIN_LZ = N(MD?.MIN_PROFIT_LZ || 10);
      const MAX_LZ = N(MD?.MAX_PROFIT_LZ || 25);
      const MIN_N = N(MD?.MIN_PROFIT_N || 7);
      const MAX_N = N(MD?.MAX_PROFIT_N || 20);

      let r = getLowPriceValues(sellers, uid, 0, mrp, cost, MAX_LZ, fCost);

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

// function getOptimizedPrice(
//    sellers,
//    userId,
//    alreadySelling,
//    MRP,
//    COST,
//    MIN_PROFIT,
//    MAX_PROFIT,
//    national_fee,
//    fixedCost = 71
// ) {
//    try {
//       // Initialize base values
//       // const { initialPrice, price90 } = getInitialPriceValues(
//       //    sellers,
//       //    userId,
//       //    alreadySelling,
//       //    MRP,
//       //    COST,
//       //    MAX_PROFIT,
//       //    fixedCost
//       // );

//       // Calculate initial profit and get optimized values
//       let { price, profit, signal } = calculateOptimizedValues(
//          initialPrice,
//          COST,
//          MIN_PROFIT,
//          MAX_PROFIT,
//          fixedCost
//       );

//       // Adjust price based on MRP constraints
//       const adjustedValues = adjustPriceForMRPConstraints(
//          price,
//          profit,
//          signal,
//          price90,
//          MRP,
//          COST,
//          fixedCost
//       );
//       price = adjustedValues.price;
//       profit = adjustedValues.profit;
//       signal = adjustedValues.signal;

//       // Calculate national delivery fee
//       const nationalDelivery = Math.max(
//          national_fee - (profit - MIN_PROFIT),
//          0
//       );

//       return {
//          price,
//          profit,
//          signal,
//          nationalFee: nationalDelivery,
//       };
//    } catch (error) {
//       console.log(error);
//       return null;
//    }
// }

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

function getMixDataForNewMapping(DATA) {
   const { products, fkCsrfToken, mappingData: MD, sellerId } = DATA;


   console.log(DATA);

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

      const { sku, quantity, type } = getSkuIDWithData(SKU_NAME, subTitle, i);
      const TOTAL_WEIGHT = getTotalWeight(MD, quantity, type);
      const SKU = sku;
      const LISTING_STATUS = LISTING_STATUS_G;

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
         BATCH_SIZE
      ),
   };
}

async function getMixDataForOldMapping(DATA) {
   let { products, fkCsrfToken, mappingData: MD, sellerId } = DATA;
   let result = [];

   const SHIPPING_DAYS = MD?.SHIPPING_DAYS || 1;
   const STOCK_SIZE = MD?.STOCK_SIZE || 1000;
   const HSN = MD?.HSN || "1209";
   const MINIMUM_ORDER_QUANTITY = MD?.MINIMUM_ORDER_QUANTITY || 1;
   const MANUFACTURER_DETAILS = MD?.MANUFACTURER_DETAILS || "PuravEnterprise";
   const PACKER_DETAILS = MD?.PACKER_DETAILS || "PuravEnterprise";
   const EARLIEST_MFG_DATE = dateToMilliseconds(
      MD?.EARLIEST_MFG_DATE || "2025-04-01"
   );
   const SHELF_LIFE = getSecondsForMonths(N(MD?.SHELF_LIFE || 22)); // in months
   const PACKAGING_LENGTH = MD?.PACKAGING_LENGTH || 21;
   const PACKAGING_BREADTH = MD?.PACKAGING_BREADTH || 17;
   const PACKAGING_HEIGHT = MD?.PACKAGING_HEIGHT || 3;
   const CURRENT_TIER = MD?.CURRENT_TIER || "bronze";

   // if new price is higher then old price 5% then store multiple request data
   const multiRequestSameProductData = [];

   products = await getProductsFeesAndTaxes(
      products,
      CURRENT_TIER,
      fkCsrfToken
   );
   // console.log(products);

   let newData = products.map((product) => {
      const {
         id,
         mrp,
         sku_id,
         QUANTITY,
         CATEGORY,
         ssp,
         esp,
         internal_state,
         procurement_type,
         SRCELEMENT_AMOUNT,
         PRICE,
         NATIONAL_FEE,
         zonalPercentage: zp,
         localPercentage: lp,
      } = product;
      // console.log(product);

      //                                  if zonal + local = 50% -> 0.50%
      const extra = (22 - NATIONAL_FEE) * ((zp + lp) / 100);
      const NEW_SRCELEMENT_AMOUNT = Math.floor(SRCELEMENT_AMOUNT - extra);

      const TOTAL_WEIGHT = getTotalWeight(MD, QUANTITY, CATEGORY);

      function getObjByPrice(esp) {
         return {
            ID: id,
            SKU: sku_id,
            SRCELEMENT_AMOUNT: esp,
            MRP: mrp,
            SELLING_PRICE: PRICE,
            LISTING_STATUS: internal_state,
            PROCUREMENT_TYPE: procurement_type,
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

      function pushMultiRequestData(esp, i) {
         if (!multiRequestSameProductData[i])
            multiRequestSameProductData[i] = [];
         multiRequestSameProductData[i].push(getObjByPrice(esp));
      }

      let difference = esp;

      if (esp && NEW_SRCELEMENT_AMOUNT > difference) {
         let tempEsp = difference + 1;
         let i = -1;

         while (NEW_SRCELEMENT_AMOUNT > tempEsp) {
            if (i === -1) result = getObjByPrice(tempEsp); // update esp
            else pushMultiRequestData(tempEsp, i); // update esp
            tempEsp++;
            i++;
         }
         pushMultiRequestData(NEW_SRCELEMENT_AMOUNT, i); // update esp
      } else if (esp && NEW_SRCELEMENT_AMOUNT < difference) {
         let tempEsp = Math.round(difference * 0.8);
         let i = -1;

         while (NEW_SRCELEMENT_AMOUNT < tempEsp) {
            if (i === -1) result = getObjByPrice(tempEsp); // update esp
            else pushMultiRequestData(tempEsp, i); // update esp
            tempEsp = Math.round(tempEsp * 0.8);
            i++;
         }
         pushMultiRequestData(NEW_SRCELEMENT_AMOUNT, i); // update esp
      } else {
         result = getObjByPrice(NEW_SRCELEMENT_AMOUNT); // update esp
      }

      return result;
   });

   // console.log(newData);
   // console.log(multiRequestSameProductData);

   return {
      SELLER_ID: sellerId,
      FK_CSRF_TOKEN: fkCsrfToken,
      PRODUCTS_CHUNK: splitIntoChunks(
         newData,
         multiRequestSameProductData,
         BATCH_SIZE
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

function filterProductsByNameSkuAndSelect(products, name, brands) {
   const isOnlySkuMatch = name?.[0] == "#";
   if (isOnlySkuMatch) name = name.slice(1);
   const { selectOnly, selectNot } = brands;

   const NAME = name.toLowerCase().replace(/\s*seeds?/g, "");

   products = products.filter((p) => {
      return (
         p.sku_id.toLowerCase()?.includes(NAME) ||
         (!isOnlySkuMatch && p?.name?.includes(NAME))
      );
   });

   if (selectOnly.length > 0) {
      products = products.filter((p) => selectOnly.includes(p.brand));
   } else if (selectNot.length > 0) {
      products = products.filter((p) => !selectNot.includes(p.brand));
   }

   return products;
}

function getSearchUri(selectOnly, productName) {
   if (selectOnly.length > 0) {
      let uri = `/search?q=${productName.replace(
         /\s+/g,
         "+"
      )}&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=off&as=off`;
      selectOnly.forEach((brand) => {
         uri += `&p%5B%5D=facets.brand%255B%255D%3D${brand}`;
      });
      return uri;
   }

   return `/search?q=${productName.replace(/\s+/g, "+")}`;
}
