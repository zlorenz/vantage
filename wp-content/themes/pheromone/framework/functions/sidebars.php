<?php
/*=======================================
	Register Sidebar UNLIMITED 
=======================================*/

add_action( 'widgets_init', 'pheromone_widgets_init' );
function pheromone_widgets_init() {


	register_sidebar( array(
		'name' => __( 'Main Sidebar', 'pheromone' ),
		'id' => 'sidebar-1',
		'description' => __( 'Appears on posts and pages except the optional Front Page template, which has its own widgets', 'pheromone' ),
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => '</aside>',
		'before_title' => '<h4>',
		'after_title' => '</h4>',
	) );

	register_sidebar( array(
		'name' => __( 'Footer Sidebar 1', 'pheromone' ),
		'id' => 'footer-1',
		'description' => __( 'Appears on all pages at the bottom of site.', 'pheromone' ),
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => '</aside>',
		'before_title' => '<h4>',
		'after_title' => '</h4>',
	) );


	register_sidebar( array(
		'name' => __( 'Footer Sidebar 2', 'pheromone' ),
		'id' => 'footer-2',
		'description' => __( 'Appears on all pages at the bottom of site.', 'pheromone' ),
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => '</aside>',
		'before_title' => '<h4>',
		'after_title' => '</h4>',
	) );

	register_sidebar( array(
		'name' => __( 'Footer Sidebar 3', 'pheromone' ),
		'id' => 'footer-3',
		'description' => __( 'Appears on all pages at the bottom of site.', 'pheromone' ),
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => '</aside>',
		'before_title' => '<h4>',
		'after_title' => '</h4>',
	) );

	register_sidebar( array(
		'name' => __( 'Footer Sidebar 4', 'pheromone' ),
		'id' => 'footer-4',
		'description' => __( 'Appears on all pages at the bottom of site.', 'pheromone' ),
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => '</aside>',
		'before_title' => '<h4>',
		'after_title' => '</h4>',
	) );

	register_sidebar( array(
		'name' => __( 'WooCommerce Sidebar', 'pheromone' ),
		'id' => 'shop',
		'description' => __( 'Add your widgets to shop page', 'pheromone' ),
		'before_widget' => '<aside id="%1$s" class="widget %2$s">',
		'after_widget' => '</aside>',
		'before_title' => '<div class="widget-line"><h4>',
		'after_title' => '</h4></div>',
	) );
	
};

?>