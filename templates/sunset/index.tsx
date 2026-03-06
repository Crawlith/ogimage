import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'sunset',
  name: 'Sunset',
  description: 'Warm gradient template for articles and blog posts',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['gradient', 'warm', 'blog', 'article'],
  supportedSizes: [
    'twitter-og',
    'facebook-og',
    'linkedin-og',
    'og',
    'discord',
    'github',
    'whatsapp',
    'ig-post'
  ],
  schema: {
    title: { type: 'string', required: true, maxLength: 120 },
    subtitle: { type: 'text' },
    author: { type: 'string' },
    date: { type: 'string' }
  },
  render: () => ({ type: 'div', props: { children: 'sunset' } }) as unknown as JSX.Element,
  preview: './preview.svg'
};

export default template;
