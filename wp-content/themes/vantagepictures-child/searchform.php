<?php
/**
 * Custom search form
 * Uses same structure and classes as nav search (.vp-search-wrapper, .vp-search-input, .vp-search-button).
 */
?>
<form class="search-form vp-search-form" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
  <label class="screen-reader-text" for="vp-search-field">
    <?php esc_html_e('Search for:', 'vantagepictures'); ?>
  </label>
  <div class="vp-search-wrapper">
    <input
      id="vp-search-field"
      type="search"
      name="s"
      class="vp-search-input"
      placeholder="<?php echo esc_attr__('Search', 'vantagepictures'); ?>"
      value="<?php echo esc_attr(get_search_query()); ?>"
      aria-label="<?php esc_attr_e('Search', 'vantagepictures'); ?>"
    />
    <button type="submit" class="vp-search-button" aria-label="<?php echo esc_attr__('Submit search', 'vantagepictures'); ?>">
      <i class="fa fa-search" aria-hidden="true"></i>
    </button>
  </div>
</form>
