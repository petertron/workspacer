var TextSplitter = (function () {
    function TextSplitter(text) {
        this.beforeFound = null;
        this.found = null;
        this.remaining = text;
    }
    TextSplitter.prototype.find = function (to_find) {
        var pos = this.remaining.indexOf(to_find);
        if (pos > -1) {
            this.beforeFound = this.remaining.slice(0, pos);
            this.found = to_find;
            this.remaining = this.remaining.slice(pos + to_find.length);
        }
        return (pos > -1);
    };
    TextSplitter.prototype.regMatch = function (re) {
        var match = re.exec(this.remaining);
        if (match !== null) {
            this.match = match;
            this.beforeFound = this.remaining.slice(0, match.index);
            this.found = match[0];
            this.remaining = this.remaining.slice(match.index + match[0].length);
            return true;
        }
        return false;
    };
    TextSplitter.prototype.clear = function () {
        this.remaining = null;
    };
    return TextSplitter;
}());
