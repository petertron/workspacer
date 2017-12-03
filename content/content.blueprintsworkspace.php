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
        $this->addScriptToHead(WS\ASSETS_URL . '/CustomElements.min.js');
        //$this->addScriptToHead(WS\ASSETS_URL . '/workspacer.js');
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
                    'title' => __('Close right directory'),
                    'style' => 'display: none'
                )
            )
        );

        //$mb = new XMLELement('ws-mainbox');
        //$this->Form->appendChild($mb);
        /*$div->appendChild(
            new XMLElement(
                'ws-directorybox',
                null,
                array('id' => '_dir_box_0', 'class' => 'column', 'dir-num' => '0')
            )
        );
        $div->appendChild(
            new XMLElement(
                'ws-directorybox',
                null,
                array('id' => '_dir_box_1', 'class' => 'column', 'dir-num' => '1', 'visible' => ''))
        );
        $this->Form->appendChild($div);
*/
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

        // Window mask
        $this->Wrapper->appendChild(new XMLElement('div', null, array('id' => 'mask')));

/*        $template->appendChild(
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
*/
        $this->Body->appendChild(
            new XMLElement(
                'script',
                json_encode(array(
                    'directories' => $this->getRecursiveDirList(),
                    'files' => array(0 => $this->getDirectoryEntries()),
                    'translations' => array(
                        array('fieldName' => 'h_name', 'value' => __('Name')),
                        array('fieldName' => 'h_description', 'value' => __('Description')),
                        array('fieldName' => 'h_size', 'value' => __('Size')),
                        array('fieldName' => 'h_last_modified', 'value' => __('Last Modified')),
                        array('fieldName' => 'b_new_file', 'value' => __('New file')),
                        array('fieldName' => 'b_new_directories', 'value' => __('New directories')),
                        array('fieldName' => 'b_create', 'value' => __('Create')),                        
                        array('fieldName' => 'b_cancel', 'value' => __('Cancel')),                        
                        array('fieldName' => 'l_new_directories', 'value' => __('New directories')),
                        array('fieldName' => 'i_new_directories', 'value' => __('Put each name on a separate line')),
                        array('fieldName' => 'b_close', 'value' => __('Close')),
                        array('fieldName' => 'b_create_file', 'value' => __('Create file')),
                        array('fieldName' => 'b_save_changes', 'value' => __('Save Changes')),
                        array('fieldName' => 'b_save_as', 'value' => __('Save As')),
                        array('fieldName' => 't_new_file', 'value' => __('New file')),
                        array('fieldName' => 't_loading', 'value' => __('Loading')),
                        array('fieldName' => 't_failed_to_load', 'value' => __('Failed to load')),
                        array('fieldName' => 't_creating_file', 'value' => __('Creating file')),
                        array('fieldName' => 't_editing', 'value' => __('Editing')),
                        array('fieldName' => 't_saving', 'value' => __('Saving')),
                        array('fieldName' => 't_file_name', 'value' => __('File name')),
                        array('fieldName' => 'm_undo', 'value' => __('Undo')),
                        array('fieldName' => 'm_redo', 'value' => __('Redo')),
                        array('fieldName' => 'm_cut', 'value' => __('Cut')),
                        array('fieldName' => 'm_copy', 'value' => __('Copy')),
                        array('fieldName' => 'm_delete', 'value' => __('Delete')),
                        array('fieldName' => 'm_select_all', 'value' => __('Select all')),
                        array('fieldName' => 'ta_insert', 'value' => __('insert')),
                        array('fieldName' => 'ta_delete', 'value' => __('delete')),
                        array('fieldName' => 'ta_cut', 'value' => __('cut')),
                        array('fieldName' => 'ta_paste', 'value' => __('paste')),
                    )
                )),
                array('type' => 'application/json', 'id' => 'workspacer-json')
            )
        );
        $this->Contents->appendChild(new XMLElement('script', null, ['src' => WS\ASSETS_URL . '/workspacer.js']));
        $this->Contents->appendChild(new XMLElement('script', null, ['src' => WS\ASSETS_URL . '/highlighters.js.php']));
        //$this->Contents->appendChild(new XMLElement('script', null, ['src' => WS\ASSETS_URL . '/highlighters/highlight-xsl.js']));
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
