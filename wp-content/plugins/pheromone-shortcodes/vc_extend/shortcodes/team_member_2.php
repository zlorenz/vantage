<?php
/*TEAM  MEMBER*/
add_shortcode('vc_team_member_two', 'vc_team_member_two_f');
function vc_team_member_two_f($atts, $content = null) {
	extract(shortcode_atts( array(
	'image'=> get_template_directory_uri().'/assets/img/no_image.png',
	'name'=> 'James Daniels',
  'position'=> 'CEO',
  'description'=> null,
  'tw_url'=> '#',
  'fb_url'=> '#',
  'em_url'=> '#',
  'gp_url'=> '#',
  'inst_url'=> null,
  'drib_url'=> null,
  'git_url'=> null,
  'you_url'=> null,
  'link_url'=> null,
	), $atts));
	


   if ($tw_url == ''){$tw ='';} else { $tw = '<li><a target="_blank" href="'.$tw_url.'"><i class="fab fa-2x fa-fw fa fa-twitter"></i></a></li>';};
   if ($fb_url == ''){$fb ='';} else { $fb = '<li><a target="_blank" href="'.$fb_url.'"><i class="fab fa-2x fa-fw fa fa-facebook"></i></a></li>';};
   if ($em_url == ''){$em ='';} else { $em = '<li><a target="_blank" href="'.$em_url.'"><i class="fab fa-2x fa-fw fa fa-envelope"></i></a></li>';};
   if ($gp_url == ''){$gp ='';} else { $gp = '<li><a target="_blank" href="'.$gp_url.'"><i class="fab fa-2x fa-fw fa fa-google-plus"></i></a></li>';};
   if ($inst_url == ''){$inst ='';} else { $inst = '<li><a target="_blank" href="'.$inst_url.'"><i class="fab fa-2x fa-fw fa fa-instagram"></i></a></li>';};
   if ($drib_url == ''){$db ='';} else { $db = '<li><a target="_blank" href="'.$drib_url.'"><i class="fab fa-2x fa-fw fa fa-dribbble"></i></a></li>';};
   if ($git_url == ''){$git ='';} else { $git = '<li><a target="_blank" href="'.$git_url.'"><i class="fab fa-2x fa-fw fa fa-github"></i></a></li>';};
   if ($you_url == ''){$you ='';} else { $you = '<li><a target="_blank" href="'.$you_url.'"><i class="fab fa-2x fa-fw fa fa-youtube"></i></a></li>';};
   if ($link_url == ''){$link ='';} else { $link = '<li><a target="_blank" href="'.$link_url.'"><i class="fab fa-2x fa-fw fa fa-linkedin"></i></a></li>';};
	 

   $ulrs = ''.$tw.''.$fb.''.$em.''.$gp.''.$inst.''.$db.''.$git.''.$you.''.$link.'';

	 $image_done = wp_get_attachment_image($image,'full img-responsive');
	 
	 $code = '<div class="team-block-two text-center">
                <h4>'.$name.'</h4>
                '.$image_done.'
                <div class="team-member-info"><div class="team-info-wrapper"><h5>'.$position.'</h5>
                <ul class="list-inline">
                    '.$ulrs.'
                </ul></div></div>
              </div>';

	return $code;
};



vc_map( array(
   "name" => __("Team Member 2",'pheromone'),
   "base" => "vc_team_member_two",
   "category" => __('Pheromone','pheromone'),
   "params" => array(
	  array(
         "type" => "attach_image",
         "admin_label" => true,
         "heading" => __("Member Photo",'pheromone'),
         "param_name" => "image",
      ),
	  array(
         "type" => "textfield",
         "admin_label" => true,
         "heading" => __("Name",'pheromone'),
         "param_name" => "name",
         "value" => __("James Daniels",'pheromone'),
      ),
	  
    array(
         "type" => "textfield",
         "admin_label" => true,
         "heading" => __("Position in company",'pheromone'),
         "param_name" => "position",
         "value" => __("CEO",'pheromone'),
      ),
    array(
         "type" => "textfield",
         "admin_label" => true,
         "heading" => __("Description",'pheromone'),
         "param_name" => "description",
      ),
      array(
         "type" => "textfield",
         "heading" => __("Twitter",'unibody'),
         "param_name" => "tw_url",
         "value" => __("#",'unibody'),
         "admin_label" => true,
      ),
	   array(
         "type" => "textfield",
         "heading" => __("Facebook",'unibody'),
         "param_name" => "fb_url",
         "value" => __("#",'unibody'),
         "admin_label" => true,
      ),
	   array(
         "type" => "textfield",
         "heading" => __("E-mail",'unibody'),
         "param_name" => "em_url",
         "value" => __("#",'unibody'),
         "admin_label" => true,
      ),
	   array(
         "type" => "textfield",
         "heading" => __("Google Plus",'unibody'),
         "param_name" => "gp_url",
         "value" => __("#",'unibody'),
         "admin_label" => true,
      ),
     array(
         "type" => "textfield",
         "heading" => __("Instagram",'unibody'),
         "param_name" => "inst_url",
         "admin_label" => true
      ),
    
     array(
         "type" => "textfield",
         "heading" => __("Dribbble",'unibody'),
         "param_name" => "drib_url",
         "admin_label" => true
      ),
     array(
         "type" => "textfield",
         "heading" => __("GitHub",'unibody'),
         "param_name" => "git_url",
         "admin_label" => true
      ),
    
     array(
         "type" => "textfield",
         "heading" => __("YouTube",'unibody'),
         "param_name" => "you_url",
         "admin_label" => true
      ),

     array(
         "type" => "textfield",
         "heading" => __("LinkedIn",'unibody'),
         "param_name" => "link_url",
         "admin_label" => true
      ),
   )
) );

