import js.Lib;
import js.Browser;
import js.html.*;

import CodeEditor;
import Def;

class ContextMenu
{
    public var _ELEM_ = Browser.document.createMenuElement();

    var editor: CodeEditor;

    var menu_items: Array<ButtonElement> = [];
    //var menu_items_enabled: Array<ButtonElement> = [];
    var menu_items_enabled: Array<Element> = [];

    static var KEY = {
        UP_ARROW: 38,
        DOWN_ARROW: 40
    };

    // Properties

    /*
     * Visibility.
     */
    public var visible(get, set): Bool;
    
    function get_visible(): Bool
    {
        return (_ELEM_.style.visibility == "visible") ? true : false;
    }

    function set_visible(value: Bool): Bool
    {
        if (value) {
            _ELEM_.style.visibility = "visible";
            _ELEM_.focus();
        } else {
            _ELEM_.style.visibility = "hidden";
        }
        return value;
    }

    // Rectange

    public var rect(get, null): DOMRect;

    function get_rect(): DOMRect
    {
        return _ELEM_.getBoundingClientRect();
    }

    /*
     * Width
     */
    public var width(get, null): Float;

    function get_width(): Float
    {
        return _ELEM_.clientWidth;
    }

    /*
     * Height
     */
    public var height(get, null): Float;

    function get_height(): Float
    {
        return _ELEM_.clientHeight;
    }

    /*
     * Top.
     */
    public var top(null, set): Float;

    function get_top(): Float
    {
        return _ELEM_.getBoundingClientRect().top;
    }

    function set_top(value: Float): Float
    {
        var rect = editor.getRect();
        _ELEM_.style.top = Std.string(value - rect.top) + "px";
        return value;
    }

    /*
     * Left
     */
    public var left(null, set): Float;

    function get_left(): Float
    {
        return _ELEM_.getBoundingClientRect().left;
    }

    function set_left(value: Float): Float
    {
        var rect = editor.getRect();
        _ELEM_.style.left = Std.string(value - rect.left) + "px";
        return value;
    }

    // Methods

    /*
     * New.
     */
    public function new(editor: CodeEditor)
    {
        this.editor = editor;
        //_ELEM_.setAttribute('id', "editor-menu");
        _ELEM_.setAttribute('tabindex', "0");
        //_ELEM_.onfocus = function () {Browser.alert("focus");}
        _ELEM_.onmousedown = function () {
            this.visible = false;
        }
        _ELEM_.onkeydown = function (event: KeyboardEvent) {
            var key: Int = event.keyCode;
            if (menu_items_enabled.length == 0 || (key != KEY.UP_ARROW && key != KEY.DOWN_ARROW)) {
                return;
            }
            var current_button = _ELEM_.querySelector('button:focus');
            if (current_button == null) {
                if (key == KEY.DOWN_ARROW) {
                    menu_items_enabled[0].focus();
                } else {
                    menu_items_enabled[menu_items_enabled.length - 1].focus();
                }
            } else {
                var current_button_index: Int = menu_items_enabled.indexOf(current_button);
                if (key == KEY.DOWN_ARROW) {
                    menu_items_enabled[(current_button_index + 1) % menu_items_enabled.length].focus();
                } else {
                    menu_items_enabled[(current_button_index > 0) ?
                        current_button_index - 1 : menu_items_enabled.length - 1].focus();
                }
            }
        }
    }

    public function addItem(name: String, label: String): Void
    {
        var button: ButtonElement = Browser.document.createButtonElement();
        button.name = name;
        button.textContent = label;
        //button.onmousemove = function (event: MouseEvent) {
        button.onmousemove = function (event: MouseEvent) {
            var button = cast(event.target, ButtonElement);
            if (!button.disabled) {
                button.focus();
            }
        }
        button.onmouseout = function (event: MouseEvent) {
            var button = cast(event.target, ButtonElement);
            //button.blur();
            _ELEM_.focus();
        }
        button.onmousedown = function (event) {
            var button = cast(event.target, ButtonElement);
            if (button.disabled) {
                event.stopPropagation();
            } else {
                button.parentElement.dispatchEvent(new CustomEvent('menu_action', {bubbles: true, detail: {action: button.name}}));
                //this.visible = false;
            }
        }
        button.onkeydown = function (event) {
            if (event.keyCode == 13) {
                event.target.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
            }
        };
        _ELEM_.appendChild(button);
        menu_items.push(button);
    }

    public function setItemLabel(name: String, label: String): Void
    {
        _ELEM_.querySelector('button[name="$name"]').textContent = label;
    }

    public function setEnabledItems(enabled_items: Array<String>): Void
    {
        //var menu_items = _ELEM_.getElementsByTagName('button');
        menu_items_enabled = [];
        for (button in menu_items) {
            if (enabled_items.indexOf(button.name) != -1) {
                button.disabled = false;
                menu_items_enabled.push(button);
            } else {
                button.disabled = true;
            }
        }
    }
}
