package ws.editorpart;

import js.Browser;
import js.html.*;

class Delete extends TextAction
{
    var selection: Array<Dynamic> = [];
    var removed_text: Array<Dynamic> = [];

    public function new(editor: CodeEditor, ?title: String)
    {
        super(editor, (title != null) ? title : 'ta_delete');

        var sel = Browser.window.getSelection();
        var range_count: Int = sel.rangeCount;
        var range: Range = null;
        var range_points: Dynamic;
        for (i in 0...range_count) {
            range = sel.getRangeAt(i);
            range_points = editor.getRangePoints(range);
            this.selection.push(range_points);
            this.removed_text.push({pos: range_points.start, text: range.toString()});
        }
        this.removed_text.sort(function(item1, item2) {
            return item1.pos - item2.pos;
        });
        sel.deleteFromDocument();
        editor.setEditorRender([editor.getRangePoints(editor.getCurrentSelectionRange())]);
    }

    public static function create(editor: CodeEditor, ?title: String)
    {
        var sel = Browser.window.getSelection();
        if (!sel.isCollapsed) {
            editor.undoStackAdd(new Delete(editor, title));
        }
    }

    public override function undo()
    {
        var item: Dynamic;
        for (i in 0...removed_text.length) {
            item = removed_text[i];
            //Browser.alert(item.pos + " ... " + item.text);
            editor.replaceText(item.pos, 0, item.text);
        }
        editor.setEditorRender(this.selection);
    }

    public override function redo()
    {
        var sel = Browser.window.getSelection();
        if (sel.isCollapsed) {
            editor.setSelection(this.selection);
        }
        sel.deleteFromDocument();
        editor.setEditorRender([editor.getRangePoints(sel.getRangeAt(sel.rangeCount - 1))]);
    }
}
