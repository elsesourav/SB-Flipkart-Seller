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

I(".open-close").click((_, __, element) => {
   element.parentNode.toggle("active");
});

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

(async () => {
   await chromeStorageGetLocal(storageSingleListKey, (val) => {
      if (val) singleListValues = val;
   });
   for (let i = 0; i < 4; i++) {
      const { url, width, height } = singleListValues[`image_${i}`];
      setImageInInput(i, url, width, height);
   }
})();

// I(".input").on("input", (e) => {
//    saveData();
// });

const inputs = I(".take-inp .input-b");
// const textAreaInputs = I("textarea");

// // setup
// (async () => {
//    await chromeStorageGet(storageKey, (val) => {
//       values = val;
//    });
//    inputs.forEach((inp) => {
//       inp.value = values[inp.name];
//    });

//    textAreaInputs.forEach((inp) => {
//       inp.value = values[inp.name];
//    });
// })();

function saveData() {
   chromeStorageGetLocal(storageSingleListKey, (val) => {
      inputs.forEach((inp) => {
         values[inp.name] = inp.value;
      });
      
      textAreaInputs.forEach((inp) => {
         values[inp.name] = inp.value;
      });
      
      chromeStorageSet(storageSingleListKey, values);
   });

}
