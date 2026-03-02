<?php
add_shortcode('vc_mouse_slider', 'vc_mouse_slider_f');
function vc_mouse_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'href_mouse' => '#about',
		), $atts)
	);

    $output ='<div data-wow-delay="1s" class="scroll-btn wow fadeInDown animated" style="visibility: visible; animation-delay: 1s; animation-name: fadeInDown;"><a href="'.$href_mouse.'" class="page-scroll"><span class="mouse"><span class="weel"><span></span></span></span></a></div>';

	return $output;
};

vc_map( array(
	"name" => __("Animate Mouse",'pheromone'),
	"base" => "vc_mouse_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), // Use only|except attributes to limit parent (separate multiple values with comma)
	"category" => __('Headers','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "href_mouse",
			"heading" => __("Href value", 'pheromone'),
			"description" => __("You need to add the same value in first block in VC", 'pheromone'),
			"value" => '#about',
		),		
	)
) );