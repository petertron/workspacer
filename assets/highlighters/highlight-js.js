(function($) {
    var d = document;

    var COMMENT = 'JS_comment',
        STRING = 'JS_string',
        ESCAPE = 'JS_escape',
        NUMBER = 'JS_number',
        OBJECT_PART = 'JS_objectpart',
        KEYWORD1 = 'JS_keyword1',
        KEYWORD2 = 'JS_keyword2'

    var keywords1 = ('break case catch continue delete default do else eval for function if in '
        + 'instanceof new return super switch this throw try typeof var while with').split(' ');
    var keywords2 = 'false null true undefined'.split(' ');
    var style_prefix = "JS_";

    var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";

    var stylesheet = {
        "comment": "color: #808080",
        "string": "color: #901603",
        "escape": "color: #C08004",
        "object_part": "color: #024C78",
        "keyword1": "color: #020678",
        "keyword2": "color: #A6680C",
        "regexp_delimiter": "color: #007005",
        "number": "color: #A6680C",
        "hex": "color: #608004",
        "text": "color: black"
    }
/*
    var style_string = "";
    var hi = [];
    for (key in styles) {
        var style_class = style_prefix + key;
        hi[key.toUpperCase()] = style_class;
        style_string += "." + style_class + "{" + styles[key] + "} ";
    }
*/
    var highlighter = function(source_text) {
        if (source_text.length == 0) return null;

        var array_in = source_text.split(EOL),
        array_out = [];

        var match, match2, char1 = null, block, l;

        for (var _i = 0; _i < array_in.length; _i++) {
            var line_in = array_in[_i];
            if (line_in) {
                var line_container = d.createDocumentFragment();
                do {
                    match = /[\"\']|\/[\/ \*]?|\.?[a-z_$][a-z0-9_$\[\]]*|\d+\.?\d*|\.\d+|$/i.exec(line_in);
                    delimiter = match[0];
                    char1 = delimiter.charAt(0);
                    if(match.index > 0) {
                        $(line_container).appendText(line_in.slice(0, match.index));
                        line_in = line_in.slice(match.index);
                    }
                    //alert("Index = " + match.index + " ... Match = " + match[0])
                    if (delimiter == "//") {
                        match = /\n|$/.exec(line_in);
                        l = match.index + match[0].length;
                        $(line_container).appendSpan(COMMENT, line_in.slice(0, l));
                        line_in = line_in.slice(l);
                    }
                    else if (delimiter == "/*") {
                        match = /\*\/|$/.exec(line_in);
                        l = match.index + match[0].length;
                        $(line_container).appendSpan(COMMENT, line_in.slice(0, l));
                        line_in = line_in.slice(l);
                    }
                    else if (delimiter == sgl_quote || delimiter == dbl_quote) {
                        $(line_container).appendSpan(STRING, delimiter);
                        line_in = line_in.slice(1);
                        if (line_in.length > 0) {
                            var regex = (delimiter == sgl_quote) ? /\'|\\[bfnOrtv\'\"\\]|$/ : /\"|\\[bfnOrtv\'\"\\]|$/;
                            var finished = false;
                            while (!finished) {
                                match = regex.exec(line_in);
                                if (match.index > 0) {
                                    $(line_container).appendSpan(STRING, line_in.slice(0, match.index));
                                    line_in = line_in.slice(match.index);
                                }
                                if (match[0] == delimiter) {
                                    $(line_container).appendSpan(STRING, delimiter);
                                    line_in = line_in.slice(1);
                                    finished = true;
                                }
                                else if (match[0] !== "") {
                                    $(line_container).appendSpan(ESCAPE, match[0]);
                                    line_in = line_in.slice(match[0].length);
                                }
                                else finished = true;
                            }
                        }
                    }
                    /*else if(delimiter == "/") {
                        $(line_container).appendSpan('regexp_delimiter', delimiter);
                        line_in = line_in.slice(1);
                        if(source_text.length > 0) {
                            var finished = false;
                            while(!finished) {
                                match = /\\\S|\/[gimy]{0,4}|$/.exec(line_in);
                                if(match.index > 0) $(line_container).appendSpan('', line_in.slice(0, match.index));
                                var m = match[0];
                                if(m.charAt(0) == "/") {
                                    $(line_container).appendSpan('regexp_delimiter', m);
                                    finished = true;
                                }
                                else if(m.charAt(0) == "\\") {
                                    $(line_container).appendText(m);
                                }
                                line_in = line_in.slice(match.index + m.length);
                            }
                        }
                    }*/
                    else if (char1 == "." && delimiter.length > 1) {
                        var char2 = delimiter.charAt(1);
                        $(line_container).appendSpan((char2 >= "0" && char2 <= "9") ? NUMBER : OBJECT_PART, delimiter);
                        line_in = line_in.slice(delimiter.length);
                    }
                    else if (char1 >= "0" && char1 <= "9") {
                        $(line_container).appendSpan(NUMBER, delimiter);
                        line_in = line_in.slice(delimiter.length);
                    }
                    else if (delimiter !== "") {
                        var s = (delimiter.search(/[^a-z]/) == -1);
                        if(s && keywords1.indexOf(delimiter) > -1) {
                            $(line_container).appendSpan(KEYWORD1, delimiter);
                        }
                        else if(s && keywords2.indexOf(delimiter) > -1) {
                            $(line_container).appendSpan(KEYWORD2, delimiter);
                        }
                        else {
                            $(line_container).appendSpan('JS_text', delimiter);
                            //last_block_type = "variable";
                        }
                        line_in = line_in.slice(delimiter.length);
                    }
                } while (line_in.length > 0);

                array_out[_i] = line_container;
            }
            else {
                array_out[_i] = d.createTextNode("");
            }
        }
        return array_out;
    }

    //Symphony.Extensions.Workspacer.highlighters['js'] = {
    Highlighters['js'] = {
        'style_prefix': style_prefix,
        'stylesheet': stylesheet,
        'highlight': highlighter
    };
})();

//})(); //(jQuery.noConflict());

