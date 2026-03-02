<?php
add_shortcode('vc_title_slider', 'vc_title_slider_f');
function vc_title_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'title' => 'Ethan Pheromone',
			'font' => 'h1',
			'title_size' => '60px',
			'title_line_height' => '80px',
			'title_font_family' => 'Kanit',
			'title_font_weight' => '100',
			'classic' => null,
		), $atts)
	);

	if ($classic) $classic = 'classic';

	if($font =="h1"){
			$output ='<h1 style="font-size: '. esc_attr($title_size) .'; font-family: '. esc_attr($title_font_family) .', sans-serif; line-height: '. esc_attr($title_line_height) .'; font-weight: '. esc_attr($title_font_weight) .';" class="'. esc_attr($classic) .'">'.esc_attr($title).'</h1>';
		} elseif ($font =="h2") {
			$output ='<h2 style="font-size: '. esc_attr($title_size) .'; font-family: '. esc_attr($title_font_family) .', sans-serif; line-height: '. esc_attr($title_line_height) .'; font-weight: '. esc_attr($title_font_weight) .';" class="'. esc_attr($classic) .'">'.esc_attr($title).'</h2>';
		} elseif ($font =="h3") {
			$output ='<h3 style="font-size: '. esc_attr($title_size) .'; font-family: '. esc_attr($title_font_family) .', sans-serif; line-height: '. esc_attr($title_line_height) .'; font-weight: '. esc_attr($title_font_weight) .';" class="'. esc_attr($classic) .'">'.esc_attr($title).'</h3>';
		} elseif ($font =="h4") {
			$output ='<h4 style="font-size: '. esc_attr($title_size) .'; font-family: '. esc_attr($title_font_family) .', sans-serif; line-height: '. esc_attr($title_line_height) .'; font-weight: '. esc_attr($title_font_weight) .';" class="'. esc_attr($classic) .'">'.esc_attr($title).'</h4>';
		} elseif ($font =="h5") {
			$output ='<h5 style="font-size: '. esc_attr($title_size) .'; font-family: '. esc_attr($title_font_family) .', sans-serif; line-height: '. esc_attr($title_line_height) .'; font-weight: '. esc_attr($title_font_weight) .';" class="'. esc_attr($classic) .'">'.esc_attr($title).'</h5>';
		} elseif ($font =="h6") {
			$output ='<h6 style="font-size: '. esc_attr($title_size) .'; font-family: '. esc_attr($title_font_family) .', sans-serif; line-height: '. esc_attr($title_line_height) .'; font-weight: '. esc_attr($title_font_weight) .';" class="'. esc_attr($classic) .'">'.esc_attr($title).'</h6>';
		};

	return $output;
};

vc_map( array(
	"name" => __("Title Item",'pheromone'),
	"base" => "vc_title_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), // Use only|except attributes to limit parent (separate multiple values with comma)
	"category" => __('Headers','pheromone'),
	"params" => array(
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "title",
			"heading" => __("Title", 'pheromone'),
			"value" => 'Ethan Pheromone',
		),	
	    array(
	        'type' => 'dropdown',
	        'heading' => __( 'Heading', 'pheromone' ),
	        'param_name' => 'font',
	        'value' => array(
	            __( 'H1', 'pheromone' ) => 'h1',
	            __( 'H2', 'pheromone' ) => 'h2',
	            __( 'H3', 'pheromone' ) => 'h3',
	            __( 'H4', 'pheromone' ) => 'h4',
	            __( 'H5', 'pheromone' ) => 'h5',
	            __( 'H6', 'pheromone' ) => 'h6',
	        ),
			'std' => 'h1',
			"admin_label" => true,
	    ),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "title_size",
			"heading" => __("Font Size", 'pheromone'),
			"value" => '60px',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "title_line_height",
			"heading" => __("Line Height", 'pheromone'),
			"value" => '80px',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "title_font_weight",
			"heading" => __("Font Weight", 'pheromone'),
			"value" => '100',
		),	
		array(
			"type" => "dropdown",
			"admin_label" => true,
			"param_name" => "title_font_family",
			"heading" => __("Font Family", 'pheromone'),
	        'value' => array(
	            __( 'Great Vibes', 'pheromone' ) => '\'Great Vibes\'',
	            __( 'Kanit', 'pheromone' ) => 'Kanit',
	        ),
			'std' => 'Kanit',
		),
		array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("Rotate Font", 'pheromone'),
			"param_name" => "classic",
			"value" => array("Yes" => true),
		),		
	)
) );