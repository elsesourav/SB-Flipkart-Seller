"use strict";

const KEYS = {
   STORAGE_INIT: "SB_Seller_Init",
   STORAGE_MAPPING: "SB_Seller_Mapping",
   STORAGE_LISTING: "SB_Seller_Listing",
   STORAGE_PRODUCT: "SB_Seller_Product",
   STORAGE_REPLACE_LAN: "SB_Seller_Replace_Lan",
   STORAGE_SETTINGS: "SB_Seller_Settings",
   STORAGE_USER_LOGIN: "SB_Seller_UserLogin",
   STORAGE_FILTER_SKUS: "SB_Seller_FilterSkus",
   STORAGE_SELLER_LISTING: "SB_Seller_SellerListing",
   STORAGE_BRAND_NAME: "SB_Seller_BrandName",
   STORAGE_OPTION_SETTINGS: "SB_Seller_Options_Settings",
};

const URLS = {};

function setURLSUsingServer(server = "india") {
   let number = 1;
   if (server.toLocaleLowerCase() == "india") {
      number = 1;
   } else {
      number = 2;
   }

   URLS.singleListing =
      "https://seller.flipkart.com/index.html#dashboard/listings";
   URLS.singleAddListing =
      "https://seller.flipkart.com/index.html#dashboard/addListings";
   URLS.singleOrder =
      "https://seller.flipkart.com/index.html#dashboard/my-orders";
   URLS.flipkartSearch = "https://www.flipkart.com/search?q=";
   URLS.newListing =
      "https://seller.flipkart.com/index.html#dashboard/addListings/single?vertical=plant_seed";
   URLS.addMapping =
      "https://seller.flipkart.com/index.html#dashboard/listings/product/na?fsn=";
   URLS.flipkartSearchUrl = `https://${number}.rome.api.flipkart.com/api/4/page/fetch`;
   URLS.flipkartAPIMapping =
      "https://seller.flipkart.com/napi/listing/create-update-listings";
   URLS.flipkartSellerIndexPage = "https://seller.flipkart.com/index.html";
   URLS.flipkartFeaturesForSeller =
      "https://seller.flipkart.com/getFeaturesForSeller";
   URLS.listingsDataForStates =
      "https://seller.flipkart.com/napi/listing/listingsDataForStates";
   URLS.productSellers = `https://${number}.rome.api.flipkart.com/api/3/page/dynamic/product-sellers`;
   URLS.brandApproval =
      "https://seller.flipkart.com/napi/regulation/approvalStatus?";
   URLS.graphql = "https://seller.flipkart.com/napi/graphql";
}
setURLSUsingServer();

/* 
https://www.flipkart.com/search?q=cucumber+seeds&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&p%5B%5D=facets.brand%255B%255D%3DKANAYA&p%5B%5D=facets.brand%255B%255D%3Dibains


https://www.flipkart.com/search?q=cucumber+seeds&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&p[]=facets.brand[]=KANAYA&p[]=facets.brand[]=ibains

https://www.flipkart.com/search?q=cucumber%20seeds&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off

https://www.flipkart.com/search?q=
*/

const FLIPKART_SEARCH_HEADER = {
   accept: "*/*",
   "accept-language": "en-US,en;q=0.9",
   "content-type": "application/json",
   "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
   "x-user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop",
};

const MAX_IMAGE = 12;
let settings = {
   listingOpen: [],
   currentMode: 0,
};

let mappingData = {};
let listingData = { COUNT: 0 };
let ordersData = { editor: "", rowData: {} };
let PRODUCTS_DATA = {};
let REPLACE_LAN_DATA = {
   editorRow: `/*  Enter Product Name = new Name, example:\nLOTUS = পদ্ম,\nCUCUMBER = শসা,\t\t\t\t\t\t\t\t\t\t*/\n\n\n\n\n// this numbers replace with bengali numbers\n1=১, 2=২, 3=৩, 4=৪, 5=৫, 6=৬, 7=৭, 8=৮, 9=৯, 0=০,\n\n\n// others\nPIECE=পিস, KG=কেজি, G=গ্রাম, X=প্যাকেট`,
   editorJson: {},
};

function toBengaliNumber(number) {
   const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
   const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

   const numberString = number.toString();
   let bengaliNumber = "";
   for (let char of numberString) {
      const index = englishDigits.indexOf(char);
      if (index !== -1) {
         bengaliNumber += bengaliDigits[index];
      } else {
         bengaliNumber += char;
      }
   }

   return bengaliNumber;
}

/* ----  local storage set and get ---- */
function setDataFromLocalStorage(key, object) {
   let data = JSON.stringify(object);
   localStorage.setItem(key, data);
}

function getDataFromLocalStorage(key) {
   console.log(localStorage);

   return JSON.parse(localStorage.getItem(key));
}

function reloadLocation() {
   window.location.reload();
}

// create element
function CE(first, ...children) {
   let element;

   if (first instanceof Node) {
      element = document.createElement("div");
      element.appendChild(first);
   } else if (typeof first === "object" && first !== null) {
      const tag = first.tag || "div";
      element = document.createElement(tag);

      for (const [attr, value] of Object.entries(first)) {
         if (attr !== "tag") {
            element.setAttribute(attr, value);
         }
      }
   } else if (typeof first === "string" || typeof first === "number") {
      element = document.createElement("div");
      element.innerText = first;
   }

   children.forEach((child) => {
      if (typeof child === "string" || typeof child === "number") {
         element.innerText = child;
      } else if (child instanceof Node) {
         element.appendChild(child);
      }
   });

   element.parent = (parent) => {
      if (parent) {
         parent.appendChild(element);
         return element;
      }
   };

   return element;
}

const N = (string) => Number(string);

/* 
   ---Example 1: Create a simple <div> element and append it to the body
   const div = CE({});
   document.body.appendChild(div);

   ---Example 2: Create a <p> element with text content and append it to the body
   const p = CE({ tag: 'p' }, 'Hello, world!');
   document.body.appendChild(p); 

   ---Example 3: Create an <img> element with attributes and append it to the body
   const img = CE({ tag: 'img', src: 'image.jpg', alt: 'Image' });
   document.body.appendChild(img);

   ---Example 4: Create a <div> with a <span> child element and append it to the body
   const span = document.createElement('span');
   span.textContent = 'Child Element';
   const divWithChild = CE({ tag: 'div' }, span);
   document.body.appendChild(divWithChild); 
*/

function map(os, oe, ns, ne, t, isRound = true) {
   const r = (ne - ns) / (oe - os);
   let v = r * (t - os) + ns;
   v = Math.min(ne, Math.max(ns, v));
   return isRound ? Math.round(v) : v;
}

function setDataToLocalStorage(key, object) {
   let data = JSON.stringify(object);
   localStorage.setItem(key, data);
}
function getDataToLocalStorage(key) {
   return JSON.parse(localStorage.getItem(key));
}

function OBJECTtoJSON(data) {
   return JSON.stringify(data);
}
function JSONtoOBJECT(data) {
   return JSON.parse(data);
}

/* ----------- extension utils ----------- */
function getActiveTab() {
   return new Promise((resolve) => {
      chrome.tabs.query(
         {
            currentWindow: true,
            active: true,
         },
         (tabs) => {
            console.log(tabs);
            resolve(tabs[0]);
         }
      );
   });
}

function getFormatTime(t) {
   const date = new Date(0);
   date.setSeconds(t);
   return date.toISOString().substr(11, 8);
}

function runtimeSendMessage(type, message, callback) {
   if (typeof message === "function") {
      chrome.runtime.sendMessage({ type }, (response) => {
         message && message(response);
      });
   } else {
      chrome.runtime.sendMessage({ ...message, type }, (response) => {
         callback && callback(response);
      });
   }
}

function tabSendMessage(tabId, type, message, callback) {
   // if third parameter is not pass. in message parameter pass callback function
   if (typeof message === "function") {
      chrome.tabs.sendMessage(tabId, { type }, (response) => {
         message && message(response);
      });
   } else {
      chrome.tabs.sendMessage(tabId, { ...message, type }, (response) => {
         callback && callback(response);
      });
   }
}

function runtimeOnMessage(type, callback) {
   chrome.runtime.onMessage.addListener((message, sender, response) => {
      if (type === message.type) {
         callback(message, sender, response);
      }
      return true;
   });
}

const debounce = (func, delayFn) => {
   let debounceTimer;
   return function (...args) {
      const context = this;
      const delay = delayFn();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
   };
};

/**
 * @param {number} ms
 **/
function wait(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

function chromeStorageSet(key, value, callback) {
   return new Promise((resolve) => {
      let items = {};
      items[key] = value;
      chrome.storage.sync.set(items, function () {
         if (chrome.runtime.lastError) {
            console.error("Error setting item:", chrome.runtime.lastError);
         } else if (callback) {
            callback();
         }
         resolve();
      });
   });
}
// Example usage:
// chromeStorageSet("myKey", "myValue", function () {
//    console.log("Item set");
// });

function chromeStorageGet(key, callback = () => {}) {
   return new Promise((resolve) => {
      chrome.storage.sync.get([key], function (result) {
         if (chrome.runtime.lastError) {
            console.error("Error getting item:", chrome.runtime.lastError);
         } else if (callback) {
            callback(result[key]);
            resolve(result[key]);
         }
      });
   });
}

function setInputLikeHuman(element) {
   const event = new Event("change", { bubbles: true });
   element.dispatchEvent(event);
}

function chromeStorageSetLocal(key, value, callback) {
   const obj = JSON.stringify(value);

   chrome.storage.local.set({ [key]: obj }).then(() => {
      if (chrome.runtime.lastError) {
         console.error("Error setting item:", chrome.runtime.lastError);
      } else if (callback) {
         callback(true);
      } else {
         return true;
      }
   });
}

function chromeStorageGetLocal(key, callback) {
   return new Promise((resolve) => {
      chrome.storage.local.get([key]).then((result) => {
         if (chrome.runtime.lastError) {
            console.error("Error getting item:", chrome.runtime.lastError);
         } else {
            const OBJ =
               typeof result[key] === "string" ? JSON.parse(result[key]) : null;
            callback && callback(OBJ);
            resolve(OBJ);
         }
      });
   });
}

function chromeStorageRemoveLocal(key) {
   chrome.storage.local.remove(key).then(() => {
      if (chrome.runtime.lastError) {
         console.log("Error removing item:", chrome.runtime.lastError);
      }
   });
}

// imageURL:  e.g., "data:image/jpeg;base64,..."
function putImageIntoInputFile(fileInputElement, imageURL, fileType = "jpeg") {
   fetch(imageURL)
      .then((response) => response.blob())
      .then((blob) => {
         const imageFile = new File([blob], `image.${fileType}`, {
            type: `image/${fileType}`,
         });

         const dataTransfer = new DataTransfer();
         dataTransfer.items.add(imageFile);
         fileInputElement.files = dataTransfer.files;

         const event = new Event("change", { bubbles: true });
         fileInputElement.dispatchEvent(event);
      });
}

function DATE() {
   const date = new Date();
   const yy = date.getFullYear();
   const mm = date.getMonth() + 1;
   const dd = date.getDate();
   const hh = date.getHours();
   const ss = date.getMinutes();
   const ms = date.getSeconds();
   return { yy, mm, dd, hh, ss, ms };
}

function selectRandomImage(images) {
   if (images.length > 1) {
      const imgs = [...images].sort(() => Math.random() - 0.5);
      return imgs[Math.floor(Math.random() * imgs.length)];
   }
   return [];
}

function getSecondsForMonths(months) {
   // Average days in a month
   return Math.round(months * 60 * 60 * 30 * 24);
}

function dateToMilliseconds(dateString) {
   const date = new Date(dateString);
   return date.getTime();
}

function copyTextToClipboard(text) {
   const textarea = document.createElement("textarea");
   textarea.value = text;
   textarea.style.position = "fixed"; // Prevent scrolling to bottom
   document.body.appendChild(textarea);
   textarea.select();

   try {
      const successful = document.execCommand("copy");
      const msg = successful ? "successful" : "unsuccessful";
      console.log("Copying text " + msg);
      
      // Show toast notification if document.body exists
      if (document.body) {
         showToast(successful ? "Copied to clipboard!" : "Copy failed", successful ? "success" : "error");
      }
   } catch (err) {
      console.error("Unable to copy", err);
      // Show error toast if document.body exists
      if (document.body) {
         showToast("Unable to copy: " + err.message, "error");
      }
   }

   document.body.removeChild(textarea);
}

// Toast notification system
function showToast(message, type = "info", duration = 3000) {
   // Don't show toast if document.body doesn't exist
   if (!document.body) return;
   
   // Create toast container if it doesn't exist
   let toastContainer = document.getElementById("sb-toast-container");
   if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "sb-toast-container";
      toastContainer.style.cssText = `
         position: fixed;
         bottom: 20px;
         right: 20px;
         z-index: 9999;
         display: flex;
         flex-direction: column;
         align-items: flex-end;
      `;
      document.body.appendChild(toastContainer);
   }
   
   // Create toast element
   const toast = document.createElement("div");
   toast.className = "sb-toast sb-toast-" + type;
   toast.style.cssText = `
      min-width: 250px;
      margin-top: 10px;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
      animation: sb-toast-in 0.3s ease-out forwards;
      display: flex;
      align-items: center;
      justify-content: space-between;
      opacity: 0;
      transform: translateY(15px);
   `;
   
   // Set background color based on type
   switch (type) {
      case "success":
         toast.style.backgroundColor = "#4CAF50";
         toast.style.color = "white";
         break;
      case "error":
         toast.style.backgroundColor = "#F44336";
         toast.style.color = "white";
         break;
      case "warning":
         toast.style.backgroundColor = "#FF9800";
         toast.style.color = "white";
         break;
      default: // info
         toast.style.backgroundColor = "#2196F3";
         toast.style.color = "white";
   }
   
   // Add message
   toast.textContent = message;
   
   // Add close button
   const closeBtn = document.createElement("span");
   closeBtn.innerHTML = "&times;";
   closeBtn.style.cssText = `
      margin-left: 10px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
   `;
   closeBtn.addEventListener("click", () => {
      removeToast(toast);
   });
   toast.appendChild(closeBtn);
   
   // Add animation style if not already added
   if (!document.getElementById("sb-toast-style")) {
      const style = document.createElement("style");
      style.id = "sb-toast-style";
      style.textContent = `
         @keyframes sb-toast-in {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
         }
         @keyframes sb-toast-out {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-15px); }
         }
      `;
      document.head.appendChild(style);
   }
   
   // Add to container
   toastContainer.appendChild(toast);
   
   // Trigger animation
   setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
   }, 10);
   
   // Auto remove after duration
   setTimeout(() => {
      removeToast(toast);
   }, duration);
}

// Helper function to remove toast with animation
function removeToast(toast) {
   toast.style.animation = "sb-toast-out 0.3s ease-in forwards";
   setTimeout(() => {
      if (toast.parentNode) {
         toast.parentNode.removeChild(toast);
      }
      
      // Remove container if empty
      const container = document.getElementById("sb-toast-container");
      if (container && container.children.length === 0) {
         document.body.removeChild(container);
      }
   }, 300);
}


function splitStringByTag(str, isLowerCase = false) {
   const tagMatches = [...str.matchAll(/#\w+/g)];
   const tags = isLowerCase
      ? tagMatches.map((match) => match[0].toLowerCase())
      : tagMatches.map((match) => match[0]);
   const tagFlag = tags.length > 0;

   // Remove all hashtags from the string
   const content = str.replace(/#\w+/g, "").trim();

   return {
      tags,
      tag: tagFlag,
      content: content,
   };
}