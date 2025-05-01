function calculateBankSettlement({
   price,
   fixedCost = 71,
   shippingCharge = 0,
   isNational = false,
   isRound = true,
}) {
   const PRICE = price + shippingCharge;
   const TAX = 0.18; // 18% tax
   const MP_TAX = PRICE <= 500 ? 0.16 : 0.18;
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

function getLowPriceValues(sellers, uId, sell, mrp, cost, profit, fCost) {
   const totalPrice = sellers?.[0]?.totalPrice || 0;
   const sellerId = sellers?.[0]?.sellerId || "";
   const price90 = mrp * 0.1 + 1;

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
