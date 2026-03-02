<?php

    $fields[] = array(
        'type'        => 'color',
        'settings'    => 'header_color_image',
        'label'       => __( 'Header Overlay', 'pheromone' ),
        'description' => esc_attr__( 'You can control color of overlay top image.', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'     => 'rgba(23,23,30,0.6)',
        'choices'     => array(
            'alpha' => true,
        )
    );

    $fields[] = array(
        'type'        => 'color',
        'settings'    => 'header_color_image_title',
        'description' => esc_attr__( 'Also, you can change color of text inside area.', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'        => '#ffffff',
        'active_callback'  => array(
            array(
                'setting'  => 'header_color_image',
                'operator' => '!==',
                'value'    => '',
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'select',
        'settings'    => 'pheromone_menu_select',
        'label'       => __( 'Type of menu', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'     => 'standard',
        'priority'    => 10,
        'choices'     => array(
            'standard'   => esc_attr__( 'Standard', 'pheromone' ),
            'onepage'   => esc_attr__( 'Onepage', 'pheromone' )
        ),
    );


     $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_logo_upload',
        'description' => __( 'Add logo', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'     => get_template_directory_uri() . '/assets/images/logo.png',
        'priority'    => 10,
    ); 

     $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_logo_dark_upload',
        'description' => __( 'Add dark logo', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'     => get_template_directory_uri() . '/assets/images/logo-dark.png',
        'priority'    => 10,
    ); 

    $fields[] = array(
        'type'        => 'text',
        'settings'    => 'pheromone_logo_height',
        'label'       => __( 'Logo Height', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'     => '22px',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_logo_favicon',
        'label'       => __( 'Favicon', 'pheromone'),
        'description' => __( 'Image, 144x144 px, in png', 'pheromone' ),
        'section'     => 'pheromone_logo_section',
        'default'     => get_template_directory_uri() . '/assets/images/favicon.png',
        'priority'    => 10,
    );



?>