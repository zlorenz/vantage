<?php

     $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_404_image',
        'label'       => __( '404 Image', 'pheromone' ),
        'description' => __( 'Change 404 image', 'pheromone' ),
        'section'     => 'pheromone_404',
        'default'     => get_template_directory_uri() . '/assets/images/0.jpg',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_404_text_1',
        'label'       => __( '404 Text First', 'pheromone' ),
        'section'     => 'pheromone_404',
        'default'     => '404 Error',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_404_text_2',
        'label'       => __( '404 Text Second', 'pheromone' ),
        'section'     => 'pheromone_404',
        'default'     => "It could be you, or it could be us, but there's no page here.",
        'priority'    => 10,
    );
     

     $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_404_copyright',
        'label'       => __( 'Copyright', 'pheromone' ),
        'section'     => 'pheromone_404',
        'default'     => true,
        'priority'    => 10,
);
     $fields[] = array(
        'type'        => 'textarea',
        'settings'     => 'pheromone_404_copyright_text',
        'description' => __( 'Text', 'pheromone' ),
        'section'     => 'pheromone_404',
        'default'     => 'Powered by <a href="https://themeforest.net/user/dankovthemes" target="_blank">DankovThemes</a>',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_404_copyright',
                'operator' => '==',
                'value'    => true,
            ),
    ),
 );