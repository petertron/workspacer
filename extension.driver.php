<?php

require 'lib/defines.php';

use Workspacer as WS;

Class Extension_Workspacer extends Extension
{
    public function __construct()
    {
        parent::__construct();
        $this->settings = (object)Symphony::Configuration()->get(WS\ID);
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
        Symphony::Configuration()->remove(WS\ID);
        Symphony::Configuration()->write();
    }

    function config()
    {
        Symphony::Configuration()->setArray(
            array(
                WS\ID => array(
                    'font_family' => 'Monaco',
                    'font_size' => '8.4pt',
                    'line_height' => '148%',
                    'indentation_method' => 'tabs',
                    'indentation_width' => '4'
                )
            ), true
        );
        Symphony::Configuration()->write();
    }

    /*
     * Set naviagtion
     */
    public function fetchNavigation()
    {
        return array(
            array(
                'location' => __('Blueprints'),
                'name' => __('Workspace'),
                'link' => 'blueprints/workspace/',
                'relative' => false,
                'visible' => 'yes'
            )
        );
    }


    // Delegates

    public function getSubscribedDelegates()
    {
        return array(
            array(
                'page' => '/backend/',
                'delegate' => 'AdminPagePostCallback',
                'callback' => 'postCallback'
            ),
            array(
                'page' => '/backend/',
                'delegate' => 'AdminPagePreGenerate',
                'callback' => 'adminPagePreGenerate'
            ),
            array(
                'page' => '/system/preferences/',
                'delegate' => 'AddCustomPreferenceFieldsets',
                'callback' => 'appendPreferences'
            )/*,
            array(
                'page' => '/system/preferences/',
                'delegate' => 'Save',
                'callback' => 'savePreferences'
            )*/
        );
    }

    public function postCallback($context)
    {
        $callback = $context['callback'];
        //echo "<pre>"; print_r($callback);echo "</pre>";
        if ($callback['driver'] == 'blueprintsworkspace') {
            $callback['driver_location'] = WS\EXTENSION . '/content/content.blueprintsworkspace.php';
        }
        $context['callback'] = $callback;
        //echo "<br><br><pre>"; print_r($callback);echo "</pre>"; die;
    }

    /**
     * Modify admin pages.
     */
    public function adminPagePreGenerate($context)
    {
        $o_page = $context['oPage'];
        $callback = Symphony::Engine()->getPageCallback();
        $driver = $callback['driver'];
        if ($driver == "blueprintspages") {
            $o_page->addStylesheetToHead(WS\ASSETS_URL . '/workspace.css');
            $o_page->addStylesheetToHead(WS\ASSETS_URL . '/editor.css');
            $o_page->addScriptToHead(WS\ASSETS_URL . '/x-tag+polyfills.js');
            $o_page->addScriptToHead(WS\ASSETS_URL . '/code-editor.js');
            $o_page->addScriptToHead(WS\ASSETS_URL . '/xsl-editor.js');
            $o_page->addScriptToHead(WS\ASSETS_URL . '/editor-box.js');
            $o_page->addScriptToHead(WS\ASSETS_URL . '/TextSplitter.js');
            $o_page->addScriptToHead(WS\ASSETS_URL . '/highlighters/highlight-xsl.js');
            $context = $callback['context'];
            $action = $context[0];
            if ($action == 'edit') {
                $id = $context[1];
                $template = PageManager::fetchPageByID($id);
        //echo '<pre>'; print_r($template); echo '</pre>'; die;
                $ul = $o_page->Context->getChildByName('ul', 0);
                $ul->prependChild(
                    new XMLElement(
                        'li',
                        new XMLElement(
                            'a',
                            __('Edit Page Template'),
                            array(
                                'title' => __('Edit page template'),
                                'tabindex' => '0',
                                'class' => 'button file',
                                'data-href' => $template['handle'] . '.xsl'
                            )
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
                                array(
                                    'title' => 'Edit ' . $value,
                                    'tabindex' => 0,
                                    'class' => 'file',
                                    'data-href' => $value,
                                )
                            )
                        );
                    }
                }
            }

            // Editor box

            $o_page->Head->appendChild(
                new XMLElement(
                    'script', json_encode($this->settings),
                    array('type' => 'application/json', 'id' => 'editor-settings')
                )
            );
            $o_page->Body->appendChild(new XMLElement('div', null, array('id' => 'mask')));
            $editor_container = new XMLElement('editor-box', null, array('id' => 'editor-container'));
            $top_panel = new XMLELement('header', null, array('class' => 'top-panel'));
            $top_panel->appendChild(new XMLElement('p'));
            $top_panel->appendChild(new XMLElement(
                'button',
                __('Close'),
                array('name' => 'close', 'type' => 'button')
            ));
            $editor_container->appendChild($top_panel);

            $bottom_panel = new XMLElement('footer');
            $bottom_panel->appendChild(
                new XMLElement(
                    'button',
                    __('Save Changes'),
                    array('name' => 'save', 'type' => 'button', 'class' => 'button edit', 'accesskey' => 's')
                )
            );
            $editor_container->appendChild($bottom_panel);
            $o_page->Body->appendChild($editor_container);
        }
    }

    public function appendPreferences($context)
    {
        $mode = strtolower($this->settings->mode);

        $fieldset = new XMLElement(
            'fieldset',
            new XMLElement('legend', 'Workspacer'),
            array('class' => 'settings')
        );

        $two_columns = new XMLElement('div', null, array('class' => 'two columns'));
        $two_columns->appendChild(
            Widget::Label(
                __('Font Family'),
                Widget::Input(
                    'settings[' . WS\ID . '][font_family]', $this->settings->font_family
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $two_columns->appendChild(
            Widget::Label(
                __('Font Size'),
                Widget::Input(
                    'settings[' . WS\ID . '][font_size]', $this->settings->font_size
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $fieldset->appendChild($two_columns);

        $one_column = new XMLElement('div', null, array('class' => 'column'));
        $one_column->appendChild(
            Widget::Label(
                __('Line Height'),
                Widget::Input(
                    'settings[' . WS\ID . '][line_height]', $this->settings->line_height
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $fieldset->appendChild($one_column);

        $two_columns = new XMLElement('div', null, array('class' => 'two columns'));
        $two_columns->appendChild(
            Widget::Label(
                __('Indentation Method'),
                Widget::Select(
                    'settings[' . WS\ID . '][indentation_method]',
                    array(
                        array('spaces', $this->settings->indentation_method == 'spaces', 'Spaces'),
                        array('tabs', $this->settings->indentation_method == 'tabs', 'Tabs')
                    )
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $two_columns->appendChild(
            Widget::Label(
                __('Indentation/Tab Width'),
                Widget::Input(
                    'settings[' . WS\ID . '][indentation_width]',
                    $this->settings->indentation_width,
                    'number',
                    array('min' => '1')
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $fieldset->appendChild($two_columns);
        $context['wrapper']->appendChild($fieldset);
    }
}
