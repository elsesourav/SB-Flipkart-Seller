const createUserButton = I("#createUserButton");
const loginUserButton = I("#loginUserButton");
const logoutUserButton = I("#logoutUserButton");

const closeButtons = I(".container > div > .close");

const createUserForm = I("#createUserForm");
const loginUserForm = I("#loginUserForm");

const createUserMainButton = I("#createUser");
const loginUserMainButton = I("#loginUser");

const exportButtonElement = I("#exportButtonMain");
const importButtonElement = I("#importButtonMain");

const importWindow = I("#importWindow");
const exportWindow = I("#exportWindow");

const importTypes = I(".import-type");
const importUsernames = I(".import-username");
const importSearches = I(".import-filename");
const importResults = I(".import-result");
const importButtons = I(".import-btn");

const exportTypes = I(".export-type");
const exportUsernames = I(".export-username");
const exportPasswords = I(".export-password");
const exportFileNames = I(".export-filename");
const exportResults = I(".export-result");
const exportButtons = I(".export-btn");

const SEARCH_DELAY = () => 1000;
let SELECTED_FILE = null;

function showAlertMessage(status, message, callback = () => {}) {
   const alert = new AlertHTML({
      title: status,
      titleColor: status === "SUCCESS" ? "green" : "red",
      titleIcon: status === "SUCCESS" ? "sbi-checkmark" : "sbi-notification",
      message: message,
      btnNm1: "Okay",
      oneBtn: true,
   });
   alert.show();
   alert.clickBtn1(() => {
      alert.hide();
      callback(status);
   });
}

function resetCreateUserForm() {
   I("#username")[0].value = "";
   I("#password")[0].value = "";
   I("#coPassword")[0].value = "";
}

createUserButton.click(() => {
   createUserForm.removeClass("hide");
});

loginUserButton.click(() => {
   loginUserForm.removeClass("hide");
});

closeButtons.click((__, _, ele) => {
   ele.parentNode.parentNode.classList.add("hide");
});

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

      showAlertMessage("ERROR", message, () => {
         resetCreateUserForm();
      });
      return;
   }

   runtimeSendMessage(
      "p_b_create_user",
      { username, password },
      ({ status, message }) => {
         showAlertMessage(status, message, (STATUS) => {
            if (STATUS === "SUCCESS") {
               resetCreateUserForm();
               createUserForm.addClass("hide");
            }
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

      showAlertMessage("ERROR", message);
      return;
   }

   runtimeSendMessage(
      "p_b_verify_user",
      { username, password },
      ({ status, message }) => {
         if (status === "SUCCESS") {
            chromeStorageSetLocal(KEYS.STORAGE_USER_LOGIN, {
               username,
               password,
            });
            loginUserButton.classList.add("hide");
            logoutUserButton.classList.remove("hide");
         }

         showAlertMessage(status, message, (STATUS) => {
            if (STATUS === "SUCCESS") {
               I("#usernameLogin")[0].value = "";
               I("#passwordLogin")[0].value = "";
               loginUserForm.addClass("hide");
            }
         });
      }
   );
});

logoutUserButton.click(() => {
   chromeStorageRemoveLocal(KEYS.STORAGE_USER_LOGIN);
   loginUserButton.classList.remove("hide");
   logoutUserButton.classList.add("hide");
});

exportButtons.click(async (_) => {
   const type = exportTypes[0].textContent;
   const username = exportUsernames[0].value;
   const password = exportPasswords[0].value;
   const filename = exportFileNames[0].value;

   const isSelected = SELECTED_FILE ? true : false;
   let name = isSelected ? SELECTED_FILE.name : null;

   if (!type || !username || !password || (!isSelected && !filename)) {
      showAlertMessage("ERROR", "Please fill all the fields");
      return;
   }

   if (username.length < 2 || password.length < 2) {
      showAlertMessage(
         "ERROR",
         "Username and password must be at least 2 characters long"
      );
      return;
   }

   if (filename.length < 1 && !isSelected) {
      showAlertMessage("ERROR", "Filename must be at least 1 characters long");
      return;
   }

   const getFile = await getLocalFile(type.toUpperCase());

   if (isSelected) {
      const alert = new AlertHTML({
         title: "Alert",
         message: `Are you sure you want to Update '<small><b>${name}</b></small>' this Product?`,
         btnNm1: "No",
         btnNm2: "Yes",
      });
   
      alert.show();
      alert.clickBtn1(() => {
         alert.hide();
      });
      alert.clickBtn2(() => {
         alert.hide();
         action();
      });
   } else {
      action();
   }


   function action() {
      runtimeSendMessage(
         "p_b_export_file",
         {
            data: getFile,
            fileType: type,
            isUpdate: isSelected,
            name,
            filename,
            username,
            password,
         },
         ({ status, message }) => {
            showAlertMessage(status, message, (STATUS) => {
               if (STATUS === "SUCCESS") {
                  exportWindow.addClass("hide");
               }
            });
         }
      );
   }
});

exportButtonElement.click(async () => {
   const type = I(".options .btn input:checked")[0]?.dataset.name;
   if (!type) return;

   exportWindow.removeClass("hide");
   exportTypes[0].innerHTML = type.toUpperCase();

   const { username, password } = await chromeStorageGetLocal(
      KEYS.STORAGE_USER_LOGIN
   );
   exportUsernames[0].value = username || "";
   exportPasswords[0].value = password || "";
   exportFileNames[0].value = "";

   dbSearchFile({
      parent: exportResults[0],
      username,
      type,
      searchElement: exportFileNames[0],
   });
});

// importTypes.on("input", debounce(getFiles, SEARCH_DELAY));
importUsernames.on("input", debounce(getFiles, SEARCH_DELAY));
exportUsernames.on("input", debounce(getFiles, SEARCH_DELAY));
importSearches.on("input", searchFile);
exportFileNames.on("input", searchFile);

importButtons.click(async (_) => {
   const type = importTypes[0].textContent;
   if (SELECTED_FILE === null) {
      showAlertMessage("ERROR", "Please select a file");
      return;
   }

   await setLocalFile(type.toUpperCase(), SELECTED_FILE.file);

   showAlertMessage(
      "SUCCESS",
      `File <b>${SELECTED_FILE.name}</b> is imported successfully`,
      () => {
         importWindow.addClass("hide");
      }
   );
});

importButtonElement.click(async () => {
   const type = I(".options .btn input:checked")[0]?.dataset.name;
   if (!type) return;
   importWindow.removeClass("hide");
   importTypes[0].innerHTML = type.toUpperCase();

   const DATA = await chromeStorageGetLocal(KEYS.STORAGE_USER_LOGIN);
   let username;
   if (DATA) {
      username = DATA
      importUsernames[0].value = username;
   } else {
      username = importUsernames[0].value.toLowerCase();
   }

   dbSearchFile({
      parent: importResults[0],
      username,
      type,
      searchElement: importSearches[0],
   });
});
