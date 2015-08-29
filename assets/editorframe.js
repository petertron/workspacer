var d = document;

function setHighlighter()
{
    var highlighters = Symphony.Extensions.WorkspaceManager.highlighters,
        highlighter,
        filename,
        ext;

    if (in_workspace) {
        filename = $(NAME_FIELD).val();
        var last_dot = filename.lastIndexOf(".");
        if (last_dot > 0) {
            ext = filename.slice(last_dot + 1);
            syntax_highlighter = Symphony.Extensions.WorkspaceManager.highlighters[ext];
        }
        else
            syntax_highlighter = null;
    }
    else {
        syntax_highlighter = highlighters.xsl;
    }
    if (syntax_highlighter) {
        // Set up CSS
        var styles = syntax_highlighter.stylesheet;
        var prefix = "." + syntax_highlighter.style_prefix;
        var css_string = "";
        for (var key in styles) {
            css_string += prefix + key + " {" + styles[key] + "} ";
        }
        $(style_element2).text(css_string);
    }
}

