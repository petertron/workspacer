(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Cut, Delete, ForwardsDelete, IndentRight, InsertChar, InsertLineBreak, Paste, TextAction, Textspace,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Textspace = window.Textspace;

TextAction = (function() {
  function TextAction() {}

  TextAction.prototype.getName = function() {
    var results;
    results = /function (.{1,})\\\(/.exec(this.constructor.toString());
    if (results && results.length > 1) {
      return results[1];
    } else {
      return "";
    }
  };

  TextAction.prototype.isUpdatable = function() {
    return indexOf.call(this, "update") >= 0;
  };

  return TextAction;

})();

exports.InsertChar = InsertChar = (function(superClass) {
  var title;

  extend(InsertChar, superClass);

  title = "insert";

  function InsertChar(char) {
    var replaced;
    replaced = Textspace.replaceSelection(char);
    this.position = replaced.position;
    this.old_text = replaced.text;
    this.new_text = char;
    Textspace.setSelection(this.position + 1);
  }

  InsertChar.prototype.update = function(char) {
    Textspace.textInsert(this.position + this.new_text.length, char);
    this.new_text += char;
    return Textspace.setSelection(this.position + this.new_text.length);
  };

  InsertChar.prototype.undo = function() {
    Textspace.textReplace({
      'start': this.position,
      'end': this.position + this.new_text.length
    }, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  InsertChar.prototype.redo = function() {
    Textspace.textReplace({
      'start': this.position,
      'end': this.position + this.old_text.length
    }, this.new_text);
    return Textspace.setSelection(this.position + this.new_text.length);
  };

  return InsertChar;

})(TextAction);

exports.InsertLineBreak = InsertLineBreak = (function(superClass) {
  var title;

  extend(InsertLineBreak, superClass);

  title = "insert line break";

  function InsertLineBreak() {
    var replaced;
    replaced = Textspace.replaceSelection("\n");
    this.position = replaced.position;
    this.old_text = replaced.text;
    Textspace.setSelection(this.position + 1);
  }

  InsertLineBreak.prototype.undo = function() {
    Textspace.textReplace({
      'start': this.position,
      'end': this.position + 1
    }, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  InsertLineBreak.prototype.redo = function() {
    Textspace.textReplace({
      'start': this.position,
      'end': this.position + this.old_text.length
    }, "\n");
    return Textspace.setSelection(this.position + 1);
  };

  return InsertLineBreak;

})(TextAction);

exports.Delete = Delete = (function(superClass) {
  var title;

  extend(Delete, superClass);

  title = "delete";

  function Delete() {
    var slices;
    slices = Textspace.getEditorTextSlices();
    if (slices.selected) {
      this.old_text = slices.selected;
    } else {
      if (!slices.before) {
        throw null;
      }
      this.old_text = slices.before.slice(-1);
      slices.before = slices.before.slice(0, -1);
    }
    Textspace.setText(slices.before + slices.after);
    this.position = slices.before.length;
    "sel = Textspace.selection\nif sel.collapsed):\nif sel.start == 0)\nraise null\nsel.end = sel.start\nsel.start--\nTextspace.selection.start = sel.start\n}\n@position = sel.start\n@old_text = Textspace.textRemove(sel)";
    Textspace.setSelection(this.position);
  }

  Delete.prototype.update = function() {
    if (this.position === 0) {
      throw null;
    }
    this.position -= 1;
    this.old_text = Textspace.textRemove({
      'start': this.position,
      'end': this.position + 1
    }) + this.old_text;
    return Textspace.setSelection(this.position);
  };

  Delete.prototype.undo = function() {
    Textspace.textInsert(this.position, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  Delete.prototype.redo = function() {
    Textspace.textRemove({
      'start': this.position,
      'end': this.position + this.old_text.length
    });
    return Textspace.setSelection(this.position);
  };

  return Delete;

})(TextAction);

exports.ForwardsDelete = ForwardsDelete = (function(superClass) {
  var title;

  extend(ForwardsDelete, superClass);

  title = "forwards delete";

  function ForwardsDelete() {
    var sel;
    sel = Textspace.getSelection();
    if (sel.collapsed) {
      if (sel.start === Textspace.getText().length) {
        throw null;
      }
      sel.end = sel.start + 1;
    }
    this.position = sel.start;
    this.old_text = Textspace.textRemove(sel);
    Textspace.setSelection(this.position);
  }

  ForwardsDelete.prototype.update = function() {
    if (Textspace.getSelection().start === Textspace.getText().length) {
      throw null;
    }
    this.old_text += Textspace.textRemove({
      'start': this.position,
      'end': this.position + 1
    });
    return Textspace.setSelection(this.position);
  };

  ForwardsDelete.prototype.undo = function() {
    Textspace.textInsert(this.position, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  ForwardsDelete.prototype.redo = function() {
    Textspace.textRemove({
      'start': this.position,
      'end': this.position + this.old_text.length
    });
    return Textspace.setSelection(this.position);
  };

  return ForwardsDelete;

})(TextAction);

exports.Cut = Cut = (function(superClass) {
  var title;

  extend(Cut, superClass);

  title = "cut";

  function Cut() {
    var pos;
    pos = Textspace.getSelection();
    this.position = pos.start;
    this.old_text = Textspace.textRemove(pos);
    Textspace.setSelection(pos.start, null);
  }

  Cut.prototype.undo = function() {
    Textspace.textInsert(this.position, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  Cut.prototype.redo = function() {
    Textspace.textRemove({
      'start': this.position,
      'end': this.position + this.old_text.length
    });
    return Textspace.setSelection(this.position);
  };

  return Cut;

})(TextAction);

exports.Paste = Paste = (function(superClass) {
  var title;

  extend(Paste, superClass);

  title = "paste";

  function Paste(new_text) {
    var replaced;
    replaced = Textspace.replaceSelection(new_text);
    this.position = replaced.position;
    this.old_text = replaced.text;
    this.new_text = new_text;
    Textspace.setSelection(this.position + this.new_text.length);
  }

  Paste.prototype.undo = function() {
    Textspace.textReplace({
      'start': this.position,
      'end': this.position + this.new_text.length
    }, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  Paste.prototype.redo = function() {
    Textspace.textReplace({
      'start': this.position,
      'end': this.position + this.old_text.length
    }, this.new_text);
    return Textspace.setSelection(this.position + this.new_text.length);
  };

  return Paste;

})(TextAction);

exports.IndentRight = IndentRight = (function(superClass) {
  var title;

  extend(IndentRight, superClass);

  title = "indent right";

  function IndentRight() {
    var break_pos, i, j, len, pos, selection_split, slices;
    break_pos = 0;
    pos = Textspace.selection;
    this.position = pos.start;
    slices = Textspace.getEditorTextSlices();
    if (slices.before) {
      break_pos = slices.before.lastIndexOf("\n") + 1;
    }
    if (break_pos < slices.before.length) {
      slices.selected = slices.before.slice(break_pos) + slices.selected;
      slices.before = slices.before.slice(0, break_pos);
    }
    if (slices.selected.slice(-1) !== "\n") {
      break_pos = slices.after.indexOf("\n");
    }
    if (break_pos !== -1) {
      slices.selected += slices.after.slice(0, break_pos);
      slices.after = slices.after.slice(break_pos);
      this.old_text = slices.selected;
    }
    selection_split = slices.selected.split("\n");
    for (j = 0, len = selection_split.length; j < len; j++) {
      i = selection_split[j];
      selection_split[i] = "    " + selection_split[i];
      slices.selected = selection_split.join("\n");
      Textspace.text = slices.before + slices.selected + slices.after;
      Textspace.selection.end = null;
    }
  }

  IndentRight.prototype.undo = function() {
    Textspace.textInsert(this.position, this.old_text);
    return Textspace.setSelection(this.position + this.old_text.length);
  };

  IndentRight.prototype.redo = function() {
    Textspace.textRemove({
      'start': this.position,
      'end': this.position + this.old_text.length
    });
    return Textspace.setSelection(this.position);
  };

  return IndentRight;

})(TextAction);


},{}],2:[function(require,module,exports){
var $, BODY, Context, EDITOR_MENU_onItemSelect, EDITOR_MENU_onMenuOpen, EDITOR_OUTER_onMouseDown, PRE_TAG, Symphony, caret_moved, createRange, css_string, document_modified, editor_height, editor_refresh_pending, findNodeByPos, highlighter, in_workspace, k, key, last_key_code, new_file, prefix, ref, renderText, rewriteEditorContents, setEditorSelection, setHighlighter, styles, syntax_highlighter, value, w, x_margin, y_margin;

window.Textspace = require('./textspace.coffee');

window.Actions = require('./actions.coffee');

$ = window.parent.jQuery;

Symphony = window.parent.Symphony;

Context = Symphony.Context;

BODY = document.body;

PRE_TAG = document.querySelector('pre');

last_key_code = null;

caret_moved = false;

x_margin = 3;

y_margin = 2;

in_workspace = !($(parent.document.body).data('0') === 'template' || $(parent.document.body).hasClass('template'));

new_file = null;

document_modified = false;

syntax_highlighter = null;

editor_height = null;

editor_refresh_pending = false;

setHighlighter = function() {
  var ext, filename, last_dot;
  if (in_workspace) {
    filename = $(parent.document).find('#existing_file').val();
    last_dot = filename.lastIndexOf(".");
    if (last_dot > 0) {
      ext = filename.slice(last_dot + 1);
      return syntax_highlighter = window.Highlighters[ext];
    } else {
      return syntax_highlighter = null;
    }
  } else {
    return syntax_highlighter = Highlighters.xsl;
  }
};

rewriteEditorContents = function() {
  renderText();
  setEditorSelection();
  return editor_refresh_pending = false;
};

renderText = function() {
  var _i, frag, j, l, lines, num_lines, ref, ref1, sec;
  setHighlighter();
  PRE_TAG.innerHTML = '';
  if (Textspace.getText()) {
    frag = document.createDocumentFragment();
    if (syntax_highlighter) {
      lines = syntax_highlighter.highlight(Textspace.getText());
      for (_i = j = 0, ref = lines.length; 0 <= ref ? j < ref : j > ref; _i = 0 <= ref ? ++j : --j) {
        sec = document.createElement('section');
        if (lines[_i]) {
          sec.appendChild(lines[_i]);
        } else {
          sec.appendChild(document.createTextNode(""));
        }
        if (_i < (lines.length - 1)) {
          sec.appendChild(document.createTextNode("\n"));
        } else {
          sec.appendChild(document.createElement('br'));
        }
        frag.appendChild(sec);
      }
    } else {
      lines = Textspace.getText().split("\n");
      for (_i = l = 0, ref1 = lines.length; 0 <= ref1 ? l < ref1 : l > ref1; _i = 0 <= ref1 ? ++l : --l) {
        frag.appendChild(document.createTextNode(lines[_i]));
        if (_i < (lines.length - 1)) {
          frag.appendChild(document.createTextNode("\n"));
        }
      }
    }
    PRE_TAG.appendChild(frag);
    num_lines = lines.length;
  } else {
    frag = document.createElement('section');
    frag.appendChild(document.createTextNode(""));
    PRE_TAG.appendChild(frag);
    num_lines = 1;
  }
  return parent.window.displayLineNumbers(num_lines);
};

createRange = function(start_node, start_offset, end_node, end_offset) {
  var r;
  r = document.createRange();
  r.setStart(start_node, start_offset);
  r.setEnd(end_node, end_offset);
  return r;
};

setEditorSelection = function() {
  var el, node_end, node_start, o, pos, r, rect, sel;
  r = document.createRange();
  if (Textspace.getText()) {
    pos = Textspace.getSelection();
    node_start = findNodeByPos(pos.start);
    node_end = null;
    if (pos.end) {
      node_end = findNodeByPos(pos.end);
    } else {
      node_end = node_start;
    }
    r.setStart(node_start.node, node_start.offset);
    r.setEnd(node_end.node, node_end.offset);
  } else {
    r.setStart(PRE_TAG.firstChild, 0);
    r.setEnd(PRE_TAG.firstChild, 0);
  }
  sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  el = node_start.node.parentNode;
  if (el.nodeName.toLowerCase() !== "pre") {
    rect = el.getBoundingClientRect();
    o = rect.bottom - $(document.body).height();
    if (o > 0) {
      return $(window).scrollTop($(window).scrollTop() + Math.round(o));
    }
  }
};

findNodeByPos = function(pos) {
  var found, iterator, node, offset;
  if (pos === 0) {
    node = PRE_TAG.firstChild;
    offset = 0;
  } else {
    iterator = document.createNodeIterator(PRE_TAG, NodeFilter.SHOW_TEXT, null, false);
    while ((node = iterator.nextNode())) {
      offset = pos;
      if (node.nodeType === 3) {
        pos -= node.length;
      } else if (node.nodeName.toLowerCase() === "br") {
        pos -= 1;
      }
      if (node.nodeValue === "\n") {
        continue;
      }
      if (pos <= 0) {
        found = node;
        break;
      }
    }
    if (!found) {
      node = document.createTextNode("");
      PRE_TAG.appendChild(node);
      offset = 0;
    }
  }
  return {
    'node': node,
    'offset': offset
  };
};

$(BODY).focusin(function(event) {
  return $(parent.document).trigger('editor-focusin');
}).focusout(function(event) {
  return $(parent.document).trigger('editor-focusout');
});

$(document).scroll(function(event) {
  return $(parent.document).trigger('editor-scrolltop', $(window).scrollTop());
});

$(PRE_TAG).mouseup(function(event) {
  return Textspace.registerCaretPos();
}).keydown(function(event) {
  var char, count, i, ind_width, j, key, l, ref, ref1, results, slices, string;
  key = event.which;
  last_key_code = key;
  char = String.fromCharCode(key);
  if (event.metaKey || event.ctrlKey) {
    if (key === 37 && !Textspace.selection.collapsed) {
      Textspace.action("IndentLeft");
    } else if (key === 39 && !Textspace.selection.collapsed) {
      event.preventDefault();
      Textspace.action("IndentRight");
    } else if (key === 83) {
      event.preventDefault();
      $(parent.document).trigger('save-doc');
    } else if (key === 89) {
      event.preventDefault();
      Textspace.redo();
    } else if (key === 90) {
      event.preventDefault();
      Textspace.undo();
    }
    return;
  }
  if (key === 8) {
    event.preventDefault();
    return Textspace.action("Delete");
  } else if (key === 9) {
    event.preventDefault();
    if (Settings['indentation_method'] === "spaces") {
      ind_width = Settings['indentation_width'];
      slices = Textspace.getEditorTextSlices();
      if (slices.before) {
        string = slices.before.split("\n").pop();
        count = 0;
        for (i = j = 0, ref = string.length; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
          if (string[i] === "\t") {
            count = count + ind_width - (count % ind_width);
          } else {
            count += 1;
          }
        }
      }
      results = [];
      for (i = l = 0, ref1 = ind_width - (count % ind_width); 0 <= ref1 ? l <= ref1 : l >= ref1; i = 0 <= ref1 ? ++l : --l) {
        results.push(Textspace.action("InsertChar", " "));
      }
      return results;
    } else {
      return Textspace.action("InsertChar", "\t");
    }
  } else if (key === 13) {
    event.preventDefault();
    return Textspace.action("InsertLineBreak");
  } else if (key === 46) {
    event.preventDefault();
    return Textspace.action("ForwardsDelete");
  }
}).keypress(function(event) {
  var char, key;
  if (event.metaKey || event.ctrlKey) {
    return;
  }
  key = event.which;
  if (key < 32) {
    return;
  }
  char = String.fromCharCode(key);
  event.preventDefault();
  return Textspace.action("InsertChar", char);
}).keyup(function(event) {
  var key;
  key = event.which;
  if (key >= 33 && key <= 40) {
    return Textspace.registerCaretPos();
  }
}).on('cut', function(event) {
  return Textspace.action("Cut");
}).on('paste', function(event) {
  event.preventDefault();
  return Textspace.action("Paste", event.originalEvent['clipboardData'].getData('text'));
});

EDITOR_OUTER_onMouseDown = function(event) {
  if (event.which === 3 && $(EDITOR_MENU).is(':hidden')) {
    event.preventDefault();
    $(EDITOR_MENU).trigger('openmenu', [event.clientX, event.clientY]);
    return PRE_TAG.contentEditable = null;
  }
};

EDITOR_MENU_onMenuOpen = function(event, mouse_x, mouse_y) {
  var legend, li, ul;
  if ($(this).is(':visible')) {
    event.stopPropagation();
    return;
  }
  ul = document.createElement('ul');
  li = document.createElement('li');
  legend = document.createTextNode("Undo");
  li.appendChild(legend);
  ul.appendChild(li);
  return $(this).empty().append(ul).css('left', mouse_x).css('top', mouse_y).show().focus();
};

EDITOR_MENU_onItemSelect = function(event) {
  var action, target;
  event.preventDefault();
  target = event.target;
  action = $(target).data('action');
  if (action = "undo") {
    return Textspace.undo();
  } else if (action = "redo") {
    return Textspace.redo();
  }
};

css_string = "";

ref = window.Highlighters;
for (k in ref) {
  highlighter = ref[k];
  prefix = "." + highlighter.style_prefix;
  styles = highlighter.stylesheet;
  for (key in styles) {
    value = styles[key];
    css_string += (prefix + key) + " {" + value + "}\n";
  }
}

document.getElementById('highlighter-styles').textContent = css_string;

Textspace.setText(window.doc_text);

w = Settings['indentation_width'];

PRE_TAG.style.tabSize = w;

PRE_TAG.style.MozTabSize = w;

PRE_TAG.style.WebkitTabSize = Settings['indentation_width'];

PRE_TAG.style.MsTabSize = Settings['indentation_width'];

PRE_TAG.style.OTabSize = Settings['indentation_width'];

renderText();

$(document).on('refreshEditorDisplay', function(event) {
  if (!editor_refresh_pending) {
    setTimeout(rewriteEditorContents, 1);
    return editor_refresh_pending = true;
  }
});

window.getText = function() {
  return Textspace.getText();
};


},{"./actions.coffee":1,"./textspace.coffee":3}],3:[function(require,module,exports){
var $, _text;

$ = window.parent.jQuery;

exports.PRE_TAG = document.querySelector('pre');

exports.selection = {
  'start': null,
  'end': null,
  'collapsed': null
};

exports.caret_positioned = false;

exports.undo_stack = [];

exports.redo_stack = [];

exports.getSelection = function() {
  return this.selection;
};

_text = "";

exports.getText = function() {
  return this._text;
};

exports.setText = function(text) {
  return this._text = text;
};

exports.action = function(action_name, new_text) {
  var action_class, add_to_stack, error, error1, last_item;
  try {
    this.selection = this.getSelectionPoints();
    action_class = Actions[action_name];
    last_item = null;
    add_to_stack = true;
    if (this.undo_stack.length > 0 && !this.caret_positioned) {
      last_item = this.undo_stack[this.undo_stack.length - 1];
      if (last_item.isUpdatable() && last_item.getName() === action_name) {
        last_item.update(new_text);
        add_to_stack = false;
      }
    }
    if (add_to_stack) {
      this.undo_stack.push(new action_class(new_text));
      this.redo_stack = [];
    }
    this.caret_positioned = false;
    return $(document).trigger('refreshEditorDisplay');
  } catch (error1) {
    error = error1;
    if (error) {
      return alert(error.name + " : " + error.message);
    }
  }
};

exports.undo = function() {
  var last_item;
  if (this.undo_stack.length > 0) {
    last_item = this.undo_stack.pop();
    this.redo_stack.push(last_item);
    last_item.undo();
    return $(document).trigger('refreshEditorDisplay');
  }
};

exports.redo = function() {
  var last_item;
  if (this.redo_stack.length > 0) {
    last_item = this.redo_stack.pop();
    this.undo_stack.push(last_item);
    last_item.redo();
    return $(document).trigger('refreshEditorDisplay');
  }
};

exports.setSelection = function(start, end) {
  end = end === void 0 ? start : end;
  return this.selection = {
    'start': start,
    'end': end,
    'collapsed': start === end
  };
};

exports.selectionCollapsed = function() {
  return this.selection.start === this.selection.end;
};

exports.textInsert = function(pos, new_text) {
  return this._text = this._text.slice(0, pos) + new_text + this._text.slice(pos);
};

exports.textRemove = function(pos) {
  var removed;
  removed = this._text.slice(pos.start, pos.end);
  this._text = this._text.slice(0, pos.start) + this._text.slice(pos.end);
  return removed;
};

exports.textReplace = function(pos, new_text) {
  return this._text = this._text.slice(0, pos.start) + new_text + this._text.slice(pos.end);
};

exports.replaceSelection = function(new_text) {
  var slices;
  slices = this.getEditorTextSlices();
  this._text = slices.before + new_text + slices.after;
  return {
    'position': slices.before.length,
    'text': slices.selected
  };
};

exports.registerCaretPos = function() {
  this.selection = this.getSelectionPoints();
  return this.caret_positioned = true;
};

exports.getSelectionPoints = function() {
  var s0, sel, start_node, start_offset;
  sel = window.getSelection();
  s0 = sel.getRangeAt(0);
  start_node = s0.startContainer;
  start_offset = s0.startOffset;
  return {
    'start': this.caretPosFromNode(start_node, start_offset),
    'end': this.caretPosFromNode(s0.endContainer, s0.endOffset),
    'collapsed': s0.collapsed
  };
};

exports.caretPosFromNode = function(node, offset) {
  var div, r;
  r = document.createRange();
  r.setStart(this.PRE_TAG, 0);
  r.setEnd(node, offset);
  div = document.createElement('div');
  div.appendChild(r.cloneContents());
  return $(div).find('br').length + $(div).text().length;
};

exports.getEditorTextSlices = function() {
  var r, sel, slices;
  sel = window.getSelection().getRangeAt(0);
  r = document.createRange();
  slices = {
    'before': "",
    'selected': "",
    'after': ""
  };
  r.setStart(this.PRE_TAG, 0);
  r.setEnd(sel.startContainer, sel.startOffset);
  slices.before = this.getTextFromRange(r);
  if (!sel.collapsed) {
    r.setStart(sel.startContainer, sel.startOffset);
    r.setEnd(sel.endContainer, sel.endOffset);
    slices.selected = this.getTextFromRange(r);
  }
  r.setStart(sel.endContainer, sel.endOffset);
  r.setEnd(this.PRE_TAG, this.PRE_TAG.childNodes.length);
  slices.after = this.getTextFromRange(r);
  return slices;
};

exports.getTextFromRange = function(range) {
  return range.toString();
};

"@getTextFromRange(range) ->\n    div = document.createElement('div')\n    div.appendChild(range.cloneContents())\n    #breaks = div.getElementsByTagName('br')\n    #for JS('var i = breaks.length; i > 0; i--') ->\n    #    div.replaceChild(document.createTextNode(\"\n\"), breaks[i - 1])\n    return div.textContent";


},{}]},{},[2]);
