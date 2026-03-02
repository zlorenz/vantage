<?php
/* ======================================= */
/* Pheromone Theme Functions */
/* ======================================= */
if (!isset($content_width)) $content_width = 1140; /* pixels */

/* Makes theme available for translation. */
add_action('after_setup_theme', 'pheromone_theme_setup');
function pheromone_theme_setup()
{

  load_theme_textdomain('pheromone', get_template_directory() . '/language');
}

/*=======================================
  TGM Plugins Activations
=======================================*/
require_once get_template_directory() . '/framework/functions/tgma/class-tgm-plugin-activation.php';
add_action('tgmpa_register', 'pheromone_register_required_plugins');
function pheromone_register_required_plugins()
{

  $plugins = array(

    array(
      'name'               => 'Kirki Customizer', // The plugin name
      'slug'               => 'kirki', // The plugin slug (typically the folder name)
      'required'           => true, // If false, the plugin is only 'recommended' instead of required
      'force_activation'   => true, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
      'force_deactivation' => true, // If true, plugin is deactivated upon theme activation and cannot be deactivated until theme switch
    ),
    array(
      'name'               => 'WPBakery Page Builder', // The plugin name
      'slug'               => 'js_composer', // The plugin slug (typically the folder name)
      'source'             => 'js_composer.zip',
      'required'           => true, // If false, the plugin is only 'recommended' instead of required
      'version'            => '6.5',
      'force_activation'   => false, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
      'force_deactivation' => false, // If true, plugin is deactivated upon theme activation and cannot be deactivated until theme switch
    ),

    array(
      'name'               => 'Pheromone Shortcodes', // The plugin name
      'slug'               => 'pheromone-shortcodes', // The plugin slug (typically the folder name)
      'source'             => 'pheromone-shortcodes.zip', // The plugin source
      'required'           => true, // If false, the plugin is only 'recommended' instead of required
      'version'            => '1.1.2', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
      'force_activation'   => true, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
      'force_deactivation' => true, // If true, plugin is deactivated upon theme activation and cannot be deactivated until theme switch
    ),

    array(
      'name'               => 'Pheromone Portfolio', // The plugin name
      'slug'               => 'pheromone-portfolio', // The plugin slug (typically the folder name)
      'source'             => 'pheromone-portfolio.zip', // The plugin source
      'required'           => true, // If false, the plugin is only 'recommended' instead of required
      'version'            => '1.0.2', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
      'force_activation'   => true, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
      'force_deactivation' => true, // If true, plugin is deactivated upon theme activation and cannot be deactivated until theme switch
    ),

    array(
      'name'               => 'Pheromone Testimonials', // The plugin name
      'slug'               => 'pheromone-testimonials', // The plugin slug (typically the folder name)
      'source'             => 'pheromone-testimonials.zip', // The plugin source
      'required'           => true, // If false, the plugin is only 'recommended' instead of required
      'version'            => '1.0.0', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
      'force_activation'   => true, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
      'force_deactivation' => true, // If true, plugin is deactivated upon theme activation and cannot be deactivated until theme switch
    ),

    array(
      'name'               => 'Pheromone Widgets', // The plugin name
      'slug'               => 'pheromone-widgets', // The plugin slug (typically the folder name)
      'source'             => 'pheromone-widgets.zip', // The plugin source
      'required'           => true, // If false, the plugin is only 'recommended' instead of required
      'version'            => '1.0.5', // E.g. 1.0.0. If set, the active plugin must be this version or higher, otherwise a notice is presented
      'force_activation'   => true, // If true, plugin is activated upon theme activation and cannot be deactivated until theme switch
      'force_deactivation' => true, // If true, plugin is deactivated upon theme activation and cannot be deactivated until theme switch
    ),

    array(
      'name'            => 'Contact Form 7', // The plugin name
      'slug'            => 'contact-form-7', // The plugin slug (typically the folder name)
      'required'        => false, // If false, the plugin is only 'recommended' instead of required
    ),

    array(
      'name'            => 'Searche Exclude', // The plugin name
      'slug'            => 'search-exclude', // The plugin slug (typically the folder name)
      'required'        => false, // If false, the plugin is only 'recommended' instead of required
    ),

  );

  $config = array(
    'id'           => 'pheromone',                 // Unique ID for hashing notices for multiple instances of TGMPA.
    'default_path' => dirname(__FILE__) . '/framework/functions/tgma/plugins/',
    'menu'         => 'tgmpa-install-plugins',
    'parent_slug'  => 'themes.php',
    'capability'   => 'edit_theme_options',
    'has_notices'  => true,
    'dismissable'  => true,
    'dismiss_msg'  => '',
    'is_automatic' => true,
    'message'      => '',
  );

  tgmpa($plugins, $config);
}

class PheromoneTheme_VC
{


  public function __construct()
  {

    // set hooks
    add_action('vc_before_init', array($this, 'set_vc_as_bundled'));
    add_action('vc_build_admin_page', array($this, 'remove_vc_core_widgets'));
    add_action('vc_load_shortcode', array($this, 'remove_vc_core_widgets'));
    remove_action('admin_init', 'vc_page_welcome_redirect');
    remove_action('vc_activation_hook', 'vc_page_welcome_set_redirect');
  }


  /**
   * Setup VC as "bundled with theme"
   */
  public function set_vc_as_bundled()
  {
    if (function_exists('vc_manager')) {
      vc_manager()->disableUpdater(true);
      vc_manager()->setIsAsTheme(true);
    }
    vc_set_as_theme();
  }


  /**
   * Remove rude VC built-in elements
   */
  public function remove_vc_core_widgets()
  {
    vc_remove_element('vc_gallery');
    vc_remove_element('vc_images_carousel');
    vc_remove_element('vc_cta');
    vc_remove_element('vc_posts_slider');
  }
}
new PheromoneTheme_VC();


/*-----------------------------------------------------------------------------------*/
/*	Pheromone Includes
/*-----------------------------------------------------------------------------------*/

include(get_template_directory() . '/framework/functions/theme-options.php');
include(get_template_directory() . '/framework/functions/sidebars.php');
if (class_exists('WooCommerce')) {
  include(get_template_directory() . '/framework/functions/woocommerce.php');
};


/*-----------------------------------------------------------------------------------*/
/*  Pheromone Image Size
/*-----------------------------------------------------------------------------------*/


add_image_size('pheromone_shop_main', 690, 810, true);
add_image_size('pheromone_shop_single', 555, 650, true);
add_image_size('pheromone_shop_thumbnail', 104, 122, true);


/*-----------------------------------------------------------------------------------*/
/*	Pheromone Register menu
/*-----------------------------------------------------------------------------------*/

if (!function_exists('pheromone_register_menu')) {
  function pheromone_register_menu()
  {
    register_nav_menus(
      array(
        'menu' => esc_html__('Main Menu', 'pheromone'),
        'onepage-menu' => esc_html__('One Page Menu', 'pheromone')
      )
    );
  }
  add_action('init', 'pheromone_register_menu');
}

/*
|--------------------------------------------------------------------------
| Pheromone Audio Function
|--------------------------------------------------------------------------
*/

if (!function_exists('pheromone_audio')) {
  function pheromone_audio($postid)
  {

    $single_audio_item = get_post_meta($postid, 'pheromone_external_audio_block', true);

    if (($single_audio_item != '')) {
      if (strpos($single_audio_item, 'soundcloud')) {

        $id = $single_audio_item;

        echo '<div class="post-audio"> ' . $id . ' </div>';
      }
    }
  }
}


/*
|--------------------------------------------------------------------------
| Pheromone Video Function
|--------------------------------------------------------------------------
*/

if (!function_exists('pheromone_video')) {
  function pheromone_video($postid)
  {

    $single_video_item = get_post_meta($postid, 'pheromone_external_video_block', true);

    echo '<div class="post-video">' . $single_video_item . '</div>';
  }
}

/*
|--------------------------------------------------------------------------
| Pheromone Gallery function
|--------------------------------------------------------------------------
*/

if (!function_exists('pheromone_gallery')) {
  function pheromone_gallery($postid)
  {

    $gallery_images = get_post_meta($postid, 'pheromone_gallery_block', true);

    if (!empty($gallery_images)) {

      echo '<div class="owl-carousel gallery-slider" id="gs-' . $postid . '">';

      foreach ($gallery_images as $gallery_item) {
        $item_url = $gallery_item['pheromone_gallery_post'];

        echo  '<img src="' . $item_url['url'] . '" class="img-responsive">';
      }

      echo  '</div>';
    }
  }
}


/*
|--------------------------------------------------------------------------
| Pheromone More Remove
|--------------------------------------------------------------------------
*/

add_filter('the_content_more_link', 'pheromone_modify_read_more_link');
function pheromone_modify_read_more_link()
{
  return '';
};

/*
|--------------------------------------------------------------------------
| Remove more link function
|--------------------------------------------------------------------------
*/

function pheromone_excerpt_more($more)
{
  return '...';
}
add_filter('excerpt_more', 'pheromone_excerpt_more');

if (is_singular() && comments_open() && get_option('thread_comments'))
  wp_enqueue_script('comment-reply');

/*
|--------------------------------------------------------------------------
| Theme Stylesheets
|--------------------------------------------------------------------------
*/

function pheromone_scripts_styles()
{
  $theme_info = wp_get_theme();
  wp_enqueue_style('bootstrap', get_template_directory_uri() . '/assets/css/bootstrap.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('pheromone-fonts', pheromone_fonts_url(), array(), null);
  wp_enqueue_style('pheromone-style', get_stylesheet_uri(), array(), $theme_info->get('Version'));
  wp_enqueue_style('pheromone-style-css', get_template_directory_uri() . '/assets/css/theme-style.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('fontawesome-icons', get_template_directory_uri() . '/assets/css/font-awesome.min.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('ionicons-icons', get_template_directory_uri() . '/assets/css/ionicons.min.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('owl-carousel', get_template_directory_uri() . '/assets/css/owl.carousel.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('swipebox', get_template_directory_uri() . '/assets/css/swipebox.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('animate', get_template_directory_uri() . '/assets/css/animate.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('pheromone-woocommerce', get_template_directory_uri() . '/assets/css/woocommerce.css', array(), $theme_info->get('Version'));
  wp_enqueue_style('pheromone-responsive', get_template_directory_uri() . '/assets/css/responsive.css', array(), $theme_info->get('Version'));

  $color = get_theme_mod('header_color_image');
  if ($color) {
    $custom_skin_css =
      ".intro-body:before { background: $color}\n" .
      ".tag_line_image .tag-body:before { background: $color}";
    wp_add_inline_style('pheromone-responsive', "/* Custom CSS */\n $custom_skin_css");
  }

  $site_color = get_theme_mod('site_colors');
  if ($site_color) {
    $custom_color_css =
      ".scroll-top { background-color: $site_color}\n" .
      ".navbar-nav ul.sm-nowrap .current-menu-ancestor > a  { color: $site_color}\n" .
      ".share-class a.active-menu { color: $site_color !important}\n" .
      ".navbar-nav ul.sm-nowrap .current-menu-ancestor li.current-menu-item a { color: $site_color}\n" .
      ".navbar-nav ul.sm-nowrap li.current-menu-item > a { color: $site_color}\n" .
      ".burger_pheromone_menu_overlay_normal .burger_pheromone_main_menu .current-menu-parent > a, .burger_pheromone_menu_overlay_normal .burger_pheromone_main_menu .current-page-parent > a, .burger_pheromone_menu_overlay_normal .burger_pheromone_main_menu .current_page_parent > a { color: $site_color}\n" .
      ".burger_pheromone_menu_overlay_normal .burger_pheromone_main_menu li.menu-item-has-children > a.sub-active { color: $site_color}\n" .
      ".burger_pheromone_menu_overlay_normal li.current-menu-item > a,.burger_pheromone_menu_overlay_normal li.current-page-item > a { color: $site_color}\n" .
      ".menu-transparent .navbar.top-nav-collapse .nav > li > a.active-menu { color: $site_color !important;}\n" .
      "#status { background: $site_color}";
    wp_add_inline_style('pheromone-responsive', "$custom_color_css");
  }

  $color_text = get_theme_mod('header_color_image_title', '#ffffff');
  if ($color_text) {
    $custom_skin_css_text =
      ".intro-body h1,.intro-body h2,.intro-body h3,.intro-body h4,.intro-body h5,.intro-body h6 { color: $color_text}\n" .
      ".tag-body h1,.tag-body h2,.tag-body h3,.tag-body h4,.tag-body h5,.tag-body h6 { color: $color_text}\n" .
      ".breadcrumbs, .breadcrumbs a, .breadcrumbs span { color: $color_text}\n" .
      ".menu-transparent .navbar .nav > li > a { color: $color_text}\n" .
      ".tag_line_image .tag_line_author, .tag_line_image .tag_line_author a { color: $color_text}\n" .
      ".tag_line_image .tag_line_date { color: $color_text}\n" .
      ".intro-body .icon-big { color: $color_text}";
    wp_add_inline_style('pheromone-responsive', "$custom_skin_css_text \n/* Custom CSS END */");
  }
}
add_action('wp_enqueue_scripts', 'pheromone_scripts_styles', 90);






/*
|--------------------------------------------------------------------------
| Theme Scripts
|--------------------------------------------------------------------------
*/
if (!function_exists('pheromone_load_scripts')) {
  function pheromone_load_scripts()
  {

    $theme_info = wp_get_theme();

    wp_enqueue_script('bootstrap', get_template_directory_uri() . '/assets/js/bootstrap.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('viewportchecker', get_template_directory_uri() . '/assets/js/viewportchecker.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('fitvids',  get_template_directory_uri() . '/assets/js/jquery.fitvids.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('smartmenus', get_template_directory_uri() . '/assets/js/jquery.smartmenus.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('wow', get_template_directory_uri() . '/assets/js/wow.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('swipebox', get_template_directory_uri() . '/assets/js/jquery.swipebox.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('modernizr', get_template_directory_uri() . '/assets/js/modernizr.custom.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('isotope-custom', get_template_directory_uri() . '/assets/js/isotope.pkgd.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('easing', get_template_directory_uri() . '/assets/js/jquery.easing.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('waypoints', get_template_directory_uri() . '/assets/js/jquery.waypoints.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('imagesloaded', get_template_directory_uri() . '/assets/js/jquery.waitforimages.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('PageScroll2id', get_template_directory_uri() . '/assets/js/jquery.malihu.PageScroll2id.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('countdown', get_template_directory_uri() . '/assets/js/jquery.countdown.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('owl-carousel', get_template_directory_uri() . '/assets/js/owl.carousel.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('retina',  get_template_directory_uri() . '/assets/js/retina.min.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('pheromone-responsive', get_template_directory_uri() . '/assets/js/responsive.js', array('jquery'), $theme_info->get('Version'), true);
    wp_enqueue_script('pheromone-main', get_template_directory_uri() . '/assets/js/main.js', array('jquery'), $theme_info->get('Version'), true);
    if (is_singular() && comments_open()) {
      wp_enqueue_script('comment-reply');
    }
  };
};
add_action('wp_enqueue_scripts', 'pheromone_load_scripts');


function equip_admin()
{
  $theme_info = wp_get_theme();
  wp_enqueue_style('pheromone-admin-styles', get_template_directory_uri() . '/assets/css/admin/styles.css', array(), $theme_info->get('Version'));
};
add_action('admin_enqueue_scripts', 'equip_admin', 10000);



/*
|--------------------------------------------------------------------------
| Pheromone page menu
|--------------------------------------------------------------------------
*/

function pheromone_page_menu_args($args)
{
  if (!isset($args['show_home']))
    $args['show_home'] = true;
  return $args;
}
add_filter('wp_page_menu_args', 'pheromone_page_menu_args');

/*
|--------------------------------------------------------------------------
| Pheromone content navigation
|--------------------------------------------------------------------------
*/

if (!function_exists('pheromone_content_nav')) :

  function pheromone_content_nav($html_id)
  {
    global $wp_query;

    if ($wp_query->max_num_pages > 1) : ?>
      <nav id="<?php echo esc_attr($html_id) ?>" class="navigation" role="navigation">
        <div class="nav-previous"><?php next_posts_link('<span class="meta-nav">&larr;</span>' . esc_html__('Older posts', 'pheromone')); ?></div>
        <div class="nav-next"><?php previous_posts_link(esc_html__('Newer posts', 'pheromone') . '<span class="meta-nav">&rarr;</span>'); ?></div>
      </nav>
      <?php endif;
  }
endif;


/*
|--------------------------------------------------------------------------
| Pheromone comments
|--------------------------------------------------------------------------
*/

if (!function_exists('pheromone_comment')) :
  function pheromone_comment($comment, $args, $depth)
  {
    $GLOBALS['comment'] = $comment;
    switch ($comment->comment_type):
      case 'pingback':
      case 'trackback':
      ?>
        <li <?php comment_class(); ?> id="comment-<?php comment_ID(); ?>">
          <p><?php esc_html_e('Pingback:', 'pheromone'); ?> <?php comment_author_link(); ?> <?php edit_comment_link(esc_html__('Edit', 'pheromone'), '<span class="edit-link">', '</span>'); ?></p>
        <?php
        break;
      default:
        global $post;
        ?>
        <li <?php comment_class(); ?> id="li-comment-<?php comment_ID(); ?>">
          <article id="comment-<?php comment_ID(); ?>" class="comment">
            <header class="comment-meta comment-author vcard">
              <?php
              echo get_avatar($comment, 75);
              printf(
                '<div class="author-card">%1$s</div>',
                get_comment_author_link(),
                ($comment->user_id === $post->post_author) ? '<span>' . esc_html__('Post author', 'pheromone') . '</span>' : ''
              );
              printf(
                '<div class="comment-time">%3$s</div>',
                esc_url(get_comment_link($comment->comment_ID)),
                get_comment_time('c'),
                sprintf(esc_html__('%1$s at %2$s', 'pheromone'), get_comment_date(), get_comment_time())
              );
              ?>
            </header>

            <?php if ('0' == $comment->comment_approved) : ?>
              <p class="comment-awaiting-moderation"><?php esc_html_e('Your comment is awaiting moderation.', 'pheromone'); ?></p>
            <?php endif; ?>

            <section class="comment-content comment">
              <?php comment_text(); ?>
              <?php edit_comment_link(esc_html__('Edit', 'pheromone'), '<div class="edit-link">', '</div>'); ?>
              <div class="reply">
                <?php comment_reply_link(array_merge($args, array('reply_text' => esc_html__('Reply', 'pheromone'), 'after' => '', 'depth' => $depth, 'max_depth' => $args['max_depth']))); ?>
              </div><!-- .reply -->
            </section><!-- .comment-content -->
          </article><!-- #comment-## -->
  <?php
        break;
    endswitch; // end comment_type check
  }
endif;

function pheromone_is_blog()
{
  global $post;
  $posttype = get_post_type($post);
  return (($posttype == 'post') && (is_home() || is_single() || is_archive() || is_category() || is_tag() || is_author())) ? true : false;
}

function pheromone_fix_blog_link_on_cpt($classes, $item, $args)
{
  if (!pheromone_is_blog()) {
    $blog_page_id = intval(get_option('page_for_posts'));
    if ($blog_page_id != 0 && $item->object_id == $blog_page_id)
      unset($classes[array_search('current_page_parent', $classes)]);
  }
  return $classes;
}
add_filter('nav_menu_css_class', 'pheromone_fix_blog_link_on_cpt', 10, 3);
/*
|--------------------------------------------------------------------------
| Pheromone post types and functions
|--------------------------------------------------------------------------
*/

function pheromone_setup()
{
  add_theme_support('automatic-feed-links');
  add_theme_support("title-tag");
  add_theme_support('post-formats', array('image', 'link', 'quote', 'video', 'audio', 'gallery'));
  add_theme_support('post-thumbnails');
  add_theme_support('woocommerce');
  set_post_thumbnail_size(680, 9999); // Unlimited height, soft crop
}

add_action('after_setup_theme', 'pheromone_setup');




// post by views functionality
function pheromone_set_post_views($postID)
{
  $count_key = 'pheromone_post_views_count';
  $count = get_post_meta($postID, $count_key, true);
  if ($count == '') {
    $count = 0;
    delete_post_meta($postID, $count_key);
    add_post_meta($postID, $count_key, '0');
  } else {
    $count++;
    update_post_meta($postID, $count_key, $count);
  }
}

function pheromone_track_post_views($post_id)
{
  if (!is_single()) return;
  if (empty($post_id)) {
    global $post;
    $post_id = $post->ID;
  }
  pheromone_set_post_views($post_id);
}
add_action('wp_head', 'pheromone_track_post_views');

function pheromone_get_post_views($postID)
{
  $count_key = 'pheromone_post_views_count';
  $count = get_post_meta($postID, $count_key, true);
  if ($count == '') {
    delete_post_meta($postID, $count_key);
    add_post_meta($postID, $count_key, '0');
    return "0";
  }
  return $count;
}

/*-----------------------------------------------------------------------------------*/
/*  Add fullscreen check box to Featured Image 
/*-----------------------------------------------------------------------------------*/



function pheromone_featured_image_fullscreen($content)
{
  global $post;
  $text = esc_html__('Fullscreen (only with Template: Visual Composer)', 'pheromone');
  $id = 'featured_image_full';
  $value = esc_attr(get_post_meta($post->ID, $id, true));
  $label = '<label for="' . $id . '" class="selectit"><input name="' . $id . '" type="checkbox" id="' . $id . '" value="' . $value . ' "' . checked($value, 1, false) . '> ' . $text . '</label>';
  return $content .= $label;
}

add_filter('admin_post_thumbnail_html', 'pheromone_featured_image_fullscreen');


function pheromone_save_featured_image_fullscreen($post_id, $post, $update)
{

  $value = 0;
  if (isset($_REQUEST['featured_image_full'])) {
    $value = 1;
  }
  // Set meta value to either 1 or 0
  update_post_meta($post_id, 'featured_image_full', $value);
}
add_action('save_post', 'pheromone_save_featured_image_fullscreen', 10, 3);

function pheromone_body_classes($classes)
{
  global $post;
  if (is_page()) {
    $id = 'featured_image_full';
    if (get_post_meta($post->ID, $id, true)) {
      $classes[] = 'fullscreen';
    }
    return $classes;
  } elseif (is_404()) {
    $classes[] = 'fullscreen error404';
    return $classes;
  } elseif (is_admin_bar_showing()) {
    $classes[] = 'admin-bar';
    return $classes;
  }
  return $classes;
};
add_filter('body_class', 'pheromone_body_classes');

/*-----------------------------------------------------------------------------------*/
/*  Connect Google Fonts
/*-----------------------------------------------------------------------------------*/


function pheromone_fonts_url()
{
  $fonts_url = '';

  $open_sans = _x('on', 'Open Sans font: on or off', 'pheromone');
  $kanit = _x('on', 'Kanit font: on or off', 'pheromone');
  $great_vibes = _x('on', 'Great Vibes font: on or off', 'pheromone');

  if ('off' !== $open_sans || 'off' !== $kanit || 'off' !== $great_vibes) {
    $font_families = array();

    if ('off' !== $open_sans) {
      $font_families[] = 'Open Sans:400,300,600,700,800';
    }

    if ('off' !== $kanit) {
      $font_families[] = 'Kanit:400,200,100,300,500,600,700,800,900';
    }

    if ('off' !== $great_vibes) {
      $font_families[] = 'Great Vibes';
    }

    $query_args = array(
      'family' => urlencode(implode('|', $font_families)),
      'subset' => urlencode('latin,latin-ext'),
    );

    $fonts_url = add_query_arg($query_args, 'https://fonts.googleapis.com/css');
  }

  return esc_url_raw($fonts_url);
}
/*-----------------------------------------------------------------------------------*/
/*	Other Functions
/*-----------------------------------------------------------------------------------*/

add_filter('wp_list_categories', 'pheromone_add_span_cat_count');
function pheromone_add_span_cat_count($links)
{
  $links = str_replace('(', '<span class="pheromone_cat_count">', $links);
  $links = str_replace(')', '</span>', $links);
  return $links;
}

if (get_theme_mod('pheromone_menu_select') == 'onepage') {
  function pheromone_add_classes_a($atts, $item, $args)
  {
    $class = 'page-scroll';
    $atts['class'] = $class;
    return $atts;
  }
  add_filter('nav_menu_link_attributes', 'pheromone_add_classes_a', 10, 3);
};

function pheromone_MenuFallback($args)
{
  echo '<ul id="menu-all-pages" class="nav navbar-nav"><li id="menu-item-968" class="menu-item menu-item-type-custom menu-item-object-custom current-menu-item current_page_item menu-item-home menu-item-968"><a href="' . get_home_url() . '">' . esc_html__('Home', 'pheromone') . '</a></li>
</ul>';
}

class Pheromone_My_Walker_Nav_Menu extends Walker_Nav_Menu
{
  function start_lvl(&$output, $depth = 0, $args = array())
  {
    $indent = str_repeat("\t", $depth);
    $output .= "\n$indent<ul class=\"dropdown-menu\">\n";
  }
}

/*
 * Allows excerpt field on all pages
 */
add_post_type_support( 'page', 'excerpt' );

/*
 * Function for page duplication. Dups appear as drafts. User is redirected to the edit screen.
 */
function rd_duplicate_post_as_draft(){
  global $wpdb;
  if (! ( isset( $_GET['post']) || isset( $_POST['post'])  || ( isset($_REQUEST['action']) && 'rd_duplicate_post_as_draft' == $_REQUEST['action'] ) ) ) {
    wp_die('No post to duplicate has been supplied!');
  }
  /*
   * Nonce verification
   */
  if ( !isset( $_GET['duplicate_nonce'] ) || !wp_verify_nonce( $_GET['duplicate_nonce'], basename( __FILE__ ) ) )
    return;
  /*
   * get the original post id
   */
  $post_id = (isset($_GET['post']) ? absint( $_GET['post'] ) : absint( $_POST['post'] ) );
  /*
   * and all the original post data then
   */
  $post = get_post( $post_id );
  /*
   * if you don't want current user to be the new post author,
   * then change next couple of lines to this: $new_post_author = $post->post_author;
   */
  $current_user = wp_get_current_user();
  $new_post_author = $current_user->ID;
  /*
   * if post data exists, create the post duplicate
   */
  if (isset( $post ) && $post != null) {
    /*
     * new post data array
     */
    $args = array(
      'comment_status' => $post->comment_status,
      'ping_status'    => $post->ping_status,
      'post_author'    => $new_post_author,
      'post_content'   => $post->post_content,
      'post_excerpt'   => $post->post_excerpt,
      'post_name'      => $post->post_name,
      'post_parent'    => $post->post_parent,
      'post_password'  => $post->post_password,
      'post_status'    => 'draft',
      'post_title'     => $post->post_title,
      'post_type'      => $post->post_type,
      'to_ping'        => $post->to_ping,
      'menu_order'     => $post->menu_order
    );
    /*
     * insert the post by wp_insert_post() function
     */
    $new_post_id = wp_insert_post( $args );
    /*
     * get all current post terms ad set them to the new post draft
     */
    $taxonomies = get_object_taxonomies($post->post_type); // returns array of taxonomy names for post type, ex array("category", "post_tag");
    foreach ($taxonomies as $taxonomy) {
      $post_terms = wp_get_object_terms($post_id, $taxonomy, array('fields' => 'slugs'));
      wp_set_object_terms($new_post_id, $post_terms, $taxonomy, false);
    }
    /*
     * duplicate all post meta just in two SQL queries
     */
    $post_meta_infos = $wpdb->get_results("SELECT meta_key, meta_value FROM $wpdb->postmeta WHERE post_id=$post_id");
    if (count($post_meta_infos)!=0) {
      $sql_query = "INSERT INTO $wpdb->postmeta (post_id, meta_key, meta_value) ";
      foreach ($post_meta_infos as $meta_info) {
        $meta_key = $meta_info->meta_key;
        if( $meta_key == '_wp_old_slug' ) continue;
        $meta_value = addslashes($meta_info->meta_value);
        $sql_query_sel[]= "SELECT $new_post_id, '$meta_key', '$meta_value'";
      }
      $sql_query.= implode(" UNION ALL ", $sql_query_sel);
      $wpdb->query($sql_query);
    }
    /*
     * finally, redirect to the edit post screen for the new draft
     */
    wp_redirect( admin_url( 'post.php?action=edit&post=' . $new_post_id ) );
    exit;
  } else {
    wp_die('Post creation failed, could not find original post: ' . $post_id);
  }
}
add_action( 'admin_action_rd_duplicate_post_as_draft', 'rd_duplicate_post_as_draft' );
/*
 * Add the duplicate link to action list for post_row_actions
 */
function rd_duplicate_post_link( $actions, $post ) {
  if (current_user_can('edit_posts')) {
    $actions['duplicate'] = '<a href="' . wp_nonce_url('admin.php?action=rd_duplicate_post_as_draft&post=' . $post->ID, basename(__FILE__), 'duplicate_nonce' ) . '" title="Duplicate this item" rel="permalink">Duplicate</a>';
  }
  return $actions;
}
add_filter('page_row_actions', 'rd_duplicate_post_link', 10, 2);

// Remove auto p from Contact Form 7 shortcode output
add_filter('wpcf7_autop_or_not', 'wpcf7_autop_return_false');
function wpcf7_autop_return_false() {
    return false;
}

add_action('admin_head', 'my_admin_column_width');
function my_admin_column_width() {
    echo '<style type="text/css">
        .column-title { text-align: left; width:18% !important; overflow:hidden }
        .column-author { text-align: left; width:6% !important; overflow:hidden }
        .column-categories { text-align: left; width:6% !important; overflow:hidden }
        .column-tags { text-align: left; width:6% !important; overflow:hidden }
        .column-date { text-align: left; width:12% !important; overflow:hidden }
        .column-wps_post_id { text-align: left; width:6% !important; overflow:hidden }
    </style>';
}

/**
 * Portfolio taxonomy archives: show ALL portfolio items
 * Applies to: Video Format (portfolio-category), Industry (industry), Market (market)
 */
function vantage_show_all_portfolio_on_tax_archives($query) {
  if (is_admin() || !$query->is_main_query()) return;

  if (is_tax(array('portfolio-category', 'industry', 'market'))) {
    $query->set('post_type', array('portfolio'));
    $query->set('posts_per_page', -1);   // show all
    $query->set('no_found_rows', true);  // small perf win (no pagination counts)
  }
}
add_action('pre_get_posts', 'vantage_show_all_portfolio_on_tax_archives', 50);

add_action('template_redirect', function () {
  ob_start(function ($html) {
    // remove <style id="kirki-inline-styles">...</style>
    return preg_replace('#<style[^>]*id=("|\')kirki-inline-styles\1[^>]*>.*?</style>#is', '', $html);
  });
}, 0);

/**
 * -------------------------------------------------------------
 * VANTAGE PICTURES – PORTFOLIO TAXONOMY STRUCTURE
 * -------------------------------------------------------------
 * Adds two custom taxonomies to the Portfolio post type:
 *
 * 1) Industry  – Used to classify projects by sector
 *    (Consumer Tech, AI & Robotics, Drones, Automotive, etc.)
 *
 * 2) Market    – Used to classify projects by client region
 *    (China, Vietnam, USA, Singapore, etc.)
 *
 * Portfolio Categories remain reserved for Video Format:
 * (Brand Films, Commercial Spots, Product Videos, Branded Documentaries)
 *
 * Registered to post type: 'portfolio'
 * Archive URLs:
 *   /industry/{term}/
 *   /market/{term}/
 *
 * NOTE:
 * If taxonomy conflicts occur, rename slugs to:
 *   portfolio_industry
 *   portfolio_market
 * -------------------------------------------------------------
 */

function vantage_register_portfolio_taxonomies() {

  // -------- Industry Taxonomy --------
  $industry_labels = array(
    'name' => 'Industries',
    'singular_name' => 'Industry',
    'search_items' => 'Search Industries',
    'all_items' => 'All Industries',
    'edit_item' => 'Edit Industry',
    'update_item' => 'Update Industry',
    'add_new_item' => 'Add New Industry',
    'new_item_name' => 'New Industry Name',
    'menu_name' => 'Industries',
  );

  $industry_args = array(
    'public' => true,
    'show_ui' => true,
    'show_admin_column' => true,
    'show_in_rest' => true,
    'hierarchical' => true, // set true if you want parent/child
    'labels' => $industry_labels,
    'rewrite' => array('slug' => 'industry', 'with_front' => false),
  );

  register_taxonomy('industry', array('portfolio'), $industry_args);

  // -------- Market Taxonomy --------
  $market_labels = array(
    'name' => 'Markets',
    'singular_name' => 'Market',
    'search_items' => 'Search Markets',
    'all_items' => 'All Markets',
    'edit_item' => 'Edit Market',
    'update_item' => 'Update Market',
    'add_new_item' => 'Add New Market',
    'new_item_name' => 'New Market Name',
    'menu_name' => 'Markets',
  );

  $market_args = array(
    'public' => true,
    'show_ui' => true,
    'show_admin_column' => true,
    'show_in_rest' => true,
    'hierarchical' => true,
    'labels' => $market_labels,
    'rewrite' => array('slug' => 'market', 'with_front' => false),
  );

  register_taxonomy('market', array('portfolio'), $market_args);
}
add_action('init', 'vantage_register_portfolio_taxonomies', 20);

/**
 * Rename Portfolio Categories to "Video Format"
 * (UI label change only – does not affect taxonomy slug)
 */
function vantage_rename_portfolio_categories_labels() {
    global $wp_taxonomies;

    if (isset($wp_taxonomies['portfolio-category'])) {

        $labels = &$wp_taxonomies['portfolio-category']->labels;

        $labels->name = 'Video Formats';
        $labels->singular_name = 'Video Format';
        $labels->menu_name = 'Video Format';
        $labels->all_items = 'All Video Formats';
        $labels->edit_item = 'Edit Video Format';
        $labels->view_item = 'View Video Format';
        $labels->update_item = 'Update Video Format';
        $labels->add_new_item = 'Add New Video Format';
        $labels->new_item_name = 'New Video Format Name';
        $labels->search_items = 'Search Video Formats';
        $labels->popular_items = 'Popular Video Formats';
    }
}
add_action('init', 'vantage_rename_portfolio_categories_labels', 100);

/**
 * Admin list table: add "Video Format" column for Portfolio items
 * Taxonomy slug: portfolio-category
 * Post type: portfolio
 */

// 1) Add the column
function vantage_portfolio_add_video_format_column($columns) {
  // Insert after Title if possible
  $new = array();
  foreach ($columns as $key => $label) {
    $new[$key] = $label;
    if ($key === 'title') {
      $new['video_format'] = 'Video Format';
    }
  }
  // Fallback if Title wasn't found
  if (!isset($new['video_format'])) {
    $new['video_format'] = 'Video Format';
  }
  return $new;
}
add_filter('manage_portfolio_posts_columns', 'vantage_portfolio_add_video_format_column', 20);

// 2) Fill the column values
function vantage_portfolio_render_video_format_column($column, $post_id) {
  if ($column !== 'video_format') return;

  $terms = get_the_terms($post_id, 'portfolio-category');

  if (is_wp_error($terms) || empty($terms)) {
    echo '—';
    return;
  }

  $out = array();
  foreach ($terms as $term) {
    $out[] = esc_html($term->name);
  }
  echo implode(', ', $out);
}
add_action('manage_portfolio_posts_custom_column', 'vantage_portfolio_render_video_format_column', 10, 2);

// (Optional) Make it sortable
function vantage_portfolio_make_video_format_sortable($columns) {
  $columns['video_format'] = 'video_format';
  return $columns;
}
add_filter('manage_edit-portfolio_sortable_columns', 'vantage_portfolio_make_video_format_sortable');

function vantage_portfolio_video_format_orderby($query) {
  if (!is_admin() || !$query->is_main_query()) return;

  $orderby = $query->get('orderby');
  if ($orderby !== 'video_format') return;

  // Sort by term name via a join is complex; simplest is disable custom sorting logic.
  // This placeholder prevents unexpected behavior.
}
add_action('pre_get_posts', 'vantage_portfolio_video_format_orderby');

/**
 * Admin filters: "Uncategorized" for Video Format, Industries, Markets
 * Applies to Portfolio list table (post_type=portfolio)
 *
 * Video Format taxonomy: portfolio-category
 * Industries taxonomy:   industry
 * Markets taxonomy:      market
 */

function vantage_portfolio_add_uncategorized_filters() {
  global $typenow;

  if ($typenow !== 'portfolio') return;

  $filters = array(
    'vf_filter'       => array('label' => 'Video Format', 'taxonomy' => 'portfolio-category'),
    'industry_filter' => array('label' => 'Industries',   'taxonomy' => 'industry'),
    'market_filter'   => array('label' => 'Markets',      'taxonomy' => 'market'),
  );

  foreach ($filters as $param => $cfg) {
    $selected = isset($_GET[$param]) ? sanitize_text_field($_GET[$param]) : '';

    echo '<select name="' . esc_attr($param) . '" style="margin-right:6px;">';
    echo '<option value="">' . esc_html('All ' . $cfg['label']) . '</option>';
    echo '<option value="__uncategorized__"' . selected($selected, '__uncategorized__', false) . '>' . esc_html('Uncategorized') . '</option>';
    echo '</select>';
  }
}
add_action('restrict_manage_posts', 'vantage_portfolio_add_uncategorized_filters', 30);

function vantage_portfolio_apply_uncategorized_filters($query) {
  global $pagenow;

  if (!is_admin() || $pagenow !== 'edit.php') return;
  if (!$query->is_main_query()) return;

  $post_type = isset($_GET['post_type']) ? sanitize_text_field($_GET['post_type']) : '';
  if ($post_type !== 'portfolio') return;

  $map = array(
    'vf_filter'       => 'portfolio-category',
    'industry_filter' => 'industry',
    'market_filter'   => 'market',
  );

  $tax_query = (array) $query->get('tax_query');

  foreach ($map as $param => $taxonomy) {
    if (isset($_GET[$param]) && $_GET[$param] === '__uncategorized__') {

      // If the user also used the native taxonomy query var (e.g. &industry=ai-robotics),
      // remove it so our NOT EXISTS rule isn't fighting a term filter.
      $query->set($taxonomy, '');

      $tax_query[] = array(
        'taxonomy' => $taxonomy,
        'operator' => 'NOT EXISTS',
      );
    }
  }

  if (!empty($tax_query)) {
    $query->set('tax_query', $tax_query);
  }
}
add_action('pre_get_posts', 'vantage_portfolio_apply_uncategorized_filters', 30);

/**
 * VANTAGE: Custom CollectionPage schema for Portfolio taxonomies
 * - Disables SASWP JSON-LD output on portfolio-category / industry / market taxonomy archives
 * - Injects our own JSON-LD CollectionPage + ItemList built from WP term + portfolio posts
 */

/**
 * Helper: detect AJAX or REST context (prevents breaking VC/WPBakery AJAX responses)
 */
if (!function_exists('vp_is_ajax_or_rest')) {
  function vp_is_ajax_or_rest() {
    // WP AJAX
    if (defined('DOING_AJAX') && DOING_AJAX) return true;

    // WP REST API
    if (defined('REST_REQUEST') && REST_REQUEST) return true;

    // Sometimes REST isn't flagged early; this is a safe fallback
    if (!empty($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) return true;

    return false;
  }
}

/**
 * Helper: detect our portfolio taxonomy archives
 */
if (!function_exists('vp_is_portfolio_tax_archive')) {
  function vp_is_portfolio_tax_archive() {
    return is_tax(array('portfolio-category', 'industry', 'market'));
  }
}

/**
 * Build and output CollectionPage schema for portfolio taxonomy archives.
 */
if (!function_exists('vp_output_portfolio_tax_collectionpage_schema')) {
  function vp_output_portfolio_tax_collectionpage_schema() {
    // Never output schema during AJAX/REST (breaks VC Grid / WPBakery AJAX)
    if (vp_is_ajax_or_rest()) return;

    // Prevent accidental double-output (e.g., duplicate includes / hooks)
    static $did_output = false;
    if ($did_output) return;
    $did_output = true;

    if (!vp_is_portfolio_tax_archive()) return;

    $term = get_queried_object();
    if (!$term || empty($term->taxonomy) || empty($term->term_id)) return;

    $term_id   = (int) $term->term_id;
    $taxonomy  = sanitize_key($term->taxonomy);

    $term_url  = get_term_link($term);
    if (is_wp_error($term_url)) return;

    $term_name = !empty($term->name) ? $term->name : single_term_title('', false);

    // term_description() returns HTML; keep schema description clean
    $desc_html = term_description($term_id, $taxonomy);
    $desc_text = trim(wp_strip_all_tags($desc_html));
    if ($desc_text === '') {
      // fallback to WP's archive description if term description is empty
      $desc_text = trim(wp_strip_all_tags(get_the_archive_description()));
    }

    $tax_obj   = get_taxonomy($taxonomy);

    // ----- Breadcrumb builder (supports hierarchical taxonomies like Industry) -----
    $home_url      = home_url('/');
    $portfolio_url = home_url('/portfolio/'); // adjust if needed

    $crumbs = array(
      array(
        '@type'    => 'ListItem',
        'position' => 1,
        'name'     => 'Home',
        'item'     => array('@type' => 'WebPage', '@id' => $home_url),
      ),
      array(
        '@type'    => 'ListItem',
        'position' => 2,
        'name'     => 'Portfolio',
        'item'     => array('@type' => 'WebPage', '@id' => $portfolio_url),
      ),
    );

    // If hierarchical taxonomy, insert ancestor terms (root -> parent)
    if ($tax_obj && !empty($tax_obj->hierarchical)) {
      $ancestors = get_ancestors($term_id, $taxonomy);

      if (!empty($ancestors)) {
        $ancestors = array_reverse($ancestors);

        foreach ($ancestors as $ancestor_id) {
          $ancestor = get_term($ancestor_id, $taxonomy);
          if (is_wp_error($ancestor) || empty($ancestor->name)) continue;

          $ancestor_link = get_term_link($ancestor);
          if (is_wp_error($ancestor_link)) continue;

          $crumbs[] = array(
            '@type'    => 'ListItem',
            'position' => 0, // temporary; renumber below
            'name'     => $ancestor->name,
            'item'     => array(
              '@type' => 'WebPage',
              '@id'   => trailingslashit($ancestor_link) . '#webpage',
            ),
          );
        }
      }
    }

    // Current term (always last)
    $crumbs[] = array(
      '@type'    => 'ListItem',
      'position' => 0, // temporary; renumber below
      'name'     => $term_name,
      'item'     => array(
        '@type' => 'WebPage',
        '@id'   => trailingslashit($term_url) . '#webpage',
      ),
    );

    // Renumber positions cleanly
    $pos = 1;
    foreach ($crumbs as &$c) { $c['position'] = $pos++; }
    unset($c);
    // ----- End breadcrumb builder -----

    // Include child terms automatically for hierarchical taxonomies (like Industry parent "Tech")
    $include_children = ($tax_obj && !empty($tax_obj->hierarchical)) ? true : false;

    // Query portfolio posts in this term.
    $q = new WP_Query(array(
      'post_type'           => array('portfolio'),
      'posts_per_page'      => 30,       // keep JSON-LD lightweight; still set numberOfItems to real count
      'no_found_rows'       => false,    // we want found_posts for numberOfItems
      'ignore_sticky_posts' => true,
      'orderby'             => 'date',
      'order'               => 'DESC',
      'tax_query'           => array(
        array(
          'taxonomy'         => $taxonomy,
          'field'            => 'term_id',
          'terms'            => array($term_id),
          'include_children' => $include_children,
        )
      ),
    ));

    $items = array();
    if (!empty($q->posts)) {
      $pos = 1;
      foreach ($q->posts as $p) {
        $items[] = array(
          '@type'    => 'ListItem',
          'position' => $pos++,
          'item'     => array(
            '@type' => 'CreativeWork',
            '@id'   => get_permalink($p),
            'name'  => get_the_title($p),
          ),
        );
      }
    }

    $schema = array(
      '@context'    => 'https://schema.org',
      '@type'       => 'CollectionPage',
      '@id'         => trailingslashit($term_url) . '#CollectionPage',
      'url'         => $term_url,
      'name'        => $term_name,
      'headline'    => $term_name,
      'description' => $desc_text,
      'inLanguage'  => 'en',
      'isPartOf'    => array(
        '@type' => 'WebSite',
        '@id'   => 'https://vantage.pictures/#website',
      ),
      'publisher'   => array(
        '@type' => 'Organization',
        '@id'   => 'https://vantage.pictures/#Organization',
      ),
      'mainEntityOfPage' => array(
        '@type' => 'WebPage',
        '@id'   => trailingslashit($term_url) . '#webpage',
      ),
      'breadcrumb' => array(
        '@type' => 'BreadcrumbList',
        'itemListElement' => $crumbs,
      ),
      'mainEntity'  => array(
        '@type'           => 'ItemList',
        'name'            => $term_name,
        'itemListOrder'   => 'https://schema.org/ItemListOrderUnordered',
        'numberOfItems'   => (int) $q->found_posts,
        'itemListElement' => $items,
      ),
    );

    // Add a taxonomy-specific "about" that stays accurate automatically
    if ($taxonomy === 'market') {
      $schema['about'] = array('@type' => 'Place', 'name' => $term_name);
    } elseif ($taxonomy === 'industry') {
      $schema['about'] = array(
        '@type' => 'DefinedTerm',
        'name'  => $term_name,
        'inDefinedTermSet' => 'Industries',
      );
    } elseif ($taxonomy === 'portfolio-category') {
      $schema['about'] = array('@type' => 'Service', 'name' => $term_name . ' production');
    }

    // Output JSON-LD
    echo "\n" . '<script type="application/ld+json">' .
      wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) .
      '</script>' . "\n";

    wp_reset_postdata();
  }

  // Output late in wp_head
  add_action('wp_head', 'vp_output_portfolio_tax_collectionpage_schema', 99);
}

/**
 * VANTAGE: Strip SASWP JSON-LD on portfolio taxonomy archives (guaranteed)
 * Removes <script type="application/ld+json"> blocks that contain "saswp"
 * Only runs on: portfolio-category, industry, market archives.
 */
if (!function_exists('vp_strip_saswp_jsonld_on_portfolio_tax_archives')) {

  add_action('template_redirect', function () {
    if (is_admin()) return;

    // Never buffer/strip during AJAX/REST (breaks VC/WPBakery AJAX responses)
    if (vp_is_ajax_or_rest()) return;

    if (!vp_is_portfolio_tax_archive()) return;

    // Start output buffering so we can remove SASWP JSON-LD regardless of how/when it outputs
    ob_start('vp_strip_saswp_jsonld_on_portfolio_tax_archives');
  }, 0);

  function vp_strip_saswp_jsonld_on_portfolio_tax_archives($html) {
    if (!is_string($html) || $html === '') return $html;

    // Quick check before regex
    if (stripos($html, 'saswp') === false) return $html;

    $pattern = '#<script[^>]+type=["\']application/ld\+json["\'][^>]*>.*?saswp.*?</script>\s*#is';
    return preg_replace($pattern, '', $html);
  }
}