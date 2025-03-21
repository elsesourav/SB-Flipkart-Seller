const style = `
   .__fw__ {
      position: fixed;
      top: 6px;
      right: 0;
      width: 100%;
      height: 40px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      z-index: 9999999;
      pointer-events: none;

      .__btn__ {
         position: relative;
         width: auto;
         height: auto;
         font-weight: bold;
         font-size: 20px;
         padding: 8px 20px;
         background: #fff;
         box-shadow: 0 2px 2px #000;
         border-radius: 10px;
         border: 1px solid #000;
         pointer-events: all;
         overflow: hidden;
         
         
         &:before {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient( 45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
            background-size: 400%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            text-fill-color: transparent;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: inherit;
            transition: background 300ms, color 300ms;
            animation: glowing-button 20s linear infinite;
            animation-delay: var(--delay);
            z-index: 1;
         }

         &:hover::before {
            background: linear-gradient( 45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
            background-size: 400%;
            animation: glowing-button 20s linear infinite;
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
            -webkit-text-fill-color: #fff;
            text-fill-color: #fff;
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

const tableStyle = `
   #_orders_table {
      margin: 0;
      position: fixed;
      box-sizing: border-box;
      width: 100svw;
      height: 100svh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000b;
      backdrop-filter: blur(2px);
      overflow: hidden;
      z-index: 100;
   }
   ._-table-cover {
      position: relative;
      width: 800px;
      max-height: calc(100% - 120px);
      display: flex;
      justify-content: center;
      background: #dddddd;
      border-radius: 10px;
      box-shadow: 0 0 10px #000;
      padding: 10px;
      overflow-y: scroll;
      overflow-x: hidden;
      
      ._-table {
         position: relative;
         box-sizing: border-box;
         width: 100%;
         height: 100%;
         margin: 5px;
         display: grid;
         grid-template-columns: 1fr 1fr;
         gap: 10px;
         color: #000
      }

      ._-row {
         position: relative;
         width: 100%;
         padding: 6px;
         border-bottom: 3px double #000;
         border-radius: 8px;
         background: #eeeeee;
         
         &:nth-child(4n + 1),
         &:nth-child(4n) {
            background: #ffffff;
         }
      }

      ._-cell {
         width: 100%;
         position: relative;
         padding: 8px;
         opacity: 1;
         transition: opacity 300ms;
         
         ._-multi {
            color: #ff7600;
         }
      }

      ._-row ._-checkbox {
         position: absolute;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         display: flex;
         justify-content: center;
         align-items: center;
         font-size: 1.2em;
         font-weight: bold;
         cursor: pointer;
         opacity: 0;
         z-index: 2;

         &:checked ~ ._-cell {
            opacity: 0.1;

            &._-header {
               background: transparent;
            }
         }
      }

      ._-header {
         width: 100%;
         border-radius: 10px;
         border: 1px dashed #000;
         font-weight: bold;
         background: #00f9ff8a;
         text-shadow: 1px 1px 0 #fff;
      }

      ._-seed-type {
         font-weight: bold;
         background-color: #f8f8f8;
      }
   }
`;

function setStyle(forTable = false) {
   const styleEl = document.createElement("style");
   styleEl.textContent = forTable ? tableStyle : style;
   document.head.appendChild(styleEl);
}
