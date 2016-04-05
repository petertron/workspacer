d = document

# Functions will be placed here by highlighter modules.
#Symphony.Extensions['Workspacer'] = {'highlighters': {}}

Settings = Symphony.Extensions.Workspacer['settings']

el = null # Document parts
ed = {} # Editor parts

header_height = null
context_height = null

workspace_url = null
editor_url = null
directory_url = null

in_workspace = false
current_filename = null
new_file = false
document_modified = false
syntax_highlighter = null
editor_refresh_pending = false

setEditorHeight = ->
    $(ed.OUTER).height($(window).height() - header_height - context_height - 106 + $(window).scrollTop())

setHeights = ->
    header_height = $(el.header).height() + $(el.nav).height()
    context_height = $(el.context).height()
    #$(el.body)
    #.height($(window).height() + header_height) # + $('div.notifier').height())

    $(el.wrapper)
    .height($(window).height() + header_height)
    .css('overflow', 'hidden')
    $(ed.OUTER)
    .css('overflow', 'hidden')
    #.height($(window).height() + header_height)
    setEditorHeight()

    #.css('height', editor_height_min + $(window).scrollTop() + 'px')

    #$('body').height(window.innerHeight + header_height)

save = ->
    name = if !current_filename then prompt("File name:") else filename
    if name
        saveDocument(input)

saveDocument = (new_filename) ->
    if !current_filename and !new_filename
        if !(new_filename = prompt("File name:"))
            return
    $.ajax({
        'type': 'POST',
        'url': Symphony.Context.get('symphony') + '/extension/workspacer/ajax/' + Symphony.Context.get('env')['0'] + '/',
        'data': {
            'xsrf': $('input[name="xsrf"]').val(),
            'action[save]': '1',
            'fields[dir_path]': $('#dir_path').val(),
            'fields[dir_path_encoded]': $('#dir_path_encoded').val(),
            'fields[current_filename]': current_filename,
            'fields[new_filename]': new_filename,
            'fields[body]': ed.MAIN.contentWindow.getText()
        },
        'dataType': 'json',
        'error': (xhr, msg, error) ->
            #$('#saving-popup').hide()
            alert (error + " - " + msg)
        ,
        'success': (data) ->
            #$(SAVING_POPUP).hide()
            if data.new_filename
                current_filename = data.new_filename
                #$('input[name="fields[existing_file]"]').val(data.new_filename)
                $(el.subheading).text(current_filename)
                $('title').html("#{current_filename} &ndash; Workspace &ndash; Symphony")
                #history.replaceState({'a': 'b'}, '', directory_url + data.new_filename_encoded + '/')
                history.replaceState(
                    {'a': 'b'}, '',
                    Symphony.Context.get('symphony') + '/workspace/editor/' + data.new_path_encoded
                )
                if $(el.actions).hasClass('new')
                    $(el.actions).removeClass('new').addClass('edit')
                el.iframe.setHighlighter(current_filename)

            $('div.notifier').trigger('attach.notify', [data.alert_msg, data.alert_type])
            if $(el.body).hasClass('new')
                $(el.body)
                .removeClass('new')
                .addClass('edit')
            if data.alert_type == 'error'
                $(window).scrollTop(0)

            setHeights()
    })

#
# Set editor up..
#
$(document).ready(->
    #if (window.getSelection() == undefined) return
    el = Symphony.Elements
    el.subheading = $('#symphony-subheading')
    el.filename = $('#filename')
    el.form = $(el.contents).find('form')[0]
    el.iframe = $(el.form).find('iframe')[0].contentWindow
    #el.iframe = window.frames[0]
    current_filename = $(el.form).data('filename')
    el.actions = $(el.form).find('div.actions')

    #alert window.frames[0]
    #alert el.iframe#.contentWindow
    #pg.SAVING_POPUP = $('#saving-popup')

    header_height = $(el.header).height()
    context_height = $(el.context).height()

    in_workspace = !($(el.body).data('0') == 'template' or $(el.body).hasClass('template'))
    if in_workspace
        directory_url = Symphony.Context.get('symphony')
        + Symphony.Context.get('env')['page-namespace'] + '/' + $(el.form).find('input[name="fields[dir_path_encoded]"]').attr('value')

    ed.OUTER = $('#editor')[0]
    ed.LINE_NUMBERS = $('#editor-line-numbers')[0]
    ed.MAIN = $('#editor-main')[0]
    #ed.MENU = $('#editor-menu')[0]

    $(window).resize((event) ->
        setHeights()
    )

    $(document)
    .on('editor-focusin', (event) ->
        if !($(ed.OUTER).hasClass('focus'))
            $(ed.OUTER).addClass('focus')
    )
    .on('editor-focusout', (event) ->
        if $(ed.OUTER).hasClass('focus')
            $(ed.OUTER).removeClass('focus')
    )
    .on('editor-scrolltop', (event, top) ->
        ed.LINE_NUMBERS.scrollTop = top
    )
    .on('save-doc', (event) ->
        saveDocument()
    )
    .scroll((event) ->
        setEditorHeight()
    )

    $(ed.LINE_NUMBERS)
    .scrollTop(0)
    .mousedown((event) ->
        event.preventDefault()
        ed.MAIN.focus()
    )

    $('input[name="action[create]"]').click((event) ->
        saveDocument() 
    )

    $('input[name="action[save]"]').click((event) ->
        saveDocument()
    )

    $('input[name="action[save-as]"]').click((event) ->
        if new_filename = prompt("Save as")
            saveDocument(new_filename)
    )
    #if(!$(body).hasClass('unsaved-changes')) $(body).addClass('unsaved-changes')
    #if !document_modified:
    #    document_modified = True
    #    breadcrumbs_filename.html(breadcrumbs_filename.html() + ' <small>↑</small>')

    Symphony.Utilities.requestAnimationFrame(setHeights)
)

window.displayLineNumbers = (num_lines) ->
    l = ''
    for i in [1..num_lines]
        l += i + "<br>"
    $(ed.LINE_NUMBERS)
    .html(l + '<br><br>')
