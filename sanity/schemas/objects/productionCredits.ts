/**
 * productionCredits — Production department credit fields.
 *
 * Source: content-schema.md §4.2, WordPress vp_portfolio_credits_config() production
 */

import { defineType } from 'sanity';
import { additionalCreditsField, creditTextField } from './creditsHelpers';

export const productionCredits = defineType({
  name: 'productionCredits',
  title: 'Production Credits',
  type: 'object',

  fields: [
    creditTextField('prod_brand', 'Brand', 'Syncs to client taxonomy references.'),
    creditTextField('prod_agency', 'Agency'),
    creditTextField(
      'prod_production_company',
      'Production Company',
      'WordPress default: Vantage Pictures link.'
    ),
    creditTextField('prod_production_service', 'Production Service'),
    creditTextField('prod_executive_producer', 'Executive Producer'),
    creditTextField(
      'prod_director',
      'Director',
      'Syncs to crewMember taxonomy (role: director).'
    ),
    creditTextField('prod_producer', 'Producer'),
    creditTextField('prod_line_producer', 'Line Producer'),
    creditTextField('prod_production_manager', 'Production Manager'),
    creditTextField('prod_production_coordinator', 'Production Coordinator'),
    creditTextField('prod_1st_ad', '1st AD'),
    creditTextField('prod_2nd_ad', '2nd AD'),
    creditTextField('prod_production_assistant', 'Production Assistant'),
    creditTextField('prod_product_technician', 'Product Technician'),
    creditTextField('prod_account_manager', 'Account Manager'),
    creditTextField('prod_transport', 'Transport'),
    creditTextField('prod_chaperone', 'Chaperone'),
    creditTextField('prod_bts', 'BTS'),
    additionalCreditsField('production'),
  ],
});
