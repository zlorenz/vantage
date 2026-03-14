<?php
/**
 * Vantage Pictures Child Theme functions
 */

/**
 * Single post entry meta for child template: date only (no time), no author.
 * Used by content-single.php in place of parent's vantagepictures_article_posted_on().
 */
function vp_single_posted_on() {
	$date_only = get_the_date();
	printf(
		wp_kses_post( __( '<span class="sep">Posted on </span><a href="%1$s" title="%2$s" rel="bookmark"><time class="entry-date" datetime="%3$s">%4$s</time></a>', 'vantagepictures' ) ),
		esc_url( get_permalink() ),
		esc_attr( $date_only ),
		esc_attr( get_the_date( 'c' ) ),
		esc_html( $date_only )
	);
}

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

    // File block overrides – after child style so our .btn-primary + H3 filename win
    wp_enqueue_style(
        'vp-file-block',
        get_stylesheet_directory_uri() . '/assets/css/file-block.css',
        ['vantagepictures-child-style'],
        wp_get_theme()->get('Version')
    );

    // Video Campaign Brief form – dark theme integration (scoped to .video-campaign-brief-form)
    wp_enqueue_style(
        'vp-video-campaign-brief-form',
        get_stylesheet_directory_uri() . '/assets/css/video-campaign-brief-form.css',
        ['vantagepictures-child-style'],
        wp_get_theme()->get('Version')
    );

    // Mobile navbar: reliable dropdown toggling when collapsed (≤768px).
    wp_enqueue_script(
        'vp-mobile-nav',
        get_stylesheet_directory_uri() . '/assets/js/vp-mobile-nav.js',
        array(),
        wp_get_theme()->get('Version'),
        true
    );

}, 30);

// Ensure child stylesheet only loads once by removing any auto-enqueued theme style handle.
add_action('wp_enqueue_scripts', function () {
  wp_dequeue_style('style');
  wp_deregister_style('style');
  wp_dequeue_style('style-css');
  wp_deregister_style('style-css');
}, 100);

/**
 * Gravity Forms: Disable built-in theme framework CSS for Form ID 1 only.
 *
 * Gravity Forms 2.5+ uses the Theme Framework (e.g. Orbital) which enqueues its own CSS files
 * (including `gravity-forms-theme-framework.min.css`). The `gform_disable_form_theme_css` filter
 * only disables the older `gform_theme` stylesheet and does not affect the Orbital framework.
 *
 * For the Video Campaign Brief (Form ID 1), we explicitly dequeue the Theme Framework styles
 * after Gravity Forms enqueues assets, so our scoped stylesheet can fully control presentation.
 *
 * Docs:
 * - https://docs.gravityforms.com/gform_disable_form_theme_css/
 * - https://docs.gravityforms.com/gform_disable_form_legacy_css/
 */
add_action( 'gform_enqueue_scripts_1', function ( $form, $ajax ) {
	// Theme Framework (Orbital) styles.
	wp_dequeue_style( 'gravity_forms_theme_framework' );
	wp_dequeue_style( 'gravity_forms_theme_foundation' );
	wp_dequeue_style( 'gravity_forms_theme_reset' );
	wp_dequeue_style( 'gravity_forms_orbital_theme' );

	// Legacy theme handles (harmless if not enqueued).
	wp_dequeue_style( 'gform_theme' );

	// Move/format the validation summary for this form only.
	wp_enqueue_script(
		'vp-gf-brief-validation-placement',
		get_stylesheet_directory_uri() . '/assets/js/gf-brief-validation-placement.js',
		array(),
		wp_get_theme()->get( 'Version' ),
		true
	);
}, 20, 2 );

/**
 * Gravity Forms: apply the briefing form front-end class to ALL forms.
 *
 * The Video Campaign Brief styles are scoped to the wrapper class
 * `video-campaign-brief-form_wrapper`. To make those styles universal for
 * every Gravity Form on the site, we automatically append that CSS class
 * to the form's `cssClass` setting for all forms at render time.
 *
 * This keeps the CSS file unchanged while ensuring new forms inherit the
 * same styling without manual configuration.
 */
function vp_gf_apply_brief_wrapper_class( $form ) {
	$extra_class = 'video-campaign-brief-form_wrapper';
	$current     = rgar( $form, 'cssClass' );

	// Avoid duplicates when a form is already using this CSS class.
	if ( is_string( $current ) && strpos( ' ' . $current . ' ', ' ' . $extra_class . ' ' ) !== false ) {
		return $form;
	}

	$form['cssClass'] = trim( $current . ' ' . $extra_class );

	return $form;
}

add_filter( 'gform_pre_render', 'vp_gf_apply_brief_wrapper_class', 10, 1 );
add_filter( 'gform_pre_validation', 'vp_gf_apply_brief_wrapper_class', 10, 1 );
add_filter( 'gform_pre_submission_filter', 'vp_gf_apply_brief_wrapper_class', 10, 1 );
add_filter( 'gform_admin_pre_render', 'vp_gf_apply_brief_wrapper_class', 10, 1 );

/**
 * Enqueue Google Font (Poppins)
 * Loads global typography for the site using the full Poppins family
 * (100–900, normal + italic), matching the live site's font delivery.
 */
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'vp-google-fonts',
    'https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i&display=swap',
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
  global $pagenow;
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

/* Global admin dark normalization – tokens + base surfaces */
add_action('admin_enqueue_scripts', function () {
  wp_enqueue_style(
    'vp-admin-global-dark',
    get_stylesheet_directory_uri() . '/assets/css/admin-global-dark.css',
    [],
    wp_get_theme()->get('Version')
  );
}, 20);

add_action('admin_enqueue_scripts', function ($hook) {
  $edit_screens = ['post.php', 'post-new.php', 'page.php', 'page-new.php'];
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

/* ACF Pro admin dark mode – Field Groups, Post Types, Taxonomies, Options, Tools, Updates */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $is_acf = $screen && (strpos($screen->id, 'acf') !== false || (!empty($screen->post_type) && strpos($screen->post_type, 'acf') !== false));
  if ($is_acf) {
    wp_enqueue_style(
      'vp-acf-admin-dark',
      get_stylesheet_directory_uri() . '/assets/css/acf-admin-dark.css',
      array( 'acf-global', 'common' ), // Load after ACF and WP common so Tools .postbox .inside overrides win
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* Yoast SEO admin dark mode – Dashboard, Task list, Settings, Tools, etc. */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $is_yoast = $screen && (strpos($screen->id, 'wpseo') !== false || strpos($screen->id, 'yoast') !== false);
  if ($is_yoast) {
    wp_enqueue_style(
      'vp-yoast-admin-dark',
      get_stylesheet_directory_uri() . '/assets/css/yoast-admin-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* Gravity Forms admin dark mode – Forms, Entries, Settings, Form editor, Add-ons, etc. */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $is_gf = $screen && (strpos($screen->id, 'gf_') !== false || strpos($screen->id, 'forms_page') !== false);
  if ($is_gf) {
    wp_enqueue_style(
      'vp-gf-admin-dark',
      get_stylesheet_directory_uri() . '/assets/css/gf-admin-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* Menu editor dark mode – Appearance → Menus (nav-menus.php) */
add_action('admin_enqueue_scripts', function ($hook) {
  if ($hook === 'nav-menus.php') {
    wp_enqueue_style(
      'vp-admin-menus-dark',
      get_stylesheet_directory_uri() . '/assets/css/admin-menus-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* Admin dark mode – Tools, Import, Site Health, Yoast SEO Support */
add_action('admin_enqueue_scripts', function ($hook) {
  $load = false;
  if (in_array($hook, ['tools.php', 'import.php', 'tools_page_import', 'site-health.php'], true)) {
    $load = true;
  } else {
    $screen = get_current_screen();
    if ($screen && (strpos($screen->id, 'wpseo') !== false || strpos($screen->id, 'yoast') !== false)) {
      $load = true;
    }
  }
  if ($load) {
    wp_enqueue_style(
      'vp-admin-tools-health-yoast-dark',
      get_stylesheet_directory_uri() . '/assets/css/admin-tools-health-yoast-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* Users admin dark mode – Profile, Add New User, Edit User */
add_action('admin_enqueue_scripts', function ($hook) {
  if (in_array($hook, ['profile.php', 'user-new.php', 'user-edit.php'], true)) {
    wp_enqueue_style(
      'vp-admin-users-dark',
      get_stylesheet_directory_uri() . '/assets/css/admin-users-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* TranslatePress admin dark mode – Settings, Language Switcher, Addons, License, etc. */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $is_trp = $screen && (strpos($screen->id, 'trp') !== false || strpos($screen->id, 'translate') !== false);
  if ($is_trp) {
    wp_enqueue_style(
      'vp-trp-admin-dark',
      get_stylesheet_directory_uri() . '/assets/css/trp-admin-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* WPvivid Backup admin dark mode – Dashboard, Manual Backup, Export/Import, Schedule, etc. */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $is_wpvivid = $screen && strpos($screen->id, 'wpvivid') !== false;
  if ($is_wpvivid) {
    wp_enqueue_style(
      'vp-wpvivid-admin-dark',
      get_stylesheet_directory_uri() . '/assets/css/wpvivid-admin-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* SiteGround Optimizer admin dark mode – Speed & Security SPAs */
add_action('admin_enqueue_scripts', function ($hook) {
  $screen = get_current_screen();
  $page = isset($_GET['page']) ? (string) $_GET['page'] : '';

  $is_sg_optimizer = ($screen && (
      strpos($screen->id, 'sg-cachepress') !== false
      || strpos($screen->id, 'sg-security') !== false
      || strpos($screen->id, 'security-optimizer') !== false
    ))
    || (strpos($page, 'sgo_') === 0)
    || ($page === 'sg-security')
    || in_array($page, ['site-security', 'login-settings', 'activity-log', 'post-hack-actions'], true);

  if ($is_sg_optimizer) {
    wp_enqueue_style(
      'vp-sg-optimizer-admin-dark',
      get_stylesheet_directory_uri() . '/assets/css/sg-optimizer-admin-dark.css',
      [],
      wp_get_theme()->get('Version')
    );
  }
}, 9999);

/* TranslatePress translation editor sidebar dark mode – front-end (live translator) */
add_action('wp_enqueue_scripts', function () {
  if (!is_user_logged_in()) {
    return;
  }
  wp_enqueue_style(
    'vp-trp-admin-dark',
    get_stylesheet_directory_uri() . '/assets/css/trp-admin-dark.css',
    [],
    wp_get_theme()->get('Version')
  );
}, 9999);

/**
 * Critical Gutenberg dark overrides – injected in footer to load last.
 * Ensures top bar and text stay dark even if uiXpress/WordPress load later.
 */
add_action('admin_footer', function () {
  global $pagenow;
  $edit_pages = ['post.php', 'post-new.php', 'page.php', 'page-new.php'];
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
 * ACF + Tools: global includes.
 * - WPBakery migration tools
 * - Portfolio credits migration
 * - Page hero visibility field group
 * - Global contact modal options
 */
require_once get_stylesheet_directory() . '/inc/wpbakery-migrate.php';
require_once get_stylesheet_directory() . '/inc/wpbakery-migrate-portfolio-videos.php';
require_once get_stylesheet_directory() . '/inc/portfolio-credits-migrate.php';
require_once get_stylesheet_directory() . '/inc/acf-page-hero.php';
require_once get_stylesheet_directory() . '/inc/acf-contact-modal.php';

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
   vp_portfolio_credits_config()           Department config (labels, fields, repeaters)
   vp_portfolio_credits_get_department()  Gather credits for one department
   vp_portfolio_credits_get_all_departments()  Gather all populated departments
   vp_portfolio_render_credits()          Outputs credits grouped by department

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

/**
 * Portfolio credits: department configuration.
 * Defines labels and field mappings for the department-based credits system.
 *
 * @return array[] Each item: 'key', 'label', 'fields' => [slug=>label], 'repeater' => slug
 */
function vp_portfolio_credits_config() {
	return [
		'production' => [
			'label'    => 'Production',
			'fields'   => [
				'prod_brand'               => 'Brand',
				'prod_agency'              => 'Agency',
				'prod_production_company'  => 'Production Company',
				'prod_production_service'  => 'Production Service',
				'prod_executive_producer'  => 'EP',
				'prod_director'            => 'Director',
				'prod_producer'            => 'Producer',
				'prod_line_producer'       => 'Line Producer',
				'prod_production_manager'  => 'Production Manager',
				'prod_production_coordinator' => 'Production Coordinator',
				'prod_1st_ad'              => '1st AD',
				'prod_2nd_ad'              => '2nd AD',
				'prod_production_assistant' => 'PA',
				'prod_product_technician'  => 'Product Technician',
				'prod_account_manager'     => 'Account Manager',
				'prod_transport'          => 'Transport',
				'prod_chaperone'           => 'Chaperone',
				'prod_bts'                 => 'BTS',
			],
			'repeater' => 'prod_additional',
		],
		'camera' => [
			'label'    => 'Camera',
			'fields'   => [
				'cam_dop'           => 'DOP',
				'cam_camera_op'     => 'Camera Op',
				'cam_steadicam_op'   => 'Steadicam Op',
				'cam_1st_ac'        => '1st AC',
				'cam_2nd_ac'        => '2nd AC',
				'cam_focus_puller'  => 'Focus Puller',
				'cam_dit'           => 'DIT',
				'cam_qtake'         => 'QTake',
				'cam_drone_op'      => 'Drone Op',
				'cam_motion_control' => 'Motion Control',
			],
			'repeater' => 'cam_additional',
		],
		'ge' => [
			'label'    => 'G&E',
			'fields'   => [
				'ge_rental_house' => 'Rental House',
				'ge_gaffer'       => 'Gaffer',
				'ge_key_grip'     => 'Key Grip',
				'ge_grip'         => 'Grip',
				'ge_electrician'  => 'Electrician',
			],
			'repeater' => 'ge_additional',
		],
		'art' => [
			'label'    => 'Art',
			'fields'   => [
				'art_production_designer' => 'Production Designer',
				'art_art_director'        => 'Art Director',
				'art_art_assistant'       => 'Art Assistant',
				'art_props_master'         => 'Props Master',
				'art_wardrobe'             => 'Wardrobe',
				'art_hair_makeup'          => 'Hair & Makeup',
				'art_location_manager'     => 'Location Manager',
				'art_storyboard_artist'     => 'Storyboards',
			],
			'repeater' => 'art_additional',
		],
		'casting' => [
			'label'    => 'Casting',
			'fields'   => [
				'cast_casting_director'  => 'Casting Director',
				'cast_casting_manager'   => 'Casting Manager',
				'cast_talent'            => 'Talent',
				'cast_stunt_coordinator' => 'Stunt Coordinator',
				'cast_choreographer'     => 'Choreographer',
				'cast_animal_wrangler'   => 'Animal Wrangler',
			],
			'repeater' => 'cast_additional',
		],
		'stills' => [
			'label'    => 'Stills',
			'fields'   => [
				'stills_photographer'         => 'Photographer',
				'stills_photography_producer' => 'Photography Producer',
				'stills_kv_art_director'      => 'KV Art Director',
				'stills_photography_assistant' => 'Photography Assistant',
				'stills_photo_talent'         => 'Photo Talent',
			],
			'repeater' => 'stills_additional',
		],
		'post' => [
			'label'    => 'Post',
			'fields'   => [
				'post_post_supervisor'  => 'Post Supervisor',
				'post_on_set_editor'   => 'On-Set Editor',
				'post_editor'          => 'Editor',
				'post_assistant_editor' => 'Assistant Editors',
				'post_colorist'        => 'Colorist',
				'post_sound_design_mix' => 'Sound Design & Mix',
				'post_composer'        => 'Composer',
				'post_voice_over'      => 'Voice Over',
				'post_vfx'             => 'VFX',
				'post_online'          => 'Online',
				'post_3d_animation'     => '3D Animation',
			],
			'repeater' => 'post_additional',
		],
	];
}

/**
 * Pluralize a role label when names contain multiple entries (comma-separated).
 *
 * @param string $role  Singular role label.
 * @param string $names Comma-separated names value.
 * @return string Singular or plural form of the role.
 */
function vp_portfolio_credits_pluralize_role( $role, $names ) {
	$has_multiple = strpos( $names, ',' ) !== false;
	if ( ! $has_multiple ) {
		return $role;
	}

	$irregular = [
		'Production Company'  => 'Production Companies',
		'Production Service'   => 'Production Services',
		'Talent'              => 'Talent',
		'Transport'           => 'Transport',
		'G&E'                 => 'G&E',
		'BTS'                 => 'BTS',
		'Hair & Makeup'       => 'Hair & Makeup',
		'VFX'                 => 'VFX',
		'Storyboards'         => 'Storyboards',
		'Assistant Editors'   => 'Assistant Editors',
		'Sound Design & Mix'   => 'Sound Design & Mix',
	];

	if ( isset( $irregular[ $role ] ) ) {
		return $irregular[ $role ];
	}

	$abbrev_plural = [
		'1st AD'     => '1st ADs',
		'2nd AD'     => '2nd ADs',
		'PA'         => 'PAs',
		'EP'         => 'EPs',
		'DOP'        => 'DOPs',
		'1st AC'     => '1st ACs',
		'2nd AC'     => '2nd ACs',
		'DIT'        => 'DITs',
	];

	if ( isset( $abbrev_plural[ $role ] ) ) {
		return $abbrev_plural[ $role ];
	}

	if ( preg_match( '/s$|x$|ch$|sh$/i', $role ) ) {
		return $role;
	}
	return $role . 's';
}

/**
 * Gather populated credits for a single department.
 *
 * @param string $dept_key Department key (e.g. 'production', 'camera').
 * @param int    $post_id  Portfolio post ID.
 * @return array[] List of ['role' => string, 'names' => string].
 */
function vp_portfolio_credits_get_department( $dept_key, $post_id = null ) {
	$post_id = $post_id ?: get_the_ID();
	$config  = vp_portfolio_credits_config();
	if ( ! isset( $config[ $dept_key ] ) ) {
		return [];
	}
	$dept   = $config[ $dept_key ];
	$pairs  = [];

	foreach ( $dept['fields'] as $slug => $label ) {
		$val = trim( (string) vp_portfolio_get( $slug, $post_id ) );
		if ( $val !== '' ) {
			$role = vp_portfolio_credits_pluralize_role( $label, $val );
			$pairs[] = [ 'role' => $role, 'names' => $val ];
		}
	}

	if ( ! empty( $dept['repeater'] ) ) {
		$rows = vp_portfolio_get( $dept['repeater'], $post_id );
		if ( is_array( $rows ) ) {
			foreach ( $rows as $row ) {
				$role  = isset( $row['role'] ) ? trim( (string) $row['role'] ) : '';
				$names = isset( $row['names'] ) ? trim( (string) $row['names'] ) : '';
				if ( $role !== '' || $names !== '' ) {
					$display_role = $role !== '' ? vp_portfolio_credits_pluralize_role( $role, $names ) : '—';
					$pairs[] = [ 'role' => $display_role, 'names' => $names ];
				}
			}
		}
	}

	return $pairs;
}

/**
 * Gather all departments that have at least one populated credit.
 *
 * @param int $post_id Portfolio post ID.
 * @return array[] List of ['key' => string, 'label' => string, 'credits' => array].
 */
function vp_portfolio_credits_get_all_departments( $post_id = null ) {
	$post_id   = $post_id ?: get_the_ID();
	$config    = vp_portfolio_credits_config();
	$result    = [];

	foreach ( $config as $key => $dept ) {
		$credits = vp_portfolio_credits_get_department( $key, $post_id );
		if ( ! empty( $credits ) ) {
			$result[] = [
				'key'     => $key,
				'label'  => $dept['label'],
				'credits' => $credits,
			];
		}
	}

	return $result;
}

/**
 * Render portfolio credits grouped by department.
 * Output uses .vp-credits, .vp-credits__row, .vp-credits__dept, .vp-credits__content,
 * .vp-credit-pair, .vp-credit-role, .vp-credit-names.
 *
 * @param int $post_id Portfolio post ID.
 */
function vp_portfolio_render_credits( $post_id = null ) {
	$post_id  = $post_id ?: get_the_ID();
	$departments = vp_portfolio_credits_get_all_departments( $post_id );
	if ( empty( $departments ) ) {
		return;
	}

	$allowed = [
		'a'      => [ 'href' => true, 'title' => true, 'target' => true, 'rel' => true, 'class' => true ],
		'br'     => [],
		'strong' => [],
		'b'      => [],
		'em'     => [],
		'i'      => [],
		'span'   => [ 'class' => true ],
	];

	echo '<section class="vp-credits">';
	foreach ( $departments as $dept ) {
		echo '<div class="vp-credits__row">';
		echo '<div class="vp-credits__dept">' . esc_html( $dept['label'] ) . '</div>';
		echo '<div class="vp-credits__content">';
		foreach ( $dept['credits'] as $pair ) {
			$names_safe = wp_kses( $pair['names'], $allowed );
			echo '<span class="vp-credit-pair">';
			echo '<span class="vp-credit-role">' . esc_html( $pair['role'] ) . '</span> ';
			echo '<span class="vp-credit-names">' . $names_safe . '</span>';
			echo '</span> ';
		}
		echo '</div>';
		echo '</div>';
	}
	echo '</section>';
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
require_once get_stylesheet_directory() . '/inc/blog-load-more.php';
require_once get_stylesheet_directory() . '/inc/yoast-schema-portfolio.php';
require_once get_stylesheet_directory() . '/inc/yoast-schema-about-founders.php';
require_once get_stylesheet_directory() . '/inc/yoast-schema-work-page.php';
require_once get_stylesheet_directory() . '/inc/yoast-schema-organization-taxonomies.php';
require_once get_stylesheet_directory() . '/inc/yoast-seo-tweaks.php';

/**
 * Portfolio Infinite Scroll Script
 *
 * Loads the lazy-load / infinite scroll JS on Work pages only.
 */

add_action('wp_enqueue_scripts', function () {

  // Use page slugs (reliable for custom page-*.php templates) or portfolio taxonomy archives
  if (is_page('work') || is_page('work-internal') || is_tax('industry') || is_tax('market') || is_tax('video-format')) {

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

/**
 * Blog: limit initial query to 9 posts on blog index, category, and date/author archives (infinite scroll loads more).
 */
add_action('pre_get_posts', function ($query) {
  if (is_admin() || !$query->is_main_query()) {
    return;
  }
  if ($query->is_home() || $query->is_category() || $query->is_search() || ($query->is_archive() && !$query->is_post_type_archive())) {
    $query->set('posts_per_page', 9);
  }
}, 10);

/**
 * Blog infinite scroll script – load on blog index, category, and post archives.
 */
add_action('wp_enqueue_scripts', function () {
  if (!is_home() && !is_category() && !is_search() && !(is_archive() && !is_post_type_archive())) {
    return;
  }
  wp_enqueue_script(
    'vp-blog-load-more',
    get_stylesheet_directory_uri() . '/assets/js/blog-load-more.js',
    [],
    wp_get_theme()->get('Version'),
    true
  );
  wp_localize_script('vp-blog-load-more', 'vpBlogLoadMore', [
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'nonce'   => wp_create_nonce('vp_blog_load_more'),
  ]);
}, 25);

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

/**
 * WP Bootstrap Blocks: remove default margin classes (e.g. mb-2) from Container blocks.
 * Lets our own section rhythm / spacing rules control vertical spacing instead of per-block margins.
 */
add_filter('wp_bootstrap_blocks_container_classes', function ($classes, $attributes) {
  $filtered = [];

  foreach ((array) $classes as $class) {
    // Strip any Bootstrap margin-bottom utility (mb-0 .. mb-5 etc).
    if (strpos($class, 'mb-') === 0) {
      continue;
    }
    $filtered[] = $class;
  }

  return $filtered;
}, 20, 2);

/**
 * Navigation: route the main "Contact" menu item to the contact modal.
 * Keeps the /contact page available for direct URL / SEO while turning the main nav item into a modal trigger.
 */
add_filter(
  'nav_menu_link_attributes',
  function ($atts, $item, $args) {
    if (empty($args->theme_location) || 'main-menu' !== $args->theme_location) {
      return $atts;
    }

    $title = isset($item->title) ? trim((string) $item->title) : '';

    if ('' === $title || 'Contact' !== $title) {
      return $atts;
    }

    $atts['href']           = '#vp-contact-modal';
    $atts['data-bs-toggle'] = 'modal';
    $atts['data-bs-target'] = '#vp-contact-modal';
    $atts['role']           = 'button';
    $atts['aria-haspopup']  = 'dialog';
    $atts['aria-expanded']  = 'false';

    return $atts;
  },
  10,
  3
);