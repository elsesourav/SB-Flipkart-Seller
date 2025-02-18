const createNewTab = (url) => {
   return new Promise((resolve) => {
      chrome.tabs.create({ url: url }, (tab) => resolve(tab.id));
   });
};
const createNewHiddenTab = (url) => {
   return new Promise((resolve) => {
      chrome.tabs.create({ url: url, active: false }, (tab) => resolve(tab.id));
   });
};

const createTabAndWaitForLoad = (url, hidden = false) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.create({ url, active: !hidden }, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
         }

         const listener = (tabId, changeInfo) => {
            if (tabId === tab.id && changeInfo.status === "complete") {
               // Remove the listener once the tab has finished loading
               chrome.tabs.onUpdated.removeListener(listener);
               resolve(tab.id);
            }
         };

         chrome.tabs.onUpdated.addListener(listener);
      });
   });
};

const closeTab = (tabId) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabId, () => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
         } else {
            resolve();
         }
      });
   });
};

const getCurrentTab = () => {
   return new Promise((resolve) => {
      chrome.tabs.query({ active: true }, (tabs) => {
         resolve(tabs[0]);
      });
   });
};

const getTab = (tabId) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError.message);
         } else {
            resolve(tab);
         }
      });
   });
};

const getAllTabId = () => {
   return new Promise(async (resolve) => {
      const tabs = await chrome.tabs.query({});
      resolve(tabs.map((e) => e.id));
   });
};

const updateTab = (tabId, newUrl) => {
   return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { url: newUrl }, (tab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
         } else {
            resolve(tab);
         }
      });
   });
};

const updateAndReloadTab = (tabId, newUrl) => {
   return new Promise((resolve, reject) => {
      // Update the tab's URL
      chrome.tabs.update(tabId, { url: newUrl }, (updatedTab) => {
         if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError); // Handle any errors
            return;
         }

         // Listen for the page to finish loading
         const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
               // Remove listener once the tab is fully loaded
               chrome.tabs.onUpdated.removeListener(listener);

               // Reload the tab
               chrome.tabs.reload(tabId, () => {
                  if (chrome.runtime.lastError) {
                     reject(chrome.runtime.lastError); // Handle reload errors
                  } else {
                     resolve(updatedTab); // Successfully updated and reloaded
                  }
               });
            }
         };

         chrome.tabs.onUpdated.addListener(listener);
      });
   });
};

const __create_new_listing__ = (quantity, count, thumbnailIndex) => {
   if (listing_run) {
      chromeStorageGetLocal(KEYS.STORAGE_LISTING, async (val) => {
         if (!val) val = {};
         val.QUANTITY = quantity;
         val.COUNT = count;
         val.THUMBNAIL_INDEX = thumbnailIndex;
         chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);

         await updateTab(currentTabId, URLS.newListing);
         tabSendMessage(currentTabId, "b_c_create_single_listing", (r) => {
            console.log(r);
         });
      });
   }
};

function getImageFilesFromLocalStorage() {
   return new Promise(async (resolve) => {
      const { THUMBNAIL_INDEX } = await chromeStorageGetLocal(
         KEYS.STORAGE_LISTING
      );
      const DATA = await chromeStorageGetLocal(`storage-images-0`);
      const firstImg = DATA?.files[THUMBNAIL_INDEX];
      const images = [];
      if (firstImg) images.push(firstImg);

      for (let i = 1; i < 4; i++) {
         const DATA = await chromeStorageGetLocal(`storage-images-${i}`);
         const img = selectRandomImage(DATA?.files || []);
         if (img) images.push(img);
      }
      resolve(images);
   });
}

function getMixDataToNewMappingData(DATA) {
   const { products, fkCsrfToken, mappingData: MD, sellerId, PRICE } = DATA;
   // console.log(DATA);

   const SKU_NAME = MD?.SKU_NAME;
   // const MAX_PROFIT = N(MD?.MAX_PROFIT || 15);
   // const MIN_PROFIT = N(MD?.MIN_PROFIT || 10);
   // const PACKING_COST = N(MD?.PACKING_COST || 3);
   // const FIXED_COST = N(MD?.FIXED_COST || 72);
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

   // let DL = N(MD?.DELIVERY_LOCAL || 0);
   // let DN = N(MD?.DELIVERY_NATIONAL || 0);
   // let DZ = N(MD?.DELIVERY_ZONAL || 19);
   // const DELIVERY_CHARGE_MIN = Math.min(DL, DN, DZ);

   // if (!MD?.IS_INCLUDED) {
   //    DL -= DELIVERY_CHARGE_MIN;
   //    DN -= DELIVERY_CHARGE_MIN;
   //    DZ -= DELIVERY_CHARGE_MIN;
   // }

   const newData = products.map((product, i) => {
      const {
         id,
         mrp,
         titles: t,
         sku_id,
         alreadySelling,
         internal_state,
         PRICE,
         NATIONAL_FEE,
      } = product;

      const { sku, quantity, type } = getSkuIDWithData(SKU_NAME, t.subtitle, i);
      // let _DL = DL;
      // let _DN = DN;
      // let _DZ = DZ;

      const TOTAL_WEIGHT = getTotalWeight(MD, quantity, type);
      // const PRODUCT_COST = getProductCost(MD, quantity, type);
      // const UNIT_TO_PIECE = getUnitToPiece(MD, quantity, type);
      // const INCREMENT_AMOUNT = getIncrementAmount(MD, UNIT_TO_PIECE);
      // const TOTAL = MAX_PROFIT + PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT; // SRCELEMENT AMOUNT
      // let SELLING_PRICE = calculateProductPrice(FIXED_COST, TOTAL);

      // if (MD?.IS_INCLUDED) SELLING_PRICE -= DELIVERY_CHARGE_MIN;
      // const PERCENTAGE_90 = Math.ceil(mrp.value * 0.1);
      // const DELTA_PRICE = PERCENTAGE_90 - SELLING_PRICE;

      // if (SELLING_PRICE < PERCENTAGE_90) {
      //    SELLING_PRICE = PERCENTAGE_90;
      //    _DL = Math.max(_DL - DELTA_PRICE, 0);
      //    _DN = Math.max(_DN - DELTA_PRICE, 0);
      //    _DZ = Math.max(_DZ - DELTA_PRICE, 0);
      // }

      // if alreadySelling then don't change sku and listing status
      const SKU = alreadySelling ? sku_id : sku;
      const LISTING_STATUS = alreadySelling ? internal_state : LISTING_STATUS_G;

      return {
         ID: id,
         SKU,
         SELLING_PRICE: PRICE,
         MRP: mrp.value,
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

   return {
      SELLER_ID: sellerId,
      FK_CSRF_TOKEN: fkCsrfToken,
      PRODUCTS: newData,
   };
}

function getTotalWeight(data, quantity, value) {
   return (
      N(data?.PACKET_WEIGHT || 1) +
      (value === "PIECE"
         ? (N(data?.UNIT_WEIGHT || 1) / N(data?.UNIT || 1)) * N(quantity)
         : N(quantity) / (value === "G" ? 1000 : 1))
   ).toFixed(3);
}

function calculateProductPrice(totalCost, desiredProfit) {
   const commissionRate = [0.14, 0.16, 0.18];
   const isRound = true;
   const tax = 1.18; // 18% tax

   // Using mathematical formula to calculate price directly
   // P = (desiredProfit + (totalCost * tax)) / (1 - (commissionRate * tax))
   let price;

   // Try with 14% commission rate first (for price <= 300)
   price = (desiredProfit + totalCost * tax) / (1 - commissionRate[0] * tax);

   if (price > 300) {
      // Try with 16% commission rate (for price <= 500)
      price = (desiredProfit + totalCost * tax) / (1 - commissionRate[1] * tax);

      if (price > 500) {
         // Use 18% commission rate
         price =
            (desiredProfit + totalCost * tax) / (1 - commissionRate[2] * tax);
      }
   }

   const PP = Math.round(price * 100) / 100;
   return isRound ? Math.round(PP) : PP;
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

function calculateProfit(totalCost, price) {
   const commissionRate = [0.14, 0.16, 0.18];
   const tax = 1.18; // 18% tax

   let profit;

   // Determine which commission rate to use based on the price
   if (price <= 300) {
      // Use 14% commission rate
      profit = price * (1 - commissionRate[0] * tax) - totalCost * tax;
   } else if (price <= 500) {
      // Use 16% commission rate
      profit = price * (1 - commissionRate[1] * tax) - totalCost * tax;
   } else {
      // Use 18% commission rate
      profit = price * (1 - commissionRate[2] * tax) - totalCost * tax;
   }

   // Round the profit to 2 decimal places
   return Math.round(profit * 100) / 100;
}

function getIncrementAmount(data, UNIT_TO_PIECE) {
   return N(data?.INCREMENT_UNIT || 0) === 0
      ? 0
      : parseInt(UNIT_TO_PIECE / N(data?.INCREMENT_UNIT || 100));
}

function getUnitToPiece(data, quantity, type) {
   if (type == "PIECE") {
      return quantity;
   } else {
      const W = N(data?.UNIT || 1) / (N(data?.UNIT_WEIGHT || 1) * 1000);
      return W * quantity * (type === "KG" ? 1000 : 1);
   }
}

function getProductCost(data, quantity, type) {
   return type === "PIECE"
      ? (N(data?.UNIT_OF_COST || 200) / N(data?.UNIT || 1)) * N(quantity)
      : (N(data?.UNIT_OF_COST || 200) / N(data?.UNIT_WEIGHT || 1)) *
           (N(quantity) / (type === "KG" ? 1 : 1000));
}

function getSkuIDWithData(name, subtitle, i) {
   const [q, t] = subtitle.toUpperCase().split(" ");
   const quantity = N(q);
   const type = t === "PER" ? "PIECE" : t;
   const unique = getIdByCurrentTime(i);
   const sku = `${name}__${quantity}__${type}__${unique}`;
   return { sku, quantity, type };
}

function getIdByCurrentTime(i = 0) {
   return parseInt(parseInt(Date.now().toString().slice(7)) + i)
      .toString(36)
      .toUpperCase();
}

function subTitleToQuantityAndType(subtitle) {
   const [q, t] = subtitle.toUpperCase().split(" ");
   const quantity = N(q);
   const type = t === "PER" ? "PIECE" : t;
   return { quantity, type };
}

async function modifyVerifiedProducts(products, userId) {
   const MD = await chromeStorageGetLocal(KEYS.STORAGE_MAPPING);
   const MAX_PROFIT = N(MD?.MAX_PROFIT || 25);
   const MIN_PROFIT = N(MD?.MIN_PROFIT || 10);
   const PACKING_COST = N(MD?.PACKING_COST || 3);
   const FIXED_COST = N(MD?.FIXED_COST || 71);

   let DL = N(MD?.DELIVERY_LOCAL || 0);
   let DN = N(MD?.DELIVERY_NATIONAL || 0);
   let DZ = N(MD?.DELIVERY_ZONAL || 19);
   // const DELIVERY_CHARGE_MIN = Math.min(DL, DN, DZ);

   // console.log(products);
   return products.map((product) => {
      const { sellersInfo, titles, alreadySelling, mrp } = product;
      const MRP = mrp.value;

      // const minShippingCharge = Math.min(localFee, nationalFee, zonalFee);
      // const minimumPrice = minShippingCharge + finalPrice;
      const { quantity, type } = subTitleToQuantityAndType(titles.subtitle);

      const PRODUCT_COST = getProductCost(MD, quantity, type);
      const UNIT_TO_PIECE = getUnitToPiece(MD, quantity, type);
      const INCREMENT_AMOUNT = getIncrementAmount(MD, UNIT_TO_PIECE);
      const COST = PACKING_COST + PRODUCT_COST + INCREMENT_AMOUNT; // SRCELEMENT AMOUNT
      // let SELLING_PRICE = calculateProductPrice(FIXED_COST, COST + MAX_PROFIT);

      // const PRICE_PERCENTAGE_90 = Math.ceil(mrp * 0.1);
      // if (SELLING_PRICE < PRICE_PERCENTAGE_90)
      //    SELLING_PRICE = PRICE_PERCENTAGE_90;

      // console.log(`mrp: ${MRP}`);
      // console.log(`quantity: ${quantity} || type: ${type}`);

      // console.log(`product cost: ${PRODUCT_COST}`);
      // console.log(`packing cost: ${PACKING_COST}`);
      // console.log(`max profit: ${MAX_PROFIT}`);
      // console.log(`increment amount: ${INCREMENT_AMOUNT}`);
      // console.log(`total: ${COST}`);
      // console.log(`--> minPrice: ${sellersInfo.sellers[0].totalPrice}`);

      // let sellingPrice;
      // let profit;

      const { price, signal, profit, nationalFee } = getOptimizedPrice(
         sellersInfo,
         userId,
         alreadySelling,
         MRP,
         COST,
         MIN_PROFIT,
         MAX_PROFIT,
         DN,
         FIXED_COST
      );

      // console.log(`price: ${price} || signal: ${signal} || profit: ${profit} || nationalFee: ${nationalFee}`);

      // if (PRICE_PERCENTAGE_90 > minimumPrice) {
      //    sellingPrice = PRICE_PERCENTAGE_90;
      // } else if (minimumPrice < SELLING_PRICE) {
      //    sellingPrice = minimumPrice - 1;
      // } else {
      //    sellingPrice = SELLING_PRICE;
      // }

      // const bankSettlement = calculateBankSettlement({
      //    price: sellingPrice,
      //    fixedCost: FIXED_COST,
      // });

      // const D_TOTAL = TOTAL - MAX_PROFIT;
      // const PROFIT = bankSettlement - D_TOTAL;

      // console.log(`selling price: ${sellingPrice}`);
      // console.log(`bank settlement: ${bankSettlement}`);
      // console.log(`profit: ${PROFIT}`);

      // console.log(product);

      // if (sellerId == "8136cfdc49f34957") {
      //    sellingPrice = minimumPrice;
      // } else {
      //    console.log(minimumPrice, mrp, TOTAL, MIN_PROFIT, MAX_PROFIT, FIXED_COST);

      //    sellingPrice = getOptimizedPrice(minimumPrice, mrp, TOTAL, MIN_PROFIT, MAX_PROFIT, FIXED_COST);
      // }

      // profit = getProfitUsingBankSettlement({
      //    price: sellingPrice,
      //    cost: TOTAL,
      //    fixedCost: FIXED_COST,
      // });

      // console.log(`minimum price: ${minimumPrice}`);
      // console.log(`selling price: ${sellingPrice}`);
      // console.log(`profit: ${profit}`);

      // console.log(`\n\n\t\t--------------------------------------\n\n`);

      return {
         ...product,
         PRICE: price,
         SIGNAL: signal,
         PROFIT: profit,
         NATIONAL_FEE: nationalFee,
         // sellingPrice,
         // profit
      };
   });
}

function getOptimizedPrice(
   sellersInfo,
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
      const totalPrice = sellersInfo?.sellers?.[0]?.totalPrice || 0;
      const sellerId = sellersInfo?.sellers?.[0]?.sellerId || "";

      const price90 = MRP * 0.1;
      let signal, price, profit;

      if (alreadySelling && sellerId === userId) {
         const secondSeller = sellersInfo?.sellers?.[1];
         if (secondSeller) {
            price = secondSeller.totalPrice - 1;
         } else {
            price = calculatePriceFromProfit({
               desiredProfit: COST + MAX_PROFIT,
               fixedCost,
            });
         }
      } else {
         price = totalPrice - 1;
      }

      profit = getProfitUsingBankSettlement({ price, cost: COST, fixedCost });
      // console.log(`--> price: ${price} || profit: ${profit}`);

      if (profit > 0 && profit < MIN_PROFIT) {
         signal = "yellow";
         profit = MIN_PROFIT;
         price = calculatePriceFromProfit({
            desiredProfit: COST + MIN_PROFIT,
            fixedCost,
         });
      } else if (profit <= 0) {
         signal = "red";
         profit = MIN_PROFIT;
         price = calculatePriceFromProfit({
            desiredProfit: COST + MIN_PROFIT,
            fixedCost,
         });
      } else if (profit > MAX_PROFIT) {
         signal = "green";
         profit = MAX_PROFIT;
         price = calculatePriceFromProfit({
            desiredProfit: COST + MAX_PROFIT,
            fixedCost,
         });
      } else {
         signal = "lightgreen";
      }

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

      const nationalDelivery = national_fee - (profit - MIN_PROFIT);

      return {
         price,
         profit,
         signal,
         nationalFee: nationalDelivery,
      };
   } catch (error) {
      return {
         price: 99999,
         profit: 99,
         signal: "red",
         nationalFee: 19,
      };
   }
}

// function getOptimizedPrice(MIN_PRICE, MRP, COST, MIN_PROFIT, MAX_PROFIT, fixedCost = 71) {
//    const price90 = MRP * 0.1;
//    let targetPrice = Math.max(MIN_PRICE - 1, price90);
//    targetPrice = Math.min(targetPrice, MRP - 1);

//    // Calculate profit for the target price
//    const profit = getProfitUsingBankSettlement({
//       price: targetPrice,
//       cost: COST,
//       fixedCost
//    });

//    // If profit is within acceptable range, return target price
//    if (profit >= MIN_PROFIT && profit <= MAX_PROFIT) {
//       return targetPrice;
//    }

//    // Handle cases where profit is outside acceptable range
//    if (profit < MIN_PROFIT) {
//       const adjustedPrice = calculatePriceFromProfit({
//          desiredProfit: COST + MIN_PROFIT,
//          fixedCost
//       });
//       return Math.max(adjustedPrice, price90);
//    }

//    // When profit exceeds MAX_PROFIT
//    return calculatePriceFromProfit({
//       desiredProfit: COST + MAX_PROFIT,
//       fixedCost
//    });
// }
