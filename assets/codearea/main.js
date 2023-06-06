import {Cut, Delete, ForwardDelete, Insert} from './actions.js';
import {ContextMenu} from './contextmenu.js';
import {Stack} from './stack.js';

const TIMEOUT_PERIOD = 30000;
const KEY = {
    UP_ARROW: 38,
    DOWN_ARROW: 40
};

class CodeArea extends HTMLElement
{
    static formAssociated = true;

    #root;
    #internals;

    #filename;
    #file_type;

    #undoStack = new Stack();
    #redoStack = new Stack();

    #editArea;
    #lineNumbers;
    #menu;

    #clipboard = '';
    #menu_home_top = 16;
    #menu_home_left = 16;

    #text_nodes = [];

    #settings = {};

    #highlighters = {};
    #highlighter = null;
    #highlighterStyles = [];
    #style_prefix;
    #span_working_data = {};

    #last_date_now = 0;
    #selectionToSet = null;

    /*static get formAssociated() {
        return true;
    }*/

    get name() {
        return this.getAttribute('name');
    }

    get value() {
        return this.#editArea.textContent;
    }

    set value(text) {
        this.renderText(text);
    }

    get form() {
        return this.#internals.form;
    }

    get type() {
        return this.localName;
    }

    get validity() {
        return this.#internals.validity;
    }

    get validationMessage() {
        return this.#internals.validationMessage;
    }

    get willValidate() {
        return this.#internals.willValidate;
    }

    get filename()
    {
        return this.#filename ?? null;
    }

    set filename(filename)
    {
        this.#filename = filename;
        if (filename != null) {
            let dot_pos = filename.lastIndexOf(".");
            if (dot_pos != -1) {
                let ext = filename.substr(dot_pos + 1);
                //alert(this.#highlighters[ext]);
                if (this.#highlighters[ext]) {
                    this.#highlighter = this.#highlighters[ext];
                    this.#highlighterStyles.textContent = this.#highlighter.stylesheet;
                    this.#file_type = ext;
                }
            }
        } else {
            this.#highlighter = null;
        }
    }

    get undoStackLastItem()
    {
        return this.#undoStack.getLastItem();
    }

    constructor()
    {
        super();

        this.#internals = this.attachInternals();
        this.#root = this.attachShadow({mode: 'closed', delegatesFocus: true});
    }


    // Lifecycle

    connectedCallback()
    {
        const default_settings = {
            'font-family': 'Monaco, monospace',
            'font-size': '8pt',
            'line-height': '150%',
            'indentation-width': '4',
            'indentation-method': 'spaces'
        };
        let value1;
        for (let [key, value] of Object.entries(default_settings)) {
            value1 = this.getAttribute(key);
            //console.log(`${key}: ${value} ~ ${value1}`);
            this.#settings[key] = value1 ? value1 : value;
        }

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
        this.#lineNumbers = lineNumbers;

        const editArea = this.createElementWithClass('pre', 'edit-area');
        container.appendChild(editArea);
        this.#editArea = editArea;

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
font-family: ${this.#settings['font-family']};
font-size: ${this.#settings['font-size']};
tab-size: ${this.#settings['indentation-width']};
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
font-family: ${this.#settings['font-family']};
font-size: ${this.#settings['font-size']};
}
context-menu {
width: 20rem;
}`    ;
        /*line_numbers.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.#editArea.focus();
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
        editArea.addEventListener('contextmenu', this.editorOnContextMenu.bind(this));

        //if(([8, 13, 32, 45, 46].indexOf(key) != -1) or (key >= 48 && key <= 90) or (key >= 163 && key <= 222))

        this.#highlighterStyles = highlighterStyles;

        const root = this.#root;
        root.appendChild(styles);
        root.appendChild(highlighterStyles);
        root.appendChild(container);

        menu.addItem('undo', 'Undo');
        menu.addItem('redo', 'Redo');
        menu.addItem('cut', 'Cut to local clipboard');
        menu.addItem('copy', 'Copy to local clipboard');
        menu.addItem("paste", "Paste from local clipboard");
        menu.addItem('delete', 'Delete');
        menu.addItem('selectAll', 'Select all');
        menu.top = 10;

        menu.left = 10;
        menu.open = false;
        menu.addEventListener('menuaction', this.editorOnMenuAction.bind(this));
        menu.addEventListener('blur', this.menuOnFocusOut.bind(this));
        //menu.addEventListener('keydown', this.menuOnKeyDown.bind(this));

        container.appendChild(menu);
        this.#menu = menu;

        /*editArea.addEventListener('rightclick', function (event) {
            event.preventDefault();
            alert("weeth");
            this.#menu.visible = true;
        });*/
        //this.addeventListener('rightclick')
        this.dispatchEvent(new Event('codeeditorready', {bubbles: true}));
    }

    attributeChangedCallback(name, old_value, new_value)
    {
            //console.log(name);
        switch (name) {
            case "font_family":
                this.#lineNumbers.style.fontFamily = new_value;
                this.#editArea.style.fontFamily = new_value;
            case "font_size":
                this.#lineNumbers.style.fontSize = new_value;
                this.#editArea.style.fontSize = new_value;
            case "line_height":
                this.#lineNumbers.style.lineHeight = new_value;
                this.#editArea.style.lineHeight = new_value;
            case "indentation-width":
                this.settings.indentation_width = parseInt(new_value);
                //alert(new_value);
                this.#editArea.style.tabSize = new_value;
                this.#editArea.style['MSTabSize'] = new_value;
                this.#editArea.style['MozTabSize'] = new_value;
                this.#editArea.style['WebkitTabSize'] = new_value;
            case "indentation_method":
                this.settings.indentation_method = new_value;
        }
    }

    formDisabledCallback(disabled) {
    }

    // This is called when the parent/owner form is reset
    formResetCallback() {
        this.#internals.setFormValue('');
    }

    // This is called when the browser wants to restore user-visible state
    formStateRestoreCallback(state, mode) {
        //
    }

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
        this.#lineNumbers.style.top = `${-this.#editArea.scrollTop}px`;
    };

    /*
        * Edit area mousedown event.
        */
    editAreaOnMouseDown(event)
    {
        if (this.#menu.open) {
            event.preventDefault();
            if (event.buttons == 1) {
                event.stopPropagation();
                this.#menu.open = false;
            }
            this.#editArea.focus();
        }
        this.timeoutClear();
    }

    /*
        * Edit area keydown event.
        */
    editAreaOnKeyDown(event)
    {
        const I = this.I;
        if (event.keyCode == 27 && this.#menu.open) {
            event.stopPropagation();
            this.#menu.open = false;
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
            Delete.perform(this);
        } else if (key == 9) {
            // Tab character
            event.preventDefault();
            if (this.#settings['indentation-method'] == 'spaces') {
                let current_range = sel.getRangeAt(sel.rangeCount - 1);
                let range_before_selection = document.createRange();
                range_before_selection.setStart(this.#editArea, 0);
                range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
                let string = range_before_selection.toString();
                let last_newline = string.lastIndexOf("\n");
                if (last_newline != -1) {
                    string = string.substr(last_newline + 1);
                }
                let ind_width = parseInt(this.#settings['indentation-width']);
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
                Insert.perform(this, spaces);
            } else {
                Insert.perform(this, "\t");
            }
        } else if (key == 13) {
            event.preventDefault();
            Insert.perform(this, "\n", false);
        } else if (key == 46) {
            event.preventDefault();
            ForwardDelete.perform(this);
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
                //Indent.perform(this);
            } else if (key.toLowerCase() == "a") {
                event.preventDefault();
                this.selectAll();
            }
            return;
        }

        if (event.charCode < 32) {
            return;
        }
        Insert.perform(this, key);
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
            Cut.perform(this, "cut");
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
            Insert.perform(this, new_text, "paste");
        }
    }

    /*
     * Editor context menu event.
     */
    editorOnContextMenu(event)
    {
/*        let style = window.getComputedStyle(this.#editArea, '::selection');
        let color = style.getPropertyValue('background-color');
*/
        event.preventDefault();
        if (this.#menu.open) {
            if (event.button == 2) {
                this.#menu.open = false;
            }
        } else {
            // Set enabled items.
            let items_enabled = [];
            if (this.undoStackHasItems) {
                this.#menu.setItemLabel("undo", `Undo ${this.#undoStack.getLastItem().title}`);
                items_enabled.push("undo");
            } else {
                this.#menu.setItemLabel("undo", 'Undo');
            }
            if (this.#redoStack.hasItems) {
                this.#menu.setItemLabel("redo", `Redo ${this.#redoStack.getLastItem().title}`);
                items_enabled.push("redo");
            } else {
                this.#menu.setItemLabel("redo", 'Redo');
            }
            let selection = this.getSelection();
            if (!selection.getRangeAt(0).collapsed) {
                items_enabled.push("cut");
                items_enabled.push("copy");
                //items_enabled.push("paste");
                items_enabled.push("delete");
            }
            if (this.#clipboard !== '') {
                items_enabled.push("paste");
            }
            items_enabled.push("selectAll");
            this.#menu.setEnabledItems(items_enabled);

            if (event.button == 2) {
                if (event.clientY + this.#menu.height > window.innerHeight) {
                    this.#menu.top = event.clientY - this.#menu.height - 2;
                } else {
                    this.#menu.top = event.clientY + 2;
                }
                if (event.clientX + this.#menu.width > window.innerWidth) {
                    this.#menu.left = event.clientX - this.#menu.width - 2;
                } else {
                    this.#menu.left = event.clientX + 2;
                }
            } else {
                this.#menu.top = 16; //this.menu_home_top;
                this.#menu.left = 16; //this.menu_home_left;
            }
            this.#menu.open = true;
        }
    }

    editorOnMenuAction(event)
    {
        this.#menu.open = false;
        this.#editArea.focus();
        switch (event.detail.action) {
            case "undo":
                this.#editArea.focus();
                window.setTimeout(this.undo.bind(this), 0);
                break;
            case "redo":
                window.setTimeout(this.redo.bind(this), 0);
                break;
            case "cut":
                this.copySelection();
                Cut.perform(this);
                break;
            case "copy":
                this.copySelection();
                break;
            case "paste":
                this.#editArea.focus();
                Insert.perform(this, this.clipboardText, 'paste', false);
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

    menuOnMouseDown(event)
    {
        this.#menu.open = false;
        this.#editArea.focus();
    }

    menuOnKeyDown(event)
    {
        event.preventDefault();
        let key_code = event.keyCode;
        if (key_code == 27) {
            this.#editArea.focus();
            this.#menu.open = false;
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
        if (!this.#menu.contains(event.relatedTarget)) {
            this.#menu.open = false;
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

    getSelection()
    {
        let selection;
        try {
            selection = this.#root.getSelection();
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
        this.#editArea.focus();
    }

    /*
        * Fill editor with highlighted text.
        */
    renderText(text = this.value)
    {
        const editArea = this.#editArea;
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
            if (this.#highlighter) {
                if (this.#highlighter.workingData !== undefined) {
                    this.#span_working_data = {...this.#highlighter.workingData};
                } else {
                    this.#span_working_data = {};
                }
                this.processSpanContents(frag, 'primary', text);
            } else {
                frag.appendChild(new Text(text));
            }
        }
        frag.appendChild(document.createElement('br'));
        editArea.innerHTML = null;
        editArea.appendChild(frag);
        this.#lineNumbers.textContent = line_num_string;
        //getTextNodes();
        //getLineBeginnings();
    }

    setEditorRender(selection)
    {
        //window.setTimeout(this.editorRender, 0, selection);
        this.#selectionToSet = selection;
        requestAnimationFrame(this.editorRender.bind(this));
    }

    /*
        * Write updated content to this.
        */
    editorRender()
    {
        this.renderText();
        this.setSelection(this.#selectionToSet);
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
        range_before_selection.setStart(this.#editArea, 0);
        range_before_selection.setEnd(current_range.startContainer, current_range.startOffset);
        return range_before_selection;
    }

    findNodeByPos(pos)
    {
        let node = null,
            offset = 0,
            found = false;

        let iterator = document.createNodeIterator(this.#editArea, NodeFilter.SHOW_TEXT, null);//, false)
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
            node = this.#editArea;
            offset = this.#editArea.childNodes.length - 1;
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
        let iterator = document.createNodeIterator(this.#editArea, NodeFilter.SHOW_TEXT, null),
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
        let iterator = document.createNodeIterator(this.#editArea, NodeFilter.SHOW_TEXT, null), //, false)
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
        if (this.#undoStack.hasItems) {
            let last_item = this.#undoStack.pop();
            last_item.undo();
            this.#redoStack.push(last_item);
            this.timeoutClear();
        }
    }

    /*
     * Redo last undo
     */
    redo()
    {
        if (this.#redoStack.hasItems) {
            let last_item = this.#redoStack.pop();
            last_item.redo();
            this.#undoStack.push(last_item);
        }
    }

    undoArrayAdd(item)
    {
        this.#undoStack.push(item);
        this.#redoStack.clear();
    }

    getCharPositionsFromRange(range)
    {
        let range_before = this.createRange(this.#editArea, 0, range.startContainer, range.startOffset);
        let start_pos = range_before.toString().length;
        return {start: start_pos, end: start_pos + range.toString().length};
    }

    getCharPosFromRangeStart(range)
    {
        let range_before = this.createRange(this.#editArea, 0, range.startContainer, range.startOffset);
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
            this.#editArea.focus();
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
        range_before.setStart(this.#editArea, 0);
        range_before.setEnd(range.startContainer, range.startOffset);
        let start = range_before.toString().length;
        return {start: start, end: start + range.toString().length};
    };

    indent(text_val)
    {
        //return text_val.replace(REGEXP_INS_TAB, "\n" + Def.TAB);
    }

    selectAll()
    {
        const editArea = this.#editArea;
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
        Delete.perform(this);
    }

    reset()
    {
        this.#undoStack.clear();
        this.#redoStack.clear();
        this.value = null;
    }

    addHighlighter(name, values)
    {
        this.#highlighters[name] = values;
    }

    processSpanContents(parent_element, span_type, contents = null)
    {
        const span_working_data = this.#span_working_data;
        span_working_data.current_parent = parent_element;
        let highlighter = this.#highlighter;
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
                if (highlighter.functions !== undefined) {
                    let func = highlighter.functions[span_type_2];
                    if (func !== undefined) {
                        func.call(span_working_data, span, contents_2);
                    }
                }
                this.processSpanContents(span, span.className, contents_2);
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
        this.#undoStack.push(object);
        this.#redoStack.clear();
    }

    undoStackPop(object)
    {
        return this.#undoStack.pop();
    }

    get undoStackHasItems()
    {
        return this.#undoStack.hasItems;
    }

    timeoutStart()
    {
        this.#last_date_now = Date.now();
    }

    timeoutClear()
    {
        this.#last_date_now = 0;
    }

    get timeoutExpired()
    {
        return Date.now() > this.#last_date_now + TIMEOUT_PERIOD;
    }

    copySelection()
    {
        this.#clipboard = this.getSelection().toString();
    }

    get clipboardText()
    {
        return this.#clipboard;
    }
}

customElements.define('code-area', CodeArea);
