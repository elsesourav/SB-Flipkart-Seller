const aInputs = I(".take-inp .input-a");
const bInputs = I(".take-inp .input-b");
const cInputs = I(".take-inp .input-c");
const MAX_IMAGE = 12;

const imageSection = I(".take-inp.image");
const imageInputFields = I(".take-inp.image .inp-image");
const imageView = I(".take-inp.image .img-box");

aInputs.on("input", saveDataA);
bInputs.on("input", saveDataB);
cInputs.on("input", saveDataC);

[aInputs, bInputs, cInputs].forEach((inp) => {
   inp.on("input", (_, __, ele) => {
      if (ele?.getAttribute("inputmode") === "numeric" && ele?.type === "text") {
         const value = ele.value.replace(/,/g, "");
         if (!isNaN(value) && value !== "") {
            ele.value = N(value).toLocaleString("en-IN");
         }
      }
   });
   inp.click((_, __, ele) => {
      if (ele?.type === "text" || ele?.getAttribute("inputmode") === "numeric") {
         ele.select();
      }
   });
});

I("#WordInBengali").click((_, __, ele) => {
   if (ele.checked) {
      I("#NumberInBengaliDiv").removeClass("hide");
   } else {
      I("#NumberInBengali")[0].checked = false;
      I("#NumberInBengaliDiv").addClass("hide");
   }
   saveDataC();
});

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
         else if (inp.getAttribute("inputmode") === "numeric" && inp.type === "text") inp.value = N(mappingData[inp.name] || 0).toLocaleString("en-IN");
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
            else if (inp.getAttribute("inputmode") === "numeric" && inp.type === "text") inp.value = N(listingData[inp.name] || 0).toLocaleString("en-IN");
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
         if (inp.type === "checkbox") inp.checked = ordersData[inp.name] || false;
         else if (inp.getAttribute("inputmode") === "numeric" && inp.type === "text") inp.value = N(ordersData[inp.name] || 0).toLocaleString("en-IN");
      });
      jsonEditorTitle.removeClass("error");
      setJsonContent(ordersData.editor);
      I("#NumberInBengaliDiv")[0].classList.toggle("hide", !ordersData.WordInBengali);
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
   for (let i = 0; i < MAX_IMAGE; i++) {
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
   if (count < MAX_IMAGE - 1) {
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
   for (let i = 0; i < MAX_IMAGE; i++) {
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

   for (let i = j; i < MAX_IMAGE; i++) {
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
         if (i < MAX_IMAGE - 1) imageSection[i + 1].classList.add("show");
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
      const editorValue = getJsonContent();
      ordersData.editor = editorValue;
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
         else if (inp.getAttribute("inputmode") === "numeric" && inp.type === "text") val[inp.name] = inp.value.replace(/,/g, "") || 0;
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
            else if (inp.getAttribute("inputmode") === "numeric" && inp.type === "text") val[inp.name] = inp.value.replace(/,/g, "") || 0;
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
      if (!val) val = {
         nameInBengali: {},
      };
      cInputs.forEach((inp) => {
         if (inp.type === "checkbox") val[inp.name] = inp.checked;
         else if (inp.getAttribute("inputmode") === "numeric" && inp.type === "text") val[inp.name] = inp.value.replace(/,/g, "") || 0;
      });
      chromeStorageSetLocal(storageOrdersKey, val);
   });
}

function downloadJSON(jsonData, filename = 'ES_Seller_Settings.json') {
   const jsonString = JSON.stringify(jsonData);
   const blob = new Blob([jsonString], { type: 'application/json' });
   const url = URL.createObjectURL(blob);

   // Create a temporary link element
   const link = document.createElement('a');
   link.href = url;
   link.download = filename;

   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
}

// Add click event listener to the export button
document.querySelector(`input[name="EXPORT_FILE"]`).addEventListener("click", async () => {
   try {
      const mappingData = await chromeStorageGetLocal(storageMappingKey);
      const listingData = await chromeStorageGetLocal(storageListingKey);
      const ordersData = await chromeStorageGetLocal(storageOrdersKey);
      const settings = await chromeStorageGetLocal(storageSettingsKey);
      const init = await chromeStorageGetLocal(storageInitKey);

      const jsonData = JSON.parse(JSON.stringify({ mappingData, listingData, ordersData, settings, init }));
      downloadJSON(jsonData);
   } catch (error) {
      alert("Invalid JSON format");
   }
});


// Function to read and parse JSON file
function importJSON(file) {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
         try {
            const jsonData = JSON.parse(event.target.result);
            resolve(jsonData);
         } catch (error) {
            reject('Invalid JSON file format');
         }
      };

      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
   });
}

I(`input[name="IMPORT_FILE"]`).click(() => I("#takeFile")[0].click());

// Handle file import
I("#takeFile").on("change", async (event) => {
   const file = event.target.files[0];
   if (file) {
      try {
         const text = await file.text();
         const jsonData = JSON.parse(text);

         // Validate the imported data structure
         if (jsonData.mappingData || jsonData.listingData || jsonData.ordersData || jsonData.settings) {
            // Store the imported data
            if (jsonData.mappingData) {
               await chromeStorageSetLocal(storageMappingKey, jsonData.mappingData);
            }
            if (jsonData.listingData) {
               await chromeStorageSetLocal(storageListingKey, jsonData.listingData);
            }
            if (jsonData.ordersData) {
               await chromeStorageSetLocal(storageOrdersKey, jsonData.ordersData);
            }
            if (jsonData.settings) {
               await chromeStorageSetLocal(storageSettingsKey, jsonData.settings);
            }

            if (jsonData.init) {
               await chromeStorageSetLocal(storageInitKey, jsonData.init);
            }

            init();
         } else {
            alert('Invalid file format');
         }
      } catch (error) {
         alert('Error reading file: ' + error.message);
      }
   }
});

const START_BTN = I("#IS_START");
const PAUSE_BTN = I("#IS_PAUSE");
const STOP_BTN = I("#IS_STOP");

START_BTN.click(() => {
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
})

PAUSE_BTN.click(() => {
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
})

STOP_BTN.click(async () => {
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
})

function setTotalCount() {
   const startCount = I("#START_COUNT")[0]?.value || 0;
   const endCount = I("#END_COUNT")[0]?.value || 0;
   const repeat = I("#REPEAT_COUNT")[0]?.value || 1;

   const total = Math.abs((endCount - startCount) * repeat);
   I("#TOTAL_COUNT")[0].innerText = total;
}

// Add this near the top of the file, after your initial constants
chrome.storage.onChanged.addListener((changes, namespace) => {
   if (namespace === "local") {
      // Handle listing data changes
      if (changes[storageListingKey]) {
         listingData = changes[storageListingKey].newValue;
         const COUNT = listingData?.COUNT || 0;
         I("#COUNT")[0].textContent = COUNT;
      }
   }
});