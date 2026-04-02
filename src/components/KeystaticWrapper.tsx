import { makePage } from '@keystatic/astro/ui';
// @ts-expect-error virtual module provided by @keystatic/astro integration
import config from 'virtual:keystatic-config';

const Keystatic = makePage(config);
export default Keystatic;
