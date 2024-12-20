class FormHTML {
   constructor() {
      this.parent = document.body;

      this.box = this.ce({ cls: "_-_f-box", parent: this.parent });
      /**/ this.inner = this.ce({ cls: "_-_f-inner", parent: this.box });

      /**/ this.title = this.ce({ cls: "_-_f-title", parent: this.inner });
      /**/ this.titleEle = this.ce({
         tag: "p",
         html: "Enter Password",
         parent: this.title,
      });

      /**/ this.form = this.ce({ cls: "_-_f-form", parent: this.inner });

      /**/ this.outer = this.ce({
         cls: "_-_f-outer",
         parent: this.form,
      })
      /**/ this.input = this.ce({
         tag: "input",
         type: "password",
         placeholder: "Enter Password",
         parent: this.outer,
      });
      /**/ this.button = this.ce({
         cls: "_-_f-btn",
         parent: this.form,
      });
      /**/ this.buttonEle = this.ce({
         tag: "p",
         html: "Continue",
         parent: this.button,
      });

      this.styleElement = this.ce({
         tag: "style",
         html: this.#css(),
         parent: document.head,
      }); // Apply all css --------------
   }

   //{ tag, parent, cls, id, text, html, css }
   ce({ tag = "div", parent = document.body, cls, id, text, html, css, type, placeholder }) {
      const element = document.createElement(tag);
      if (cls)
         cls.split(" ").forEach((c) => {
            element.classList.add(c);
         });

      if (id) element.setAttribute("id", id);
      if (text) element.innerText = text;
      if (html) element.innerHTML = html;
      if (css) element.style = css;
      if (type) element.type = type;
      if (placeholder) element.placeholder = placeholder;
      parent.appendChild(element);
      return element;
   }

   #css() {
      return `
      :root {
         --_-_f-width: 290px;
         --_-_f-title-height: 40px;
         --_-_f-button-height: 45px;
      }
      ._-_f-box {
         position: fixed;
         inset: 0;
         display: flex;
         transform: scale(0);
         opacity: 0;
         justify-content: center;
         align-items: center;
         background: rgba(0, 0, 0, 0.3);
         backdrop-filter: blur(7px);
         -webkit-backdrop-filter: blur(7px);
         font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
         transition: 0s;
         transition-delay: 0.2s;
         z-index: 99;
      }
      ._-_f-box.active {
         transition: 0s;
         opacity: 1;
         transform: scale(1);
      }
      ._-_f-box * {
         font-family: f1b;
         font-size: 1.6rem;
         margin: 0;
         padding: 0;
         box-sizing: border-box;
         user-select: none;
      }
      ._-_f-box ._-_f-inner {
         position: relative;
         width: var(--_-_f-width);
         height: auto;
         display: grid;
         grid-template-rows: 1fr 4fr;
         transform: scale(0);
         border-radius: 10px;
         border: solid 0.2rem #0a0076cc;
         transition: 0.2s linear;
         overflow: hidden;
      }
      ._-_f-box.active ._-_f-inner {
         transform: scale(1);
      }
      ._-_f-box ._-_f-inner ._-_f-title {
         display: flex;
         width: 100%;
         height: 100%;
         display: flex;
         gap: 0.5rem;
         justify-content: center;
         align-items: center;
         background: radial-gradient(circle, #0d0098 0%, #03001f 100%);
      }
      ._-_f-box ._-_f-inner ._-_f-title p {
         font-size: 1.5rem;
         color: #fff;
         font-family: f2b;
      }
      ._-_f-box ._-_f-inner ._-_f-form {
         position: relative;
         background: radial-gradient(circle, #0d0098 0%, #03001f 100%);
         display: grid;
         grid-template-rows: 2fr 1fr;
         place-items: center;
      }
      ._-_f-box ._-_f-inner ._-_f-form input {
         width: 100%;
         height: 100%;
         padding: 0.5rem;
         font-size: 1.2rem;
         border: none;
         outline: solid 1px #fff5;
         color: #fff;
         background: #000;
         border-radius: 9px;
         transition: outline 200ms;
      }
      ._-_f-box ._-_f-inner ._-_f-form input:focus-within {
         outline: solid 1px #fff;
      }
      ._-_f-box ._-_f-inner ._-_f-form ._-_f-btn {
         --h: 2px;
         position: relative;
         width: 100%;
         padding: 10px;
         margin: calc(var(--h) * 2);
         margin-right: calc(var(--h) / 2);
         display: grid;
         place-items: center;
         border-radius: 7px;
         background: rgba(255, 255, 255, 0.3);
         color: #fff;
         text-shadow: 0 0 1px #000;
         cursor: pointer;
         z-index: 1;
         overflow: hidden;
      }
      ._-_f-box ._-_f-inner ._-_f-form ._-_f-btn p {
         font-size: 1.6rem;
      }
      ._-_f-box ._-_f-inner ._-_f-form ._-_f-btn::before {
         position: absolute;
         content: "";
         width: 100%;
         height: 100%;
         z-index: -1;
      
         background-repeat: no-repeat;
         background-position: -150px -150px, 0 0;
      
         background-image: -webkit-linear-gradient(
            top left,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.2) 37%,
            rgba(255, 255, 255, 0.8) 45%,
            rgba(255, 255, 255, 0) 50%
         );
         background-image: -moz-linear-gradient(
            0 0,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.2) 37%,
            rgba(255, 255, 255, 0.8) 45%,
            rgba(255, 255, 255, 0) 50%
         );
         background-image: -o-linear-gradient(
            0 0,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.2) 37%,
            rgba(255, 255, 255, 0.8) 45%,
            rgba(255, 255, 255, 0) 50%
         );
         background-image: linear-gradient(
            0 0,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.2) 37%,
            rgba(255, 255, 255, 0.8) 45%,
            rgba(255, 255, 255, 0) 50%
         );
      
         -moz-background-size: 250% 250%, 100% 100%;
         background-size: 250% 250%, 100% 100%;
      
         -webkit-transition: background-position 0s ease;
         -moz-transition: background-position 0s ease;
         -o-transition: background-position 0s ease;
         transition: background-position 0s ease;
      }
      ._-_f-box ._-_f-inner ._-_f-form ._-_f-btn:hover::before {
         background-position: 0 0, 0 0;
         -webkit-transition-duration: 0.5s;
         -moz-transition-duration: 0.5s;
         transition-duration: 0.5s;
      }
      ._-_f-box ._-_f-inner ._-_f-form ._-_f-btn i {
         position: relative;
         width: 100%;
         height: 100%;
      }      
       `;
   }

   show() {
      this.box.classList.add("active");
   }
   hide() {
      this.box.classList.remove("active");
      setTimeout(() => {
         this.parent.removeChild(this.box);
      }, 500);
   }

   clickOutside(fun) {
      this.box.addEventListener("click", (e) => {
         fun(e, this.input);
      });
   }

   inputOnchange(fun) {
      this.input.addEventListener("change", (e) => {
         fun(e, this.input);
      });
   }

   buttonClick(fun) {
      this.button.addEventListener("click", (e) => {
         fun(e, this.input);
      });
   }
}
