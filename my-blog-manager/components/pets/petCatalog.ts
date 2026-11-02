/**
 * 网页宠物层的动画目录。
 * 素材来自 dsh-pet（https://github.com/PC2005-cloud/dsh-pet），
 * 形象授权 CC BY-NC-SA 4.0，禁止商用，公开部署需保留署名。
 * 目前为精简版，后面如果需要更多动画，再考虑扩展；考虑作为一个可选项，从上面这个仓库拉取更多动画。
 * 🤗 I love DeepSeek 💓
 */

export type PetCorner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface PetConfig {
  id: string;
  name: string;
  enabled?: boolean;
  size?: number;
  corner?: PetCorner;
  offsetX?: number;
  offsetY?: number;
  chatEnabled?: boolean;
  whisperEnabled?: boolean;
  whisperIntervalSec?: number;
  todoEnabled?: boolean;
  persona?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PetTodo {
  id: string;
  text: string;
  dueAt: number | null;
  done: boolean;
  reminded?: boolean;
}

/** 精选动画池。文件名即 public/pets/webm 下的素材名（不含扩展名）。 */
export const PET_CATALOG = {
  idle: '待机呼吸休闲',
  turn: '东张西望',
  drag: '被鼠标拖拽悬空反馈',
  clicks: [
    '点击回应-开心跃动',
    '点击回应-害羞惊讶',
    '点击回应-傲娇生气',
    '点击回应-挠痒咯咯笑',
    '点击回应-元气挥手',
  ],
  random: [
    '超大伸懒腰',
    '哈欠连天',
    '原地小憩沉眠',
    '原地专心玩魔方',
    '吃西瓜',
    '写代码',
    '可爱宅舞',
    '撸猫',
  ],
  whisper: [
    '碎碎念-擦桌碎碎念',
    '碎碎念-发呆碎碎念',
    '碎碎念-对屏碎碎念',
  ],
  sleep: {
    start: '睡觉-开始',
    loop: '睡觉-循环',
    end: '睡觉-起来',
  },
  move: ['螃蟹走路'],
} as const;

export const PET_ASSET_BASE = '/pets/webm';

/** 中文文件名需要编码后再交给 video.src。 */
export function petVideoUrl(name: string): string {
  return `${PET_ASSET_BASE}/${encodeURIComponent(name)}.webm`;
}

export function pickOne<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const DEFAULT_PET_PERSONA =
  '你是主人博客网页上的Q版蓝发小女仆，说话自然随意、简短，温柔乖巧带点俏皮。不啰嗦，不解释自己，不要提你是AI。';

export const CLICK_LINES = [
  '呀！被摸头了~',
  '嘿嘿，痒痒的~',
  '主人今天也要开心哦！',
  '再摸一下下也不是不行…',
  '咕噜咕噜~',
];

/** siteConfig 中 petsConfig 的默认值：一只启用的大肥鱼。 */
export const DEFAULT_PETS_CONFIG: PetConfig[] = [
  {
    id: 'whale-1',
    name: '大肥鱼',
    enabled: true,
    size: 220,
    corner: 'bottom-left',
    offsetX: 24,
    offsetY: 16,
    chatEnabled: true,
    whisperEnabled: false,
    whisperIntervalSec: 300,
    todoEnabled: true,
    persona: DEFAULT_PET_PERSONA,
  },
];
