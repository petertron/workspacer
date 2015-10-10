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

    (function(){

        var __name__ = "__main__";


        var d, Settings, pg, BODY, SUBHEADING, CONTENTS, FORM, ed, replacement_actions, workspace_url, editor_url, directory_url, last_key_code, caret_moved, gutter_width, x_margin, y_margin, in_workspace, new_file, document_modified, syntax_highlighter, style_element1, style_element2, editor_height, editor_refresh_pending, editor_resize;
        d = document;
        Settings = Symphony.Extensions.Workspacer["settings"];
        pg = {};
        BODY = null;
        SUBHEADING = null;
        CONTENTS = null;
        FORM = null;
        ed = {};
        "\ned.OUTER\ned.LINE_NUMBERS\ned.MAIN\ned.MAIN_HIGHLIGHTER_STYLES\ned.MAIN_PRE\nEDITOR_MENU\ned.RESIZE_HANDLE\n";
        replacement_actions = null;
        workspace_url = null;
        editor_url = null;
        directory_url = null;
        last_key_code = null;
        caret_moved = false;
        gutter_width = 34;
        x_margin = 3;
        y_margin = 2;
        in_workspace = false;
        new_file = false;
        document_modified = false;
        syntax_highlighter = null;
        style_element1 = document.createElement("style");
        style_element1.type = "text/css";
        style_element2 = document.createElement("style");
        style_element2.type = "text/css";
        editor_height = 580;
        editor_refresh_pending = false;
        editor_resize = {
            "height": 580,
            "mouse_down": false,
            "pointer_y": null
        };
        "\n$(BODY)\n.mouseup(def(event):\n    editor_resize.mouse_down = False\n)\n.mouseleave(def(event):\n    editor_resize.mouse_down = False\n)\n\n    $('#editor-label')\n *    .click(def(event) {\n *        ed.MAIN.focus()\n *    })\n *\n";
        "\ndef ed.OUTER_onMouseDown(event):\n    if (event.which == 3 && $(EDITOR_MENU).is(':hidden')) {\n        event.preventDefault()\n        #event.stopPropagation()\n        $(EDITOR_MENU).trigger('openmenu', [event.clientX, event.clientY])\n        ed.MAIN_PRE.contentEditable = False\n";
        function EDITOR_MAIN_onFocusIn(event) {
            if (!$(ed.OUTER).hasClass("focus")) {
                $(ed.OUTER).addClass("focus");
            }
        }
        function EDITOR_MAIN_onFocusOut(event) {
            if ($(ed.OUTER).hasClass("focus")) {
                $(ed.OUTER).removeClass("focus");
            }
        }
        function EDITOR_LINE_NUMBERS_onMouseDown(event) {
            event.preventDefault();
            ed.MAIN.focus();
        }
        function EDITOR_MENU_onMenuOpen(event, mouse_x, mouse_y) {
            var ul, li, legend;
            if ($(self).is(":visible")) {
                event.stopPropagation();
                return;
            }
            ul = d.createElement("ul");
            li = d.createElement("li");
            legend = d.createTextNode("Undo");
            "\n        if (Textspace.undo_stack.length > 0):\n        li.className=\"active\"\n        $(li).data(\"action\", \"undo\")\n        legend.textContent = \"Undo \" + doings[$(Textspace.history).get(-1).action]\n\n    li.appendChild(legend)\n    ul.appendChild(li)\n    $(self)\n    .empty()\n    .append(ul)\n    .css('left', mouse_x)\n    .css('top', mouse_y)\n    .show()\n    .focus()\n\ndef EDITOR_MENU_onItemSelect(event):\n    event.preventDefault()\n    target = event.target\n    switch ($(target).data('action')) {\n        case \"undo\":\n            Textspace.undo()\n            break\n        case \"redo\":\n            Textspace.redo()\n            break\n";
        }
        function EDITOR_MENU_onFocusOut(event) {
            $(self).hide();
        }
        function saveDocument(event) {
            event.preventDefault();
            event.stopPropagation();
            if ($(ed.NAME_FIELD).val() === "") {
                return;
            }
            $.ajax({
                "type": "POST",
                "url": Symphony.Context.get("symphony") + "/extension/workspacer/ajax/" + Symphony.Context.get("env")["0"] + "/",
                "data": {
                    "xsrf": $("input[name=\"xsrf\"]").val(),
                    "ajax": "1",
                    "action[save]": "1",
                    "fields[existing_file]": $("#existing_file").val(),
                    "fields[dir_path]": $("#dir_path").val(),
                    "fields[dir_path_encoded]": $("#dir_path_encoded").val(),
                    "fields[name]": $("input[name=\"fields[name]\"]").val()
                },
                "dataType": "json",
                "error": function(xhr, msg, error) {
                    alert(error + " - " + msg);
                },
                "success": function(data) {
                    if (data.new_filename) {
                        $("input[name=\"fields[existing_file]\"]").val(data.new_filename);
                        $(SUBHEADING).text(data.new_filename);
                        history.replaceState({
                            "a": "b"
                        }, "", Symphony.Context.get("symphony") + "/workspace/editor/" + data.new_path_encoded);
                    }
                    $(pg.NOTIFIER).trigger("attach.notify", [ data.alert_msg, data.alert_type ]);
                    if ($("#form-actions").hasClass("new")) {
                        $("#form-actions").removeClass("new").addClass("edit");
                    }
                }
            });
        }
        $().ready(function() {
            var in_workspace, directory_url;
            pg.BODY = Symphony.Elements.body;
            pg.NOTIFIER = $(Symphony.Elements.header).find("div.notifier");
            pg.SUBHEADING = $("#symphony-subheading");
            pg.CONTENTS = Symphony.Elements.contents;
            pg.FORM = pg.CONTENTS.find("form");
            pg.NAME_FIELD = $(FORM).find("input[name=\"fields[name]\"]");
            pg.SAVING_POPUP = $("#saving-popup");
            in_workspace = $(BODY).hasClass("template") === false;
            if (in_workspace) {
                directory_url = Symphony.Context.get("symphony") + Symphony.Context.get("env")["page-namespace"] + "/" + $(FORM).find("input[name=\"fields[dir_path_encoded]\"]").attr("value");
            }
            ed.OUTER = $("#editor")[0];
            ed.LINE_NUMBERS = $("#editor-line-numbers")[0];
            ed.RESIZE_HANDLE = $("#editor-resize-handle")[0];
            ed.MAIN = $("#editor-main")[0];
            $(pg.BODY).mouseup(function(event) {
                editor_resize.mouse_down = false;
            }).mouseleave(function(event) {
                editor_resize.mouse_down = false;
            });
            $("#editor-label").click(function(event) {
                ed.MAIN.focus();
            });
            $(ed.OUTER).css("height", editor_resize.height + "px").on("contextmenu", function(event) {
                return false;
            });
            $(ed.LINE_NUMBERS).mousedown(ed.LINE_NUMBERS_onMouseDown);
            $(ed.RESIZE_HANDLE).mousedown(function(event) {
                editor_resize.mouse_down = true;
                editor_resize.pointer_y = event.pageY;
            }).mousemove(function(event) {
                if (editor_resize.mouse_down === false) {
                    return;
                }
                editor_resize.height += event.pageY - editor_resize.pointer_y;
                editor_resize.pointer_y = event.pageY;
                ed.OUTER.style.height = editor_resize.height + "px";
                ed.LINE_NUMBERS.style.height = ed.MAIN.clientHeight + "px";
            }).mouseleave(function(event) {
                editor_resize.mouse_down = false;
            });
            $(pg.NAME_FIELD).keydown(function(event) {
                var ajax_submit;
                if (event.which === 13) {
                    ajax_submit = true;
                }
                event.stopPropagation();
            });
            $("#form-actions input.new").click(saveDocument);
            $("#form-actions input.edit").click(saveDocument);
        });
        "\n    filename = None\n    ext = None\n\n    if in_workspace:\n        filename = $(ed.NAME_FIELD).val()\n        last_dot = filename.lastIndexOf(\".\")\n        if last_dot > 0:\n            ext = filename.slice(last_dot + 1)\n            syntax_highlighter = Symphony.Extensions.Workspacer.highlighters[ext]\n        else:\n            syntax_highlighter = None\n    else:\n        syntax_highlighter = Symphony.Extensions.Workspacer.highlighters.xsl\n";
        window.displayLineNumbers = function(num_lines, h) {
            var l;
            l = "";
            for (var i = 1; i <= num_lines; i++) {
                l += i + "<br>";
            }
            $(ed.LINE_NUMBERS).html(l).css("height", h + "px");
        };
    })();
})();
