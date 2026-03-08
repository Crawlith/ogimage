import sunset from '../../../templates/free/sunset';
import minimal from '../../../templates/free/minimal';
import dark from '../../../templates/free/dark';
import glass from '../../../templates/pro/glass';
import editorial from '../../../templates/pro/editorial';
import type { OGTemplate } from '@og-engine/types';

export const templates: OGTemplate<any>[] = [
    sunset,
    minimal,
    dark,
    glass,
    editorial
];

export const getTemplateById = (id: string) => templates.find(t => t.id === id);
