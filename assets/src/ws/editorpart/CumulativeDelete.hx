package ws.editorpart;

import js.Browser;
import ws.Def;

using Type;

class CumulativeDelete extends TextAction
{
//    var title: String;
    var position: Int;
    var removed_text: String = "";

    public function new(editor: CodeEditor, ?title: String)
    {
        super(editor, (title != null) ? title : "delete");
    }

    public static function create(editor: CodeEditor, ?title: String): Bool
    {
        var sel = Browser.window.getSelection();
        if (sel.isCollapsed == false) {
            return false;
        }
        var current_range = editor.getCurrentSelectionRange();
        var range_before_selection = Browser.document.createRange();
        range_before_selection.setStart(editor.edit_area, 0);
        range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
        var text_before_caret = range_before_selection.toString();
        var pos = text_before_caret.length;
        if (pos == 0) {
            return false;
        }
        var instance: Dynamic = null;
        if (!editor.timeout.hasExpired() && editor.undo_stack.hasItems) {
            var last_item = editor.undo_stack.getLastItem();
            if (last_item.getName() == "CumulativeDelete") {
                instance = last_item;
            }
        }
        if (!instance) {
            instance = new CumulativeDelete(editor, title);
            editor.undoStackAdd(instance);
        }
        instance.position = pos - 1;
        instance.removed_text = text_before_caret.substr(-1) + instance.removed_text;
        Browser.document.execCommand('delete');
        editor.setEditorRender([{start: instance.position, end: null}]);
        return true;
    }

    public override function undo()
    {
        editor.replaceText(this.position, 0, this.removed_text);
        editor.setEditorRender([{start: this.position + this.removed_text.length, end: null}]);
    }

    public override function redo()
    {
        editor.replaceText(this.position, this.removed_text.length, "");
        editor.setEditorRender([{start: this.position, end: null}]);
    }
}
