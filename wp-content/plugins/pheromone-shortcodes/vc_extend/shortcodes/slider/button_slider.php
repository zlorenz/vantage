<?php
add_shortcode('vc_button_slider', 'vc_button_slider_f');
function vc_button_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'text' => 'Who We Are',
			'href' => '#about',
			'margin' => '25px',
			'white' => null,
		), $atts)
	);

	if ($white) $white = 'btn-white';

    $output ='<a href="'.$href.'" style="margin-top: '.$margin.';margin-left: 10px;margin-right:10px;" class="btn '. esc_attr($white) .' btn-border btn-lg page-scroll">'.$text.'</a>';

	return $output;
};


vc_map( array(
	"name" => __("Button Item",'pheromone'),
	"base" => "vc_button_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), 
	"category" => __('Headers','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "text",
			"heading" => __("Button Name", 'pheromone'),
			"value" => 'Who We Are',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "href",
			"heading" => __("Button Href", 'pheromone'),
			"description" => __("You need to add the same value in first block in VC)", 'pheromone'),
			"value" => '#about',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "margin",
			"heading" => __("Margin Top", 'pheromone'),
			"value" => '25px',
		),	
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("White background", 'pheromone'),
			"param_name" => "white",
			"value" => array("Yes" => true),
		),	
	)
) );



