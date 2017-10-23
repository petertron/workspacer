{{if directories.length ~current_dir=dir_path}}
    {{for directories}}
    {{if path==~current_dir}}
    <option value="{{:path}}" selected>{{if title}}{{:title}}{{else}}{{:path}}{{/if}}</option>
    {{else}}
    <option value="{{:path}}">{{if title}}{{:title}}{{else}}{{:path}}{{/if}}</option>
    {{/if}}
    {{/for}}
{{/if}}
