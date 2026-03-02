<?php

add_shortcode('vc_cooming_soon_two', 'vc_cooming_soon_two_f');
function vc_cooming_soon_two_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'pheromone_image' => null,
			'title' => 'pheromone, coming soon, really soon, stay tuned',
			'time' => '2018/01/21 11:00:00',
		), $atts)
	);


    $image = wp_get_attachment_image_src($pheromone_image, true);
    $image = $image[0];


		$output ='
		<div style="background: url('. esc_url($image) .'); background-position: 50% 50%;" class="intro full-coming">
		      <div class="intro-body">
		        <div class="container">
		          <div class="row">
            		<div class="col-sm-8 col-sm-offset-2">
		              <h1 class="no-pad"><span class="rotate">'.$title.'</span></h1>
              		<div id="clock" class="no-pad-top"></div>
		              <ul class="list-inline">';
		                  	if(get_theme_mod('pheromone_fot_soc_twitter','enable') == true) {
		                  		$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_twitter","https://twitter.com"))) .'"><i class="fa fa-twitter fa-fw fa-2x"></i></a></li>';
		                  	};
		                  	if(get_theme_mod('pheromone_fot_soc_facebook','enable') == true) {
		                  	 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_facebook","https://facebook.com"))) .'"><i class="fa fa-facebook fa-fw fa-2x"></i></a></li>';
		                  	}; 
		                  	if(get_theme_mod('pheromone_fot_soc_googleplus','enable') == true) {
		                  	 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_googleplus","https://plus.google.com"))) .'"><i class="fa fa-google-plus fa-fw fa-2x"></i></a></li>';
		                  	}; 
		                  	if(get_theme_mod('pheromone_fot_soc_linkedin') == true) {
		                  	 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_linkedin"))) .'"><i class="fa fa-linkedin fa-fw fa-2x"></i></a></li>';
		                  	}; 
		                  	if(get_theme_mod('pheromone_fot_soc_dribbble') == true) {
		                  	 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_dribbble"))) .'"><i class="fa fa-dribbble fa-fw fa-2x"></i></a></li>';
		                  	}; 		                  	
		                  	if(get_theme_mod('pheromone_fot_soc_instagram') == true) {
		                  	 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_instagram"))) .'"><i class="fa fa-instagram fa-fw fa-2x"></i></a></li>';
		                  	}; 
							if(get_theme_mod('pheromone_fot_soc_youtube') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_youtube"))) .'"><i class="fa fa-youtube-play fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_flickr') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_flickr"))) .'"><i class="fa fa-flickr fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_tumblr') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_tumblr"))) .'"><i class="fa fa-tumblr fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_foursquare') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_foursquare"))) .'"><i class="fa fa-foursquare fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_vk') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_vk"))) .'"><i class="fa fa-vk fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_behance') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_behance"))) .'"><i class="fa fa-behance fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_pinterest') == true) {
							 $output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_pinterest"))) .'"><i class="fa fa-pinterest fa-fw fa-2x"></i></a></li>';
							};
							if(get_theme_mod('pheromone_fot_soc_github') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_github"))) .'"><i class="fa fa-github fa-fw fa-2x"></i></a></li>';
							};   
							if(get_theme_mod('pheromone_fot_soc_rss') == true) {
							 	$output .='<li><a href="'.esc_url(stripslashes(get_theme_mod("pheromone_fot_soc_rss"))) .'"><i class="fa fa-rss fa-fw fa-2x"></i></a></li>';
							};
		              $output .='</ul>
		              <p class="footer-copy-text small">'. get_theme_mod( "pheromone_footer_love", "We <i class='fa fa-heart fa-fw'></i> creative people" ) .'</p>
		            </div>
		          </div>
		        </div>
		      </div>
		    </div>';
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

vc_map( array(
	"name" => __("Cooming Soon #2",'pheromone'),
	"base" => "vc_cooming_soon_two",
    "content_element" => true,
	"category" => __('Pheromone','pheromone'),
	"params" => array(
	    array(
			"type" => "attach_image",
			"param_name" => "pheromone_image",
			"heading" => __("Image", 'pheromone'),
			"admin_label" => true,
	    ),	
		array(
			"type" => "textfield",
			"param_name" => "title",
			"heading" => __("Title", 'pheromone'),
			"value" => 'pheromone, coming soon, really soon, stay tuned',
			"admin_label" => true,
		),	
		array(
			"type" => "textfield",
			"param_name" => "time",
			"heading" => __("End Time", 'pheromone'),
			"value" => '2018/01/21 11:00:00',
			"admin_label" => true,
		),
	)
) );