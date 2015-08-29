(function ($) {
    "use strict";
    var d = document;

    var regexp = {
        'tag_start': /(<!--|<\?|<!\[CDATA\[|<\/?)/,
        'tag_end': /\/?>/,
        'xsl_tag_name': /^xsl:(apply-imports|apply-templates|attribute|attribute-set|call-template|choose|comment|copy-of|copy|decimal-format|element|fallback|for-each|if|import|include|key|message|namespace-alias|number|otherwise|output|param|preserve-space|processing-instruction|sort|strip-space|stylesheet|template|text|transform|value-of|variable|when|with-param)/,
        'html_tag_name': /^[a-zA-Z][a-zA-Z0-9:\-]*/,
        //'xsl_in_attr_val': /\{[^}]*\}/g,
        'xpath_in_attr_val_s': /(\'|\{[^\}]*\}|\{)/,
        'xpath_in_attr_val_d': /(\"|\{[^\}]*\}|\{)/,
        'xsl_variable': /\$[a-z][a-z0-9\-]*/ig,
        'string_in_xsl_attr_val': /\'[^\']*\'/g,
        'number_in_xsl_attr_val': /[0-9]+/g,
        'xml_tag_name': /(^<\/?)[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z0-9\-]*/,
        //'html_tag_name': /^<\/?[a-zA-Z]+[0-9]?/g,
        'entity': /\&([a-zA-Z]+|#[0-9]+)\;/g,
        'in_tag_delimiter': /(=|\"|\'|\/>|>)/
    };

    var stylesheet = {
        'xml_dec': "color: #0018A8",
        'text': "color: black",
        'entity': "color: #B05000",
        'delimiter': "color: #282828",
        'xsl_tag_name': "color: #005402",
        'xsl_variable': "font-style: italic; color: #60A004",
        'html_tag_name': "color: #000E7C",
        'attr_name': "color: #004C82",
        'attr_val': "color: #800400",
        'xpath_in_attr_val': "color: #460480",
        'xpath_attr_val': "color: #460480",
        'comment': "color: #606060",
        'cdata': "color: #B08000"
    };

    var style_prefix = "XSL_";

    var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";

    function textSpan(type, text)
    {
        var span = d.createElement('span');
        span.className = style_prefix + type;
        span.appendChild(d.createTextNode(text));
        return span;
    }

    function textSpanE(type, text)
    {
        var span = d.createElement('span'),
            entity,
            entity_style = style_prefix + "entity",
            re = regexp.entity,
            match,
            last_index = 0;
        span.className = style_prefix + type;
        re.lastIndex = last_index;
        while (match = re.exec(text)) {
            if (match.index > last_index) {
                span.appendChild(d.createTextNode(text.slice(last_index, match.index)));
            }
            entity = d.createElement('span');
            entity.className = entity_style;
            entity.appendChild(d.createTextNode(match[0]));
            span.appendChild(entity);
            last_index = re.lastIndex;
        }
        if (last_index < text.length) {
            span.appendChild(d.createTextNode(text.slice(last_index)));
        }
        return span;
    }


    var highlighter = function(source_text)
    {
        if (source_text.length == 0)
            return null;

        var array_in = source_text.split(EOL),
            array_out = [];
        var line_in = {
            text: null,
            find: function(to_find) {
                var pos = this.text.indexOf(to_find);
                if (pos > -1) {
                    return {
                        before: this.text.slice(0, pos),
                        found: to_find,
                        after: this.text.slice(pos + to_find.length)
                    };
                }
            },
            regMatch: function(re) {
                var match = re.exec(this.text);
                if (match) {
                    return {
                        'match': match,
                        'before': this.text.slice(0, match.index),
                        'found': match[0],
                        'after': this.text.slice(match.index + match[0].length)
                    };
                }
            },
        };

        var in_stack = {
            stack: [],
            add: function(title) {
                var obj = new Object();
                obj.title = title;
                this.stack.push(obj);
                return obj;
            },
            //revert() {
            revert: function() {
                this.stack.pop();
                return (this.stack.length > 0) ? this.stack[this.stack.length - 1] : null;
            }
        };

        var what_in,
            last_attr_name = null,
            match,
            seg;

        for (var _i = 0; _i < array_in.length; _i++) {

            if (array_in[_i].length > 0) {
                line_in.text = array_in[_i];
                var frag = d.createDocumentFragment();

                while (line_in.text) {
                    if (!what_in) {
                        // Not in tag.
                        if (seg = line_in.regMatch(regexp.tag_start)) {
                            if (seg.before)
                                frag.appendChild(textSpanE('text', seg.before));
                            switch (seg.found) {
                                case "<?":
                                    line_in.text = seg.found + seg.after;
                                    what_in = in_stack.add("xml_dec");
                                    break;

                                case "<!--":
                                    line_in.text = seg.found + seg.after;
                                    what_in = in_stack.add("comment");
                                    break;

                                case "<![CDATA[":
                                    frag.appendChild(textSpan('cdata', seg.found));
                                    line_in.text = seg.after;
                                    what_in = in_stack.add("cdata");
                                    break;

                                case "<":
                                case "</":
                                    what_in = in_stack.add("html_tag");
                                    what_in.closing = (seg.found[1] == "/");
                                    frag.appendChild(textSpan("delimiter", seg.found));
                                    line_in.text = seg.after;
                                    if (seg = line_in.regMatch(regexp.xsl_tag_name)) {
                                        what_in.title = "xsl_tag";
                                        frag.appendChild(textSpan("xsl_tag_name", seg.found));
                                        line_in.text = seg.after;
                                    } else if (seg = line_in.regMatch(regexp.html_tag_name)) {
                                        frag.appendChild(textSpan("html_tag_name", seg.found));
                                        line_in.text = seg.after;
                                    }
                                    break;
                            }
                        }
                        else {
                            frag.appendChild(textSpanE('text', line_in.text));
                            line_in.text = "";
                        }
                    }

                    /* In tag. */
                    else {
                        switch (what_in.title) {

                            case "attr_val":
                                if (seg = line_in.regMatch(
                                    (what_in.delimiter == sgl_quote)
                                    ? regexp.xpath_in_attr_val_s : regexp.xpath_in_attr_val_d
                                )) {
                                    if (seg.before) {
                                        frag.appendChild(textSpanE('attr_val', seg.before));
                                    }
                                    if (seg.found == what_in.delimiter) {
                                        frag.appendChild(textSpan('delimiter', seg.found));
                                        line_in.text = seg.after;
                                        what_in = in_stack.revert();
                                    }
                                    else if (seg.found == "{") {
                                        line_in.text = seg.found + seg.after;
                                        what_in.title = "invalid_attr_content";
                                    }
                                    else {
                                        frag.appendChild(textSpan('xpath_in_attr_val', seg.found));
                                        line_in.text = seg.after;
                                    }
                                }
                                else {
                                    frag.appendChild(textSpanE('attr_val', line_in.text));
                                    line_in.text = "";
                                }
                                break;

                            case "xpath_attr_val":
                                if (seg = line_in.regMatch(/"|'/)) {
                                    if (seg.before) {
                                        frag.appendChild(textSpanE('xpath_attr_val', seg.before));
                                    }
                                    frag.appendChild(textSpan('delimiter', seg.found));
                                    line_in.text = seg.after;
                                    if (seg.found == what_in.delimiter) {
                                        what_in = in_stack.revert();
                                    }
                                    else {
                                        what_in = in_stack.add("attr_val");
                                        what_in.delimiter = seg.found;
                                    }
                                }
                                else {
                                    frag.appendChild(textSpanE('xpath_attr_val', line_in.text));
                                    line_in.text = "";
                                }
                                break;

                            case "invalid_attr_content":
                                if (seg = line_in.find(what_in.delimiter)) {
                                    if (seg.before) {
                                        frag.appendChild(textSpan('text', seg.before));
                                    }
                                    frag.appendChild(textSpan('delimiter', seg.found));
                                    line_in.text = seg.after;
                                    what_in = in_stack.revert();
                                }
                                else {
                                    frag.appendChild(textSpan('text', line_in.text));
                                    line_in.text = "";
                                }
                                break;

                            case "xml_dec":
                                if (seg = line_in.find("?>")) {
                                    frag.appendChild(textSpan('xml_dec', seg.before + seg.found));
                                    line_in.text = seg.after;
                                    what_in = in_stack.revert();
                                }
                                else {
                                    frag.appendChild(textSpan('xml_dec', line_in.text));
                                    line_in.text = "";
                                }
                                break;

                            case "comment":
                                if (seg = line_in.find("-->")) {
                                    frag.appendChild(textSpan('comment', seg.before + seg.found));
                                    line_in.text = seg.after;
                                    what_in = in_stack.revert();
                                }
                                else {
                                    frag.appendChild(textSpan('comment', line_in.text));
                                    line_in.text = "";
                                }
                                break;

                            case "cdata":
                                if (seg = line_in.find("]]>")) {
                                    if (seg.before) {
                                        frag.appendChild(textSpan('text', seg.before));
                                    }
                                    frag.appendChild(textSpan('cdata', seg.found));
                                    line_in.text = seg.after;
                                    what_in = in_stack.revert();
                                }
                                else {
                                    frag.appendChild(textSpan('text', line_in.text));
                                    line_in.text = "";
                                }
                                break;

                            case "html_tag":
                            case "xsl_tag":
                                if (what_in.closing) {
                                    // Closing tag
                                    if (seg = line_in.find(">")) {
                                        if (seg.before)
                                            frag.appendChild(textSpan("text", seg.before));
                                        frag.appendChild(textSpan("delimiter", ">"));
                                        line_in.text = seg.after;
                                        what_in = in_stack.revert();
                                    }
                                    else {
                                        frag.appendChild(textSpan('text', line_in.text));
                                        line_in.text = "";
                                    }
                                }
                                else {
                                    // Opening tag
                                    if (seg = line_in.regMatch(regexp.in_tag_delimiter)) {
                                        if (seg.before) {
                                            frag.appendChild(textSpan('attr_name', seg.before));
                                            if (seg.before.trim())
                                                last_attr_name = seg.before.trim();
                                        }
                                        frag.appendChild(textSpan("delimiter", seg.found));
                                        line_in.text = seg.after;
                                        if (seg.found == ">" || seg.found == "/>") {
                                            what_in = in_stack.revert();
                                        }
                                        else if (seg.found == sgl_quote || seg.found == dbl_quote) {
                                            // Value delimiter found.
                                            if (what_in.title == "xsl_tag" && ["select", "match", "test"].indexOf(last_attr_name) > -1) {
                                                what_in = in_stack.add("xpath_attr_val");
                                            } else {
                                                what_in = in_stack.add("attr_val");
                                            }
                                            what_in.delimiter = seg.found;
                                        }
                                    }
                                    else {
                                        frag.appendChild(textSpan('attr_name', line_in.text));
                                        line_in.text = "";
                                    }
                                    break;
                                }
                        }
                    }
                }
                array_out[_i] = frag;
            }
            else {
                array_out[_i] = d.createTextNode("");
            }
        }

        return array_out;
    }

    Symphony.Extensions.Workspacer.highlighters['xsl'] = {
        'style_prefix': style_prefix,
        'stylesheet': stylesheet,
        'highlight': highlighter
    };

})(jQuery);

/*var highlight_xsl = '.XSL_xml_dec {color: #885820} .XSL_attr_name, .attr_name {color: #024C78} .XSL_xsl_tag {color: #007005} .XSL_xsl_attr_val, .XSL_xsl_in_attr_val {color: #460480} .XSL_xsl_variable {color: #3A0480; font-style: italic} .XSL_comment {color: #585858} .XSL_xml_tag {color: #065002} .XSL_html_tag {color: #020678} .XSL_attr_val, .XSL_string_in_xsl_attr_val {color: #901603} .XSL_number_in_xsl_attr_val {color: #B85004} .XSL_text, .XSL_cdata {color: #000} .XSL_amp {color: #9A7004} .XSL_delimiter {color: #777}';
*/