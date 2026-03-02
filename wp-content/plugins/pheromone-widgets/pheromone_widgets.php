<?php
/**
* Plugin Name: Pheromone Widgets
* Plugin URI: http://themeforest.net/user/DankovThemes
* Description: Widgets Plugin
* Version: 1.0.5
* Author: DankovThemes
* Author URI: http://themeforest.net/user/DankovThemes
* License: 
*/

include(plugin_dir_path( __FILE__ ).'widgets/pheromone_popular_posts.php');
include(plugin_dir_path( __FILE__ ).'widgets/pheromone_latest_posts.php');
include(plugin_dir_path( __FILE__ ).'widgets/pheromone_recent_posts_comments.php');
include(plugin_dir_path( __FILE__ ).'widgets/pheromone_soc_link.php');
include(plugin_dir_path( __FILE__ ).'widgets/pheromone_counter.php');
include(plugin_dir_path( __FILE__ ).'widgets/wp-instagram-widget/wp-instagram-widget.php');


/**
 * Add function to widgets_init that'll load our widget.
 */

add_action('widgets_init', 'pheromone_get_in_touch_widget');

function pheromone_get_in_touch_widget() {
	register_widget('Pheromone_Get_In_Touch_Widget');
}


/**
 * Widget class.
 * This class handles everything that needs to be handled with the widget:
 * the settings, form, display, and update. 
 *
 */
class Pheromone_Get_In_Touch_Widget extends WP_Widget {

	/**
	 * Widget setup.
	 */		

	function __construct() {
		parent::__construct(
			'pheromone-get-in-touch-widget',
			__( 'Pheromone: Contact', 'pheromone' ),
			array(
				'classname' => 'pheromone-get-in-touch-widget',
				'description' => esc_html__( 'Get in touch with clients', 'pheromone' ),
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
		$phone = $instance['phone'];
		$email = $instance['email'];
		$adress = $instance['adress'];

		$time_id = rand();

		/* Before widget (defined by themes). */
		// Before widget (defined by theme functions file)
	echo $before_widget;
	// Display the widget title if one was input
	if ( $title )
		echo $before_title . $title . $after_title;
		?>

		<div class="pheromone_about_widget">
				<ul class="contact-footer contact-composer">
                  	<?php if($phone != false) {?><li><i class="fa fa-phone fa-fw"></i> <span><?php echo  $instance['phone']?></span></li><?php } ?>
                  	<?php if($email != false) {?><li><i class="fa fa-envelope fa-fw"></i> <span><?php echo  $instance['email']?></span></li><?php } ?>
                  	<?php if($adress != false) {?><li><i class="fa fa-map-marker fa-fw"></i> <span><?php echo  $instance['adress']?></span></li><?php } ?>
                </ul>   
        </div>

		<?php

		// After widget (defined by theme functions file)
		echo $after_widget;
	}


/*-----------------------------------------------------------------------------------*/
/*	Update Widget
/*-----------------------------------------------------------------------------------*/
	
function update( $new_instance, $old_instance ) {
	$instance = $old_instance;

	// Strip tags to remove HTML (important for text inputs)
	$instance['title'] = strip_tags( $new_instance['title'] );
	// Stripslashes for html inputs
	$instance['phone'] = $new_instance['phone'];
	$instance['email'] = $new_instance['email'];
	$instance['adress'] = $new_instance['adress'];

	return $instance;
}


/*-----------------------------------------------------------------------------------*/
/*	Widget Settings (Displays the widget settings controls on the widget panel)
/*-----------------------------------------------------------------------------------*/
	 
function form( $instance ) {

	// Set up some default widget settings
	$defaults = array(	'title'		=> __( 'Contact' , 'pheromone' ),
						'phone'		=> __( '(123) 456-7890' , 'pheromone' ),
						'email'		=> __( 'info@youwebsite.com' , 'pheromone' ),
						'adress'	=> __( '2345 Some Avenue, New York' , 'pheromone' ),
					);
	
	$instance = wp_parse_args((array) $instance, $defaults);
	?>


	<!-- Widget Title: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['title'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'phone' ); ?>"><?php _e('Phone:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'phone' ); ?>" name="<?php echo $this->get_field_name( 'phone' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['phone'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'email' ); ?>"><?php _e('E-mail:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'email' ); ?>" name="<?php echo $this->get_field_name( 'email' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['email'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'adress' ); ?>"><?php _e('Adress:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'adress' ); ?>" name="<?php echo $this->get_field_name( 'adress' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['adress'] ), ENT_QUOTES)); ?>" />
	</p>

	<?php
	}
}
?>