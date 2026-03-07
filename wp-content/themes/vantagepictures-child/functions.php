<?php
/**
 * Vantage Pictures Child Theme functions
 */

/**
 * Editor styles for iframed block editor – dark mode content (headings, paragraphs, etc.)
 * Loads inside the editor iframe via add_editor_style. Overrides :where(.editor-styles-wrapper) color:revert.
 */
add_action('after_setup_theme', function () {
  add_editor_style('assets/css/gutenberg-dark-editor-content.css');
}, 20);

add_action('wp_enqueue_scripts', function () {

    // Load parent theme stylesheet
    wp_enqueue_style(
        'vantagepictures-parent-style',
        get_template_directory_uri() . '/style.css',
        [],
        wp_get_theme(get_template())->get('Version')
    );

    // Load child theme stylesheet
    wp_enqueue_style(
        'vantagepictures-child-style',
        get_stylesheet_uri(),
        ['vantagepictures-parent-style'],
        wp_get_theme()->get('Version')
    );

}, 20);

/**
 * Enqueue Google Font (Poppins)
 * Loads global typography for the site (300 + 700 weights)
 * Add to: child theme functions.php
 */
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'vp-google-fonts',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@0,300;0,500;0,700;0,800;1,300;1,500;1,700;1,800&display=swap',
    [],
    null
  );
}, 20);

/**
 * VP: Enqueue Font Awesome 4.7.0 (matches live site icon class syntax: .fa .fa-*)
 */
function vp_enqueue_fontawesome_4() {
    wp_enqueue_style(
        'font-awesome-4',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
        array(),
        '4.7.0'
    );
}
add_action('wp_enqueue_scripts', 'vp_enqueue_fontawesome_4');

/**
 * Auto-add vp-section class to WP Bootstrap Blocks Container output
 * Ensures every Bootstrap "Container (Bootstrap)" block gets consistent vertical padding
 * without requiring manual classes in Gutenberg.
 * Add to: child theme functions.php
 */
add_filter('render_block', function ($block_content, $block) {

  // Front-end only
  if (is_admin() || empty($block['blockName']) || empty($block_content)) {
    return $block_content;
  }

  /**
   * WP Bootstrap Blocks block names can vary by plugin version.
   * We'll use a robust check:
   * - If it's their container block name, OR
   * - If the rendered HTML includes their known wrapper class "wp-bootstrap-blocks-container"
   */
  $is_wpbb_container =
    ($block['blockName'] === 'wp-bootstrap-blocks/container')
    || (strpos($block_content, 'wp-bootstrap-blocks-container') !== false);

  if (!$is_wpbb_container) {
    return $block_content;
  }

  // Avoid double-adding
  if (strpos($block_content, ' vp-section') !== false) {
    return $block_content;
  }

  // Inject vp-section into the first class="..." we find in this block
  // (WPBB container output starts with <div class="wp-bootstrap-blocks-container ...">)
  $block_content = preg_replace(
    '/class="([^"]*)"/',
    'class="$1 vp-section"',
    $block_content,
    1
  );

  return $block_content;

}, 10, 2);

/**
 * Gutenberg Block Editor Dark Mode
 * Matches uiXpress admin aesthetic. Loads in block editor + late on edit screens
 * so it overrides WordPress core and uiXpress.
 */
add_action('enqueue_block_editor_assets', function () {
  wp_enqueue_style(
    'vp-gutenberg-dark',
    get_stylesheet_directory_uri() . '/assets/css/gutenberg-dark.css',
    ['wp-edit-post'],
    wp_get_theme()->get('Version')
  );
  $critical = '
    .editor-header,.edit-post-header,.interface-interface-skeleton__header,.editor-document-bar,.admin-ui-page,.admin-ui-page__header{background:#0f0f11!important;border-bottom-color:#27272a!important;color:#fff!important}
    .editor-header *,.edit-post-header *,.interface-interface-skeleton__header *,.admin-ui-page__header *,.admin-ui-page *{color:#fff!important}
    .editor-header svg,.edit-post-header svg,.interface-interface-skeleton__header svg,.admin-ui-page__header svg{fill:#fff!important}
    .interface-complementary-area,.interface-complementary-area-header,.block-editor-tabbed-sidebar,.components-panel,.components-panel__body{background:#0f0f11!important;color:#fff!important}
    .interface-complementary-area *,.interface-complementary-area-header *,.components-panel *,.components-panel__body *,.block-editor-block-inspector *{color:#fff!important}
    .components-base-control label,.components-base-control__help,.acf-field label,.acf-label{color:#fff!important}
    .acf-field p.description{color:#a1a1aa!important}
  ';
  wp_add_inline_style('vp-gutenberg-dark', $critical);
}, 20);

add_action('admin_enqueue_scripts', function ($hook) {
  $edit_screens = ['post.php', 'post-new.php', 'site-editor.php', 'page.php', 'page-new.php'];
  if (!in_array($hook, $edit_screens, true)) {
    return;
  }
  wp_enqueue_style(
    'vp-gutenberg-dark-late',
    get_stylesheet_directory_uri() . '/assets/css/gutenberg-dark.css',
    [],
    wp_get_theme()->get('Version') . '-late'
  );
}, 9999);

/**
 * Critical Gutenberg dark overrides – injected in footer to load last.
 * Ensures top bar and text stay dark even if uiXpress/WordPress load later.
 */
add_action('admin_footer', function () {
  global $pagenow;
  $edit_pages = ['post.php', 'post-new.php', 'page.php', 'page-new.php', 'site-editor.php'];
  if (!in_array($pagenow ?? '', $edit_pages, true)) {
    return;
  }
  echo '<style id="vp-gutenberg-dark-critical">';
  /* Top bar – dark bg; single border on skeleton only (no partial borders) */
  echo '.editor-header,.edit-post-header,.editor-document-bar,.admin-ui-page__header,.editor-header__center,.editor-header__toolbar,.editor-header__settings{background:#0f0f11!important;border:none!important;box-shadow:none!important}';
  echo '.interface-interface-skeleton__header{border-bottom:1px solid #2e2e32!important}';
  /* Document title stays white; rest of toolbar uses main stylesheet secondary */
  echo '.editor-document-bar__post-title{color:#fff!important}';
  /* Editor content (iframe) – override load-styles.php revert */
  echo '.editor-styles-wrapper h1,.editor-styles-wrapper h2,.editor-styles-wrapper h3,.editor-styles-wrapper h4,.editor-styles-wrapper h5,.editor-styles-wrapper h6,.editor-styles-wrapper p,.editor-styles-wrapper li,.editor-styles-wrapper blockquote,.editor-styles-wrapper figcaption,.editor-styles-wrapper .block-editor-rich-text__editable,.editor-styles-wrapper .wp-block-heading,.editor-styles-wrapper .wp-block-paragraph{color:#fff!important}';
  /* Sidebar panels – background only; text hierarchy from main CSS */
  echo '.interface-interface-skeleton__sidebar,.interface-interface-skeleton__secondary-sidebar,.interface-complementary-area,.block-editor-tabbed-sidebar,.components-panel,.components-panel__body{background:#141416!important}';
  /* Icons – light fill/stroke */
  echo '.interface-interface-skeleton svg,.editor-header svg,.edit-post-header svg,.block-editor-block-toolbar svg,.block-editor-block-contextual-toolbar svg,.components-button svg,.interface-complementary-area svg,.components-panel svg,.block-editor-inserter__menu svg{fill:#fff!important;stroke:#fff!important;color:#fff!important}';
  echo '</style>';
}, 99999);

/**
 * WPBakery Content Migration Tool
 * One-time cleanup for posts built with WPBakery/Pheromone. Tools → VP WPBakery Migrate
 */
require_once get_stylesheet_directory() . '/inc/wpbakery-migrate.php';

/* ==========================================================================
   Portfolio System
   ==========================================================================

   Core helper functions for the Vantage Pictures portfolio system.

   This file supports the custom post type "portfolio" and its related
   taxonomies and templates. It provides standardized helper functions for
   retrieving portfolio metadata, rendering video embeds, displaying credits,
   and ensuring consistent title fallbacks across all portfolio views.

   Portfolio architecture
   ----------------------
   Post Type
     portfolio

   Taxonomies
     video-format   (Video Format)
     industry             (Industry)
     market               (Market)

   Key ACF Fields
     vimeo_link       Vimeo embed source
     long_title       Full video title (displayed beside player)
     header_title     Hero header title (top of single page)
     thumb_title      Title used in gallery thumbnails
     description      Video description under title

   Additional ACF Fields
     Extensive production credits stored as individual meta fields
     (client, director, dop, editor, etc). Rendering logic automatically
     suppresses empty fields.

   Helper Functions
   ----------------
     vp_portfolio_get()               Safe wrapper for ACF/meta retrieval
     vp_portfolio_header_title()      Hero title with fallback
     vp_portfolio_long_title()        Video title with fallback
     vp_portfolio_thumb_title()       Gallery thumbnail title with fallback
     vp_portfolio_credit_fields()     List of available credit roles
     vp_portfolio_render_credits()    Outputs formatted credits list

   Templates Using These Helpers
   -----------------------------
     single-portfolio.php
     template-parts/portfolio/card.php
     taxonomy-video-format.php
     taxonomy-industry.php
     taxonomy-market.php
     page-work.php
     homepage curated gallery

   Notes
   -----
   All templates should use these helpers instead of directly calling
   get_field() or get_post_meta() to ensure consistent fallback logic
   and avoid duplicated template code.

   ========================================================================== */

// ===== Portfolio field helpers =====

function vp_portfolio_get($key, $post_id = null) {
  $post_id = $post_id ?: get_the_ID();
  if (function_exists('get_field')) {
    return get_field($key, $post_id);
  }
  return get_post_meta($post_id, $key, true);
}

function vp_portfolio_header_title($post_id = null) {
  $t = trim((string) vp_portfolio_get('header_title', $post_id));
  return $t !== '' ? $t : get_the_title($post_id ?: get_the_ID());
}

function vp_portfolio_long_title($post_id = null) {
  $t = trim((string) vp_portfolio_get('long_title', $post_id));
  return $t !== '' ? $t : get_the_title($post_id ?: get_the_ID());
}

function vp_portfolio_thumb_title($post_id = null) {
  $t = trim((string) vp_portfolio_get('thumb_title', $post_id));
  return $t !== '' ? $t : get_the_title($post_id ?: get_the_ID());
}

function vp_portfolio_credit_fields() {
  return [
    'client' => 'Client',
    'agency' => 'Agency',
    'creative_director' => 'Creative Director',
    'agency_producer' => 'Agency Producer',
    'production_company' => 'Production Company',
    'exec_producer' => 'Executive Producer',
    'production_service' => 'Production Services',
    'director' => 'Director',
    'dir_assist' => "Director's Assistant",
    'hop' => 'Head of Production',
    'producer' => 'Producer',
    'line_producer' => 'Line Producer',
    'assistant_producer' => 'Assistant Producer',
    '1st_ad' => '1st AD',
    '2nd_ad' => '2nd AD',
    'production_manager' => 'Production Manager',
    'assistant_production_manager' => 'Assistant Production Manager',
    'production_coordinator' => 'Production Coordinator',
    'production_assist' => 'Production Assistant',
    'chaperone' => 'Client Chaperone',
    'product_tech' => 'Product Technician',
    'translator' => 'Translator',
    'dop' => 'DOP',
    'camera_op' => 'Camera Operator',
    '1st_ac' => '1st AC',
    '2nd_ac' => '2nd AC',
    'focus' => 'Focus Puller',
    'camera_asst' => 'Camera Assistants',
    'dit' => 'DIT',
    'live-stream_tech' => 'Live-Stream Technician',
    'steadicam' => 'Steadicam Operator',
    'moco' => 'Motion Control',
    'drone_op' => 'Drone Operator',
    'gaffer' => 'Gaffer',
    'key_grip' => 'Key Grip',
    'bbg' => 'Best Boy Grip',
    'grip' => 'Grips',
    'bbe' => 'Best Boy Electric',
    'electric' => 'Electricians',
    'ge' => 'Grip & Lighting',
    'rental_house' => 'Rental House',
    'sound_engineer' => 'Sound Engineer',
    'production_designer' => 'Production Designer',
    'art_director' => 'Art Director',
    'propsmaster' => 'Props Master',
    'art_assist' => 'Art Assistants',
    'food_stylist' => 'Food Stylist',
    'wardrobe' => 'Wardrobe',
    'wardrobe_assistant' => 'Wardrobe Assistant',
    'makeup' => 'Make-up Artist',
    'hair_stylist' => 'Hair Stylist',
    'talent' => 'Talent',
    'casting_director' => 'Casting Director',
    'casting' => 'Casting Manager',
    'stunt_coordinator' => 'Stunt Coordinator',
    'dance_choreographer' => 'Dance Choreographer',
    'sfx_technician' => 'SFX Technician',
    'locations' => 'Location Manager',
    'photographer' => 'Photographer',
    'photo_assist' => 'Photography Assistant',
    'animal_wrangler' => 'Animal Wrangler',
    'bts' => 'Behind the Scenes',
    'catering' => 'Catering',
    'drivers' => 'Drivers',
    'medic' => 'Medic',
    'storyboards' => 'Storyboard Artist',
    'post_house' => 'Post House',
    'post_producer' => 'Post Supervisor',
    'editor' => 'Editor',
    'edit_assist' => 'Assistant Editor',
    'colorist' => 'Colorist',
    'sound_design' => 'Sound Mix & Design',
    'music' => 'Music',
    'vfx_sup' => 'VFX Supervisor',
    '3d' => '3D Animation',
    'vfx' => 'VFX',
    'mgfx' => 'Motion Graphic Artist',
    'account_manager' => 'Account Manager',
  ];
}

function vp_portfolio_render_credits($post_id = null) {
  $post_id = $post_id ?: get_the_ID();
  $fields = vp_portfolio_credit_fields();

  $rows = [];
  foreach ($fields as $key => $label) {
    $val = trim((string) vp_portfolio_get($key, $post_id));
    if ($val !== '') {
      $rows[] = ['label' => $label, 'value' => $val];
    }
  }

  if (!$rows) return;

  echo '<div class="vp-credits">';
  echo '<dl class="vp-credits__list">';
  foreach ($rows as $r) {
    echo '<dt>' . esc_html($r['label']) . '</dt>';
    echo '<dd>' . wp_kses($r['value'], [
      'a'      => ['href' => true, 'title' => true, 'target' => true, 'rel' => true],
      'br'     => [],
      'strong' => [],
      'b'      => [],
      'em'     => [],
      'i'      => [],
      'span'   => ['class' => true],
    ]) . '</dd>';
  }
  echo '</dl>';
  echo '</div>';
}

// ===== Portfolio next/prev navigation =====

/**
 * Get adjacent portfolio posts, optionally constrained to a taxonomy.
 *
 * @param string $direction 'prev' or 'next'
 * @param string|null $taxonomy Limit to same term in this taxonomy (e.g. 'video-format'), or null for any.
 * @return WP_Post|null
 */
function vp_portfolio_adjacent($direction = 'prev', $taxonomy = 'video-format') {
  if (get_post_type() !== 'portfolio') return null;

  $current_id = get_the_ID();
  $tax_query = [];

  // Optional: constrain to same taxonomy term(s)
  if ($taxonomy) {
    $terms = wp_get_post_terms($current_id, $taxonomy, ['fields' => 'ids']);
    if (!is_wp_error($terms) && !empty($terms)) {
      $tax_query[] = [
        'taxonomy' => $taxonomy,
        'field' => 'term_id',
        'terms' => $terms,
      ];
    }
  }

  // Hide-from-public logic (apply on public pages only)
  $meta_query = [];
  $is_internal = is_page('work-internal'); // if you ever render single from internal context, ignore this
  if (!$is_internal) {
    $meta_query = [
      'relation' => 'OR',
      ['key' => 'hide_from_public', 'compare' => 'NOT EXISTS'],
      ['key' => 'hide_from_public', 'value' => '1', 'compare' => '!='],
    ];
  }

  $args = [
    'post_type' => 'portfolio',
    'posts_per_page' => 1,
    'post_status' => 'publish',
    'orderby' => 'date',
    'order' => ($direction === 'prev') ? 'DESC' : 'ASC',
    'date_query' => [
      [
        ($direction === 'prev') ? 'before' : 'after' => get_the_date('Y-m-d H:i:s', $current_id),
        'inclusive' => false,
      ],
    ],
    'tax_query' => $tax_query,
  ];

  if (!empty($meta_query)) {
    $args['meta_query'] = $meta_query;
  }

  $q = new WP_Query($args);
  return ($q->have_posts()) ? $q->posts[0] : null;
}

require_once get_stylesheet_directory() . '/inc/portfolio-query.php';
require_once get_stylesheet_directory() . '/inc/portfolio-filters.php';
require_once get_stylesheet_directory() . '/inc/portfolio-load-more.php';

/**
 * Portfolio Infinite Scroll Script
 *
 * Loads the lazy-load / infinite scroll JS on Work pages only.
 */

add_action('wp_enqueue_scripts', function () {

  // Use page slugs (reliable for custom page-*.php templates)
  if (is_page('work') || is_page('work-internal')) {

    wp_enqueue_script(
      'vp-portfolio-load-more',
      get_stylesheet_directory_uri() . '/assets/js/portfolio-load-more.js',
      [],
      '1.0.0',
      true
    );

    wp_localize_script('vp-portfolio-load-more', 'vpLoadMore', [
      'ajaxUrl' => admin_url('admin-ajax.php'),
      'nonce'   => wp_create_nonce('vp_portfolio_load_more'),
    ]);
  }

});

require_once get_stylesheet_directory() . '/inc/shortcodes/portfolio-gallery.php';

add_filter('manage_portfolio_posts_columns', function($cols){
  $cols['post_id'] = 'ID';
  return $cols;
});

add_action('manage_portfolio_posts_custom_column', function($col, $post_id){
  if ($col === 'post_id') {
    echo $post_id;
  }
}, 10, 2);

add_action('init', function() {

  wp_register_script(
    'vp-portfolio-gallery-block',
    get_stylesheet_directory_uri() . '/inc/blocks/portfolio-gallery/index.js',
    ['wp-blocks','wp-element','wp-block-editor','wp-components','wp-api-fetch'],
    null,
    true
  );

  register_block_type(
    get_stylesheet_directory() . '/inc/blocks/portfolio-gallery'
  );

});

add_filter('render_block_vp/portfolio-gallery', function($content, $block){

  $a = isset($block['attrs']) ? $block['attrs'] : [];

  // Convert ids array -> comma-separated string for shortcode
  if (isset($a['ids']) && is_array($a['ids'])) {
    $a['ids'] = implode(',', array_map('intval', $a['ids']));
  }

  $shortcode = '[vp_portfolio_gallery';

  foreach ($a as $k => $v) {
    if ($v === '' || $v === null) continue;

    // Basic sanitization for shortcode attrs
    $k = sanitize_key($k);
    $v = is_scalar($v) ? (string) $v : '';

    if ($v === '') continue;

    $shortcode .= ' ' . $k . '="' . esc_attr($v) . '"';
  }

  $shortcode .= ']';

  return do_shortcode($shortcode);

}, 10, 2);

/**
 * Auto-add vp-outline to any <span> that has no class inside specific ACF fields.
 */
function vp_inject_outline_class_into_spans($value, $post_id, $field) {
  if (empty($value) || !is_string($value)) return $value;

  // Only touch spans that DO NOT already have a class attribute.
  // Also preserves any other attributes like style=, id=, etc.
  $value = preg_replace(
    '/<span(?![^>]*\bclass=)([^>]*)>/i',
    '<span class="vp-outline"$1>',
    $value
  );

  return $value;
}

// Target your exact ACF field names:
add_filter('acf/format_value/name=long_title', 'vp_inject_outline_class_into_spans', 10, 3);
add_filter('acf/format_value/name=header_title', 'vp_inject_outline_class_into_spans', 10, 3);

/**
 * Register a selectable Gutenberg Block Style for the core Gallery block
 * Adds "VP Masonry (No gutters)" in the Gallery block's Styles panel
 */
add_action('init', function () {
  if (function_exists('register_block_style')) {
    register_block_style('core/gallery', [
      'name'  => 'vp-masonry',
      'label' => 'VP Masonry (No gutters)',
    ]);
  }
});