<?php

/**
 * Plugin Name: Pheromone Shortcodes
 * Plugin URI: https://themeforest.net/user/DankovThemes
 * Description: Visual Composer Extantion.
 * Version: 1.1.2
 * Author: DankovThemes
 * Author URI: https://themeforest.net/user/DankovThemes
 * License: 
 * Text Domain: pheromone
 */
/* ------------------------------------------------------------------------ */
/* Plugin Scripts */
/* ------------------------------------------------------------------------ */

add_action('init', 'pheromone_load_textdomain_shortcodes');

function pheromone_load_textdomain_shortcodes()
{
	load_plugin_textdomain('pheromone', false, basename(dirname(__FILE__)) . '/languages');
}

add_action('wp_enqueue_scripts', 'pheromone_shortcodes_scripts');

if (!function_exists('pheromone_shortcodes_scripts')) {
	function pheromone_shortcodes_scripts()
	{
		wp_enqueue_script('pheromone_vc_custom', plugin_dir_url(__FILE__) . 'vc_extend/vc_custom.js', false, null, true);
		wp_enqueue_script('pheromone_classie', plugin_dir_url(__FILE__) . 'vc_extend/classie.js', false, null, true);
		wp_enqueue_script('pheromone_rotator', plugin_dir_url(__FILE__) . 'vc_extend/text-rotator.min.js', false, null, true);
		wp_enqueue_script('pheromone_ytplayer', plugin_dir_url(__FILE__) . 'vc_extend/jquery.mb.YTPlayer.min.js', false, null, true);
		wp_enqueue_script('pheromone_ytplayer_vimeo', plugin_dir_url(__FILE__) . 'vc_extend/jquery.mb.vimeo_player.min.js', false, null, true);
		wp_enqueue_script('pheromone_vegas', plugin_dir_url(__FILE__) . 'vc_extend/vegas.min.js', false, null, true);
		wp_enqueue_script('pheromone_circle', plugin_dir_url(__FILE__) . 'vc_extend/jquery.circle-progress.min.js', false, null, true);
	}
};


function pheromone_enqueue_sstyle()
{
	wp_enqueue_style('pheromone_vegas', plugin_dir_url(__FILE__) . 'vc_extend/vegas.min.css', array(), '1', 'all');
	wp_enqueue_style('pheromone_vc_style', plugin_dir_url(__FILE__) . 'vc_extend/vc.css', array(), '1', 'all');
}
add_action('wp_enqueue_scripts', 'pheromone_enqueue_sstyle');

include_once(ABSPATH . 'wp-admin/includes/plugin.php');
if (is_plugin_active('js_composer/js_composer.php')) {
	include(plugin_dir_path(__FILE__) . 'vc_extend/vc.php'); //Visual Composer
}