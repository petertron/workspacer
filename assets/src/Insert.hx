import js.Browser;
import js.html.*;

import Def;

class Insert extends TextAction
{
    var position: Int;
    var selection: Array<Dynamic>;
    var old_text: String;
    var new_text: String;

    public function new(editor: CodeEditor, new_text: String, ?title: String)
    {
        super(editor, (title != null) ? title : "insert");

        this.selection = editor.getSelectionPoints();
        var current_range = editor.getCurrentSelectionRange();
        this.old_text = current_range.toString();
        this.new_text = new_text;
        this.position = this.selection[this.selection.length - 1].start;
        current_range.deleteContents();
        current_range.insertNode(Browser.document.createTextNode(new_text));
        //var sc: Dynamic = current_range.startContainer;
        //untyped current_range.startContainer.insertData(current_range.startOffset, this.new_text);
        editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
    }

    public static function create(editor: CodeEditor, new_text: String, ?title: String)
    {
        editor.undoStackAdd(new Insert(editor, new_text, title));
    }

    public override function undo()
    {
        editor.replaceText(this.position, this.new_text.length, this.old_text);
        editor.setEditorRender(this.selection);
    }

    public override function redo()
    {
        editor.setSelection(this.selection);
        var current_range = editor.getCurrentSelectionRange();
        current_range.deleteContents();
        current_range.insertNode(Browser.document.createTextNode(this.new_text));
        editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
    }
}
