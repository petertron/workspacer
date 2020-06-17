<td>
{name}
<label class="accessible" for="file-{name}">Select file {name}</label>
<input name="items[{name}]" type="checkbox" value="on" readonly="readonly" id="file-{name}">
</td>
<td>{type}</td>
<td>{size}</td>
<td>0</td>
<td>
<a class="pre-upload" data-name="upload">Upload</a>
<a class="pre-upload" data-name="remove">Remove</a>
<a class="uploading" data-name="pause">Pause</a>
<a class="uploading" data-name="abort">Abort</a>
</td>
