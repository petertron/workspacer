{%if uploads%}
	{%each uploads%}
	<tr>
		<td>${name}<input type="checkbox" name="${name}"/></td>
		<td>${size}</td>
		<td>${status}</td>
	</tr>
	{%/each%}
	{%if uploads.length == 0%}
	<tr class="odd">
		<td class="inactive" colspan="5">Empty.</td>
	</tr>
	{%/if%}
{%/if%}