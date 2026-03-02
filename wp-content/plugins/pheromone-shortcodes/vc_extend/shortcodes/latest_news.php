<?php
/*LATEST NEWS*/
add_shortcode('vc_latest_news', 'vc_latest_news_f');
function vc_latest_news_f( $atts, $content = null)
{
	extract(shortcode_atts(
        array(
			'id' => '',
    ), $atts));


	$posts = $id;

	$output='';
	$output .= '<div class="blog-main">'.latest_news_loop($posts).'</div>';
	return $output;

}


function latest_news_loop($posts)
{

	$query =  new WP_Query(array('post_type' => 'post', 'p'=> $posts, 'order' => 'DESC'));
	$loop_count = 0;
	ob_start();	
	while ($query->have_posts()) { $query->the_post();
		$post_id = get_the_id();

		$feat_image = wp_get_attachment_image_src( get_post_thumbnail_id($post_id), 'blog-standart');
               echo ' <div class="blog-images">';
                   echo '<div class="post-thumbnail">';
                   echo '<img src="'.$feat_image[0].'" alt="">';
                  echo '  </div>';
               echo ' </div>';
               echo ' <div class="blog-name"><h5><a href="'. get_permalink($post_id).'">'.get_the_title($post_id).'</a></h5></div>';
              echo '  <div class="blog-text"><p>' . get_the_excerpt($post_id) . '</p></div>';
              echo '  <div class="blog-read-more"><a href="' .  get_the_permalink($post_id)  . '">'. esc_html__( "Read More", "pheromone" ) .'</a></div>';

	}
	wp_reset_postdata();
	return ob_get_clean();
};

/*Latest News*/
vc_map( array(
	"name" => __("Latest News Style #1",'pheromone'),
	"base" => "vc_latest_news",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "id",
			"heading" => __("Post Item", 'pheromone'),
			"value" => '',
			"description" => __( "Post ID", 'pheromone' )
		),
	)
) );