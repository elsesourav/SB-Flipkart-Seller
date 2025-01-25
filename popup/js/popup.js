const aInputs = I(".take-inp .input-a");
const bInputs = I(".take-inp .input-b");
const cInputs = I(".take-inp .input-c");
const bgImagePath = "./../assets/img/";

const imageSection = I(".take-inp.image");
const imageInputFields = I(".take-inp.image .inp-image");
const imageView = I(".take-inp.image .img-box");

const START_BTN = I("#IS_START");
const PAUSE_BTN = I("#IS_PAUSE");
const STOP_BTN = I("#IS_STOP");

const numInpLimitA = I(".input-a.inp-limit");
const numInpLimitB = I(".input-b.inp-limit");

let holdTimer;
let clearSingleListingButton = I("#MyListingClearBtn .clear");
let clearMappingButton = I("#MyMappingClearBtn .clear");

const UPLOAD_IMAGE_BUTTONS = I(".take-inp.images .upload");
const UPLOAD_IMAGE_INPUTS = I(".take-inp.images input[type=file]");
const IMAGE_LISTS = I(".take-inp.images .all-images");
const DELETE_IMAGES_BUTTONS = I(".take-inp.images .delete-all");

// Open More Mapping button click handler
openMoreMapping.click(() => {
   chrome.runtime.openOptionsPage();
});

[aInputs, bInputs, cInputs].forEach((inp) => {
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
async function init() {
   // set background image random
   I("#bgImage")[0].src = `${bgImagePath}bg${Math.floor(
      Math.random() * 7
   )}.png`;

   await chromeStorageGetLocal(storageInitKey, (val) => {
      if (!val) {
         chromeStorageSetLocal(storageMappingKey, mappingData);
         chromeStorageSetLocal(storageListingKey, listingData);
         chromeStorageSetLocal(storageOrdersKey, ordersData);
         chromeStorageSetLocal(storageSettingsKey, settings);
         chromeStorageSetLocal(storageInitKey, true);
      }
   });

   chromeStorageGetLocal(storageMappingKey, (val) => {
      mappingData = val;

      // load input fields
      aInputs.forEach((inp) => {
         if (inp.type === "number") inp.value = mappingData[inp.name] || 0;
         else if (inp.type === "checkbox")
            inp.checked = mappingData[inp.name] || false;
         else if (inp.type === "select-one")
            (inp.value = mappingData[inp.name]) || (inp.selectedIndex = 0);
         else if (
            inp.getAttribute("inputmode") === "numeric" &&
            inp.type === "text"
         )
            inp.value = N(mappingData[inp.name] || 0).toLocaleString("en-IN");
         else inp.value = mappingData[inp.name] || "";
      });
   });

   chromeStorageGetLocal(storageListingKey, (val) => {
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

   chromeStorageGetLocal(storageOrdersKey, (val) => {
      ordersData = val;
      cInputs.forEach((inp) => {
         if (inp.type === "checkbox")
            inp.checked = ordersData[inp.name] || false;
         else if (
            inp.getAttribute("inputmode") === "numeric" &&
            inp.type === "text"
         )
            inp.value = N(ordersData[inp.name] || 0).toLocaleString("en-IN");
      });
      jsonEditorTitle.removeClass("error");
      setJsonContent(ordersData.editor);
      I("#NumberInBengaliDiv")[0].classList.toggle(
         "hide",
         !ordersData.WordInBengali
      );
   });

   // load settings
   chromeStorageGetLocal(storageSettingsKey, (val) => {
      settings = val;
      settings.listingOpen.forEach(
         (is, i) => (I(".grid-flip")[i].checked = is)
      );
      I("nav .options .btn input")[settings.currentMode].checked = true;
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
            ? handleFloatValue(parseFloat(ele.value || 0), step, v)
            : handleIntValue(ele.value, step, v);

         saveFunction();
      };

      I(".inc", ele.parentNode).click(() => handleClick(true));
      I(".dec", ele.parentNode).click(() => handleClick(false));
   });
}

function __clear_data_mapping__() {
   holdTimer = setTimeout(() => {
      clearMappingButton.addClass("complete");
      chromeStorageGetLocal(storageMappingKey, (val) => {
         for (const key in val) {
            if (typeof val[key] === "string") {
               val[key] = "";
            } else {
               val[key] = 0;
            }
         }

         chromeStorageSetLocal(storageMappingKey, val);
         init();
      });
   }, 1000);
}

function __clear_data_listing__() {
   holdTimer = setTimeout(() => {
      clearSingleListingButton.addClass("complete");
      chromeStorageGetLocal(storageListingKey, (val) => {
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
         chromeStorageSetLocal(storageListingKey, val);
         init();
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
   chromeStorageSetLocal(storageListingKey, listingData);
}

function saveDataA() {
   chromeStorageGetLocal(storageMappingKey, (val) => {
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
      chromeStorageSetLocal(storageMappingKey, val);
   });
}

function saveDataB() {
   chromeStorageGetLocal(storageListingKey, (val) => {
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
      chromeStorageSetLocal(storageListingKey, val);
   });
}

function saveDataC() {
   chromeStorageGetLocal(storageOrdersKey, (val) => {
      if (!val)
         val = {
            nameInBengali: {},
         };
      cInputs.forEach((inp) => {
         if (inp.type === "checkbox") val[inp.name] = inp.checked;
         else if (
            inp.getAttribute("inputmode") === "numeric" &&
            inp.type === "text"
         )
            val[inp.name] = inp.value.replace(/,/g, "") || 0;
      });
      chromeStorageSetLocal(storageOrdersKey, val);
   });
}

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
   await chromeStorageGetLocal(storageListingKey, (val) => {
      if (!val) val = {};
      val.COUNT = 0;
      listingData = val;
      I("#COUNT")[0].textContent = 0;
      chromeStorageSetLocal(storageListingKey, val);
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
   const repeat = (await chromeStorageGetLocal(`storage-images-small-0`))?.files?.length || 0;
   const stapes = I("#STAPES_BY")[0]?.value || 1;

   const total = Math.abs(((endCount - startCount) / stapes) * repeat);
   I("#TOTAL_COUNT")[0].innerText = total;
}

// Add this near the top of the file, after your initial constants
// chrome.storage.onChanged.addListener((changes, namespace) => {
//    if (namespace === "local") {
//       // Handle listing data changes
//       if (changes[storageListingKey]) {
//          listingData = changes[storageListingKey].newValue;
//          const COUNT = listingData?.COUNT || 0;
//          I("#COUNT")[0].textContent = COUNT;
//       }
//    }
// });

function getLocalMappingData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(storageMappingKey, (val) => {
         resolve(val);
      });
   });
}

function getLocalListingData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(storageListingKey, (val) => {
         resolve(val);
      });
   });
}

function getLocalOrdersData() {
   return new Promise((resolve) => {
      chromeStorageGetLocal(storageOrdersKey, (val) => {
         resolve(val);
      });
   });
}

function setLocalMappingData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(storageMappingKey, val);
      init();
      resolve();
   });
}

function setLocalListingData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(storageListingKey, val);
      init();
      resolve();
   });
}

function setLocalOrdersData(val) {
   return new Promise((resolve) => {
      chromeStorageSetLocal(storageOrdersKey, val);
      init();
      resolve();
   });
}

async function getLocalFile(fileType) {
   switch (fileType) {
      case "MAPPING":
         return await getLocalMappingData();
      case "LISTING":
         return await getLocalListingData();
      case "ORDERS":
         return await getLocalOrdersData();
   }
}

async function setLocalFile(fileType, val) {
   switch (fileType) {
      case "MAPPING":
         return await setLocalMappingData(val);
      case "LISTING":
         return await setLocalListingData(val);
      case "ORDERS":
         return await setLocalOrdersData(val);
   }
}