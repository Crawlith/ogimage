import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Simple and clean template',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['minimal', 'docs'],
  supportedSizes: [
    'twitter-og',
    'facebook-og',
    'linkedin-og',
    'og',
    'discord',
    'github',
    'whatsapp',
    'ig-post',
    'ig-story'
  ],
  schema: {
    title: { type: 'string', required: true, maxLength: 120 },
    description: { type: 'text' },
    logo: { type: 'image' },
    tag: { type: 'string' },
    theme: { type: 'enum', values: ['light', 'dark'], default: 'light' }
  },
  render: () => ({ type: 'div', props: { children: 'minimal' } }) as unknown as JSX.Element,
  preview: './preview.svg'
};

export default template;
