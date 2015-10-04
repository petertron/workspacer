(function($) {
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

    var COMMENT = 'CSS_comment',
        STRING = 'CSS_string',
        ID = 'CSS_id',
        CLASS = 'CSS_class',
        PSEUDO_CLASS = 'CSS_pseudoclass',
        KEYWORD = 'CSS_keyword',
        VALUE = 'CSS_value';

    var exp_outside = /\{|[\.#][a-z_][a-z0-9_\-]*|\'[^']*\'?|\"[^"]*\"?|\/\*|\:[a-z]+|$/gi,
        exp_inside = /[:;}]|[a-z][a-z\-]+|\d+\.?\d*\%?|\.\d+\%?|\#[0-9a-f]{3,6}|\'[^']*\'?|\"[^"]*\"?|\/\*|$/gi,
        exp_end_comment = /[^]*?\*\/|$/g;

    var stylesheet = {
        'comment': "color: #808080",
        'string': "color: #901203",
        'escape': "color: #C08004",
        'objectpart': "color: #024C78",
        'keyword': "color: #020678",
        'value': "color: #024C78",
        'number': "color: #A6680C",
        'hex': "color: #608004",
        'id': "color: #460480",
        'class': "color: #A46008",
        'pseudoclass': "color: #065002"
    };

    var style_prefix = "CSS_";

    var before_colon = true
        outside_brace = true;

    var highlighter = function(source_text) {
        if (source_text.length == 0) return null;
        var array_in = source_text.split("\n"), array_out = [];
        var exp, match, m, last_index = 0;

        for (var _i = 0; _i < array_in.length; _i++) {
            var line_in = array_in[_i];
            if (line_in) {
                last_index = 0;
                var line_container = document.createDocumentFragment();

                while (last_index < line_in.length) {
                    exp = outside_brace ? exp_outside : exp_inside;
                    exp.lastIndex = last_index;
                    match = exp.exec(line_in);
                    if (match.index > last_index) {
                        $(line_container).appendText(line_in.slice(last_index, match.index));
                    }
                    last_index = exp.lastIndex;
                    m = match[0];
                    first_char = m.charAt(0);
                    if (m == "/*") {
                        exp_end_comment.lastIndex = last_index;
                        match2 = exp_end_comment.exec(line_in);
                        last_index = exp_end_comment.lastIndex;
                        $(line_container).appendSpan(COMMENT, m + match2[0]);
                    }
                    else if (first_char == "'" || first_char == "\"") {
                        $(line_container).appendSpan(STRING, m);
                    }
                    else {
                        if (outside_brace) {
                            if(m == "{") {
                                outside_brace = false;
                                before_colon = true
                                $(line_container).appendText(m);
                            }
                            else if (first_char == ".") {
                                $(line_container).appendSpan(CLASS, m);
                            }
                            else if (first_char == "#") {
                                $(line_container).appendSpan(ID, m);
                            }
                            else if (first_char == ":" && pseudo_classes.indexOf(m.slice(1)) > -1) {
                                //alert(m)
                                $(line_container).appendSpan(PSEUDO_CLASS, m);
                            }
                            else {
                                $(line_container).appendText(m);
                            }
                        }
                        else {
                            if (m == "}") {
                                outside_brace = true;
                                $(line_container).appendText(m);
                            }
                            else if (m == ":") {
                                before_colon = false;
                                $(line_container).appendText(m);
                            }
                            else if (m == ";") {
                                before_colon = true;
                                $(line_container).appendText(m);
                            }
                            else if ('#.0123456789'.indexOf(first_char) > -1) {
                                $(line_container).appendSpan(VALUE, m)
                            }
                            else if (first_char >= "a" && first_char <= "z") {
                                if (before_colon && keywords.indexOf(m) > -1) {
                                    $(line_container).appendSpan(KEYWORD, m);
                                }
                                else if (!before_colon && values.indexOf(m) > -1) {
                                    $(line_container).appendSpan(VALUE, m);
                                }
                                else {
                                    $(line_container).appendText(m);
                                }
                            }
                            else {
                                $(line_container).appendText(m);
                            }
                        }
                    }
                }
                array_out[_i] = line_container;
            }
            else {
                array_out[_i] = d.createTextNode("");
            }
        }
        return array_out;
    }

    //Symphony.Extensions.Workspacer.highlighters['css'] = {
    Highlighters['css'] = {
        'style_prefix': style_prefix,
        'stylesheet': stylesheet,
        'highlight': highlighter
    };
})();
