<thead>
    <tr>
        <th scope="col"><?= __('Name') ?></th>
        <th scope="col"><?= __('Description') ?></th>
        <th scope="col"><?= __('Size') ?></th>
        <th scope="col"><?= __('Last Modified') ?></th>
    </tr>
</thead>
<tbody>
    {{if files.length ~num=dir_num}}
    {{for files}}<tr>
        <td>
            <a class="{{:class}}" title="{{:title}}" data-href="{{:href}}" tabindex="0">{{:name}}</a>
            <label class="accessible" for="{{:href}}"><?= __('Select File') . ' {{:name}}'?></label>
            <input name="sets[{{:~num}}][items][{{:name}}]" value="yes" type="checkbox" id="{{:href}}"/>
        </td>
        <td>{{:description}}</td>
        <td>{{:size}}</td>
        <td>{{:mtime}}</td>
    </tr>
    {{/for}}
    {{else}}<tr><td class="inactive" colspan="4">None found.</td></tr>
    {{/if}}
</tbody>
