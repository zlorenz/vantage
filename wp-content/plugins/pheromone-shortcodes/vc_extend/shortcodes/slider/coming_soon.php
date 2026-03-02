<?php 
/*MailChimp*/
add_shortcode('vc_comingsoom_slider', 'vc_comingsoom_slider_f');
function vc_comingsoom_slider_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'time' => '2018/01/21 11:00:00',
			"css" => null
		), $atts)
	);
	
	$output ='<div id="clock" class="no-pad-top"></div>';
	$output .='<script>
			jQuery.noConflict()(function($){
				"use strict";
			        $("#clock").countdown("'.$time.'").on("update.countdown", function (event) {
			            var $this = $(this).html(event.strftime(""
			                + "<div><span>%-w</span>week%!w</div>"
			                + "<div><span>%-d</span>day%!d</div>"
			                + "<div><span>%H</span>hr</div>"
			                + "<div><span>%M</span>min</div>"
			                + "<div><span>%S</span>sec</div>"));
			        });
				});
				</script>';
	
	return $output;


};

/*MailChimp*/
vc_map( array(
	"name" => __("Timer",'pheromone'),
	"base" => "vc_comingsoom_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), // Use only|except attributes to limit parent (separate multiple values with comma)
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "time",
			"heading" => __("End Time", 'pheromone'),
			"value" => '2018/01/21 11:00:00',
		),	
	)
) );