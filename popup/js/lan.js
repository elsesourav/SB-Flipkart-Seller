// Initialize JSON Editor
const JSON_EDITOR_ELEMENT = document.getElementById("jsonEditor");
const jsonEditor = CodeMirror.fromTextArea(JSON_EDITOR_ELEMENT, {
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
   extraKeys: { "Ctrl-Space": "autocomplete" }
});

jsonEditor.setSize("100%", "100%");
jsonEditor.refresh();

function getJsonContent() {
   return JSON.parse(jsonEditor.getValue());
}

function setJsonContent(json) {
   jsonEditor.setValue(JSON.stringify(json, null, 3));
}