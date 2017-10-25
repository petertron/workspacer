import js.Lib;
import js.Browser;
import js.html.*;
import haxe.ds.StringMap;

import Def;
import Stack;
import Timeout;

typedef Settings = {
    var font_family: String;
    var font_size: String;
    var line_height: String;
    var indentation_width: Int;
    var indentation_method: String;
}

typedef Highlighter = {
    var stylesheet: String;
    function highlight(text: String): DocumentFragment;
}

@:expose
class CodeEditor
{
    @:const var x_margin: Int = 3;
    @:const var y_margin: Int = 2;

    public var editor = Browser.document.createDivElement();
    var line_numbers = Browser.document.createPreElement();
    public var edit_area = Browser.document.createPreElement();
    public var text_holder = Browser.document.createSpanElement();
    var menu = Browser.document.createMenuElement();

    public var timeout = new Timeout();
    public var text_nodes: Array<Dynamic>;

    public var undo_stack = new Stack();
    public var redo_stack = new Stack();

    static var highlighters = new StringMap();
    var highlighter: Highlighter = null;
    public static var highlighter_styles = Browser.document.createStyleElement();

    public var line_beginnings = [];
    var menu_items_enabled: Array<Dynamic>;

    private var default_settings = {
        font_family: "8.4pt Monaco",
        font_size: "8.4pt",
        line_height: "138%",
        indentation_width: 4,
        indentation_method: 'spaces'
    }

    private var settings: Settings;

    var regexp_ins_tab = ~/\n(?!\n)/g;

    var filename: String;

    static function main() {}

    public function new(settings: Settings)
    {
        this.settings = settings;
        line_numbers.className = "line-numbers";
        line_numbers.style.fontFamily = this.settings.font_family + ", monospace";
        line_numbers.style.fontSize = this.settings.font_size;
        line_numbers.style.lineHeight = this.settings.line_height;
        line_numbers.addEventListener('mousedown', function(event) {
            event.preventDefault();
            edit_area.focus();
        });

        edit_area.className = "edit-area";
        edit_area.setAttribute("contenteditable", "true");
        edit_area.onscroll = function(event) {
            line_numbers.style.top = -edit_area.scrollTop + "px";
        };
        edit_area.appendChild(text_holder);
        //edit_area.appendChild(Browser.document.createTextNode("\n"));
        edit_area.appendChild(Browser.document.createBRElement());

        edit_area.addEventListener('mousedown', edit_area_onmousedown);
        edit_area.addEventListener('keydown', edit_area_onkeydown);
        edit_area.addEventListener('keypress', edit_area_onkeypress);
        edit_area.addEventListener('keyup', edit_area_onkeyup);
        edit_area.addEventListener('cut', edit_area_oncut);
        edit_area.addEventListener('paste', edit_area_onpaste);
        edit_area.style.fontFamily = this.settings.font_family + ", monospace";
        edit_area.style.fontSize = this.settings.font_size;
        edit_area.style.lineHeight = this.settings.line_height;
        untyped edit_area.style.tabSize = settings.indentation_width;
        untyped edit_area.style.MozTabSize = settings.indentation_width;
        untyped edit_area.style.WebkitTabSize = settings.indentation_width;
        untyped edit_area.style.MsTabSize = settings.indentation_width;

        //menu.addEventListener('mousedown', menu_onmousedown);
        //menu.addEventListener('keydown', menu_onkeydown);

        editor.setAttribute('class', "ps-code-editor");
        //editor.setAttribute('tabindex', "0");
        editor.setAttribute('spellcheck', "false");
        editor.appendChild(highlighter_styles);
        editor.appendChild(line_numbers);
        editor.appendChild(edit_area);

        editor.oncontextmenu = function(event) {
            /*event.preventDefault();
            if (menu.style.visibility == "visible") {
                if (event.button == 2) {
                    menu.style.visibility = "hidden";
                }
            } else {
                var menu_top: Int = 0, menu_left = 0;
                if (event.buttons != 0) {
                    if (event.clientY + menu.clientHeight > Browser.window.innerHeight) {
                        menu_top = event.clientY - menu.clientHeight - 2;
                    } else {
                        menu_top = event.clientY + 2;
                    }
                    if (event.clientX + menu.clientWidth > Browser.window.innerWidth) {
                        menu_left = event.clientX - menu.clientWidth - 2;
                    } else {
                        menu_left = event.clientX + 2;
                    }
                }
                menu.style.top = menu_top + "px";
                menu.style.left = menu_left + "px";
                menu.style.visibility = "visible";
            }*/
        }
    }

    function edit_area_onmousedown(event: MouseEvent)
    {
        if (menu.style.visibility == "visible") {
            event.preventDefault();
            if (event.buttons == 1) {
                event.stopPropagation();
                menu.style.visibility = "hidden";
            }
            edit_area.focus();
        }
        timeout.clear();
    }

    /*
     * Keydown event
     */
    function edit_area_onkeydown(event: KeyboardEvent)
    {
        //event.preventDefault();
        var sel = Browser.window.getSelection();
        var key = event.keyCode;
        //last_key_code = key;

        if (event.metaKey || event.ctrlKey) {
            if (event.key == "s") {
                event.preventDefault();
                event.stopPropagation();
                editor.dispatchEvent(new CustomEvent('save', {detail: {text: getText()}}));
            } else if (event.key == "y") {
                event.preventDefault();
                redo();
            } else if (event.key == "z") {
                event.preventDefault();
                undo();
            }
            return;
        }
        if (key == 8) {
            // Delete
            event.preventDefault();
            if (sel.isCollapsed == true) {
                CumulativeDelete.create(this);
                timeout.start();
            } else {
                Delete.create(this);
                timeout.clear();
            }
        } else if (key == 9) {
            // Tab character
            event.preventDefault();
            if (settings.indentation_method == 'spaces') {
                var current_range = sel.getRangeAt(sel.rangeCount - 1);
                var range_before_selection = Browser.document.createRange();
                range_before_selection.setStart(edit_area, 0);
                range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
                var string = range_before_selection.toString();
                var last_newline = string.lastIndexOf(Def.EOL);
                if (last_newline != -1) {
                    string = string.substr(last_newline + 1);
                }
                var ind_width = settings.indentation_width;
                var count = 0;
                //let line_start = getLineStartPoint(current_range.startContainer, current_range.startOffset);
                //let String = getTextBetweenPoints(line_start, new DocPoint(current_range.endContainer, current_range.endOffset));
                // Count characters
                for (i in 0...string.length) {
                    if (string.charAt(i) == "\t") {
                        count = count + ind_width - (count % ind_width);
                    } else {
                        count++;
                    }
                }
                var spaces = "";
                for (i in 0...(ind_width - (count % ind_width))) {
                    spaces += " ";
                }
                Insert.create(this, spaces);
            } else {
                Insert.create(this, "\t");
            }
        } else if (key == 13) {
            event.preventDefault();
            Insert.create(this, Def.EOL);
        } else if (key == 46) {
            event.preventDefault();
            CumulativeForwardDelete.create(this);
            timeout.start();
        }
        //if(([8, 13, 32, 45, 46].indexOf(key) != -1) or (key >= 48 && key <= 90) or (key >= 163 && key <= 222))
    }

    /*
     * Keypress event
     */
    function edit_area_onkeypress(event: KeyboardEvent)
    {
        var key: String = event.key;
        if (key.length > 1) return;

        var sel = Browser.window.getSelection();

        if (event.metaKey || event.ctrlKey) {
            if (key == "," || key == "<") {
                event.preventDefault();
            } else if (key == "." || event.key == ">") {
                event.preventDefault();
                //Indent.create(this);
            }
            return;
        }

        if (event.charCode < 32) {
            return;
        }
        if (sel.isCollapsed) {
            CumulativeInsert.create(this, key);
            timeout.start();
        } else {
            Insert.create(this, key);
            timeout.clear();
        }
        event.preventDefault();
    }

    function edit_area_onkeyup(event: KeyboardEvent)
    {
        var key = event.keyCode;
        if (key >= 33 && key <= 40) {
            event.stopPropagation();
            timeout.clear();
        }
    }

    function edit_area_oncut(event)
    {
        event.preventDefault();
        var sel = Browser.window.getSelection();
        if (!sel.isCollapsed) {
            Browser.document.execCommand("copy");
            Delete.create(this, "cut");
        }
    };

    function edit_area_onpaste(event)
    {
        event.preventDefault();
        var new_text: String = event.clipboardData.getData('text');
        if (new_text.length > 0) {
            Insert.create(this, new_text, "paste");
        }
    }
/*
    function menu_onkeydown(event)
    {
        event.preventDefault();
        var key_code = event.keyCode;
        if (key_code == 27) {
            edit_area.focus();
            this.visible = false;
            return;
        }
        if (key_code != 38 && key_code != 40) {
            return;
        }
        var button = this.querySelector('button:focus');
        var button_index = button ? menu_items_enabled.indexOf(button) : null;
        if (key_code == 38) {
            if (button && menu_items_enabled.length > 1) {
                if (button_index == 0) {
                    button_index = menu_items_enabled.length;
                }
            } else {
                button_index = menu_items_enabled.length;
            }
            menu_items_enabled[button_index - 1].focus();
        } else if (key_code = 40) {
            if (button && menu_items_enabled.length > 1) {
                if (button_index == menu_items_enabled.length - 1) {
                    button_index = -1;
                }
            } else {
                button_index = -1;
            }
            menu_items_enabled[button_index + 1].focus();
        }
    }
*/
    function menu_onmousedown(event: MouseEvent): Void
    {
        cast(event.target, Element).style.visibility = "hidden";
        edit_area.focus();
    }

    function menu_onkeydown(event: KeyboardEvent): Void
    {
        event.preventDefault();
        var key_code = event.keyCode;
        if (key_code == 27) {
            edit_area.focus();
            cast(event.target, Element).style.visibility = "hidden";
            return;
        }
        if (key_code != 38 && key_code != 40) {
            return;
        }
        //var button: ButtonElement = cast(cast(event.target, Element).querySelector('button:focus'), ButtonElement);
        var button: ButtonElement = untyped event.target.querySelector('button:focus');
        var button_index = (button != null) ? menu_items_enabled.indexOf(button) : null;
        if (key_code == 38) {
            if (button != null && menu_items_enabled.length > 1) {
                if (button_index == 0) {
                    button_index = menu_items_enabled.length;
                }
            } else {
                button_index = menu_items_enabled.length;
            }
            menu_items_enabled[button_index - 1].focus();
        } else if (key_code == 40) {
            if (cast(button, Bool) && menu_items_enabled.length > 1) {
                if (button_index == menu_items_enabled.length - 1) {
                    button_index = -1;
                }
            } else {
                button_index = -1;
            }
            menu_items_enabled[button_index + 1].focus();
        }
    }

    function menu_onfocusout(event)
    {
        event.target.style.visibility = "hidden";
        event.preventDefault();
        //event.stopPropagation();
    }

    /* Functions */

    public function createElementWithClass(type: String, class_name: String): Element
    {
        var element = Browser.document.createElement(type);
        element.className = class_name;
        return element;
    }

    function trigger(element: Dynamic, event_name: String, params: Dynamic)
    {
        element.dispatchEvent(new CustomEvent(event_name, params ? params : null));
    }

    public function getCurrentSelectionRange(): Range
    {
        var sel = Browser.window.getSelection();
        return (sel.rangeCount > 0) ? sel.getRangeAt(sel.rangeCount - 1) : null;
    }

    public static function addHighlighter(abbrev: String, highlighter: Highlighter): Void
    {
        highlighters.set(abbrev, highlighter);
    }

    public function setFilename(?filename: String): Void
    {
        this.filename = filename;
        highlighter = null;
        if (filename != null) {
            var dot_pos: Int = filename.lastIndexOf(".");
            if (dot_pos != -1) {
                var ext: String = filename.substr(dot_pos + 1);
                if (highlighters.get(ext) != null){
                    highlighter = highlighters.get(ext);
                    highlighter_styles.textContent = highlighter.stylesheet;
                }
            }
        }
    }

    public function putFocus(): Void
    {
        edit_area.focus();
    }

    public function getText(): String
    {
        untyped return text_holder.textContent;
    }

    public function setText(text: String): Void
    {
        if (text == null || text.length == 0) {
            text_holder.innerHTML = "";
        } else {
            renderText(text);
        }
    }

    /*
     * Fill editor with highlighted text.
     */
    function renderText(?text: String)
    {
        if (text == null) {
            text = getText();
        }
        var line_num_string: String = "1\n";
        if (text == null) {
            //var node = Browser.document.createTextNode("");
            text_holder.innerHTML = "";
            //edit_area.appendChild(node);
        } else {
            var line_num: Int = 2,
                index: Int = null,
                offset: Int = 0;
            while ((index = text.indexOf("\n", offset)) != -1) {
                line_num_string += line_num + "\n";
                offset = index + 1;
                line_num++;
            }
            if (highlighter != null) {
                var new_content = highlighter.highlight(text);
                text_holder.innerHTML = "";
                if (new_content != null) {
                    text_holder.appendChild(new_content);
                }
            } else {
                text_holder.textContent = text;
            }
        }
        line_numbers.textContent = line_num_string;
        //getTextNodes();
        //getLineBeginnings();
    }

    public function setEditorRender(selection: Array<Dynamic>)
    {
        Browser.window.setTimeout(editorRender, 0, selection);
    }

    /*
     * Write updated content to editor.
     */
    public function editorRender(selection: Dynamic)
    {
        renderText();
        setSelection(selection);
    }

    /*
     * Create range.
     */
    public function createRange(start_node: Node, start_offset: Int, end_node: Node, end_offset: Int): Range
    {
        var range = Browser.document.createRange();
        range.setStart(start_node, start_offset);
        range.setEnd(end_node, end_offset);
        return range;
    }

    public function createRangeFromCharPoints(points: Dynamic): Range
    {
        var range_start = findNodeByPos(points.start);
        var range_end = findNodeByPos(points.end);
        return createRange(range_start.node, range_start.offset, range_end.node, range_end.offset);
    }

    public function findNodeByPos(pos: Int): DocPoint
    {
        var node: Node = null,
            last_node: Node = null,
            offset: Int = 0,
            found: Bool = false;

        var iterator = Browser.document.createNodeIterator(edit_area, NodeFilter.SHOW_TEXT, null);//, false)
        //while (cast(node = iterator.nextNode(), Bool)) {
        while ((node = iterator.nextNode()) != null) {
            last_node = node;
            offset = pos;
            pos -= node.nodeValue.length;
            if (pos < 0) {
                found = true;
                break;
            }
        }
        //if (!found) alert('Not found')
        if (!found) {
            /*node = Browser.document.createTextNode('');
            edit_area.appendChild(node);
            offset = 0;*/
            node = last_node;
            offset = node.nodeValue.length;
        }
        //if (!found) alert('Not found: ' + pos);
        return {node: node, offset: offset};
    }

    function getTextBetweenPoints(start_point: DocPoint, end_point: DocPoint): String
    {
        var range = Browser.document.createRange();
        range.setStart(start_point.node, start_point.offset);
        range.setEnd(end_point.node, end_point.offset);
        return range.toString();
    }

    function getLineStartPoint(ref_node: Dynamic, ref_offset: Int): DocPoint
    {
        var pos: Int = ref_node.nodeValue.substr(0, ref_offset).lastIndexOf(Def.EOL);
        if (pos > -1) {
            return {node: ref_node, offset: pos + 1};
        } else {
            var line_start: Dynamic = null;
            for (i in (line_beginnings.length - 1)...0) {
                line_start = line_beginnings[i];
                if (ref_node.compareDocumentPosition(line_start.node) == Node.DOCUMENT_POSITION_PRECEDING) {
                    break;
                }
            }
            return line_start;
        }
    }
/*
    function textAction(action_class: Dynamic, params: Dynamic)
    {
        if (params == null) {
            var params = {};
        }
        params.action_class = action_class;
        var sel = Browser.window.getSelection();
        sel.getRangeAt(sel.rangeCount - 1).startContainer.dispatchEvent(
            new CustomEvent('textAction', {bubbles: true, detail: params})
        );
    }
*/
    public function getLineBeginnings()//: Object
    {
        var iterator = Browser.document.createNodeIterator(edit_area, NodeFilter.SHOW_TEXT, null),//, false)
            node: Node,
            offset: Int,
            text_content: String,
            text_nodes: Array<Node> = [],
            line_beginnings = [];
        while ((node = iterator.nextNode()) != null) {
            text_nodes.push(node);
            text_content = node.nodeValue;
            offset = -1;
            while ((offset = text_content.indexOf(Def.EOL, offset + 1)) != -1) {
                line_beginnings.push({node: node, offset: offset});
            }
        }

        return {text_nodes: text_nodes, line_beginnings: line_beginnings};
    }

    function getTextNodes()
    {
        var iterator = Browser.document.createNodeIterator(edit_area, NodeFilter.SHOW_TEXT, null), //, false)
            text_nodes = [],
            node: Node;
        //while (cast(node = iterator.nextNode(), Bool)) {
        while ((node = iterator.nextNode()) != null) {
            text_nodes.push(node);
        }
    }

    public function replaceText(position: Int, length: Int, new_text: String)
    {
        var where_start = findNodeByPos(position);
        var where_end = length > 0 ? findNodeByPos(position + length) : where_start;
        var range = createRange(where_start.node, where_start.offset, where_end.node, where_end.offset);
        range.deleteContents();
        if (new_text.length > 0) {
            range.insertNode(Browser.document.createTextNode(new_text));
        }
    }

    /*
     * Undo last action
     */
    function undo()
    {
        if (undo_stack.hasItems()) {
            var last_item = undo_stack.pop();
            last_item.undo();
            redo_stack.push(last_item);
            timeout.clear();
        }
    }

    /*
     * Redo last undo
     */
    function redo()
    {
        if (redo_stack.hasItems()) {
            var last_item = redo_stack.pop();
            last_item.redo();
            undo_stack.push(last_item);
        }
    }

    public function undoStackAdd(item: Dynamic)
    {
        undo_stack.push(item);
        redo_stack.clear();
    }


    function selectAll()
    {
        var sel = Browser.window.getSelection();
        sel.selectAllChildren(text_holder);
    }

    public function getCharPositionsFromRange(range: Range)
    {
        var range_before = createRange(edit_area, 0, range.startContainer, range.startOffset);
        var start_pos = range_before.toString().length;
        return {start: start_pos, end: start_pos + range.toString().length};
    }

    public function getCharPosFromRangeStart(range: Range): Int
    {
        var range_before = createRange(edit_area, 0, range.startContainer, range.startOffset);
        return range_before.toString().length;
    }

    public function setCaretPos(pos: Int)
    {
        var where = findNodeByPos(pos);
        var sel = Browser.window.getSelection();
        sel.removeAllRanges();
        sel.addRange(createRange(where.node, where.offset, where.node, where.offset));
    }

    public function setSelection(spans: Array<Dynamic>)
    {
        var sel = Browser.window.getSelection();
        sel.removeAllRanges();
        for (i in 0...spans.length) {
            var range = Browser.document.createRange();
            var where_start = findNodeByPos(spans[i].start);
            range.setStart(where_start.node, where_start.offset);
            if (spans[i].end) {
                var where_end = findNodeByPos(spans[i].end);
                range.setEnd(where_end.node, where_end.offset);
            } else {
                range.setEnd(where_start.node, where_start.offset);
            }
            sel.addRange(range);
            edit_area.focus();
        }
    }

    public function getSelectionPoints()
    {
        var output = [];
        var sel = Browser.window.getSelection();
        for (i in 0...sel.rangeCount) {
            var range = sel.getRangeAt(i);
            output.push(getRangePoints(range));
        }
        return output;
    }

    public function getRangePoints(range: Range)
    {
        var range_before = Browser.document.createRange();
        range_before.setStart(edit_area, 0);
        range_before.setEnd(range.startContainer, range.startOffset);
        var start: Int = range_before.toString().length;
        return {start: start, end: start + range.toString().length};
    };

    function indentBlock()
    {
        getLineBeginnings();
        var sel = Browser.window.getSelection();
        var r0: Dynamic = sel.getRangeAt(sel.rangeCount - 1);
        var sel_start_node: Dynamic = r0.startContainer;
        var sel_start_offset: Int = r0.startOffset;
        var sel_end_node: Dynamic = r0.endContainer,
            sel_end_offset: Int = r0.endOffset;
        var sel_start_text_node_num: Int = text_nodes.indexOf(sel_start_node),
            sel_end_text_node_num = text_nodes.indexOf(sel_end_node),
            current_text_node_num = sel_start_text_node_num;
        var numba = sel_end_text_node_num = sel_start_text_node_num;
        var first_node_val = sel_start_node.nodeValue;
        var parts = [];

        if (sel.isCollapsed == true) {
            for (i in (line_beginnings.length - 1)...0) {
                var line_start = line_beginnings[i];
                if (r0.comparePoint(line_start.node, line_start.offset) == 0) {
                    if (line_start.node.nodeValue.charAt(line_start.offset + 1) != Def.EOL) {
                        line_start.node.insertData(line_start.offset + 1, Def.TAB);
                    }
                }
            }
        }
        //range.comparePoint(node, offset);
        var sli = first_node_val.slice(0, sel_start_offset);
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

    function indent(text_val)
    {
        return text_val.replace(regexp_ins_tab, Def.EOL + Def.TAB);
    }

}

/*
document.onfocus = function() {
    Browser.document.querySelector('html').className = 'focused';
    edit_area.focus();
};

document.onblur = function() {
    Browser.document.querySelector('html').className = null;
    menu.visible = false;
};



Object.defineProperty(edit_area, 'html', {
    set: function(value) {
        this.innerHTML = value;
        renderText();
    }
});
*/

/*
var menu_items = menu.getElementsByTagName('button');
for (let i = 0; i < menu_items.length; i++) {
    var menu_item = menu_items[i];
    menu_item.onmousemove = function(event) {
        if (!this.disabled) {
            this.focus();
        }
    }
    menu_item.onmouseout = function(event) {
        menu.focus();
    }
    var handler = null;
    switch (menu_item.name) {
        case "undo":
            handler = function() {
                edit_area.focus();
                setTimeout(undo, 0);
            }
            break;
        case "redo":
            handler = function() {
                setTimeout(redo, 0);
            }
            break;
        case "cut":
            handler = function() {
                Browser.document.execCommand('cut');
            }
            break;
        case "copy":
            handler = function() {
                Browser.document.execCommand('copy');
            }
            break;
        case "paste":
            handler = function() {
                edit_area.focus();
                return Browser.document.execCommand('paste');
            }
            break;
        case "delete":
            handler = function() {
                setTimeout(Delete.create(), 0);
            }
            break;
        case "selectAll":
            handler = function() {
                edit_area.focus();
                Browser.document.execCommand("selectAll");
            }
            break;
    }
    menu_item.onmousedown = handler;
    menu_item.onkeydown = function(event) {
        if (event.keyCode == 13) {
            this.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        }
    };
}

Object.defineProperty(menu, 'visible', {
    get: function() {
        return (this.style.visibility == "visible");
    },
    set: function(value) {
        if (value === true) {
            if (this.style.visibility == "hidden") {
                this.style.visibility = "visible";
                this.focus();
                var sel = Browser.window.getSelection();
                menu_items_enabled = [];
                var menu_item;
                for (let i = 0; i < menu_items.length; i++) {
                    var menu_item: Dynamic = menu_items[i];
                    var item_enabled = false;
                    switch (menu_item.name) {
                        case "undo":
                            menu_item.textContent = "Undo";
                            if (undo_stack.hasItems()) {
                                menu_item.textContent += " " + undo_stack.getLastItem().title;
                                item_enabled = true;
                            }
                            break;
                        case "redo":
                            menu_item.textContent = "Redo";
                            if (redo_stack.hasItems()) {
                                menu_item.textContent += " " + redo_stack.getLastItem().title;
                                item_enabled = true;
                            }
                            break;
                        case "cut":
                            item_enabled = Browser.document.queryCommandSupported("cut") && !sel.isCollapsed;
                            break;
                        case "copy":
                            item_enabled = Browser.document.queryCommandSupported("copy") && !sel.isCollapsed;
                            break;
                        case "paste":
                            item_enabled = true;
                            //item_enabled = Browser.document.queryCommandSupported("paste");
                            break;
                        case "delete":
                            item_enabled = !sel.isCollapsed;
                            break;
                        case "selectAll":
                            item_enabled = true;
                            break
                    }
                    if (item_enabled) {
                        menu_items_enabled.push(menu_item);
                        menu_item.disabled = false;
                    } else {
                        menu_item.disabled = true;
                    }
                }
            }
        } else {
            this.style.visibility = "hidden";
            edit_area.focus();
        }
    }
});
*/


/*
function insertText(text: string, action_name: string, can_accumulate: boolean)
{
    var allow_update = (can_accumulate == undefined) ? false : true;
    var create_new_object = true,
        action_object;
    var sel = Browser.window.getSelection();
    if (sel.isCollapsed && allow_update && undo_stack.hasItems()) {
        var last_item = undo_stack.getLastItem();
        if (last_item.action_type == "insert") {
            last_item.add(text);
            create_new_object = false;
        }
    }
    if (create_new_object) {
        undo_stack.push(new InsertText(action_name, text, allow_update));
    }
}
*/

/*
        var sel = Browser.document.getSelection();
        sel.removeAllRanges();
        for (var i in last_item.ranges) {
            sel.addRange(createRangeFromCharPoints(last_item.ranges[i]));
        }
        last_date_now = 0;
*/
/*
function getCaretPosFromNode(node, offset) {
    var r = Browser.document.createRange();
    r.setStart(edit_area, 0);
    r.setEnd(node, offset);
    var String = r.toString();

    // Count newline characters;
    var row = 0,
        pos = 0,
        new_pos,
        finished = false;
    do {
        new_pos = string.indexOf("\n", pos);
        if (new_pos > -1) {
            pos = new_pos + 1;
            row++;
        } else {
            finished = true;
        }
    } while (!finished);

    return {
        'row': row,
        'col': string.substr(pos).length
    };
}
*/

/*
function getEditorTextSlices()
{
    var sel = Browser.window.getSelection().getRangeAt(sel.rangeCount - 1);
    var r = Browser.document.createRange();
    var slices = {
        before: '',
        selected: '',
        after: ''
    }
    r.setStart(edit_area, 0)
    r.setEnd(sel.startContainer, sel.startOffset)
    slices.before = this.getTextFromRange(r)
    if (!sel.collapsed) {
        r.setStart(sel.startContainer, sel.startOffset)
        r.setEnd(sel.endContainer, sel.endOffset)
        slices.selected = this.getTextFromRange(r)
    }

    r.setStart(sel.endContainer, sel.endOffset)
    r.setEnd(edit_area, edit_area.childNodes.length)
    //r.setEnd(edit_area.lastChild, edit_area.lastChild.length)
    slices.after = getTextFromRange(r)
    return slices
}
*/

/*
function indentLine()
{
    var sel = getSelection();
    var sel_start_node = sel.startContainer;
    var caret_offset = sel.startOffset;
    //alert(sel_start_node + " : " + caret_offset);
    var txt = sel_start_node.nodeValue;
    var sli = txt.slice(0, caret_offset);
    var pos = sli.lastIndexOf(Def.EOL);
    if (pos > -1) {
        if (txt.charAt(pos + 1) != Def.EOL) {
            sel_start_node.insertData(pos + 1, "    ");
        }
        return;
    }

    var b;
    var n, o;
    var result_mask = Node.DOCUMENT_POSITION_FOLLOWING + Node.DOCUMENT_POSITION_CONTAINS;
    for (var i = line_beginnings.length - 1; i >= 0; i--) {
        b = line_beginnings[i];
        n = b.node;
        o = b.offset;
        if ((n.compareDocumentPosition(sel_start_node) & result_mask) != 0) {
            //var val = n.nodeValue;
            n.insertData(o + 1, "    ");
            break;
        }
    }
}

function indentBlock()
{
    var sel = Browser.window.getSelection();
    var r0 = sel.getRangeAt(sel.rangeCount - 1);
    var sel_start_node = r0.startContainer;
    var sel_start_offset = r0.startOffset;
    var sel_end_node = r0.endContainer,
        sel_end_offset = r0.endOffset;
    var sel_start_text_node_num = text_nodes.indexOf(sel_start_node),
        sel_end_text_node_num = text_nodes.indexOf(sel_end_node),
        current_text_node_num = sel_start_text_node_num;
    var numba = sel_end_text_node_num = sel_start_text_node_num;
    var first_node_val = sel_start_node.nodeValue;
    var parts = [];

    if (!sel.isCollapsed) {
        if (sel_start_node == sel_end_node) {
            var text = r0.toString();
            alert(text)
            var parts = text.split(Def.EOL);
            for (var i in parts) {
                if (parts[i].length > 0) {
                    parts[i] = Def.TAB + parts[i];
                }
            }

            //sel_start_node.replaceData(sel_start_offset, text.length, parts.join(Def.EOL));
            //var new_content = indent(first_node_val.slice(text));
            var new_content = indent(text);
            sel_start_node.replaceData(sel_start_offset, text.length, new_content);
            r0.setEnd(sel_start_node, sel_start_offset + new_content.length);
            sel.removeAllRanges().addRange(r0);
        } else {
            sel_end_node.nodeValue = indent(sel_end_node.nodeValue.slice(0, sel_end_offset)) + sel_end_node.slice(sel_end_offset);
            sel_start_node.nodeValue = first_node_val.slice(0, sel_start_offset) + indent(first_node_val.slice(sel_start_offset));
            if (numba > 1) {
                for (var i = 1; i < numba; i++) {
                    current_text_node_num++;
                    text_nodes[current_text_node_num].nodeValue = indent(text_nodes[current_text_node_num].nodeValue);
                }
            }
        }
    }
    var sli = first_node_val.slice(0, sel_start_offset);
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
*/
