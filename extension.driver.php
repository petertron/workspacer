<?php

require 'lib/defines.php';

Class Extension_Workspacer extends Extension
{
    public function __construct()
    {
        parent::__construct();
        $this->settings = (object)Symphony::Configuration()->get(WORKSPACER_ID);
    }

    public function install()
    {
        $this->config();
    }

    public function update($previous_version = false)
    {
        $this->config();
    }

    public function uninstall()
    {
        Symphony::Configuration()->remove(WORKSPACER_ID);
        Symphony::Configuration()->write();
    }

    function config()
    {
        Symphony::Configuration()->setArray([WORKSPACER_ID => parse_ini_file(WORKSPACER_LIB . '/editor_default_settings.txt')], true);
            /*[
                WORKSPACER_ID => [
                    'font_family' => 'Monaco',
                    'font_size' => '8.4pt',
                    'line_height' => '148%',
                    'indentation_method' => 'tabs',
                    'indentation_width' => '4'
                ]
            ], true
        );*/
        Symphony::Configuration()->write();
    }

    /*
     * Set naviagtion
     */
    public function fetchNavigation()
    {
        return [
            [
                'location' => __('Blueprints'),
                'name' => __('Workspace'),
                'link' => 'blueprints/workspace/',
                'relative' => false,
                'visible' => 'yes'
            ]
        ];
    }


    // Delegates

    public function getSubscribedDelegates()
    {
        return [
            [
                'page' => '/backend/',
                'delegate' => 'AdminPagePostCallback',
                'callback' => 'postCallback'
            ],
            [
                'page' => '/backend/',
                'delegate' => 'AdminPagePreGenerate',
                'callback' => 'adminPagePreGenerate'
            ],
            [
                'page' => '/system/preferences/',
                'delegate' => 'AddCustomPreferenceFieldsets',
                'callback' => 'appendPreferences'
            ]/*,
            [
                'page' => '/system/preferences/',
                'delegate' => 'Save',
                'callback' => 'savePreferences'
            ]*/
        ];
    }

    public function postCallback(array $context)
    {
        $callback = $context['callback'];
        //echo "<pre>"; print_r($callback);echo "</pre>";
        if ($callback['driver'] == 'blueprintsworkspace') {
            $callback['driver_location'] = WORKSPACER . '/content/content.blueprintsworkspace.php';
        }
        $context['callback'] = $callback;
        //echo "<br><br><pre>"; print_r($callback);echo "</pre>"; die;
    }

    /**
     * Modify admin pages.
     */
    public function adminPagePreGenerate(array $context)
    {
    //print_r($context); die;
        //$o_page = $context['oPage'];
        //var_dump($o_page->Contents); die;
        /*if (!isset($o_page->Workspace)) {
            return;
        }*/

        $callback = Symphony::Engine()->getPageCallback();
        $driver = $callback['driver'];
        if ($driver == 'blueprintspages') {
            $o_page = $context['oPage'];
            $o_page->addStylesheetToHead(WORKSPACER_ASSETS_URL . '/workspace.css');
            $o_page->addScriptToHead(WORKSPACER_ASSETS_URL . '/codearea.js');
            $o_page->addScriptToHead(WORKSPACER_ASSETS_URL . '/page-editor.js');
            $o_page->addScriptToHead(WORKSPACER_ASSETS_URL . '/highlighters/highlight-xsl.js');

            $action = $callback['context'][0];
            if ($action == 'edit') {
                $template = PageManager::fetchPageByID($callback['context'][1]);
                $filename = $template['handle'] . '.xsl';
                $ul = $o_page->Context->getChildByName('ul', 0);
                $ul->prependChild(
                    new XMLElement(
                        'li',
                        new XMLElement(
                            'button',
                            __('Edit Page Template'),
                            [
                                'name' => 'edit-template',
                                'type' => 'button',
                                'title' => __('Edit page template'),
                                //'class' => 'button file',
                                'data-href' => $filename
                            ]
                        )
                    )
                );
            } elseif ($table = $o_page->Form->getChildByName('table', 0)) {
                $tbody = $table->getChildByName('tbody', 0);
                foreach ($tbody->getChildren() as $tr) {
                    $td = $tr->getChild(1);
                    if ($td) {
                        $value = $td->getValue();
                        $td->replaceValue(
                            new XMLElement(
                                'a',
                                $value,
                                [
                                    'title' => 'Edit ' . $value,
                                    'tabindex' => '-1',
                                    'class' => 'file',
                                    'data-href' => $value,
                                ]
                            )
                        );
                    }
                }
            }

            // Editor box

            //print_r($o_page->Context);die;//->Contents;die;
            $this->settings = Symphony::Configuration()->get('workspacer');

            $dialog = new XMLElement('dialog', null, ['id' => 'EditorBox']);

            $form = Widget::Form(SYMPHONY_URL . '/extension/workspacer/ajax/editor/', 'post');
            $form->setAttribute('id', 'EditorForm');
            $form->appendChild(XSRF::formToken());
            $form->appendChild(Widget::Input('fields[directory]', null, 'hidden'));
            $form->appendChild(Widget::Input('fields[filename]', null, 'hidden'));

            $header = new XMLElement('header');
            $div = new XMLElement('div', null, ['class' => 'headline']);
            $div->appendChild(new XMLElement('h1', __('Edit Page Template') . '<span class="filename"></span>'));
            $div->appendChild(
                new XMLElement(
                    'button', __('Close'), array('type' => 'button', 'name' => 'close')
                )
            );
            $header->appendChild($div);
            $status_line = new XMLElement('div', null, ['class' => 'status-line']);
            $header->appendChild($status_line);
            $form->appendChild($header);

            $fieldset = new XMLElement(
                'fieldset',
                null,
                [
                    'name' => 'fs_editor',
                    'class' => 'editor'
                ]
            );

            $fieldset->appendChild(new XMLElement(
                'code-area',
                null,
                [
                    'name' => 'fields[contents]',
                    'lang' => Symphony::Configuration()->get('lang', 'symphony'),
                    'font-family' => $this->settings['font_family'],
                    'font-size' => $this->settings['font_size'],
                    'line-height' => $this->settings['line_height'],
                    'indentation-method' => $this->settings['indentation_method'],
                    'indentation-width' => $this->settings['indentation_width'],
                    'autofocus' => 'autofocus'
                ]
            ));
            $form->appendChild($fieldset);

            $fieldset = new XMLElement(
                'fieldset',
                null,
                array(
                    'class' => 'bottom-actions'
                )
            );

            $fieldset->appendChild(
                new XMLElement(
                    'button',
                    __('Save File'),
                    [
                        'class' => 'float-right',
                        'name' => 'action[save]',
                        'type' => 'submit',
                        'accesskey' => 's'
                    ]
                )
            );
            $form->appendChild($fieldset);
            $dialog->appendChild($form);
            $o_page->Contents->appendChild($dialog);
        }
    }

    public function appendPreferences(array $context)
    {
        $mode = strtolower($this->settings->mode);

        $fieldset = new XMLElement(
            'fieldset',
            new XMLElement('legend', 'Workspacer'),
            ['class' => 'settings']
        );

        $two_columns = new XMLElement('div', null, ['class' => 'two columns']);
        $two_columns->appendChild(
            Widget::Label(
                __('Font Family'),
                Widget::Input(
                    'settings[' . WORKSPACER_ID . '][font_family]', $this->settings->font_family
                ),
                null, null,
                ['class' => 'column']
            )
        );
        $two_columns->appendChild(
            Widget::Label(
                __('Font Size'),
                Widget::Input(
                    'settings[' . WORKSPACER_ID . '][font_size]', $this->settings->font_size
                ),
                null, null,
                ['class' => 'column']
            )
        );
        $fieldset->appendChild($two_columns);

        $one_column = new XMLElement('div', null, ['class' => 'column']);
        $one_column->appendChild(
            Widget::Label(
                __('Line Height'),
                Widget::Input(
                    'settings[' . WORKSPACER_ID . '][line_height]', $this->settings->line_height
                ),
                null, null,
                ['class' => 'column']
            )
        );
        $fieldset->appendChild($one_column);

        $two_columns = new XMLElement('div', null, ['class' => 'two columns']);
        $two_columns->appendChild(
            Widget::Label(
                __('Indentation Method'),
                Widget::Select(
                    'settings[' . WORKSPACER_ID . '][indentation_method]',
                    [
                        ['spaces', $this->settings->indentation_method == 'spaces', 'Spaces'],
                        ['tabs', $this->settings->indentation_method == 'tabs', 'Tabs']
                    ]
                ),
                null, null,
                ['class' => 'column']
            )
        );
        $two_columns->appendChild(
            Widget::Label(
                __('Indentation/Tab Width'),
                Widget::Input(
                    'settings[' . WORKSPACER_ID . '][indentation_width]',
                    $this->settings->indentation_width,
                    'number',
                    ['min' => '1']
                ),
                null, null,
                ['class' => 'column']
            )
        );
        $fieldset->appendChild($two_columns);
        $context['wrapper']->appendChild($fieldset);
    }
}
