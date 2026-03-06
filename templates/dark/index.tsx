import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'dark',
  name: 'Dark',
  description: 'Dark neon template',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['dark', 'neon', 'saas'],
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
    subtitle: { type: 'text' },
    accent: { type: 'color', default: '#00D2FF' },
    author: { type: 'string' }
  },
  render: () => ({ type: 'div', props: { children: 'dark' } }) as unknown as JSX.Element,
  preview: './preview.svg'
};

export default template;
