function selectFile(ele, data, name, parent) {
   const fileElements = I(".file", parent);
   fileElements.each((e) => e.classList.remove("selected"));
   ele.classList.add("selected");
   SELECTED_FILE = { file: data, name };
}

function searchFile(e) {
   const searchValue = e.target.value.toLowerCase();
   const resultId = e.target.dataset.resultId;
   const searchElement = I(`.${resultId}`)[0];
   const fileElements = I(".file", searchElement);
   fileElements.each((e) => {
      if (searchValue) {
         if (e.getAttribute("name")?.toLowerCase().includes(searchValue)) {
            e.classList.remove("hide");
         } else {
            e.classList.add("hide");
         }
      } else {
         e.classList.remove("hide");
      }
   });
}

function dbSearchFile({ parent, username, type, searchElement }) {
   runtimeSendMessage(
      "p_b_search_file",
      { fileType: type, username },
      ({ _, __, data }) => {
         SELECTED_FILE = null;
         searchElement.value = "";

         const files = data.map(([_, { filename, date }]) => ({
            filename,
            date,
         }));

         if (files.length > 0) {
            parent.html(
               files
                  .map(
                     ({ filename, date }) => `
                  <div class="file" name="${filename}">
                     <div class="name">${filename}</div>
                     <div class="date">${date}</div>
                     <i class="sbi-bin"></i>
                  </div>
               `
                  )
                  .join("")
            );
         } else {
            parent.html("");
         }

         const filesElements = I(".file", parent);
         const deleteElements = I(".sbi-bin", parent);

         filesElements.click((_, i, ele) => {
            selectFile(ele, data[i][1].data, data[i][0], parent);
         });

         deleteElements.click((_, i, ele) => {
            deleteFile(parent, username, type, data[i][0], searchElement);
         });
      }
   );
}

function getFiles(e) {
   const id = e.target.dataset.id;
   const usernameElement = I(`.${id}-username`)[0];
   const parent = I(`.${id}-result`)[0];
   const typeElement = I(`.${id}-type`)[0];
   const searchElement = I(`.${id}-filename`)[0];

   const usernameLen = usernameElement?.value.length;

   usernameElement?.classList.toggle("unfilled", usernameLen < 2);
   if (usernameLen < 2) return;

   const type = typeElement?.textContent?.toLowerCase();
   const username = usernameElement?.value?.toLowerCase();
   dbSearchFile({ parent, username, type, searchElement });
}

// -------------- need to update ----------------
async function deleteFile(parent, username, type, filename, searchElement) {
   const form = new FormHTML();
   form.show();

   form.clickOutside(() => {
      form.hide();
   });

   form.buttonClick((_, input) => {
      const password = input.value;
      if (password.length < 2) {
         showAlertMessage(
            "ERROR",
            "Password must be at least 2 characters long"
         );
      } else {
         form.hide();
         runtimeSendMessage(
            "p_b_delete_file",
            { username, fileType: type, filename, password },
            ({ status, message }) => {
               showAlertMessage(status, message);
               dbSearchFile({ parent, username, type, searchElement });
            }
         );
      }
   });
}
