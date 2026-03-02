<?php

/**
 * Add function to widgets_init that'll load our widget.
 */

add_action('widgets_init', 'pheromone_counter_widget');

function pheromone_counter_widget() {
	register_widget('Pheromone_Counter_Widget');
}


/**
 * Widget class.
 * This class handles everything that needs to be handled with the widget:
 * the settings, form, display, and update. 
 *
 */
class Pheromone_Counter_Widget extends WP_Widget {

	/**
	 * Widget setup.
	 */		

	function __construct() {
		parent::__construct(
			'universal-counter-widget',
			__( 'Pheromone: Counter', 'pheromone' ),
			array(
				'classname' => 'universal-counter-widget',
				'description' => esc_html__( 'Counter Widget', 'pheromone' ),
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
		$twitter = $instance['count'];
		$tumblr = $instance['delay'];
		$dropbox = $instance['increment'];

		$time_id = rand();

		/* Before widget (defined by themes). */
		// Before widget (defined by theme functions file)
	echo $before_widget;
	// Display the widget title if one was input
	if ( $title )
		echo $before_title . $title . $after_title;
		?>

        <span data-min="0" data-max="<?php echo  $instance['count']?>" data-delay="<?php echo  $instance['delay']?>" data-increment="<?php echo  $instance['increment']?>" class="numscroller">0</span>

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
	$instance['count'] = $new_instance['count'];
	$instance['delay'] = $new_instance['delay'];
	$instance['increment'] = $new_instance['increment'];

	return $instance;
}


/*-----------------------------------------------------------------------------------*/
/*	Widget Settings (Displays the widget settings controls on the widget panel)
/*-----------------------------------------------------------------------------------*/
	 
function form( $instance ) {

	// Set up some default widget settings
	$defaults = array(	'title'			=> '',
						'count'		=> '2785',
						'delay'		=> '5',
						'increment'		=> '3',
					);
	
	$instance = wp_parse_args((array) $instance, $defaults);
	?>


	<!-- Widget Title: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['title'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'count' ); ?>"><?php _e('Count:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'count' ); ?>" name="<?php echo $this->get_field_name( 'count' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['count'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'delay' ); ?>"><?php _e('Delay:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'delay' ); ?>" name="<?php echo $this->get_field_name( 'delay' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['delay'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'increment' ); ?>"><?php _e('Increment:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'increment' ); ?>" name="<?php echo $this->get_field_name( 'increment' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['increment'] ), ENT_QUOTES)); ?>" />
	</p>

	<?php
	}
}
?>