// Initialize JSON Editor
const jsonEditor = CodeMirror.fromTextArea(document.getElementById("jsonEditor"), {
   mode: "application/json",
   theme: "monokai",
   lineNumbers: true,
   autoCloseBrackets: true,
   matchBrackets: true,
   indentUnit: 3,
   tabSize: 3,
   lineWrapping: true,
   foldGutter: true,
   gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
   extraKeys: {
      "Ctrl-Space": "autocomplete"
   }
});

jsonEditor.setSize("100%", "100%");
jsonEditor.refresh();

function getJsonContent() {
   return JSON.parse(jsonEditor.getValue());
}

function setJsonContent(json) {
   jsonEditor.setValue(JSON.stringify(json, null, 3));
}