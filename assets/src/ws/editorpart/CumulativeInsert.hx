package ws.editorpart;

import js.Browser;
import ws.Def;

using Type;

class CumulativeInsert extends TextAction
{
    public var position: Int;
    public var new_text: String;

    public function new(editor: CodeEditor, char: String, ?title: String)
    {
        super(editor, (title != null) ? title : 'ta_insert');

        this.position = editor.getCharPosFromRangeStart(editor.getCurrentSelectionRange());
        this.new_text = "";
    }

    public static function create(editor: CodeEditor, char: String, ?title: String): CumulativeInsert
    {
        var instance: CumulativeInsert = null;
        //Browser.alert(editor.timeout.hasExpired());
        //alert(timeout.hasExpired() + " ... " + undo_stack.hasItems());
        if (!editor.timeout.hasExpired() && editor.undo_stack.hasItems) {
            var last_item: TextAction = editor.undo_stack.getLastItem();
            /*if (cast(last_item, TextAction).getName() == "CumulativeInsert") {
                instance = cast(last_item, CumulativeInsert);
            }*/
            //Browser.alert(last_item.getName());
            if (last_item.getName() == "CumulativeInsert") {
                instance = cast(last_item, CumulativeInsert);
            }
        }
        if (instance == null) {
            instance = new CumulativeInsert(editor, char, title);
            editor.undoStackAdd(instance);
        }
        instance.new_text += char;
        Browser.document.execCommand('insertText', false, char);
        editor.setEditorRender([{start: instance.position + instance.new_text.length, end: null}]);
        return instance;
    }

    public override function undo()
    {
        editor.replaceText(this.position, this.new_text.length, "");
        editor.setEditorRender([{start: this.position, end: null}]);
    }

    public override function redo()
    {
        editor.replaceText(this.position, 0, this.new_text);
        editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
    }
}
