aInputs.on("input", saveDataA);
bInputs.on("input", saveDataB);
cInputs.on("input", saveDataC);

init();

setupIncDecAction(numInpLimitA, saveDataA);
setupIncDecAction(numInpLimitB, saveDataB);

I("#WordInBengali").click((_, __, ele) => {
   if (ele.checked) {
      I("#NumberInBengaliDiv").removeClass("hide");
   } else {
      I("#NumberInBengali")[0].checked = false;
      I("#NumberInBengaliDiv").addClass("hide");
   }
   saveDataC();
});

I(".grid-flip").click((_, i) => {
   settings.listingOpen[i] = _.target.checked;
   chromeStorageSetLocal(storageSettingsKey, settings);
});

I("nav .options .btn").click((_, i) => {
   settings.currentMode = i;
   chromeStorageSetLocal(storageSettingsKey, settings);
   jsonEditor.refresh();
});

clearSingleListingButton.on("mousedown", __clear_data_listing__);
clearSingleListingButton.on("mouseup", __clear_mapping__);
clearSingleListingButton.on("mouseleave", __clear_mapping__);

clearMappingButton.on("mousedown", __clear_data_mapping__);
clearMappingButton.on("mouseup", __clear_mapping__);
clearMappingButton.on("mouseleave", __clear_mapping__);

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

START_BTN.click(startAutoMationAction);
PAUSE_BTN.click(pauseAutoMationAction);
STOP_BTN.click(stopAutoMationAction);



