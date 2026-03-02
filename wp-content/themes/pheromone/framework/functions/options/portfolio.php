<?php

    $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_single_portfolio_image',
        'label' =>    esc_html__( 'Static Top Image', 'pheromone' ),
        'section'     => 'pheromone_portfolio',
        'priority'    => 10,
    );


    $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_title_portfolio',
        'label'       => __( 'Static Title', 'pheromone' ),
        'description' => __( 'You can set up static title for all single portfolio.', 'pheromone' ),
        'section'     => 'pheromone_portfolio',
        'priority'    => 10,
    );
    
    $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_subtitle_portfolio',
        'label'       => __( 'Name in breadcrumbs', 'pheromone' ),
        'section'     => 'pheromone_portfolio',
        'default'     => 'Single Project',
        'priority'    => 10,
        'active_callback'  => array(
            array(
                'setting'  => 'pheromone_breadcrumbs',
                'operator' => '==',
                'value'    => true,
            ),
        ),
    );


    $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_single_portfolio_vc',
        'label'       => __( 'WPBakery Page Builder', 'pheromone' ),
        'description' => __( 'You can use page builder for single portfolio page with a lot of features. Also you need to enable Portfolio in Post Type: <a href="https://dankov-themes.com/extra/single_portfolio_wpb.png" target="_blank">here</a>', 'pheromone' ),
        'section'     => 'pheromone_portfolio',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Enable', 'pheromone' ),
            'off' => esc_attr__( 'Disable', 'pheromone' ),
        ),
    );

    $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_additional',
        'label'       => __( 'Additional Fields', 'pheromone' ),
        'section'     => 'pheromone_portfolio',
        'default'     => 'on',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Show', 'pheromone' ),
            'off' => esc_attr__( 'Hide', 'pheromone' ),
        ),

    );

    $fields[] = array(
        'type'        => 'text',
        'settings'     => 'pheromone_link_portfolio',
        'label'       => __( 'Link to Works', 'pheromone' ),
        'description' => __( 'Add link to "All Works"', 'pheromone' ),
        'section'     => 'pheromone_portfolio',
        'default'     => home_url('/portfolio'),
        'priority'    => 10,
    );



     