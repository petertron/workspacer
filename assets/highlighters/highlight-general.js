(function($) {
    var d = document;

    var COMMENT = 'GEN_comment',
        STRING = 'GEN_string';

    //var regex = {
    //}

    var stylesheet = {
        'comment': "color: #707070",
        'string': "color: #800400"
    };

    var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";

    function textSpan(type, text)
    {
        var s = d.createElement('span');
        s.className = type;
        s.appendChild(d.createTextNode(text));
        return s;
    }

    var highlighter = function(source_text)
    {
        if (source_text.length == 0) return null;

        var array_in = source_text.split(EOL),
            array_out = [],
            line_container;
        var block_length;

        for (var _i = 0; _i < array_in.length; _i++) {
            var line_in = array_in[_i];
            if (line_in) {
                frag = d.createDocumentFragment();
                do {
                    var first_char = line_in.charAt(0);
                    if (first_char == sgl_quote) {
                        block_length = line_in.indexOf(sgl_quote, 1) + 1;
                        if (block_length == 0) block_length = line_in.length;
                        frag.appendChild(textSpan(STRING, line_in.slice(0, block_length)));
                    }
                    else if (first_char == dbl_quote) {
                        var offset = 1;
                        var stop = false
                        do {
                            block_length = line_in.indexOf(dbl_quote, offset) + 1;
                            if (block_length > 1) {
                                if (line_in.charAt(block_length - 2) == "\\") {
                                    offset = block_length;
                                }
                                else break;
                            }
                            else {
                                block_length = line_in.length;
                                break;
                            }
                        } while (true);
                        frag.appendChild(textSpan(STRING, line_in.slice(0, block_length)));
                    }
                    else if (first_char == "/") {
                        if (line_in.charAt(1) == "/") {
                            block_length = line_in.indexOf(EOL, 2) + 1;
                            if (block_length == 0) block_length = line_in.length;
                            frag.appendChild(textSpan(COMMENT, line_in.slice(0, block_length)));
                        }
                        else if (line_in.charAt(1) == "*") {
                            block_length = line_in.indexOf("*/", 2) + 2;
                            if (block_length == 1) block_length = line_in.length;
                            frag.appendChild(textSpan(COMMENT, line_in.slice(0, block_length)));
                        }
                    }
                    else {
                        block_length = line_in.search(/(\'|\"|\/\/|\/\*|$)/);
                        frag.appendChild(document.createTextNode(line_in.slice(0, block_length)));
                    }
                    line_in = line_in.slice(block_length);
                } while (line_in.length > 0);
                array_out[_i] = frag;
            }
            else {
                array_out[_i] = d.createTextNode("");
            }
        }
        return array_out;
    }

    //Symphony.Extensions.Workspacer.highlighters['php'] = {
    Highlighters['php'] = {
        'style_prefix': "GEN_",
        'stylesheet': stylesheet,
        'highlight': highlighter
    };

})();

