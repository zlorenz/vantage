<?php 
/*Quote*/
add_shortcode('pheromone_quote', 'pheromone_quote_f');
function pheromone_quote_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_quote_text' => 'A business has to be involving, it has to be fun, and it has to exercise your creative instincts. Start where you are. Use what you have. Do what you can.',
			'pheromone_quote_author' => 'James Daniels',
			'center' => null,
			'white' => null,
			"css" => null
		), $atts)
	);
	
	if ($center) $center = 'center';
	if ($white) $white = 'white';

	$output ='<div class="quote-block '. esc_attr($center) .' '. esc_attr($white) .'">
	            <p><i class="icon fa fa-quote-left fa-lg"></i></p>
            	<h4>'. esc_attr($pheromone_quote_text) .'</h4>
            	<h2 class="no-pad classic">'. esc_attr($pheromone_quote_author) .'</h2>
              </div>';
	return $output;


};


/*Quote*/
vc_map( array(
	"name" => __("Quote",'pheromone'),
	"base" => "pheromone_quote",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_quote_text",
			"heading" => __("Quote", 'pheromone'),
			"value" => 'A business has to be involving, it has to be fun, and it has to exercise your creative instincts. Start where you are. Use what you have. Do what you can.',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_quote_author",
			"heading" => __("Author", 'pheromone'),
			"value" => 'James Daniels',
		),
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("White fonts", 'pheromone'),
			"param_name" => "white",
			"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
		),	
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("Text Center", 'pheromone'),
			"param_name" => "center",
			"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
		),	
	)
) );