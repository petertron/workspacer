<?php

class contentExtensionWorkspacerEditor_js
{
    private $output;

    public function build()
    {
        ob_start();
?>
Symphony.Extensions['Workspacer'] = {"settings": <?php echo json_encode(Symphony::Configuration()->get('workspacer')) ?>, "highlighters": {}};
<?php
        $this->output = ob_get_contents() . PHP_EOL . file_get_contents(EXTENSIONS . '/workspacer/assets/editor.js');
        ob_end_clean();
    }

    public function generate()
    {
        return $this->output;
    }
}