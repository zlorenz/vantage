<?php
/**
 * ContentStudio REST API Class
 * 
 * Handles all REST API endpoints for ContentStudio plugin.
 * Uses API key authentication instead of username/password.
 * 
 * @package ContentStudio
 * @since 1.4.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class ContentStudio_API
{
    private static $instance = null;
    private $namespace = 'contentstudio/v1';
    
    // Allowed image mime types for security
    private $allowed_image_types = array(
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    );
    
    // Allowed image extensions for security
    private $allowed_image_extensions = array(
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp'
    );

    const INVALID_API_KEY_MESSAGE = 'Invalid API Key, please make sure you have correct API key added.';
    const UNKNOWN_ERROR_MESSAGE = 'An Unknown error occurred while processing your request.';

    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register all REST API routes
     */
    public function register_routes()
    {
        // Check if plugin is installed (no auth required)
        register_rest_route($this->namespace, '/check', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_installed'),
            'permission_callback' => '__return_true'
        ));

        // Validate API Key / Check if installed
        register_rest_route($this->namespace, '/validate', array(
            'methods' => 'GET',
            'callback' => array($this, 'validate_api_key'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Get metadata
        register_rest_route($this->namespace, '/metadata', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_metadata'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Get Authors endpoint
        register_rest_route($this->namespace, '/authors', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_authors'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Get Categories endpoint
        register_rest_route($this->namespace, '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Get Categories and Authors endpoint
        register_rest_route($this->namespace, '/categories_authors', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories_and_authors'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Create Post endpoint
        register_rest_route($this->namespace, '/posts', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_post'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Get Posts endpoint
        register_rest_route($this->namespace, '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_posts'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Update Post endpoint
        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => array($this, 'update_post'),
            'permission_callback' => array($this, 'check_api_key'),
            'args' => array(
                'id' => array(
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));

        // Change post status endpoint
        register_rest_route($this->namespace, '/posts/(?P<id>\d+)/status', array(
            'methods' => 'PATCH',
            'callback' => array($this, 'change_post_status'),
            'permission_callback' => array($this, 'check_api_key'),
            'args' => array(
                'id' => array(
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));

        // Check upload directory
        register_rest_route($this->namespace, '/upload-check', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_upload_directory'),
            'permission_callback' => array($this, 'check_api_key')
        ));

        // Disconnect/Unset token
        register_rest_route($this->namespace, '/disconnect', array(
            'methods' => 'POST',
            'callback' => array($this, 'disconnect'),
            'permission_callback' => array($this, 'check_api_key')
        ));
    }

    /**
     * Check API key from request headers
     * 
     * @return bool|WP_Error True if valid, WP_Error otherwise
     */
    public function check_api_key()
    {
        $headers = $this->get_request_headers();
        $header_key_lowercase = 'x-contentstudio-key';

        // Convert all header keys to lowercase for case-insensitive comparison
        $lower_case_headers = array_change_key_case($headers, CASE_LOWER);

        if (!isset($lower_case_headers[$header_key_lowercase])) {
            return new WP_Error(
                'missing_api_key',
                'API key header is missing. Please include X-ContentStudio-Key header.',
                array('status' => 403)
            );
        }

        $api_key = trim($lower_case_headers[$header_key_lowercase]);
        $stored_key = get_option('contentstudio_token');

        if (empty($stored_key)) {
            return new WP_Error(
                'configuration_error',
                'API key is not configured in WordPress settings.',
                array('status' => 500)
            );
        }

        if ($api_key !== trim($stored_key)) {
            return new WP_Error(
                'invalid_api_key',
                self::INVALID_API_KEY_MESSAGE,
                array('status' => 403)
            );
        }

        return true;
    }

    /**
     * Get request headers with fallback support
     * 
     * @return array Headers array
     */
    private function get_request_headers()
    {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }

        // Fallback for servers without getallheaders
        $headers = array();
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $header_name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$header_name] = $value;
            }
        }
        return $headers;
    }

    /**
     * Check if plugin is installed (no authentication required)
     * This replaces the legacy cstu_is_installed endpoint
     */
    public function check_installed($request)
    {
        $plugin_data = $this->get_plugin_data();
        
        return new WP_REST_Response(array(
            'status' => true,
            'message' => 'ContentStudio plugin installed',
            'version' => $plugin_data['Version'],
        ), 200);
    }

    /**
     * Validate API key endpoint
     */
    public function validate_api_key($request)
    {
        $plugin_data = $this->get_plugin_data();
        
        return new WP_REST_Response(array(
            'status' => true,
            'message' => 'ContentStudio plugin installed and API key is valid',
            'version' => $plugin_data['Version'],
            'meta_data' => array(
                'site_name' => get_bloginfo('name'),
                'site_url' => get_site_url(),
                'wordpress_version' => get_bloginfo('version'),
            )
        ), 200);
    }

    /**
     * Get blog metadata
     */
    public function get_metadata($request)
    {
        $plugin_data = $this->get_plugin_data();
        
        $metadata = array(
            'name' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'wpurl' => get_bloginfo('wpurl'),
            'url' => get_bloginfo('url'),
            'language' => get_bloginfo('language'),
            'charset' => get_bloginfo('charset'),
            'version' => get_bloginfo('version'),
            'timezone_string' => get_option('timezone_string'),
            'gmt_offset' => get_option('gmt_offset'),
            'server_time' => time(),
            'server_date' => gmdate('c'),
            'plugin_version' => $plugin_data['Version'],
            'php_version' => PHP_VERSION,
            'site_url' => get_option('siteurl'),
            'pingback_url' => get_bloginfo('pingback_url'),
            'rss2_url' => get_bloginfo('rss2_url'),
        );

        // Add theme info
        $theme = wp_get_theme();
        $metadata['debug'] = array(
            'theme' => array(
                'Name' => $theme->get('Name'),
                'ThemeURI' => $theme->get('ThemeURI'),
                'Description' => $theme->get('Description'),
                'Author' => $theme->get('Author'),
                'AuthorURI' => $theme->get('AuthorURI'),
                'Version' => $theme->get('Version'),
                'Template' => $theme->get('Template'),
                'Status' => $theme->get('Status'),
                'Tags' => $theme->get('Tags'),
                'TextDomain' => $theme->get('TextDomain'),
                'DomainPath' => $theme->get('DomainPath'),
            )
        );

        return new WP_REST_Response(array(
            'status' => true,
            'message' => 'Meta Data Of Blog',
            'usermetadeata' => $metadata,
        ), 200);
    }

    /**
     * Get blog authors
     */
    public function get_authors($request = null)
    {
        $authors = get_users();
        $return_authors = array();

        foreach ($authors as $author) {
            $user = new WP_User($author->ID);
            if ($user->has_cap('publish_posts') && $user->has_cap('edit_posts')) {
                $return_authors[] = array(
                    'display_name' => $author->data->display_name,
                    'user_id' => $author->ID,
                );
            }
        }

        if (!$request) {
            return $return_authors;
        }

        return new WP_REST_Response($return_authors, 200);
    }

    /**
     * Get blog categories
     */
    public function get_categories($request = null)
    {
        $args = array(
            'hide_empty' => 0,
            'type' => 'post',
            'orderby' => 'name',
            'order' => 'ASC',
        );
        
        $categories = get_categories($args);
        $return_categories = array();

        foreach ($categories as $category) {
            $return_categories[] = array(
                'name' => $category->cat_name,
                'term_id' => $category->term_id,
            );
        }

        if (!$request) {
            return $return_categories;
        }

        return new WP_REST_Response($return_categories, 200);
    }

    /**
     * Get both categories and authors
     */
    public function get_categories_and_authors($request)
    {
        return new WP_REST_Response(array(
            'authors' => $this->get_authors(),
            'categories' => $this->get_categories()
        ), 200);
    }

    /**
     * Create a new post
     */
    public function create_post($request)
    {
        try {
            $params = $request->get_json_params();
            if (empty($params)) {
                $params = $request->get_params();
            }

            // Validate required fields
            if (empty($params['post_title'])) {
                return new WP_Error('missing_title', 'Post title is required', array('status' => 400));
            }

            // Check for duplicate title
            $post_title = sanitize_text_field($params['post_title']);
            if ($this->post_title_exists($post_title)) {
                return new WP_Error(
                    'duplicate_post',
                    "Post already exists on your blog with this title.",
                    array('status' => 409)
                );
            }

            // Process categories
            $categories = array();
            if (!empty($params['post_category'])) {
                $categories = array_map('intval', explode(',', sanitize_text_field($params['post_category'])));
            }

            // Process tags
            $tags = array();
            if (!empty($params['tags'])) {
                $tags = array_map('sanitize_text_field', explode(',', $params['tags']));
            }

            // Remove content filters for raw HTML support
            $this->kses_remove_filters();

            // Prepare post data
            $post_data = array(
                'post_title' => $post_title,
                'post_content' => isset($params['post_content']) ? wp_kses_post($params['post_content']) : '',
                'post_status' => isset($params['post_status']) ? sanitize_text_field($params['post_status']) : 'draft',
                'post_author' => isset($params['post_author']) ? (int)$params['post_author'] : get_current_user_id(),
                'post_category' => $categories,
                'tags_input' => $tags,
                'post_type' => 'post'
            );

            // Create the post
            $post_id = wp_insert_post($post_data, true);

            if (is_wp_error($post_id)) {
                return new WP_Error('post_creation_failed', $post_id->get_error_message(), array('status' => 500));
            }

            // Get created post
            $post = get_post($post_id);

            // Set SEO metadata
            $this->set_post_seo_metadata($post, $params);

            // Handle terms/tags
            if (!empty($params['terms'])) {
                $this->set_post_tags($post, $params['terms']);
            }

            // Prepare response
            $response = array(
                'status' => true,
                'post_id' => $post_id,
                'link' => get_permalink($post_id),
                'allow_url_fopen' => ini_get('allow_url_fopen')
            );

            // Handle featured image with security validation
            if (!empty($params['featured_image'])) {
                $image_result = $this->secure_generate_image(
                    $params['featured_image'],
                    $post_id,
                    $post_title
                );
                
                if (!$image_result['status']) {
                    $response['warning_message'] = $image_result['message'];
                }
            }

            // Upload post images if setting enabled
            if (get_option('contentstudio_save_media_in_wp', false)) {
                $response['upload_images_response'] = $this->secure_upload_post_images($post_id);
            }

            return new WP_REST_Response($response, 201);

        } catch (Exception $e) {
            return new WP_Error(
                'server_error',
                self::UNKNOWN_ERROR_MESSAGE,
                array('status' => 500, 'details' => $e->getMessage())
            );
        }
    }

    /**
     * Update an existing post
     */
    public function update_post($request)
    {
        try {
            $post_id = (int) $request['id'];

            // Check if post exists
            $existing_post = get_post($post_id);
            if (!$existing_post) {
                return new WP_Error('post_not_found', 'Post not found.', array('status' => 404));
            }

            $params = $request->get_json_params();
            if (empty($params)) {
                $params = $request->get_params();
            }

            // Process categories
            $categories = array();
            if (!empty($params['post_category'])) {
                $categories = array_map('intval', explode(',', sanitize_text_field($params['post_category'])));
            }

            // Remove content filters
            $this->kses_remove_filters();

            // Prepare post data
            $post_data = array('ID' => $post_id);

            if (isset($params['post_title'])) {
                $post_data['post_title'] = sanitize_text_field($params['post_title']);
            }
            if (isset($params['post_content'])) {
                $post_data['post_content'] = wp_kses_post($params['post_content']);
            }
            if (isset($params['post_status'])) {
                $post_data['post_status'] = sanitize_text_field($params['post_status']);
            }
            if (isset($params['post_author'])) {
                $post_data['post_author'] = (int)$params['post_author'];
            }
            if (!empty($categories)) {
                $post_data['post_category'] = $categories;
            }

            // Update the post
            $updated_post_id = wp_update_post($post_data, true);

            if (is_wp_error($updated_post_id)) {
                return new WP_Error('update_failed', $updated_post_id->get_error_message(), array('status' => 500));
            }

            // Get updated post
            $post = get_post($updated_post_id);

            // Set SEO metadata
            $this->set_post_seo_metadata($post, $params);

            // Handle terms/tags
            if (!empty($params['terms'])) {
                $this->set_post_tags($post, $params['terms']);
            }

            // Prepare response
            $response = array(
                'status' => true,
                'post_id' => $updated_post_id,
                'link' => get_permalink($updated_post_id),
            );

            // Handle featured image with security validation
            if (!empty($params['featured_image'])) {
                $post_title = isset($params['post_title']) ? sanitize_text_field($params['post_title']) : $post->post_title;
                $image_result = $this->secure_generate_image(
                    $params['featured_image'],
                    $updated_post_id,
                    $post_title
                );
                
                if (!$image_result['status']) {
                    $response['warning_message'] = $image_result['message'];
                }
            }

            return new WP_REST_Response($response, 200);

        } catch (Exception $e) {
            return new WP_Error(
                'server_error',
                self::UNKNOWN_ERROR_MESSAGE,
                array('status' => 500, 'details' => $e->getMessage())
            );
        }
    }

    /**
     * Change post status
     */
    public function change_post_status($request)
    {
        $post_id = (int) $request['id'];
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        if (empty($params['status'])) {
            return new WP_Error('missing_status', 'Status is required', array('status' => 400));
        }

        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('post_not_found', 'Post not found.', array('status' => 404));
        }

        $new_status = sanitize_text_field($params['status']);
        $allowed_statuses = array('publish', 'draft', 'pending', 'private');
        
        if (!in_array($new_status, $allowed_statuses)) {
            return new WP_Error('invalid_status', 'Invalid post status.', array('status' => 400));
        }

        if ($post->post_status === $new_status) {
            return new WP_REST_Response(array(
                'status' => false,
                'message' => "Your post status is already {$new_status}"
            ), 200);
        }

        $result = wp_update_post(array(
            'ID' => $post_id,
            'post_status' => $new_status
        ), true);

        if (is_wp_error($result)) {
            return new WP_Error('update_failed', $result->get_error_message(), array('status' => 500));
        }

        return new WP_REST_Response(array(
            'status' => true,
            'message' => 'Your post status has been updated',
            'post_id' => $post_id,
            'new_status' => $new_status
        ), 200);
    }

    /**
     * Get posts
     */
    public function get_posts($request)
    {
        $args = array(
            'post_type' => 'post',
            'posts_per_page' => 10,
            'post_status' => array('publish', 'draft', 'pending')
        );

        $posts = get_posts($args);
        $formatted_posts = array();

        foreach ($posts as $post) {
            $formatted_posts[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'status' => $post->post_status,
                'date' => $post->post_date,
                'url' => get_permalink($post->ID),
                'excerpt' => $post->post_excerpt,
                'featured_image' => get_the_post_thumbnail_url($post->ID)
            );
        }

        return new WP_REST_Response($formatted_posts, 200);
    }

    /**
     * Check upload directory
     */
    public function check_upload_directory($request)
    {
        $base_dir = wp_upload_dir()['basedir'];
        
        if (!is_dir($base_dir)) {
            return new WP_REST_Response(array(
                'status' => false,
                'exists' => false,
                'message' => 'Your WordPress wp-content/uploads/ directory does not exist. Please create a directory first to enable featured images/media uploads.',
            ), 200);
        }

        return new WP_REST_Response(array(
            'status' => true,
            'exists' => true,
            'message' => 'Upload directory exists and is ready.',
        ), 200);
    }

    /**
     * Disconnect/remove API key
     */
    public function disconnect($request)
    {
        delete_option('contentstudio_token');
        
        return new WP_REST_Response(array(
            'status' => true,
            'message' => 'Your API key has been removed successfully!'
        ), 200);
    }

    /**
     * SECURE: Generate and upload featured image with file type validation
     * 
     * This function fixes CVE-2025-12181 by validating file types before saving
     * 
     * @param string $image_url URL of the image to download
     * @param int $post_id Post ID to attach the image to
     * @param string $post_title Post title for image naming
     * @return array Status and message
     */
    private function secure_generate_image($image_url, $post_id, $post_title)
    {
        try {
            // Get upload directory
            $upload_dir = wp_upload_dir();
            
            if (isset($upload_dir['error']) && $upload_dir['error']) {
                return array('status' => false, 'message' => $upload_dir['error']);
            }

            // Check allow_url_fopen
            if (!ini_get('allow_url_fopen')) {
                return array('status' => false, 'message' => 'allow_url_fopen is disabled in PHP configuration.');
            }

            // Sanitize URL - remove query params and fragments
            $image_url = esc_url_raw($image_url);
            if (strpos($image_url, '?') !== false) {
                $image_url = substr($image_url, 0, strpos($image_url, '?'));
            }
            if (strpos($image_url, '#') !== false) {
                $image_url = substr($image_url, 0, strpos($image_url, '#'));
            }

            // Use WordPress HTTP API instead of file_get_contents
            $response = wp_remote_get($image_url, array(
                'timeout' => 30,
                'sslverify' => true
            ));

            if (is_wp_error($response)) {
                return array('status' => false, 'message' => 'Failed to download image: ' . $response->get_error_message());
            }

            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 200) {
                return array('status' => false, 'message' => 'Failed to download image. HTTP status: ' . $response_code);
            }

            $image_data = wp_remote_retrieve_body($response);
            if (empty($image_data)) {
                return array('status' => false, 'message' => 'Downloaded image is empty.');
            }

            // Get content type from response headers
            $content_type = wp_remote_retrieve_header($response, 'content-type');
            
            // SECURITY FIX: Validate content type is an allowed image type
            if (!$this->is_allowed_image_type($content_type)) {
                return array(
                    'status' => false, 
                    'message' => 'Invalid file type. Only images (jpeg, png, gif, webp) are allowed.'
                );
            }

            // Determine filename and extension
            $filename = $this->generate_secure_filename($image_url, $post_title, $content_type);
            
            // SECURITY FIX: Validate the file extension
            $file_extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            if (!in_array($file_extension, $this->allowed_image_extensions)) {
                return array(
                    'status' => false,
                    'message' => 'Invalid file extension. Only jpg, jpeg, png, gif, webp are allowed.'
                );
            }

            // Create unique filename
            $filename = wp_unique_filename($upload_dir['path'], $filename);
            
            // Build file path
            if (wp_mkdir_p($upload_dir['path'])) {
                $file = $upload_dir['path'] . '/' . $filename;
            } else {
                $file = $upload_dir['basedir'] . '/' . $filename;
            }

            // SECURITY FIX: Validate file content is actually an image before saving
            // Save to temp file first
            $temp_file = wp_tempnam($filename);
            $saved = file_put_contents($temp_file, $image_data);
            
            if (!$saved) {
                return array('status' => false, 'message' => 'Failed to save image temporarily.');
            }

            // Validate the temp file is actually an image
            $validation = $this->validate_image_file($temp_file);
            if (!$validation['valid']) {
                wp_delete_file($temp_file);
                return array('status' => false, 'message' => $validation['message']);
            }

            // Move temp file to final location using copy and delete for compatibility
            // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            if (!@copy($temp_file, $file)) {
                wp_delete_file($temp_file);
                return array('status' => false, 'message' => 'Failed to move image to uploads directory.');
            }
            wp_delete_file($temp_file);

            // Double-check the file type using WordPress functions
            $wp_filetype = wp_check_filetype($filename, null);
            if (empty($wp_filetype['type']) || !$this->is_allowed_image_type($wp_filetype['type'])) {
                wp_delete_file($file);
                return array(
                    'status' => false,
                    'message' => 'File type validation failed. Only images are allowed.'
                );
            }

            // Prepare attachment
            $attachment = array(
                'post_mime_type' => $wp_filetype['type'],
                'post_title' => sanitize_file_name($post_title),
                'post_content' => '',
                'post_status' => 'inherit',
            );

            $attach_id = wp_insert_attachment($attachment, $file, $post_id);

            if (is_wp_error($attach_id)) {
                wp_delete_file($file);
                return array('status' => false, 'message' => 'Failed to create attachment.');
            }

            // Generate attachment metadata
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            $attach_data = wp_generate_attachment_metadata($attach_id, $file);
            wp_update_attachment_metadata($attach_id, $attach_data);

            // Set as featured image
            $result = set_post_thumbnail($post_id, $attach_id);
            update_post_meta($attach_id, '_wp_attachment_image_alt', sanitize_text_field($post_title));

            if ($result) {
                return array('status' => true);
            } else {
                return array('status' => false, 'message' => 'Failed to set featured image.');
            }

        } catch (Exception $e) {
            return array(
                'status' => false,
                'message' => self::UNKNOWN_ERROR_MESSAGE,
                'line' => $e->getLine(),
                'error_message' => $e->getMessage()
            );
        }
    }

    /**
     * Check if content type is an allowed image type
     * 
     * @param string $content_type MIME type to check
     * @return bool True if allowed
     */
    private function is_allowed_image_type($content_type)
    {
        // Handle content-type with charset (e.g., "image/jpeg; charset=utf-8")
        if (strpos($content_type, ';') !== false) {
            $content_type = trim(explode(';', $content_type)[0]);
        }
        
        return in_array(strtolower($content_type), $this->allowed_image_types);
    }

    /**
     * Validate that a file is actually an image
     * 
     * @param string $file_path Path to the file
     * @return array Validation result with 'valid' and 'message' keys
     */
    private function validate_image_file($file_path)
    {
        // Check if file exists
        if (!file_exists($file_path)) {
            return array('valid' => false, 'message' => 'File does not exist.');
        }

        // Use getimagesize to verify it's actually an image
        $image_info = @getimagesize($file_path);
        if ($image_info === false) {
            return array('valid' => false, 'message' => 'File is not a valid image.');
        }

        // Check the mime type from getimagesize
        $mime_type = $image_info['mime'];
        if (!$this->is_allowed_image_type($mime_type)) {
            return array('valid' => false, 'message' => 'Invalid image type detected.');
        }

        // Check for PHP code in the file (additional security)
        $file_content = file_get_contents($file_path);
        if ($this->contains_php_code($file_content)) {
            return array('valid' => false, 'message' => 'File contains suspicious code.');
        }

        return array('valid' => true, 'message' => 'Valid image file.');
    }

    /**
     * Check if file content contains PHP code
     * 
     * Only checks for clear PHP signatures, not binary data that might 
     * accidentally match patterns. We check:
     * - First 1KB for PHP opening tags (where execution would start)
     * - Full file for explicit <?php tag (case insensitive)
     * 
     * @param string $content File content
     * @return bool True if PHP code detected
     */
    private function contains_php_code($content)
    {
        // Check for explicit PHP opening tag anywhere in the file
        // This is the most reliable indicator of intentional PHP code
        if (preg_match('/<\?php\s/i', $content)) {
            return true;
        }

        // Check first 1KB for short PHP tags (where execution matters)
        $header = substr($content, 0, 1024);
        
        $header_patterns = array(
            '/<\?=/i',  // Short echo tag
            '/<script\s+language\s*=\s*["\']?php["\']?/i',
        );

        foreach ($header_patterns as $pattern) {
            if (preg_match($pattern, $header)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate a secure filename for the image
     * 
     * @param string $image_url Original image URL
     * @param string $post_title Post title
     * @param string $content_type Content type
     * @return string Secure filename
     */
    private function generate_secure_filename($image_url, $post_title, $content_type)
    {
        // Get extension from content type
        $extension = 'jpg'; // default
        switch (strtolower($content_type)) {
            case 'image/png':
                $extension = 'png';
                break;
            case 'image/gif':
                $extension = 'gif';
                break;
            case 'image/webp':
                $extension = 'webp';
                break;
            case 'image/jpg':
            case 'image/jpeg':
            default:
                $extension = 'jpg';
                break;
        }

        // Create filename from post title
        $base_name = sanitize_file_name($post_title);
        
        // Ensure filename is not empty
        if (empty($base_name)) {
            $base_name = 'image-' . time();
        }

        return $base_name . '.' . $extension;
    }

    /**
     * SECURE: Upload post images with validation
     * 
     * @param int $post_id Post ID
     * @return array Result
     */
    private function secure_upload_post_images($post_id)
    {
        try {
            $post = get_post($post_id);
            $content = $post->post_content;

            // Find all image URLs in the post content
            preg_match_all('/<img[^>]+src="([^">]+)"/i', $content, $matches);
            $image_urls = array_unique($matches[1]);

            if (empty($image_urls)) {
                return array(
                    'status' => true,
                    'message' => 'No images found in post content'
                );
            }

            $upload_dir = wp_upload_dir();

            foreach ($image_urls as $image_url) {
                // Download image using WordPress HTTP API
                $response = wp_remote_get($image_url, array('timeout' => 30));
                
                if (is_wp_error($response)) {
                    continue;
                }

                $image_data = wp_remote_retrieve_body($response);
                if (empty($image_data)) {
                    continue;
                }

                // Get content type
                $content_type = wp_remote_retrieve_header($response, 'content-type');
                
                // SECURITY: Validate content type
                if (!$this->is_allowed_image_type($content_type)) {
                    continue;
                }

                // Get filename
                $filename = basename($image_url);
                if (strpos($filename, '?') !== false) {
                    $filename = substr($filename, 0, strpos($filename, '?'));
                }

                // SECURITY: Validate extension
                $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                if (!in_array($extension, $this->allowed_image_extensions)) {
                    // Generate safe filename from content type
                    $filename = 'image-' . time() . '-' . wp_rand() . '.' . $this->get_extension_from_mime($content_type);
                }

                $filename = wp_unique_filename($upload_dir['path'], sanitize_file_name($filename));
                $file_path = $upload_dir['path'] . '/' . $filename;

                // Save to temp file first for validation
                $temp_file = wp_tempnam($filename);
                file_put_contents($temp_file, $image_data);

                // Validate it's actually an image
                $validation = $this->validate_image_file($temp_file);
                if (!$validation['valid']) {
                    wp_delete_file($temp_file);
                    continue;
                }

                // Move to final location using copy and delete for compatibility
                // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
                if (!@copy($temp_file, $file_path)) {
                    wp_delete_file($temp_file);
                    continue;
                }
                wp_delete_file($temp_file);

                // Verify file type
                $filetype = wp_check_filetype($filename, null);
                if (empty($filetype['type'])) {
                    wp_delete_file($file_path);
                    continue;
                }

                // Prepare attachment
                $attachment = array(
                    'guid' => $upload_dir['url'] . '/' . $filename,
                    'post_mime_type' => $filetype['type'],
                    'post_title' => preg_replace('/\.[^.]+$/', '', $filename),
                    'post_content' => '',
                    'post_status' => 'inherit'
                );

                $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
                if (is_wp_error($attach_id)) {
                    wp_delete_file($file_path);
                    continue;
                }

                // Generate metadata
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
                wp_update_attachment_metadata($attach_id, $attach_data);

                // Replace URL in content
                $new_image_url = wp_get_attachment_url($attach_id);
                if ($new_image_url) {
                    $content = str_replace($image_url, $new_image_url, $content);
                }
            }

            // Update post content
            wp_update_post(array(
                'ID' => $post_id,
                'post_content' => $content
            ));

            return array(
                'status' => true,
                'message' => 'Images uploaded successfully.'
            );

        } catch (Exception $e) {
            return array(
                'status' => false,
                'message' => self::UNKNOWN_ERROR_MESSAGE,
                'error_message' => $e->getMessage(),
                'line' => $e->getLine()
            );
        }
    }

    /**
     * Get file extension from MIME type
     * 
     * @param string $mime_type MIME type
     * @return string Extension
     */
    private function get_extension_from_mime($mime_type)
    {
        $map = array(
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        );
        
        return isset($map[$mime_type]) ? $map[$mime_type] : 'jpg';
    }

    /**
     * Check if post title exists
     * 
     * @param string $title Post title
     * @return bool True if exists
     */
    private function post_title_exists($title)
    {
        global $wpdb;
        $title = wp_strip_all_tags($title);
        $sql = $wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_status = 'publish' LIMIT 1",
            $title
        );
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared -- Query is prepared above
        $result = $wpdb->get_results($sql);
        return count($result) > 0;
    }

    /**
     * Remove kses filters for content
     */
    private function kses_remove_filters()
    {
        remove_filter('content_save_pre', 'wp_filter_post_kses');
        remove_filter('excerpt_save_pre', 'wp_filter_post_kses');
        remove_filter('content_filtered_save_pre', 'wp_filter_post_kses');
    }

    /**
     * Set post SEO metadata
     * 
     * @param WP_Post $post Post object
     * @param array $params Request parameters
     */
    private function set_post_seo_metadata($post, $params)
    {
        // Meta description
        if (!empty($params['post_meta_description'])) {
            $meta_description = sanitize_text_field($params['post_meta_description']);
            update_post_meta($post->ID, 'contentstudio_wpseo_description', $meta_description);
        }

        // Meta title
        if (!empty($params['post_meta_title'])) {
            $meta_title = sanitize_text_field($params['post_meta_title']);
            update_post_meta($post->ID, 'contentstudio_wpseo_title', $meta_title);
        }

        // Custom slug
        if (!empty($params['post_meta_url'])) {
            $slug = sanitize_text_field($params['post_meta_url']);
            $unique_slug = wp_unique_post_slug($slug, $post->ID, $post->post_status, $post->post_type, $post->post_parent);
            wp_update_post(array(
                'ID' => $post->ID,
                'post_name' => $unique_slug,
            ));
        }

        // Yoast SEO
        if ($this->is_yoast_active()) {
            $this->set_yoast_seo($post->ID, $params);
        }

        // All in One SEO
        if ($this->is_all_in_one_seo_active()) {
            $this->set_all_in_one_seo($post->ID, $params);
        }
    }

    /**
     * Check if Yoast SEO is active
     */
    private function is_yoast_active()
    {
        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Using WordPress core filter
        $active_plugins = apply_filters('active_plugins', get_option('active_plugins'));
        foreach ($active_plugins as $plugin) {
            if (strpos($plugin, 'wp-seo') !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if All in One SEO is active
     */
    private function is_all_in_one_seo_active()
    {
        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Using WordPress core filter
        $active_plugins = apply_filters('active_plugins', get_option('active_plugins'));
        foreach ($active_plugins as $plugin) {
            if (strpos($plugin, 'all_in_one_seo_pack') !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Set Yoast SEO metadata
     */
    private function set_yoast_seo($post_id, $params)
    {
        if (!empty($params['post_meta_title'])) {
            update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($params['post_meta_title']));
        }
        if (!empty($params['post_meta_description'])) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($params['post_meta_description']));
        }
    }

    /**
     * Set All in One SEO metadata
     */
    private function set_all_in_one_seo($post_id, $params)
    {
        if (!empty($params['post_meta_title'])) {
            update_post_meta($post_id, '_aioseop_title', sanitize_text_field($params['post_meta_title']));
        }
        if (!empty($params['post_meta_description'])) {
            update_post_meta($post_id, '_aioseop_description', sanitize_text_field($params['post_meta_description']));
        }
        if (!empty($params['post_meta_url'])) {
            update_post_meta($post_id, '_wp_old_slug', sanitize_text_field($params['post_meta_url']));
        }
    }

    /**
     * Set post tags
     * 
     * @param WP_Post $post Post object
     * @param string $terms Comma-separated terms
     */
    private function set_post_tags($post, $terms)
    {
        if (is_string($terms)) {
            $terms = array_map('trim', explode(',', $terms));
        }

        $tags = array();
        foreach ($terms as $term) {
            $term = sanitize_text_field($term);
            if (!empty($term)) {
                $tags[] = $term;
            }
        }

        if (!empty($tags)) {
            wp_set_post_tags($post->ID, $tags, true);
        }
    }

    /**
     * Get plugin data
     * 
     * @return array Plugin data
     */
    private function get_plugin_data()
    {
        if (!function_exists('get_plugin_data')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        $plugin_file = defined('CONTENTSTUDIO_PLUGIN_FILE') 
            ? CONTENTSTUDIO_PLUGIN_FILE 
            : dirname(__DIR__) . '/contentstudio-plugin.php';
        return get_plugin_data($plugin_file);
    }
}
