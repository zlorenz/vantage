<?php
/*Custom Slider*/
add_shortcode('pheromone_hero_slider', 'pheromone_hero_slider_f');
function pheromone_hero_slider_f( $atts, $content = null)
{


    $output ='<div id="carousel-intro" data-ride="carousel" class="intro full carousel carousel-big slide carousel-fade">';
      $output .='<ol class="carousel-indicators">';
      $output .='</ol>';
      $output .='<div class="carousel-inner">';
			$output .=''.do_shortcode($content).'';
      $output .='</div>';
      $output .='<a href="#carousel-intro" data-slide="prev" class="left carousel-control"><span class="icon-prev"></span></a><a href="#carousel-intro" data-slide="next" class="right carousel-control"><span class="icon-next"></span></a>';
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

/*Custom Slider*/
vc_map( array(
	"name" => __("Hero Slider", 'pheromone'),
	"base" => "pheromone_hero_slider",
	"category" => __('Headers', 'pheromone'),
    "as_parent" => array('only' => 'vc_slide_slider'),
    "content_element" => true,
    "show_settings_on_create" => false,
    "js_view" => 'VcColumnView'
) );


