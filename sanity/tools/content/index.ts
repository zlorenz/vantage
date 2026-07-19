import {DocumentsIcon} from '@sanity/icons'
import type {Tool} from 'sanity'
import {route} from 'sanity/router'
import {ContentTool} from './ContentTool'

export const contentTool: Tool = {
  name: 'content',
  title: 'Content',
  icon: DocumentsIcon,
  component: ContentTool,
  // Persist the active section/document in the URL (like the Structure tool)
  // so a page reload restores what the user was viewing.
  router: route.create('/', [route.create('/:section', [route.create('/:documentId')])]),
}
