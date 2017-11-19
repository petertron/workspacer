package ws.editorpart;

class Stack
{
    var stack: Array<Dynamic> = [];

    public function new() {}

    // Accessors

    /*
     * Has items.
     */
    public var hasItems(get, null): Bool;

    function get_hasItems(): Bool
    {
        return this.stack.length > 0;
    }

    public function getLength(): Int {
        return this.stack.length;
    }

    public function push(item: Dynamic) {
        this.stack.push(item);
    }

    public function pop(): TextAction {
        return this.stack.pop();
    }

    public function getItem(index: Int): TextAction {
        return this.stack[index];
    }

    public function getItems() {
        return this.stack;
    }

    public function getLastItem(): TextAction {
        return this.stack[this.stack.length - 1];
    }

    public function clear() {
        this.stack = [];
    }
}
