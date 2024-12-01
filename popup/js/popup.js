const aInputs = I(".take-inp .input-a");
const bInputs = I(".take-inp .input-b");
const cInputs = I(".take-inp .input-c");

const imageSection = I(".take-inp.image");
const imageInputFields = I(".take-inp.image .inp-image");
const imageView = I(".take-inp.image .img-box");

aInputs.on("change", saveDataA);
bInputs.on("change", saveDataB);
cInputs.on("change", saveDataC);
// ---------------- initial setup -------------------
async function init() {
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
         else if (inp.type === "checkbox") inp.checked = mappingData[inp.name] || false;
         else if (inp.type === "select-one") (inp.value = mappingData[inp.name]) || (inp.selectedIndex = 0);
         else inp.value = mappingData[inp.name] || "";
      });
   });

   chromeStorageGetLocal(storageListingKey, (val) => {
      listingData = val;
      setupSavedImages();

      // load input fields
      bInputs.forEach((inp) => {
         if (inp.type !== "file") {
            if (inp.type === "number") inp.value = listingData[inp.name] || 0;
            else if (inp.type === "checkbox") inp.checked = listingData[inp.name] || false;
            else if (inp.type === "select-one") (inp.value = listingData[inp.name]) || (inp.selectedIndex = 0);
            else inp.value = listingData[inp.name] || "";
         }
      });
   });

   chromeStorageGetLocal(storageOrdersKey, (val) => {
      ordersData = val;
      cInputs.forEach((inp) => {
         if (inp.type === "checkbox") inp.checked = ordersData[inp.name] || false;
      });
      jsonEditorTitle.removeClass("error");
      setJsonContent(ordersData.nameInBengali);
   });

   // load settings
   chromeStorageGetLocal(storageSettingsKey, (val) => {
      settings = val;
      settings.listingOpen.forEach((is, i) => (I(".grid-flip")[i].checked = is));
      I("nav .options .btn input")[settings.currentMode].checked = true;
   });
}
init();

async function setupSavedImages() {
   // First hide all image sections
   imageSection.forEach(section => {
      section.classList.remove("show");
   });

   let count = 0;

   // Show and setup existing images
   for (let i = 0; i < 8; i++) {
      await chromeStorageGetLocal(`storage-image-${i}`, async (image) => {

         if (image && image.file) {
            count++;
            imageSection[i].classList.add("show");
            setImageInInput(i, image.file);
         } else {
            setImageInInput(i, null);
         }
      });
   }

   // Show next empty slot
   if (count < 7) {
      imageSection[count].classList.add("show");
   }
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

const numInpLimitA = I(".input-a.inp-limit");
const numInpLimitB = I(".input-b.inp-limit");

setupIncDecAction(numInpLimitA, saveDataA);
setupIncDecAction(numInpLimitB, saveDataB);

I(".grid-flip").click((_, i) => {
   settings.listingOpen[i] = _.target.checked;
   chromeStorageSetLocal(storageSettingsKey, settings);
});

I("nav .options .btn").click((_, i) => {
   settings.currentMode = i;
   chromeStorageSetLocal(storageSettingsKey, settings);
   jsonEditor.refresh();
});

let holdTimer;
let clearSingleListingButton = I("#MyListingClearBtn .clear");
let clearMappingButton = I("#MyMappingClearBtn .clear");

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
         for (let i = 0; i < 8; i++) {
            chromeStorageSetLocal(`storage-image-${i}`, null);
         }
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

clearSingleListingButton.on("mousedown", __clear_data_listing__);
clearSingleListingButton.on("mouseup", __clear_mapping__);
clearSingleListingButton.on("mouseleave", __clear_mapping__);

clearMappingButton.on("mousedown", __clear_data_mapping__);
clearMappingButton.on("mouseup", __clear_mapping__);
clearMappingButton.on("mouseleave", __clear_mapping__);

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

let imageFiles = {};

I(".take-inp.image i.sbi-upload4").click((_, i) => {
   imageInputFields[i].click();
});

async function reSortImages() {
   const images = {};

   let j = 0;
   for (let i = 0; i < 8; i++) {
      await chromeStorageGetLocal(`storage-image-${i}`, (val) => {
         if (val && val.file) {
            images[j] = val;
            j++;
         }
      });
   }

   for (let i = 0; i < j; i++) {
      chromeStorageSetLocal(`storage-image-${i}`, images[i]);
   }

   for (let i = j; i < 8; i++) {
      chromeStorageSetLocal(`storage-image-${i}`, null);
   }
   setupSavedImages();
}

I(".take-inp.image i.sbi-bin").click((_, i) => {
   chromeStorageSetLocal(`storage-image-${i}`, null);
   reSortImages();
});

imageInputFields.on("change", (_, i, fileInput) => {
   imageFiles[i] = fileInput.files[0];

   if (imageFiles[i]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
         if (i < 7) imageSection[i + 1].classList.add("show");
         const imageData = event.target.result;
         chromeStorageSetLocal(`storage-image-${i}`, { file: imageData });
         setImageInInput(i, imageData);
      };
      reader.readAsDataURL(imageFiles[i]);
   } else {
      setImageInInput(i, null);
      chromeStorageSetLocal(`storage-image-${i}`, null);
   }
});

jsonEditor.on("change", () => {
   try {
      const nameInBengali = getJsonContent();
      ordersData.nameInBengali = nameInBengali;
      chromeStorageSetLocal(storageOrdersKey, ordersData);
      jsonEditorTitle.removeClass("error");
   } catch (e) {
      console.log("Invalid JSON");
      jsonEditorTitle.addClass("error");
   }
});

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
            else val[inp.name] = inp.value || "";
         }
      });

      listingData = val;
      chromeStorageSetLocal(storageListingKey, val);
   });
}

function saveDataC() {
   chromeStorageGetLocal(storageOrdersKey, (val) => {
      if (!val) val = {
         nameInBengali: {},
      };
      cInputs.forEach((inp) => {
         if (inp.type === "checkbox") val[inp.name] = inp.checked;
      });
      chromeStorageSetLocal(storageOrdersKey, val);
   });
}
