/* -------------------------------------------------- 
               Fetches form Firebase 
-------------------------------------------------- */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function verifyUser(username, password) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({
               message: "User not found",
               status: "NO_USER",
            });
         }
         const { password: dbPassword } = snapshot.val();

         if (dbPassword !== password) {
            return resolve({
               message: "Invalid password",
               status: "INVALID_PASSWORD",
            });
         }

         resolve({ message: "User Successfully Logged In", status: "SUCCESS" });
      } catch (error) {
         return resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function createUser(username, password) {
   return new Promise(async (resolve) => {
      try {
         // first check if user exists
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (snapshot.exists()) {
            return resolve({
               message: "User already exists",
               status: "User Exists",
            });
         }

         await dbRef.set({
            id: `ES-${Date.now().toString(36).toUpperCase()}`,
            username,
            password,
         });
         resolve({ message: "User created successfully", status: "SUCCESS" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "Error" });
      }
   });
}

function exportFile(
   username,
   fileType,
   filename,
   data,
   password,
   isUpdate,
   name
) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({ message: "User not found", status: "NO_USER" });
         }

         const userData = snapshot.val();
         if (userData.password !== password) {
            return resolve({
               message: "Incorrect password",
               status: "INCORRECT_PASSWORD",
            });
         }

         const { yy, mm, dd, hh, ss, ms } = DATE();
         const refName = isUpdate
            ? name
            : `${filename}-${dd}-${mm}-${yy}--${hh}:${ss}:${ms}`;
         const fileRef = dbRef.child(`${fileType.toLowerCase()}/${refName}`);

         if (isUpdate) {
            await fileRef.update({
               data,
               date: `${dd}-${mm}-${yy} | ${hh}:${ss}`,
            });
            return resolve({
               message: "File updated successfully",
               status: "SUCCESS",
            });
         }

         await fileRef.set({
            id: Date.now().toString(36).toUpperCase(),
            filename,
            filenameLower: filename.toLowerCase(),
            fileType,
            data,
            date: `${dd}-${mm}-${yy} | ${hh}:${ss}`,
         });
         resolve({ message: "File exported successfully", status: "SUCCESS" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function importFile(username, fileType, filename) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}/${fileType}/${filename}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({ message: "File not found", status: "NO_FILE" });
         }

         const data = snapshot.val();
         resolve({ message: "File imported successfully", status: "ok", data });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function deleteFile(username, fileType, filename, password) {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}`);
         const snapshot = await dbRef.once("value");
         if (!snapshot.exists()) {
            return resolve({ message: "User not found", status: "NO USER" });
         }

         const userData = snapshot.val();
         if (userData.password !== password) {
            return resolve({
               message: "Incorrect password please check and try again",
               status: "INCORRECT PASSWORD",
            });
         }

         const fileRef = dbRef.child(`${fileType}/${filename}`);
         await fileRef.remove();
         resolve({ message: "File deleted successfully", status: "SUCCESS" });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR" });
      }
   });
}

function getFiles(username, fileType, search = "") {
   return new Promise(async (resolve) => {
      try {
         const dbRef = db.ref(`users/${username}/${fileType}`);
         const query = dbRef
            .orderByChild("filenameLower")
            .startAt(search)
            .endAt(search + "\uf8ff");

         const snapshot = await query.once("value");
         if (!snapshot.exists()) {
            return resolve({
               message: "User not found",
               status: "NO_USER",
               data: [],
            });
         }

         const files = snapshot.val() || {};
         const filesArray = Object.entries(files);

         resolve({
            message: "Files fetched successfully",
            status: "ok",
            data: filesArray,
         });
      } catch (error) {
         console.log(error);
         resolve({ message: error.message, status: "ERROR", data: [] });
      }
   });
}