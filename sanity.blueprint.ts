import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

const PORTFOLIO_KEY_VISUALS_FILTER =
  '_type == "portfolioEntry" && (before() == null || delta::changedAny(keyVisuals) || (defined(after().keyVisuals) && !defined(before().keyVisuals)))'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'phrase-propagate',
      src: './functions/phrase-propagate',
      timeout: 60,
      memory: 2,
      event: {
        on: ['update'],
        filter: '_type == "translatedPhrase" && delta::changedAny(zh)',
        projection:
          '{_id, en, "beforeZh": before().zh, "afterZh": after().zh}',
        resource: {
          type: 'dataset',
          id: '7oesp86l.production',
        },
      },
    }),
    defineDocumentFunction({
      name: 'key-visual-tag',
      src: './functions/key-visual-tag',
      timeout: 30,
      memory: 1,
      event: {
        on: ['create', 'update'],
        includeDrafts: true,
        filter: PORTFOLIO_KEY_VISUALS_FILTER,
        projection:
          '{_id, "beforeRefs": before().keyVisuals[].asset._ref, "afterRefs": after().keyVisuals[].asset._ref}',
        resource: {
          type: 'dataset',
          id: '7oesp86l.production',
        },
      },
    }),
  ],
})
