<?php 
/*Fun Facts*/
add_shortcode('pheromone_fun', 'pheromone_fun_f');
function pheromone_fun_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_fun_text' => 'Themes Released',
			'pheromone_fun_count' => '29',
			'pheromone_fun_count_delay' => '5',
			'pheromone_fun_count_increment' => '1',
			'white' => null,
			"css" => null
		), $atts)
	);

	if ($white) $white = 'white';

	$output ='<div class="stats-universal">
                  <div class="stats-block stats-top">
                    <div class="stats-desc '. esc_attr($white) .'">
                      <div class="stats-number number-counter"><span data-min="0" data-max="'. esc_attr($pheromone_fun_count) .'" data-delay="'. esc_attr($pheromone_fun_count_delay) .'" data-increment="'. esc_attr($pheromone_fun_count_increment) .'" class="numscroller">0</span></div>
                      <h5 class="no-pad">'. esc_attr($pheromone_fun_text) .'</h5>
                    </div>
                  </div>
                </div>';
	return $output;


};

/*Fun Facts*/
vc_map( array(
	"name" => __("Fun Facts (Countdown)",'pheromone'),
	"base" => "pheromone_fun",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"param_name" => "pheromone_fun_text",
			"heading" => __("Text", 'pheromone'),
			"value" => 'Themes Released',
			"admin_label" => true,
		),
		array(
			"type" => "textfield",
			"param_name" => "pheromone_fun_count",
			"heading" => __("Count", 'pheromone'),
			"value" => '29',
			"admin_label" => true,
		),	
		array(
			"type" => "textfield",
			"param_name" => "pheromone_fun_count_delay",
			"heading" => __("Delay (speed)", 'pheromone'),
			"group" => __("Settings", 'pheromone'),
			"value" => '5',
			"admin_label" => true,
		),
		array(
			"type" => "textfield",
			"param_name" => "pheromone_fun_count_increment",
			"heading" => __("Increment", 'pheromone'),
			"group" => __("Settings", 'pheromone'),
			"value" => '1',
			"admin_label" => true,
		),
		array(
    		"type" => "checkbox",
    		"heading" => __("White fonts", 'pheromone'),
    		"param_name" => "white",
			"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
			"admin_label" => true,
 		),	
	)
) );


