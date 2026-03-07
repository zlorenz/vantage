<?php
/**
 * Custom search form
 * Purpose: Clean site search form styled for the Vantage blog/news sidebar.
 */
?>
<form class="search-form vp-search-form" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
  <label class="screen-reader-text" for="vp-search-field">
    <?php esc_html_e('Search for:', 'vantagepictures'); ?>
  </label>

  <div class="vp-search-form__inner">
    <input
      id="vp-search-field"
      type="search"
      class="search-field vp-search-form__input"
      placeholder="<?php echo esc_attr__('Search', 'vantagepictures'); ?>"
      value="<?php echo esc_attr(get_search_query()); ?>"
      name="s"
    />

    <button type="submit" class="vp-search-form__button" aria-label="<?php echo esc_attr__('Submit search', 'vantagepictures'); ?>">
      <span aria-hidden="true">⌕</span>
    </button>
  </div>
</form>