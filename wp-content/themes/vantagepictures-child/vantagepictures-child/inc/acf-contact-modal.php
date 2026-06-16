<?php
/**
 * ACF: Global Contact Info options.
 * Registers a sitewide options page for contact modal content and footer (email + social links).
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'acf/init', 'vp_register_acf_contact_modal_options' );

/**
 * Register the "Contact Info" ACF options page and fields.
 */
function vp_register_acf_contact_modal_options() {
	if ( ! function_exists( 'acf_add_options_page' ) || ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	$page = acf_add_options_page(
		array(
			'page_title' => 'Contact Info',
			'menu_title' => 'Contact Info',
			'menu_slug'  => 'vp-contact-modal',
			'capability' => 'manage_options',
			'redirect'   => false,
			'position'   => 59,
		)
	);

	if ( empty( $page ) || empty( $page['menu_slug'] ) ) {
		return;
	}

	acf_add_local_field_group(
		array(
			'key'                   => 'group_vp_contact_modal',
			'title'                 => 'Contact Info',
			'fields'                => array(
				array(
					'key'           => 'field_vp_contact_modal_title',
					'label'         => 'Modal title',
					'name'          => 'contact_modal_title',
					'type'          => 'text',
					'instructions'  => 'Main heading shown at the top of the contact modal.',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_modal_intro',
					'label'         => 'Intro text',
					'name'          => 'contact_modal_intro',
					'type'          => 'textarea',
					'instructions'  => 'Short introduction or helper copy above the main content.',
					'rows'          => 3,
					'new_lines'     => '',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_modal_content',
					'label'         => 'Main content',
					'name'          => 'contact_modal_content',
					'type'          => 'wysiwyg',
					'instructions'  => 'Rich text content shown inside the contact modal body (e.g. contact form, additional details).',
					'tabs'          => 'all',
					'toolbar'       => 'full',
					'media_upload'  => 1,
				),
				array(
					'key'           => 'field_vp_contact_email',
					'label'         => 'Email address',
					'name'          => 'contact_email',
					'type'          => 'email',
					'instructions'  => 'Primary email for contact modal and footer. Shown as a mailto: link.',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_phone',
					'label'         => 'Phone',
					'name'          => 'contact_phone',
					'type'          => 'text',
					'instructions'  => 'Primary phone number. Shown as a tel: link.',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_whatsapp',
					'label'         => 'WhatsApp',
					'name'          => 'contact_whatsapp',
					'type'          => 'text',
					'instructions'  => 'WhatsApp number (with country code). Shown as a WhatsApp chat link if provided.',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_address',
					'label'         => 'Address',
					'name'          => 'contact_address',
					'type'          => 'textarea',
					'instructions'  => 'Physical mailing or studio address. Line breaks are preserved.',
					'rows'          => 3,
					'new_lines'     => '',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_cta_text',
					'label'         => 'CTA button text',
					'name'          => 'contact_cta_text',
					'type'          => 'text',
					'instructions'  => 'Optional primary call-to-action button label (e.g. “View brief form”).',
					'default_value' => '',
				),
				array(
					'key'           => 'field_vp_contact_cta_url',
					'label'         => 'CTA button URL',
					'name'          => 'contact_cta_url',
					'type'          => 'url',
					'instructions'  => 'Destination URL for the primary call-to-action button (e.g. /client-brief/).',
					'default_value' => '',
				),
				// Footer social links (one URL per platform; leave empty to hide).
				array(
					'key'           => 'field_vp_social_vimeo',
					'label'         => 'Vimeo URL',
					'name'          => 'social_vimeo',
					'type'          => 'url',
					'instructions'  => 'Shown in the footer. Leave empty to hide.',
					'default_value' => 'https://vimeo.com/vantagepictures',
				),
				array(
					'key'           => 'field_vp_social_instagram',
					'label'         => 'Instagram URL',
					'name'          => 'social_instagram',
					'type'          => 'url',
					'instructions'  => 'Shown in the footer. Leave empty to hide.',
					'default_value' => 'https://www.instagram.com/vantage.pictures/',
				),
				array(
					'key'           => 'field_vp_social_facebook',
					'label'         => 'Facebook URL',
					'name'          => 'social_facebook',
					'type'          => 'url',
					'instructions'  => 'Shown in the footer. Leave empty to hide.',
					'default_value' => 'https://www.facebook.com/vantagepictures',
				),
				array(
					'key'           => 'field_vp_social_linkedin',
					'label'         => 'LinkedIn URL',
					'name'          => 'social_linkedin',
					'type'          => 'url',
					'instructions'  => 'Shown in the footer. Leave empty to hide.',
					'default_value' => 'https://www.linkedin.com/company/vantage-pictures',
				),
				array(
					'key'           => 'field_vp_social_youtube',
					'label'         => 'YouTube URL',
					'name'          => 'social_youtube',
					'type'          => 'url',
					'instructions'  => 'Shown in the footer. Leave empty to hide.',
					'default_value' => 'https://www.youtube.com/@vantage.pictures',
				),
				array(
					'key'           => 'field_vp_social_xinpianchang',
					'label'         => 'Xinpianchang URL',
					'name'          => 'social_xinpianchang',
					'type'          => 'url',
					'instructions'  => 'Shown in the footer. Leave empty to hide.',
					'default_value' => 'https://www.xinpianchang.com/u11835825',
				),
				array(
					'key'           => 'field_vp_social_xiaohongshu',
					'label'         => 'Xiaohongshu (小红书 / Rednote) URL',
					'name'          => 'social_xiaohongshu',
					'type'          => 'url',
					'instructions'  => 'Profile link for Xiaohongshu / Rednote. Shown in the footer to the right of Xinpianchang when set. Leave empty to hide.',
					'default_value' => '',
				),
			),
			'location'              => array(
				array(
					array(
						'param'    => 'options_page',
						'operator' => '==',
						'value'    => $page['menu_slug'],
					),
				),
			),
			'menu_order'            => 0,
			'position'              => 'normal',
			'style'                 => 'default',
			'label_placement'       => 'top',
			'instruction_placement' => 'label',
			'active'                => true,
		)
	);
}

