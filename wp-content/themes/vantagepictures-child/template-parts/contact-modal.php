<?php
/**
 * Contact modal template.
 * Renders a global Bootstrap contact modal using ACF options page fields.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'get_field' ) ) {
	return;
}

$title        = trim( (string) get_field( 'contact_modal_title', 'option' ) );
$intro        = trim( (string) get_field( 'contact_modal_intro', 'option' ) );
$content      = get_field( 'contact_modal_content', 'option' );
$email        = trim( (string) get_field( 'contact_email', 'option' ) );
$phone        = trim( (string) get_field( 'contact_phone', 'option' ) );
$whatsapp     = trim( (string) get_field( 'contact_whatsapp', 'option' ) );
$address      = trim( (string) get_field( 'contact_address', 'option' ) );
$cta_text     = trim( (string) get_field( 'contact_cta_text', 'option' ) );
$cta_url      = trim( (string) get_field( 'contact_cta_url', 'option' ) );

// Fallbacks so the modal is never completely empty.
if ( $title === '' ) {
	$title = esc_html__( 'Contact', 'vantagepictures' );
}

$has_contact_rows = ( $email !== '' || $phone !== '' || $whatsapp !== '' || $address !== '' || $cta_text !== '' );

// Normalize phone-like values for href attributes while keeping original text for display.
$phone_href    = '';
$whatsapp_href = '';

if ( $phone !== '' ) {
	$digits_only = preg_replace( '/[^\d\+]/', '', $phone );
	if ( $digits_only !== '' ) {
		$phone_href = 'tel:' . $digits_only;
	}
}

if ( $whatsapp !== '' ) {
	$wa_digits = preg_replace( '/[^\d]/', '', $whatsapp );
	if ( $wa_digits !== '' ) {
		$whatsapp_href = 'https://wa.me/' . $wa_digits;
	}
}
?>

<div
	class="modal fade"
	id="vp-contact-modal"
	tabindex="-1"
	aria-labelledby="vp-contact-modal-label"
	aria-hidden="true"
>
	<div class="modal-dialog modal-dialog-centered modal-lg">
		<div class="modal-content">
			<div class="modal-body position-relative">
				<button
					type="button"
					class="btn-close position-absolute top-0 end-0"
					data-bs-dismiss="modal"
					aria-label="<?php esc_attr_e( 'Close contact dialog', 'vantagepictures' ); ?>"
				></button>

				<?php if ( $intro !== '' ) : ?>
					<p class="mb-3">
						<?php echo esc_html( $intro ); ?>
					</p>
				<?php endif; ?>

				<?php if ( ! empty( $content ) ) : ?>
					<div class="mb-3 vp-content-flow">
						<?php
						// WYSIWYG content should preserve rich formatting safely.
						echo wp_kses_post( $content );
						?>
					</div>
				<?php endif; ?>

				<?php if ( $has_contact_rows ) : ?>
					<div class="row gy-3">
						<div class="col-12">
							<ul class="list-unstyled mb-4">
								<?php if ( $email !== '' ) : ?>
									<?php
									$email_safe = antispambot( $email );
									?>
									<li class="mb-2">
										<h3 class="mb-0">
											<a href="mailto:<?php echo esc_attr( $email_safe ); ?>">
												<?php echo esc_html( $email_safe ); ?>
											</a>
										</h3>
									</li>
								<?php endif; ?>

								<?php if ( $phone !== '' && $phone_href !== '' ) : ?>
									<li class="mb-1">
										<h5 class="mb-0">
											<a href="<?php echo esc_url( $phone_href ); ?>">
												<?php echo esc_html( $phone ); ?>
											</a>
										</h5>
									</li>
								<?php endif; ?>

								<?php if ( $whatsapp !== '' && $whatsapp_href !== '' ) : ?>
									<li class="mb-1">
										<span class="h5 me-1" aria-hidden="true">
											<i class="fa fa-whatsapp"></i>
										</span>
										<span class="visually-hidden">
											<?php esc_html_e( 'WhatsApp', 'vantagepictures' ); ?>:
										</span>
										<h5 class="d-inline mb-0">
											<a href="<?php echo esc_url( $whatsapp_href ); ?>" target="_blank" rel="noopener noreferrer">
												<?php echo esc_html( $whatsapp ); ?>
											</a>
										</h5>
									</li>
								<?php endif; ?>
							</ul>

							<?php if ( $address !== '' ) : ?>
								<?php
								$address_value = wp_strip_all_tags( $address );
								?>
								<address class="h5 mb-0">
									<?php echo wp_kses_post( nl2br( esc_html( $address_value ) ) ); ?>
								</address>
							<?php endif; ?>

							<?php if ( $cta_text !== '' && $cta_url !== '' ) : ?>
								<div class="mt-3">
									<a
										class="btn btn-primary"
										href="<?php echo esc_url( $cta_url ); ?>"
									>
										<?php echo esc_html( $cta_text ); ?>
									</a>
								</div>
							<?php endif; ?>
						</div>
					</div>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>

