<?php

     $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_widget_footer',
        'label'       => __( 'Widgets Footer', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => false,
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Enable', 'pheromone' ),
            'off' => esc_attr__( 'Disable', 'pheromone' ),
        ),
);

     
     $fields[] = array(
        'type'        => 'select',
        'settings'    => 'pheromone_widget_footer_count',
        'label'       => __( 'Count Of Widgets', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'three',
        'priority'    => 10,
        'choices'     => array(
            'one'   => esc_attr__( '1/3 + 1/4 + 1/6 + 1/4', 'pheromone' ),
            'three'   => esc_attr__( '1/4 + 1/4 + 1/4', 'pheromone' ),
            'four' => esc_attr__( '1/3 + 1/3 + 1/3 + 1/3', 'pheromone' ),
            'five' => esc_attr__( '1/4 + 2/4 + 1/4', 'pheromone' ),
        ),
);

     $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_author_footer',
        'label'       => __( 'Bottom Footer', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '1',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Enable', 'pheromone' ),
            'off' => esc_attr__( 'Disable', 'pheromone' ),
        ),
);

     $fields[] = array(
        'type'        => 'select',
        'settings'    => 'pheromone_author_footer_color',
        'label'       => __( 'Bottom Footer Color', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'gray',
        'priority'    => 10,
        'choices'     => array(
            'white' => esc_attr__( 'White', 'pheromone' ),
            'gray' => esc_attr__( 'Gray', 'pheromone' ),
        ),
);

     $fields[] = array(
        'type'        => 'select',
        'settings'    => 'pheromone_widget_footer_2_count',
        'label'       => __( 'Count Of Row', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'three',
        'priority'    => 10,
        'choices'     => array(
            'one'   => esc_attr__( '1/12', 'pheromone' ),
            'two'   => esc_attr__( '1/6 + 1/6', 'pheromone' ),
            'three' => esc_attr__( '1/4 + 1/4 + 1/4', 'pheromone' ),
            ),
);
     $fields[] = array(
        'type'        => 'toggle',
        'settings'     => 'pheromone_fot_arrow',
        'label'       => __( 'Show arrow to up?', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '1',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Yes', 'pheromone' ),
            'off' => esc_attr__( 'No', 'pheromone' ),
        ),
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'one',
            ),
    ),
 );

     $fields[] = array(
        'type'        => 'toggle',
        'settings'     => 'pheromone_fot_button',
        'label'       => __( 'Button', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '1',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Yes', 'pheromone' ),
            'off' => esc_attr__( 'No', 'pheromone' ),
        ),
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'one',
            ),
    ),
 );

     $fields[] = array(
        'type'        => 'textarea',
        'settings'     => 'pheromone_fot_button_link',
        'description' => __( 'Button Link', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '<a href="https://themeforest.net/item/pheromone-creative-multiconcept-wordpress-theme/19557577" target="_blank" class="btn btn-lg btn-gray">Purchase now</a>',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'one',
            ),
    ),
 );
     $fields[] = array(
        'type'        => 'textarea',
        'settings'    => 'pheromone_footer_copy_1',
        'label'       => __( 'Copyright Text', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'Powered by <a href="https://themeforest.net/user/dankovthemes" target="_blank">DankovThemes</a>',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'three',
            ),
    ),
 );

     $fields[] = array(
        'type'        => 'textarea',
        'settings'    => 'pheromone_footer_copy_2',
        'label'       => __( 'Copyright Text', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'Powered by <a href="https://themeforest.net/user/dankovthemes" target="_blank">DankovThemes</a>',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'two',
            ),
    ),
 );

     $fields[] = array(
        'type'        => 'textarea',
        'settings'    => 'pheromone_footer_copy_3',
        'label'       => __( 'Copyright Text', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'Powered by <a href="https://themeforest.net/user/dankovthemes" target="_blank">DankovThemes</a>',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'one',
            ),
    ),
 );

     $fields[] = array(
        'type'        => 'textarea',
        'settings'    => 'pheromone_footer_love',
        'label'       => __( 'Middle Text', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'We <i class="fa fa-heart fa-fw"></i> creative people',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_widget_footer_2_count',
                'operator' => '==',
                'value'    => 'three',
            ),
    ),
 );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_twitter',
        'label'       => __( 'Social Media', 'pheromone' ),
        'description' => __( 'Twitter', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'https://twitter.com/',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_facebook',
        'description' => __( 'Facebook', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'https://facebook.com/',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_googleplus',
        'description' => __( 'Google Plus', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'https://plus.google.com/',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_linkedin',
        'description' => __( 'LinkedIn', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => 'https://linkedin.com/',
        'priority'    => 10,
    );


     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_dribbble',
        'description' => __( 'Dribbble', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_instagram',
        'description' => __( 'Instagram', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_youtube',
        'description' => __( 'YouTube', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_flickr',
        'description' => __( 'Flickr', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );


     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_tumblr',
        'description' => __( 'Tumblr', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );



     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_foursquare',
        'description' => __( 'Foursquare', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_vk',
        'description' => __( 'VK', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_behance',
        'description' => __( 'Behance', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_pinterest',
        'description' => __( 'Pinterest', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_github',
        'description' => __( 'GitHub', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );


     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_fot_soc_rss',
        'description' => __( 'RSS', 'pheromone' ),
        'section'     => 'pheromone_footer',
        'default'     => '',
        'priority'    => 10,
    );


?>