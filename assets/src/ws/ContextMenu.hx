package ws;

import js.Lib;
import js.Browser;
import js.html.*;

import ws.CodeEditor;
import ws.Def;

import haxe.Template;
import symhaxe.html.component.SHComponent;

@:expose
@view('ws/ContextMenu.html')
class ContextMenu extends SHComponent
{
    var editor: CodeEditor;

    var menu_items: Array<ButtonElement>;
    //var menu_items_enabled: Array<ButtonElement> = [];
    var menu_items_enabled: Array<Element>;

    static var KEY = {
        UP_ARROW: 38,
        DOWN_ARROW: 40
    };

    // Properties

    /*
     * Visibility.
     */
    public var open(get, set): Bool;

    function get_open(): Bool
    {
        return this.visible;
    }

    function set_open(isTrue: Bool): Bool
    {
        if (isTrue) {
            this.visible = true;
            this.focus();
        } else {
            this.visible = false;
        }
        return isTrue;
    }

    // Rectange

    public var rect(get, null): DOMRect;

    function get_rect(): DOMRect
    {
        return this.getBoundingClientRect();
    }

    /*
     * Width
     */
    public var width(get, null): Float;

    function get_width(): Float
    {
        return this.clientWidth;
    }

    /*
     * Height
     */
    public var height(get, null): Float;

    function get_height(): Float
    {
        return this.clientHeight;
    }

    /*
     * Top.
     */
    public var top(null, set): Float;

    function get_top(): Float
    {
        return this.getBoundingClientRect().top;
    }

    function set_top(value: Float): Float
    {
        //var rect = editor.getRect();
        //this.style.top = Std.string(value - rect.top) + "px";
        this.style.top = Std.string(value) + "px";
        return value;
    }

    /*
     * Left
     */
    public var left(null, set): Float;

    function get_left(): Float
    {
        return this.getBoundingClientRect().left;
    }

    function set_left(value: Float): Float
    {
        this.style.left = Std.string(value) + "px";
        //this.style.left = Std.string(value - rect.left) + "px";
        return value;
    }

    /*
     * New.
     */
    public function new()
    {
        super();
    }

    // Lifecycle

    override public function createdCallback()
    {
        this.setAttribute('tabindex', "0");
        menu_items = [];
        menu_items_enabled = [];
        //this.onfocus = function () {Browser.alert("focus");}
        this.onmousedown = function () {
            this.open = false;
        }
        this.onkeydown = function (event: KeyboardEvent) {
            var key: Int = event.keyCode;
            if (menu_items_enabled.length == 0 || (key != KEY.UP_ARROW && key != KEY.DOWN_ARROW)) {
                return;
            }
            var current_button = this.querySelector('button:focus');
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

    // Methods

    /*
     * Add menu item
     */
    public function addItem(name: String, label: String): Void
    {
        var button: ButtonElement = Browser.document.createButtonElement();
        button.name = name;
        button.textContent = translateContent(label);
        button.onmousemove = function (event: MouseEvent) {
            var button = cast(event.target, ButtonElement);
            if (!button.disabled) {
                button.focus();
            }
        }
        button.onmouseout = function (event: MouseEvent) {
            var button = cast(event.target, ButtonElement);
            this.focus();
        }
        button.onmousedown = function (event: MouseEvent) {
            var button = cast(event.target, ButtonElement);
            if (button.disabled) {
                event.stopPropagation();
            } else {
                this.dispatchEvent(new CustomEvent('menu_action', {bubbles: true, detail: {action: button.name}}));
                //this.visible = false;
            }
        }
        button.onkeydown = function (event: KeyboardEvent) {
            if (event.keyCode == 13) {
                event.target.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
            }
        };
        this.appendChild(button);
        menu_items.push(button);
    }

    public function setItemLabel(name: String, label: String): Void
    {
        this.querySelector('button[name="$name"]').textContent = translateContent(label);
    }

    public function setEnabledItems(enabled_items: Array<String>): Void
    {
        //var menu_items = this.getElementsByTagName('button');
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
