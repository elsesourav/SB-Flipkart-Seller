// Initialize JSON Editor
const JSON_EDITOR_ELEMENT = document.getElementById("jsonEditor");
const jsonEditor = CodeMirror.fromTextArea(JSON_EDITOR_ELEMENT, {
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
   try {
      if (!jsonEditor) {
         return {};
      }
      const value = jsonEditor.getValue();
      return value ? JSON.parse(value) : {};
   } catch (error) {
      console.error('Error parsing JSON:', error);
      return {};
   }
}

function setJsonContent(json) {
   jsonEditor.setValue(JSON.stringify(json, null, 3));
}