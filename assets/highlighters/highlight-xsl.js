(function () {
    "use strict";

        /* /^xsl:(apply-imports|apply-templates|attribute|attribute-set|call-template|choose|comment|copy-of|copy|decimal-format|element|fallback|for-each|if|import|include|key|message|namespace-alias|number|otherwise|output|param|preserve-space|processing-instruction|sort|strip-space|stylesheet|template|text|transform|value-of|variable|when|with-param)/,
        'number_in_xsl_attr_val': /[0-9]+/g,
        html_tag: /<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)\/?>/,
*/

    const highlighting = {
        primary: /(?<text>[^<]+)|(?<comment><!--.*?(-->|$))|(?<cdata><\!\[CDATA\[.*?(\]\]>|$))|(?<tag><\/?.*?\/?>)/sy,
        text: /(?<entity>\&[a-zA-Z]+\;|\&#[0-9]+;)/gs,
        cdata: /(?<cdata_delimiter><!\[CDATA\[|\]\]>)/gs,
        tag: /(?<tag_start>\<\/?)|(?<tag_end>\/?>)|(?<xsl_tag_name>(?<=^<\/*)xsl:\w[\w\-]*)|(?<tag_name>(?<=<\/?)[\w\-:]+)|(?<attr_val_s>'[^']*('|$))|(?<attr_val_d>"[^"]*("|$))|(?<attr_name>\w[\w\-]+)/gs,
        attr_val_s: /(?<xpath_in_attr_val>\{[^}]*\})/gs,
        attr_val_d: /(?<xpath_in_attr_val>\{[^}]*\})/gs,
        xpath_in_attr_val: /(?<param>\$[\w\-]+)|(?<string_s>\'[^\']*\')|(?<string_d>\"[^\"]*\")/gs
        //xsl_attr_val: null,
        //xpath_attr_val: null,
    };

    const validation = {
        attr_val_s: /^'[^']*'$/,
        attr_val_d: /^"[^"]*"$/
    };

    const functions = {
        tag_name: function (span, contents) {
            this.tag_type = 'xml';
            this.last_attr_name = null;
        },
        xsl_tag_name: function (span, contents) {
            this.tag_type = 'xsl';
            this.last_attr_name = null;
            this.current_parent.parentElement.classList.add('xsl');
        },
        attr_name: function (span, contents) {
            this.last_attr_name = contents;
        },
        attr_val_s: function (span, contents) {
            if (this.tag_type == 'xsl') {
                if (['match', 'select', 'test'].indexOf(this.last_attr_name) !== -1) {
                    span.className = 'xpath_attr_val';
                }
            }
        },
        attr_val_d: function (span, contents) {
            if (this.tag_type == 'xsl') {
                if (['match', 'select', 'test'].indexOf(this.last_attr_name) !== -1) {
                    span.className = 'xpath_attr_val';
                }
            }
        }
    };

    var stylesheet =
`.xml_dec {color: #0018A8}
.text {color: black}
.amp {color: red}
.entity {color: #B05000}
.delimiter {color: #282828}
.xsl_variable {font-style: italic; color: #60A004}
.tag, .tag_name {color: #001280}
.tag.xsl, .xsl_tag_name {color: #005006}
.attr_name {color: #04508E}
.attr_val_s, .attr_val_d, .string_s {color: #800400}
.xpath_in_attr_val {color: #460480}
.xpath_attr_val {color: #460480}
.param {font-style: italic}
.comment {font-style: italic; color: #606060}
.cdata_delimiter {color: #B08000}
.cdata {color: black}
.error {border-bottom: 1px dotted red}`;
//.error {text-decoration: underline}`;

    document.addEventListener('codeeditorready', function (event) {
        event.target.addHighlighter('xsl', {
            stylesheet: stylesheet,
            highlighting: highlighting,
            functions: functions
        });
    });
})();
