<?php 
add_shortcode('pheromone_hero_image', 'pheromone_hero_image_f');
function pheromone_hero_image_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'type_cont' => 'image',
			'pheromone_size' => 'full',
			'pheromone_image' => null,
			'pheromone_color' => '#00bcd4',
			'pheromone_size_custom' => '500px',
			"css" => null
		), $atts)
	);

    $image = wp_get_attachment_image_src($pheromone_image, true);
    $image = $image[0];


	if($pheromone_size == 'full'){
		if($type_cont == 'image'){
			$output ='<div data-background="'. esc_url($image) .'" class="intro full">';
		} else {
			$output ='<div style="background-color:'.$pheromone_color.';" class="intro full solid-color">';
		};
	} else {
		if($type_cont == 'image'){
			$output ='<div data-background="'. esc_url($image) .'" class="intro" style="height:'.$pheromone_size_custom.' !important;">';
		} else {
			$output ='<div style="background-color:'.$pheromone_color.'; height:'.$pheromone_size_custom.' !important;" class="intro solid-color">';
		};
	};
		$output .='<div class="intro-body">';
		$output .='<div class="container">';
          $output .='<div class="row">';
            $output .='<div class="col-md-8 col-md-offset-2">';
            $output .=''.do_shortcode($content).'';
            $output .='</div>';
          $output .='</div>';
        $output .='</div>';
        $output .='</div>';
        $output .='</div>';



	$output .='<script>
jQuery.noConflict()(function($){
"use strict";

        var introHeader = $(".intro"),
            intro = $(".intro");

        buildModuleHeader(introHeader);

        $(window).resize(function() {
            var width = Math.max($(window).width(), window.innerWidth);
            buildModuleHeader(introHeader);
        });

        $(window).scroll(function() {
            effectsModuleHeader(introHeader, this);
        });

        intro.each(function(i) {
            if ($(this).attr("data-background")) {
                $(this).css("background-image", "url(" + $(this).attr("data-background") + ")");
            }
        });


        function buildModuleHeader(introHeader) {
        };
        function effectsModuleHeader(introHeader, scrollTopp) {
            if (introHeader.length > 0) {
                var homeSHeight = introHeader.height();
                var topScroll = $(document).scrollTop();
                if ((introHeader.hasClass("intro")) && ($(scrollTopp).scrollTop() <= homeSHeight)) {
                    introHeader.css("top", (topScroll * .4));
                }
                if (introHeader.hasClass("intro") && ($(scrollTopp).scrollTop() <= homeSHeight)) {
                    introHeader.css("opacity", (1 - topScroll/introHeader.height() * 1));
                }
            }
        };
});
	</script>';

	return $output;
};

vc_map( array(
	"name" => __("Hero Image", 'pheromone'),
	"base" => "pheromone_hero_image",
	"category" => __('Headers', 'pheromone'),
    "as_parent" => array('only' => 'vc_title_slider, vc_sub_title_slider, vc_mouse_slider, vc_image_slider, vc_rotate_title, vc_button_slider, vc_text_slider, vc_mailchimp_slider, vc_comingsoom_slider'),
    "content_element" => true,
    "show_settings_on_create" => true,
	"params" => array(
		array(
			"type" => "dropdown",
            "admin_label" => true,
			"heading" => __("Background type", 'pheromone'),
			"param_name" => "type_cont",
	        'value' => array(
	            __( 'Image', 'pheromone' ) => 'image',
	            __( 'Color', 'pheromone' ) => 'color',
	        ),
		),
	    array(
			"type" => "attach_image",
            "admin_label" => true,
    		"param_name" => "pheromone_image",
			"heading" => __("Image", 'pheromone'),
			"value" => '',
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "image"
    		),
	    ),	
		array(
			"type" => "colorpicker",
    		"param_name" => "pheromone_color",
			"heading" => __("Color", 'pheromone'),
            "value" => '#00bcd4', 
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "color"
    		),
		),

		array(
			"type" => "dropdown",
            "admin_label" => true,
			"heading" => __("Slider Height", 'pheromone'),
			"param_name" => "pheromone_size",
	        'value' => array(
	            __( 'FullScreen', 'pheromone' ) => 'full',
	            __( 'Fixed', 'pheromone' ) => 'fix',
	        ),
		),

        array(
            "type" => "textfield",
            "param_name" => "pheromone_size_custom",
            "value" => '500px', 
    		"dependency" => array(
        		"element" => "pheromone_size",
        		"value" => 'fix',
    		),
        ),
	),
    "js_view" => 'VcColumnView'
) );