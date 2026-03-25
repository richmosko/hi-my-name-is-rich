import { Keystatic } from '@keystatic/core/ui';
import type { Config } from '@keystatic/core';
import config from '../../keystatic.config';

export default function KeystaticAdmin() {
  return <Keystatic config={config as unknown as Config} />;
}
