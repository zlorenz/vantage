<?php	 		 	

/**
 * Add function to widgets_init that'll load our widget.
 */
add_action('widgets_init', 'pheromone_load_recent_posts_comments_widgets');

function pheromone_load_recent_posts_comments_widgets()
{
	register_widget('pheromone_Recent_Posts_Comments_Widget');
}


/**
 * Widget class.
 * This class handles everything that needs to be handled with the widget:
 * the settings, form, display, and update. 
 *
 */
	class pheromone_Recent_Posts_Comments_Widget extends WP_Widget {

	/**
	 * Widget setup.
	 */		

	function __construct() {
		parent::__construct(
			'pheromone_recent_posts_comments_widget',
			__( 'Pheromone: Recent Comments', 'pheromone' ),
			array(
				'classname' => 'pheromone_recent_posts_comments_widget',
				'description' => esc_html__( 'Recent comments in site', 'pheromone' ),
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
	'status'       => 'approve',
	'number'       => $number_of_posts_to_show,
	);
	
	// The Query
	$comments_query = new WP_Comment_Query;
	$comments = $comments_query->query( $args );
	
	// Comment Loop
	if ( $comments ) {
		foreach ( $comments as $comment ) {
			$e_mail = $comment->comment_author_email;
			$comment_date = get_comment_date( get_option( 'date_format' ), $comment->comment_ID );
			?>
            
        <div class="pheromone_recent_comment_post_holder">
            <div class="pheromone_recent_comment_post">
            	<div class="pheromone_small_avatar">
					<?php echo get_avatar( $e_mail, '50');?>
                </div>
                <div class="pheromone_widget_post_content">
					<h6><?php echo $comment->comment_author;?>,  <span class="comment_date"><?php echo $comment_date?></span></h6>
                    <?php $height = strlen($comment->comment_content);?>
                    <div class="pheromone_post_content_content"><a  href="<?php echo get_permalink($comment->comment_post_ID); ?>"><?php echo substr($comment->comment_content,0,100); if($height>100){echo '...';}  ?> </a></div>
                </div>
            </div>
        </div>	
        <div class="clearfix"></div>  
		<?php }
	} else {
		echo 'No comments found.';
	}

	?>
   
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
	$instance['number_of_posts_to_show'] = stripslashes( $new_instance['number_of_posts_to_show']);

	// No need to strip tags

	return $instance;
}


/*-----------------------------------------------------------------------------------*/
/*	Widget Settings (Displays the widget settings controls on the widget panel)
/*-----------------------------------------------------------------------------------*/
	 
function form( $instance ) {

	// Set up some default widget settings
	$defaults = array( 'title' => __( 'Recent Comments' , 'pheromone' ), 'number_of_posts_to_show' => '3' );
	
	$instance = wp_parse_args( (array) $instance, $defaults ); ?>

	<!-- Widget Title: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo $instance['title']; ?>" />
	</p>


	<!-- Number of Posts: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'number_of_posts_to_show' ); ?>"><?php _e('Number of comments to show:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'number_of_posts_to_show' ); ?>" name="<?php echo $this->get_field_name( 'number_of_posts_to_show' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['number_of_posts_to_show'] ), ENT_QUOTES)); ?>" />
	</p>

	<?php	 		 	
	}
}
?>