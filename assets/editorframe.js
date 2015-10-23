(function(){
    "use strict";
    var ՐՏ_Temp;
    function ՐՏ_Iterable(iterable) {
        if (Array.isArray(iterable) || iterable instanceof String || typeof iterable === "string") {
            return iterable;
        }
        return Object.keys(iterable);
    }
    function ՐՏ_bind(fn, thisArg) {
        var ret;
        if (fn.orig) {
            fn = fn.orig;
        }
        if (thisArg === false) {
            return fn;
        }
        ret = function() {
            return fn.apply(thisArg, arguments);
        };
        ret.orig = fn;
        return ret;
    }
    function range(start, stop, step) {
        var length, idx, range;
        if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
        }
        step = arguments[2] || 1;
        length = Math.max(Math.ceil((stop - start) / step), 0);
        idx = 0;
        range = new Array(length);
        while (idx < length) {
            range[idx++] = start;
            start += step;
        }
        return range;
    }
    function len(obj) {
        if (Array.isArray(obj) || typeof obj === "string") {
            return obj.length;
        }
        return Object.keys(obj).length;
    }
    function eq(a, b) {
        var i;
        "\n    Equality comparison that works with all data types, returns true if structure and\n    contents of first object equal to those of second object\n\n    Arguments:\n        a: first object\n        b: second object\n    ";
        if (a === b) {
            return true;
        }
        if (Array.isArray(a) && Array.isArray(b) || a instanceof Object && b instanceof Object) {
            if (a.constructor !== b.constructor || a.length !== b.length) {
                return false;
            }
            if (Array.isArray(a)) {
                for (i = 0; i < len(a); i++) {
                    if (!eq(a[i], b[i])) {
                        return false;
                    }
                }
            } else {
                var ՐՏ_Iter0 = ՐՏ_Iterable(a);
                for (var ՐՏ_Index0 = 0; ՐՏ_Index0 < ՐՏ_Iter0.length; ՐՏ_Index0++) {
                    i = ՐՏ_Iter0[ՐՏ_Index0];
                    if (!eq(a[i], b[i])) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }
    function ՐՏ_in(val, arr) {
        if (Array.isArray(arr) || typeof arr === "string") {
            return arr.indexOf(val) !== -1;
        } else {
            if (arr.hasOwnProperty(val)) {
                return true;
            }
            return false;
        }
    }
    function dir(item) {
        var arr;
        arr = [];
        for (var i in item) {
            arr.push(i);
        }
        return arr;
    }
    function ՐՏ_extends(child, parent) {
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
    }
    var ՐՏ_modules = {};
    ՐՏ_modules["Textspace"] = {};
    ՐՏ_modules["Actions"] = {};

    (function(){
        var __name__ = "Textspace";
        var $, Actions, PRE_TAG, selection, caret_positioned, undo_stack, redo_stack, _text, action, undo, redo;
        $ = window.parent.jQuery;
        Actions = ՐՏ_modules["Actions"];
        PRE_TAG = document.querySelector("pre");
        selection = {
            "start": null,
            "end": null,
            "collapsed": null
        };
        caret_positioned = false;
        undo_stack = [];
        redo_stack = [];
        function getSelection() {
            return selection;
        }
        _text = "";
        function getText() {
            return _text;
        }
        function setText(text) {
            _text = text;
        }
        action = function(action_name, new_text) {
            var action_class, last_item, add_to_stack, redo_stack;
            try {
                selection = getSelectionPoints();
                action_class = Actions[action_name];
                last_item = null;
                add_to_stack = true;
                if (undo_stack.length > 0 && !caret_positioned) {
                    last_item = undo_stack[undo_stack.length - 1];
                    if (last_item.isUpdatable() && last_item.getName() === action_name) {
                        last_item.update(new_text);
                        add_to_stack = false;
                    }
                }
                if (add_to_stack) {
                    undo_stack.push(new action_class(new_text));
                    redo_stack = [];
                }
                caret_positioned = false;
                $(document).trigger("refreshEditorDisplay");
            } catch (ՐՏ_Exception) {
                var error = ՐՏ_Exception;
                if (error) {
                    alert(error.name + " : " + error.message);
                }
            }
        };
        undo = function() {
            var last_item;
            if (undo_stack.length > 0) {
                last_item = undo_stack.pop();
                redo_stack.push(last_item);
                last_item.undo();
                $(document).trigger("refreshEditorDisplay");
            }
        };
        redo = function() {
            var last_item;
            if (redo_stack.length > 0) {
                last_item = redo_stack.pop();
                undo_stack.push(last_item);
                last_item.redo();
                $(document).trigger("refreshEditorDisplay");
            }
        };
        function setSelection(start, end) {
            end = end === undefined ? start : end;
            selection = {
                "start": start,
                "end": end,
                "collapsed": start === end
            };
        }
        function selectionCollapsed() {
            return selection.start === selection.end;
        }
        function textInsert(pos, new_text) {
            _text = _text.slice(0, pos) + new_text + _text.slice(pos);
        }
        function textRemove(pos) {
            var removed;
            removed = _text.slice(pos.start, pos.end);
            _text = _text.slice(0, pos.start) + _text.slice(pos.end);
            return removed;
        }
        function textReplace(pos, new_text) {
            _text = _text.slice(0, pos.start) + new_text + _text.slice(pos.end);
        }
        function replaceSelection(new_text) {
            var slices;
            slices = getEditorTextSlices();
            _text = slices.before + new_text + slices.after;
            return {
                "position": slices.before.length,
                "text": slices.selected
            };
        }
        function registerCaretPos() {
            selection = getSelectionPoints();
            caret_positioned = true;
        }
        function getSelectionPoints() {
            var sel, s0, start_node, start_offset;
            sel = window.getSelection();
            s0 = sel.getRangeAt(0);
            start_node = s0.startContainer;
            start_offset = s0.startOffset;
            return {
                "start": caretPosFromNode(start_node, start_offset),
                "end": caretPosFromNode(s0.endContainer, s0.endOffset),
                "collapsed": s0.collapsed
            };
        }
        function caretPosFromNode(node, offset) {
            var r, div;
            r = document.createRange();
            r.setStart(PRE_TAG, 0);
            r.setEnd(node, offset);
            div = document.createElement("div");
            div.appendChild(r.cloneContents());
            return $(div).find("br").length + $(div).text().length;
        }
        function getEditorTextSlices() {
            var sel, r, slices;
            sel = window.getSelection().getRangeAt(0);
            r = document.createRange();
            slices = {
                "before": "",
                "selected": "",
                "after": ""
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
        function getTextFromRange(range) {
            return range.toString();
        }
        "\ndef getTextFromRange(range):\n    div = document.createElement('div')\n    div.appendChild(range.cloneContents())\n    #breaks = div.getElementsByTagName('br')\n    #for JS('var i = breaks.length; i > 0; i--'):\n    #    div.replaceChild(document.createTextNode(\"\n\"), breaks[i - 1])\n    return div.textContent\n";
        ՐՏ_modules["Textspace"]["$"] = $;

        ՐՏ_modules["Textspace"]["Actions"] = Actions;

        ՐՏ_modules["Textspace"]["PRE_TAG"] = PRE_TAG;

        ՐՏ_modules["Textspace"]["selection"] = selection;

        ՐՏ_modules["Textspace"]["caret_positioned"] = caret_positioned;

        ՐՏ_modules["Textspace"]["undo_stack"] = undo_stack;

        ՐՏ_modules["Textspace"]["redo_stack"] = redo_stack;

        ՐՏ_modules["Textspace"]["_text"] = _text;

        ՐՏ_modules["Textspace"]["action"] = action;

        ՐՏ_modules["Textspace"]["undo"] = undo;

        ՐՏ_modules["Textspace"]["redo"] = redo;

        ՐՏ_modules["Textspace"]["getSelection"] = getSelection;

        ՐՏ_modules["Textspace"]["getText"] = getText;

        ՐՏ_modules["Textspace"]["setText"] = setText;

        ՐՏ_modules["Textspace"]["setSelection"] = setSelection;

        ՐՏ_modules["Textspace"]["selectionCollapsed"] = selectionCollapsed;

        ՐՏ_modules["Textspace"]["textInsert"] = textInsert;

        ՐՏ_modules["Textspace"]["textRemove"] = textRemove;

        ՐՏ_modules["Textspace"]["textReplace"] = textReplace;

        ՐՏ_modules["Textspace"]["replaceSelection"] = replaceSelection;

        ՐՏ_modules["Textspace"]["registerCaretPos"] = registerCaretPos;

        ՐՏ_modules["Textspace"]["getSelectionPoints"] = getSelectionPoints;

        ՐՏ_modules["Textspace"]["caretPosFromNode"] = caretPosFromNode;

        ՐՏ_modules["Textspace"]["getEditorTextSlices"] = getEditorTextSlices;

        ՐՏ_modules["Textspace"]["getTextFromRange"] = getTextFromRange;
    })();

    (function(){
        var __name__ = "Actions";
        var Textspace;
        Textspace = ՐՏ_modules["Textspace"];
        function Base() {
        }
        Base.prototype.getName = function getName(){
            var self = this;
            var results;
            results = /function (.{1,})\(/.exec((this).constructor.toString());
            return results && results.length > 1 ? results[1] : "";
        };
        Base.prototype.isUpdatable = function isUpdatable(){
            var self = this;
            return "update" in self;
        };

        function InsertChar() {
            InsertChar.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(InsertChar, Base);
        InsertChar.prototype.title = "insert";
        InsertChar.prototype.__init__ = function __init__(char){
            var self = this;
            var replaced;
            replaced = Textspace.replaceSelection(char);
            self.position = replaced.position;
            self.old_text = replaced.text;
            self.new_text = char;
            Textspace.setSelection(self.position + 1);
        };
        InsertChar.prototype.update = function update(char){
            var self = this;
            Textspace.textInsert(self.position + self.new_text.length, char);
            self.new_text += char;
            Textspace.setSelection(self.position + self.new_text.length);
        };
        InsertChar.prototype.undo = function undo(){
            var self = this;
            Textspace.textReplace({
                "start": self.position,
                "end": self.position + self.new_text.length
            }, self.old_text);
            Textspace.setSelection(self.position + self.old_text.length);
        };
        InsertChar.prototype.redo = function redo(){
            var self = this;
            Textspace.textReplace({
                "start": self.position,
                "end": self.position + self.old_text.length
            }, self.new_text);
            Textspace.setSelection(self.position + self.new_text.length);
        };

        function InsertLineBreak() {
            InsertLineBreak.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(InsertLineBreak, Base);
        InsertLineBreak.prototype.title = "insert line break";
        InsertLineBreak.prototype.__init__ = function __init__(){
            var self = this;
            var replaced;
            replaced = Textspace.replaceSelection("\n");
            self.position = replaced.position;
            self.old_text = replaced.text;
            Textspace.setSelection(self.position + 1);
        };
        InsertLineBreak.prototype.undo = function undo(){
            var self = this;
            Textspace.textReplace({
                "start": self.position,
                "end": self.position + 1
            }, self.old_text);
            Textspace.setSelection(self.position + self.old_text.length);
        };
        InsertLineBreak.prototype.redo = function redo(){
            var self = this;
            Textspace.textReplace({
                "start": self.position,
                "end": self.position + self.old_text.length
            }, "\n");
            Textspace.setSelection(self.position + 1);
        };

        function Delete() {
            Delete.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(Delete, Base);
        Delete.prototype.title = "delete";
        Delete.prototype.__init__ = function __init__(){
            var self = this;
            var slices;
            slices = Textspace.getEditorTextSlices();
            if (slices.selected) {
                self.old_text = slices.selected;
            } else {
                if (!slices.before) {
                    throw null;
                }
                self.old_text = slices.before.slice(-1);
                slices.before = slices.before.slice(0, -1);
            }
            Textspace.setText(slices.before + slices.after);
            self.position = slices.before.length;
            "sel = Textspace.selection\n        if sel.collapsed):\n        if sel.start == 0)\n        raise None\n        sel.end = sel.start\n        sel.start--\n        Textspace.selection.start = sel.start\n        }\n        self.position = sel.start\n        self.old_text = Textspace.textRemove(sel)";
            Textspace.setSelection(self.position);
        };
        Delete.prototype.update = function update(){
            var self = this;
            if (self.position === 0) {
                throw null;
            }
            self.position -= 1;
            self.old_text = Textspace.textRemove({
                "start": self.position,
                "end": self.position + 1
            }) + self.old_text;
            Textspace.setSelection(self.position);
        };
        Delete.prototype.undo = function undo(){
            var self = this;
            Textspace.textInsert(self.position, self.old_text);
            Textspace.setSelection(self.position + self.old_text.length);
        };
        Delete.prototype.redo = function redo(){
            var self = this;
            Textspace.textRemove({
                "start": self.position,
                "end": self.position + self.old_text.length
            });
            Textspace.setSelection(self.position);
        };

        function ForwardsDelete() {
            ForwardsDelete.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(ForwardsDelete, Base);
        ForwardsDelete.prototype.title = "forwards delete";
        ForwardsDelete.prototype.__init__ = function __init__(){
            var self = this;
            var sel;
            sel = Textspace.getSelection();
            if (sel.collapsed) {
                if (sel.start === Textspace.getText().length) {
                    throw null;
                }
                sel.end = sel.start + 1;
            }
            self.position = sel.start;
            self.old_text = Textspace.textRemove(sel);
            Textspace.setSelection(self.position);
        };
        ForwardsDelete.prototype.update = function update(){
            var self = this;
            if (Textspace.getSelection().start === Textspace.getText().length) {
                throw null;
            }
            self.old_text += Textspace.textRemove({
                "start": self.position,
                "end": self.position + 1
            });
            Textspace.setSelection(self.position);
        };
        ForwardsDelete.prototype.undo = function undo(){
            var self = this;
            Textspace.textInsert(self.position, self.old_text);
            Textspace.setSelection(self.position + self.old_text.length);
        };
        ForwardsDelete.prototype.redo = function redo(){
            var self = this;
            Textspace.textRemove({
                "start": self.position,
                "end": self.position + self.old_text.length
            });
            Textspace.setSelection(self.position);
        };

        function Cut() {
            Cut.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(Cut, Base);
        Cut.prototype.title = "cut";
        Cut.prototype.__init__ = function __init__(){
            var self = this;
            var pos;
            pos = Textspace.getSelection();
            self.position = pos.start;
            self.old_text = Textspace.textRemove(pos);
            Textspace.setSelection(pos.start, null);
        };
        Cut.prototype.undo = function undo(){
            var self = this;
            Textspace.textInsert(self.position, self.old_text);
            Textspace.setSelection(self.position + self.old_text.length);
        };
        Cut.prototype.redo = function redo(){
            var self = this;
            Textspace.textRemove({
                "start": self.position,
                "end": self.position + self.old_text.length
            });
            Textspace.setSelection(self.position);
        };

        function Paste() {
            Paste.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(Paste, Base);
        Paste.prototype.title = "paste";
        Paste.prototype.__init__ = function __init__(new_text){
            var self = this;
            var replaced;
            replaced = Textspace.replaceSelection(new_text);
            self.position = replaced.position;
            self.old_text = replaced.text;
            self.new_text = new_text;
            Textspace.setSelection(self.position + self.new_text.length);
        };
        Paste.prototype.undo = function undo(){
            var self = this;
            Textspace.textReplace({
                "start": self.position,
                "end": self.position + self.new_text.length
            }, self.old_text);
            Textspace.setSelection(self.position + self.old_text.length);
        };
        Paste.prototype.redo = function redo(){
            var self = this;
            Textspace.textReplace({
                "start": self.position,
                "end": self.position + self.old_text.length
            }, self.new_text);
            Textspace.setSelection(self.position + self.new_text.length);
        };

        function IndentRight() {
            IndentRight.prototype.__init__.apply(this, arguments);
        }
        ՐՏ_extends(IndentRight, Base);
        IndentRight.prototype.title = "indent right";
        IndentRight.prototype.__init__ = function __init__(){
            var self = this;
            var pos, slices, break_pos, selection_split, i;
            break_pos = 0;
            pos = Textspace.selection;
            self.position = pos.start;
            slices = Textspace.getEditorTextSlices();
            if (slices.before) {
                break_pos = slices.before.lastIndexOf("\n") + 1;
            }
            if (break_pos < slices.before.length) {
                slices.selected = slices.before.slice(break_pos) + slices.selected;
                slices.before = slices.before.slice(0, break_pos);
            }
            if (slices.selected.slice(-1) !== "\n") {
                break_pos = slices.after.indexOf("\n");
            }
            if (break_pos !== -1) {
                slices.selected += slices.after.slice(0, break_pos);
                slices.after = slices.after.slice(break_pos);
                self.old_text = slices.selected;
            }
            selection_split = slices.selected.split("\n");
            var ՐՏ_Iter1 = ՐՏ_Iterable(selection_split);
            for (var ՐՏ_Index1 = 0; ՐՏ_Index1 < ՐՏ_Iter1.length; ՐՏ_Index1++) {
                i = ՐՏ_Iter1[ՐՏ_Index1];
                selection_split[i] = "    " + selection_split[i];
                slices.selected = selection_split.join("\n");
                Textspace.text = slices.before + slices.selected + slices.after;
                Textspace.selection.end = null;
            }
            function undo(self) {
                Textspace.textInsert(self.position, self.old_text);
                Textspace.setSelection(self.position + self.old_text.length);
            }
            function redo(self) {
                Textspace.textRemove({
                    "start": self.position,
                    "end": self.position + self.old_text.length
                });
                Textspace.setSelection(self.position);
            }
        };

        ՐՏ_modules["Actions"]["Textspace"] = Textspace;

        ՐՏ_modules["Actions"]["Base"] = Base;

        ՐՏ_modules["Actions"]["InsertChar"] = InsertChar;

        ՐՏ_modules["Actions"]["InsertLineBreak"] = InsertLineBreak;

        ՐՏ_modules["Actions"]["Delete"] = Delete;

        ՐՏ_modules["Actions"]["ForwardsDelete"] = ForwardsDelete;

        ՐՏ_modules["Actions"]["Cut"] = Cut;

        ՐՏ_modules["Actions"]["Paste"] = Paste;

        ՐՏ_modules["Actions"]["IndentRight"] = IndentRight;
    })();

    (function(){

        var __name__ = "__main__";


        var $, Symphony, Context, BODY, PRE_TAG, last_key_code, caret_moved, x_margin, y_margin, in_workspace, new_file, document_modified, syntax_highlighter, editor_height, editor_refresh_pending, highlighter, prefix, styles, css_string, key, h, w;
        var Textspace = ՐՏ_modules["Textspace"];
        
        var Actions = ՐՏ_modules["Actions"];
        
        $ = window.parent.jQuery;
        Symphony = window.parent.Symphony;
        Context = Symphony.Context;
        BODY = document.body;
        PRE_TAG = document.querySelector("pre");
        last_key_code = null;
        caret_moved = false;
        x_margin = 3;
        y_margin = 2;
        in_workspace = !($(parent.document.body).data("0") === "template" || $(parent.document.body).hasClass("template"));
        new_file = null;
        document_modified = false;
        syntax_highlighter = null;
        editor_height = null;
        editor_refresh_pending = false;
        $(BODY).focusin(function(event) {
            $(parent.document).trigger("editor-focusin");
        }).focusout(function(event) {
            $(parent.document).trigger("editor-focusout");
        });
        $(document).scroll(function(event) {
            $(parent.document).trigger("editor-scrolltop", $(window).scrollTop());
        });
        $(PRE_TAG).mouseup(function(event) {
            Textspace.registerCaretPos();
        }).keydown(function(event) {
            var key, last_key_code, char, ind_width, slices, string, count;
            key = event.which;
            last_key_code = key;
            char = String.fromCharCode(key);
            if (event.metaKey || event.ctrlKey) {
                if (key === 37 && !Textspace.selection.collapsed) {
                    Textspace.action("IndentLeft");
                } else if (key === 39 && !Textspace.selection.collapsed) {
                    event.preventDefault();
                    Textspace.action("IndentRight");
                } else if (key === 83) {
                    event.preventDefault();
                    $(parent.document).trigger("save-doc");
                } else if (key === 89) {
                    event.preventDefault();
                    Textspace.redo();
                } else if (key === 90) {
                    event.preventDefault();
                    Textspace.undo();
                }
                return;
            }
            if (key === 8) {
                event.preventDefault();
                Textspace.action("Delete");
            } else if (key === 9) {
                event.preventDefault();
                if (Settings["indentation_method"] === "spaces") {
                    ind_width = Settings["indentation_width"];
                    slices = Textspace.getEditorTextSlices();
                    if (slices.before) {
                        string = slices.before.split("\n").pop();
                        count = 0;
                        for (var i = 0; i < string.length; i++) {
                            if (string[i] === "\t") {
                                count = count + ind_width - count % ind_width;
                            } else {
                                count += 1;
                            }
                        }
                    }
                    for (var i = 0; i < ind_width - (count % ind_width); i++) {
                        Textspace.action("InsertChar", " ");
                    }
                } else {
                    Textspace.action("InsertChar", "\t");
                }
            } else if (key === 13) {
                event.preventDefault();
                Textspace.action("InsertLineBreak");
            } else if (key === 46) {
                event.preventDefault();
                Textspace.action("ForwardsDelete");
            }
        }).keypress(function(event) {
            var key, char;
            if (event.metaKey || event.ctrlKey) {
                return;
            }
            key = event.which;
            if (key < 32) {
                return;
            }
            char = String.fromCharCode(key);
            event.preventDefault();
            Textspace.action("InsertChar", char);
        }).keyup(function(event) {
            var key;
            key = event.which;
            if (key >= 33 && key <= 40) {
                Textspace.registerCaretPos();
            }
        }).on("cut", function(event) {
            Textspace.action("Cut");
        }).on("paste", function(event) {
            event.preventDefault();
            Textspace.action("Paste", event.originalEvent["clipboardData"].getData("text"));
        });
        function EDITOR_OUTER_onMouseDown(event) {
            if (event.which === 3 && $(EDITOR_MENU).is(":hidden")) {
                event.preventDefault();
                $(EDITOR_MENU).trigger("openmenu", [ event.clientX, event.clientY ]);
                PRE_TAG.contentEditable = null;
            }
        }
        function EDITOR_MENU_onMenuOpen(event, mouse_x, mouse_y) {
            var ul, li, legend;
            if ($(this).is(":visible")) {
                event.stopPropagation();
                return;
            }
            ul = document.createElement("ul");
            li = document.createElement("li");
            legend = document.createTextNode("Undo");
            li.appendChild(legend);
            ul.appendChild(li);
            $(this).empty().append(ul).css("left", mouse_x).css("top", mouse_y).show().focus();
        }
        function EDITOR_MENU_onItemSelect(event) {
            var target, action;
            event.preventDefault();
            target = event.target;
            action = $(target).data("action");
            if (action = "undo") {
                Textspace.undo();
            } else if (action = "redo") {
                Textspace.redo();
            }
        }
        css_string = "";
        var ՐՏ_Iter2 = ՐՏ_Iterable(Highlighters);
        for (var ՐՏ_Index2 = 0; ՐՏ_Index2 < ՐՏ_Iter2.length; ՐՏ_Index2++) {
            h = ՐՏ_Iter2[ՐՏ_Index2];
            highlighter = Highlighters[h];
            prefix = "." + highlighter.style_prefix;
            styles = highlighter.stylesheet;
            var ՐՏ_Iter3 = ՐՏ_Iterable(styles);
            for (var ՐՏ_Index3 = 0; ՐՏ_Index3 < ՐՏ_Iter3.length; ՐՏ_Index3++) {
                key = ՐՏ_Iter3[ՐՏ_Index3];
                css_string += prefix + key + " {" + styles[key] + "} ";
                css_string += "\n";
            }
        }
        document.getElementById("highlighter-styles").textContent = css_string;
        Textspace.setText(window.doc_text);
        w = Settings["indentation_width"];
        PRE_TAG.style.tabSize = w;
        PRE_TAG.style.MozTabSize = w;
        PRE_TAG.style.WebkitTabSize = Settings["indentation_width"];
        PRE_TAG.style.MsTabSize = Settings["indentation_width"];
        PRE_TAG.style.OTabSize = Settings["indentation_width"];
        renderText();
        function createRange(start_node, start_offset, end_node, end_offset) {
            var range;
            range = document.createRange();
            range.setStart(start_node, start_offset);
            range.setEnd(end_node, end_offset);
            return range;
        }
        $(document).on("refreshEditorDisplay", function(event) {
            var editor_refresh_pending;
            if (!editor_refresh_pending) {
                setTimeout(rewriteEditorContents, 1);
                editor_refresh_pending = true;
            }
        });
        function setHighlighter() {
            var filename, last_dot, ext;
            if (in_workspace) {
                filename = $(parent.document).find("#existing_file").val();
                last_dot = filename.lastIndexOf(".");
                if (last_dot > 0) {
                    ext = filename.slice(last_dot + 1);
                    syntax_highlighter = Highlighters[ext];
                } else {
                    syntax_highlighter = null;
                }
            } else {
                syntax_highlighter = Highlighters.xsl;
            }
        }
        function rewriteEditorContents() {
            var editor_refresh_pending;
            renderText();
            setEditorSelection();
            editor_refresh_pending = false;
        }
        function renderText() {
            var sec, lines, frag, num_lines;
            setHighlighter();
            PRE_TAG.innerHTML = "";
            if (Textspace.getText()) {
                frag = document.createDocumentFragment();
                if (syntax_highlighter) {
                    lines = syntax_highlighter.highlight(Textspace.getText());
                    for (var _i = 0; _i < lines.length; _i++) {
                        sec = document.createElement("section");
                        if (lines[_i]) {
                            sec.appendChild(lines[_i]);
                        } else {
                            sec.appendChild(document.createTextNode(""));
                        }
                        if (_i < (lines.length - 1)) {
                            sec.appendChild(document.createTextNode("\n"));
                        } else {
                            sec.appendChild(document.createElement("br"));
                        }
                        frag.appendChild(sec);
                    }
                } else {
                    lines = Textspace.getText().split("\n");
                    for (var _i = 0; _i < lines.length;) {
                        frag.appendChild(document.createTextNode(lines[_i]));
                        if (++_i < lines.length) {
                            frag.appendChild(document.createTextNode("\n"));
                        }
                    }
                }
                PRE_TAG.appendChild(frag);
                num_lines = lines.length;
            } else {
                frag = document.createElement("span");
                frag.appendChild(document.createTextNode(""));
                PRE_TAG.appendChild(frag);
                num_lines = 1;
            }
            parent.window.displayLineNumbers(num_lines);
        }
        function setEditorSelection() {
            var range, pos, node_start, node_end, sel, el, rect, o;
            range = document.createRange();
            if (Textspace.getText()) {
                pos = Textspace.getSelection();
                node_start = findNodeByPos(pos.start);
                node_end = null;
                if (pos.end) {
                    node_end = findNodeByPos(pos.end);
                } else {
                    node_end = node_start;
                }
                range.setStart(node_start.node, node_start.offset);
                range.setEnd(node_end.node, node_end.offset);
            } else {
                range.setStart(PRE_TAG.firstChild, 0);
                range.setEnd(PRE_TAG.firstChild, 0);
            }
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            el = node_start.node.parentNode;
            if (el.nodeName.toLowerCase() !== "pre") {
                rect = el.getBoundingClientRect();
                o = rect.bottom - $(document.body).height();
                if (o > 0) {
                    $(window).scrollTop($(window).scrollTop() + Math.round(o));
                }
            }
        }
        function findNodeByPos(pos) {
            var iterator, found, node, offset;
            if (pos === 0) {
                node = PRE_TAG.firstChild;
                offset = 0;
            } else {
                iterator = document.createNodeIterator(PRE_TAG, NodeFilter.SHOW_TEXT, null, false);
                while (node = iterator.nextNode()) {
                    offset = pos;
                    if (node.nodeType === 3) {
                        pos -= node.length;
                    } else if (node.nodeName.toLowerCase() === "br") {
                        pos -= 1;
                    }
                    if (node.nodeValue === "\n") {
                        continue;
                    }
                    if (pos <= 0) {
                        found = node;
                        break;
                    }
                }
                if (!found) {
                    node = document.createTextNode("");
                    PRE_TAG.appendChild(node);
                    offset = 0;
                }
            }
            return {
                "node": node,
                "offset": offset
            };
        }
        window.getText = function() {
            return Textspace.getText();
        };
    })();
})();
