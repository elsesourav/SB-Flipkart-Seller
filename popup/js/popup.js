const aInputs = I(".take-inp .input-a");
const bInputs = I(".take-inp .input-b");
const settingsInputs = I("input.input-setting");

const imageSection = I(".take-inp.image");
const imageInputFields = I(".take-inp.image .inp-image");
const imageView = I(".take-inp.image .img-box");
const flipGrid = I(".grid-flip");

const START_BTN = I("#IS_START");
const PAUSE_BTN = I("#IS_PAUSE");
const STOP_BTN = I("#IS_STOP");

const numInpLimitA = I(".input-a.inp-limit");
const numInpLimitB = I(".input-b.inp-limit");
const addProductInpLimit = I("#addProductWindow input.inp-limit");
const addProductInpIndDec = I("#addProductWindow button:is(.dec,.inc)");
const addProductInputsData = I("#addProductWindow .p-win-inp");

let holdTimer;
let clearSingleListingButton = I("#MyListingClearBtn .clear");
let clearMappingButton = I("#MyMappingClearBtn .clear");

const UPLOAD_IMAGE_BUTTONS = I(".take-inp.images .upload");
const UPLOAD_IMAGE_INPUTS = I(".take-inp.images input[type=file]");
const IMAGE_LISTS = I(".take-inp.images .all-images");
const DELETE_IMAGES_BUTTONS = I(".take-inp.images .delete-all");

// Open More Options button click handler
I(".openMoreOptions").click(() => {
   chrome.runtime.openOptionsPage();
});

[aInputs, bInputs].forEach((inp) => {
   inp.on("input", (_, __, ele) => {
      if (
         ele?.getAttribute("inputmode") === "numeric" &&
         ele?.type === "text"
      ) {
         const value = ele.value.replace(/,/g, "");
         if (!isNaN(value) && value !== "") {
            ele.value = N(value).toLocaleString("en-IN");
         }
      }
   });
   inp.click((_, __, ele) => {
      if (
         ele?.type === "text" ||
         ele?.getAttribute("inputmode") === "numeric"
      ) {
         ele.select();
      }
   });
});

// ---------------- initial setup -------------------
async function updateStorage() {
   await chromeStorageGetLocal(KEYS.STORAGE_INIT, (val) => {
      if (!val) {
         const settings = {
            listingOpen: [...flipGrid].map((e) => e.checked),
            WORD_IN_DIFFERENT_LANGUAGE: false,
            NUMBER_IN_DIFFERENT_LANGUAGE: false,
            currentMode: 0,
         };

         setContent(REPLACE_LAN_DATA.editorRow);
         REPLACE_LAN_DATA.editorJson = getJsonContent();

         chromeStorageSetLocal(KEYS.STORAGE_MAPPING, mappingData);
         chromeStorageSetLocal(KEYS.STORAGE_LISTING, listingData);
         chromeStorageSetLocal(KEYS.STORAGE_PRODUCT, PRODUCTS_DATA);
         chromeStorageSetLocal(KEYS.STORAGE_REPLACE_LAN, REPLACE_LAN_DATA);
         chromeStorageSetLocal(KEYS.STORAGE_SETTINGS, settings);
         chromeStorageSetLocal(KEYS.STORAGE_INIT, true);
      }
   });

   chromeStorageGetLocal(KEYS.STORAGE_MAPPING, (val) => {
      if (!val) val = mappingData;
      mappingData = val;

      const setInputValue = (input, data) => {
         const value = data[input.name];

         if (input.name == "PRODUCT_NAME" && data[input.name]) {
            input.innerHTML = `
               <option>SELECT PRODUCT</option>
               <option selected value="${value}">${value.toUpperCase()}</option>
            `;
            return;
         }

         switch (true) {
            case input.type === "number":
               input.value = value || 0;
               break;
            case input.type === "checkbox":
               input.checked = value || false;
               break;
            case input.type === "select-one":
               input.value = value;
               if (!value) input.selectedIndex = 0;
               break;
            case input.getAttribute("inputmode") === "numeric" &&
               input.type === "text":
               input.value = N(value || 0).toLocaleString("en-IN");
               break;
            default:
               input.value = value || "";
         }
      };

      // Load input fields
      aInputs.forEach((input) => setInputValue(input, mappingData));
   });

   chromeStorageGetLocal(KEYS.STORAGE_PRODUCT, (val) => {
      PRODUCTS_DATA = val;
      addProductsInProductList(PRODUCTS_DATA);
   });

   chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      listingData = val;
      // setupSavedImages();

      // load input fields
      bInputs.forEach((inp) => {
         if (inp.type !== "file") {
            if (inp.type === "number") inp.value = listingData[inp.name] || 0;
            else if (inp.type === "checkbox")
               inp.checked = listingData[inp.name] || false;
            else if (inp.type === "select-one")
               (inp.value = listingData[inp.name]) || (inp.selectedIndex = 0);
            else if (
               inp.getAttribute("inputmode") === "numeric" &&
               inp.type === "text"
            )
               inp.value = N(listingData[inp.name] || 0).toLocaleString(
                  "en-IN"
               );
            else inp.value = listingData[inp.name] || "";

            if (["START", "PAUSE", "STOP"].includes(inp.name)) {
               inp.classList.toggle("active", listingData[inp.name]);
            }
         }
      });

      const COUNT = val?.COUNT || 0;
      I("#COUNT")[0].textContent = COUNT;

      setTotalCount();
   });

   chromeStorageGetLocal(KEYS.STORAGE_REPLACE_LAN, (val) => {
      REPLACE_LAN_DATA = val;
      setContent(REPLACE_LAN_DATA.editorRow);
   });

   // load settings
   chromeStorageGetLocal(KEYS.STORAGE_SETTINGS, (val) => {
      settings = val;
      const { currentMode, listingOpen } = settings;
      listingOpen.forEach((e, i) => {
         flipGrid[i].checked = e;
      });
      I("nav .options .btn input")[currentMode].checked = true;

      I("input.input-setting").each((e) => {
         e.checked = settings[e.name];
      });

      if (ReplaceLanguageInput.checked) {
         I("#SameSaNumberDiv").removeClass("hide");
      } else {
         I("#SameSaNumberInput")[0].checked = false;
         I("#SameSaNumberDiv").addClass("hide");
      }
   });

   chromeStorageGetLocal(KEYS.STORAGE_USER_LOGIN, (val) => {
      if (val) {
         loginUserButton.classList.add("hide");
         logoutUserButton.classList.remove("hide");
      } else {
         loginUserButton.classList.remove("hide");
         logoutUserButton.classList.add("hide");
      }
   });
   setupSavedImages();
}

// increase decrease button (only switch limit .input)
function setupIncDecAction(inputElements, saveFunction) {
   const getStepInfo = (stepStr) => {
      const isFloat = stepStr.includes(".");
      const step = isFloat ? parseFloat(stepStr) : parseInt(stepStr) || 1;
      return { isFloat, step };
   };

   const handleFloatValue = (currentValue, step, v) => {
      const value = Math.round((currentValue + step * v) * 1000) / 1000;
      const decimalPlaces = (step.toString().split(".")[1] || "").length;
      return value.toFixed(decimalPlaces).replace(/\.?0+$/, "");
   };

   const handleIntValue = (currentValue, step, v) => {
      return parseInt(currentValue || 0) + v * step;
   };

   inputElements.each((ele) => {
      const handleClick = (inInc) => {
         const stepStr = ele.parentNode.getAttribute("step");
         const { isFloat, step } = getStepInfo(stepStr);
         const v = inInc ? 1 : -1;

         ele.value = isFloat
            ? handleFloatValue(
                 parseFloat(ele.value.replace(/,/g, "") || 0),
                 step,
                 v
              )
            : handleIntValue(ele.value.replace(/,/g, ""), step, v);

         saveFunction();
      };

      I(".inc", ele.parentNode).click(() => handleClick(true));
      I(".dec", ele.parentNode).click(() => handleClick(false));
   });
}

function __clear_data_mapping__() {
   holdTimer = setTimeout(() => {
      clearMappingButton.addClass("complete");
      chromeStorageGetLocal(KEYS.STORAGE_MAPPING, (val) => {
         for (const key in val) {
            if (typeof val[key] === "string") {
               val[key] = "";
            } else {
               val[key] = 0;
            }
         }

         chromeStorageSetLocal(KEYS.STORAGE_MAPPING, val);
         updateStorage();
      });
   }, 1000);
}

function __clear_data_listing__() {
   holdTimer = setTimeout(() => {
      clearSingleListingButton.addClass("complete");
      chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
         for (const key in val) {
            if (typeof val[key] === "string") {
               val[key] = "";
            } else {
               val[key] = 0;
            }
         }
         for (let i = 0; i < MAX_IMAGE; i++) {
            chromeStorageSetLocal(`storage-image-${i}`, null);
         }
         val.COUNT = 0;
         chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);
         updateStorage();
      });
   }, 1000);
}

function __clear_mapping__() {
   clearTimeout(holdTimer);
   clearSingleListingButton.removeClass("complete");
   clearMappingButton.removeClass("complete");
}

function setImageInInput(i, file) {
   if (!file) {
      imageView[i].style.height = "0";
      imageView[i].style.width = "0";
      imageView[i].style.backgroundImage = "none";
      imageView[i].toggle("active", false);
      return;
   }

   const img = new Image();
   img.src = file;
   img.onload = () => {
      if (img.width > img.height) {
         imageView[i].style.height = `${(img.height / img.width) * 100}%`;
         imageView[i].style.width = "100%";
      } else {
         imageView[i].style.height = "100%";
         imageView[i].style.width = `${(img.width / img.height) * 100}%`;
      }

      imageView[i].style.backgroundImage = img ? `url(${img.src})` : "none";
      imageView[i].toggle("active", img.width > 0);
   };
}

function saveListingData() {
   chromeStorageSetLocal(KEYS.STORAGE_LISTING, listingData);
}

function saveDataA() {
   chromeStorageGetLocal(KEYS.STORAGE_MAPPING, (val) => {
      if (!val) val = {};

      aInputs.forEach((inp) => {
         if (inp.type === "number") val[inp.name] = inp.value || 0;
         else if (inp.type === "checkbox") val[inp.name] = inp.checked;
         else if (inp.type === "select-one") val[inp.name] = inp.value;
         else if (
            inp.getAttribute("inputmode") === "numeric" &&
            inp.type === "text"
         )
            val[inp.name] = inp.value.replace(/,/g, "") || 0;
         else val[inp.name] = inp.value || "";
      });

      mappingData = val;
      chromeStorageSetLocal(KEYS.STORAGE_MAPPING, val);
   });
}

function saveDataB() {
   chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      if (!val) val = {};

      bInputs.forEach((inp) => {
         if (inp.type !== "file") {
            if (inp.type === "number") val[inp.name] = inp.value || 0;
            else if (inp.type === "checkbox") val[inp.name] = inp.checked;
            else if (inp.type === "select-one") val[inp.name] = inp.value;
            else if (
               inp.getAttribute("inputmode") === "numeric" &&
               inp.type === "text"
            )
               val[inp.name] = inp.value.replace(/,/g, "") || 0;
            else val[inp.name] = inp.value || "";
         }
      });

      setTotalCount();

      listingData = val;
      chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);
   });
}

function saveSettings() {
   chromeStorageGetLocal(KEYS.STORAGE_SETTINGS, (DATA) => {
      if (!DATA) DATA = settings;

      // save input setting
      settingsInputs.forEach((inp) => {
         if (inp.type === "checkbox") DATA[inp.name] = inp.checked;
         else if (
            inp.getAttribute("inputmode") === "numeric" &&
            inp.type === "text"
         )
            DATA[inp.name] = inp.value.replace(/,/g, "") || 0;
      });

      // save flip gird setting
      DATA.listingOpen = [...flipGrid].map((e) => e.checked);

      // save current mode
      DATA.currentMode = [...I("nav .options .btn input")].findIndex(
         (e) => e.checked
      );

      chromeStorageSetLocal(KEYS.STORAGE_SETTINGS, DATA);
   });

   EDITOR_AREA.refresh();
}

function saveReplaceLanguage() {
   chromeStorageGetLocal(KEYS.STORAGE_REPLACE_LAN, (DATA) => {
      if (!DATA) DATA = REPLACE_LAN_DATA;
      DATA.editorJson = getJsonContent();
      DATA.editorRow = getRowContent();
      chromeStorageSetLocal(KEYS.STORAGE_REPLACE_LAN, DATA);
   });
}

function getLocalMappingData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(KEYS.STORAGE_MAPPING, (val) => {
         resolve(val);
      });
   });
}

function getLocalListingData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
         resolve(val);
      });
   });
}

function getLocalProductsData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(KEYS.STORAGE_PRODUCT, (val) => {
         resolve(val);
      });
   });
}

function getLocalReplacementData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(KEYS.STORAGE_REPLACE_LAN, (val) => {
         resolve(val);
      });
   });
}

function setLocalMappingData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(KEYS.STORAGE_MAPPING, val);
      updateStorage();
      resolve();
   });
}

function setLocalListingData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);
      updateStorage();
      resolve();
   });
}

function setLocalProductsData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(KEYS.STORAGE_PRODUCT, val);
      updateStorage();
      resolve();
   });
}

function setLocalReplacementData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(KEYS.STORAGE_REPLACE_LAN, val);
      updateStorage();
      resolve();
   });
}

async function getLocalFile(fileType) {
   switch (fileType) {
      case "MAPPING":
         return await getLocalMappingData();
      case "LISTING":
         return await getLocalListingData();
      case "PRODUCTS":
         return await getLocalProductsData();
      case "REPLACEMENT":
         return await getLocalReplacementData();
   }
}

async function setLocalFile(fileType, val) {
   switch (fileType) {
      case "MAPPING":
         return await setLocalMappingData(val);
      case "LISTING":
         return await setLocalListingData(val);
      case "PRODUCTS":
         return await setLocalProductsData(val);
      case "REPLACEMENT":
         return await setLocalReplacementData(val);
   }
}

// Old Automation Technique
async function startAutoMationAction() {
   START_BTN[0].checked = false;
   PAUSE_BTN[0].checked = true;
   STOP_BTN[0].checked = true;
   START_BTN.removeClass("active");
   PAUSE_BTN.addClass("active");
   STOP_BTN.addClass("active");
   saveDataB();
   runtimeSendMessage("p_b_start_listing", ({ status }) => {
      console.log(status);
   });
}

async function stopAutoMationAction() {
   START_BTN[0].checked = true;
   PAUSE_BTN[0].checked = false;
   STOP_BTN[0].checked = false;
   START_BTN.addClass("active");
   STOP_BTN.removeClass("active");
   PAUSE_BTN.removeClass("active");
   await chromeStorageGetLocal(KEYS.STORAGE_LISTING, (val) => {
      if (!val) val = {};
      val.COUNT = 0;
      listingData = val;
      I("#COUNT")[0].textContent = 0;
      chromeStorageSetLocal(KEYS.STORAGE_LISTING, val);
   });
   saveDataB();
   runtimeSendMessage("p_b_stop_listing", ({ status }) => {
      console.log(status);
   });
}

async function pauseAutoMationAction() {
   PAUSE_BTN[0].checked = false;
   PAUSE_BTN.removeClass("active");
   if (!START_BTN[0].checked) {
      START_BTN[0].checked = true;
      STOP_BTN[0].checked = true;
      START_BTN.addClass("active");
      STOP_BTN.addClass("active");
   }
   saveDataB();
   runtimeSendMessage("p_b_pause_listing", ({ status }) => {
      console.log(status);
   });
}

async function setTotalCount() {
   const startCount = I("#START_COUNT")[0]?.value || 0;
   const endCount = I("#END_COUNT")[0]?.value || 0;
   const repeat =
      (await chromeStorageGetLocal(`storage-images-small-0`))?.files?.length ||
      0;
   const stapes = I("#STAPES_BY")[0]?.value || 1;

   const total = Math.abs(((endCount - startCount) / stapes) * repeat);
   I("#TOTAL_COUNT")[0].innerText = total;
}

// Add this near the top of the file, after your initial constants
// chrome.storage.onChanged.addListener((changes, namespace) => {
//    if (namespace === "local") {
//       // Handle listing data changes
//       if (changes[KEYS.STORAGE_LISTING]) {
//          listingData = changes[KEYS.STORAGE_LISTING].newValue;
//          const COUNT = listingData?.COUNT || 0;
//          I("#COUNT")[0].textContent = COUNT;
//       }
//    }
// });
