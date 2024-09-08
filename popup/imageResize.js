function resizeImageData(imageData, maxSizeMB = 1) {
   return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageData;

      img.onload = () => {
         const canvas = document.createElement("canvas");
         const ctx = canvas.getContext("2d");
         const maxSize = maxSizeMB * 1024 * 1024;
         let { width, height } = img;

         let scaleFactor = Math.sqrt(maxSize / (width * height));
         if (scaleFactor > 1) scaleFactor = 1;

         canvas.width = width * scaleFactor;
         canvas.height = height * scaleFactor;

         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

         let dataURL = canvas.toDataURL("image/jpeg");
         let byteString = atob(dataURL.split(",")[1]);
         let uint8Array = new Uint8Array(byteString.length);
         for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
         }

         if (uint8Array.byteLength < maxSize) {
            resolve({
               url: dataURL,
               width: canvas.width,
               height: canvas.height,
            });
            return;
         }

         while (
            uint8Array.byteLength >= maxSize &&
            canvas.width > 1 &&
            canvas.height > 1
         ) {
            scaleFactor *= 0.9;
            canvas.width = width * scaleFactor;
            canvas.height = height * scaleFactor;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            dataURL = canvas.toDataURL("image/jpeg");
            byteString = atob(dataURL.split(",")[1]);
            uint8Array = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
               uint8Array[i] = byteString.charCodeAt(i);
            }
         }

         if (uint8Array.byteLength < maxSize) {
            resolve({
               url: dataURL,
               width: canvas.width,
               height: canvas.height,
            });
         } else {
            reject(new Error("Failed to resize image within size limits."));
         }
      };

      img.onerror = (err) => reject(err);
   });
}
