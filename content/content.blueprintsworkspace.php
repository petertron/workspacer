<?php

require_once EXTENSIONS . '/workspacer/lib/trait.files.php';

use Workspacer as WS;

class contentBlueprintsWorkspace extends AdministrationPage
{
    use Files;

    public $_errors = array();
    //public $_existing_file;

    public function __construct()
    {
        parent::__construct();
        $this->settings = (object)Symphony::Configuration()->get(WS\ID);
    }

    public function __viewIndex()
    {
        $this->addStylesheetToHead(WS\ASSETS_URL . '/workspace.css');
        $this->addStylesheetToHead(WS\ASSETS_URL . '/editor.css');
        $this->addScriptToHead(WS\ASSETS_URL . '/jsrender.min.js');
        $this->addScriptToHead(WS\ASSETS_URL . '/x-tag+polyfills.js');
        $this->addScriptToHead(WS\ASSETS_URL . '/code-editor.js');
        $this->addScriptToHead(WS\ASSETS_URL . '/highlighters.js.php');
        $this->addScriptToHead(WS\ASSETS_URL . '/workspace.js');
        $this->addScriptToHead(WS\ASSETS_URL . '/dir-box.js');
        $this->addScriptToHead(WS\ASSETS_URL . '/editor-box.js');
        $this->Head->appendChild(
            new XMLElement(
                'script', json_encode($this->settings),
                array('type' => 'application/json', 'id' => 'editor-settings')
            )
        );
        $this->setTitle(__('%1$s &ndash; %2$s', array(__('Workspace'), __('Symphony'))));
        $this->setPageType('index');

        $this->appendSubheading(__('Workspace'));

        $this->insertAction(
            new XMLElement(
                'button',
                __('Split View'),
                array(
                    'class' => 'button default-view',
                    'name' => 'split-view',
                    'title' => __('View two directories')
                )
            )
        );
        $this->insertAction(
            new XMLElement(
                'button',
                __('Close Left'),
                array(
                    'class' => 'button split-view',
                    'name' => 'close-left',
                    'title' => __('Close left directory'),
                    'style' => 'display: none'
                )
            )
        );
        $this->insertAction(
            new XMLElement(
                'button',
                __('Close Right'),
                array(
                    'class' => 'button split-view',
                    'name' => 'close-right',
                    'title' => __('Clode right directory'),
                    'style' => 'display: none'
                )
            )
        );

        $div = new XMLElement('div', null, array('id' => 'directories-wrapper'));
        $div->appendChild(
            new XMLElement(
                'dir-box',
                null,
                array('class' => 'column', 'data-dir-num' => '0', 'active' => 'true')
            )
        );
        $div->appendChild(
            new XMLElement(
                'dir-box',
                null,
                array('class' => 'column', 'data-dir-num' => '1', 'active' => 'false'))
        );
        $this->Form->appendChild($div);

        $version = new XMLElement('p', 'Symphony ' . Symphony::Configuration()->get('version', 'symphony'), array('id' => 'version'));
        $this->Form->appendChild($version);

        $this->Form->appendChild(
            new XMLElement(
                'div',
                Widget::Apply(
                    array(
                        array(null, false, __('With Selected...')),
                        array('delete', false, __('Delete'), 'confirm', NULL, array('data-message' => "Are you sure you want to delete the selected files?")),
                        array('move', false, __('Move across'), 'split-view'),
                        array('copy', false, __('Copy across'), 'split-view'),
                        array('download', false, __('Download'))
                    )
                ),
                array('class' => 'actions')
            )
        );

        // Editor box
        $this->Wrapper->appendChild(new XMLElement('div', null, array('id' => 'mask')));
        $editor_container = new XMLElement('editor-box', null, array('id' => 'editor-container'));
        $top_panel = new XMLELement('header', null, array('class' => 'top-panel'));
        $top_panel->appendChild(new XMLElement('p'));
        $top_panel->appendChild(new XMLElement(
            'button',
            __('Close'),
            array('name' => 'close', 'type' => 'button')
        ));
        $editor_container->appendChild($top_panel);

        $actions = new XMLElement('footer');
        $editor_container->appendChild($actions);
        /*
        $actions->appendChild(
            new XMLELement(
                'button',
                __('Delete'),
                array(
                    'name' => 'delete',
                    'type' => 'button',
                    'class' => 'confirm delete edit',
                    'title' => 'Delete this file',
                    'accesskey' => 'd',
                    'data-message' => 'Are you sure you want to delete this file?'
                )
            )
        );*/
/*
        $actions->appendChild(
            new XMLElement(
                'button',
                __('Save As'),
                array('name' => 'create', 'type' => 'button', 'class' => 'button edit', 'style' => 'margin-left: 0')
            )
        );
        $actions->appendChild(
            new XMLElement(
                'button',
                __('Create File'),
                array('name' => 'create', 'type' => 'button', 'class' => 'button new', 'id' => 'create-file')//, 'accesskey' => 's')
            )
        );

        $actions->appendChild(
            new XMLElement(
                'button',
                __('Save Changes'),
                array('name' => 'save', 'type' => 'button', 'class' => 'button edit', 'id' => 'save-changes')//, 'accesskey' => 's')
            )
        );
*/
        $template = new XMLElement(
            'template',
            null,
            array('id' => 'editor-container-footer-0')
        );
        $template->appendChild(
            new XMLElement(
                'button',
                __('Create File'),
                array(
                    'name' => 'create',
                    'type' => 'button',
                    'class' => 'button new',
                    'id' => 'create-file',
                    'accesskey' => 's'
                )
            )
        );
        $editor_container->appendChild($template);

        $template = new XMLElement(
            'template',
            null,
            array('id' => 'editor-container-footer-1')
        );
        $template->appendChild(
            new XMLElement(
                'button',
                __('Save As'),
                array(
                    'name' => 'create',
                    'type' => 'button',
                    'class' => 'button edit',
                    'style' => 'margin-left: 0'
                )
            )
        );
        $template->appendChild(
            new XMLElement(
                'button',
                __('Save Changes'),
                array(
                    'name' => 'save',
                    'type' => 'button',
                    'class' => 'button edit',
                    'accesskey' => 's',
                    'id' => 'save-changes'
                )
            )
        );
        $editor_container->appendChild($template);

        $this->Contents->appendChild($editor_container);

        ob_start();
        /*require WS\EXTENSION . '/templates/actions.php';
        $this->Body->appendChild(
            new XMLElement(
                'script', ob_get_contents(), array('type' => 'x-jsrender', 'id' => 'actions')
            )
        );
        ob_clean();*/
        require EXTENSIONS . '/workspacer/templates/template-select.php';
        $this->Body->appendChild(
            new XMLElement(
                'script', ob_get_contents(), array('type' => 'x-jsrender', 'id' => 'template_select')
            )
        );
        ob_clean();
        require EXTENSIONS . '/workspacer/templates/template-table.php';
        $this->Body->appendChild(
            new XMLElement(
                'script', ob_get_contents(), array('type' => 'x-jsrender', 'id' => 'template_table')
            )
        );
        ob_end_clean();

        $this->Body->appendChild(
            new XMLElement('script', json_encode($this->getRecursiveDirList()), array('id' => 'directories'))
        );
        $this->Body->appendChild(
            new XMLElement(
                'script', json_encode($this->getDirectoryEntries()), array('id' => 'files')
            )
        );
    }

    public function __actionIndex()
    {
        //$sets = (is_array($_POST['sets'])) ? array_keys($_POST['sets']) : null;
        if (is_array($_POST['sets']) && !empty($_POST['sets'])) {
            foreach ($_POST['sets'] as $set) {
                $dir_path_abs = rtrim(WORKSPACE . '/' . $set['dir_path'], '/');
                $checked = is_array($set['items']) ? array_keys($set['items']) : null;
                if (is_array($checked) && !empty($checked)) {
                    if ($_POST['with-selected'] == 'download') {
                        $name = $checked[0];
                        $file_path_abs = $dir_path_abs . '/' . $name;
                        if (is_file($file_path_abs)) {
                            header('Content-Description: File Transfer');
                            header('Content-Type: ' . General::getMimeType($file_path_abs));
                            header('Content-Disposition: attachment; filename=' . $name);
                            header('Content-Transfer-Encoding: binary');
                            header('Expires: 0');
                            header('Cache-Control: must-revalidate');
                            header('Pragma: public');
                            header('Content-Length: ' . filesize($file_path_abs));
                            ob_clean();
                            flush();
                            readfile($file_path_abs);
                            exit;
                        }
                    }
                }
            }
        }
    }
}
