/**
 * Public surface of the AI Gateway module (ARCHITECTURE.md §5). Every
 * other backend module must import `aiGateway` from here — never a
 * provider SDK, never `./registry` or `./router/*` directly (CLAUDE.md
 * §8's hard boundary).
 */
export { aiGateway } from './gateway/aiGateway';
export type {
  ClassifyIntentOptions,
  EmbedOptions,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamTextOptions,
} from './gateway/aiGateway';
export { aiConfigService } from './aiConfig.service';
