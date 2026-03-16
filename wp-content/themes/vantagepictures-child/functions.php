<?php
/**
 * Vantage Pictures Child Theme functions
 */

/**
 * Global image quality for generated thumbnails (JPEG/WebP).
 * Higher value preserves more detail for cinematic frames.
 */
add_filter( 'jpeg_quality', function( $quality ) {
	return 95;
} );

add_filter( 'wp_editor_set_quality', function( $quality, $mime_type ) {
  return 95;
}, 10, 2 );

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
 * TranslatePress: when viewing in Chinese, output Chinese for blog entry-meta and comment form
 * (vantagepictures gettext). Ensures these strings appear in Chinese even if TP's gettext
 * dictionary doesn't have them (e.g. form nodes get data-no-translation and stay English).
 */
add_filter( 'gettext', 'vp_trp_blog_chinese_strings', 10, 3 );
function vp_trp_blog_chinese_strings( $translated, $text, $domain ) {
	if ( $domain !== 'vantagepictures' ) {
		return $translated;
	}
	global $TRP_LANGUAGE;
	if ( ! isset( $TRP_LANGUAGE ) || $TRP_LANGUAGE !== 'zh_CN' ) {
		return $translated;
	}
	$strings = [
		'This entry was posted in %1$s.' => '本文章发表于 %1$s。',
		'This entry was posted.'         => '本文章发表于。',
		'No Comments yet!'               => '暂无评论！',
		'Comments are closed.'           => '评论已关闭。',
		'Cancel reply'                   => '取消回复',
		'Your Email address will not be published.' => '您的电子邮箱地址不会被公开。',
		'Comment'                        => '评论',
		'Name'                           => '姓名',
		'Email'                          => '电子邮箱',
		'Save my name, email, and website in this browser for the next time I comment.' => '下次发表评论时，请在此浏览器中保存我的姓名、电子邮箱和网站。',
		'Post Comment'                   => '发表评论',
		'Comment navigation'             => '评论导航',
		'&larr; Older Comments'          => '&larr; 较早评论',
		'Newer Comments &rarr;'           => '较新评论 &rarr;',
	];
	return isset( $strings[ $text ] ) ? $strings[ $text ] : $translated;
}

/**
 * Blog category slug => Chinese name map for when viewing in Chinese (TranslatePress zh_CN).
 * Used by content-single.php so entry-meta category links show translated names.
 * Add new categories here as needed.
 *
 * @return array<string, string> Slug => Chinese name.
 */
function vp_blog_category_zh_names() {
	return [
		'creative' => '活动创意',
		'press'    => '新闻报道',
	];
}

/**
 * Return category display name for current language. When zh_CN, use vp_blog_category_zh_names() map; else term name.
 *
 * @param \WP_Term $cat Category term.
 * @return string
 */
function vp_category_display_name( $cat ) {
	global $TRP_LANGUAGE;
	if ( isset( $TRP_LANGUAGE ) && $TRP_LANGUAGE === 'zh_CN' ) {
		$zh = vp_blog_category_zh_names();
		if ( isset( $zh[ $cat->slug ] ) ) {
			return $zh[ $cat->slug ];
		}
	}
	return $cat->name;
}

/**
 * Editor styles for iframed block editor – dark mode content (headings, paragraphs, etc.)
 * Loads inside the editor iframe via add_editor_style. Overrides :where(.editor-styles-wrapper) color:revert.
 */
add_action('after_setup_theme', function () {
  add_editor_style('assets/css/gutenberg-dark-editor-content.css');
}, 20);

/**
 * Portfolio card thumbnail: high-res 16:9 size (1920×1080).
 * Used in template-parts/portfolio/card.php. Pair with WebP/AVIF (e.g. Speed Optimizer) to keep file size reasonable.
 */
add_action('after_setup_theme', function () {
  add_image_size('vp-portfolio-card', 1920, 1080, true);
}, 21);

// Portfolio visibility taxonomy: "public" (default) vs "hidden".
add_action('init', function () {
  $labels = [
    'name'              => __('Portfolio Visibility', 'vantagepictures'),
    'singular_name'     => __('Portfolio Visibility', 'vantagepictures'),
    'search_items'      => __('Search Visibility', 'vantagepictures'),
    'all_items'         => __('All Visibility States', 'vantagepictures'),
    'edit_item'         => __('Edit Visibility', 'vantagepictures'),
    'update_item'       => __('Update Visibility', 'vantagepictures'),
    'add_new_item'      => __('Add New Visibility', 'vantagepictures'),
    'new_item_name'     => __('New Visibility Name', 'vantagepictures'),
    'menu_name'         => __('Visibility', 'vantagepictures'),
  ];

  $args = [
    'hierarchical'      => false,
    'labels'            => $labels,
    'show_ui'           => true,
    'show_admin_column' => true,
    'query_var'         => true,
    'rewrite'           => [
      'slug' => 'portfolio-visibility',
    ],
    'show_in_rest'      => true,
  ];

  register_taxonomy('portfolio_visibility', ['portfolio'], $args);

  // Ensure the core terms exist so editors can use them.
  if (!term_exists('public', 'portfolio_visibility')) {
    wp_insert_term('public', 'portfolio_visibility');
  }
  if (!term_exists('hidden', 'portfolio_visibility')) {
    wp_insert_term('hidden', 'portfolio_visibility');
  }
});

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

    // TranslatePress ALD popup: dark theme, readable text, visible close icon (no dashicons on front).
    wp_enqueue_style(
        'vp-trp-ald-popup-overrides',
        get_stylesheet_directory_uri() . '/assets/css/trp-ald-popup-overrides.css',
        ['vantagepictures-child-style'],
        wp_get_theme()->get('Version')
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
 * Preload LCP image to start the critical image request as early as possible.
 * Homepage: first hero carousel slide (ACF slides → portfolio_item featured image).
 * Work page: hero background (page featured image). Only runs on front or work page.
 */
add_action('wp_head', function () {
  $url = null;

  if (is_front_page() && function_exists('get_field')) {
    $front_id = (int) get_queried_object_id();
    $slides = $front_id ? get_field('slides', $front_id) : null;
    if (!empty($slides) && is_array($slides)) {
      $first = reset($slides);
      $portfolio_id = isset($first['portfolio_item']) ? $first['portfolio_item'] : null;
      if (is_object($portfolio_id) && !empty($portfolio_id->ID)) {
        $portfolio_id = (int) $portfolio_id->ID;
      } else {
        $portfolio_id = (int) $portfolio_id;
      }
      if ($portfolio_id > 0) {
        $url = get_the_post_thumbnail_url($portfolio_id, 'full');
      }
    }
  } elseif (is_page('work')) {
    $page_id = (int) get_queried_object_id();
    if ($page_id && has_post_thumbnail($page_id)) {
      $url = get_the_post_thumbnail_url($page_id, 'large');
    }
  }

  if (empty($url) || !is_string($url)) {
    return;
  }
  echo '<link rel="preload" as="image" href="' . esc_url($url) . '">' . "\n";
}, 5);

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
	// dataLayer push on briefing form submit (for GTM conversion tracking).
	wp_enqueue_script(
		'vp-gf-brief-datalayer',
		get_stylesheet_directory_uri() . '/assets/js/gf-brief-datalayer.js',
		array( 'jquery' ),
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
 * Client briefing form (Gravity Forms ID 1): push submit success to GTM.
 *
 * Why this approach:
 * - gform_confirmation_loaded only fires for "message/page" confirmations (not redirects).
 * - AJAX "redirect" confirmations return only a redirect script (no form markup to match).
 * - By appending a query string to the redirect URL, we can reliably fire a dataLayer event
 *   on the landing page for both AJAX and non-AJAX submissions.
 *
 * GTM Custom Event trigger: vp_brief_form_submit
 *
 * @param string|array $confirmation Confirmation message or redirect array.
 * @param array        $form         Form object.
 * @param array        $entry       Entry.
 * @param bool         $ajax        Whether request is AJAX.
 * @return string|array Modified confirmation.
 */
function vp_gf_brief_confirmation_tracking( $confirmation, $form, $entry, $ajax ) {
	$form_id = isset( $form['id'] ) ? (int) $form['id'] : 0;
	if ( $form_id !== 1 ) {
		return $confirmation;
	}

	// Redirect confirmation: add a query arg to the target URL so we can fire on landing.
	if ( is_array( $confirmation ) && ! empty( $confirmation['redirect'] ) ) {
		$confirmation['redirect'] = add_query_arg(
			[
				'vp_brief_submitted' => '1',
			],
			$confirmation['redirect']
		);
		return $confirmation;
	}

	// Message/page confirmation (HTML): append inline script to fire immediately.
	if ( is_string( $confirmation ) && $confirmation !== '' ) {
		$script = "<script>(function(){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'vp_brief_form_submit',formId:'1',formName:'client_brief'});})();</script>";
		return $confirmation . $script;
	}

	return $confirmation;
}
add_filter( 'gform_confirmation', 'vp_gf_brief_confirmation_tracking', 20, 4 );

/**
 * Landing-page handler for redirect confirmations.
 * If a successful submission redirected here with vp_brief_submitted=1, push the dataLayer event.
 */
function vp_gf_brief_tracking_landing_page() {
	if ( empty( $_GET['vp_brief_submitted'] ) || (string) $_GET['vp_brief_submitted'] !== '1' ) {
		return;
	}
	?>
	<script>
	(function() {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({ event: 'vp_brief_form_submit', formId: '1', formName: 'client_brief' });
		// Clean URL so refresh doesn't double-count.
		try {
			var url = new URL(window.location.href);
			url.searchParams.delete('vp_brief_submitted');
			window.history.replaceState({}, document.title, url.toString());
		} catch (e) {}
	})();
	</script>
	<?php
}
add_action( 'wp_footer', 'vp_gf_brief_tracking_landing_page', 4 );

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
 * Ensure TranslatePress Automatic Language Detection scripts never load.
 * This prevents the ALD JS from enqueueing and avoids requests to
 * trp-ald-ajax.php even if the add-on is accidentally re-enabled.
 */
add_filter( 'trp_ald_enqueue_redirecting_script', '__return_false' );

/**
 * Safety: dequeue ALD script if anything ever enqueues it.
 * Ensures trp-language-cookie.js never loads; no-op if handle was not enqueued.
 */
add_action( 'wp_enqueue_scripts', function () {
	wp_dequeue_script( 'trp-language-cookie' );
}, 999 );

/**
 * TranslatePress: when the URL has no language prefix (e.g. /work/, /news/), always use default
 * language for content and link generation. Prevents English pages from outputting Chinese URLs
 * (e.g. portfolio links on /work/ pointing to /zh/portfolio/...) when a cookie or preference
 * would otherwise set TRP_LANGUAGE to Chinese.
 */
add_filter('trp_needed_language', function ($needed_language, $lang_from_url, $settings, $trp) {
  if ($lang_from_url === null) {
    return $settings['default-language'] ?? $needed_language;
  }
  return $needed_language;
}, 10, 4);

/**
 * TranslatePress: redirect /zh/[english-slug] to /zh/[chinese-slug] so content is in Chinese.
 * When the URL is under /zh/ but uses the default-language (English) slug, TP can show English.
 * Redirect to the canonical Chinese URL (with translated slug) so the page renders in Chinese.
 * Explicit fallbacks for /zh/work/ and /zh/news/ in case TP slug translation isn't set for those pages.
 */
add_action('template_redirect', function () {
  if (is_admin() || !isset($_SERVER['REQUEST_URI'])) {
    return;
  }
  if (!class_exists('TRP_Translate_Press')) {
    return;
  }
  $trp = TRP_Translate_Press::get_trp_instance();
  $url_converter = $trp->get_component('url_converter');
  $settings = $trp->get_component('settings')->get_settings();
  $default_lang = $settings['default-language'] ?? 'en_US';
  $zh_code = null;
  foreach (array_keys($settings['url-slugs'] ?? []) as $code) {
    if (($settings['url-slugs'][$code] ?? '') === 'zh') {
      $zh_code = $code;
      break;
    }
  }
  if (!$zh_code) {
    return;
  }
  $current_url = $url_converter->cur_page_url(true);
  $current_url = str_replace('#TRPLINKPROCESSED', '', $current_url);
  $lang_from_url = $url_converter->get_lang_from_url_string($current_url);
  if ($lang_from_url !== $zh_code) {
    return;
  }
  $path = rtrim(parse_url($current_url, PHP_URL_PATH), '/') ?: '/';
  $path_lower = mb_strtolower($path);

  // Explicit redirects when TP slug translation may be missing for these pages.
  $zh_work_news_slugs = [
    '/zh/work'   => '/zh/工作',
    '/zh/news'   => '/zh/新闻',
  ];
  foreach ($zh_work_news_slugs as $en_path => $zh_path) {
    if ($path_lower === $en_path || $path_lower === $en_path . '/') {
      $redirect = home_url($zh_path . '/');
      wp_safe_redirect($redirect, 301);
      exit;
    }
  }

  $default_lang_url = $url_converter->get_url_for_language($default_lang, $current_url, '');
  $default_lang_url = str_replace('#TRPLINKPROCESSED', '', $default_lang_url);
  $chinese_canonical = $url_converter->get_url_for_language($zh_code, $default_lang_url, '');
  $chinese_canonical = str_replace('#TRPLINKPROCESSED', '', $chinese_canonical);
  $cur_normalized = rtrim(parse_url($current_url, PHP_URL_PATH), '/') ?: '/';
  $canon_normalized = rtrim(parse_url($chinese_canonical, PHP_URL_PATH), '/') ?: '/';
  if ($cur_normalized !== $canon_normalized) {
    wp_safe_redirect($chinese_canonical, 301);
    exit;
  }
}, 2);

/**
 * TranslatePress: remove duplicate trailing English period after Chinese full stop (。. → 。).
 * TP sometimes leaves the original "." at the end of paragraphs when the translation adds 。.
 */
add_filter( 'trp_translated_html', function ( $final_html, $TRP_LANGUAGE, $language_code, $preview_mode ) {
	if ( $language_code !== 'zh_CN' && $TRP_LANGUAGE !== 'zh_CN' ) {
		return $final_html;
	}
	// Chinese full stop + English period (with optional space) → Chinese full stop only.
	$final_html = str_replace( '。.', '。', $final_html );
	$final_html = str_replace( '。 .', '。', $final_html );
	return $final_html;
}, 10, 4 );

/**
 * ACF + Tools: global includes.
 * - WPBakery migration tools
 * - Portfolio credits migration
 * - Page hero visibility field group
 * - Global contact modal options
 */
require_once get_stylesheet_directory() . '/inc/acf-page-hero.php';
require_once get_stylesheet_directory() . '/inc/acf-contact-modal.php';
require_once get_stylesheet_directory() . '/inc/gtm.php';

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
require_once get_stylesheet_directory() . '/inc/portfolio-prewarm.php';
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
 * Vimeo portfolio: dataLayer events (play, progress, complete) for GTM → GA4.
 * Loaded only on single portfolio pages.
 */
add_action('wp_enqueue_scripts', function () {
  if (!is_singular('portfolio')) {
    return;
  }
  wp_enqueue_script(
    'vp-vimeo-datalayer',
    get_stylesheet_directory_uri() . '/assets/js/vimeo-datalayer.js',
    array(),
    wp_get_theme()->get('Version'),
    true
  );
}, 25);

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

/**
 * Lightweight frontend cleanup – remove unnecessary WordPress assets/meta.
 *
 * Applies only on the public frontend (not wp-admin).
 */
add_action( 'init', function () {
	if ( is_admin() ) {
		return;
	}

	/**
	 * 1–2. Disable WordPress emojis (script + styles).
	 * Removes emoji detection script/styles from head, feeds, emails, etc.
	 */
	remove_action( 'wp_head',       'print_emoji_detection_script', 7 );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'wp_print_styles',     'print_emoji_styles' );
	remove_action( 'admin_print_styles',  'print_emoji_styles' );
	remove_filter( 'the_content_feed',    'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss',    'wp_staticize_emoji' );
	remove_filter( 'wp_mail',             'wp_staticize_emoji_for_email' );

	/**
	 * 3. Remove oEmbed discovery links from <head>.
	 * Keeps oEmbed functionality available, but stops outputting discovery links.
	 */
	remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
	remove_action( 'wp_head', 'wp_oembed_add_host_js' );
} );

/**
 * 4–7. Dequeue/disable unneeded frontend scripts and styles.
 */
add_action( 'wp_enqueue_scripts', function () {
	if ( is_admin() ) {
		return;
	}

	// 4. Remove wp-embed.js (legacy embed support script).
	wp_deregister_script( 'wp-embed' );

	// 5. Disable jQuery Migrate on the frontend, but keep core jQuery.
	// Safe if your theme/plugins don't rely on deprecated jQuery APIs.
	if ( ! is_admin() && ! wp_doing_ajax() ) {
		add_filter( 'wp_default_scripts', function ( WP_Scripts $scripts ) {
			if ( isset( $scripts->registered['jquery'] ) ) {
				$jquery = $scripts->registered['jquery'];

				// Remove jquery-migrate from the dependency list, if present.
				if ( ! empty( $jquery->deps ) ) {
					$jquery->deps = array_diff( $jquery->deps, array( 'jquery-migrate' ) );
				}
			}
		} );
	}

	// 6. Remove block editor (Gutenberg) frontend styles if not used.
	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'wp-block-library-theme' );

	// 7. Remove global styles generated by theme.json.
	wp_dequeue_style( 'global-styles' );
}, 20 );

/**
 * 8. Remove REST API discovery links from <head> only.
 * Does NOT disable the REST API endpoints themselves.
 */
add_action( 'init', function () {
	if ( is_admin() ) {
		return;
	}

	// <link rel="https://api.w.org/" ...> tag in <head>.
	remove_action( 'wp_head', 'rest_output_link_wp_head', 10 );
	// REST API link in HTTP headers.
	remove_action( 'template_redirect', 'rest_output_link_header', 11 );
} );