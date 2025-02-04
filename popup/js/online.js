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
const importSearches = I(".import-search");
const importResults = I(".import-result");
const importButtons = I(".import-btn");

const exportTypes = I(".export-type");
const exportUsernames = I(".export-username");
const exportPasswords = I(".export-password");
const exportFileNames = I(".export-filename");
const exportButtons = I(".export-btn");

const SEARCH_DELAY = () => 1000;
let IMPORT_SELECTED_FILE = null;

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

exportButtons.click(async (_, i) => {
   const type = i === 1 ? exportTypes[1].textContent : exportTypes[i].value;
   const username = exportUsernames[i].value;
   const password = exportPasswords[i].value;
   const filename = exportFileNames[i].value;

   if (!type || !username || !password || !filename) {
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

   if (filename.length < 1) {
      showAlertMessage("ERROR", "Filename must be at least 1 characters long");
      return;
   }

   const getFile = await getLocalFile(type.toUpperCase());

   runtimeSendMessage(
      "p_b_export_file",
      { data: getFile, fileType: type, filename, username, password },
      ({ status, message }) => {
         showAlertMessage(status, message, (STATUS) => {
            if (STATUS === "SUCCESS") {
               exportWindow.addClass("hide");
            }
         });
      }
   );
});

exportButtonElement.click(async () => {
   const type = I(".options .btn input:checked")[0]?.dataset.name;
   if (!type) return;

   exportWindow.removeClass("hide");
   exportTypes[1].innerHTML = type.toUpperCase();

   const { username, password } = await chromeStorageGetLocal(
      KEYS.STORAGE_USER_LOGIN
   );
   exportUsernames[1].value = username || "";
   exportPasswords[1].value = password || "";
   exportFileNames[1].value = "";
});

importTypes.on("input", debounce(getFiles, SEARCH_DELAY));
importUsernames.on("input", debounce(getFiles, SEARCH_DELAY));
importSearches.on("input", searchFile);

importButtons.click(async (_, i) => {
   const type = i === 1 ? importTypes[1].textContent : importTypes[i].value;
   if (IMPORT_SELECTED_FILE === null) {
      showAlertMessage("ERROR", "Please select a file");
      return;
   }

   await setLocalFile(type.toUpperCase(), IMPORT_SELECTED_FILE.file);

   showAlertMessage(
      "SUCCESS",
      `File <b>${IMPORT_SELECTED_FILE.name}</b> is imported successfully`,
      () => {
         importWindow.addClass("hide");
      }
   );
});

importButtonElement.click(async () => {
   const type = I(".options .btn input:checked")[0]?.dataset.name;
   if (!type) return;
   importWindow.removeClass("hide");
   importTypes[1].innerHTML = type.toUpperCase();

   const DATA = await chromeStorageGetLocal(KEYS.STORAGE_USER_LOGIN);
   let { username } = DATA;
   if (DATA) {
      importUsernames[1].value = username;
   } else {
      username = importUsernames[1].value.toLowerCase();
   }

   dbSearchFile({
      parent: importResults[1],
      username,
      type,
      index: 1,
   });
});
