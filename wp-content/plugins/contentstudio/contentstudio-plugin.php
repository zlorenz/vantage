<?php
/*
Plugin Name: ContentStudio
Description: ContentStudio provides you with powerful blogging & social media tools to keep your audience hooked by streamlining the process for you to discover and share engaging content on multiple blogging & social media networks
Version: 1.4.1
Author: ContentStudio
Author URI: http://contentstudio.io/
Plugin URI: http://contentstudio.io/
Requires at least: 5.8
Requires PHP: 7.4
License: GPL v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CONTENTSTUDIO_VERSION', '1.4.0');
define('CONTENTSTUDIO_PLUGIN_FILE', __FILE__);
define('CONTENTSTUDIO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONTENTSTUDIO_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include the REST API class
require_once CONTENTSTUDIO_PLUGIN_DIR . 'includes/class-contentstudio-api.php';

/**
 * add the meta SEO title for the web page if the post has SEO title available
 */
// include_once(ABSPATH . 'wp-includes/pluggable.php');
function contentstudio_add_wpseo_title()
{

    global $post;
    if ($post) {
        if (isset($post->ID)) {
            if ($post->post_type == 'post') {
                $meta_title = get_post_meta($post->ID, 'contentstudio_wpseo_title');
                if(isset($meta_title[0]) && $meta_title[0]){
                    return $meta_title[0];
                }
            }
        }
    }
}

add_filter('pre_get_document_title', 'contentstudio_add_wpseo_title');

// Check for existing class
if (! class_exists('contentstudio')) {

    class ContentStudio
    {
        protected $api_url = 'https://api.contentstudio.io/';

        protected $assets = 'https://contentstudio.io/img';

        private $version = '1.4.1';

        protected $contentstudio_id = '';

        protected $blog_id = '';

        public $cstu_plugin;

        protected $cstu_plugin_assets_dir;

        const INVALID_MESSAGE = 'Invalid API Key, please make sure you have correct API key added.';

        const INVALID_MESSAGE_POST_API = 'Invalid API Key, please make sure you have correct API key added.';

        const UNKNOWN_ERROR_MESSAGE = 'An Unknown error occurred while uploading media file.';

        /**
         * Add ContentStudio and settings link to the admin menu
         */
        public function __construct()
        {

            $this->cstu_plugin = plugin_basename(__FILE__);

            $this->cstu_plugin_assets_dir = plugin_dir_url(__FILE__) . "assets/";

            $this->hooks();
            register_activation_hook(__FILE__, [$this, 'activation']);
            if (is_admin()) {
                $this->register_admin_hooks();
            }

            // create db table and register webhooks
            $this->create_cstu_database_table();
            $this->register_global_hooks();

            // register style

        }



        /**
         * Creaate a database table for the SEO settings
         */
        public function create_cstu_database_table()
        {
            global $wpdb;
            $table_name = $wpdb->prefix."seo";
            $sql = "CREATE TABLE $table_name (
			  id mediumint(9) NOT NULL AUTO_INCREMENT,
			  post_id mediumint(9) NOT NULL default 0,
			  title varchar (100) not NULL,
			  description varchar (100) default null,
			  slug varchar (100) ,PRIMARY KEY (id));";

            require_once(ABSPATH.'wp-admin/includes/upgrade.php');
            maybe_create_table($table_name, $sql);
        }

        /**
         * Add a ContentStudio icon to the menu
         */
        public function add_menu()
        {
           if(current_user_can('editor') || current_user_can('administrator')){
                add_menu_page('ContentStudio Publisher', 'ContentStudio', 'edit_posts', 'contentstudio_settings', [
                    $this,
                    'connection_page',
                ], $this->cstu_plugin_assets_dir . "menu-logo.png", '50.505');
                // Settings link to the plugin listing page.
            }
        }

        /**
         * Register global hooks
         * 
         * SECURITY UPDATE v1.4.0:
         * - Removed vulnerable init hooks that used username/password authentication
         * - All post creation/update operations now use REST API with API key authentication
         * - This fixes CVE-2025-12181 (Arbitrary File Upload vulnerability)
         */
        public function register_global_hooks()
        {
            // Initialize REST API endpoints
            ContentStudio_API::get_instance();

            // Keep only safe, read-only legacy endpoints for backward compatibility
            add_action('init', [$this, 'cstu_is_installed']);
            
            // Frontend hook for SEO metadata
            add_action('wp_head', [$this, 'add_cstu_meta_data']);

            if (!function_exists('get_plugins')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
        }

        /**
         * Add meta SEO title for the users's shared blog posts.
         */
        function add_cstu_meta_data()
        {
            global $post;
            if ($post) {
                if (isset($post->ID)) {
                    $meta_description = get_post_meta($post->ID, 'contentstudio_wpseo_description');
                    if ($meta_description) {
                        echo '<meta name="description" content="'.esc_attr($meta_description[0]).'" />'."\n";
                    }

                    //$meta_title = get_post_meta($post->ID, 'contentstudio_wpseo_title');
                    //echo '<title>'.$meta_title[0].'</title>' . "\n";

                    //return $meta_title[0];
                }
            }
        }

        /**
         * Registers admin-only hooks.
         */
        public function register_admin_hooks()
        {

            add_action('admin_menu', [$this, 'add_menu']);

            add_filter("plugin_action_links_$this->cstu_plugin", [$this, 'plugin_settings_link'], 2, 2);

            // ajax requests
            add_action('wp_ajax_add_cstu_api_key', [$this, 'add_cstu_api_key']);
            add_action('wp_ajax_add_cstu_settings', [$this, 'add_cstu_settings']);
            // Add check for activation redirection
            add_action('admin_init', [$this, 'activation_redirect']);
            // load resources

        }

        public function hooks()
        {

            register_activation_hook(__FILE__, [$this, 'activation']);
            register_deactivation_hook(__FILE__, [$this, 'deactivation']);
        }

        /**
         * plugin activation, deactivation and uninstall hooks
         */
        public function activation()
        {
            register_uninstall_hook(__FILE__, ['contentstudio', 'uninstall']);
            // Set redirection to true
            add_option('contentstudio_redirect', true);
        }

        /**
         * on plugin deactivation
         */
        public function deactivation()
        {
            delete_option('contentstudio_redirect');
            delete_option('contentstudio_token');
            delete_option('contentstudio_save_media_in_wp');
        }

        /**
         * Find all of the image urls that are in the content description
         *
         * @param $content mixed The data of the post
         * @return array|null result whether it contains images or not
         */
        public function cstu_find_all_images_urls($content)
        {
            $pattern = '/<img[^>]*src=["\']([^"\']*)[^"\']*["\'][^>]*>/i'; // find img tags and retrieve src
            preg_match_all($pattern, $content, $urls, PREG_SET_ORDER);
            if (empty($urls)) {
                return null;
            }
            foreach ($urls as $index => &$url) {
                $images[$index]['alt'] = preg_match('/<img[^>]*alt=["\']([^"\']*)[^"\']*["\'][^>]*>/i', $url[0], $alt) ? $alt[1] : null;
                $images[$index]['url'] = $url = $url[1];
            }
            foreach (array_unique($urls) as $index => $url) {
                $unique_array[] = $images[$index];
            }

            return $unique_array;
        }
 
        /**
         *
         * Check whether the plugin yoast is active
         *
         * @return bool status of the plugin true if active/false if inactive
         */

        function is_yoast_active()
        {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Using WordPress core filter
            $active_plugins = apply_filters('active_plugins', get_option('active_plugins'));
            foreach ($active_plugins as $plugin) {
                if (strpos($plugin, 'wp-seo')) {
                    return true;
                }
            }

            return false;
        }

        /**
         *
         * Check whether the All in one SEO plugin is active
         *
         * @return bool status of the plugin true if active/false if inactive
         */

        function is_all_in_one_seo_active()
        {

            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Using WordPress core filter
            $active_plugins = apply_filters('active_plugins', get_option('active_plugins'));
            foreach ($active_plugins as $plugin) {
                if (strpos($plugin, 'all_in_one_seo_pack')) {
                    return true;
                }
            }

            return false;
        }

        // on plugin removal
        public function uninstall()
        {
            delete_option('contentstudio_redirect');
            delete_option('contentstudio_token');
        }

        /**
         * Checks to see if the plugin was just activated to redirect them to settings
         */
        public function activation_redirect()
        {


            if (get_option('contentstudio_redirect', false)) {
                // Redirect to settings page
                if (delete_option('contentstudio_redirect')) {
                    // If the plugin is being network activated on a multisite install
                    if (is_multisite() && is_network_admin()) {
                        $redirect_url = network_admin_url('plugins.php');
                    } else {
                        $redirect_url = 'admin.php?page=contentstudio_settings';
                    }

                    if (wp_safe_redirect($redirect_url)) {
                        // NOTE: call to exit after wp_redirect is per WP Codex doc:
                        //       http://codex.wordpress.org/Function_Reference/wp_redirect#Usage
                        exit;
                    }
                }
            }
        }

        // filters plugins section

        public function plugin_settings_link($actions, $file)
        {
            if (false !== strpos($file, 'plugin')) {
                $url = "admin.php?page=contentstudio_settings";
                $actions['settings'] = '<a href="'.esc_url($url).'">Settings</a>';
            }

            return $actions;
        }

        // ajax section

        public function add_cstu_api_key()
        {
            // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce is verified below
            if (isset($_POST['data']) && isset($_POST['data']['nonce_ajax'])) {
                // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
                $nonce = sanitize_text_field(wp_unslash($_POST['data']['nonce_ajax']));
                if (!wp_verify_nonce($nonce, 'add_cstu_api_key')) {
                    wp_send_json(array('status' => false, 'message' => 'Invalid security token provided.'));
                }

                if (isset($_POST['data']['key'])) {
                    // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash
                    if (strlen(sanitize_text_field(wp_unslash($_POST['data']['key']))) === 0) {
                        wp_send_json(array('status' => false, 'message' => 'Please enter your API key'));
                    }

                    $api_key = sanitize_text_field(wp_unslash($_POST['data']['key']));

                    $response = json_decode($this->is_cstu_connected($api_key), true);
                    if ($response['status'] == false) {
                        wp_send_json($response);
                    }
                    if ($response['status'] == true) {
                        // if successfully verified.

                        if (add_option('contentstudio_token', $api_key) == false) {
                            update_option('contentstudio_token', $api_key);
                        }

                        wp_send_json(json_encode(array(
                            'status' => true,
                            'message' => 'Your blog has been successfully connected with ContentStudio.',
                        )));
                    } else {
                        wp_send_json(json_encode(array('status' => false, 'message' => self::INVALID_MESSAGE)));
                    }
                } else {
                    wp_send_json(json_encode(array('status' => false, 'message' => 'Please enter your API key')));
                }
            } else {
                wp_send_json(json_encode(array('status' => false, 'message' => 'Please enter your API key')));
            }
        }

        /**
         * Save plugin settings with CSRF protection
         * 
         * FIX for CVE-2025-13144: Nonce verification is now mandatory
         */
        public function add_cstu_settings()
        {
            // SECURITY FIX: Nonce verification is mandatory - cannot be bypassed
            // Check for security token in data array (nonce_ajax from JS)
            $nonce = '';
            // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce is verified below
            if (isset($_POST['data']['nonce_ajax'])) {
                $nonce = sanitize_text_field(wp_unslash($_POST['data']['nonce_ajax']));
            } elseif (isset($_POST['data']['security'])) {
                $nonce = sanitize_text_field(wp_unslash($_POST['data']['security']));
            }

            if (empty($nonce)) {
                wp_send_json(array('status' => false, 'message' => 'Security token is required.'), 403);
                return;
            }

            // Verify nonce - accepts both 'cstu_settings_nonce' and 'add_cstu_api_key' for backward compatibility
            $nonce_valid = wp_verify_nonce($nonce, 'cstu_settings_nonce') || wp_verify_nonce($nonce, 'add_cstu_api_key');
            if (!$nonce_valid) {
                wp_send_json(array('status' => false, 'message' => 'Invalid security token provided.'), 403);
                return;
            }

            // Verify user has permission to change settings
            if (!current_user_can('manage_options') && !current_user_can('edit_posts')) {
                wp_send_json(array('status' => false, 'message' => 'You do not have permission to change settings.'), 403);
                return;
            }

            // Check cs_save_in_wp is set
            if (isset($_POST['data']['cs_save_in_wp'])) {
                $cs_save_in_wp = rest_sanitize_boolean($_POST['data']['cs_save_in_wp']);
                update_option('contentstudio_save_media_in_wp', $cs_save_in_wp);

                wp_send_json(array(
                    'status' => true,
                    'message' => 'Settings saved successfully.',
                ));
            } else {
                wp_send_json(array('status' => false, 'message' => 'Please select an option.'), 400);
            }
        }


        /**
         * Legacy endpoint: Check if plugin is installed
         * Kept for backward compatibility
         */
        public function cstu_is_installed()
        {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a public status check endpoint
            if (isset($_REQUEST['cstu_is_installed']) && sanitize_text_field(wp_unslash($_REQUEST['cstu_is_installed']))) {
                $plugin_data = get_plugin_data(__FILE__);
                wp_send_json(array(
                    'status' => true,
                    'message' => 'ContentStudio plugin installed',
                    'version' => $plugin_data['Version'],
                ));
            }
        }

        /**
         * Check if the user blog is connected or not, send a remote request to the ContentStudio.
         *
         * @param $token string - token to send for the request
         * @return mixed
         */
        public function is_cstu_connected($token)
        {
            $plugin_data = get_plugin_data(__FILE__);

            $payload = [
                'body' => [
                    'token' => $token,
                    "name" => get_bloginfo("name"),
                    "description" => get_bloginfo("description"),
                    "wpurl" => get_bloginfo("wpurl"),
                    "url" => get_bloginfo("url"),
                    'version' => $plugin_data['Version'],
                ],
            ];

            return wp_remote_post($this->api_url.'blog/wordpress_plugin', $payload)['body'];
        }

        /**
         * Render a ContentStudio plugin page.
         */
        public function connection_page()
        {
            if (! current_user_can('edit_posts')) {
                wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'contentstudio'));
            }

            $token = get_option('contentstudio_token');
            //$response =  ['status'=>true];  //NOTE: for locally testing...
            $response = json_decode($this->is_cstu_connected($token), true);

            $response['save_media_in_wp'] = get_option('contentstudio_save_media_in_wp');
            $response['reconnect'] = false;

            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a read-only operation
            if (isset($_GET['reconnect']) && sanitize_text_field(wp_unslash($_GET['reconnect'])) === 'true') {
                $response['reconnect'] = true;
            }

            $response['security_plugins'] = $this->cstu_check_installed_security_plugins();
            // Save the data to the error log so you can see what the array format is like.

            $this->load_resources();

            include(sprintf("%s/page.php", dirname(__FILE__)));
        }

        /**
         * Analyzing the security plugins that the user may have installed, and giving them a headsup to
         * whitelist our server's IP address so that there are no problems while authentication being done
         * with ContentStudio.
         *
         * NOTE: we are not modifying anything to these plugins, just checking their status wether they have been
         * activated, if activated, show a notification to the user.
         *
         * @return array - returns list of an array that is used for displaying the name of the plugins.
         */
        function cstu_check_installed_security_plugins()
        {
            $activated_plugins = get_option('active_plugins');
            $response = [
                'wordfence' => $this->is_plugin_activated($activated_plugins, 'wordfence/wordfence.php'),
                'jetpack' => $this->is_plugin_activated($activated_plugins, 'jetpack/jetpack.php'),
                '6scan' => $this->is_plugin_activated($activated_plugins, '6scan-protection/6scan.php'),
                'wp_security_scan' => $this->is_plugin_activated($activated_plugins, 'wp-security-scan/index.php'),
                'wp_all_in_one_wp_security' => $this->is_plugin_activated($activated_plugins, 'all-in-one-wp-security-and-firewall/wp-security.php'),
                'bulletproof_security' => $this->is_plugin_activated($activated_plugins, 'bulletproof-security/bulletproof-security.php'),
                'better_wp_security' => $this->is_plugin_activated($activated_plugins, 'better-wp-security/better-wp-security.php'),
                'limit_login_attempts_reloaded' => $this->is_plugin_activated($activated_plugins, 'limit-login-attempts-reloaded/limit-login-attempts-reloaded.php'),
                'limit_login_attempts' => $this->is_plugin_activated($activated_plugins, 'limit-login-attempts/limit-login-attempts.php'),
                'lockdown_wp_admin' => $this->is_plugin_activated($activated_plugins, 'lockdown-wp-admin/lockdown-wp-admin.php'),
                'miniorange_limit_login_attempts' => $this->is_plugin_activated($activated_plugins, 'miniorange-limit-login-attempts/mo_limit_login_widget.php'),
                'wp_cerber' => $this->is_plugin_activated($activated_plugins, 'wp-cerber/wp-cerber.php'),
                'wp_limit_login_attempts' => $this->is_plugin_activated($activated_plugins, 'wp-limit-login-attempts/wp-limit-login-attempts.php'),
                'sucuri_scanner' => $this->is_plugin_activated($activated_plugins, 'sucuri-scanner/sucuri.php'),
                //                'limit_login_attempts_reloaded' => $this->is_plugin_activated($all_plugins, 'limit-login-attempts-reloaded/limit-login-attempts-reloaded.php'),
            ];

            return $response;
        }

        /**
         * Check if the value of the plugin name is found in the list of plugins that have been activated by the user.
         *
         * @param $plugins_list - list of activated plugins by the user
         * @param $file_name - name of the file for the plugin
         * @return bool
         */
        function is_plugin_activated($plugins_list, $file_name)
        {
            if (in_array($file_name, $plugins_list)) {
                return true;
            }

            return false;
        }

        /**
         * Load the admin styles and scripts
         */
        function load_resources()
        {
            $version = CONTENTSTUDIO_VERSION;

            wp_enqueue_style('contentstudio.css', plugin_dir_url(__FILE__) . '_inc/contentstudio.css', array(), $version);
            wp_enqueue_style('contentstudio_curation.css', plugin_dir_url(__FILE__) . '_inc/contentstudio_curation.css', array(), $version);
            wp_enqueue_script('notify.min.js', plugin_dir_url(__FILE__) . '_inc/notify.min.js', array('jquery'), $version, true);
            wp_enqueue_script('helper.js', plugin_dir_url(__FILE__) . '_inc/helper.js', array('jquery'), $version, true);
            wp_localize_script('helper.js', 'ajax_object', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'security' => wp_create_nonce('add_cstu_api_key'),
                'settings_nonce' => wp_create_nonce('cstu_settings_nonce'),
            ));
        }
    }

    /**
     * Enqueue frontend styles
     */
    function contentstudio_enqueue_scripts()
    {
        wp_register_style('contentstudio-dashboard', plugin_dir_url(__FILE__) . '_inc/main.css', array(), CONTENTSTUDIO_VERSION);
        wp_enqueue_style('contentstudio-dashboard');
    }

    add_action('wp_enqueue_scripts', 'contentstudio_enqueue_scripts');

    return new ContentStudio();
}
