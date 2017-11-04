import js.Browser;
import Def;

using Type;

class CumulativeForwardDelete extends TextAction
{
    public var position: Int;
    public var removed_text: String = "";

    public function new(editor: CodeEditor, ?title: String)
    {
        super(editor, (title != null) ? title : "delete");
        /*let current_range = getCurrentSelectionRange();
        this.position = getCharPosFromRangeStart(current_range);
        this.removed_text = current_range.toString();*/
    }

    public static function create(editor: CodeEditor, ?title: String): Bool
    {
        var sel = Browser.window.getSelection();
        if (!sel.isCollapsed) {
            return false;
        }
        var current_node = sel.anchorNode;
        //alert(text_nodes.indexOf(current_node));
        var current_range = editor.getCurrentSelectionRange();
        var range_before_selection = Browser.document.createRange();
        range_before_selection.setStart(editor.edit_area, 0);
        range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
        var text_before_caret = range_before_selection.toString();
        var pos = text_before_caret.length;
        if (pos == editor.edit_area.textContent.length) {
            return false;
        }
        var instance: Dynamic = null;
        if (!editor.timeout.hasExpired() && editor.undo_stack.hasItems) {
            var last_item = editor.undo_stack.getLastItem();
            if (last_item.getName() == "CumulativeForwardDelete") {
                instance = last_item;
            }
        }
        if (!instance) {
            instance = new CumulativeForwardDelete(editor, title);
            instance.position = pos;
            editor.undoStackAdd(instance);
        }
        instance.removed_text += sel.anchorNode.nodeValue.substr(sel.anchorOffset, 1);
        Browser.document.execCommand("forwardDelete");
        editor.setEditorRender([{start: instance.position, end: null}]);
        return true;
    }

    public override function undo()
    {
        editor.replaceText(this.position, 0, this.removed_text);
        editor.setEditorRender([{start: this.position, end: null}]);
    }

    public override function redo()
    {
        editor.replaceText(this.position, this.removed_text.length, "");
        editor.setEditorRender([{start: this.position, end: null}]);
    }
}
