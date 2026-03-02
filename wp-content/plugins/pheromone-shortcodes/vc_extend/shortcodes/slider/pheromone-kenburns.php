<?php
add_shortcode('pheromone_hero_kenburns', 'pheromone_hero_kenburns_f');
function pheromone_hero_kenburns_f($atts, $content = null)
{
    extract(shortcode_atts(
        array(
            'pheromone_image' => null,
            'pheromone_size' => 'full',
            'pheromone_transition_in' => 'swirlRight',
            'pheromone_transition_out' => 'swirlLeft',
            'pheromone_delay' => '7000',
            'pheromone_duration' => '2000',
            'pheromone_size_custom' => '500px',
            "css" => null
        ),
        $atts
    ));

    if (isset($pheromone_image)) {
        $pheromone_image = explode(',', $pheromone_image);
    } else {
        return
            '<div class="photo-none">' .
            '<p>' . __("You didn't select any image.", 'insomnia') . '</p>' .
            '</div>';
    }

    if ($pheromone_size == 'full') {
        $output = '<div class="intro full">';
    } else {
        $output = '<div class="intro" style="height:' . $pheromone_size_custom . ' !important;">';
    };
    $output .= '<div class="intro-body">';
    $output .= '' . do_shortcode($content) . '';
    $output .= '</div>';
    $output .= '</div>';
    $output .= '
    <script>
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

        $(function() {
            $("body").vegas({
                  delay: ' . esc_attr($pheromone_delay) . ',
                  timer: false,
                  transitionDuration: ' . esc_attr($pheromone_duration) . ',
                  slides: [';
    foreach ($pheromone_image as $attach_id) {
        $thumb = wp_get_attachment_image_src($attach_id, true);
        $thumb = $thumb[0];
        $output .= '{src: "' . esc_url($thumb) . '"},';
    }

    $output .= '],
                  transition: [ "' . esc_attr($pheromone_transition_in) . '", "' . esc_attr($pheromone_transition_out) . '" ],
                  animation: [ "kenburns" ]
              });   });
        });
    </script>';
    return $output;
};


vc_map(array(
    "name" => __("Hero KenBurns", 'pheromone'),
    "base" => "pheromone_hero_kenburns",
    "category" => __('Headers', 'pheromone'),
    "as_parent" => array('only' => 'vc_title_slider, vc_sub_title_slider, vc_mouse_slider, vc_image_slider, vc_rotate_title, vc_button_slider, vc_text_slider, vc_mailchimp_slider, vc_comingsoom_slider'),
    "content_element" => true,
    "show_settings_on_create" => true,
    "params" => array(
        array(
            "type" => "dropdown",
            "admin_label" => true,
            "heading" => __("Image Height", 'pheromone'),
            "param_name" => "pheromone_size",
            'value' => array(
                __('FullScreen', 'pheromone') => 'full',
                __('Fixed', 'pheromone') => 'fix',
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
        array(
            "type" => "attach_images",
            "param_name" => "pheromone_image",
            "heading" => __("Images", 'pheromone'),
        ),
        array(
            "type" => "textfield",
            "admin_label" => true,
            "heading" => __("Image Delay", 'pheromone'),
            "param_name" => "pheromone_delay",
            "value" => '7000',
        ),
        array(
            "type" => "textfield",
            "admin_label" => true,
            "heading" => __("Transition Duration", 'pheromone'),
            "param_name" => "pheromone_duration",
            "value" => '2000',
        ),
        array(
            "type" => "dropdown",
            "admin_label" => true,
            "heading" => __("Transition In", 'pheromone'),
            "param_name" => "pheromone_transition_in",
            'value' => array(
                'fade' => 'fade',
                'blur' => 'blur',
                'burn' => 'burn',
                'flash' => 'flash',
                'negative' => 'negative',
                'slideDown' => 'slideDown',
                'slideLeft' => 'slideLeft',
                'slideRight' => 'slideRight',
                'slideUp' => 'slideUp',
                'swirlLeft' => 'swirlLeft',
                'swirlRight' => 'swirlRight',
                'zoomIn' => 'zoomIn',
                'zoomOut' => 'zoomOut',
            ),
            'std' => 'swirlRight',
        ),
        array(
            "type" => "dropdown",
            "admin_label" => true,
            "heading" => __("Transition Out", 'pheromone'),
            "param_name" => "pheromone_transition_out",
            'value' => array(
                'fade' => 'fade',
                'blur' => 'blur',
                'burn' => 'burn',
                'flash' => 'flash',
                'negative' => 'negative',
                'slideDown' => 'slideDown',
                'slideLeft' => 'slideLeft',
                'slideRight' => 'slideRight',
                'slideUp' => 'slideUp',
                'swirlLeft' => 'swirlLeft',
                'swirlRight' => 'swirlRight',
                'zoomIn' => 'zoomIn',
                'zoomOut' => 'zoomOut',
            ),
            'std' => 'swirlLeft',
        ),
    ),
    "js_view" => 'VcColumnView'
));
