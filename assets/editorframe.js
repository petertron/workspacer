var Textspace;
(function (Textspace) {
    Textspace.text = "";
    Textspace.selection = { 'start': null, 'end': null, 'collapsed': null };
    Textspace.caret_positioned = false;
    var undo_stack = [];
    var redo_stack = [];
    Textspace.action = function (action_name, new_text) {
        try {
            Textspace.selection = getSelectionPoints();
            var action_class = Actions[action_name];
            var last_item;
            var add_to_stack = true;
            if (undo_stack.length > 0 && !Textspace.caret_positioned) {
                last_item = undo_stack[undo_stack.length - 1];
                if (last_item.isUpdatable() && last_item.getName() == action_name) {
                    last_item.update(new_text);
                    add_to_stack = false;
                }
            }
            if (add_to_stack) {
                undo_stack.push(new action_class(new_text));
                redo_stack = [];
            }
            Textspace.caret_positioned = false;
            refreshEditorDisplay();
        }
        catch (e) {
            if (e) {
                alert(e.name + " : " + e.message);
            }
            else {
                alert("Can't do!");
            }
        }
    };
    Textspace.undo = function () {
        if (undo_stack.length > 0) {
            var last_item = undo_stack.pop();
            redo_stack.push(last_item);
            last_item.undo();
            refreshEditorDisplay();
        }
    };
    Textspace.redo = function () {
        if (redo_stack.length > 0) {
            var last_item = redo_stack.pop();
            undo_stack.push(last_item);
            last_item.redo();
            refreshEditorDisplay();
        }
    };
    function setSelection(start, end) {
        end = (end == undefined) ? start : end;
        Textspace.selection = { 'start': start, 'end': end, 'collapsed': (start == end) };
    }
    Textspace.setSelection = setSelection;
    function selectionCollapsed() {
        return (Textspace.selection.start == Textspace.selection.end);
    }
    Textspace.selectionCollapsed = selectionCollapsed;
    function textInsert(pos, new_text) {
        Textspace.text = Textspace.text.slice(0, pos) + new_text + Textspace.text.slice(pos);
    }
    Textspace.textInsert = textInsert;
    function textRemove(pos) {
        var removed = Textspace.text.slice(pos.start, pos.end);
        Textspace.text = Textspace.text.slice(0, pos.start) + Textspace.text.slice(pos.end);
        return removed;
    }
    Textspace.textRemove = textRemove;
    function textReplace(pos, new_text) {
        Textspace.text = Textspace.text.slice(0, pos.start) + new_text + Textspace.text.slice(pos.end);
    }
    Textspace.textReplace = textReplace;
    function replaceSelection(new_text) {
        var slices = getEditorTextSlices();
        Textspace.text = slices.before + new_text + slices.after;
        return { 'position': slices.before.length, 'text': slices.selected };
    }
    Textspace.replaceSelection = replaceSelection;
    function registerCaretPos() {
        Textspace.selection = getSelectionPoints();
        Textspace.caret_positioned = true;
    }
    Textspace.registerCaretPos = registerCaretPos;
    function getSelectionPoints() {
        var selection = window.getSelection();
        var s0 = selection.getRangeAt(0);
        var start_node = s0.startContainer;
        var start_offset = s0.startOffset;
        return {
            'start': caretPosFromNode(start_node, start_offset),
            'end': caretPosFromNode(s0.endContainer, s0.endOffset),
            'collapsed': s0.collapsed
        };
    }
    function caretPosFromNode(node, offset) {
        var r = document.createRange();
        r.setStart(PRE_TAG, 0);
        r.setEnd(node, offset);
        var div = document.createElement('div');
        div.appendChild(r.cloneContents());
        return $(div).find('br').length + $(div).text().length;
    }
    function getEditorTextSlices() {
        var sel = window.getSelection().getRangeAt(0), r = document.createRange(), slices = {
            'before': "",
            'selected': "",
            'after': ""
        };
        r.setStart(PRE_TAG, 0);
        r.setEnd(sel.startContainer, sel.startOffset);
        slices.before = getTextFromRange(r);
        if (!sel.collapsed) {
            r.setStart(sel.startContainer, sel.startOffset);
            r.setEnd(sel.endContainer, sel.endOffset);
            slices.selected = getTextFromRange(r);
        }
        r.setStart(sel.endContainer, sel.endOffset);
        r.setEnd(PRE_TAG, PRE_TAG.childNodes.length);
        slices.after = getTextFromRange(r);
        return slices;
    }
    Textspace.getEditorTextSlices = getEditorTextSlices;
    function getTextFromRange(range) {
        var div = document.createElement('div');
        div.appendChild(range.cloneContents());
        var breaks = div.getElementsByTagName('br');
        for (var i = breaks.length; i > 0; i--) {
            div.replaceChild(d.createTextNode("\n"), breaks[i - 1]);
        }
        return div.textContent;
    }
})(Textspace || (Textspace = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Actions;
(function (Actions) {
    var Base = (function () {
        function Base() {
        }
        Base.prototype.getName = function () {
            var results = /function (.{1,})\(/.exec((this).constructor.toString());
            return (results && results.length > 1) ? results[1] : "";
        };
        Base.prototype.isUpdatable = function () {
            return 'update' in this;
        };
        return Base;
    })();
    Actions.Base = Base;
    var InsertChar = (function (_super) {
        __extends(InsertChar, _super);
        function InsertChar(char) {
            _super.call(this);
            this.title = "insert";
            var replaced = Textspace.replaceSelection(char);
            this.position = replaced.position;
            this.old_text = replaced.text;
            this.new_text = char;
            Textspace.setSelection(this.position + 1);
        }
        InsertChar.prototype.update = function (char) {
            Textspace.textInsert(this.position + this.new_text.length, char);
            this.new_text += char;
            Textspace.setSelection(this.position + this.new_text.length);
        };
        InsertChar.prototype.undo = function () {
            Textspace.textReplace({ 'start': this.position, 'end': this.position + this.new_text.length }, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        InsertChar.prototype.redo = function () {
            Textspace.textReplace({ 'start': this.position, 'end': this.position + this.old_text.length }, this.new_text);
            Textspace.setSelection(this.position + this.new_text.length);
        };
        return InsertChar;
    })(Base);
    Actions.InsertChar = InsertChar;
    var InsertLineBreak = (function (_super) {
        __extends(InsertLineBreak, _super);
        function InsertLineBreak() {
            _super.call(this);
            this.title = "insert line break";
            var replaced = Textspace.replaceSelection("\n");
            this.position = replaced.position;
            this.old_text = replaced.text;
            Textspace.setSelection(this.position + 1);
        }
        InsertLineBreak.prototype.undo = function () {
            Textspace.textReplace({ 'start': this.position, 'end': this.position + 1 }, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        InsertLineBreak.prototype.redo = function () {
            Textspace.textReplace({ 'start': this.position, 'end': this.position + this.old_text.length }, "\n");
            Textspace.setSelection(this.position + 1);
        };
        return InsertLineBreak;
    })(Base);
    Actions.InsertLineBreak = InsertLineBreak;
    var Delete = (function (_super) {
        __extends(Delete, _super);
        function Delete() {
            _super.call(this);
            this.title = "delete";
            var slices = Textspace.getEditorTextSlices();
            if (slices.selected) {
                this.old_text = slices.selected;
            }
            else {
                if (!slices.before)
                    throw null;
                this.old_text = slices.before.slice(-1);
                slices.before = slices.before.slice(0, -1);
            }
            Textspace.text = slices.before + slices.after;
            this.position = slices.before.length;
            Textspace.setSelection(this.position);
        }
        Delete.prototype.update = function () {
            if (this.position == 0)
                throw null;
            this.position--;
            this.old_text = Textspace.textRemove({ 'start': this.position, 'end': this.position + 1 }) + this.old_text;
            Textspace.setSelection(this.position);
        };
        Delete.prototype.undo = function () {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        Delete.prototype.redo = function () {
            Textspace.textRemove({ 'start': this.position, 'end': this.position + this.old_text.length });
            Textspace.setSelection(this.position);
        };
        return Delete;
    })(Base);
    Actions.Delete = Delete;
    var ForwardsDelete = (function (_super) {
        __extends(ForwardsDelete, _super);
        function ForwardsDelete() {
            _super.call(this);
            this.title = "forwards delete";
            var sel = Textspace.selection;
            if (sel.collapsed) {
                if (sel.start == Textspace.text.length)
                    throw null;
                sel.end = sel.start + 1;
            }
            this.position = sel.start;
            this.old_text = Textspace.textRemove(sel);
            Textspace.setSelection(this.position);
        }
        ForwardsDelete.prototype.update = function () {
            if (Textspace.selection.start == Textspace.text.length)
                throw null;
            this.old_text += Textspace.textRemove({ 'start': this.position, 'end': this.position + 1 });
            Textspace.setSelection(this.position);
        };
        ForwardsDelete.prototype.undo = function () {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        ForwardsDelete.prototype.redo = function () {
            Textspace.textRemove({ 'start': this.position, 'end': this.position + this.old_text.length });
            Textspace.setSelection(this.position);
        };
        return ForwardsDelete;
    })(Base);
    Actions.ForwardsDelete = ForwardsDelete;
    var Cut = (function (_super) {
        __extends(Cut, _super);
        function Cut() {
            _super.call(this);
            this.title = "cut";
            var pos = Textspace.selection;
            this.position = pos.start;
            this.old_text = Textspace.textRemove(pos);
            Textspace.selection.end = null;
        }
        Cut.prototype.undo = function () {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        Cut.prototype.redo = function () {
            Textspace.textRemove({ 'start': this.position, 'end': this.position + this.old_text.length });
            Textspace.setSelection(this.position);
        };
        return Cut;
    })(Base);
    Actions.Cut = Cut;
    var Paste = (function (_super) {
        __extends(Paste, _super);
        function Paste(new_text) {
            _super.call(this);
            this.title = "paste";
            var replaced = Textspace.replaceSelection(new_text);
            this.position = replaced.position;
            this.old_text = replaced.text;
            this.new_text = new_text;
            Textspace.setSelection(this.position + this.new_text.length);
        }
        Paste.prototype.undo = function () {
            Textspace.textReplace({ 'start': this.position, 'end': this.position + this.new_text.length }, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        Paste.prototype.redo = function () {
            Textspace.textReplace({ 'start': this.position, 'end': this.position + this.old_text.length }, this.new_text);
            Textspace.setSelection(this.position + this.new_text.length);
        };
        return Paste;
    })(Base);
    Actions.Paste = Paste;
    var IndentRight = (function (_super) {
        __extends(IndentRight, _super);
        function IndentRight() {
            _super.call(this);
            this.title = "indent right";
            var break_pos;
            var pos = Textspace.selection;
            this.position = pos.start;
            var slices = Textspace.getEditorTextSlices();
            if (slices.before) {
                break_pos = slices.before.lastIndexOf("\n") + 1;
                if (break_pos < slices.before.length) {
                    slices.selected = slices.before.slice(break_pos) + slices.selected;
                    slices.before = slices.before.slice(0, break_pos);
                }
            }
            if (slices.selected.slice(-1) !== "\n") {
                break_pos = slices.after.indexOf("\n");
                if (break_pos != -1) {
                    slices.selected += slices.after.slice(0, break_pos);
                    slices.after = slices.after.slice(break_pos);
                }
            }
            this.old_text = slices.selected;
            var selection_split = slices.selected.split("\n");
            var indentation_pos;
            for (var i in selection_split) {
                selection_split[i] = "    " + selection_split[i];
            }
            slices.selected = selection_split.join("\n");
            Textspace.text = slices.before + slices.selected + slices.after;
            Textspace.selection.end = null;
        }
        IndentRight.prototype.undo = function () {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        };
        IndentRight.prototype.redo = function () {
            Textspace.textRemove({ 'start': this.position, 'end': this.position + this.old_text.length });
            Textspace.setSelection(this.position);
        };
        return IndentRight;
    })(Base);
    Actions.IndentRight = IndentRight;
})(Actions || (Actions = {}));
/// <reference path="jquery.d.ts"/>
/// <reference path="Textspace.ts"/>
/// <reference path="Actions.ts"/>
var d = document;
var jQuery = window.parent['jQuery'];
var $ = jQuery;
var Symphony = window.parent['Symphony'];
var Context = Symphony['Context'];
var BODY = document.body, PRE_TAG, NOTIFIER, CONTEXT, SUBHEADING, CONTENTS, FORM, NAME_FIELD, SAVING_POPUP;
PRE_TAG = document.getElementsByTagName('pre')[0];
var EDITOR_OUTER, EDITOR_LINE_NUMBERS, EDITOR_MAIN, BODY_HIGHLIGHTER_STYLES, EDITOR_MENU, EDITOR_RESIZE_HANDLE;
var replacement_actions = null;
var workspace_url, editor_url, directory_url;
var last_key_code, caret_moved;
var gutter_width = 34;
var x_margin = 3, y_margin = 2;
var in_workspace;
var new_file, document_modified = false, syntax_highlighter;
var style_element1 = document.createElement('style');
style_element1.type = "text/css";
var style_element2 = document.createElement('style');
style_element2.type = "text/css";
var ajax_submit;
var editor_height = 580;
var editor_refresh_pending = false;
var editor_resize = {
    'height': 580,
    'mouse_down': false,
    'pointer_y': null
};
function EDITOR_OUTER_onMouseDown(event) {
    if (event.which == 3 && $(EDITOR_MENU).is(':hidden')) {
        event.preventDefault();
        $(EDITOR_MENU).trigger('openmenu', [event.clientX, event.clientY]);
        PRE_TAG.contentEditable = null;
    }
}
function BODY_onFocusIn(event) {
    if (!($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).addClass('focus');
    }
}
function BODY_onFocusOut(event) {
    if (($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).removeClass('focus');
        PRE_TAG.contentEditable = "true";
    }
}
function BODY_onMouseUp(event) {
    Textspace.registerCaretPos();
}
$(PRE_TAG).keydown(function (event) {
    var key = event.which;
    last_key_code = key;
    var char = String.fromCharCode(key);
    if (event.metaKey || event.ctrlKey) {
        switch (key) {
            case 39:
                if (!Textspace.selection.collapsed) {
                    event.preventDefault();
                    Textspace.action("IndentRight");
                }
                break;
            case 83:
                event.preventDefault();
                $('input[name="action[save]"]').trigger('click');
                break;
            case 89:
                event.preventDefault();
                Textspace.redo();
                break;
            case 90:
                event.preventDefault();
                Textspace.undo();
                break;
        }
        return;
    }
    if (key == 8) {
        event.preventDefault();
        Textspace.action("Delete");
    }
    else if (key == 9) {
        event.preventDefault();
        if (Settings['indentation_method'] == "spaces") {
            var ind_width = Settings['indentation_width'];
            var slices = Textspace.getEditorTextSlices();
            if (slices.before) {
                var string = slices.before.split("\n").pop();
                var count = 0;
                for (var i = 0; i < string.length; i++) {
                    if (string[i] == "\t") {
                        count = count + ind_width - (count % ind_width);
                    }
                    else {
                        count++;
                    }
                }
            }
            for (var i = 0; i < ind_width - (count % ind_width); i++) {
                Textspace.action("InsertChar", " ");
            }
        }
        else {
            Textspace.action("InsertChar", "\t");
        }
    }
    else if (key == 13) {
        event.preventDefault();
        Textspace.action("InsertLineBreak");
    }
    else if (key == 46) {
        event.preventDefault();
        Textspace.action("ForwardsDelete");
    }
});
$(PRE_TAG).keypress(function (event) {
    if (event.metaKey || event.ctrlKey)
        return;
    var key = event.which;
    if (key < 32)
        return;
    var char = String.fromCharCode(key);
    event.preventDefault();
    Textspace.action("InsertChar", char);
});
$(PRE_TAG).keyup(function (event) {
    var key = event.which;
    if (key >= 33 && key <= 40) {
        Textspace.registerCaretPos();
    }
});
$(PRE_TAG).on('cut', function (event) {
    Textspace.action("Delete");
});
$(PRE_TAG).on('paste', function (event) {
    event.preventDefault();
    Textspace.action("Paste", event.originalEvent['clipboardData'].getData('text'));
});
function EDITOR_MENU_onMenuOpen(event, mouse_x, mouse_y) {
    if ($(this).is(':visible')) {
        event.stopPropagation();
        return;
    }
    var ul = d.createElement('ul');
    var li = d.createElement('li');
    var legend = d.createTextNode("Undo");
    li.appendChild(legend);
    ul.appendChild(li);
    $(this)
        .empty()
        .append(ul)
        .css('left', mouse_x)
        .css('top', mouse_y)
        .show()
        .focus();
}
function EDITOR_MENU_onFocusOut(event) {
    $(this).hide();
}
var css_string = "";
for (var type in Highlighters) {
    var highlighter = Highlighters[type];
    var prefix = "." + highlighter.style_prefix;
    var styles = highlighter.stylesheet;
    for (var key in styles) {
        css_string += prefix + key + " {" + styles[key] + "} ";
    }
    css_string += "\n";
}
document.getElementById('highlighter-styles').textContent = css_string;
Textspace.text = window['doc_text'];
var w = Settings['indentation_width'];
PRE_TAG.style.tabSize = w;
PRE_TAG.style.MozTabSize = w;
PRE_TAG.style.WebkitTabSize = Settings['indentation_width'];
PRE_TAG.style.MsTabSize = Settings['indentation_width'];
PRE_TAG.style.OTabSize = Settings['indentation_width'];
renderText();
function createRange(start_node, start_offset, end_node, end_offset) {
    var range = d.createRange();
    range.setStart(start_node, start_offset);
    range.setEnd(end_node, end_offset);
    return range;
}
function setHighlighter() {
    var filename, ext;
    var in_workspace = false;
    if (in_workspace) {
        filename = "zart.xsl";
        var last_dot = filename.lastIndexOf(".");
        if (last_dot > 0) {
            ext = filename.slice(last_dot + 1);
            syntax_highlighter = Highlighters[ext];
        }
        else
            syntax_highlighter = null;
    }
    else {
        syntax_highlighter = Highlighters.xsl;
    }
}
function refreshEditorDisplay() {
    if (!editor_refresh_pending) {
        setTimeout(rewriteEditorContents, 1);
        editor_refresh_pending = true;
    }
}
function rewriteEditorContents() {
    renderText();
    setEditorSelection();
    editor_refresh_pending = false;
}
function renderText() {
    var frag, lines, num_lines;
    PRE_TAG.innerHTML = '';
    var syntax_highlighter = Highlighters['xsl'];
    if (Textspace.text) {
        frag = d.createDocumentFragment();
        if (syntax_highlighter) {
            lines = syntax_highlighter.highlight(Textspace.text);
            for (var _i = 0; _i < lines.length;) {
                if (lines[_i])
                    frag.appendChild(lines[_i]);
                else
                    frag.appendChild(d.createTextNode(""));
                if (++_i < lines.length)
                    frag.appendChild(d.createTextNode("\n"));
            }
        }
        else {
            lines = Textspace.text.split("\n");
            for (var _i = 0; _i < lines.length;) {
                frag.appendChild(d.createTextNode(lines[_i]));
                if (++_i < lines.length)
                    frag.appendChild(d.createTextNode("\n"));
            }
        }
        PRE_TAG.appendChild(frag);
        num_lines = lines.length;
    }
    else {
        frag = d.createElement('span');
        frag.appendChild(d.createTextNode(""));
        PRE_TAG.appendChild(frag);
        num_lines = 1;
    }
    parent.displayLineNumbers(num_lines, $(PRE_TAG).height());
}
function setEditorSelection() {
    var range = d.createRange();
    if (Textspace.text) {
        var pos = Textspace.selection;
        var node_start = findNodeByPos(pos.start), node_end;
        if (pos.end) {
            node_end = findNodeByPos(pos.end);
        }
        else {
            node_end = node_start;
        }
        range.setStart(node_start.node, node_start.offset);
        range.setEnd(node_end.node, node_end.offset);
    }
    else {
        range.setStart(PRE_TAG.firstChild, 0);
        range.setEnd(PRE_TAG.firstChild, 0);
    }
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
function findNodeByPos(pos) {
    var node, offset;
    var found;
    var iterator = document.createNodeIterator(PRE_TAG, NodeFilter.SHOW_TEXT, null, false);
    while (node = iterator.nextNode()) {
        offset = pos;
        pos -= node.length;
        if (node.nodeValue == "\n")
            continue;
        if (pos <= 0) {
            found = node;
            break;
        }
    }
    if (!found) {
        node = d.createTextNode("");
        PRE_TAG.appendChild(node);
        offset = 0;
    }
    return { 'node': node, 'offset': offset };
}
