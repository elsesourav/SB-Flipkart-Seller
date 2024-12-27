const _canvas_ = document.getElementById("testCanvas");
const _ctx_ = _canvas_.getContext("2d");

function resizedImage(file, MAX_WIDTH = 400, MAX_HEIGHT = 400) {
   return new Promise((resolve) => {
      const img = new Image();
      img.src = file;

      img.onload = () => {
         let width = img.width;
         let height = img.height;

         // Scale down if image is too large
         if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
               height = (height / width) * MAX_WIDTH;
               width = MAX_WIDTH;
            } else {
               width = (width / height) * MAX_HEIGHT;
               height = MAX_HEIGHT;
            }
         }
         _canvas_.width = width;
         _canvas_.height = height;
         _ctx_.drawImage(img, 0, 0, width, height);

         resolve(_canvas_.toDataURL("image/jpeg", 0.8));
      };
   });
}

function createImageBox(file) {
   const imageBox = CE(
      { class: "img-box" },
      CE({ tag: "i", class: "sbi-bin" })
   );

   const img = new Image();
   img.src = file;
   img.onload = () => {
      let width = img.width;
      let height = img.height;

      imageBox.style.backgroundImage = `url(${img.src})`;

      // Set dimensions maintaining aspect ratio
      if (width > height) {
         imageBox.style.height = `${(height / width) * 100}%`;
         imageBox.style.width = "100%";
      } else {
         imageBox.style.height = "100%";
         imageBox.style.width = `${(width / height) * 100}%`;
      }
   };

   imageBox.click(deleteImageAction);

   return imageBox;
}

function deleteImageAction(event) {
   IMAGE_LISTS.each((box, i) => {
      const imageElements = box.querySelectorAll(".img-box", box);
      imageElements.forEach((img, j) => {
         if (img === event.target) {
            const alert = new AlertHTML({
               title: "Alert",
               message: "Are you sure you want to delete this image?",
               btnNm1: "No",
               btnNm2: "Yes",
            });
            alert.show();
            alert.clickBtn1(() => {
               alert.hide();
            });
            alert.clickBtn2(async () => {
               await chromeStorageGetLocal(`storage-images-small-${i}`, (DATA) => {
                  DATA.files.splice(j, 1);
                  chromeStorageSetLocal(`storage-images-small-${i}`, DATA);
                  setupSavedImages();
               });
               alert.hide();
               chromeStorageGetLocal(`storage-images-${i}`, (DATA) => {
                  DATA.files.splice(j, 1);
                  chromeStorageSetLocal(`storage-images-${i}`, DATA);
               });

               if (i === 0) {
                  setTotalCount();
               }
            });
         }
      });
   });
}

async function setupSavedImages() {
   IMAGE_LISTS.forEach((box) => (box.innerHTML = ""));

   for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => {
         chromeStorageGetLocal(`storage-images-small-${i}`, (DATA) => {
            if (DATA?.files?.length > 0) {
               const elements = DATA.files.map((file) => createImageBox(file));
               IMAGE_LISTS[i].append(...elements);
            }
            resolve();
         });
      });
   }
}

UPLOAD_IMAGE_BUTTONS.click((_, i) => UPLOAD_IMAGE_INPUTS[i].click());

UPLOAD_IMAGE_INPUTS.on("change", async (_, i, fileInput) => {
   const files = fileInput.files;

   if (files.length > 0) {
      const readFile = (file) => {
         return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
         });
      };

      try {
         const filePromises = Array.from(files).map(file => readFile(file));
         const results = await Promise.all(filePromises);
         
         // Wait for all images to be resized
         const smallResults = await Promise.all(results.map(file => resizedImage(file)));

         // Store resized images
         await chromeStorageGetLocal(`storage-images-small-${i}`, (DATA) => {
            DATA = DATA || { files: [] };
            DATA.files = DATA.files.concat(smallResults);
            chromeStorageSetLocal(`storage-images-small-${i}`, DATA);
            setupSavedImages();
         });

         // Store original images
         chromeStorageGetLocal(`storage-images-${i}`, (DATA) => {
            DATA = DATA || { files: [] };
            DATA.files = DATA.files.concat(results);
            chromeStorageSetLocal(`storage-images-${i}`, DATA);
         });

         if (i === 0) {
            setTotalCount();
         }
      } catch (error) {
         console.log("Error reading files:", error);
      }
   }
});

DELETE_IMAGES_BUTTONS.click((_, i) => {
   const alert = new AlertHTML({
      title: "Alert",
      message: "Are you sure you want to delete all images?",
      btnNm1: "No",
      btnNm2: "Yes",
   });
   alert.show();
   alert.clickBtn1(() => {
      alert.hide();
   });
   alert.clickBtn2(() => {
      chromeStorageSetLocal(`storage-images-small-${i}`, { files: [] });
      chromeStorageSetLocal(`storage-images-${i}`, { files: [] });
      setupSavedImages();
      if (i === 0) {
         setTotalCount();
      }
      alert.hide();
   });
});
