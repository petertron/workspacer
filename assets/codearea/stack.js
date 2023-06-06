export class Stack
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
