(() => {
   HTMLElement.prototype.on = function (event, fun) {
      this.addEventListener(event, (ev) => fun(ev, this));
      return this;
   };
   HTMLElement.prototype.click = function (fun) {
      if (typeof fun === "function") {
         this.addEventListener("click", (ev) => fun(ev, this));
      } else {
         const event = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
         });
         this.dispatchEvent(event);
      }
      return this;
   };
   HTMLElement.prototype.addClass = function (className) {
      this.classList.add(className);
      return this;
   };
   HTMLElement.prototype.removeClass = function (className) {
      this.classList.remove(className);
      return this;
   };
   HTMLElement.prototype.toggleClass = function (className, is) {
      this.classList.toggle(className, is);
      return this;
   };
   HTMLElement.prototype.toggle = function (className, is) {
      this.classList.toggle(className, is);
      return this;
   };
   HTMLElement.prototype.html = function (html) {
      if (html !== undefined) {
         this.innerHTML = html;
         return this;
      } else {
         return this.innerHTML;
      }
   };
   HTMLElement.prototype.text = function (text) {
      if (text !== undefined) {
         this.textContent = text;
         return this;
      } else {
         return this.textContent;
      }
   };
   HTMLElement.prototype.attr = function (name, value) {
      if (value !== undefined) {
         this.setAttribute(name, value);
         return this;
      } else {
         return this.getAttribute(name);
      }
   };
   HTMLElement.prototype.css = function (property, value) {
      if (value !== undefined) {
         this.style[property] = value;
         return this;
      } else {
         return getComputedStyle(this)[property];
      }
   };
   NodeList.prototype.each = function (fun) {
      this.forEach((element, i) => fun(element, i));
      return this;
   };
   NodeList.prototype.on = function (event, fun) {
      this.forEach((element, i) =>
         element.on(event, (ev) => fun(ev, i, element))
      );
      return this;
   };
   NodeList.prototype.click = function (fun) {
      this.forEach((element, i) => element.click((ev) => fun(ev, i, element)));
      return this;
   };
   NodeList.prototype.addClass = function (className) {
      this.forEach((element) => element.addClass(className));
      return this;
   };
   NodeList.prototype.removeClass = function (className) {
      this.forEach((element) => element.removeClass(className));
      return this;
   };
   NodeList.prototype.toggleClass = function (className) {
      this.forEach((element) => element.toggleClass(className));
      return this;
   };
   NodeList.prototype.toggle = function (className, is) {
      this.forEach((element) => {
         element.click((_, ele) => {
            ele.classList.toggle(className, is);
         });
      });
      return this;
   };
   NodeList.prototype.html = function (html) {
      if (html !== undefined) {
         this.forEach((element) => element.html(html));
         return this;
      } else {
         return this.length > 0 ? this[0].html() : null;
      }
   };
   NodeList.prototype.text = function (text) {
      if (text !== undefined) {
         this.forEach((element) => element.text(text));
         return this;
      } else {
         return this.length > 0 ? this[0].text() : null;
      }
   };
   NodeList.prototype.attr = function (name, value) {
      if (value !== undefined) {
         this.forEach((element) => element.attr(name, value));
         return this;
      } else {
         return this.length > 0 ? this[0].attr(name) : null;
      }
   };
   NodeList.prototype.css = function (property, value) {
      if (value !== undefined) {
         this.forEach((element) => element.css(property, value));
         return this;
      } else {
         return this.length > 0 ? this[0].css(property) : null;
      }
   };
   NodeList.prototype.values = function (value) {
      if (value !== undefined) {
         this.forEach((element) => element.value(value));
         return this;
      } else {
         return this.length > 0 ? this[0].value : null;
      }
   };
   function addNodeListProperty(property) {
      Object.defineProperty(NodeList.prototype, property, {
         get: function () {
            return this.length > 0 ? this[0][property] : undefined;
         },
      });
   }

   Object.defineProperty(NodeList.prototype, "width", {
      get: function () {
         return this.length > 0 ? this[0].clientWidth : undefined;
      },
   });
   Object.defineProperty(NodeList.prototype, "height", {
      get: function () {
         return this.length > 0 ? this[0].clientHeight : undefined;
      },
   });

   // Add desired properties
   const properties = [
      "value",
      "style",
      "checked",
      "classList",
      "innerHTML",
      "innerText",
      "clientHeight",
      "clientWidth",
      "clientTop",
      "clientLeft",
      "offsetHeight",
      "offsetWidth",
      "offsetTop",
      "offsetLeft",
      "parentElement",
      "parentNode",
      "oninput",
      "onchange",
      "onload",
      "onscroll",
      "scrollHeight",
      "scrollWidth",
      "scrollTop",
      "scrollLeft",
   ];
   properties.forEach((property) => addNodeListProperty(property));
})();

/**
 * A utility function for selecting and manipulating DOM elements.
 * @param {string} selector - The CSS selector to match elements.
 * @param {HTMLElement} [parent=document] - The parent element to search within. Defaults to the document.
 * @returns {NodeListOf<HTMLElement>} - A NodeList of matched elements.
 */
const I = (selector, parent = document) => parent.querySelectorAll(selector);
const ID = (selector, parent = document) => parent.getElementById(selector);