// ce --> create Element
class AlertHTML {
   constructor({
      windowWidth = window.innerWidth,
      titleIcon,
      windowHeight = window.innerHeight,
      width = 290,
      titleHeight = 40,
      buttonHeight = 45,
      title,
      message,
      btnNm1 = "No",
      btnNm2 = "Yes",
      btnNm1Color = "#1eff00",
      btnNm2Color = "#ff0000",
      titleColor = "#ff0000",
      parent = document.body,
      oneBtn = false,
   }) {
      this.windowWidth = windowWidth;
      this.windowHeight = windowHeight;
      this.width = width;
      this.titleHeight = titleHeight;
      this.buttonHeight = buttonHeight;
      this.titleText = title;
      this.titleIcon = titleIcon;
      this.messageText = message;
      this.btnNm1 = btnNm1;
      this.btnNm2 = btnNm2;
      this.parent = parent;
      this.oneBtn = oneBtn;
      this.btnNm1Color = btnNm1Color;
      this.btnNm2Color = btnNm2Color;
      this.titleColor = titleColor;


      // element
      this.msgEle = undefined;
      this.btn1Ele = undefined;
      this.btn2Ele = undefined;

      this.#createHtml(); //  Create Html -----------

      this.styleElement = this.ce({
         tag: "style",
         html: this.#css(),
         parent: document.head,
      }); // Apply all css --------------
   }

   //{ tag, parent, cls, id, text, html, css }
   ce({ tag = "div", parent = document.body, cls, id, text, html, css }) {
      const element = document.createElement(tag);
      if (cls)
         cls.split(" ").forEach((c) => {
            element.classList.add(c);
         });

      if (id) element.setAttribute("id", id);
      if (text) element.innerText = text;
      if (html) element.innerHTML = html;
      if (css) element.style = css;
      parent.appendChild(element);
      return element;
   }

   #createHtml() {
      const { ce } = this;

      this.box = ce({ cls: "_-_a-box", parent: this.parent });
      /**/ this.inner = ce({ cls: "_-_a-inner", parent: this.box });

      /**/ this.title = ce({ cls: "_-_a-title", parent: this.inner });
      /**/ ce({
         tag: "i",
         cls: this.titleIcon || "sbi-notification",
         parent: this.title,
      });
      /**/ ce({ tag: "p", html: this.titleText, parent: this.title });

      /**/ this.message = ce({ cls: "_-_a-message", parent: this.inner });
      /**/ this.msgEle = ce({
         tag: "p",
         cls: "_-_a-msg",
         html: this.messageText,
         parent: this.message,
      });

      /**/ this.buttons = ce({ cls: "_-_a-buttons", parent: this.inner });
      /**/ this.button1 = ce({ cls: "_-_a-btn", parent: this.buttons });
      if (!this.oneBtn)
         this.button2 = ce({
            cls: "_-_a-btn _-_a-b-last",
            parent: this.buttons,
         });
      /**/ this.btn1Ele = ce({
         tag: "p",
         html: this.btnNm1,
         parent: this.button1,
      });
      /**/ if (!this.oneBtn)
         this.btn2Ele = ce({
            tag: "p",
            html: this.btnNm2,
            parent: this.button2,
         });
   }

   #css() {
      const isMobile =
         localStorage.mobile || window.navigator.maxTouchPoints > 1;
      return `
      :root {
         --_-_a-width: ${this.width}px;
         --_-_a-title-height: ${this.titleHeight}px;
         --_-_a-button-height: ${this.buttonHeight}px;
         --_-_cursor: ${isMobile ? "auto" : "pointer"};
         --_-_s: 10px;
      }
      ._-_a-box {
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
         z-index: 100;
      }
      ._-_a-box.active {
         transition: 0s;
         opacity: 1;
         transform: scale(1);
      }
      ._-_a-box * {
         font-family: f1b;
         font-size: calc(var(--_-_s) * 1.6);
         margin: 0;
         padding: 0;
         box-sizing: border-box;
         user-select: none;
      }
      ._-_a-box ._-_a-inner {
         position: relative;
         width: var(--_-_a-width);
         height: auto;
         display: grid;
         grid-template-rows: var(--_-_a-title-height) auto var(--_-_a-button-height);
         transform: scale(0);
         border-radius: 10px;
         border: solid calc(var(--_-_s) * 0.2) #0a0076cc;
         transition: 0.2s linear;
         overflow: hidden;
      }
      ._-_a-box.active ._-_a-inner {
         transform: scale(1);
      }
      ._-_a-box ._-_a-inner ._-_a-title {
         display: flex;
         width: 100%;
         height: 100%;
         display: flex;
         gap: calc(var(--_-_s) * 0.5);
         justify-content: center;
         align-items: center;
         background: radial-gradient(circle, #0d0098 0%, #03001f 100%);
      }
      ._-_a-box ._-_a-inner ._-_a-title i {
         font-size: calc(var(--_-_s) * 2);
         color: ${this.titleColor};
      }
      ._-_a-box ._-_a-inner ._-_a-title p {
         font-size: calc(var(--_-_s) * 2);
         color: #fff;
         font-family: f2b;
      }
      ._-_a-box ._-_a-inner ._-_a-message {
         position: relative;
         background: radial-gradient(circle, #0d0098 0%, #03001f 100%);
         padding: calc(var(--_-_s) * 2);
         text-align: center;
      }
      ._-_a-box ._-_a-inner ._-_a-message ._-_a-msg {
         color: #fff;
         font-family: f8 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;;
         font-size: calc(var(--_-_s) * 2);
      }
      ._-_a-box ._-_a-inner ._-_a-buttons {
         position: relative;
         width: 100%;
         height: 100%;
         display: flex;
         grid-template-columns: 10fr 0fr 10fr;
         place-items: center;
         overflow: hidden;
      }
      ._-_a-box ._-_a-inner ._-_a-buttons ._-_a-btn {
         --h: 2px;
         position: relative;
         width: calc(100% - var(--h) * 1.5);
         height: calc(100% - var(--h) * 2);
         margin: calc(var(--h) * 2);
         margin-right: calc(var(--h) / 2);
         display: grid;
         place-items: center;
         border-radius: 7px;
         background: rgba(255, 255, 255, 0.3);
         color: ${this.btnNm1Color};
         text-shadow: 0 0 1px #000;
         cursor: var(--_-_cursor);
         z-index: 1;
         overflow: hidden;
      }
      ._-_a-box ._-_a-inner ._-_a-buttons ._-_a-btn._-_a-b-last {
         color: ${this.btnNm2Color};
         margin: var(--h);
         margin-left: calc(var(--h) / 2);
      }
      ._-_a-box ._-_a-inner ._-_a-buttons ._-_a-btn::before {
         position: absolute;
         content: "";
         width: 100%;
         height: 100%;
         z-index: -1;
      
         background-repeat: no-repeat;
         background-position: -120px -120px, 0 0;
      
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
      ._-_a-box ._-_a-inner ._-_a-buttons ._-_a-btn:hover::before {
         background-position: 0 0, 0 0;
         -webkit-transition-duration: 0.5s;
         -moz-transition-duration: 0.5s;
         transition-duration: 0.5s;
      }
      ._-_a-box ._-_a-inner ._-_a-buttons ._-_a-btn i {
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

   clickBtn1(fun) {
      this.button1.addEventListener("click", () => {
         fun();
      });
   }

   clickBtn2(fun) {
      this.button2.addEventListener("click", () => {
         fun();
      });
   }

   clickOutside(fun) {
      this.box.addEventListener("click", () => {
         fun();
      });
   }

   setMassage(massage) {
      this.msgEle.innerHTML = massage;
   }

   button1SetName(name) {
      this.btn1Ele.innerHTML = name;
   }

   button2SetName(name) {
      this.btn2Ele.innerHTML = name;
   }
}

//{windowWidth,windowHeight,width,titleHeight,buttonHeight,title,message,btnNm1,btnNm2,parent}

// const a = new AlertHTML({
//     title: "This is title",
//     message: "Your message hear Please read this message carefully sourav barui",
//     btnNm1: "No",
//     btnNm2: "Yes",
//     titleHeight: 60,
//     buttonHeight: 45,
//     width: 290,
//     windowWidth: window.innerWidth,
//     windowHeight: window.innerHeight,

// });

// a.clickOutside(() => {
//     console.log("outside");
// })
// a.clickBtn1(() => {
//     a.hide()
// })
// a.clickBtn2(() => {
//     a.hide()
// })
