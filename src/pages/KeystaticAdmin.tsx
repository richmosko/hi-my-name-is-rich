import { Keystatic } from '@keystatic/core/ui';
import config from '../../keystatic.config';

export default function KeystaticAdmin() {
  return <Keystatic config={config} />;
}
