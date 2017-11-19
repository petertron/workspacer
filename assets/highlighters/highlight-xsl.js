(function ($) {
    "use strict";
    var d = document;

    var regexp = {
        //'tag_start': /(<!--|<\?|<!\[CDATA\[|<\/?)/,
        //'tag_start': /<(!--|\?|!\[CDATA\[|\/?)?/,
        //'comment_tag': /<!--[^\-]*-->/,
        'tag_start': /<(!--|\?|!\[CDATA\[|\/?)?/,
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

    var stylesheet =
        `.xml_dec {color: #0018A8}
        .text {color: black}
        .entity {color: #B05000}
        .delimiter {color: #282828}
        .xsl_tag_name {color: #005402}
        .xsl_variable {font-style: italic; color: #60A004}
        .html_tag_name {color: #000E7C}
        .attr_name {color: #004C82}
        .attr_val {color: #800400}
        .xpath_in_attr_val {color: #460480}
        .xpath_attr_val {color: #460480}
        .comment {color: #606060}
        .cdata_delimiter {color: #B08000}
        .error {border-bottom: 1px dotted red}`;
        //.error {text-decoration: underline}`;

    var style_prefix = "XSL_";

    var EOL = "\n", sgl_quote = "'", dbl_quote = "\"";

    function appendText(element, text)
    {
        var text_node = document.createTextNode(text);
        if (text.indexOf("\n") > -1) {
            var strong = document.createElement('strong');
            strong.appendChild(text_node);
            element.appendChild(strong);
        } else {
            element.appendChild(text_node);
        }
    }

    function textSpan(type, text)
    {
        var span = d.createElement('span');
        //span.className = style_prefix + type;
        span.className = type;
        span.textContent = text;
        //span.appendChild(d.createTextNode(text));
        return span;
    }

    function textSpanE(type, text)
    {
        var span = d.createElement('span'),
            entity,
            //entity_style = style_prefix + "entity",
            entity_style = "entity",
            re = regexp.entity,
            match,
            last_index = 0;
        //span.className = style_prefix + type;
        span.className = type;
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

    // Return doc. frag. with highlighted entities
    function fragE(text)
    {
        var frag = document.createDocumentFragment();
        var ts = new TextSplitter(text);
        while (ts.remaining) {
            if (ts.regMatch(regexp.entity)) {
                if (ts.beforeFound) {
                    //frag.appendChild(document.createTextNode(ts.beforeFound));
                    appendText(frag, ts.beforeFound);
                }
                //var em = document.createElement('em');
                var span = spanWithClass('entity');
                span.textContent = ts.found;
                frag.appendChild(span);
            } else {
                frag.appendChild(document.createTextNode(ts.remaining));
                ts.clear()
            }
        }
        return frag;
    }

    function spanWithClass(class_name)
    {
        var span = document.createElement('span');
        span.className = class_name;
        return span;
    }

    function addClassToSpan(span, class_name)
    {
        span.className += " " + class_name;
    }

    function highlightAttrVal(text, double_quoted_strings)
    {
        var frag = document.createDocumentFragment(),
            brace_span,
            string_span;

        var string_delimiter = double_quoted_strings ? dbl_quote : sgl_quote;
        var find_chars_after_brace = double_quoted_strings ? /["}]/ : /['}]/;
        var ts = new TextSplitter(text);

        while (ts.remaining) {
            if (string_span) {
                if (ts.find(string_delimiter)) {
                    if (ts.beforeFound) {
                        string_span.appendChild(fragE(ts.beforeFound));
                    }
                    string_span.appendChild(textSpan('delimiter', string_delimiter));
                    brace_span.appendChild(string_span);
                    string_span = null;
                } else {
                    string_span.appendChild(fragE(ts.remaining));
                    string_span.className += " error";
                    brace_span.appendChild(string_span);
                    frag.appendChild(brace_span);
                    ts.clear();
                }
            } else if (brace_span) {
                if (ts.regMatch(find_chars_after_brace)) {
                    if (ts.found == string_delimiter) {
                        if (ts.beforeFound) {
                            brace_span.appendChild(fragE(ts.beforeFound));
                        }
                        string_span = spanWithClass('attr_val');
                        string_span.appendChild(textSpan('delimiter', string_delimiter));
                    } else if (ts.found == "}") {
                        brace_span.appendChild(fragE(ts.beforeFound + ts.found));
                        frag.appendChild(brace_span);
                        brace_span = null;
                    }
                } else {
                    brace_span.appendChild(fragE(ts.remaining));
                    brace_span.className += " error";
                    //brace_span.addClassToSpan('error');
                    frag.appendChild(brace_span);
                    brace_span = null;
                    ts.clear();
                }
            } else {
                if (ts.find("{")) {
                    if (ts.beforeFound) {
                        frag.appendChild(fragE(ts.beforeFound));
                    }
                    brace_span = spanWithClass('xpath_in_attr_val');
                    brace_span.textContent = "{";
                } else {
                    frag.appendChild(fragE(ts.remaining));
                    ts.clear();
                }
            }
        }
        return frag;
    }

    function highlightXpathAttrVal(text, double_quoted_strings)
    {
        var frag = document.createDocumentFragment(),
            string_span;

        var string_delimiter = double_quoted_strings ? dbl_quote : sgl_quote;
        var ts = new TextSplitter(text);

        while (ts.remaining) {
            if (string_span) {
                if (ts.find(string_delimiter)) {
                    if (ts.beforeFound) {
                        string_span.appendChild(fragE(ts.beforeFound));
                    }
                    string_span.appendChild(textSpan('delimiter', string_delimiter));
                    frag.appendChild(string_span);
                    string_span = null;
                } else {
                    string_span.appendChild(fragE(ts.remaining));
                    string_span.className += " error";
                    frag.appendChild(string_span);
                    ts.clear();
                }
            /*} else if (brace_span) {
                if (ts.regMatch(find_chars_after_brace)) {
                    if (ts.found == string_delimiter) {
                        if (ts.beforeFound) {
                            brace_span.appendChild(fragE(ts.beforeFound));
                        }
                        string_span = spanWithClass('attr_val');
                        string_span.appendChild(textSpan('delimiter', string_delimiter));
                    } else if (ts.found == "}") {
                        brace_span.appendChild(fragE(ts.beforeFound + ts.found));
                        frag.appendChild(brace_span);
                        brace_span = null;
                    }
                } else {
                    brace_span.appendChild(fragE(ts.remaining));
                    brace_span.className += " error";
                    //brace_span.addClassToSpan('error');
                    frag.appendChild(brace_span);
                    brace_span = null;
                    ts.clear();
                }*/
            } else {
                if (ts.find(string_delimiter)) {
                    if (ts.beforeFound) {
                        frag.appendChild(fragE(ts.beforeFound));
                    }
                    string_span = spanWithClass('attr_val');
                    string_span.appendChild(textSpan('delimiter', string_delimiter));
                } else {
                    frag.appendChild(fragE(ts.remaining));
                    ts.clear();
                }
            }
        }
        return frag;
    }

    var highlighter = function(text)
    {
        if (!text)
            return null;

        var frag_out = document.createDocumentFragment();
        var tag_span,
            html_attr_val_span,
            xsl_attr_val_span,
            xpath_attr_val_span,
            cdata_tag_span;

        var delimiter,
            last_attr_name = null,
            match,
            closing_tag = false;

        var ts = new TextSplitter(text);

        while (ts.remaining) {
            if (!tag_span) {
                // Not in tag.
                if (ts.regMatch(regexp.tag_start)) {
                    if (ts.beforeFound)
                        frag_out.appendChild(textSpanE('text', ts.beforeFound));
                    var tag_start = ts.found;
                    switch (ts.found) {
                        case "<?":
                            tag_span = spanWithClass('xml_dec');
                            tag_span.textContent = "<?";
                            if (ts.remaining) {
                                if (ts.find("?>")) {
                                    tag_span.textContent += ts.beforeFound + "?>";
                                } else {
                                    tag_span.textContent += ts.remaining;
                                    ts.clear();
                                }
                            }
                            frag_out.appendChild(tag_span);
                            tag_span = null;
                            break;

                        case "<!--":
                            tag_span = spanWithClass('comment');
                            tag_span.textContent = "<!--";
                            if (ts.remaining) {
                                if (ts.find("-->")) {
                                    tag_span.textContent += ts.beforeFound + "-->";
                                } else {
                                    tag_span.textContent += ts.remaining;
                                    ts.clear();
                                }
                            }
                            frag_out.appendChild(tag_span);
                            tag_span = null;
                            break;

                        case "<![CDATA[":
                            tag_span = spanWithClass("text");
                            tag_span.appendChild(textSpan('cdata_delimiter', ts.found));
                            if (ts.remaining) {
                                if (ts.find("]]>")) {
                                    if (ts.beforeFound) {
                                        tag_span.appendChild(document.createTextNode(ts.beforeFound));
                                    }
                                    tag_span.appendChild(textSpan('cdata_delimiter', ts.found));
                                } else {
                                    tag_span.appendChild(document.createTextNode(ts.remaining));
                                    ts.clear();
                                }
                            }
                            frag_out.appendChild(tag_span);
                            tag_span = null;
                            break;

                        case "<":
                        case "</":
                            tag_span = spanWithClass('html_tag');
                            tag_span.appendChild(textSpan("delimiter", ts.found));
                            tag_span.dataset.closing = (ts.found == "</");
                            if (ts.remaining) {
                                if (ts.regMatch(regexp.xsl_tag_name)) {
                                    tag_span.className = 'xsl_tag';
                                    tag_span.appendChild(textSpan("xsl_tag_name", ts.found));
                                } else if (ts.regMatch(regexp.html_tag_name)) {
                                    tag_span.appendChild(textSpan("html_tag_name", ts.found));
                                }
                            }
                            break;
                    }
                }
                else {
                    frag_out.appendChild(textSpanE('text', ts.remaining));
                    ts.clear();
                }
            }

            /* In tag. */
            else {
                if (html_attr_val_span) {
                    if (ts.find(html_attr_val_span.dataset.delimiter)) {
                        if (ts.beforeFound) {
                            //frag_out.appendChild(textSpanE('attr_val', ts.beforeFound));
                            html_attr_val_span.appendChild(highlightAttrVal(ts.beforeFound));
                        }
                        html_attr_val_span.appendChild(textSpan('delimiter', ts.found));
                        tag_span.appendChild(html_attr_val_span);
                        html_attr_val_span = null;
                    } else {
                        html_attr_val_span.appendChild(highlightAttrVal(ts.remaining));
                        tag_span.appendChild(html_attr_val_span);
                        frag_out.appendChild(tag_span);
                        tag_span = null;
                        ts.clear();
                    }
                } else if (xsl_attr_val_span) {
                    if (ts.find(xsl_attr_val_span.dataset.delimiter)) {
                        if (ts.beforeFound) {
                            xsl_attr_val_span.appendChild(fragE(ts.beforeFound));
                        }
                        xsl_attr_val_span.appendChild(textSpan('delimiter', ts.found));
                        tag_span.appendChild(xsl_attr_val_span);
                        xsl_attr_val_span = null;
                    } else {
                        xsl_attr_val_span.appendChild(fragE(ts.remaining));
                        tag_span.appendChild(xsl_attr_val_span);
                        frag_out.appendChild(tag_span);
                        tag_span = null;
                        ts.clear();
                    }
                } else if (xpath_attr_val_span) {
                    if (ts.find(xpath_attr_val_span.dataset.delimiter)) {
                        if (ts.beforeFound) {
                            //xpath_attr_val_span.appendChild(fragE(ts.beforeFound));
                            xpath_attr_val_span.appendChild(highlightXpathAttrVal(ts.beforeFound));
                        }
                        xpath_attr_val_span.appendChild(textSpan('delimiter', ts.found));
                        tag_span.appendChild(xpath_attr_val_span);
                        xpath_attr_val_span = null;
                    } else {
                        xpath_attr_val_span.appendChild(fragE(ts.remaining));
                        tag_span.appendChild(xpath_attr_val_span);
                        frag_out.appendChild(tag_span);
                        tag_span = null;
                        ts.clear();
                    }
                }
                else {
                    if (tag_span.dataset.closing == true) {
                        // Closing tag
                        if (ts.find(">")) {
                            if (ts.beforeFound)
                                tag_span.appendChild(textSpan("text", ts.beforeFound));
                            tag_span.appendChild(textSpan("delimiter", ">"));
                        }
                        else {
                            tag_span.appendChild(textSpan('text', ts.remaining));
                            ts.clear();
                        }
                        frag_out.appendChild(tag_span);
                        tag_span = null;
                    }
                    else {
                        // Opening tag
                        if (ts.regMatch(regexp.in_tag_delimiter)) {
                            //alert(ts.found)
                            if (ts.beforeFound) {
                                tag_span.appendChild(textSpan('attr_name', ts.beforeFound));
                                if (ts.beforeFound.trim())
                                    last_attr_name = ts.beforeFound.trim();
                            }
                            tag_span.appendChild(textSpan("delimiter", ts.found));
                            if (ts.found == ">" || ts.found == "/>") {
                                frag_out.appendChild(tag_span);
                                tag_span = null;
                            }
                            else if (ts.found == sgl_quote || ts.found == dbl_quote) {
                                //alert(ts.found)
                                // Value delimiter found.
                                if (tag_span.className == "xsl_tag") {
                                    if (["select", "match", "test"].indexOf(last_attr_name) > -1) {
                                        xpath_attr_val_span = spanWithClass("xpath_attr_val");
                                        xpath_attr_val_span.dataset.delimiter = ts.found;
                                        //alert("xpath");
                                    } else {
                                        xsl_attr_val_span = spanWithClass("attr_val");
                                        xsl_attr_val_span.dataset.delimiter = ts.found;
                                    }
                                } else {
                                    html_attr_val_span = spanWithClass("attr_val");
                                    html_attr_val_span.dataset.delimiter = ts.found;
                                }
                            }
                            //else {
                                //alert(ts.found)
                            //}
                        }
                        else {
                            tag_span.appendChild(textSpan('attr_name', ts.remaining));
                            frag_out.appendChild(tag_span);
                            tag_span = null;
                            ts.clear();
                        }
                    }
                }
            }
        }
        if (tag_span) {
            frag_out.appendChild(tag_span);
        }
        return frag_out;
    }
    Workspacer.addHighlighter('xsl', {
        'style_prefix': style_prefix,
        'stylesheet': stylesheet,
        'highlight': highlighter
    });

})();

/*var highlight_xsl = '.XSL_xml_dec {color: #885820} .XSL_attr_name, .attr_name {color: #024C78} .XSL_xsl_tag {color: #007005} .XSL_xsl_attr_val, .XSL_xsl_in_attr_val {color: #460480} .XSL_xsl_variable {color: #3A0480; font-style: italic} .XSL_comment {color: #585858} .XSL_xml_tag {color: #065002} .XSL_html_tag {color: #020678} .XSL_attr_val, .XSL_string_in_xsl_attr_val {color: #901603} .XSL_number_in_xsl_attr_val {color: #B85004} .XSL_text, .XSL_cdata {color: #000} .XSL_amp {color: #9A7004} .XSL_delimiter {color: #777}';
*/
