<?php

add_shortcode('vc_sub_title_slider', 'vc_sub_title_slider_f');
function vc_sub_title_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'font' => 'h4',
			'sub_title' => 'Responsive Multi-Concept Theme',
			'title_font_family' => 'Kanit',
			'classic' => null,
		), $atts)
	);

	if ($classic) $classic = 'classic';

	if($font =="h2"){
			$output ='<h2 style="font-family: '. esc_attr($title_font_family) .', sans-serif;" class="'. esc_attr($classic) .'">'. $sub_title .'</h2>';
		} elseif ($font =="h3") {
			$output ='<h3 style="font-family: '. esc_attr($title_font_family) .', sans-serif;" class="'. esc_attr($classic) .'">'. $sub_title .'</h3>';
		} elseif ($font =="h4") {
			$output ='<h4 style="font-family: '. esc_attr($title_font_family) .', sans-serif;" class="'. esc_attr($classic) .'">'. $sub_title .'</h4>';
	};
	
	return $output;
};

vc_map( array(
	"name" => __("Sub Title Item",'pheromone'),
	"base" => "vc_sub_title_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'),
	"category" => __('Headers','pheromone'),
	"params" => array(
	    array(
	        'type' => 'dropdown',
	        'heading' => __( 'Heading', 'pheromone' ),
	        'param_name' => 'font',
	        'value' => array(
	            __( 'H2', 'pheromone' ) => 'h2',
	            __( 'H3', 'pheromone' ) => 'h3',
	            __( 'H4', 'pheromone' ) => 'h4',
	        ),
			'std' => 'h4',
			"admin_label" => true,
	    ),
		array(
			"type" => "textfield",
			"param_name" => "sub_title",
			"heading" => __("Sub Title", 'pheromone'),
			"value" => 'Responsive Multi-Concept Theme',
			"admin_label" => true,
		),	
		array(
			"type" => "dropdown",
			"param_name" => "title_font_family",
			"heading" => __("Font Family", 'pheromone'),
	        'value' => array(
	            __( 'Great Vibes', 'pheromone' ) => 'Great Vibes',
	            __( 'Kanit', 'pheromone' ) => 'Kanit',
	        ),
			'std' => 'Kanit',
			"admin_label" => true,
		),
		array(
			"type" => "checkbox",
			"heading" => __("Rotate Font", 'pheromone'),
			"param_name" => "classic",
			"value" => array("Yes" => true),
			"admin_label" => true,
		),
	)
) );