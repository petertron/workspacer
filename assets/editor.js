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


        var d, Settings, el, ed, header_height, context_height, workspace_url, editor_url, directory_url, in_workspace, new_file, document_modified, syntax_highlighter, editor_refresh_pending;
        d = document;
        Settings = Symphony.Extensions.Workspacer["settings"];
        el = null;
        ed = {};
        header_height = null;
        context_height = null;
        workspace_url = null;
        editor_url = null;
        directory_url = null;
        in_workspace = false;
        new_file = false;
        document_modified = false;
        syntax_highlighter = null;
        editor_refresh_pending = false;
        "\ndef ed.OUTER_onMouseDown(event):\n    if (event.which == 3 && $(EDITOR_MENU).is(':hidden')) {\n        event.preventDefault()\n        #event.stopPropagation()\n        $(EDITOR_MENU).trigger('openmenu', [event.clientX, event.clientY])\n        ed.MAIN_PRE.contentEditable = False\n\ndef EDITOR_MENU_onMenuOpen(event, mouse_x, mouse_y):\n    if $(self).is(':visible'):\n        event.stopPropagation()\n        return\n    ul = d.createElement('ul')\n    li = d.createElement('li')\n    legend = d.createTextNode(\"Undo\")\n\n        if (Textspace.undo_stack.length > 0):\n        li.className=\"active\"\n        $(li).data(\"action\", \"undo\")\n        legend.textContent = \"Undo \" + doings[$(Textspace.history).get(-1).action]\n\n    li.appendChild(legend)\n    ul.appendChild(li)\n    $(self)\n    .empty()\n    .append(ul)\n    .css('left', mouse_x)\n    .css('top', mouse_y)\n    .show()\n    .focus()\n\ndef EDITOR_MENU_onItemSelect(event):\n    event.preventDefault()\n    target = event.target\n    switch ($(target).data('action')) {\n        case \"undo\":\n            Textspace.undo()\n            break\n        case \"redo\":\n            Textspace.redo()\n            break\n\ndef EDITOR_MENU_onFocusOut(event):\n    $(self).hide()\n";
        function saveDocument() {
            if ($(el.filename).val() === "") {
                return;
            }
            $.ajax({
                "type": "POST",
                "url": Symphony.Context.get("symphony") + "/extension/workspacer/ajax/" + Symphony.Context.get("env")["0"] + "/",
                "data": {
                    "xsrf": $("input[name=\"xsrf\"]").val(),
                    "action[save]": "1",
                    "fields[existing_file]": in_workspace ? $("#existing_file").val() : "",
                    "fields[dir_path]": $("#dir_path").val(),
                    "fields[dir_path_encoded]": $("#dir_path_encoded").val(),
                    "fields[name]": $(el.filename).val(),
                    "fields[body]": ed.MAIN.contentWindow.getText()
                },
                "dataType": "json",
                "error": function(xhr, msg, error) {
                    alert(error + " - " + msg);
                },
                "success": function(data) {
                    if (data.new_filename) {
                        $("input[name=\"fields[existing_file]\"]").val(data.new_filename);
                        $(el.subheading).text(data.new_filename);
                        history.replaceState({
                            "a": "b"
                        }, "", Symphony.Context.get("symphony") + "/workspace/editor/" + data.new_path_encoded);
                    }
                    $("div.notifier").trigger("attach.notify", [ data.alert_msg, data.alert_type ]);
                    if ($(el.body).hasClass("new")) {
                        $(el.body).removeClass("new").addClass("edit");
                    }
                    if (data.alert_type === "error") {
                        $(window).scrollTop(0);
                    }
                    setHeights();
                }
            });
        }
        $().ready(function() {
            var in_workspace, directory_url;
            el = Symphony.Elements;
            el.subheading = $("#symphony-subheading");
            el.filename = $("#filename");
            el.form = $(el.contents).find("form");
            header_height = $(el.header).height();
            context_height = $(el.context).height();
            in_workspace = $(el.body).data("0") !== "template";
            if (in_workspace) {
                directory_url = Symphony.Context.get("symphony") + Symphony.Context.get("env")["page-namespace"] + "/" + $(el.form).find("input[name=\"fields[dir_path_encoded]\"]").attr("value");
            }
            ed.OUTER = $("#editor")[0];
            ed.LINE_NUMBERS = $("#editor-line-numbers")[0];
            ed.MAIN = $("#editor-main")[0];
            $(window).resize(function(event) {
                setHeights();
            });
            $(document).on("editor-focusin", function(event) {
                if (!$(ed.OUTER).hasClass("focus")) {
                    $(ed.OUTER).addClass("focus");
                }
            }).on("editor-focusout", function(event) {
                if ($(ed.OUTER).hasClass("focus")) {
                    $(ed.OUTER).removeClass("focus");
                }
            }).on("editor-scrolltop", function(event, top) {
                ed.LINE_NUMBERS.scrollTop = top;
            }).on("save-doc", function(event) {
                saveDocument();
            }).scroll(function(event) {
                setEditorHeight();
            });
            $(ed.LINE_NUMBERS).scrollTop(0).mousedown(function(event) {
                event.preventDefault();
                ed.MAIN.focus();
            });
            $("input[name=\"action[save]\"]").click(function(event) {
                saveDocument();
            });
            Symphony.Utilities.requestAnimationFrame(setHeights);
        });
        window.displayLineNumbers = function(num_lines) {
            var l;
            l = "";
            for (var i = 1; i <= num_lines; i++) {
                l += i + "<br>";
            }
            $(ed.LINE_NUMBERS).html(l + "<br><br>");
        };
        function setHeights() {
            header_height = $(el.header).height() + $(el.nav).height();
            context_height = $(el.context).height();
            $(el.body).height($(window).height() + header_height);
            $(el.wrapper).height($(window).height() + header_height).css("overflow", "hidden");
            $(ed.OUTER).css("overflow", "hidden");
            setEditorHeight();
        }
        function setEditorHeight() {
            $(ed.OUTER).height($(window).height() - $("div.notifier").height() - header_height - context_height - 50 + $(window).scrollTop());
        }
    })();
})();
