const openAddNewProductWindow = () => addProductWindow.classList.remove("hide");
const closeAddNewProductWindow = () => addProductWindow.classList.add("hide");

function checkValidationForAddProductWindow() {
   const info = [...addProductInputsData].map((e) => e.value);
   const allTrue = info.every((e) => e.trim().length > 0 && e != 0);
   saveAddProductButton.classList.toggle("high-light", allTrue);
}

async function saveProductDataAction() {
   const info = [...addProductInputsData].map((e) => {
      return { name: e.name, value: e.value };
   });
   const allTrue = info.every((e) => e.value.trim().length > 0 && e.value != 0);
   if (!allTrue) return;

   let mapInfo = info.reduce((acc, cur) => {
      acc[cur.name] = cur.value;
      return acc;
   }, {});

   const { name } = mapInfo;
   delete mapInfo.name;
   let DATA = await chromeStorageGetLocal(KEYS.STORAGE_PRODUCT);

   const [nm, key] = name?.toLowerCase()?.split("#");
   const newName = nm.trim();

   if (DATA && DATA[newName]) {
      showAlertMessage("ERROR", "Product already exists");
      return;
   }

   if (!DATA) DATA = {};
   DATA[newName] = { ...mapInfo, name: newName, key: key?.trim() || name };

   chromeStorageSetLocal(KEYS.STORAGE_PRODUCT, DATA);
   showAlertMessage("SUCCESS", "Product added successfully");
   closeAddNewProductWindow();

   addProductsInProductList(DATA);

   saveAddProductButton.classList.remove("high-light");
   addProductInputsData.each((e) => {
      if (e.name == "name") e.value = "";
      else if (e.name == "weight") e.value = 1;
      else e.value = 0;
   });
}

function deleteProductAction(name) {
   const alert = new AlertHTML({
      title: "Confirm!",
      titleColor: "yellow",
      titleIcon: "sbi-notification",
      message: `Are you sure you want to delete <b>'${name.toUpperCase()}'</b> product?`,
      btnNm1: "Cancel",
      btnNm2: "Delete",
      oneBtn: false,
   });
   alert.show();

   alert.clickBtn1(() => {
      alert.hide();
   });
   alert.clickBtn2(async () => {
      alert.hide();
      let DATA = await chromeStorageGetLocal(KEYS.STORAGE_PRODUCT);
      if (DATA && DATA[name]) {
         delete DATA[name];
         chromeStorageSetLocal(KEYS.STORAGE_PRODUCT, DATA);
         addProductsInProductList(DATA);
      }
   });
}

function createNewProduct(info) {
   const { name, cost, increment, self_life, unit, weight, index } = info;

   return `
   <div class="product basic-grid fill no-flip" id="${name}">
      <button class="delete-button" data-product-name="${name}">
         <i class="sbi-remove"></i>
      </button>
      <div class="take-inp full-width four-input">
         <div class="s-no">${index}</div>
         <section>
            <div class="take-value">
               <div class="inp text">
                  <label>Product Name</label>
                  <input autocomplete="off" name="name" type="text" value="${name}" />
               </div>
            </div>
         </section>

         <section>
            <div class="take-value">
               <div class="inp num" step="1">
                  <label>
                     1<i class="sbi-inr"></i> Inc Per
                  </label>
                  <button class="dec">
                     <i class="sbi-minus-square"></i>
                  </button>
                  <input
                     autocomplete="off"
                     type="text"
                     name="increment"
                     inputmode="numeric"
                     value="${N(increment || 0).toLocaleString("en-IN")}"
                  />
                  <button class="inc">
                     <i class="sbi-plus-square"></i>
                  </button>
               </div>
            </div>
         </section>

         <section>
            <div class="take-value">
               <div class="inp num" step="1">
                  <label>Self Life</label>
                  <button class="dec">
                     <i class="sbi-minus-square"></i>
                  </button>
                  <input
                     autocomplete="off"
                     type="text"
                     name="self_life"
                     inputmode="numeric"
                     value="${self_life}"
                  />
                  <button class="inc">
                     <i class="sbi-plus-square"></i>
                  </button>
               </div>
            </div>
         </section>
      </div>
      
      <div class="take-inp full-width three-input">
         <section>
            <div class="take-value">
               <div class="inp num" step="0.05">
                  <label>Weight in KG</label>
                  <button class="dec">
                     <i class="sbi-minus-square"></i>
                  </button>
                  <input
                     autocomplete="off"
                     type="number"
                     name="weight"
                     inputmode="numeric"
                     value="${N(weight || 0).toLocaleString("en-IN")}"
                  />
                  <button class="inc">
                     <i class="sbi-plus-square"></i>
                  </button>
               </div>
            </div>
         </section>

         <section>
            <div class="take-value">
               <div class="inp num" step="1">
                  <label>of Cost</label>
                  <button class="dec">
                     <i class="sbi-minus-square"></i>
                  </button>
                  <input
                     autocomplete="off"
                     type="text"
                     name="cost"
                     inputmode="numeric"
                     value="${N(cost || 0).toLocaleString("en-IN")}"
                  />
                  <button class="inc">
                     <i class="sbi-plus-square"></i>
                  </button>
               </div>
            </div>
         </section>

         <section>
            <div class="take-value">
               <div class="inp num" step="1">
                  <label>Unit</label>
                  <button class="dec">
                     <i class="sbi-minus-square"></i>
                  </button>
                  <input
                     autocomplete="off"
                     type="text"
                     name="unit"
                     inputmode="numeric"
                     value="${N(unit || 0).toLocaleString("en-IN")}"
                  />
                  <button class="inc">
                     <i class="sbi-plus-square"></i>
                  </button>
               </div>
            </div>
         </section>
      </div>
   </div>
   `;
}

function addProductsInProductList(allProducts) {
   allProductsListElement.innerHTML = "";

   let htmlString = "";
   let index = 1;
   for (const name in allProducts) {
      const info = allProducts[name];
      htmlString += createNewProduct({ ...info, index, name });
      index++;
   }
   allProductsListElement.innerHTML = htmlString;

   const products = I(".product", allProductsListElement);
   const allInputsIncDec = I(`input[inputmode="numeric"]`, allProductsListElement);
   const deleteButtons = I(".delete-button", allProductsListElement);
   const allInputs = I(`input`, allProductsListElement);

   const saveProductsData = debounce(() => {
      const result = [...products].map((ele) => {
         const inp = I("input", ele);
         let obj = {};
         inp.each((e) => (obj[e.name] = e.value.replace(/,/g, "")));
         return obj;
      });

      // make object from result
      let DATA = result.reduce((acc, cur) => {
         acc[cur.name] = cur;
         return acc;
      }, {});
      chromeStorageSetLocal(KEYS.STORAGE_PRODUCT, DATA);

      // set mapping main data and save
      const selectProductNameValue = selectNameElement.value;
      if (DATA && DATA[selectProductNameValue]) {
         const info = DATA[selectProductNameValue];
         delete info?.["name"];
         updateAndSaveMappingMainData(info);
      }
   }, () => 1000);

   setupIncDecAction(allInputsIncDec, saveProductsData);
   allInputs.on("input", saveProductsData);


   deleteButtons.click((_, __, This) => {
      const productName = This.getAttribute("data-product-name");
      deleteProductAction(productName);
   });
}

function updateAndSaveMappingMainData(info) {
   numInpLimitA.forEach((ele) => {
      const name = ele.getAttribute("data-name");
      if (name && info?.[name]) {
         if (ele.getAttribute("inputmode") === "numeric") {
            ele.value = N(info[name] || 0).toLocaleString("en-IN");
         } else ele.value = info[name];
      }
   });
   saveDataA();
}

function sortProductDataAction(_, This) {
   const searchValue = This.value.toLowerCase();
   const allProducts = [...I(".product", allProductsListElement)];
   
   const sortedProducts = allProducts.sort((a, b) => {
      const aName = a.id.toLowerCase();
      const bName = b.id.toLowerCase();
      
      if (aName === searchValue) return -1;
      if (bName === searchValue) return 1;
      
      const aStartsWith = aName.startsWith(searchValue);
      const bStartsWith = bName.startsWith(searchValue);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      const aIncludes = aName.includes(searchValue);
      const bIncludes = bName.includes(searchValue);
      if (aIncludes && !bIncludes) return -1;
      if (!aIncludes && bIncludes) return 1;
      
      return 0;
   });
   
   sortedProducts.forEach(product => {
      allProductsListElement.appendChild(product);
   });
}