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
        //$this->addScriptToHead(WS\ASSETS_URL . '/webcomponents-lite.js');
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
