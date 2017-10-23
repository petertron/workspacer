(function ($) {
    "use strict";

    var d = document;

    var pseudo_classes = (
        'active checked disabled empty first-of-type first-child focus hover ' +
        'last-child last-of-type link nth-child :nth-last-child not root target visited'
    ).split(' ');

    var keywords = (
        'ascent azimuth background-attachment background-color background-image background-position ' +
        'background-repeat background baseline bbox border-collapse border-color border-spacing ' +
        'border-style border-top border-right border-bottom border-left border-top-color ' +
        'border-right-color border-bottom-color border-left-color ' +
        'border-top-style border-right-style border-bottom-style border-left-style border-top-width border-right-width ' +
        'border-bottom-width border-left-width border-width border bottom cap-height caption-side centerline clear clip color ' +
        'content counter-increment counter-reset cue-after cue-before cue cursor definition-src descent direction display ' +
        'elevation empty-cells float font-size-adjust font-family font-size font-stretch font-style font-variant font-weight font ' +
        'height left letter-spacing line-height list-style-image list-style-position list-style-type list-style margin-top ' +
        'margin-right margin-bottom margin-left margin marker-offset marks mathline max-height max-width min-height min-width orphans ' +
        'outline-color outline-style outline-width outline overflow ' +
        'padding-top padding-right padding-bottom padding-left padding page ' +
        'page-break-after page-break-before page-break-inside pause pause-after pause-before pitch pitch-range play-during position ' +
        'quotes resize right richness size slope src speak-header speak-numeral speak-punctuation speak speech-rate stemh stemv stress ' +
        'table-layout text-align top text-decoration text-indent text-rendering text-shadow text-transform ' +
        'unicode-bidi unicode-range units-per-em user-select ' +
        'vertical-align visibility voice-family volume white-space widows width widths word-spacing x-height z-index'
    ).split(' ');

    var values = (
        'above absolute all always aqua armenian attr aural auto avoid ' +
        'baseline behind below bidi-override black blink block blue bold bolder both bottom braille' +
        'capitalize caption center center-left center-right circle close-quote code collapse compact ' +
        'condensed continuous counter counters crop cross crosshair cursive ' +
        'dashed decimal decimal-leading-zero default digits disc dotted double ' +
        'em embed embossed e-resize expanded extra-condensed extra-expanded ' +
        'fantasy far-left far-right fast faster fixed format fuchsia ' +
        'gray green groove ' +
        'handheld hebrew help hidden hide high higher horizontal ' +
        'icon important inherit inline-table inline inset inside invert italic justify ' +
        'landscape large larger left-side left leftwards level lighter lime line-through list-item ' +
        'local loud lower-alpha lowercase lower-greek lower-latin lower-roman lower low ltr ' +
        'marker maroon medium message-box middle mix monospace move narrower ' +
        'navy ne-resize no-close-quote none no-open-quote no-repeat normal nowrap n-resize nw-resize ' +
        'oblique olive once open-quote outset outside overline ' +
        'pointer portrait pre print projection purple pt px ' +
        'red relative repeat repeat-x repeat-y rgb ridge right right-side rightwards rtl run-in ' +
        'sans-serif screen scroll semi-condensed semi-expanded separate se-resize serif show silent ' + 'silver slower slow small small-caps small-caption smaller soft solid speech spell-out ' +
        'square s-resize static status-bar sub super sw-resize ' +
        'table-caption table-cell table-column table-column-group table-footer-group ' +
        'table-header-group table-row table-row-group teal text-bottom text-top thick thin top ' + 'transparent tty tv ' +
        'ultra-condensed ultra-expanded underline upper-alpha uppercase upper-latin upper-roman url ' +
        'vertical visible wait white wider w-resize ' +
        'x-fast x-high x-large x-loud x-low x-slow x-small x-soft xx-large xx-small yellow'
    ).split(' ');
/*
    var COMMENT = 'CSS_comment',
        STRING = 'CSS_string',
        ID = 'CSS_id',
        CLASS = 'CSS_class',
        PSEUDO_CLASS = 'CSS_pseudoclass',
        KEYWORD = 'CSS_keyword',
        VALUE = 'CSS_value';
*/
    var COMMENT = 'comment',
        STRING = 'string',
        ID = 'id',
        CLASS = 'class',
        PSEUDO_CLASS = 'pseudoclass',
        KEYWORD = 'keyword',
        VALUE = 'value';

    var exp_outside = /\{|[\.#][a-z_][a-z0-9_\-]*|\'[^']*\'?|\"[^"]*\"?|\/\*|\:[a-z]+|$/gi,
        exp_inside = /[:;}]|[a-z][a-z\-]+|\d+\.?\d*\%?|\.\d+\%?|\#[0-9a-f]{3,6}|\'[^']*\'?|\"[^"]*\"?|\/\*|$/gi,
        exp_end_comment = /[^]*?\*\/|$/g;

    var stylesheet =
        `.comment {color: #808080}
        .string {color: #901203}
        .escape {color: #C08004}
        .objectpart {color: #024C78}
        .keyword {color: #020678}
        .value {color: #024C78}
        .number {color: #A6680C}
        .hex {color: #608004}
        .id {color: #460480}
        .class {color: #A46008}
        .pseudoclass {color: #065002}`

    function textSpan(type, text)
    {
        var s = d.createElement('span');
        s.className = type;
        s.appendChild(d.createTextNode(text));
        return s;
    }

    var style_prefix = "CSS_";

    var before_colon = true,
        outside_brace = true;

    var highlighter = function(text)
    {
        if (!text)
            return null;

        var line_in = text,
            frag_out = document.createDocumentFragment(),
            exp,
            match,
            match2,
            m,
            last_index = 0,
            first_char;

        while (last_index < line_in.length) {
            exp = outside_brace ? exp_outside : exp_inside;
            exp.lastIndex = last_index;
            match = exp.exec(line_in);
            if (match.index > last_index) {
                frag_out.appendChild(d.createTextNode(line_in.slice(last_index, match.index)));
            }
            last_index = exp.lastIndex;
            m = match[0];
            first_char = m.charAt(0);
            if (m == "/*") {
                exp_end_comment.lastIndex = last_index;
                match2 = exp_end_comment.exec(line_in);
                last_index = exp_end_comment.lastIndex;
                frag_out.appendChild(textSpan(COMMENT, m + match2[0]));
            }
            else if (first_char == "'" || first_char == "\"") {
                frag_out.appendChild(textSpan(STRING, m));
            }
            else {
                if (outside_brace) {
                    if (m == "{") {
                        outside_brace = false;
                        before_colon = true
                        frag_out.appendChild(d.createTextNode(m));
                    } else if (first_char == ".") {
                        frag_out.appendChild(textSpan(CLASS, m));
                    }
                    else if (first_char == "#") {
                        frag_out.appendChild(textSpan(ID, m));
                    }
                    else if (first_char == ":" && pseudo_classes.indexOf(m.slice(1)) > -1) {
                        //alert(m)
                        frag_out.appendChild(textSpan(PSEUDO_CLASS, m));
                    }
                    else {
                        frag_out.appendChild(d.createTextNode(m));
                    }
                }
                else {
                    if (m == "}") {
                        outside_brace = true;
                        frag_out.appendChild(d.createTextNode(m));
                    }
                    else if (m == ":") {
                        before_colon = false;
                        frag_out.appendChild(d.createTextNode(m));
                    }
                    else if (m == ";") {
                        before_colon = true;
                        frag_out.appendChild(d.createTextNode(m));
                    }
                    else if ('#.0123456789'.indexOf(first_char) > -1) {
                        frag_out.appendChild(textSpan(VALUE, m))
                    }
                    else if (first_char >= "a" && first_char <= "z") {
                        if (before_colon && keywords.indexOf(m) > -1) {
                            frag_out.appendChild(textSpan(KEYWORD, m));
                        }
                        else if (!before_colon && values.indexOf(m) > -1) {
                            frag_out.appendChild(textSpan(VALUE, m));
                        }
                        else {
                            frag_out.appendChild(d.createTextNode(m));
                        }
                    }
                    else {
                        frag_out.appendChild(d.createTextNode(m));
                    }
                }
            }
        }
        return frag_out;
    }

    //Symphony.Extensions.Workspacer.highlighters['css'] = {
    CodeEditor.addHighlighter('css', {
        'style_prefix': style_prefix,
        'stylesheet': stylesheet,
        'highlight': highlighter
    });
})();
