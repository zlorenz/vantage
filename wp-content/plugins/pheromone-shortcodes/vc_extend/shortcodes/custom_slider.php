<?php
/*Custom Slider*/
add_shortcode('pheromone_custom_slider', 'pheromone_custom_slider_f');
function pheromone_custom_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'pheromone_id' => 'example_id',
			'pheromone_slider_dots_nav' =>'Show',
			'pheromone_descr' => "Show",
			'pheromone_autoplay' =>'true',
			'pheromone_margin' =>'0',
			'pheromone_time' =>'5000',
			'pheromone_items_1400' =>'1',
			'pheromone_items_m_1400' =>'0',
			'pheromone_items_1200' =>'1',
			'pheromone_items_m_1200' =>'0',
			'pheromone_items_800' =>'1',
			'pheromone_items_m_800' =>'0',
			'pheromone_items_600' =>'1',
			'pheromone_items_m_600' =>'0',
			'pheromone_items_0' =>'1',
			'pheromone_items_m_0' =>'0',
			'wow' => null,
			'wow_delay' => '0.1',
			'wow_animate' => 'fadeIn',
			'css_class' => 'margin: 0;',
		), $atts)
	);



	if ($wow) $wow = 'wow';

	$pheromone_dots_nav ='true';
	$output = '';

	if($pheromone_slider_dots_nav =="Dots"){
		$pheromone_dots_nav ='true';
	}


	$extra_class='';
	if($pheromone_descr == 'None'){$extra_class ='do_not_show_hover';}

	
	$output .='<div class="'.esc_attr($wow).' '. esc_attr($wow_animate) .'" data-wow-delay="'. esc_attr($wow_delay) .'s"><div style="'. esc_attr($css_class).'" class="owl-carousel '.$extra_class.'" data-dots="'.$pheromone_dots_nav.'"  class="pheromone_owl_slider" id="'.$pheromone_id.'">'.do_shortcode($content).'</div></div>';


	$output .='<script>
jQuery(window).load(function(){
		jQuery("#'.$pheromone_id.'").owlCarousel({
			loop:true,
			autoplay:'.$pheromone_autoplay.',
			margin:'.$pheromone_margin.',
			dots:'.$pheromone_dots_nav.',
			autoHeight: true,
			animateIn: "fadeIn",
			animateOut: "fadeOut",
			autoplayTimeout:'.$pheromone_time.',
			navText:[,],
			responsive: {
				0: {
					margin: '.$pheromone_items_m_0.',
					items: '.$pheromone_items_0.'
				},
				600: {
					margin: '.$pheromone_items_m_600.',
					items: '.$pheromone_items_600.'
				},
				800: {
					margin: '.$pheromone_items_m_800.',
					items: '.$pheromone_items_800.'
				},
				1200: {
					margin: '.$pheromone_items_m_1200.',
					items: '.$pheromone_items_1200.'
				},
				1400: {
					margin: '.$pheromone_items_m_1400.',
					items: '.$pheromone_items_1400.'
				}
			}
		});
		});
	</script>';

	return $output;
};

/*Custom Slider*/
vc_map( array(
    "name" => __("Custom Slider", 'wp-universal'),
    "base" => "pheromone_custom_slider",
	"category" => __('Pheromone','wp-universal'),
    "as_parent" => array('only' => 'vc_testimonial_item, vc_portfolio_item, vc_image_item'), // Use only|except attributes to limit child shortcodes (separate multiple values with comma)
    "content_element" => true,
    "show_settings_on_create" => true,
    "params" => array(
		array(
			"type" => "textfield",
			"param_name" => "pheromone_id",
			"group" => "General",
			"heading" => __("Slider ID", 'wp-universal'),
			"value" => 'example_id',
			"admin_label" => true,
			"description" => __( "Please set slider ID", 'wp-universal' )
		),
		array(
			'type' => 'dropdown',
			'heading' => "Autoplay",
			'param_name' => 'pheromone_autoplay',
			"group" => "General",
			'value' => array( "true", "false"),
			'std' => 'true',
			"admin_label" => true,
		),
		array(
			"type" => "textfield",
			"param_name" => "pheromone_time",
			"group" => "General",
			"heading" => __("Autoplay Timeout", 'wp-universal'),
			"value" => '5000',
			"admin_label" => true,
		),

		array(
			'type' => 'dropdown',
			'heading' => "Navigation Dots",
			'param_name' => 'pheromone_slider_dots_nav',
			"group" => "General",
			'value' => array( "Show", "Hide"),
			'std' => 'Show',
			"admin_label" => true,
		),

		array(
			"type" => "textfield",
			"param_name" => "pheromone_margin",
			"group" => "General",
			"heading" => __("Space Between Slide", 'wp-universal'),
			"description" => __( "only one number. Ex: 10.", 'wp-universal' ),
			"value" => '0',
		),
		array(
			"type" => "textfield",
			"param_name" => "css_class",
			"group" => "General",
			"heading" => __("Margin", 'wp-universal'),
			"value" => 'margin: 0px',
		),
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_1400",
			"heading" => __("Items per row for 1400px wide screen", 'wp-universal'),
			"value" => '1',
			"description" => __( "For big desktops", 'wp-universal' )
		),
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_m_1400",
			"heading" => __("Space between for items 1400px wide screen", 'wp-universal'),
			"value" => '0',
			"description" => __( "For big desktops", 'wp-universal' )
		),
		
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_1200",
			"heading" => __("Items per row for 1200px wide screen", 'wp-universal'),
			"value" => '1',
			"description" => __( "For standard desktops", 'wp-universal' )
		),
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_m_1200",
			"heading" => __("Space between for items 1200px wide screen", 'wp-universal'),
			"value" => '0',
			"description" => __( "For standard desktops", 'wp-universal' )
		),
		
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_800",
			"heading" => __("Items per row for 800px wide screen", 'wp-universal'),
			"value" => '1',
			"description" => __( "For landscape tablet view", 'wp-universal' )
		),
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_m_800",
			"heading" => __("Space between items for 800px wide screen", 'wp-universal'),
			"value" => '0',
			"description" => __( "For landscape tablet view", 'wp-universal' )
		),
		
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_600",
			"heading" => __("Items per row for 600px wide screen", 'wp-universal'),
			"value" => '1',
			"description" => __( "For portrait tablet view", 'wp-universal' )
		),
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_m_600",
			"heading" => __("Space between items for 600px wide screen", 'wp-universal'),
			"value" => '0',
			"description" => __( "For portrait tablet view", 'wp-universal' )
		),
		
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_0",
			"heading" => __("Items per row for mobile", 'wp-universal'),
			"value" => '1',
			"description" => __( "For mobile", 'wp-universal' )
		),
		array(
			"type" => "textfield",
			"group" => "Responsive",
			"param_name" => "pheromone_items_m_0",
			"heading" => __("Space between items for mobile", 'wp-universal'),
			"value" => '0',
			"description" => __( "For mobile", 'wp-universal' )
		),
		array(
			"type" => "checkbox",
			"heading" => __("Animate", 'wp-universal'),
			"param_name" => "wow",
			"value" => array("Yes" => true),
            "group" => __("Animate", 'wp-universal'),
		),
		array(
			"type" => "textfield",
			"heading" => __("Delay", 'wp-universal'),
			"param_name" => "wow_delay",
			"value" => '100',
			"description" => 'in s',
            "group" => __("Animate", 'wp-universal'),
    		"dependency" => array(
        		"element" => "wow",
        		"value" => "1"
    		),
		),
	    array(
	        'type' => 'dropdown',
	        'heading' => __( 'Animate', 'wp-universal' ),
	        'param_name' => 'wow_animate',
	        'value' => array(
	            __( 'fadeIn', 'wp-universal' ) => 'fadeIn',
	            __( 'slideInUp', 'wp-universal' ) => 'slideInUp',
	            __( 'zoomIn', 'wp-universal' ) => 'zoomIn',
	        ),
			'std' => 'fadeIn',
            "group" => __("Animate", 'wp-universal'),
    		"dependency" => array(
        		"element" => "wow",
        		"value" => "1"
    		),
	    ),
    ),
    "js_view" => 'VcColumnView',
) );






