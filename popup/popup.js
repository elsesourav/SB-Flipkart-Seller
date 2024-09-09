// ---------------- setup -------------------
async function init() {
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
         inputs.forEach((inp) => {
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
      }
   });
}
init();

// increase decrease button (only switch limit .input)
const numInpLimit = I(".inp.num .inp-limit");

I(".inp.num .inc").click((_, i) => {
   numInpLimit[i].value = parseInt(numInpLimit[i].value) + 1;
   saveData();
});
I(".inp.num .dec").click((_, i) => {
   const val = parseInt(numInpLimit[i].value);
   if (val > 0) {
      numInpLimit[i].value = val - 1;
      saveData();
   }
});

I(".open-close").click((_, i, element) => {
   element.parentElement.toggle("active");
   const is = element.parentElement.classList.contains("active");

   settings.singleListingOpen[i] = is;
   chromeStorageSetLocal(storageSettingsKey, settings);
});

let holdTimer;
let clearSingleListingButton = I("#MyListingClearBtn .clear");

function __clear_data__() {
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
function __clear_timer__() {
   clearTimeout(holdTimer);
   clearSingleListingButton.removeClass("complete");
}
clearSingleListingButton.on("mousedown", __clear_data__);
clearSingleListingButton.on("mouseup", __clear_timer__);
clearSingleListingButton.on("mouseleave", __clear_timer__);

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
const inputs = I(".take-inp .input-b");

inputs.on("change", (e) => {
   saveData();
});

function saveData() {
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      inputs.forEach((inp, i) => {
         if (inp.type !== "file") {
            if (inp.type === "number") val[inp.name] = inp.value || 0;
            else val[inp.name] = inp.value || "";
         }
      });

      singleListValues = val;
      console.log(val);

      chromeStorageSetLocal(storageSingleListKey, val);
   });
}
