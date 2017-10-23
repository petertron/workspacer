import js.html.Node;

class DocPoint
{
    public var node: Node;
    public var offset: Int;

    public function new(node: Node, offset: Int)
    {
        this.node = node;
        this.offset = offset;
    }
}