<?php
/**
* Plugin Name: Pheromone Testimonials
* Plugin URI: http://themeforest.net/user/DankovThemes
* Description: Testimonials Plugin
* Version: 1.0.0
* Author: DankovThemes
* Author URI: http://themeforest.net/user/DankovThemes
* License: 
*/

//Create Post Formats
add_action( 'init', 'pheromone_testimonials' );
function pheromone_testimonials() {
	register_post_type( 'testimonials',
		array(
			'labels' => array(
				'name' => __( 'Testimonials', 'pheromone' ),
				'singular_name' => __( 'Testimonials', 'pheromone' ),
				'new_item' => __( 'Add New testimonial', 'pheromone' ),
				'add_new_item' => __( 'Add New testimonial', 'pheromone' )
			),
			'menu_icon'           => 'dashicons-format-status',
			'public' => true,
			'has_archive' => false,
			'supports' => array( 'comments', 'editor', 'excerpt', 'thumbnail', 'title' ),
			'capability_type' => 'post',
			'show_ui' => true,
			'publicly_queryable' => true,
			'rewrite' => array('slug' => 'testimonials'),
		)
	);
}

?>