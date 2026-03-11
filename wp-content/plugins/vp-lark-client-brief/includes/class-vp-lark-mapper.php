<?php
/**
 * Mapping layer.
 * Converts discovered field data into stable producer-brief structure.
 * Primary keys: admin_label > sanitized label > field_id.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Maps discovered fields to producer-brief sections.
 */
class VP_Lark_Mapper {

	const MAX_TEXT_LENGTH = 2000;

	/**
	 * Section order and admin_label keys per section.
	 * Internal label (display) is derived from config or key.
	 *
	 * @var array<string, array<string, string>>
	 * Format: section_slug => [ admin_label => internal_label, ... ]
	 */
	private static $section_map = array(
		'project_basics' => array(
			'project_title'           => 'Project',
			'company_name'            => 'Company',
			'project_type'            => 'Project Type',
			'discovery_source'        => 'Lead Source',
			'referral_source_other'   => 'Other Source',
			'referrer_name'           => 'Referred By',
		),
		'contact_info' => array(
			'contact_name'     => 'Contact Person',
			'contact_job_title' => 'Job Title',
			'contact_email'    => 'Email',
			'contact_phone'    => 'Phone',
		),
		'campaign_goals' => array(
			'campaign_goals'                   => 'Campaign Goals',
			'key_message'                      => 'Key Message',
			'target_audience'                   => 'Target Audience',
			'desired_runtime'                   => 'Runtime',
			'video_tone_style'                  => 'Tone & Style',
			'reference_videos'                  => 'References',
			'campaign_keywords_or_avoidances'   => 'Keywords, Themes, or Avoidances',
			'budget_range'                      => 'Budget',
		),
		'timeline_release' => array(
			'distribution_channels' => 'Distribution',
			'target_regions'        => 'Markets',
			'usage_rights_term'      => 'Usage Rights',
			'delivery_deadline'     => 'Deadline',
			'delivery_flexibility'   => 'Flexibility',
			'launch_timing'          => 'Launch Event',
		),
		'brand_product' => array(
			'campaign_focus' => 'Product Focus',
			'brand_description' => 'Brand Overview',
			'brand_mission' => 'Brand Values',
			'product_name' => 'Product Name',
			'product_key_features' => 'Key Selling Points',
			'market_pain_points' => 'Pain Points',
			'product_differentiators' => 'Competitive Advantages',
		),
		'deliverables' => array(
			'deliverables' => 'Deliverables',
		),
		'cutdowns' => array(
			'cutdown_durations'     => 'Cutdown Durations',
			'cutdown_distribution'  => 'Cutdown Distribution',
		),
		'social_versions' => array(
			'social_channels'             => 'Social Channels',
			'social_aspect_ratios'        => 'Aspect Ratios',
			'social_platform_requirements' => 'Platform Requirements',
		),
		'still_photography' => array(
			'stills_type'              => 'Still Types',
			'photography_requirements' => 'Photography Requirements',
			'stills_quantity'          => 'Image Count',
		),
		'final_notes' => array(
			'additional_notes' => 'Additional Notes',
		),
		'attachments' => array(
			'briefing_materials_upload' => 'Attached Files',
		),
	);

	/**
	 * Maps discovered fields to producer brief structure.
	 *
	 * @param array[] $discovered List of discovered field arrays.
	 * @return array{sections: array<string, array{array{label: string, value: string|array}}>, file_urls: string[]}
	 */
	public static function map_to_brief( $discovered ) {
		$mapped = array(
			'sections'  => array(),
			'file_urls' => array(),
		);
		$used_field_ids = array();

		// Index discovered by canonical key.
		$by_key = array();
		foreach ( $discovered as $d ) {
			if ( ! empty( $d['is_empty'] ) && empty( $d['is_file_upload'] ) ) {
				continue;
			}
			$key = VP_Lark_Discovery::get_canonical_key( $d );
			$by_key[ $key ] = $d;
		}

		// Map each section.
		foreach ( self::$section_map as $section => $labels ) {
			$items = array();
			foreach ( $labels as $admin_key => $internal_label ) {
				if ( ! isset( $by_key[ $admin_key ] ) ) {
					continue;
				}
				$d = $by_key[ $admin_key ];
				$value = self::format_value_for_brief( $d );
				if ( $value === null ) {
					continue;
				}
				if ( ! empty( $d['is_file_upload'] ) ) {
					// File uploads: collect URLs; add to attachments section with array value.
					$urls = is_array( $value ) ? $value : array( $value );
					$mapped['file_urls'] = array_merge( $mapped['file_urls'], $urls );
					$items[] = array( 'label' => $internal_label, 'value' => $urls );
				} else {
					$items[] = array( 'label' => $internal_label, 'value' => $value );
				}
				$used_field_ids[ $d['field_id'] ] = true;
			}
			if ( ! empty( $items ) ) {
				$mapped['sections'][ $section ] = $items;
			}
		}

		$mapped['file_urls'] = array_values( array_unique( $mapped['file_urls'] ) );

		// additional_submitted_fields: unmapped non-empty fields (exclude file uploads).
		$additional = array();
		foreach ( $discovered as $d ) {
			if ( ! empty( $d['is_empty'] ) || ! empty( $d['is_file_upload'] ) ) {
				continue;
			}
			if ( isset( $used_field_ids[ $d['field_id'] ] ) ) {
				continue;
			}
			$key = VP_Lark_Discovery::get_canonical_key( $d );
			$internal = self::get_internal_label_for_key( $key );
			$internal = $internal ?: ( $d['label'] ?: ( 'Field ' . $d['field_id'] ) );
			$value = self::format_value_for_brief( $d );
			if ( $value !== null ) {
				$additional[] = array( 'label' => $internal, 'value' => $value );
			}
		}
		if ( ! empty( $additional ) ) {
			$mapped['sections']['additional_submitted_fields'] = $additional;
		}

		return $mapped;
	}

	/**
	 * Returns internal label for a canonical key if mapped.
	 */
	private static function get_internal_label_for_key( $key ) {
		foreach ( self::$section_map as $labels ) {
			if ( isset( $labels[ $key ] ) ) {
				return $labels[ $key ];
			}
		}
		return null;
	}

	/**
	 * Formats a discovered field value for the brief.
	 *
	 * @param array $discovered Discovered field.
	 * @return string|array|null Formatted value; array for file URLs.
	 */
	private static function format_value_for_brief( $discovered ) {
		$val = $discovered['display_value'];
		if ( $val === null || $val === '' ) {
			return null;
		}
		if ( ! empty( $discovered['is_file_upload'] ) ) {
			return is_array( $val ) ? $val : array( $val );
		}
		if ( is_string( $val ) ) {
			$val = self::maybe_trim( $val );
			return $val !== '' ? $val : null;
		}
		return null;
	}

	/**
	 * Trims long text with ellipsis.
	 */
	public static function maybe_trim( $text, $max = self::MAX_TEXT_LENGTH ) {
		$text = (string) $text;
		if ( strlen( $text ) <= $max ) {
			return $text;
		}
		return substr( $text, 0, $max - 3 ) . '...';
	}
}
