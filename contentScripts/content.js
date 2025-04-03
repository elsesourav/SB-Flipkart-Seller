let tempVal = {};
let TABLE;

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

async function fillAndSetListingInputs() {
   await updateListingData();
   await wait(100);
   fillLintingInputs();
}

async function setup_listing() {
   let openInputBtn, copyInputBtn;
   CE(
      { id: "__fwl__", class: "__fw__" },
      (openInputBtn = CE({ class: "__btn__" }, "Fill Inputs"))
      // (copyInputBtn = CE({ class: "__btn__ __1__" }, "Copy Inputs"))
   ).parent(document.body);

   openInputBtn.addEventListener("click", fillAndSetListingInputs);
   // copyInputBtn.addEventListener("click", copyListingInputs);

   window.addEventListener("popstate", (e) => {
      openInputBtn.removeEventListener("click", fillAndSetListingInputs);
      // copyInputBtn.removeEventListener("click", copyListingInputs);
   });
   // document.querySelector(".hTTPSU")?.addEventListener("click", () => {
   // });
}

function setup_orders_print() {
   let expandOrdersBtn, checkBtn, openInputBtn, closeBtn, printBtn, downloadBtn;
   const sku_ids = document.querySelectorAll(".krECZe .hXpCNJ");
   if (sku_ids.length <= 0) return;

   TABLE = document.createElement("div");
   TABLE.setAttribute("id", "_orders_table");
   document.body.appendChild(TABLE);
   setStyle(true);

   CE(
      { id: "__fwo__", class: "__fw__" },
      (expandOrdersBtn = CE(
         { class: "__btn__", "data-text": "EXPAND", style: "--delay: 200ms" },
         "EXPAND"
      )),
      (checkBtn = CE(
         { class: "__btn__", "data-text": "CHECK", style: "--delay: 500ms" },
         "CHECK"
      )),
      (openInputBtn = CE(
         { class: "__btn__", "data-text": "SHOW", style: "--delay: 400ms" },
         "SHOW"
      )),
      (printBtn = CE(
         { class: "__btn__", "data-text": "PRINT", style: "--delay: 600ms" },
         "PRINT"
      )),
      (downloadBtn = CE(
         { class: "__btn__", "data-text": "DOWNLOAD", style: "--delay: 800ms" },
         "DOWNLOAD"
      )),
      (closeBtn = CE(
         {
            class: "__btn__ __1__",
            "data-text": "CLOSE",
            style: "--delay: 1000ms",
         },
         "CLOSE"
      ))
   ).parent(document.body);

   closeBtn.style.display = "none";
   printBtn.style.display = "none";
   downloadBtn.style.display = "none";
   TABLE.style.display = "none";

   expandOrdersBtn.addEventListener("click", async () => {
      const IS = {
         pack: isUrlContains("orderState=shipments_to_pack"),
         dispatch: isUrlContains("orderState=shipments_to_dispatch"),
         handover: isUrlContains("orderState=shipments_to_handover"),
         transit: isUrlContains("orderState=shipments_in_transit"),
      };
      const element = [
         ...document.querySelectorAll(`button[data-testid="button"]`),
      ].find((e) => e.textContent == "Request OTC");

      if (IS.handover && element) {
         const parent =
            element?.parentNode?.parentNode?.parentNode?.parentNode?.firstChild;
         parent.click();
         parent.dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (IS.pack || IS.dispatch || IS.handover || IS.transit) {
         const select = document.querySelector(`select[name="default"]`);
         const value = select?.value;
         if (select && value != "70") {
            select.selectedIndex = 3;
            select.dispatchEvent(new Event("change", { bubbles: true }));
         }
      }
   });

   checkBtn.addEventListener("click", async () => {
      const selectAllBtn = document.querySelector("#sub-app-container tr th input");
      if (selectAllBtn) selectAllBtn.click();
   })

   openInputBtn.addEventListener("click", async () => {
      const IS = {
         pack: isUrlContains("orderState=shipments_to_pack"),
         dispatch: isUrlContains("orderState=shipments_to_dispatch"),
         handover: isUrlContains("orderState=shipments_to_handover"),
         transit: isUrlContains("orderState=shipments_in_transit"),
      };

      if (IS.pack || IS.dispatch || IS.handover || IS.transit) {
         closeBtn.style.display = "block";
         printBtn.style.display = "block";
         downloadBtn.style.display = "block";
         checkBtn.style.display = "none";
         openInputBtn.style.display = "none";
         expandOrdersBtn.style.display = "none";
         TABLE.style.display = "flex";
         showOrders();
      }
   });

   closeBtn.addEventListener("click", () => {
      closeBtn.style.display = "none";
      printBtn.style.display = "none";
      downloadBtn.style.display = "none";
      checkBtn.style.display = "block";
      openInputBtn.style.display = "block";
      expandOrdersBtn.style.display = "block";
      TABLE.style.display = "none";
   });

   printBtn.addEventListener("click", printTable);
   downloadBtn.addEventListener("click", downloadAsImage);
}

// async function setup_mapping() {
//    let openInputBtn, copyInputBtn;

//    CE(
//       { id: "__fwm__", class: "__fw__" },
//       (openInputBtn = CE({ class: "__btn__" }, "Fill Inputs"))
//       // (copyInputBtn = CE({ class: "__btn__ __1__" }, "Copy Inputs"))
//    ).parent(document.body);

//    openInputBtn.addEventListener("click", () => fillMappingInputs());
//    // copyInputBtn.addEventListener("click", () => copyMappingInputs());

//    document.querySelector(".hTTPSU")?.addEventListener("click", () => {
//       openInputBtn.removeEventListener("click", () => fillMappingInputs());
//       // copyInputBtn.removeEventListener("click", () => copyMappingInputs());
//    });
// }

// function setup_flipkart_product_url() {
//    let openInputBtn, closeBtn, main;
//    CE(
//       { id: "__fws__", class: "__fw__" },
//       (openInputBtn = CE({ class: "__btn__" }, "OPEN URLS")),
//       (closeBtn = CE({ class: "__btn__ __1__" }, "CLOSE"))
//    ).parent(document.body);

//    closeBtn.style.display = "none";

//    main = document.createElement("div");
//    main.setAttribute("id", "__flipkartFW__");

//    openInputBtn.addEventListener("click", () => {
//       closeBtn.style.display = "block";
//       openInputBtn.style.display = "none";

//       const set = new Set(
//          [...document.querySelectorAll("a[target='_blank']")].map(
//             (a) => a.parentNode
//          )
//       );

//       const itemWidth = 100 / 3 - (10 * 2) / 3;

//       set.forEach((el) => {
//          const link = el.querySelector('a[target="_blank"]');
//          if (link) {
//             el.style.cssText = `
//             flex: 0 0 ${itemWidth}%;
//             margin: 5px;
//             box-sizing: border-box;
//             cursor: pointer;
//          `;
//             el.addEventListener("click", (evt) => {
//                evt.stopPropagation();
//                evt.preventDefault();
//                const FSN = getFSNFromPID(link.href);
//                // open new tab with link
//                window.open(`${URLS.addMapping}${FSN}`, "_blank");
//             });
//             main.appendChild(el);
//          }
//       });
//       document.body.appendChild(main);
//       main.style.display = "flex";
//    });

//    closeBtn.addEventListener("click", () => {
//       closeBtn.style.display = "none";
//       openInputBtn.style.display = "block";
//       main.style.display = "none";
//       main.innerHTML = "";
//    });
// }

onload = async () => {
   if (ifMatchSingleListingLocation() && ifHaveSaveButton()) {
      setStyle();
      setup_listing();
   }
   

   if (ifMatchSingleOrderLocation()) {
      setStyle();
      setup_orders_print();
   }

   if (ItIsFlipkartPage()) {
      const { theme } = await isDarkMode();
      console.log(theme);
      

      if (theme === "dark") {
         document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";
         function fixMedia() {
            document.querySelectorAll("img, video").forEach(el => {
               el.style.filter = "invert(1) hue-rotate(180deg)";
            });
         }
   
         fixMedia();
         const observer = new MutationObserver(fixMedia);
         observer.observe(document.body, { childList: true, subtree: true });
      }
   }

   // if (ifFlipkartSearchLocation()) {
   //    setStyle();
   //    setup_flipkart_product_url();
   // }

   // if (ifFlipkartMappingLocation()) {
   // const is = await startSellingClick();
   //    if (is) {
   //       fillMappingInputs();
   //    }
   // }
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

      // const fwm = I("#__fwm__")[0];
      // const isFWM = fwm instanceof Node;

      // if (ifHaveFloatingDialog() && !isFWM) {
      //    setStyle();
      //    setup_mapping();
      // } else if (ifHaveFloatingDialog() && isFWM) {
      //    fwm.style.display = "flex";
      // } else if (fwm) {
      //    fwm.style.display = "none";
      // }
   }

   const IS = {
      pack: isUrlContains("orderState=shipments_to_pack"),
      dispatch: isUrlContains("orderState=shipments_to_dispatch"),
      handover: isUrlContains("orderState=shipments_to_handover"),
      transit: isUrlContains("orderState=shipments_in_transit"),
   };

   if (IS.pack || IS.dispatch || IS.handover || IS.transit) {
      const fwo = I("#__fwo__")[0];
      const isFWO = fwo instanceof Node;

      if (!isFWO) {
         setStyle();
         setup_orders_print();
      } else if (isFWO) {
         fwo.style.display = "flex";
      }
   } else {
      const fwo = document.getElementById("__fwo__");
      if (fwo) fwo.style.display = "none";
   }

   // const fw = I("#__fws__")[0];
   // const is = fw instanceof Node;

   // if (ifFlipkartSearchLocation()) {
   //    if (!is) {
   //       setStyle();
   //       setup_flipkart_product_url();
   //    } else if (is) {
   //       fw.style.display = "flex";
   //    }
   // } else if (is) {
   //    fw.style.display = "none";
   // }
});

/* --------------- auto mate single listing create ----------- */
runtimeOnMessage("b_c_create_single_listing", async (__, _, sendResponse) => {
   try {
      sendResponse({ status: "ok" });
      const DATA = await getListingData();
      await wait(1000);
      await setBrand(DATA);
      await wait(1000);
      await fillLintingInputs(DATA);
      await wait(500);
      await sendToQC();
      runtimeSendMessage("c_b_create_listing_complete", (r) => {
         console.log(r);
      });
   } catch (error) {
      alert(error);
   }
});

runtimeOnMessage(
   "b_c_filter_mapping_possible_skus",
   async ({ vals }, _, sendResponse) => {
      sendResponse({ status: "ok" });
      console.log(vals);
   }
);

runtimeOnMessage(
   "b_c_go_mapping_page_using_sku",
   async ({ skus }, _, sendResponse) => {
      sendResponse({ status: "ok" });

      console.log(skus);
      const saveInfo = {
         skus,
         unMappingSkus: [],
      };
      chromeStorageSetLocal(storageFilterSkusKey, saveInfo);
      window.location.href = `${URLS.addMapping}${saveInfo.skus[0]}`;
      window.location.reload();
   }
);

(() => {
   addEventListener("load", async (e) => {
      if (window.location.href.includes(URLS.addMapping)) {
         chromeStorageGetLocal(storageFilterSkusKey, async (vals) => {
            if (!vals || vals.skus.length === 0) return;
            if (
               !document.querySelector(".addListingsProduct-default.play-arena")
            ) {
               await wait(5000);
               window.location.reload();
               return;
            }

            const current = vals.skus[0];
            vals.skus.shift();
            const isMappingPossible = isProductMappingPossible();
            if (isMappingPossible) vals.unMappingSkus.push(current);
            chromeStorageSetLocal(storageFilterSkusKey, vals);

            if (vals.skus.length > 0) {
               window.location.href = `${URLS.addMapping}${vals.skus[0]}`;
               // await wait(200);
               window.location.reload();
            } else {
               runtimeSendMessage(
                  "c_b_filter_mapping_possible_skus",
                  vals,
                  (response) => {
                     console.log(response);
                  }
               );
            }
         });
      }
   });
})();
