(function () {
    "use strict";

    document.addEventListener('codeeditorready', function (event) {
        event.target.addHighlighter('css', {
            highlighting: {
                primary: /(?<styles>[^\/]+)|(?<comment>\/\*.*?(\*\/|$))/sy,
                styles: /(?<beforebrace>[^{]+)|(?<afterbrace>[^}]+)/gsy,
                styles2: /(?<afterbrace>[^}]+)|(?<beforebrace>[^{]+)/gsy,
                beforebrace: /(?<id>#[\w-]+)|(?<class>\.[\w -]+)/gs,
                afterbrace: /(?<propname>[\w -]+\s*:)|(?<propval>[\w-]+)/gs
            },
            functions: {
                styles: function (span) {
                    if (this.inbraces == true) {
                        span.className = 'styles2';
                    }
                },
                beforebrace: function () {
                    this.inbraces = false;
                },
                afterbrace: function () {
                    this.inbraces = true;
                }
            },

            stylesheet:
`.id {color: #7808B0}
.class {color: #B07000}
.comment {font-style: italic; color: #606060}
.propname {color: #002294}
.propval {color: #0060A0}
.error {border-bottom: 1px dotted red}`,
            workingData: {inbraces: false}
        });
    });
})();
