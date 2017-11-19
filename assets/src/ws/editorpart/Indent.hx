package ws.editorpart;

import js.Browser;
import js.html.*;

import CodeEditor;

class Indent
{
    public var title: String = "indent";
    var editor: CodeEditor;

    public function new(editor: CodeEditor)
    {
        this.editor = editor;

        var get: Dynamic = editor.getLineBeginnings();
        var line_beginnings: Array<Dynamic> = get.line_beginnings;
        var text_nodes: Array<Dynamic> = get.text_nodes;
        var sel = Browser.window.getSelection();
        for (i in 0...sel.rangeCount) {
            var range: Range = sel.getRangeAt(i);
            var sel_start_node: Node = range.startContainer;
            var sel_start_offset: Int = range.startOffset;
            var sel_end_node: Node = range.endContainer;
            var sel_end_offset: Int = range.endOffset;
            var sel_start_text_node_num: Int = text_nodes.indexOf(sel_start_node),
                sel_end_text_node_num: Int = text_nodes.indexOf(sel_end_node),
                current_text_node_num = sel_start_text_node_num;
                //alert(sel_start_text_node_num);
            var numba = sel_end_text_node_num = sel_start_text_node_num;
            var first_node_val = sel_start_node.nodeValue;

            if (!sel.isCollapsed) {
                for (j in 1...line_beginnings.length) {
                    var line_start = line_beginnings[line_beginnings.length - j];
                    if (range.comparePoint(line_start.node, line_start.offset) == 0) {
                        if (line_start.node.data.charAt(line_start.offset + 1) != Def.EOL) {
                            line_start.node.insertData(line_start.offset + 1, Def.TAB);
                        }
                    }
                }
            }
            //range.comparePoint(node, offset);
            var sli = first_node_val.substr(0, sel_start_offset);
            var pos = sli.lastIndexOf(Def.EOL);

            if (pos == -1) {
                do {
                    current_text_node_num--;
                    var n = text_nodes[current_text_node_num];
                    var v = n.nodeValue;
                    var last_eol = v.lastIndexOf(Def.EOL);
                    if (last_eol > -1) {
                        n.insertData(last_eol + 1, Def.TAB);
                        break;
                    }
                } while (current_text_node_num > 0);
            } else {
                if (first_node_val.charAt(pos + 1) != Def.EOL) {
                    sel_start_node.insertData(pos + 1, Def.TAB);
                }
            }
        }
    }

    public static function create(editor: CodeEditor): Void
    {
        editor.undoStackAdd(new Indent(editor));
    }

    public function undo()
    {
        Browser.alert("goob");
    }

    public function redo()
    {
        //
    }
}
