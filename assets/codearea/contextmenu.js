const KEY = {
    UP_ARROW: 38,
    DOWN_ARROW: 40
};

export class ContextMenu extends HTMLElement
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
appearance: menulist;
background-color: white;
border: 1px solid rgba(0, 0, 0, .40);
outline: none;
}
context-menu button {
display: block;
padding: .4rem .5rem;
width: 100%;
-moz-appearance: menulist-button;
-moz-appearance: list;
/*-moz-appearance: inherit;*/
border-radius: 0;
border: none;
background-color: inherit;
text-align: left;
outline: none;
}
context-menu button:focus {
color: white;
background-color: #668abe;
}
`;
        this.appendChild(styles);

        this.open = false;
        this.menu_items = [];
        this.menu_items_enabled = [];

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
                this.dispatchEvent(new CustomEvent('menuaction', {bubbles: true, detail: {action: button.name}}));
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
}
