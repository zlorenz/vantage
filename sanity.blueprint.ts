import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

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
  ],
})
