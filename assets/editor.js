(function($){var Textspace;
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
        var selection = EDITOR_MAIN.contentWindow.getSelection();
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
        r.setStart(EDITOR_MAIN_PRE, 0);
        r.setEnd(node, offset);
        var div = document.createElement('div');
        div.appendChild(r.cloneContents());
        return $(div).find('br').length + $(div).text().length;
    }
    function getEditorTextSlices() {
        var sel = EDITOR_MAIN.contentWindow.getSelection().getRangeAt(0), r = document.createRange(), slices = {
            'before': "",
            'selected': "",
            'after': ""
        };
        r.setStart(EDITOR_MAIN_PRE, 0);
        r.setEnd(sel.startContainer, sel.startOffset);
        slices.before = getTextFromRange(r);
        if (!sel.collapsed) {
            r.setStart(sel.startContainer, sel.startOffset);
            r.setEnd(sel.endContainer, sel.endOffset);
            slices.selected = getTextFromRange(r);
        }
        r.setStart(sel.endContainer, sel.endOffset);
        r.setEnd(EDITOR_MAIN_PRE, EDITOR_MAIN_PRE.childNodes.length);
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
    __.prototype = b.prototype;
    d.prototype = new __();
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
})(Actions || (Actions = {}));
/// <reference path="jquery.d.ts"/>
/// <reference path="Textspace.ts"/>
/// <reference path="Actions.ts"/>
var d = document;
var settings = Symphony.Extensions.Workspacer['settings'];
$.fn.appendText = function (text) {
    this.each(function () {
        $(this).append(d.createTextNode(text));
    });
};
$.fn.appendSpan = function (class_name, text) {
    this.each(function () {
        var span = d.createElement('span');
        span.className = class_name;
        span.appendChild(d.createTextNode(text));
        $(this).append(span);
    });
};
var BODY, NOTIFIER, CONTEXT, SUBHEADING, CONTENTS, FORM, NAME_FIELD, SAVING_POPUP;
var EDITOR_OUTER, EDITOR_LINE_NUMBERS, EDITOR_MAIN, EDITOR_MAIN_HIGHLIGHTER_STYLES, EDITOR_MAIN_PRE, EDITOR_MENU, EDITOR_RESIZE_HANDLE;
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
        EDITOR_MAIN_PRE.contentEditable = false;
    }
}
function EDITOR_MAIN_onFocusIn(event) {
    if (!($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).addClass('focus');
    }
}
function EDITOR_MAIN_onFocusOut(event) {
    if (($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).removeClass('focus');
        EDITOR_MAIN_PRE.contentEditable = "true";
    }
}
function EDITOR_LINE_NUMBERS_onMouseDown(event) {
    event.preventDefault();
    EDITOR_MAIN.focus();
}
function EDITOR_MAIN_onMouseUp(event) {
    Textspace.registerCaretPos();
}
function EDITOR_MAIN_onKeyDown(event) {
    var key = event.which;
    last_key_code = key;
    var char = String.fromCharCode(key);
    if (event.metaKey || event.ctrlKey) {
        switch (char.toLowerCase()) {
            case "s":
                event.preventDefault();
                $('input[name="action[save]"]').trigger('click');
                break;
            case "y":
                event.preventDefault();
                Textspace.redo();
                break;
            case "z":
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
        if (settings['indentation_method'] == "spaces") {
            var ind_width = settings['indentation_width'];
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
}
function EDITOR_MAIN_onKeyPress(event) {
    if (event.metaKey || event.ctrlKey)
        return;
    var key = event.which;
    if (key < 32)
        return;
    var char = String.fromCharCode(key);
    event.preventDefault();
    Textspace.action("InsertChar", char);
}
function EDITOR_MAIN_onKeyUp(event) {
    var key = event.which;
    if (key >= 33 && key <= 40) {
        Textspace.registerCaretPos();
    }
}
function EDITOR_MAIN_onCut(event) {
    Textspace.action("Delete");
}
function EDITOR_MAIN_onPaste(event) {
    event.preventDefault();
    var pasted = event.originalEvent.clipboardData.getData('text');
    Textspace.action("Paste", event.originalEvent.clipboardData.getData('text'));
}
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
function EDITOR_MENU_onItemSelect(event) {
    event.preventDefault();
    var target = event.target;
    switch ($(target).data('action')) {
        case "undo":
            Textspace.undo();
            break;
        case "redo":
            Textspace.redo();
            break;
    }
}
function EDITOR_MENU_onFocusOut(event) {
    $(this).hide();
}
function saveDocument(event) {
    if (!ajax_submit)
        return;
    event.preventDefault();
    if ($(NAME_FIELD).val() == '')
        return;
    $.ajax({
        'type': 'POST',
        'url': Symphony.Context.get('symphony') + '/extension/workspacer/ajax/'
            + Symphony.Context.get('env')['0'] + '/',
        'data': {
            'xsrf': $('input[name="xsrf"]').val(),
            'ajax': '1',
            'action[save]': '1',
            'fields[existing_file]': $('#existing_file').val(),
            'fields[dir_path]': $('#dir_path').val(),
            'fields[dir_path_encoded]': $('#dir_path_encoded').val(),
            'fields[name]': $('input[name="fields[name]"]').val(),
            'fields[body]': Textspace.text
        },
        'dataType': 'json',
        'error': function (xhr, msg, error) {
            alert(error + " - " + msg);
        },
        'success': function (data) {
            if (data.new_filename) {
                $('input[name="fields[existing_file]"]').val(data.new_filename);
                $(SUBHEADING).text(data.new_filename);
                history.replaceState({ 'a': 'b' }, '', directory_url + data.new_filename_encoded + '/');
            }
            if (replacement_actions) {
                $(FORM).find('div.actions').replaceWith(replacement_actions);
                replacement_actions = null;
            }
            $(NOTIFIER).trigger('attach.notify', [data.alert_msg, data.alert_type]);
            setHighlighter();
        }
    });
}
$().ready(function () {
    //if (window.getSelection() == undefined) return;
    BODY = Symphony.Elements.body;
    NOTIFIER = $(Symphony.Elements.header).find('div.notifier');
    SUBHEADING = $('#symphony-subheading');
    CONTENTS = Symphony.Elements.contents;
    FORM = (CONTENTS).find('form');
    NAME_FIELD = $(FORM).find('input[name="fields[name]"]');
    SAVING_POPUP = $('#saving-popup');
    replacement_actions = $(FORM).find('div[data-replacement-actions="1"]').detach();
    if (replacement_actions.length == 0)
        replacement_actions = null;
    ;
    in_workspace = ($(BODY).hasClass('template') == false);
    if (in_workspace) {
        directory_url = Symphony.Context.get('symphony')
            + Symphony.Context.get('env')['page-namespace'] + '/' + $(FORM).find('input[name="fields[dir_path_encoded]"]').attr('value');
    }
    Textspace.text = $('#text').text();
    EDITOR_OUTER = $('#editor')[0];
    EDITOR_LINE_NUMBERS = $('#editor-line-numbers')[0];
    EDITOR_RESIZE_HANDLE = $('#editor-resize-handle')[0];
    EDITOR_MAIN = $('#editor-main')[0];
    $(BODY)
        .mouseup(function (event) {
        editor_resize.mouse_down = false;
    })
        .mouseleave(function (event) {
        editor_resize.mouse_down = false;
    });
    $('#editor-label')
        .click(function (event) {
        EDITOR_MAIN.focus();
    });
    $(EDITOR_OUTER)
        .css('height', editor_resize.height + 'px')
        .mousedown(EDITOR_OUTER_onMouseDown)
        .mouseup(function (event) {
        EDITOR_MAIN_PRE.contentEditable = "true";
    })
        .on('contextmenu', function (event) {
        return false;
    });
    $(EDITOR_LINE_NUMBERS)
        .mousedown(EDITOR_LINE_NUMBERS_onMouseDown);
    $(EDITOR_MENU)
        .on('openmenu', EDITOR_MENU_onMenuOpen)
        .mouseup('li', EDITOR_MENU_onItemSelect)
        .focusout(EDITOR_MENU_onFocusOut);
    $(EDITOR_RESIZE_HANDLE)
        .mousedown(function (event) {
        editor_resize.mouse_down = true;
        editor_resize.pointer_y = event.pageY;
    })
        .mousemove(function (event) {
        if (editor_resize.mouse_down == false)
            return;
        editor_resize.height += event.pageY - editor_resize.pointer_y;
        editor_resize.pointer_y = event.pageY;
        EDITOR_OUTER.style.height = editor_resize.height + 'px';
        EDITOR_LINE_NUMBERS.style.height = EDITOR_MAIN.clientHeight + 'px';
    })
        .mouseleave(function (event) {
        editor_resize.mouse_down = false;
    });
    $(NAME_FIELD).keydown(function (event) {
        if (event.which == 13)
            ajax_submit = true;
        event.stopPropagation();
    });
    $(FORM)
        .click(function (event) {
        if (event.target.name == 'action[save]')
            ajax_submit = true;
        if (event.target.name == 'action[delete]')
            ajax_submit = false;
    })
        .submit(saveDocument);
});
$(document).on("editor-main-ready", function (event) {
    Textspace.text = $('#text').text();
    EDITOR_MAIN_HIGHLIGHTER_STYLES = $(EDITOR_MAIN.contentDocument.head).find('#highlighter-styles');
    setHighlighter();
    $(EDITOR_MAIN.contentWindow)
        .scroll(function (event) {
        $(EDITOR_LINE_NUMBERS).scrollTop($(EDITOR_MAIN.contentDocument).scrollTop());
    });
    $(EDITOR_MAIN.contentDocument.body)
        .mouseup(EDITOR_MAIN_onMouseUp)
        .keydown(EDITOR_MAIN_onKeyDown)
        .keypress(EDITOR_MAIN_onKeyPress)
        .keyup(EDITOR_MAIN_onKeyUp)
        .on('cut', EDITOR_MAIN_onCut)
        .on('paste', EDITOR_MAIN_onPaste)
        .on('dragstart', function (event) {
        event.preventDefault();
        return false;
    });
    EDITOR_MAIN_PRE = $(EDITOR_MAIN.contentDocument).find('pre')[0];
    EDITOR_MAIN_PRE.style.tabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.MozTabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.WebkitTabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.MsTabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.OTabSize = settings['indentation_width'];
    $(EDITOR_MAIN_PRE)
        .focusin(EDITOR_MAIN_onFocusIn)
        .focusout(EDITOR_MAIN_onFocusOut);
    renderText();
});
function createRange(start_node, start_offset, end_node, end_offset) {
    var range = d.createRange();
    range.setStart(start_node, start_offset);
    range.setEnd(end_node, end_offset);
    return range;
}
function setHighlighter() {
    var filename, ext;
    if (in_workspace) {
        filename = $(NAME_FIELD).val();
        var last_dot = filename.lastIndexOf(".");
        if (last_dot > 0) {
            ext = filename.slice(last_dot + 1);
            syntax_highlighter = Symphony.Extensions.Workspacer.highlighters[ext];
        }
        else
            syntax_highlighter = null;
    }
    else {
        syntax_highlighter = Symphony.Extensions.Workspacer.highlighters.xsl;
    }
    if (syntax_highlighter) {
        var styles = syntax_highlighter.stylesheet;
        var prefix = "." + syntax_highlighter.style_prefix;
        var css_string = "";
        for (var key in styles) {
            css_string += prefix + key + " {" + styles[key] + "} ";
        }
        $(EDITOR_MAIN_HIGHLIGHTER_STYLES).text(css_string);
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
    $(EDITOR_MAIN_PRE).empty();
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
        EDITOR_MAIN_PRE.appendChild(frag);
        num_lines = lines.length;
    }
    else {
        frag = d.createElement('span');
        frag.appendChild(d.createTextNode(""));
        EDITOR_MAIN_PRE.appendChild(frag);
        num_lines = 1;
    }
    var l = '';
    for (var i = 0; i < num_lines; i++) {
        l += ((i + 1) + "\n");
    }
    $(EDITOR_LINE_NUMBERS)
        .html(l + '<br>')
        .css('height', EDITOR_MAIN.contentDocument.body.clientHeight + 'px');
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
        range.setStart(EDITOR_MAIN_PRE.firstChild, 0);
        range.setEnd(EDITOR_MAIN_PRE.firstChild, 0);
    }
    var sel = EDITOR_MAIN.contentWindow.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
function findNodeByPos(pos) {
    var node, offset;
    var found;
    var iterator = EDITOR_MAIN.contentDocument.createNodeIterator(EDITOR_MAIN_PRE, NodeFilter.SHOW_TEXT, null, false);
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
        EDITOR_MAIN_PRE.appendChild(node);
        offset = 0;
    }
    return { 'node': node, 'offset': offset };
}})(jQuery);
