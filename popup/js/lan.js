// Initialize JSON Editor
const EDITOR = document.getElementById("languageEditor");
const EDITOR_AREA = CodeMirror.fromTextArea(EDITOR, {
   mode: "application/json",
   theme: "dracula",
   lineNumbers: true,
   autoCloseBrackets: true,
   matchBrackets: true,
   indentUnit: 3,
   tabSize: 3,
   lineWrapping: true,
   foldGutter: true,
   styleActiveLine: { nonEmpty: true },
   highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
   gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
   extraKeys: { "Ctrl-Space": "autocomplete" },
});

EDITOR_AREA.setSize("100%", "100%");
EDITOR_AREA.refresh();

function getJsonContent() {
   const data = EDITOR_AREA.getValue();
   if (!data) return null;

   const cleanedText = data.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").trim();
   const keyValue = cleanedText.split(",");

   const array = keyValue.map((ele) => {
      const [key, value] = ele.split("=");
      if (!key || !value) return null;
      return { key: key.trim()?.toLowerCase(), value: value.trim() };
   });

   const filtered = array.filter((ele) => ele);
   const object = {};
   for (const item of filtered) object[item.key] = item.value;
   return JSON.stringify(object);
}

function getRowContent() {
   return EDITOR_AREA.getValue();
}

function setContent(content = "// hello Sourav") {
   EDITOR_AREA.setValue(content);
}
