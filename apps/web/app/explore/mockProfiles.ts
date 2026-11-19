import { DEEP_PURPLE, DREAM_PINK, LOGO_BLUE, LOGO_CYAN, STAR_PURPLE } from '@mira/design-tokens';

export const valueQuestions = [
  {
    id: 'weekend',
    prompt: '理想的週末，更接近哪一種節奏？',
    options: [
      { value: 'slow', label: '慢慢醒來，把時間留給喜歡的日常。' },
      { value: 'wander', label: '走去沒去過的地方，讓好奇帶路。' },
      { value: 'gather', label: '和朋友相聚，讓生活熱鬧一些。' },
    ],
  },
  {
    id: 'relationship',
    prompt: '一段舒服的關係，最需要什麼？',
    options: [
      { value: 'honesty', label: '坦白溝通，不用猜測彼此的心意。' },
      { value: 'space', label: '保有自己的空間，也自在分享生活。' },
      { value: 'commitment', label: '願意投入時間，認真經營彼此。' },
    ],
  },
  {
    id: 'difference',
    prompt: '遇到想法不同的時候，你通常會？',
    options: [
      { value: 'listen', label: '先聽聽對方怎麼想，再慢慢找到交集。' },
      { value: 'pause', label: '先給彼此一點時間，整理好再談。' },
      { value: 'talk', label: '把感受說清楚，一起面對問題。' },
    ],
  },
] as const;

export type ValueQuestionId = (typeof valueQuestions)[number]['id'];
export type ValueAnswers = Partial<Record<ValueQuestionId, string>>;

export interface MockProfile {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  auraColor: string;
  accentColor: string;
  portrait: 'short' | 'long' | 'curly' | 'wavy';
  skinColor: string;
  hairColor: string;
  clothingColor: string;
  valueAnswers: Record<ValueQuestionId, string>;
  keywords: string[];
  fragments: string[];
  voiceIntro: string;
  icebreaker: string;
  bio: string;
}

export const mockProfiles: MockProfile[] = [
  {
    id: 'jia-he',
    name: '林嘉禾',
    age: 28,
    occupation: '花藝設計師',
    location: '台北',
    auraColor: DEEP_PURPLE,
    accentColor: DREAM_PINK,
    portrait: 'long',
    skinColor: '#D5A78C',
    hairColor: '#29222D',
    clothingColor: STAR_PURPLE,
    valueAnswers: { weekend: 'slow', relationship: 'honesty', difference: 'listen' },
    keywords: ['花市散步', '手沖咖啡', '老電影', '城市綠意'],
    fragments: [
      '最近在練習把陽台的小羅勒養活，第三次終於沒有被我忘記澆水。',
      '週末喜歡走進市場，買一束不太完美但很有精神的花。',
    ],
    voiceIntro: '嗨，我是嘉禾。平常和花待在一起，也很喜歡找安靜的小店寫手帳。',
    icebreaker: '最近有哪個小小的日常，讓你覺得「今天過得不錯」？',
    bio: '我在台北做花藝設計，喜歡散步時觀察城市裡的植物，也喜歡在忙碌的一週後，替自己留一個沒有行程的下午。期待遇見願意分享生活、也尊重彼此步調的人。',
  },
  {
    id: 'yi-heng',
    name: '周以珩',
    age: 31,
    occupation: '建築師',
    location: '台中',
    auraColor: LOGO_CYAN,
    accentColor: LOGO_BLUE,
    portrait: 'short',
    skinColor: '#C89170',
    hairColor: '#292630',
    clothingColor: LOGO_BLUE,
    valueAnswers: { weekend: 'wander', relationship: 'space', difference: 'talk' },
    keywords: ['老屋觀察', '單車旅行', '爵士樂', '海邊'],
    fragments: [
      '最近在整理一份台中老屋地圖，想找一天騎單車慢慢把它走完。',
      '工作以外最常做的事，是找一首歌重複聽到知道每個轉折。',
    ],
    voiceIntro: '你好，我是以珩。喜歡沿著小路亂走，也喜歡把看到的空間故事記下來。',
    icebreaker: '如果明天多出一個完全自由的午後，你會想去哪裡？',
    bio: '我是一名建築師，平常關心老房子的光線和人怎麼使用一個空間。休假時常騎單車去海邊或巷弄探店。希望關係裡可以坦然交流，也保有各自熱愛的事。',
  },
  {
    id: 'yu-qing',
    name: '許予晴',
    age: 29,
    occupation: '獨立書店企劃',
    location: '台南',
    auraColor: DREAM_PINK,
    accentColor: STAR_PURPLE,
    portrait: 'curly',
    skinColor: '#E1B59B',
    hairColor: '#543B36',
    clothingColor: DREAM_PINK,
    valueAnswers: { weekend: 'gather', relationship: 'commitment', difference: 'pause' },
    keywords: ['詩集', '家常菜', '底片相機', '午後雷陣雨'],
    fragments: [
      '最近在書店辦了一場小小的朗讀會，大家帶來的句子比我預想的還溫柔。',
      '拿手菜是番茄燉飯，食譜每次都會依冰箱剩下的東西改一點。',
    ],
    voiceIntro: '嗨，我是予晴。在書店工作，最近的快樂是讀到一句想和朋友分享的話。',
    icebreaker: '有沒有一本書、一首歌或一道菜，會讓你想到某個重要的人？',
    bio: '我在台南的獨立書店做企劃，喜歡文字、料理和把朋友約到家裡吃飯。相信關係需要用心經營，也需要在情緒很滿的時候，彼此留一點時間好好整理。',
  },
  {
    id: 'zi-qian',
    name: '陳子謙',
    age: 30,
    occupation: '產品設計師',
    location: '高雄',
    auraColor: STAR_PURPLE,
    accentColor: DEEP_PURPLE,
    portrait: 'wavy',
    skinColor: '#D7A181',
    hairColor: '#312925',
    clothingColor: DEEP_PURPLE,
    valueAnswers: { weekend: 'slow', relationship: 'space', difference: 'listen' },
    keywords: ['海港夕陽', '無糖豆漿', '模型', '慢跑'],
    fragments: [
      '最近下班後開始慢跑，目標不是速度，只是想多認識幾條回家的路。',
      '我會做一些很小的模型，桌上那艘船目前還差一面帆。',
    ],
    voiceIntro: '你好，我是子謙。喜歡把複雜的事情慢慢整理，也喜歡海邊不用趕時間的傍晚。',
    icebreaker: '最近你正在慢慢學會、但還不太熟練的是什麼？',
    bio: '我在高雄做產品設計，喜歡把生活裡的小麻煩變得簡單一點。休息時會慢跑、做模型或去港邊吹風。期待一段能自在分享、願意理解彼此，也不急著替生活下結論的關係。',
  },
];

export function calculateCompatibility(profile: MockProfile, answers: ValueAnswers) {
  const answeredCount = valueQuestions.filter((question) => answers[question.id]).length;
  const matchedCount = valueQuestions.filter(
    (question) => answers[question.id] === profile.valueAnswers[question.id],
  ).length;

  return {
    answeredCount,
    matchedCount,
    percentage: Math.round((matchedCount / valueQuestions.length) * 100),
    reached: answeredCount === valueQuestions.length && matchedCount >= 2,
  };
}
