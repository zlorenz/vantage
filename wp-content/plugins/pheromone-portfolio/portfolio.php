<?php // Template Name: Portfolio ?>
<?php if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly ?>
<?php  get_header();?>
<section class="portfolio">
<?php if (get_post_meta($post->ID, 'port_page', 1) == 'Fixed') {?>
    <div class="container">
<?php } else { ?>
    <div class="container-fluid">
<?php  } ?>
        <div class="row">
            <div class="col-sm-10 col-sm-offset-1 text-center">
                <h3><?php esc_html_e('Latest Works','pheromone')?></h3>
            </div>
        </div>
        <div class="row">
        <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <?php if ((get_post_meta($post->ID, 'st_sf_ps', 1)!='creative') && get_post_meta($post->ID, 'st_sf_ps', 1)!='modern') {?>
            <div class="potfolio_container_holder">
            <div class="st_sf_page_holder st_sf_without_sidebar">
            	<?php $portfolio_layout = get_post_meta($post->ID, 'port_layout', 1);
            	if($portfolio_layout == 'Masonry Grid With Spaces'){$portfolio_layout_class='r_t_w_s';}
            	elseif($portfolio_layout == 'Masonry Grid Without Spaces'){$portfolio_layout_class='r_t_wo_s';}
                elseif($portfolio_layout == '4 Columns With Spaces'){$portfolio_layout_class='f_s_t_w_s';}
                elseif($portfolio_layout == '4 Columns Without Spaces'){$portfolio_layout_class='f_s_t_wo_s';}
            	elseif($portfolio_layout == '3 Columns With Spaces'){$portfolio_layout_class='s_t_w_s';}
                elseif($portfolio_layout == '3 Columns Without Spaces'){$portfolio_layout_class='s_t_wo_s';}
            	elseif($portfolio_layout == '2 Columns With Spaces'){$portfolio_layout_class='h_t_w_s';}
            	elseif($portfolio_layout == '2 Columns Without Spaces'){$portfolio_layout_class='h_t_wo_s';}
            	?>
            	<div class="st_sf_<?php echo $portfolio_layout_class;?>">
                <?php if ( have_posts() ) : while ( have_posts() ) : the_post();  the_content();  endwhile; endif;}?>
            	<?php if (get_post_meta($post->ID, 'port_filters', 1) == 'Yes') {?>
                <div class="st_sf_port_filter_holder">
                    <div class="st_sf_port_filter" id="filters"> 
                        <ul class="st_sf_list_cats">
            				<?php $categories = get_categories(array('type' => 'portfolio', 'taxonomy' => 'portfolio-category')); 
            				echo "<li class='cat-item'><a href='#' data-filter='*' class='filter_button'>".esc_html__('All','pheromone')."</a></li>";
            				foreach($categories as $category) {
            				$group = $category->slug;
            				echo "<li><a href='#' data-filter='.$group' class='filter_button'>".$category->cat_name."</a></li>";
            				}?> 
                        </ul>
                	</div>
                </div>
                <?php }; ?>
    	
	<?php if ($portfolio_layout == 'Masonry Grid Without Spaces'
    || $portfolio_layout == '4 Columns Without Spaces'
    || $portfolio_layout == '3 Columns Without Spaces'
    || $portfolio_layout == '2 Columns Without Spaces')
    {$portfolio_layout_extra_class ='st_sf_wall';}else{$portfolio_layout_extra_class ='';}?>
    <div class="container-mini">
    <div class="row st_sf_port_container <?php echo $portfolio_layout_extra_class?>">
    <?php include_once("framework/loop.php");?>
    </div>
    </div>
    <?php wp_reset_query(); ?>
	
	<?php if (get_post_meta($post->ID, 'port_load_more', 1) == 'Yes') {?>
    <div class="st_sf_load_more_holder">
        <?php
			if(get_post_meta($post->ID, 'st_sf_tag', 1) =="All"){
			$count_posts = wp_count_posts('portfolio');
			$published_posts = $count_posts->publish;
			}else{
				$taxonomy = "portfolio-tags"; // can be category, post_tag, or custom taxonomy name
				// Using Term Slug
				$term_name = get_post_meta($post->ID, 'st_sf_tag', 1);
				$term = get_term_by('name', $term_name, $taxonomy);
				
				// Fetch the count
				$published_posts = $term->count;
			};
		?>
        
        <div class="st_sf_lmc_holder">
            <span>
                <span class="st_sf_counts"><span id="st_sf_masorny_posts_per_page"><?php echo esc_attr(get_post_meta($post->ID, 'port-count', true)); ?></span> / <span id="st_sf_max_masorny_posts"><?php echo esc_attr($published_posts);?></span></span>
                <a id="load_more_port_masorny_posts" data-tag="<?php echo get_post_meta($post->ID, 'st_sf_tag', 1)?>" data-offset="<?php echo esc_attr(get_post_meta($post->ID, 'port-count', true)); ?>" data-layout-mode="<?php echo esc_attr(get_post_meta($post->ID, 'port_layout', 1)) ?>" data-load-posts_count="<?php echo (get_post_meta($post->ID, 'port-load_count', true)); ?>"  class="st_sf_load_more"><span><?php _e("Load More ", "pheromone");?></span></a>
            </span>
        </div>
        <?php };?>
    </div>
    
    </div>
  </div>  
   </div>
        </div>
    </div>
</div>
</section>
<?php get_footer();?>