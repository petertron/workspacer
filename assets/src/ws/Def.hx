package ws;

import js.html.Node;

class Def
{
    //@:const var EOL = "\n";
    public static var EOL: String = "\n";
    public static var TAB: String = "    ";
    //@:const var TAB = "    ";
}

typedef DocPoint = {
    var node: Node;
    var offset: Int;
}
