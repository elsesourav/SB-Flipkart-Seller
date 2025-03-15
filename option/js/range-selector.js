class MyRange extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.isDragging = false;
        this.start = null;
        this.end = null;
        this.isFirstClick = true;
        this.holdTimer = null;
        this.holdDuration = 200; // 200ms hold threshold
        this.renderAttr = ["base", "bg", "radius", "size", "fontsize", "padding", "gap", "color", "width"];
    }

    static get observedAttributes() {
        return ["columns", "total", "selectedstart", "selectedend", "theme", "base", "bg", "radius", "size", "fontsize", "padding", "start", "step", "color", "gap", "width"];
    }

    connectedCallback() {
        this.render();
        this.setupRangeSelector();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (this.renderAttr.some(e => e == name)) {
               this.render();
            }
            this.setupRangeSelector();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    margin: 0 auto;
                }

                .range-grid {
                    position: relative;
                    padding: var(--padding);
                    border-radius: var(--point-radius);
                    display: grid;
                    background-color: var(--bg-color);
                    row-gap: var(--gap);
                    overflow: hidden;
                    width: 100%;
                }

                ${this.getStyles()}
            </style>
            <div class="range-grid" id="rangeGrid"></div>
        `;
    }

    getStyles() {
        const base = this.getAttribute("base") || "#007aff";
        const bg = this.getAttribute("bg");
        const radius = this.getAttribute("radius") || "8px";
        const size = this.getAttribute("size") || "45px";
        const color = this.getAttribute("color");
        const fontsize = this.getAttribute("fontsize") || "16px";
        const padding = this.getAttribute("padding") || "16px";
        const gap = this.getAttribute("gap") || "8px";
        const width = this.getAttribute("width");

        return `
            :host {
                --point-radius: ${radius};
                --size: ${size};
                --gap: ${gap};
                --padding: ${padding};
                --base-color: ${base};
                --s-text: ${color || "#000000"};
                --color: ${"rgb(from var(--s-text) r g b / 0.8)" || "#333333"};
                --bg: ${bg || "#ececec"};
                --bg-color: var(--bg);
                --text-color: var(--color);
                --point-hover: rgb(from var(--bg) r g b / 0.2);
                --selected-bg: var(--base-color);
                --selected-text: var(--s-text);
                --range-bg: rgb(from var(--selected-bg) r g b / 0.4);
                --font-size: ${fontsize};
                color: var(--color);
            }

            :host([data-theme="dark"]) {
               --bg: ${bg || "#1c1c1e"};
               --s-text: ${color || "#ffffff"};
               --color: ${"rgb(from var(--s-text) r g b / 0.8)" || "#cccccc"};
               --bg-color: var(--bg);
               --text-color: var(--color);
               --point-hover: rgb(from var(--bg) r g b / 0.2);
               --selected-bg: var(--base-color);
               --selected-text: var(--s-text);
               --range-bg: rgb(from var(--selected-bg) r g b / 0.4);
            }

            * {
               margin: 0;
               padding: 0;
               box-sizing: border-box;
            }

            .point {
                position: relative;
                width: 100%;
                height: var(--size);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--point-radius);
                font-size: var(--font-size);
                cursor: pointer;
                background: transparent;
                transition: all 200ms ease;
                user-select: none;
                color: var(--color);
                transform: scale(1);
                z-index: 3;

            }

            .point:not(.selected, .in-range) {
                width: calc(100% - 1px);
                height: calc(var(--size) - 1px);
                margin: 1px;
                border: 1px solid rgb(from var(--base-color) r g b / 0.4);}
            }

            .point:hover {
                transform: scale(1.02);
                border: none;
            }

            .point::after {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: inherit;
                background: transparent;
                transition: all 200ms ease;
                z-index: 2;
            }
                
            .point:hover::after {
                background: var(--point-hover);
            }

            .point.selected {
                position: relative;
                background: var(--selected-bg) !important;
                color: var(--selected-text) !important;
                transform: scale(1.05);
                font-weight: 500;
                box-shadow: 0 2px 6px #00000033;
                z-index: 3;
            }

            .in-range {
                background: var(--range-bg) !important;
                border-radius: 0 !important;
            }

            .in-range[data-column-position="first"] {
                border-top-left-radius: var(--point-radius) !important;
                border-bottom-left-radius: var(--point-radius) !important;
            }

            .in-range[data-column-position="last"] {
                border-top-right-radius: var(--point-radius) !important;
                border-bottom-right-radius: var(--point-radius) !important;
            }
                
            .range-start::before,
            .range-end::before {
                content: "";
                position: absolute;
                inset: 0;
                background: var(--range-bg);
                border-radius: var(--point-radius);
                z-index: -2;
                transform: scale(0.95);
                transition: background-color 0.3s ease, border-radius 0.3s ease;
            }

            .range-start::before {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }

            .range-end::before {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
            }
        `;
    }

    setupRangeSelector() {
        const columns = parseInt(this.getAttribute("columns")) || 7;
        const total = parseInt(this.getAttribute("total")) || 30;
        const start = parseInt(this.getAttribute("start")) || 1;
        const selectedstart = parseInt(this.getAttribute("selectedstart"));
        const selectedend = parseInt(this.getAttribute("selectedend"));
        const width = this.getAttribute("width");
    
        // Ensure selected values are within valid range based on start value
        if (!isNaN(selectedstart) && !isNaN(selectedend)) {
            const adjustedStart = Math.max(start, selectedstart);
            const adjustedEnd = Math.min(total, Math.max(adjustedStart, selectedend));
            
            if (adjustedStart !== selectedstart) {
                this.setAttribute("selectedstart", adjustedStart);
            }
            if (adjustedEnd !== selectedend) {
                this.setAttribute("selectedend", adjustedEnd);
            }
            
            this.start = adjustedStart;
            this.end = adjustedEnd;
        }
    
        // Ensure rangeGrid element exists
        const rangeGrid = this.shadowRoot?.getElementById("rangeGrid");
        if (!rangeGrid) {
            this.render();
            return;
        }

        const w = width ? width : `calc(var(--size) * ${columns} + var(--padding) * 2)`;

        rangeGrid.innerHTML = "";
        rangeGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        rangeGrid.style.width = w;
        rangeGrid.style.setProperty("--columns", columns);

        this.createGrid();
        this.setupTheme();
        this.updateSelection();
    }

    createGrid() {
        const total = parseInt(this.getAttribute("total")) || 30;
        const start = parseInt(this.getAttribute("start")) || 1;
        const step = parseFloat(this.getAttribute("step")) || 1;
        const color = this.getAttribute("color") || "inherit";
        const rangeGrid = this.shadowRoot.getElementById("rangeGrid");

        for (let i = 0; i < total; i++) {
            const value = start + i;
            const point = document.createElement("div");
            point.className = "point";
            const contextValue = step % 1 === 0 ? value * step : parseFloat((value * step).toFixed(1));
            point.textContent = contextValue;
            point.dataset.value = value;
            point.style.color = color;

            point.addEventListener("mousedown", this.handleStart.bind(this));
            point.addEventListener("mouseenter", this.handleMove.bind(this));
            point.addEventListener("mouseup", () => {
                if (this.holdTimer) {
                    clearTimeout(this.holdTimer);
                }
                this.isDragging = false;
            });
            point.addEventListener("touchstart", (e) => {
                e.preventDefault();
                this.handleStart(e.touches[0]);
            });
            point.addEventListener("touchmove", (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.classList.contains("point")) {
                    this.handleMove({ target });
                }
            });
            point.addEventListener("touchend", () => {
                if (this.holdTimer) {
                    clearTimeout(this.holdTimer);
                }
                this.isDragging = false;
            });

            rangeGrid.appendChild(point);
        }

        this.shadowRoot.addEventListener("mouseup", () => {
            if (this.holdTimer) {
                clearTimeout(this.holdTimer);
            }
            this.isDragging = false;
        });
        this.shadowRoot.addEventListener("touchend", () => {
            if (this.holdTimer) {
                clearTimeout(this.holdTimer);
            }
            this.isDragging = false;
        });
        rangeGrid.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    }

    handleStart(e) {
        if (this.holdTimer) {
            clearTimeout(this.holdTimer);
        }

        const targetValue = Number(e.target.dataset.value);

        this.holdTimer = setTimeout(() => {
            this.isDragging = true;
            this.start = targetValue;
            this.end = targetValue;
            this.isFirstClick = false;
            this.updateSelection();
        }, this.holdDuration);

        if (!this.isDragging) {
            if (this.isFirstClick) {
                this.start = targetValue;
                this.end = null;
                this.isFirstClick = false;
            } else {
                this.end = targetValue;
                this.isFirstClick = true;
            }
            this.updateSelection();
        }
    }

    handleMove(e) {
        if (this.isDragging && e.target.classList.contains('point')) {
            this.end = Number(e.target.dataset.value);
            this.updateSelection();
        }
    }

    updateSelection() {
        const dates = this.shadowRoot.querySelectorAll(".point");
        const columns = parseInt(this.getAttribute("columns")) || 7;
        dates.forEach(d => {
            d.classList.remove("selected", "in-range", "range-start", "range-end");
            d.removeAttribute("data-column-position");
        });

        if (this.start !== null) {
            const min = Math.min(this.start, this.end ?? this.start);
            const max = Math.max(this.start, this.end ?? this.start);

            dates.forEach(d => {
                const value = Number(d.dataset.value);
                if (value >= min && value <= max) {
                    if (value === min || value === max) {
                        d.classList.add("selected");
                        if (this.end !== null) {
                            if (value === min) d.classList.add("range-start");
                            if (value === max) d.classList.add("range-end");
                        }
                    } else {
                        d.classList.add("in-range");
                        const start = parseInt(this.getAttribute("start")) || 1;
                        const step = parseInt(this.getAttribute("step")) || 1;
                        const index = Math.floor((value - start) / step);
                        if (index % columns === 0) d.setAttribute("data-column-position", "first");
                        if ((index + 1) % columns === 0) d.setAttribute("data-column-position", "last");
                    }
                }
            });

            this.dispatchEvent(new CustomEvent("selectionchange", {
                detail: { start: min, end: max },
                bubbles: true,
                composed: true
            }));
        }
    }

    setupTheme() {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const themeAttribute = this.getAttribute("theme");
        const savedTheme = localStorage.getItem("theme");
        
        // Prioritize theme attribute, then localStorage, then system preference
        const activeTheme = themeAttribute || savedTheme || (prefersDark ? "dark" : "light");
        this.setAttribute("data-theme", activeTheme);
        localStorage.setItem("theme", activeTheme);



        // Listen for system theme changes only if no theme attribute is set
        if (!themeAttribute) {
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
                if (!this.getAttribute("theme")) {
                    const newTheme = e.matches ? "dark" : "light";
                    this.setAttribute("data-theme", newTheme);
                    localStorage.setItem("theme", newTheme);
                }
            });
        }
    }

    getSelection() {
        if (this.start === null) return null;
        const min = Math.min(this.start, this.end ?? this.start);
        const max = Math.max(this.start, this.end ?? this.start);
        return { start: min, end: max };
    }

    get selectedstart() {
        if (this.start === null) return null;
        return Math.min(this.start, this.end ?? this.start);
    }

    get selectedend() {
        if (this.start === null) return null;
        return Math.max(this.start, this.end ?? this.start);
    }
}

customElements.define("range-selector", MyRange);