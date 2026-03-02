<?php

    $fields[] = array(
        'type'        => 'image',
        'settings'     => 'pheromone_woo_image',
        'label' =>    esc_html__( 'Shop Image', 'pheromone' ),
        'section'     => 'pheromone_woocommerce',
        'default'     => get_template_directory_uri() . '/assets/images/woo.jpg',
        'priority'    => 10,
    );


    $fields[] = array(
        'type'        => 'toggle',
        'settings'    => 'pheromone_cart_disable',
        'label'       =>  esc_html__( 'Shop Cart In Menu', 'pheromone' ),
        'section'     => 'pheromone_woocommerce',
        'default'     => '1',
        'priority'    => 10,
        'choices'     => array(
            'on'  => esc_attr__( 'Enable', 'pheromone' ),
            'off' => esc_attr__( 'Disable', 'pheromone' ),
        ),
);

    
    $fields[] = array(
        'type'        => 'radio-image',
        'settings'    => 'pheromone_woo_sidebars',
        'label'       => esc_html__( 'Shop Sidebar Position', 'pheromone' ),
        'section'     => 'pheromone_woocommerce',
        'default'     => 'sidebar-no',
        'priority'    => 10,
        'choices'     => array(
            'sidebar-left' => get_template_directory_uri() . '/assets/images/2cl.jpg',
            'sidebar-no'  => get_template_directory_uri() . '/assets/images/1c.jpg',
            'sidebar-right'  => get_template_directory_uri() . '/assets/images/2cr.jpg',
        )
);
