/* --------------------------------------------------
               Fetches form flipkart
-------------------------------------------------- */

// getMinSellerPrice("PAEGGREHZTG9CNTQ");

// async function fetchFlipkartData() {
//    const url = "https://seller.flipkart.com/napi/graphql";
//    const payload = {
//       operationName: "settlements_calculator_web_getAverageSettlementPrice",
//       variables: {
//          listings: [
//             {
//                listing_id: "LSTPAEGBJHFGH2DTHUUIATFRO",
//                selling_price: 151,
//                settlement_value: 30,
//                type: "reverse",
//                item_unit_count: 1,
//             },
//          ],
//          darwin_tier: "gold",
//          reward_params: {},
//          page_name: "",
//          include_returns: false,
//          new_reverse_api: true,
//       },
//       query: `query settlements_calculator_web_getAverageSettlementPrice($darwin_tier: String, $listings: [OptionalInputParams], $reward_params: IRewardParams, $page_name: String, $include_returns: Boolean, $new_reverse_api: Boolean) {
//            getAverageSettlementPrice: getAverageSettlementPrice(
//                darwin_tier: $darwin_tier
//                listings: $listings
//                reward_params: $reward_params
//                page_name: $page_name
//                include_returns: $include_returns
//                new_reverse_api: $new_reverse_api
//            )
//        }`,
//    };

//    try {
//       const response = await fetch(url, {
//          method: "POST",
//          headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             "x-requested-with": "XMLHttpRequest",
//             "fk-csrf-token": "7NezKLka-ILlz4b--UfZeJoVvJypaJUhk_wU",
//          },
//          body: JSON.stringify(payload),
//          credentials: "include", // Important if authentication is needed
//       });

//       if (!response.ok) {
//          throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("Response Data:", data);
//    } catch (error) {
//       console.error("Fetch error:", error);
//    }
// }
