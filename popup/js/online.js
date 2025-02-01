const createUserButton = I("#createUserButton");
const loginUserButton = I("#loginUserButton");
const logoutUserButton = I("#logoutUserButton");

const closeCreateUserForm = I("#closeCreateUserForm");
const closeLoginUserForm = I("#closeLoginUserForm");

const createUserForm = I("#createUserForm");
const loginUserForm = I("#loginUserForm");

const createUserMainButton = I("#createUser");
const loginUserMainButton = I("#loginUser");
const importSearchResult = I("#importSearchResult");

const exportButton = I("#exportButton");
const exportTypeSelector = I("#exportTypeSelector");
const exportUsername = I("#exportUsername");
const exportPassword = I("#exportPassword");
const exportFileName = I("#exportFileName");

const importButton = I("#importButton");
const importTypeSelector = I("#importTypeSelector");
const importUsername = I("#importUsername");
const importSearch = I("#importSearch");

const SEARCH_DELAY = () => 1000;
let selectedFile = null;

createUserButton.click(() => {
   createUserForm.removeClass("hide");
});
closeCreateUserForm.click(() => {
   createUserForm.addClass("hide");
});

loginUserButton.click(() => {
   loginUserForm.removeClass("hide");
});
closeLoginUserForm.click(() => {
   loginUserForm.addClass("hide");
});

function resetCreateUserForm() {
   I("#username")[0].value = "";
   I("#password")[0].value = "";
   I("#coPassword")[0].value = "";
}

createUserMainButton.click(() => {
   const username = I("#username")[0].value.toLowerCase();
   const password = I("#password")[0].value;
   const coPassword = I("#coPassword")[0].value;

   if (username.length < 2 || password.length < 2 || coPassword !== password) {
      const message =
         username.length < 2
            ? "Username must be at least 2 characters long"
            : password.length < 2
            ? "Password must be at least 2 characters long"
            : "Password and Confirm Password do not match";

      const alert = new AlertHTML({
         title: "Alert",
         message: message,
         btnNm1: "Okay",
         oneBtn: true,
      });
      alert.show();
      alert.clickBtn1(() => {
         alert.hide();
         resetCreateUserForm();
      });
      return;
   }

   runtimeSendMessage(
      "p_b_create_user",
      { username, password },
      ({ status, message }) => {
         const alert = new AlertHTML({
            title: status,
            titleColor: status === "Success" ? "green" : "red",
            titleIcon:
               status === "Success" ? "sbi-checkmark" : "sbi-notification",
            message: message,
            btnNm1: "Okay",
            oneBtn: true,
         });
         alert.show();
         alert.clickBtn1(() => {
            alert.hide();
            resetCreateUserForm();
            createUserForm.addClass("hide");
         });
      }
   );
});

loginUserMainButton.click(() => {
   const username = I("#usernameLogin")[0].value.toLowerCase();
   const password = I("#passwordLogin")[0].value;

   if (username.length < 2 || password.length < 2) {
      const message =
         username.length < 2
            ? "Username must be at least 2 characters long"
            : "Password must be at least 2 characters long";

      const alert = new AlertHTML({
         title: "Alert",
         message: message,
         btnNm1: "Okay",
         oneBtn: true,
      });
      alert.show();
      alert.clickBtn1(() => {
         alert.hide();
      });
      return;
   }

   runtimeSendMessage(
      "p_b_verify_user",
      { username, password },
      ({ status, message }) => {
         const alert = new AlertHTML({
            title: status,
            titleColor: status === "SUCCESS" ? "green" : "red",
            titleIcon:
               status === "SUCCESS" ? "sbi-checkmark" : "sbi-notification",
            message: message,
            btnNm1: "Okay",
            oneBtn: true,
         });
         alert.show();

         if (status === "SUCCESS") {
            chromeStorageSetLocal(storageUserLoginKey, { username, password });
            loginUserButton.classList.add("hide");
            logoutUserButton.classList.remove("hide");
         }
         alert.clickBtn1(() => {
            alert.hide();
            I("#usernameLogin")[0].value = "";
            I("#passwordLogin")[0].value = "";
            loginUserForm.addClass("hide");
         });
      }
   );
});

logoutUserButton.click(() => {
   chromeStorageRemoveLocal(storageUserLoginKey);
   loginUserButton.classList.remove("hide");
   logoutUserButton.classList.add("hide");
});

exportButton.click(async () => {
   const fileType = exportTypeSelector[0];
   const type = fileType.value.toLowerCase();
   const filename = exportFileName[0].value;
   const username = exportUsername[0].value.toLowerCase();
   const password = exportPassword[0].value;

   const all = [
      fileType.selectedIndex < 1,
      filename.length < 1,
      username.length < 2,
      password.length < 2,
   ];

   if (all.includes(true)) {
      const message = all[0]
         ? "Please select export type"
         : all[1]
         ? "Please enter file name"
         : all[2]
         ? "Please enter username"
         : "Please enter password";

      const alert = new AlertHTML({
         title: "Alert",
         message: message,
         btnNm1: "Okay",
         oneBtn: true,
      });
      alert.show();
      alert.clickBtn1(() => {
         alert.hide();
      });
      return;
   }

   const getFile = await getLocalFile(exportTypeSelector[0].value);

   runtimeSendMessage(
      "p_b_export_file",
      { data: getFile, typeType: type, filename, username, password },
      ({ status, message }) => {
         if (status === "Success") {
            exportUsername[0].value = "";
            exportPassword[0].value = "";
            exportFileName[0].value = "";
         }
         const alert = new AlertHTML({
            title: status,
            titleColor: status === "Success" ? "green" : "red",
            titleIcon:
               status === "Success" ? "sbi-checkmark" : "sbi-notification",
            message: message,
            btnNm1: "Okay",
            oneBtn: true,
         });
         alert.show();
         alert.clickBtn1(() => {
            alert.hide();
         });
      }
   );
});

function selectFile(ele, data, name) {
   const files = I(".file", importSearchResult[0]);
   files.forEach((e) => e.classList.remove("selected"));
   ele.classList.add("selected");
   selectedFile = { file: data, name };
}

async function deleteFile(username, fileType, filename) {
   const form = new FormHTML();
   form.show();

   form.clickOutside(() => {
      form.hide();
   });

   form.buttonClick((e, input) => {
      const password = input.value;
      if (password.length < 2) {
         const alert = new AlertHTML({
            title: "Alert",
            message: "Please enter password",
            btnNm1: "Okay",
            oneBtn: true,
         });
         alert.show();
         alert.clickBtn1(() => {
            alert.hide();
         });
      } else {
         form.hide();
         runtimeSendMessage(
            "p_b_delete_file",
            { username, fileType, filename, password },
            ({ status, message }) => {
               searchFile();
               const alert = new AlertHTML({
                  title: status,
                  titleColor: status === "Success" ? "green" : "red",
                  titleIcon:
                     status === "Success"
                        ? "sbi-checkmark"
                        : "sbi-notification",
                  message: message,
                  btnNm1: "Okay",
                  oneBtn: true,
               });
               alert.show();
               alert.clickBtn1(() => {
                  alert.hide();
               });
            }
         );
      }
   });
}

function searchFile() {
   const all = [
      importTypeSelector[0].selectedIndex < 1,
      importUsername[0].value.length < 2,
   ];
   const elements = [importTypeSelector[0], importUsername[0]];

   for (let i = 0; i < all.length; i++) {
      if (all[i]) elements[i].classList.add("unfilled");
      else elements[i].classList.remove("unfilled");
   }

   if (all.includes(true)) return;

   const fileType = importTypeSelector[0];
   const type = fileType.value.toLowerCase();
   const username = importUsername[0].value.toLowerCase();
   const search = importSearch[0].value;

   runtimeSendMessage(
      "p_b_search_file",
      { fileType: type, username, search },
      ({ status, message, data }) => {
         selectedFile = null;

         const files = data.map(([_, { filename, date }]) => ({
            filename,
            date,
         }));

         importSearchResult.html(
            files
               .map(
                  ({ filename, date }) => `
                  <div class="file">
                     <div class="name">${filename}</div>
                     <div class="date">${date}</div>
                     <i class="sbi-bin"></i>
                  </div>
               `
               )
               .join("")
         );

         const filesElements = I(".file", importSearchResult[0]);
         const deleteElements = I(".sbi-bin", importSearchResult[0]);

         filesElements.forEach((e, i) => {
            e.addEventListener("click", () => {
               selectFile(e, data[i][1].data, data[i][0]);
            });
         });

         deleteElements.forEach((e, i) => {
            e.addEventListener("click", () => {
               deleteFile(username, type, data[i][0]);
            });
         });
      }
   );
}

importTypeSelector.on("input", debounce(searchFile, SEARCH_DELAY));
importUsername.on("input", debounce(searchFile, SEARCH_DELAY));
importSearch.on("input", debounce(searchFile, SEARCH_DELAY));

importButton.click(async () => {
   const fileType = importTypeSelector[0].value;
   if (selectedFile === null) {
      const alert = new AlertHTML({
         title: "Alert",
         message: "Please select a file",
         btnNm1: "Okay",
         oneBtn: true,
      });
      alert.show();
      alert.clickBtn1(() => {
         alert.hide();
      });
      return;
   }

   await setLocalFile(fileType, selectedFile.file);

   const alert = new AlertHTML({
      title: "Success",
      titleIcon: "sbi-checkmark",
      titleColor: "green",
      message: `File <b>${selectedFile.name}</b> is imported successfully`,
      btnNm1: "Okay",
      oneBtn: true,
   });

   alert.show();
   alert.clickBtn1(() => {
      alert.hide();
   });
});
