<?php 
add_shortcode('pheromone_hero_video', 'pheromone_hero_video_f');
function pheromone_hero_video_f( $atts, $content = null)
{
    extract(shortcode_atts(
        array(
            'video_source' => 'YouTube',
            'pheromone_image' => null,
            'pheromone_video' => "https://www.youtube.com/watch?v=IbWOQWw1wkM",
            'pheromone_video_vimeo' => "https://vimeo.com/199167955",
            'pheromone_video_start' => "45",
            'pheromone_video_end' => "100",
            'pheromone_video_quality' => "default",
            'pheromone_video_ratio' => "auto",
            "css" => null
        ), $atts)
    );

    $image = wp_get_attachment_image_src($pheromone_image, true);
    $image = $image[0];

    $output ='<div data-background="'. esc_url($image) .'" class="intro full">';
        $output .='<div class="intro-body">';
            $output .=''.do_shortcode($content).'';
        $output .='</div>';
    $output .='</div>';

    if($video_source =="YouTube"){
        $output .='<a id="bgndVideo" data-property="{videoURL:\''. esc_url($pheromone_video) .'\', containment:\'.intro\', autoPlay:true, loop:true, mute:true, useOnMobile:true, startAt:'. esc_attr($pheromone_video_start) .', stopAt: '. esc_attr($pheromone_video_end) .', ratio:\''. esc_attr($pheromone_video_ratio) .'\', optimizeDisplay:true, quality:\''. esc_attr($pheromone_video_quality) .'\', opacity:1, showControls: false, showYTLogo:false}" class="player"></a>';
    } else {
         $output .='<a id="bgndVideo_vimeo" data-property="{videoURL:\''. esc_url($pheromone_video_vimeo) .'\', containment:\'.intro\', autoPlay:true, loop:true, mute:true, startAt:'. esc_attr($pheromone_video_start) .', stopAt: '. esc_attr($pheromone_video_end) .', ratio:\''. esc_attr($pheromone_video_ratio) .'\', optimizeDisplay:true, quality:\''. esc_attr($pheromone_video_quality) .'\', opacity:1, showControls: false, showYTLogo:false}" class="player"></a>';
    };


    $output .='<script>
jQuery.noConflict()(function($){
"use strict";';

    if($video_source =="YouTube"){
        $output .='$("#bgndVideo").YTPlayer();';
    } else {
         $output .='$("#bgndVideo_vimeo").vimeo_player();';
    };

    $output .=' var introHeader = $(".intro"),
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
    "name" => __("Hero Video", 'pheromone'),
    "base" => "pheromone_hero_video",
    "category" => __('Headers', 'pheromone'),
    "as_parent" => array('only' => 'vc_title_slider, vc_sub_title_slider, vc_mouse_slider, vc_image_slider, vc_rotate_title, vc_button_slider, vc_text_slider, vc_mailchimp_slider, vc_comingsoom_slider'),
    "content_element" => true,
    "show_settings_on_create" => true,
    "params" => array(
        array(
            "type" => "attach_image",
            "param_name" => "pheromone_image",
            "heading" => __("Cover", 'pheromone'),
            "admin_label" => true,
        ),  
        array(
            "type" => "dropdown",
            "admin_label" => true,
            "heading" => __("Video Source", 'pheromone'),
            "param_name" => "video_source",
            'value' => array(
                __( 'YouTube', 'pheromone' ) => 'youtube',
                __( 'Vimeo', 'pheromone' ) => 'vimeo',
            ),
        ),
        array(
            "type" => "textfield",
            "param_name" => "pheromone_video",
            "heading" => __("Video Link", 'pheromone'),
            "value" => "https://www.youtube.com/watch?v=IbWOQWw1wkM", 
            "admin_label" => true,
            "dependency" => array(
                "element" => "video_source",
                "value" => "youtube"
            ),
        ),
        array(
            "type" => "textfield",
            "param_name" => "pheromone_video_vimeo",
            "heading" => __("Video Link", 'pheromone'),
            "value" => "https://vimeo.com/199167955", 
            "admin_label" => true,
            "dependency" => array(
                "element" => "video_source",
                "value" => "vimeo"
            ),
        ),
        array(
            "type" => "textfield",
            "param_name" => "pheromone_video_start",
            "heading" => __("Video Start From", 'pheromone'),
            "descriptions" => __("in sec", 'pheromone'),
            "value" => "45", 
            "admin_label" => true,
        ),
        array(
            "type" => "textfield",
            "param_name" => "pheromone_video_end",
            "heading" => __("Video End From", 'pheromone'),
            "descriptions" => __("in sec", 'pheromone'),
            "value" => "100", 
            "admin_label" => true,
        ),
        array(
            "type" => "textfield",
            "param_name" => "pheromone_video_quality",
            "heading" => __("Quality", 'pheromone'),
            "description" => __("default or small, medium, large, hd720, hd1080, highres", 'pheromone'),
            "value" => "default", 
            "admin_label" => true,
        ),
        array(
            "type" => "textfield",
            "param_name" => "pheromone_video_ratio",
            "heading" => __("Ratio", 'pheromone'),
            "description" => __("4/3, 16/9 or auto", 'pheromone'),
            "value" => "auto", 
            "admin_label" => true,
        ),
    ),
    "js_view" => 'VcColumnView',
) );