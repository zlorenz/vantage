<?php 
/*Video Button*/
add_shortcode('pheromone_video', 'pheromone_video_f');
function pheromone_video_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_video_text' => 'Watch Video',
			'pheromone_video_sub_text' => 'A business has to be involving, it has to be fun, and it has to exercise your creative instincts. Start where you are. Use what you have. Do what you can.',
			'pheromone_video_link' => 'https://vimeo.com/155463374',
			"white" => null,
			"css" => null
		), $atts)
	);
	
	if ($white) $white = 'white';

	$output ='<div class="video-block '. esc_attr($white) .'">
				<a href="'. esc_url($pheromone_video_link) .'" class="swipebox-video"><span><i class="icon icon-big ion-ios-play-outline"></i></span></a>
            	<h2>'.$pheromone_video_text.'</h2>
            	<p>'. esc_attr($pheromone_video_sub_text) .'</p>
            </div>';
	return $output;
};


/*Video Button*/
vc_map( array(
	"name" => __("Video Button",'pheromone'),
	"base" => "pheromone_video",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textarea_html",
			"admin_label" => true,
			"param_name" => "pheromone_video_text",
			"heading" => __("Title", 'pheromone'),
			"value" => 'Watch Video',
		),
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_video_sub_text",
			"heading" => __("Sub Text", 'pheromone'),
			"value" => 'A business has to be involving, it has to be fun, and it has to exercise your creative instincts. Start where you are. Use what you have. Do what you can.',
		),
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_video_link",
			"heading" => __("Link to video", 'pheromone'),
			"value" => 'https://vimeo.com/155463374',
		),
		array(
    		"type" => "checkbox",
    		"admin_label" => true,
    		"heading" => __("White fonts", 'pheromone'),
    		"param_name" => "white",
			"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
 		),

	)
) );