const aInputs = I(".take-inp .input-a");
const bInputs = I(".take-inp .input-b");

aInputs.on("change", saveDataA);
bInputs.on("change", saveDataB);

// ---------------- initial setup -------------------
async function init() {
   chromeStorageGetLocal(storageMappingKey, (val) => {
      if (val) {
         mappingValues = val;

         // load input fields
         aInputs.forEach((inp) => {
            if (inp.type === "number") inp.value = val[inp.name] || 0;
            else inp.value = val[inp.name] || "";
         });
      }
   });

   chromeStorageGetLocal(storageSingleListKey, (val) => {
      if (val) {
         singleListValues = val;

         // load images
         for (let i = 0; i < 4; i++) {
            if (singleListValues[`image_${i}`]) {
               const { url, width, height } = singleListValues[`image_${i}`];
               setImageInInput(i, url, width, height);
            } else {
               setImageInInput(i, "", 0, 0);
            }
         }

         // load input fields
         bInputs.forEach((inp) => {
            if (inp.type !== "file") {
               if (inp.type === "number") inp.value = val[inp.name] || 0;
               else inp.value = val[inp.name] || "";
            }
         });
      }
   });

   // load settings
   chromeStorageGetLocal(storageSettingsKey, (val) => {
      if (val) {
         settings = val;
         settings.singleListingOpen.forEach((is, i) => {
            I("#myListing .basic-grid")[i].classList.toggle("active", is);
         });

         I("nav .options .btn input")[settings.open_option].checked = true;
      }
   });
}
init();

// increase decrease button (only switch limit .input)
function setupIncDecAction(inputElements, saveFunction) {
   inputElements.each((ele, i) => {
      I(".inc", ele.parentNode).click(() => {
         if (inputElements[i].value === "") inputElements[i].value = 0;
         inputElements[i].value = parseInt(inputElements[i].value) + 1;
         saveFunction();
      });

      I(".dec", ele.parentNode).click(() => {
         if (inputElements[i].value === "") inputElements[i].value = 0;
         inputElements[i].value = parseInt(inputElements[i].value) - 1;
         saveFunction();
      });
   });
}

const numInpLimitA = I(".input-a.inp-limit");
const numInpLimitB = I(".input-b.inp-limit");

setupIncDecAction(numInpLimitA, saveDataA);
setupIncDecAction(numInpLimitB, saveDataB);

I(".open-close").click((_, i, element) => {
   element.parentElement.toggle("active");
   const is = element.parentElement.classList.contains("active");

   settings.singleListingOpen[i] = is;
   chromeStorageSetLocal(storageSettingsKey, settings);
});

I("nav .options .btn").click((_, i) => {
   settings.open_option = i;
   chromeStorageSetLocal(storageSettingsKey, settings);
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
function __clear_data_single_listing__() {
   holdTimer = setTimeout(() => {
      clearSingleListingButton.addClass("complete");
      chromeStorageGetLocal(storageSingleListKey, (val) => {
         for (const key in val) {
            if (typeof val[key] === "string") {
               val[key] = "";
            } else {
               val[key] = 0;
            }
         }
         chromeStorageSetLocal(storageSingleListKey, val);
         init();
      });
   }, 1000);
}
function __clear_mapping__() {
   clearTimeout(holdTimer);
   clearSingleListingButton.removeClass("complete");
   clearMappingButton.removeClass("complete");
}

clearSingleListingButton.on("mousedown", __clear_data_single_listing__);
clearSingleListingButton.on("mouseup", __clear_mapping__);
clearSingleListingButton.on("mouseleave", __clear_mapping__);

clearMappingButton.on("mousedown", __clear_data_mapping__);
clearMappingButton.on("mouseup", __clear_mapping__);
clearMappingButton.on("mouseleave", __clear_mapping__);

const imageInputFields = I(".take-inp.image .inp-image");
const imageView = I(".take-inp.image .img-box");

function setImageInInput(i, url, width, height) {
   if (width > height) {
      imageView[i].style.height = `${(height / width) * 100}%`;
      imageView[i].style.width = "100%";
   } else {
      imageView[i].style.height = "100%";
      imageView[i].style.width = `${(width / height) * 100}%`;
   }
   imageView[i].style.backgroundImage = url ? `url(${url})` : "none";

   imageView[i].toggle("active", width > 0);
}

I(".take-inp.image i.sbi-upload4").click((_, i) => {
   imageInputFields[i].click();
});

I(".take-inp.image i.sbi-bin").click((_, i) => {
   setImageInInput(i, "", 0, 0);
   singleListValues[`image_${i}`] = {};
   saveSingleListData();
});

imageInputFields.on("change", (_, i, fileInput) => {
   const file = fileInput.files[0];

   if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
         const imageData = event.target.result;
         const { url, width, height } = await resizeImageData(imageData);
         setImageInInput(i, url, width, height);
         singleListValues[fileInput.name] = {
            url,
            width,
            height,
         };
         saveSingleListData();
      };
      reader.readAsDataURL(file);
   } else {
      setImageInInput(i, "", 0, 0);
      singleListValues[fileInput.name] = {};
      saveSingleListData();
   }
});

function saveSingleListData() {
   chromeStorageSetLocal(storageSingleListKey, singleListValues);
}

function saveDataA() {
   chromeStorageGetLocal(storageMappingKey, (val) => {
      if (!val) val = {};

      aInputs.forEach((inp) => {
         if (inp.type === "number") val[inp.name] = inp.value || 0;
         else val[inp.name] = inp.value || "";
      });

      mappingValues = val;
      chromeStorageSetLocal(storageMappingKey, val);
   });
}

function saveDataB() {
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      if (!val) val = {};

      bInputs.forEach((inp) => {
         if (inp.type !== "file") {
            if (inp.type === "number") val[inp.name] = inp.value || 0;
            else val[inp.name] = inp.value || "";
         }
      });

      singleListValues = val;
      chromeStorageSetLocal(storageSingleListKey, val);
   });
}
