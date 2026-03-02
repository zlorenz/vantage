<?php
/*TESTIMONIAL  ITEM*/
add_shortcode('vc_rotate_title', 'vc_rotate_title_f');
function vc_rotate_title_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'title' => 'Smart, Minimal, Easy to use, Fast loading, Lightweight, Multipurpose',
			'pheromone_title_classic' => null,
		), $atts)
	);

    if ($pheromone_title_classic) $pheromone_title_classic = 'classic';

    $output ='<h1 class="'. esc_attr($pheromone_title_classic) .'"><span class="rotate">'.$title.'</span></h1>';

	return $output;
};


vc_map( array(
	"name" => __("Rotate Text Item",'pheromone'),
	"base" => "vc_rotate_title",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), // Use only|except attributes to limit parent (separate multiple values with comma)
	"category" => __('Headers','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "title",
			"heading" => __("Title", 'pheromone'),
			"value" => 'Smart, Minimal, Easy to use, Fast loading, Lightweight, Multipurpose',
		),	
        array(
            "type" => "checkbox",
            "admin_label" => true,
            "heading" => __("Modern Font?", 'pheromone'),
            "param_name" => "pheromone_title_classic",
            "value" => array("Yes" => true),
        ),	
	)
) );
