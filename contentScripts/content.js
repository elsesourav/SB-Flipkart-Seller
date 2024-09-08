let isOpenPanel = false;

function getValues() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b", (r) => {
         resolve(r);
      });
   });
}

function getImages() {
   return new Promise((resolve) => {
      runtimeSendMessage("c_b_image_request", (r) => {
         resolve(r);
      });
   });
}

window.onload = async () => {
   const currentUrl = window.location.href;
   if (currentUrl.includes(URL.singleListing)) {
      const openBtn = document.createElement("div");
      openBtn.setAttribute(
         "style",
         `
         position: fixed;
         bottom: 10px;
         right: 10px;
         cursor: pointer;
         background-color: #007bff;
         font-size: 25px;
         color: #fff;
         font-weight: bold;
         padding: 8px 20px;
         border-radius: 5px;
         box-shadow: 0 3px 4px #000;
         transition: background-color 0.3s;
         z-index: 100;
      `
      );
      openBtn.innerText = "Fill Inputs";
      document.body.appendChild(openBtn);

      openBtn.addEventListener("click", async () => {
         // fill Images
         const { image_0, image_1, image_2, image_3 } = await getImages();
         const images = [image_0, image_1, image_2, image_3];

         I('#sub-app-container .hTTPSU[data-testid="button"]')[0].click();
         await wait(200);

         for (let i = 0; i < images.length; i++) {
            if (images[i]) {
               await wait(400);
               I(`#thumbnail_${i} > div`)[0].click();
               await wait(100);
               const fileInput = I("#upload-image")[0];
               putImageIntoInputFile(fileInput, images[i].url);
            }
         }
         await wait(2000);
         if (images.length > 0) {
            const buttons = [
               ...document.querySelectorAll(`[data-testid="button"]`),
            ];
            buttons.filter((e) => e.innerText.trim() == "Save")[0].click();
         }

         // ------- Price, Stock and Shipping Information
         

         // ------- Product Description

         // ------- Additional Description (Optional)
      });
   }
};

function setValue(element, value) {
   element[0].value = value;
   const event = new Event("change", { bubbles: true });
   element[0].dispatchEvent(event);
}

async function onlySetup() {
   await wait(100);
   values = await getValues();
   await wait(100);

   setValue(I("#listing_status"), values.listing_status);
   setValue(I("#minimum_order_quantity"), values.minimum_order_quantity);
   setValue(I("#service_profile"), values.service_profile);
   setValue(I("#procurement_type"), values.procurement_type);
   setValue(I("#shipping_days"), values.shipping_days);
   setValue(I("#stock_size"), values.stock_size);

   setValue(I("#shipping_provider"), values.shipping_provider);
   setValue(
      I("#local_shipping_fee_from_buyer"),
      values.local_shipping_fee_from_buyer
   );
   setValue(
      I("#zonal_shipping_fee_from_buyer"),
      values.zonal_shipping_fee_from_buyer
   );
   setValue(
      I("#national_shipping_fee_from_buyer"),
      values.national_shipping_fee_from_buyer
   );

   setValue(I(`input[name="length_p0"]`), values.length_p0);
   setValue(I(`input[name="breadth_p0"]`), values.breadth_p0);
   setValue(I(`input[name="height_p0"]`), values.height_p0);
   setValue(I(`input[name="weight_p0"]`), values.weight_p0);

   setValue(I(`#hsn`), values.hsn);
   setValue(I("#tax_code"), values.tax_code);
   setValue(I(`#country_of_origin`), values.country_of_origin);
   setValue(I(`#manufacturer_details`), values.manufacturer_details);
   setValue(I(`#packer_details`), values.packer_details);

   if (I(`#importer_details`)[0])
      setValue(I(`#importer_details`), values.importer_details);
   setValue(I(`#earliest_mfg_date`), values.earliest_mfg_date);
   setValue(I(`#shelf_life`), values.shelf_life);
}

document.body.click(() => {
   setTimeout(() => {
      const RMP = I(".ReactModalPortal")[0];
      if (RMP && RMP.innerHTML.length > 0 && !isOpenPanel) {
         isOpenPanel = true;

         onlySetup();
      } else if (RMP) {
         isOpenPanel = false;
      }
   }, 500);
});
