(function () {
    'use strict';

    class Stack
    {
        constructor()
        {
            this.stack = [];
        }

        // Accessors

        /*
         * Has items.
         */
        get hasItems()
        {
            return this.stack.length > 0;
        }

        getLength()
        {
            return this.stack.length;
        }

        push(item)
        {
            this.stack.push(item);
        }

        pop()
        {
            return this.stack.pop();
        }

        getItem(index)
        {
            return this.stack[index];
        }

        getItems()
        {
            return this.stack;
        }

        getLastItem()
        {
            return this.stack[this.stack.length - 1];
        }

        clear()
        {
            this.stack = [];
        }
    }

    class Insert
    {
        constructor (editor, title, cumulative = true)
        {
            this.editor = editor;
            let sel_range = editor.getSelectionRange();
            this.old_text = sel_range.toString();
            if (this.old_text) {
                sel_range.deleteContents();
            }
            this.new_text = '';
            this.cumulative = cumulative;
            this.position = editor.getCharPosFromRangeStart(editor.getCurrentSelectionRange());
        }

        addText(text)
        {
            let editor = this.editor;
            this.new_text += text;
            //let sel = this.editor.getSelection();
            let sel_range = this.editor.getSelectionRange();
            let start_node = sel_range.startContainer;
            let start_offset = sel_range.startOffset;
                //console.log(start_offset + ', ' + start_node.nodeValue);
            if (start_node.nodeType == 3) {
                /*let tc = start_node.textContent;
                let ntc = tc.substr(0, start_offset) + text + tc.substr(start_offset);
                start_node.textContent = ntc;*/
                start_node.insertData(start_offset, text);
            } else {
                //console.log(start_node);
                start_node.appendChild(new Text(text));
            }
            editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
            editor.timeoutStart();
        }

        static create(editor, new_text = null, title = 'insert', cumulative_allowed = true)
        {
            if (!new_text) return false;
            let instance = null;
            if (cumulative_allowed && !editor.timeoutExpired && editor.undoStackHasItems) {
                let last_item = editor.undoStackLastItem;
                if (last_item instanceof Insert && last_item.cumulative) {
                    instance = last_item;
                }
            }
            if (!instance) {
                instance = new Insert(editor, title, cumulative_allowed);
                editor.undoStackPush(instance);
            }
            instance.addText(new_text);
            editor.updateEditArea();
        }

        undo()
        {
            this.editor.replaceText(this.position, this.new_text.length, this.old_text);
            let end = this.old_text ? this.position + this.old_text.length : null;
            this.editor.setEditorRender([{start: this.position, end: end}]);
        }

        redo()
        {
            this.editor.replaceText(this.position, 0, this.new_text);
            this.editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
        }
    }

    class Delete
    {
        constructor (editor, title, cumulative = true)
        {
            this.editor = editor;
            this.removed_text = '';
            this.cumulative = cumulative;
        }

        static create(editor, title = 'delete', cumulative_allowed = true)
        {
            let selection = editor.getSelection();
            if (selection.getRangeAt(0).collapsed) {
                selection.modify('extend', 'backward', 'character');
                if (selection.toString().length == 0) {
                    return;
                }
            } else {
                cumulative_allowed = false;
            }
            let instance = null;
            if (cumulative_allowed && !editor.timeoutExpired && editor.undoStackHasItems) {
                let last_item = editor.undoStackLastItem;
                if (last_item instanceof Delete && last_item.cumulative) {
                    instance = last_item;
                }
            }
            if (!instance) {
                instance = new Delete(editor, title, cumulative_allowed);
                editor.undoStackPush(instance);
            }
            instance.doIt();
            editor.timeoutStart();
            editor.setEditorRender([{start: instance.position, end: null}]);
            return true;
        }

        doIt()
        {
            let selection = this.editor.getSelection();
            this.removed_text = selection.toString() + this.removed_text;
            selection.deleteFromDocument();
            this.position = this.editor.getRangeBeforeSelection().toString().length;
        }

        undo()
        {
            this.editor.replaceText(this.position, 0, this.removed_text);
            this.editor.setEditorRender([{start: this.position + this.removed_text.length, end: null}]);
        }

        redo()
        {
            this.editor.replaceText(this.position, this.removed_text.length, "");
            this.editor.setEditorRender([{start: this.position, end: null}]);
        }
    }

    class ForwardDelete
    {
        constructor (editor, title, cumulative = true)
        {
            this.editor = editor;
            this.removed_text = '';
            this.cumulative = cumulative;
        }

        static create(editor, title = 'delete', cumulative_allowed = true)
        {
            let selection = editor.getSelection();
            if (selection.getRangeAt(0).collapsed) {
                selection.modify('extend', 'forward', 'character');
                if (selection.toString().length == 0) {
                    return;
                }
            } else {
                cumulative_allowed = false;
            }
            let instance = null;
            if (cumulative_allowed && !editor.timeoutExpired && editor.undoStackHasItems) {
                let last_item = editor.undoStackLastItem;
                if (last_item instanceof ForwardDelete && last_item.cumulative) {
                    instance = last_item;
                }
            }
            if (!instance) {
                instance = new ForwardDelete(editor, title, cumulative_allowed);
                editor.undoStackPush(instance);
            }
            instance.doIt();
            editor.timeoutStart();
            editor.setEditorRender([{start: instance.position, end: null}]);
            return true;
        }

        doIt()
        {
            let selection = this.editor.getSelection();
            this.removed_text += selection.toString();
            selection.deleteFromDocument();
            this.position = this.editor.getRangeBeforeSelection().toString().length;
        }

        undo()
        {
            this.editor.replaceText(this.position, 0, this.removed_text);
            this.editor.setEditorRender([{start: this.position, end: null}]);
        }

        redo()
        {
            this.editor.replaceText(this.position, this.removed_text.length, "");
            this.editor.setEditorRender([{start: this.position + this.removed_text.length, end: null}]);
        }
    }

    const KEY = {
        UP_ARROW: 38,
        DOWN_ARROW: 40
    };

    class ContextMenu extends HTMLElement
    {
        /*
         * Visibility.
         */
        get open()
        {
            return (this.style.visibility == 'visible') ? true : false;
        }

        set open(isTrue)
        {
            if (isTrue) {
                this.style.visibility = 'visible';
                this.focus();
            } else {
                this.style.visibility = 'hidden';
            }
        }

        // Rectange

        get rect()
        {
            return this.getBoundingClientRect();
        }

        /*
         * Width
         */
        getwidth()
        {
            return this.clientWidth;
        }

        /*
         * Height
         */
        get height()
        {
            return this.clientHeight;
        }

        /*
         * Top.
         */
        get top()
        {
            return this.getBoundingClientRect().top;
        }

        set top(value)
        {
            //let rect = editor.getRect();
            //this.style.top = Std.string(value - rect.top) + "px";
            this.style.top = value.toString() + "px";
        }

        /*
         * Left
         */
        get left()
        {
            return this.getBoundingClientRect().left;
        }

        set left(value)
        {
            this.style.left = value.toString() + "px";
            //this.style.left = Std.string(value - rect.left) + "px";
        }

        /*
         * New.
         */
        constructor()
        {
            super();
            this.menu_items = [];
            this.menu_items_enabled = [];
            this.width = null;
        }

        // Lifecycle

        connectedCallback()
        {
            this.setAttribute('tabindex', "0");

            let styles = document.createElement('style');
            styles.textContent =
            `context-menu {
            position: fixed;
            display: block;
            appearance: auto;
            -moz-appearance: contextmenu;
            -webkit-appearance: menulist;
            background-color: white;
            border: 1px solid rgba(0, 0, 0, .40);
            outline: none;
        }
        context-menu button {
            display: block;
            padding: .5rem;
            width: 100%;
            /*-webkit-appearance: menulist-button;
            -moz-appearance: list;
            -moz-appearance: inherit;*/
            border-radius: 0;
            border: none;
            background-color: inherit;
            text-align: left;
            outline: none;
        }
        `;
            this.appendChild(styles);

            this.open = false;
            this.menu_items = [];
            this.menu_items_enabled = [];
            //this.onfocus = () {alert("focus");}
            /*this.onmousedown = () => {
                this.open = false;
            }*/

            this.onkeydown = (event) => {
                let key = event.keyCode;
                if (this.menu_items_enabled.length == 0 || (key != KEY.UP_ARROW && key != KEY.DOWN_ARROW)) {
                    return;
                }
                let current_button = this.querySelector('button:focus');
                if (current_button == null) {
                    if (key == KEY.DOWN_ARROW) {
                        this.menu_items_enabled[0].focus();
                    } else {
                        this.menu_items_enabled[this.menu_items_enabled.length - 1].focus();
                    }
                } else {
                    let current_button_index = this.menu_items_enabled.indexOf(current_button);
                    if (key == KEY.DOWN_ARROW) {
                        this.menu_items_enabled[(current_button_index + 1) % this.menu_items_enabled.length].focus();
                    } else {
                        this.menu_items_enabled[(current_button_index > 0) ?
                            current_button_index - 1 : this.menu_items_enabled.length - 1].focus();
                    }
                }
            };
        }

        // Methods

        /*
         * Add menu item
         */
        addItem(name, label)
        {
            let button = document.createElement('button');
            button.name = name;
            //button.textContent = translateContent(label);
            button.textContent = label;
            button.onmousemove = (event) => {
                let button = event.target;
                if (!button.disabled) {
                    button.focus();
                }
            };
            button.onmouseout = (event) => {
                this.focus();
            };
            button.onmousedown = (event) => {
                let button = event.target;
                if (button.disabled) {
                    event.stopPropagation();
                } else {
                    this.dispatchEvent(new CustomEvent('menu_action', {bubbles: true, detail: {action: button.name}}));
                    //this.visible = false;
                }
            };
            button.onkeydown = (event) => {
                if (event.keyCode == 13) {
                    event.target.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
                }
            };
            this.appendChild(button);
            this.menu_items.push(button);
        }

        setItemLabel(name, label)
        {
            this.querySelector(`button[name="${name}"]`).textContent = label;
        }

        setEnabledItems(enabled_items)
        {
            let menu_items = this.getElementsByTagName('button');
            this.menu_items_enabled = [];
            for (let i = 0; i < menu_items.length; i++) {
                let button = menu_items[i];
                if (enabled_items.indexOf(button.name) !== -1) {
                    button.disabled = false;
                    this.menu_items_enabled.push(button);
                } else {
                    button.disabled = true;
                }
            }
        }

        // Event handlers.
    }

    const TIMEOUT_PERIOD = 30000;


    class CodeArea extends HTMLElement
    {
        static get formAssociated() {
            return true;
        }

        get name() {
            return this.getAttribute('name');
        }

        get value() {
            return this.I.editArea.textContent;
        }

        set value(text) {
            this.renderText(text);
        }

        get form() {
            return this.I.form;
        }

        get type() {
            return this.localName;
        }

        get validity() {
            return this.I.validity;
        }

        get validationMessage() {
            return this.I.validationMessage;
        }

        get willValidate() {
            return this.I.willValidate;
        }

        get filename()
        {
            return (this.I.filename !== undefined) ? this.I.filename : null;
        }

        set filename(filename)
        {
            this.I.filename = filename;
            if (filename != null) {
                let dot_pos = filename.lastIndexOf(".");
                if (dot_pos != -1) {
                    let ext = filename.substr(dot_pos + 1);
                    //alert(this.I.highlighters[ext]);
                    if (this.I.highlighters[ext]) {
                        this.I.highlighter = this.I.highlighters[ext];
                        this.I.highlighterStyles.textContent = this.I.highlighter.stylesheet;
                        this.I.fileType = ext;
                    }
                }
            } else {
                this.I.highlighter = null;
            }
        }

        get undoStackLastItem()
        {
            return this.I.undo_stack.getLastItem();
        }

        //line_beginnings = [];
        //menu_items_enabled = [];


        constructor()
        {
            super();

            this.I = this.attachInternals();
            this.I.root = this.attachShadow({mode: 'closed', delegatesFocus: true});
        }


        // Lifecycle

        connectedCallback()
        {
            const I = this.I;
            I.settings = {};

            const default_settings = {
                'font-family': 'Monaco, monospace',
                'font-size': '9pt',
                'line-height': '138%',
                'indentation-width': '4',
                'indentation-method': 'spaces'
            };
            let value1;
            for (let [key, value] of Object.entries(default_settings)) {
                value1 = this.getAttribute(key);
                //console.log(`${key}: ${value} ~ ${value1}`);
                I.settings[key] = value1 ? value1 : value;
            }

            I.menu_home_top = 16;
            I.menu_home_left = 16;

            I.text_nodes = [];

            I.fileType = null;

            I.highlighters = {};
            I.highlighter = null;
            I.style_prefix;
            I.span_working_data = {};

            I.undo_stack = new Stack();
            I.redo_stack = new Stack();
            I.filename = null;
            I.last_date_now = 0;
            I.selection_to_set = null;

            this.style.display = 'block';
            this.style.position = 'relative';
            this.style.padding = '0';
            this.style.outline = 'none';

            customElements.define('context-menu', ContextMenu);

            const styles = document.createElement('style');
            const highlighterStyles = document.createElement('style');
            const container = this.createElementWithClass('div', 'container');
            const lineNumbers = this.createElementWithClass('pre', 'line-numbers');
            container.appendChild(lineNumbers);
            I.lineNumbers = lineNumbers;

            const editArea = this.createElementWithClass('pre', 'edit-area');
            container.appendChild(editArea);
            I.editArea = editArea;

            const menu = document.createElement('context-menu');

            styles.textContent =
`.container {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: transparent;
    overflow: hidden;
    outline: none;
}
.edit-area {
    position: absolute;
    box-sizing: border-box;
    top: 0;
    left: 4rem;
    right: 0;
    bottom: 0;
    overflow: scroll;
    padding: .3em .4em;
    margin: 0;
    white-space: pre;
    caret-color: black;
    outline: none;
    font-family: ${I.settings['font-family']};
    font-size: ${I.settings['font-size']};
    tab-size: ${I.settings['indentation-width']};
}
.line-numbers {
    position: absolute;
    box-sizing: border-box;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4rem;
    padding: .3em .4rem 0 0;
    margin: 0;
    border-right: 1px solid rgba(0, 0, 0, .25);
    text-align: right;
    color: #404040;
    overflow: hidden;
    -moz-user-select: none;
    user-select: none;
    pointer-events: none;
    font-family: ${I.settings['font-family']};
    font-size: ${I.settings['font-size']};
}
context-menu {
    width: 20rem;
}`    ;
            /*line_numbers.addEventListener('mousedown', (event) => {
                event.preventDefault();
                this.I.editArea.focus();
            });*/
            editArea.setAttribute('contenteditable', 'true');
            editArea.setAttribute('spellcheck', 'false');
            editArea.textContent = 'Initial text.';

            editArea.addEventListener('scroll', this.editAreaOnScroll.bind(this));
            editArea.addEventListener('mousedown', this.editAreaOnMouseDown.bind(this));
            editArea.addEventListener('keydown', this.editAreaOnKeyDown.bind(this));
            editArea.addEventListener('keypress', this.editAreaOnKeyPress.bind(this));
            editArea.addEventListener('keyup', this.editAreaOnKeyUp.bind(this));
            editArea.addEventListener('cut', this.editAreaOnCut.bind(this));
            editArea.addEventListener('paste', this.editAreaOnPaste.bind(this));
            //editArea.addEventListener('contextmenu', this.editorOnContextMenu.bind(this));

            //if(([8, 13, 32, 45, 46].indexOf(key) != -1) or (key >= 48 && key <= 90) or (key >= 163 && key <= 222))

            this.I.highlighterStyles = highlighterStyles;

            const root = this.I.root;
            root.appendChild(styles);
            root.appendChild(highlighterStyles);
            root.appendChild(container);

            menu.addItem('undo', 'Undo');
            menu.addItem('redo', 'Redo');
            menu.addItem('cut', 'Cut');
            menu.addItem('copy', 'Copy');
            menu.addItem("paste", "Paste");
            menu.addItem('delete', 'Delete');
            menu.addItem('selectAll', 'Select all');
            menu.top = 10;

            menu.left = 10;
            menu.open = false;
            menu.addEventListener('menu_action', this.editorOnMenuAction.bind(this));
            menu.addEventListener('blur', this.menuOnFocusOut.bind(this));
            //menu.addEventListener('keydown', this.menuOnKeyDown.bind(this));

            container.appendChild(menu);
            this._menu = menu;

            this.dispatchEvent(new Event('codeeditorready', {bubbles: true}));
        }

        attributeChangedCallback(name, old_value, new_value)
        {
                console.log(name);
            switch (name) {
                case "font_family":
                    this.I.lineNumbers.style.fontFamily = new_value;
                    this.I.editArea.style.fontFamily = new_value;
                case "font_size":
                    this.I.lineNumbers.style.fontSize = new_value;
                    this.I.editArea.style.fontSize = new_value;
                case "line_height":
                    this.I.lineNumbers.style.lineHeight = new_value;
                    this.I.editArea.style.lineHeight = new_value;
                case "indentation-width":
                    this.settings.indentation_width = parseInt(new_value);
                    //alert(new_value);
                    this.I.editArea.style.tabSize = new_value;
                    this.I.editArea.style['MSTabSize'] = new_value;
                    this.I.editArea.style['MozTabSize'] = new_value;
                    this.I.editArea.style['WebkitTabSize'] = new_value;
                case "indentation_method":
                    this.settings.indentation_method = new_value;
            }
        }

        formDisabledCallback(disabled) {
        }

        // This is called when the parent/owner form is reset
        formResetCallback() {
            this.I.setFormValue('');
        }

        // This is called when the browser wants to restore user-visible state
        formStateRestoreCallback(state, mode) {
            //
        }


        // Event handlers.

        /*onSelectionChange(event)
        {
            let edit_area = this.I.editArea;
            let selection = window.getSelection();
            if (!selection.isCollapsed) {
                //let anchor_pos = selection.anchorNode.compareDocumentPosition(this);
                let anchor_pos = this.compareDocumentPosition(selection.anchorNode);
                let focus_pos = this.compareDocumentPosition(selection.focusNode);
                //let focus_pos = selection.focusNode.compareDocumentPosition(this);
                //console.log(anchor_pos, focus_pos);
                if (anchor_pos & Node.DOCUMENT_POSITION_PRECEDING + Node.DOCUMENT_POSITION_FOLLOWING) {
                    if (focus_pos == 0) {// || (focus_pos & Node.DOCUMENT_POSITION_CONTAINS)) {
                        //selection.extend(this.I.last_focus_node, 0);
                    } else {
                        this.I.last_focus_node = selection.focusNode;
                    }
                }
            }
        }*/

        /*
         * Edit area focus event.
         */
        editorOnFocusIn(event)
        {
            this.className = 'focus';
            event.stopPropagation();
        }

        /*
         * Edit area focus event.
         */
        editAreaOnFocusIn(event)
        {
            this.className = 'focus';
        }

        /*
         * Edit area blur event.
         */
        editAreaOnFocusOut(event)
        {
            if (!this.contains(event.relatedTarget)) {
                this.className = null;
            }
            event.stopPropagation();
        }

        /*
         * Edit area scroll event;
         */
        editAreaOnScroll(event)
        {
            this.I.lineNumbers.style.top = `${-this.I.editArea.scrollTop}px`;
        };

        /*
         * Edit area mousedown event.
         */
        editAreaOnMouseDown(event)
        {
            if (this._menu.open) {
                event.preventDefault();
                if (event.buttons == 1) {
                    event.stopPropagation();
                    this._menu.open = false;
                }
                this.I.editArea.focus();
            }
            this.timeoutClear();
        }

        /*
         * Edit area keydown event.
         */
        editAreaOnKeyDown(event)
        {
            const I = this.I;
            if (event.keyCode == 27 && this._menu.open) {
                event.stopPropagation();
                this._menu.open = false;
            }
            //event.preventDefault();
            let sel = this.getSelection();
            let key = event.keyCode;
            //last_key_code = key;

            if (event.metaKey || event.ctrlKey) {
                if (event.key == "s") {
                    event.preventDefault();
                    event.stopPropagation();
                    this.dispatchEvent(new CustomEvent('save', {detail: {text: this.value}}));
                } else if (event.key == "y") {
                    event.preventDefault();
                    this.redo();
                } else if (event.key == "z") {
                    event.preventDefault();
                    this.undo();
                }
                return;
            }
            if (key == 8) {
                // Delete
                event.preventDefault();
                Delete.create(this);
            } else if (key == 9) {
                // Tab character
                event.preventDefault();
                if (I.settings['indentation-method'] == 'spaces') {
                    let current_range = sel.getRangeAt(sel.rangeCount - 1);
                    let range_before_selection = document.createRange();
                    range_before_selection.setStart(this.I.editArea, 0);
                    range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
                    let string = range_before_selection.toString();
                    let last_newline = string.lastIndexOf("\n");
                    if (last_newline != -1) {
                        string = string.substr(last_newline + 1);
                    }
                    let ind_width = parseInt(I.settings['indentation-width']);
                    let count = 0;
                    //let line_start = getLineStartPoint(current_range.startContainer, current_range.startOffset);
                    //let string = getTextBetweenPoints(line_start, new DocPoint(current_range.endContainer, current_range.endOffset));
                    // Count characters
                    for (let i = 0; i < string.length; i++) {
                        if (string.charAt(i) == "\t") {
                            count = count + ind_width - (count % ind_width);
                        } else {
                            count++;
                        }
                    }
                    let spaces = "";
                    for (let i = 0; i < (ind_width - (count % ind_width)); i++) {
                        spaces += " ";
                    }
                    Insert.create(this, spaces);
                } else {
                    Insert.create(this, "\t");
                }
            } else if (key == 13) {
                event.preventDefault();
                Insert.create(this, "\n", false);
            } else if (key == 46) {
                event.preventDefault();
                ForwardDelete.create(this);
                //this.timeoutStart();
            }
        }

        /*
         * Edit area keypress event.
         */
        editAreaOnKeyPress(event)
        {
            let key = event.key;
            if (key.length > 1) return;

            //let sel = this.getSelection();

            if (event.metaKey || event.ctrlKey) {
                if (key == "," || key == "<") {
                    event.preventDefault();
                } else if (key == "." || key == ">") {
                    event.preventDefault();
                    //Indent.create(this);
                } else if (key.toLowerCase() == "a") {
                    event.preventDefault();
                    this.selectAll();
                }
                return;
            }

            if (event.charCode < 32) {
                return;
            }
            Insert.create(this, key);
            event.preventDefault();
        }

        /*
         * Edit area keyup event.
         */
        editAreaOnKeyUp(event)
        {
            let key = event.keyCode;
            if (key >= 33 && key <= 40) {
                event.stopPropagation();
                this.timeoutClear();
                //var s = this.getSelection().getRangeAt(0);
                //alert(s.startContainer.childNodes.length + " ... " + s.startOffset);
            }
        }

        /*
         * Edit area cut event.
         */
        editAreaOnCut(event)
        {
            event.preventDefault();
            let sel_range = this.getSelectionRange();
            if (!sel_range.collapsed) {
                document.execCommand("copy");
                Delete.create(this, "cut", false);
            }
        }

        /*
         * Edit area paste event.
         */
        editAreaOnPaste(event)
        {
            event.preventDefault();
            let new_text = event.clipboardData.getData('text');
            if (new_text.length > 0) {
                Insert.create(this, new_text, "paste");
            }
        }

        /*
         * Editor context menu event.
         */
        editorOnContextMenu(event)
        {
            /*let el = document.querySelector('body');
            let style = window.getComputedStyle(this.I.editArea, '::selection');
            let color = style.getPropertyValue('background-color');
            alert(color);*/

            event.preventDefault();
            if (this._menu.open) {
                if (event.button == 2) {
                    this._menu.open = false;
                }
            } else {
                // Set enabled items.
                //let items_enabledthis.I.redo_stack = [];
                let items_enabled = [];
                if (this.undoStackHasItems) {
                    this._menu.setItemLabel("undo", `Undo ${this.I.undo_stack.getLastItem().title}`);
                    items_enabled.push("undo");
                } else {
                    this._menu.setItemLabel("undo", 'Undo');
                }
                if (this.I.redo_stack.hasItems) {
                    this._menu.setItemLabel("redo", `Redo ${this.I.redo_stack.getLastItem().title}`);
                    items_enabled.push("redo");
                } else {
                    this._menu.setItemLabel("redo", 'Redo');
                }
                let selection = this.getSelection();
                if (!selection.isCollapsed) {
                    items_enabled.push("cut");
                    items_enabled.push("copy");
                    items_enabled.push("paste");
                    items_enabled.push("delete");
                }
                items_enabled.push("selectAll");
                this._menu.setEnabledItems(items_enabled);

                if (event.button == 2) {
                    if (event.clientY + this._menu.height > window.innerHeight) {
                        this._menu.top = event.clientY - this._menu.height - 2;
                    } else {
                        this._menu.top = event.clientY + 2;
                    }
                    if (event.clientX + this._menu.width > window.innerWidth) {
                        this._menu.left = event.clientX - this._menu.width - 2;
                    } else {
                        this._menu.left = event.clientX + 2;
                    }
                } else {
                    this._menu.top = this.menu_home_top;
                    this._menu.left = this.menu_home_left;
                }
                this._menu.open = true;
                //alert("onk");
            }
        }

        editorOnMenuAction()
        {
            this._menu.open = false;
            this.I.editArea.focus();
            switch (event.detail.action) {
                case "undo":
                    this.I.editArea.focus();
                    window.setTimeout(this.undo.bind(this), 0);
                    break;
                case "redo":
                    window.setTimeout(this.redo.bind(this), 0);
                    break;
                case "cut":
                    document.execCommand('cut');
                    break;
                case "copy":
                    document.execCommand('copy');
                    break;
                case "paste":
                    this.I.editArea.focus();
                    document.execCommand('paste');
                    break;
                case "delete":
                    window.setTimeout(this.deleteSelection.bind(this), 0);
                    break;
                case "selectAll":
                    //editArea.focus();
                    window.setTimeout(this.selectAll.bind(this), 0);
                    break;
            }
        }

        updateEditArea()
        {
            let sel = this.getSelection();
            let range, node, span;
            if (sel.isCollapsed) {
                range = sel.getRangeAt(0);
                node = range.startContainer;
                //offset = range.startOffset;
                node = (node.nodeType == 3) ? node.parentNode : node;
                span = (node.nodeName == 'SPAN') ? node : node.closest('span');
            }
        }
    /*
        menu_onkeydown(event)
        {
            event.preventDefault();
            let key_code = event.keyCode;
            if (key_code == 27) {
                this.I.editArea.focus();
                this.visible = false;
                return;
            }
            if (key_code != 38 && key_code != 40) {
                return;
            }
            let button = this.querySelector('button:focus');
            let button_index = button ? menu_items_enabled.indexOf(button) : null;
            if (key_code == 38) {
                if (button && this.menu_items_enabled.length > 1) {
                    if (button_index == 0) {
                        button_index = this.menu_items_enabled.length;
                    }
                } else {
                    button_index = this.menu_items_enabled.length;
                }
                menu_items_enabled[button_index - 1].focus();
            } else if (key_code = 40) {
                if (button && this.menu_items_enabled.length > 1) {
                    if (button_index == this.menu_items_enabled.length - 1) {
                        button_index = -1;
                    }
                } else {
                    button_index = -1;
                }
                menu_items_enabled[button_index + 1].focus();
            }
        }
    */
        menuOnMouseDown(event)
        {
            this._menu.open = false;
            this.I.editArea.focus();
        }

        menuOnKeyDown(event)
        {
            event.preventDefault();
            let key_code = event.keyCode;
            if (key_code == 27) {
                this.I.editArea.focus();
                this._menu.open = false;
                return;
            }
            if (key_code != 38 && key_code != 40) {
                return;
            }
            let button = (event.target).querySelector('button:focus');
            let button_index = (button != null) ? this.menu_items_enabled.indexOf(button) : null;
            if (key_code == 38) {
                if (button != null && this.menu_items_enabled.length > 1) {
                    if (button_index == 0) {
                        button_index = this.menu_items_enabled.length;
                    }
                } else {
                    button_index = this.menu_items_enabled.length;
                }
                this.menu_items_enabled[button_index - 1].focus();
            } else if (key_code == 40) {
                if (button && this.menu_items_enabled.length > 1) {
                    if (button_index == this.menu_items_enabled.length - 1) {
                        button_index = -1;
                    }
                } else {
                    button_index = -1;
                }
                this.menu_items_enabled[button_index + 1].focus();
            }
        }

        menuOnFocusOut(event)
        {
            if (!this._menu.contains(event.relatedTarget)) {
                this._menu.open = false;
            }
            event.stopPropagation();
        }


        getRect()
        {
            return this.getBoundingClientRect();
        }

        createElementWithClass(name, class_name)
        {
            let element = document.createElement(name);
            element.className = class_name;
            return element;
        }
    /*
        trigger(element, event_name, params)
        {
            element.dispatchEvent(new CustomEvent(event_name, params ? params : null));
        }
    */
        getSelection()
        {
            let selection;
            try {
                selection = this.I.root.getSelection();
            } catch (e) {
                selection = window.getSelection();
            }
            return selection;
        }

        getSelectionRange()
        {
            let selection = this.getSelection();
            return selection.getRangeAt(selection.rangeCount - 1);
        }

        getCurrentSelectionRange()
        {
            let sel = this.getSelection();
            return (sel.rangeCount > 0) ? sel.getRangeAt(sel.rangeCount - 1) : null;
        }

        putFocus()
        {
            this.I.editArea.focus();
        }

        /*
         * Fill editor with highlighted text.
         */
        renderText(text = this.value)
        {
            const I = this.I;
            const editArea = I.editArea;
            /*if (!text) {
                text = this.value;
            }*/
            let frag = new DocumentFragment();
            let line_num_string = "1\n";
            if (typeof text == 'string' && text.length > 0) {
                let line_num = 2,
                    index = null,
                    offset = 0;
                while ((index = text.indexOf("\n", offset)) !== -1) {
                    line_num_string += line_num + "\n";
                    offset = index + 1;
                    line_num++;
                }
                if (I.highlighter) {
                    this.processSpanContents(frag, 'primary', text);
                } else {
                    frag.appendChild(new Text(text));
                }
            }
            frag.appendChild(document.createElement('br'));
            editArea.innerHTML = null;
            editArea.appendChild(frag);
            I.lineNumbers.textContent = line_num_string;
            //getTextNodes();
            //getLineBeginnings();
        }

        setEditorRender(selection)
        {
            //window.setTimeout(this.editorRender, 0, selection);
            this.selection_to_set = selection;
            requestAnimationFrame(this.editorRender.bind(this));
        }

        /*
         * Write updated content to this.
         */
        editorRender()
        {
            this.renderText();
            this.setSelection(this.selection_to_set);
        }

        /*
         * Create range.
         */
        createRange(start_node, start_offset, end_node, end_offset)
        {
            let range = document.createRange();
            range.setStart(start_node, start_offset);
            range.setEnd(end_node, end_offset);
            return range;
        }

        createRangeFromCharPoints(points)
        {
            let range_start = this.findNodeByPos(points.start);
            let range_end = this.findNodeByPos(points.end);
            return this.createRange(range_start.node, range_start.offset, range_end.node, range_end.offset);
        }

        getRangeBeforeSelection()
        {
            let current_range = this.getCurrentSelectionRange();
            let range_before_selection = document.createRange();
            range_before_selection.setStart(this.I.editArea, 0);
            range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
            return range_before_selection;
        }

        findNodeByPos(pos)
        {
            let node = null,
                offset = 0,
                found = false;

            let iterator = document.createNodeIterator(this.I.editArea, NodeFilter.SHOW_TEXT, null);//, false)
            while ((node = iterator.nextNode()) != null) {
                offset = pos;
                pos -= node.nodeValue.length;
                if (pos < 0) {
                    found = true;
                    break;
                }
            }
            //if (!found) alert('Not found')
            if (!found) {
                node = this.I.editArea;
                offset = this.I.editArea.childNodes.length - 1;
            }
            //if (!found) alert('Not found: ' + pos);
            return {node: node, offset: offset};
        }

        getTextBetweenPoints(start_point, end_point)
        {
            let range = document.createRange();
            range.setStart(start_point.node, start_point.offset);
            range.setEnd(end_point.node, end_point.offset);
            return range.toString();
        }

        getLineStartPoint(ref_node, ref_offset)
        {
            let pos = ref_node.nodeValue.substr(0, ref_offset).lastIndexOf("\n");
            if (pos > -1) {
                return {node: ref_node, offset: pos + 1};
            } else {
                let line_start = null;
                for (let i = this.line_beginnings.length - 1; i >= 0; i--) {
                    line_start = this.line_beginnings[i];
                    if (ref_node.compareDocumentPosition(line_start.node) == Node.DOCUMENT_POSITION_PRECEDING) {
                        break;
                    }
                }
                return line_start;
            }
        }

        getLineBeginnings()
        {
            let iterator = document.createNodeIterator(this.I.editArea, NodeFilter.SHOW_TEXT, null),
                node,
                offset,
                text_content,
                text_nodes = [],
                line_beginnings = [];
            while ((node = iterator.nextNode()) != null) {
                text_nodes.push(node);
                text_content = node.nodeValue;
                offset = -1;
                while ((offset = text_content.indexOf("\n", offset + 1)) != -1) {
                    line_beginnings.push({node: node, offset: offset});
                }
            }

            return {text_nodes: text_nodes, line_beginnings: line_beginnings};
        }

        getTextNodes()
        {
            let iterator = document.createNodeIterator(this.I.editArea, NodeFilter.SHOW_TEXT, null), //, false)
                node;
            while ((node = iterator.nextNode()) != null) {
            }
        }

        replaceText(position, length, new_text)
        {
            let where_start = this.findNodeByPos(position);
            let where_end = length > 0 ? this.findNodeByPos(position + length) : where_start;
            let range = this.createRange(where_start.node, where_start.offset, where_end.node, where_end.offset);
            range.deleteContents();
            if (new_text.length > 0) {
                range.insertNode(document.createTextNode(new_text));
            }
        }

        /*
         * Undo last action
         */
        undo()
        {
            if (this.I.undo_stack.hasItems) {
                let last_item = this.I.undo_stack.pop();
                last_item.undo();
                this.I.redo_stack.push(last_item);
                this.timeoutClear();
            }
        }

        /*
         * Redo last undo
         */
        redo()
        {
            if (this.I.redo_stack.hasItems) {
                let last_item = this.I.redo_stack.pop();
                last_item.redo();
                this.I.undo_stack.push(last_item);
            }
        }

        undoArrayAdd(item)
        {
            this.I.undo_stack.push(item);
            this.I.redo_stack.clear();
        }

        getCharPositionsFromRange(range)
        {
            let range_before = this.createRange(this.I.editArea, 0, range.startContainer, range.startOffset);
            let start_pos = range_before.toString().length;
            return {start: start_pos, end: start_pos + range.toString().length};
        }

        getCharPosFromRangeStart(range)
        {
            let range_before = this.createRange(this.I.editArea, 0, range.startContainer, range.startOffset);
            return range_before.toString().length;
        }

        setCaretPos(pos)
        {
            let where = this.findNodeByPos(pos);
            let sel = this.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.createRange(where.node, where.offset, where.node, where.offset));
        }

        setSelection(spans)
        {
            let sel = this.getSelection();
            sel.removeAllRanges();
            for (let i = 0; i < spans.length; i++) {
                let range = document.createRange();
                let where_start = this.findNodeByPos(spans[i].start);
                range.setStart(where_start.node, where_start.offset);
                if (spans[i].end) {
                    let where_end = this.findNodeByPos(spans[i].end);
                    range.setEnd(where_end.node, where_end.offset);
                } else {
                    range.setEnd(where_start.node, where_start.offset);
                }
                sel.addRange(range);
                this.I.editArea.focus();
            }
        }

        getSelectionPoints()
        {
            let output = [];
            let sel = this.getSelection();
            for (let i = 0; i < sel.rangeCount; i++) {
                let range = sel.getRangeAt(i);
                output.push(this.getRangePoints(range));
            }
            return output;
        }

        getRangePoints(range)
        {
            let range_before = document.createRange();
            range_before.setStart(this.I.editArea, 0);
            range_before.setEnd(range.startContainer, range.startOffset);
            let start = range_before.toString().length;
            return {start: start, end: start + range.toString().length};
        };

        indent(text_val)
        {
            //return text_val.replace(REGEXP_INS_TAB, "\n" + Def.TAB);
            return "bloan";
        }

        selectAll()
        {
            const editArea = this.I.editArea;
            let selection = this.getSelection();
            let range = document.createRange();
            range.setStart(editArea, 0);
            range.setEnd(editArea, editArea.childNodes.length - 1);
            selection.removeAllRanges();
            selection.addRange(range);
            editArea.focus();
        }

        deleteSelection()
        {
            Delete.create(this);
        }

        reset()
        {
            this.I.undo_stack.clear();
            this.I.redo_stack.clear();
            this.value = null;
        }

        addHighlighter(name, values)
        {
            this.I.highlighters[name] = values;
        }

        processSpanContents(parent_element, span_type, contents = null)
        {
            const span_working_data = this.I.span_working_data;
            span_working_data.current_parent = parent_element;
            let highlighter = this.I.highlighter;
            let regexp = highlighter.highlighting[span_type];
            if (regexp === undefined) {
                parent_element.appendChild(new Text(contents));
                return;
            }
            let match;
            let start_index = 0;
            while (match = regexp.exec(contents)) {
                let [span_type_2, contents_2] = Object.entries(match['groups']).find(function (entry) {
                    return entry[1] !== undefined;
                });
                if (contents_2) {
                    if (match.index > start_index) {
                        parent_element.appendChild(new Text(contents.substr(start_index, match.index - start_index)));
                    }
                    let span = document.createElement('span');
                    span.setAttribute('class', span_type_2);
                    let func = highlighter.functions[span_type_2];
                    if (func !== undefined) {
                        func.call(span_working_data, span, contents_2);
                    }
                    this.processSpanContents(span, span_type_2, contents_2);
                    parent_element.appendChild(span);
                }
                start_index = regexp.lastIndex;
            }
            if (start_index < contents.length) {
                parent_element.appendChild(new Text(contents.substr(start_index)));
            }
        }

        undoStackPush(object)
        {
            this.I.undo_stack.push(object);
            this.I.redo_stack.clear();
        }

        undoStackPop(object)
        {
            return this.I.undo_stack.pop();
        }

        get undoStackHasItems()
        {
            return this.I.undo_stack.hasItems;
        }

        timeoutStart()
        {
            this.I.last_date_now = Date.now();
        }

        timeoutClear()
        {
            this.I.last_date_now = 0;
        }

        get timeoutExpired()
        {
            return Date.now() > this.I.last_date_now + TIMEOUT_PERIOD;
        }

    }

    customElements.define('code-area', CodeArea);


    /*
    getCaretPosFromNode(node, offset) {
        let r = document.createRange();
        r.setStart(this.I.editArea, 0);
        r.setEnd(node, offset);
        let string = r.tostring();

        // Count newline characters;
        let row = 0,
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
            'col'.substr(pos).length
        };
    }
    */

    /*
    getEditorTextSlices()
    {
        let sel =this.getSelection().getRangeAt(sel.rangeCount - 1);
        let r = document.createRange();
        let slices = {
            before: '',
            selected: '',
            after: ''
        }
        r.setStart(this.I.editArea, 0)
        r.setEnd(sel.startContainer, sel.startOffset)
        slices.before = this.getTextFromRange(r)
        if (!sel.collapsed) {
            r.setStart(sel.startContainer, sel.startOffset)
            r.setEnd(sel.endContainer, sel.endOffset)
            slices.selected = this.getTextFromRange(r)
        }

        r.setStart(sel.endContainer, sel.endOffset)
        r.setEnd(this.I.editArea, this.I.editArea.childNodes.length)
        //r.setEnd(this.I.editArea.lastChild, this.I.editArea.lastChild.length)
        slices.after = getTextFromRange(r)
        return slices
    }
    */

    /*
    indentLine()
    {
        let sel =getSelection();
        let sel_start_node = sel.startContainer;
        let caret_offset = sel.startOffset;
        //alert(sel_start_node + " : " + caret_offset);
        let txt = sel_start_node.nodeValue;
        let sli = txt.slice(0, caret_offset);
        let pos = sli.lastIndexOf("\n");
        if (pos > -1) {
            if (txt.charAt(pos + 1) != "\n") {
                sel_start_node.insertData(pos + 1, "    ");
            }
            return;
        }

        let b;
        let n, o;
        let result_mask = Node.DOCUMENT_POSITION_FOLLOWING + Node.DOCUMENT_POSITION_CONTAINS;
        for (var i = this.line_beginnings.length - 1; i >= 0; i--) {
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

    indentBlock()
    {
        let sel =this.getSelection();
        let r0 = sel.getRangeAt(sel.rangeCount - 1);
        let sel_start_node = r0.startContainer;
        let sel_start_offset = r0.startOffset;
        let sel_end_node = r0.endContainer,
            sel_end_offset = r0.endOffset;
        let sel_start_text_node_num = text_nodes.indexOf(sel_start_node),
            sel_end_text_node_num = text_nodes.indexOf(sel_end_node),
            current_text_node_num = sel_start_text_node_num;
        let numba = sel_end_text_node_num = sel_start_text_node_num;
        let first_node_val = sel_start_node.nodeValue;
        let parts = [];

        if (!sel.isCollapsed) {
            if (sel_start_node == sel_end_node) {
                let text = r0.tostring();
                alert(text)
                let parts = text.split("\n");
                for (var i in parts) {
                    if (parts[i].length > 0) {
                        parts[i] = Def.TAB + parts[i];
                    }
                }

                //sel_start_node.replaceData(sel_start_offset, text.length, parts.join("\n"));
                //var new_content = indent(first_node_val.slice(text));
                let new_content = indent(text);
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
        let sli = first_node_val.slice(0, sel_start_offset);
        let pos = sli.lastIndexOf("\n");

        if (pos == -1) {
            do {
                current_text_node_num--;
                let n = text_nodes[current_text_node_num];
                let v = n.nodeValue;
                let last_eol = v.lastIndexOf("\n");
                if (last_eol > -1) {
                    n.insertData(last_eol + 1, Def.TAB);
                    break;
                }
            } while (current_text_node_num > 0);
        } else {
            if (first_node_val.charAt(pos + 1) != "\n") {
                sel_start_node.insertData(pos + 1, Def.TAB);
            }
        }

    }
    */

        /*selectAll()
        {
            let sel = this.getSelection();
            sel.selectAllChildren(this.I.editArea);
        }*/

    /*
        indentBlock()
        {
            getLineBeginnings();
            let sel =this.getSelection();
            let r0 = sel.getRangeAt(sel.rangeCount - 1);
            let sel_start_node = r0.startContainer;
            let sel_start_offset = r0.startOffset;
            let sel_end_node = r0.endContainer,
                sel_end_offset = r0.endOffset;
            let sel_start_text_node_num = text_nodes.indexOf(sel_start_node),
                sel_end_text_node_num = text_nodes.indexOf(sel_end_node),
                current_text_node_num = sel_start_text_node_num;
            let numba = sel_end_text_node_num = sel_start_text_node_num;
            let first_node_val = sel_start_node.nodeValue;
            let parts = [];

            if (sel.isCollapsed == true) {
                for (let i in (this.line_beginnings.length - 1)...0) {
                    let line_start = line_beginnings[i];
                    if (r0.comparePoint(line_start.node, line_start.offset) == 0) {
                        if (line_start.node.nodeValue.charAt(line_start.offset + 1) != "\n") {
                            line_start.node.insertData(line_start.offset + 1, Def.TAB);
                        }
                    }
                }
            }
            //range.comparePoint(node, offset);
            let sli = first_node_val.substring(0, sel_start_offset);
            let pos = sli.lastIndexOf("\n");

            if (pos == -1) {
                do {
                    current_text_node_num--;
                    let n = text_nodes[current_text_node_num];
                    let v = n.nodeValue;
                    let last_eol = v.lastIndexOf("\n");
                    if (last_eol > -1) {
                        n.insertData(last_eol + 1, Def.TAB);
                        break;
                    }
                } while (current_text_node_num > 0);
            } else {
                if (first_node_val.charAt(pos + 1) != "\n") {
                    sel_start_node.insertData(pos + 1, Def.TAB);
                }
            }
        }
    */

}());
