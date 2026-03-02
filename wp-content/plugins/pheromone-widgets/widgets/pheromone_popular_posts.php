<?php
/**
 * Add function to widgets_init that'll load our widget.
 */
add_action('widgets_init', 'pheromone_load_popular_post_widgets');

function pheromone_load_popular_post_widgets()
{
	register_widget('Pheromone_Popular_Posts_Widget');
}


/**
 * Widget class.
 * This class handles everything that needs to be handled with the widget:
 * the settings, form, display, and update. 
 *
 */
	class Pheromone_Popular_Posts_Widget extends WP_Widget {

	/**
	 * Widget setup.
	 */		

	function __construct() {
		parent::__construct(
			'pheromone_popular_post_widget',
			__( 'Pheromone: Popular Posts', 'pheromone' ),
			array(
				'classname' => 'pheromone_popular_post_widget',
				'description' => esc_html__( 'Displays popular posts from blog', 'pheromone' ),
				'customize_selective_refresh' => true
			)
		);
	}


/*-----------------------------------------------------------------------------------*/
/*	Display Widget
/*-----------------------------------------------------------------------------------*/
	
function widget( $args, $instance ) {
	extract( $args );

	// Our variables from the widget settings
	$title = apply_filters('widget_title', $instance['title'] );
	$number_of_posts_to_show = $instance['number_of_posts_to_show'];

	// Before widget (defined by theme functions file)
	echo $before_widget;
	// Display the widget title if one was input
	if ( $title )
		echo $before_title . $title . $after_title;

	// Display video widget
	?>
	<?php
    // Loop
	$args = array( 
		'post_type' => 'post',
		'post_status' => array( 'publish' ),
		'posts_per_page' => $number_of_posts_to_show,
		'orderby' => 'meta_value',
		'meta_key' => 'pheromone_post_views_count',
		'ignore_sticky_posts' => 1,
		'order' => 'DESC'
	);
	$the_query = new WP_Query( $args );

	
	?>
	<?php if ( $the_query->have_posts() ) : while ( $the_query->have_posts() ) : $the_query->the_post();?>
    	
   		<?php $large_image_url = wp_get_attachment_image_src( get_post_thumbnail_id(), 'thumbnail'); ?>
    	 <div class="pheromone_popular_widget_post_holder">
         	<div class="pheromone_popular_widget_post_image">
            	<?php if ($large_image_url[0] !='') {?>
				<a class="pheromone_image_link" href="<?php echo the_permalink(); ?>"><img class="img-responsive" src="<?php echo $large_image_url[0]; ?>" alt="<?php the_title(); ?>"></a>
                <?php }else{?>
                <img class="img-responsive" src="<?php echo get_template_directory_uri(); ?>/framework/images/noimage-s.jpg" alt="<?php the_title(); ?>" >
				<?php };?>
            </div>
            <div class="pheromone_popular_widget_post_content">
            	<div class="pheromone_popular_widget_post_content_date"><?php the_time( get_option( 'date_format' ) ); ?></div>
            	<h5 class="pheromone_blog_post_title"><a href="<?php echo the_permalink(); ?>"><?php the_title(); ?> </a></h5>
            </div>
         </div>
         <div class="clearfix"></div>
	<?php endwhile;  ?> 
    <?php endif; ?>
	<?php	 		 	

	// After widget (defined by theme functions file)
	echo $after_widget;
	wp_reset_postdata();
}


/*-----------------------------------------------------------------------------------*/
/*	Update Widget
/*-----------------------------------------------------------------------------------*/
	
function update( $new_instance, $old_instance ) {
	$instance = $old_instance;

	// Strip tags to remove HTML (important for text inputs)
	$instance['title'] = strip_tags( $new_instance['title'] );
	
	// Stripslashes for html inputs
	$instance['number_of_posts_to_show'] = stripslashes( $new_instance['number_of_posts_to_show']);

	// No need to strip tags

	return $instance;
}


/*-----------------------------------------------------------------------------------*/
/*	Widget Settings (Displays the widget settings controls on the widget panel)
/*-----------------------------------------------------------------------------------*/
	 
function form( $instance ) {

	// Set up some default widget settings
	$defaults = array( 'title' => __( 'Popular Posts' , 'pheromone' ), 'number_of_posts_to_show' => '3' );
	
	$instance = wp_parse_args( (array) $instance, $defaults ); ?>

	<!-- Widget Title: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo $instance['title']; ?>" />
	</p>


	<!-- Number of Posts: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'number_of_posts_to_show' ); ?>"><?php _e('Number of posts to show:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'number_of_posts_to_show' ); ?>" name="<?php echo $this->get_field_name( 'number_of_posts_to_show' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['number_of_posts_to_show'] ), ENT_QUOTES)); ?>" />
	</p>

	<?php	 		 	
	}
}
?>