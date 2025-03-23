aInputs.on("input", saveDataA);
bInputs.on("input", saveDataB);
cInputs.on("input", saveDataC);
updateStorage();

setupIncDecAction(numInpLimitA, saveDataA);
setupIncDecAction(numInpLimitB, saveDataB);
setupIncDecAction(addProductInpLimit, () => {});

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
   chromeStorageSetLocal(KEYS.STORAGE_SETTINGS, settings);
});

I("nav .options .btn").click((_, i) => {
   settings.currentMode = i;
   chromeStorageSetLocal(KEYS.STORAGE_SETTINGS, settings);
   jsonEditor.refresh();
});

clearSingleListingButton.on("mousedown", __clear_data_listing__);
clearSingleListingButton.on("mouseup", __clear_mapping__);
clearSingleListingButton.on("mouseleave", __clear_mapping__);

clearMappingButton.on("mousedown", __clear_data_mapping__);
clearMappingButton.on("mouseup", __clear_mapping__);
clearMappingButton.on("mouseleave", __clear_mapping__);

jsonEditor.on("change", () => {
   try {
      const editorValue = getJsonContent();
      ordersData.editor = editorValue;
      chromeStorageSetLocal(KEYS.STORAGE_ORDERS, ordersData);
      jsonEditorTitle.removeClass("error");
   } catch (e) {
      console.log("Invalid JSON");
      jsonEditorTitle.addClass("error");
   }
});

START_BTN.click(startAutoMationAction);
PAUSE_BTN.click(pauseAutoMationAction);
STOP_BTN.click(stopAutoMationAction);

addNewProduct.click(openAddNewProductWindow);
hideAddProductButton.click(closeAddNewProductWindow);
saveAddProductButton.click(saveProductDataAction);

addProductInputsData.on(
   "input",
   debounce(checkValidationForAddProductWindow, () => 1000)
);
addProductInpIndDec.click(
   debounce(checkValidationForAddProductWindow, () => 1000)
);

selectNameElement.addEventListener("click", async (e) => {
   const value = e.target.value;
   let DATA = await chromeStorageGetLocal(KEYS.STORAGE_PRODUCT);

   let htmlString = "<option>SELECT PRODUCT</option>";
   for (const name in DATA) {
      const key = DATA[name].key;
      const isSelected = name == value ? "selected": "";
      htmlString += `
      <option ${isSelected} name="${name} ${key}" value="${name}">
         ${name.toUpperCase()}
      </option>`;
   }
   selectNameElement.innerHTML = htmlString;
});

selectNameElement.addEventListener("change", async (e) => {
   const value = e.target.value;
   let DATA = await chromeStorageGetLocal(KEYS.STORAGE_PRODUCT);
   const info = DATA[value];
   delete info?.["name"];
   updateAndSaveMappingMainData(info);
})

sortProductDataInput.on("input", sortProductDataAction);