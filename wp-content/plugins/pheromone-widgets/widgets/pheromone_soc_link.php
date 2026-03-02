<?php

/**
 * Add function to widgets_init that'll load our widget.
 */

add_action('widgets_init', 'pheromone_soc_link_widget');

function pheromone_soc_link_widget() {
	register_widget('Pheromone_Soc_Link_Widget');
}


/**
 * Widget class.
 * This class handles everything that needs to be handled with the widget:
 * the settings, form, display, and update. 
 *
 */
class Pheromone_Soc_Link_Widget extends WP_Widget {

	/**
	 * Widget setup.
	 */		
	
	function __construct() {
		parent::__construct(
			'universal-soc-link-widget',
			__( 'Pheromone: Social Links', 'pheromone' ),
			array(
				'classname' => 'universal-soc-link-widget',
				'description' => esc_html__( 'Add yours social links.', 'pheromone' ),
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
		$twitter = $instance['twitter'];
		$facebook = $instance['facebook'];
		$tumblr = $instance['tumblr'];
		$dropbox = $instance['dropbox'];
		$dribbble = $instance['dribbble'];
		$vimeo = $instance['vimeo'];
		$instagram = $instance['instagram'];
		$linkedin = $instance['linkedin'];
		$youtube = $instance['youtube'];
		$xinpianchang = $instance['xinpianchang'];

		$time_id = rand();

		/* Before widget (defined by themes). */
		// Before widget (defined by theme functions file)
	echo $before_widget;
	// Display the widget title if one was input
	if ( $title )
		echo $before_title . $title . $after_title;
		?>

		<div class="pheromone_about_widget">
            <ul class="soc-footer">
                  <?php if($vimeo != false) {?><li><a href="<?php echo  $instance['vimeo']?>" target="_blank"><i class="fa fa-vimeo"></i></a></li><?php } ?>
                  <?php if($instagram != false) {?><li><a href="<?php echo  $instance['instagram']?>" target="_blank"><i class="fa fa-instagram"></i></a></li><?php } ?>
                  <?php if($facebook != false) {?><li><a href="<?php echo  $instance['facebook']?>" target="_blank"><i class="fa fa-facebook"></i></a></li><?php } ?>
                  <?php if($linkedin != false) {?><li><a href="<?php echo  $instance['linkedin']?>" target="_blank"><i class="fa fa-linkedin"></i></a></li><?php } ?>
                  <?php if($twitter != false) {?><li><a href="<?php echo  $instance['twitter']?>" target="_blank"><i class="fa fa-twitter"></i></a></li><?php } ?>
                  <?php if($tumblr != false) {?><li><a href="<?php echo  $instance['tumblr']?>" target="_blank"><i class="fa fa-tumblr"></i></a></li><?php } ?>
                  <?php if($dropbox != false) {?><li><a href="<?php echo  $instance['dropbox']?>" target="_blank"><i class="fa fa-dropbox"></i></a></li><?php } ?>
                  <?php if($dribbble != false) {?><li><a href="<?php echo  $instance['dribbble']?>" target="_blank"><i class="fa fa-dribbble"></i></a></li><?php } ?>
                  <?php if($youtube != false) {?><li><a href="<?php echo  $instance['youtube']?>" target="_blank"><i class="fa fa-youtube-play"></i></a></li><?php } ?>
                  <?php if($xinpianchang != false) {?><li><a href="<?php echo  $instance['xinpianchang']?>" target="_blank"><i class="xinpianchang"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 600 615.8" xml:space="preserve"><g transform="translate(0.000000,700.000000) scale(0.100000,-0.100000)"><path class="fill-color" d="M1524.8,6986.5c-334-46-612-184-836-418c-381-397-593-1019-675-1977c-21-243-17-1162,5-1400 c54-573,152-1004,307-1355c110-248,219-413,380-575c244-246,522-372,900-411c669-68,1665,288,2761,987l145,93l180-49 c481-131,707-190,711-186c3,2-41,176-98,386l-102,382l136,136c252,255,382,430,502,677c282,580,191,1142-279,1729 c-102,128-346,372-496,497c-550,460-1408,965-2095,1234c-356,140-664,220-970,255C1879.8,7004.5,1642.8,7002.5,1524.8,6986.5z  M1467.8,4790.5c151-32,249-127,307-297l26-77l3-617l3-618h-170h-170l-3,573l-3,572l-25,50c-32,65-77,95-142,95c-27,0-64-7-83-15 c-49-20-131-100-198-193l-57-79v-502v-501h-170h-170v795v795h144h143l7-37c3-21,6-73,6-116v-77l93,93 C1152.8,4780.5,1291.8,4827.5,1467.8,4790.5z M2962.8,4785.5c117-24,196-67,284-154c89-88,136-175,170-315c18-75,22-118,21-257 c0-92-3-171-7-177c-4-8-153-11-472-11h-466l6-63c16-172,115-300,266-343c108-32,374-8,579,52l22,6v-150v-151l-52-16 c-159-48-454-76-592-56c-373,53-576,332-576,791c0,293,80,522,239,681C2536.8,4774.5,2739.8,4831.5,2962.8,4785.5z M3919.8,4763.5 c2-4,30-230,61-502c30-272,59-524,63-560l8-65l22,85c13,47,58,202,100,345l77,260h130h130l56-170c31-93,80-250,110-347 c29-98,54-177,55-175c3,3,36,332,74,727c16,173,32,336,36,363l6,47h154c85,0,154-2,154-4s-45-358-100-792s-100-790-100-791 c0-2-87-3-192-3h-193l-55,183c-30,100-72,246-95,324c-22,78-43,144-46,148c-3,3-11-20-18-51c-7-30-48-177-92-325 c-43-148-79-272-79-274c0-3-88-5-195-5c-149,0-195,3-195,13c0,6-45,361-99,787c-55,426-97,778-95,782 C3608.8,4774.5,3912.8,4773.5,3919.8,4763.5z"/><path class="fill-color" d="M2690.8,4487.5c-95-44-162-148-183-281l-9-55h299h300l-7,63c-15,131-72,229-157,271 C2862.8,4520.5,2762.8,4521.5,2690.8,4487.5z"/></g></svg></i></a></li><?php } ?>
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
	$instance['twitter'] = $new_instance['twitter'];
	$instance['facebook'] = $new_instance['facebook'];
	$instance['tumblr'] = $new_instance['tumblr'];
	$instance['dropbox'] = $new_instance['dropbox'];
	$instance['dribbble'] = $new_instance['dribbble'];
	$instance['vimeo'] = $new_instance['vimeo'];
	$instance['instagram'] = $new_instance['instagram'];
	$instance['linkedin'] = $new_instance['linkedin'];
	$instance['youtube'] = $new_instance['youtube'];
	$instance['xinpianchang'] = $new_instance['xinpianchang'];

	return $instance;
}


/*-----------------------------------------------------------------------------------*/
/*	Widget Settings (Displays the widget settings controls on the widget panel)
/*-----------------------------------------------------------------------------------*/
	 
function form( $instance ) {

	// Set up some default widget settings
	$defaults = array(	'title'			=> '',
						'twitter'		=> 'http://twitter.com',
						'facebook'		=> 'http://facebook.com',
						'tumblr'		=> 'http://tumblr.com',
						'dropbox'		=> 'http://dropbox.com',
						'dribbble'		=> 'http://dribbble.com',
						'vimeo'		=> 'http://vimeo.com',
						'instagram'		=> 'http://instagram.com',
						'linkedin'		=> 'http://linkedin.com',
						'youtube'		=> 'http://youtube.com',
						'xinpianchang'	=> 'http://xinpianchang.com',
					);
	
	$instance = wp_parse_args((array) $instance, $defaults);
	?>


	<!-- Widget Title: Text Input -->
	<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['title'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'twitter' ); ?>"><?php _e('Twitter:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'twitter' ); ?>" name="<?php echo $this->get_field_name( 'twitter' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['twitter'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'facebook' ); ?>"><?php _e('Facebook:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'facebook' ); ?>" name="<?php echo $this->get_field_name( 'facebook' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['facebook'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'tumblr' ); ?>"><?php _e('Tumblr:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'tumblr' ); ?>" name="<?php echo $this->get_field_name( 'tumblr' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['tumblr'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'linkedin' ); ?>"><?php _e('LinkedIn:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'linkedin' ); ?>" name="<?php echo $this->get_field_name( 'linkedin' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['linkedin'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'dropbox' ); ?>"><?php _e('Dropbox:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'dropbox' ); ?>" name="<?php echo $this->get_field_name( 'dropbox' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['dropbox'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'dribbble' ); ?>"><?php _e('Dribbble:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'dribbble' ); ?>" name="<?php echo $this->get_field_name( 'dribbble' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['dribbble'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'vimeo' ); ?>"><?php _e('Vimeo:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'vimeo' ); ?>" name="<?php echo $this->get_field_name( 'vimeo' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['vimeo'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'instagram' ); ?>"><?php _e('Instagram:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'instagram' ); ?>" name="<?php echo $this->get_field_name( 'instagram' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['instagram'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'youtube' ); ?>"><?php _e('YouTube:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'youtube' ); ?>" name="<?php echo $this->get_field_name( 'youtube' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['youtube'] ), ENT_QUOTES)); ?>" />
	</p>
    <p>
		<label for="<?php echo $this->get_field_id( 'xinpianchang' ); ?>"><?php _e('Xinpianchang:', 'pheromone') ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'xinpianchang' ); ?>" name="<?php echo $this->get_field_name( 'xinpianchang' ); ?>" value="<?php echo stripslashes(htmlspecialchars(( $instance['xinpianchang'] ), ENT_QUOTES)); ?>" />
	</p>

	<?php
	}
}
?>