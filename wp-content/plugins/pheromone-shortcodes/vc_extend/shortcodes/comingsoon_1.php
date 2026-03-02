<?php

add_shortcode('vc_cooming_soon_one', 'vc_cooming_soon_one_f');
function vc_cooming_soon_one_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'pheromone_image' => null,
			'title' => 'We Are Coming, Really Soon, Stay Tuned',
			'placeholder' => 'E-mail address...',
			'button_title' => 'GET NOTIFIED!',
			'mailchimp' => 'https://forbetterweb.us11.list-manage.com/subscribe/post?u=4f751a6c58b225179404715f0&amp;id=18fc72763a',
			'time' => '2018/01/21 11:00:00',
		), $atts)
	);

    $image = wp_get_attachment_image_src($pheromone_image, true);
    $image = $image[0];

		$output ='
		    	<div style="background: url('. esc_url($image) .'); background-position: 50% 50%;" class="intro full-coming">
      <div class="intro-body">
        <div class="magic" id="magic">
          <canvas id="magic-canvas"></canvas>
        </div>
        <!-- countdown-->
                <h1><span class="rotate">'.$title.'</span></h1>

        <div id="clock"></div>
        <form class="small-form subscribe-form" id="mc-embedded-subscribe-form2" action="'. esc_url($mailchimp) .'" method="post" name="mc-embedded-subscribe-form" target="_blank" novalidate="">
          <div class="input-group input-group-lg">
              <input id="mce-EMAIL2" type="email" name="EMAIL" placeholder="'.$placeholder.'" class="form-control"><span class="input-group-btn">
                <button id="mc-embedded-subscribe2" type="submit" name="subscribe" class="btn btn-dark">'.$button_title.'</button></span>
          </div>
          <div id="mce-responses2">
            <div class="response" id="mce-error-response2" style="display:none;"></div>
            <div class="response" id="mce-success-response2" style="display:none;"></div>
          </div>
        </form>
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
		              <p class="footer-copy-text small">'. get_theme_mod( "pheromone_footer_love", "We <i class='fa fa-heart fa-fw'></i> Creative People" ) .'</p>
		            </div>
		    	</div>';
		    $output .='<script>
				jQuery.noConflict()(function($){
				"use strict";

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel // MIT license
!function(){"use strict";for(var n=0,i=["ms","moz","webkit","o"],e=0;e<i.length&&!window.requestAnimationFrame;++e)window.requestAnimationFrame=window[i[e]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[i[e]+"CancelAnimationFrame"]||window[i[e]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(i,e){var t=(new Date).getTime(),o=Math.max(0,16-(t-n)),a=window.setTimeout(function(){i(t+o)},o);return n=t+o,a}),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(n){clearTimeout(n)})}(),function(){"use strict";function n(){r=window.innerWidth,c=window.innerHeight,l={x:0,y:c},w=document.getElementById("magic"),w.style.height=c+"px",m=document.getElementById("magic-canvas"),m.width=r,m.height=c,d=m.getContext("2d"),s=[];for(var n=0;.5*r>n;n++){var i=new a;s.push(i)}o()}function i(){window.addEventListener("scroll",e),window.addEventListener("resize",t)}function e(){h=document.body.scrollTop>c?!1:!0}function t(){r=window.innerWidth,c=window.innerHeight,w.style.height=c+"px",m.width=r,m.height=c}function o(){if(h){d.clearRect(0,0,r,c);for(var n in s)s[n].draw()}requestAnimationFrame(o)}function a(){function n(){i.pos.x=Math.random()*r,i.pos.y=c+100*Math.random(),i.alpha=.1+.4*Math.random(),i.scale=.1+.4*Math.random(),i.velocity=Math.random()}var i=this;!function(){i.pos={},n(),console.log(i)}(),this.draw=function(){i.alpha<=0&&n(),i.pos.y-=i.velocity,i.alpha-=5e-4,d.beginPath(),d.arc(i.pos.x,i.pos.y,10*i.scale,0,2*Math.PI,!1),d.fillStyle="rgba(255,255,255,"+i.alpha+")",d.fill()}}var r,c,w,m,d,s,l,h=!0;n(),i()}();

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
	"name" => __("Cooming Soon #1",'pheromone'),
	"base" => "vc_cooming_soon_one",
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
			"admin_label" => true,
			"param_name" => "title",
			"heading" => __("Title", 'pheromone'),
			"value" => 'We Are Coming, Really Soon, Stay Tuned',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "button_title",
			"heading" => __("Button Text", 'universal-wp'),
			"value" => 'GET NOTIFIED!',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "placeholder",
			"heading" => __("Placeholder", 'universal-wp'),
			"value" => 'E-mail address...',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "mailchimp",
			"heading" => __("MailChimp", 'pheromone'),
			"value" => 'https://forbetterweb.us11.list-manage.com/subscribe/post?u=4f751a6c58b225179404715f0&amp;id=18fc72763a',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "time",
			"heading" => __("End Time", 'pheromone'),
			"value" => '2018/01/21 11:00:00',
		),	
	)
) );