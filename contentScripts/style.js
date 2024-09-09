const style = `
   .__fw__ {
      position: fixed;
      bottom: 10px;
      right: 10px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      z-index: 9999999;
   
      .__btn__ {
         position: relative;
         width: auto;
         height: auto;
         font-size: 25px;
         color: #fff;
         font-weight: bold;
         padding: 8px 20px;
         background: #000;
         border-radius: 5px;
         box-shadow: 0 3px 4px #000;
         transition: background 300ms, color 300ms;

         &:before {
            content: "";
            background: linear-gradient( 45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
            position: absolute;
            top: -2px;
            left: -2px;
            background-size: 400%;
            z-index: -1;
            filter: blur(5px);
            -webkit-filter: blur(5px);
            width: calc(100% + 4px);
            height: calc(100% + 4px);
            animation: glowing-button 20s linear infinite;
            transition: opacity 0.3s ease-in-out;
            border-radius: 10px;
         }

         &:after {
            z-index: -1;
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            background: #222;
            left: 0;
            top: 0;
            border-radius: 10px;
         }

         &:hover {
            background: #fff;
            color: #000;
         }
         
         &.__1__ {
            

            &:hover {
            
            }
         }
      }
   }

   #__flipkartFW__ {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      overflow-y: auto;
      background: #fff;
      z-index: 1000;
   }

   @keyframes glowing-button {
   0% {
      background-position: 0 0;
   }
   50% {
      background-position: 400% 0;
   }
   100% {
      background-position: 0 0;
   }
}
`;

function setStyle() {
   const styleEl = document.createElement("style");
   styleEl.textContent = style;
   document.head.appendChild(styleEl);
}
