export interface HomepageItem {
  slug: string;          // "moban3268"
  num: string;           // "3268"
  title: string;         // 메타에서 오거나 slug 기본값
  category: string;      // 메타에서 오거나 "기타"
  tags: string[];
  thumbnail: string | null;   // "/homepage/moban3268/3268.png" 또는 null
  previewUrl: string | null;  // "/homepage/moban3268/index.html" 또는 null
  downloadUrl: string | null; // "/homepage/moban3268/moban3268.zip" 또는 null
}

export interface HomepageMeta {
  slug: string;
  title?: string;
  category?: string;
  tags?: string[];
}

export interface AiUiSource {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  tools: string[];
  difficulty: string;
  image?: string;
  prompt?: string;
  previewUrl?: string;
}
