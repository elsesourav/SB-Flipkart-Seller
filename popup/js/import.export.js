function selectFile(ele, data, name, index) {
   const fileElements = I(".file", importResults[index]);
   fileElements.each((e) => e.classList.remove("selected"));
   ele.classList.add("selected");
   IMPORT_SELECTED_FILE = { file: data, name };
}

function searchFile(_, index = 1) {
   const searchValue = importSearches[index]?.value?.toLowerCase();
   const fileElements = I(".file", importResults[index]);
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

function dbSearchFile({ parent, username, type, index = 1 }) {
   runtimeSendMessage(
      "p_b_search_file",
      { fileType: type, username },
      ({ status, message, data }) => {
         IMPORT_SELECTED_FILE = null;
         importSearches[index].value = "";

         const files = data.map(([_, { filename, date }]) => ({
            filename,
            date,
         }));

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

         const filesElements = I(".file", parent[0]);
         const deleteElements = I(".sbi-bin", parent[0]);

         filesElements.click((_, i, ele) => {
            selectFile(ele, data[i][1].data, data[i][0], index);
         });

         deleteElements.click((_, i, ele) => {
            deleteFile(parent, username, type, data[i][0], index);
         });
      }
   );
}

function getFiles(_, index = 1) {
   importUsernames[index]?.classList.toggle(
      "unfilled",
      importUsernames[index]?.value.length < 2
   );
   if (index === 0) {
      importTypes[0]?.classList.toggle(
         "unfilled",
         importTypes[0]?.selectedIndex < 1
      );
      if (importTypes[0]?.selectedIndex < 1) return;
   }
   if (importUsernames[index]?.value?.length < 2) return;

   const type =
      index === 1
         ? importTypes[1]?.textContent
         : importTypes[index]?.value?.toLowerCase();
   const username = importUsernames[index]?.value?.toLowerCase();
   const search = importSearches[index]?.value?.toLowerCase();
   const parent = importResults[index];

   dbSearchFile({ parent, username, search, type, index });
}

// -------------- need to update ----------------
async function deleteFile(parent, username, type, filename, index) {
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
               dbSearchFile({ parent, username, type, index });
            }
         );
      }
   });
}
