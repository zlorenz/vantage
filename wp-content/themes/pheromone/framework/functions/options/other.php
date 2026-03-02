<?php

    $fields[] = array(
        'type'        => 'color',
        'settings'    => 'site_colors',
        'label'       => __( 'Site Colors', 'pheromone' ),
        'description' => esc_attr__( 'You can control change colors on whole site', 'pheromone' ),
        'section'     => 'pheromone_other',
        'default'     => '#d3bd98',
    );

    $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_search_image',
        'label' =>    esc_html__( 'Search Image', 'pheromone' ),
        'section'     => 'pheromone_other',
        'default'     => get_template_directory_uri() . '/assets/images/10.jpg',
        'priority'    => 10,
    );

     $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_scroll_up',
        'label'       => __( 'Scroll Up', 'pheromone' ),
        'section'     => 'pheromone_other',
        'default'     => '1',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Show', 'pheromone' ),
            'off' => esc_attr__( 'Hide', 'pheromone' ),
        ),
    );

     $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_preloader',
        'label'       => __( 'Preloader', 'pheromone' ),
        'section'     => 'pheromone_other',
        'default'     => '1',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Show', 'pheromone' ),
            'off' => esc_attr__( 'Hide', 'pheromone' ),
        ),
    );