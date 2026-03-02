<?php


$fields[] = array(
    'type'        => 'select',
    'settings'    => 'pheromone_post_type',
    'label'       => __('Post Style', 'pheromone'),
    'section'     => 'pheromone_content',
    'default'     => 'classic',
    'priority'    => 10,
    'multiple'    => 1,
    'choices'     => array(
        'classic' => esc_attr__('Classic', 'pheromone'),
        'medium' => esc_attr__('Medium', 'pheromone'),
        'masonry' => esc_attr__('Masonry', 'pheromone'),
    ),
);

$fields[] = array(
    'type'        => 'text',
    'settings'    => 'pheromone_post_height',
    'label'       => __('Post Image Height', 'pheromone'),
    'description'       => __('Set your own height of image in px (ex: 500px)', 'pheromone'),
    'section'     => 'pheromone_content',
    'default'     => '',
    'priority'    => 10,
);


$fields[] = array(
    'type'         => 'multicheck',
    'settings'     => 'pheromone_soc_link',
    'label'        => esc_attr__('Social Media', 'pheromone'),
    'description' => __('Choose your social media in single post', 'pheromone'),
    'section'      => 'pheromone_content',
    'default'      => array('facebook', 'twitter', 'pinterest', 'tumblr', 'google', 'linkedin'),
    'priority'     => 10,
    'choices'      => array(
        'facebook' => esc_attr__('Facebook', 'pheromone'),
        'twitter'   => esc_attr__('Twitter', 'pheromone'),
        'pinterest'    => esc_attr__('Pinterest', 'pheromone'),
        'tumblr'     => esc_attr__('Tumblr', 'pheromone'),
        'google'      => esc_attr__('Google Plus', 'pheromone'),
        'linkedin'     => esc_attr__('LinkedIn', 'pheromone'),
    ),
);


$fields[] = array(
    'type'        => 'radio-image',
    'settings'    => 'pheromone_sidebars',
    'label'       => esc_html__('Sidebar Position', 'pheromone'),
    'description' => __('Sidebars within site, except single post.', 'pheromone'),
    'section'     => 'pheromone_content',
    'default'     => 'sidebar-right',
    'priority'    => 10,
    'choices'     => array(
        'sidebar-left' => get_template_directory_uri() . '/assets/images/2cl.jpg',
        'sidebar-no'  => get_template_directory_uri() . '/assets/images/1c.jpg',
        'sidebar-right'  => get_template_directory_uri() . '/assets/images/2cr.jpg',
    ),
);
$fields[] = array(
    'type'        => 'radio-image',
    'settings'    => 'pheromone_single_sidebars',
    'label'       => esc_html__('Single Sidebar Position', 'pheromone'),
    'description' => __('Sidebars in single post.', 'pheromone'),
    'section'     => 'pheromone_content',
    'default'     => 'sidebar-right',
    'priority'    => 10,
    'choices'     => array(
        'sidebar-left' => get_template_directory_uri() . '/assets/images/2cl.jpg',
        'sidebar-no'  => get_template_directory_uri() . '/assets/images/1c.jpg',
        'sidebar-right'  => get_template_directory_uri() . '/assets/images/2cr.jpg',
    ),

);

$fields[] = array(
    'type'        => 'text',
    'settings'    => 'pheromone_single_blog',
    'label'       => __('Link To Blog', 'pheromone'),
    'description'       => __('Set your link to blogroll page', 'pheromone'),
    'section'     => 'pheromone_content',
    'default'     => home_url('/blog'),
    'priority'    => 10,
);
